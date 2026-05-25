import { normalizeBooking, ok } from "@/lib/shared/contracts";
import { getBearerUser, jsonError, jsonOk, readProfileRole } from "@/lib/shared/supabaseServer";

function getSelectedSeats(payload, customerDetails) {
  const seats = customerDetails?.selected_seats || payload.selected_seats || [];
  return Array.isArray(seats) ? seats : [];
}

function optionalUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ""))
    ? value
    : null;
}

async function applyInventoryReservation(supabase, booking, selectedSeats, ticketCount, isConfirmed) {
  const showtimeId = booking.showtime_id || booking.customer_details?.showtimeId || null;
  const now = new Date().toISOString();

  if (selectedSeats.length) {
    for (const seat of selectedSeats) {
      const seatNumber = seat.id || seat.seat_id || seat.seat_number || seat.number;
      if (!seatNumber) continue;

      let existingQuery = supabase
        .from("seat_inventory")
        .select("*")
        .eq("event_id", booking.event_id)
        .eq("seat_number", seatNumber);

      existingQuery = showtimeId ? existingQuery.eq("showtime_id", showtimeId) : existingQuery.is("showtime_id", null);
      const { data: existing, error: existingError } = await existingQuery.maybeSingle();
      if (existingError) throw existingError;

      const status = isConfirmed ? "sold" : "reserved";
      const reservedUntil = isConfirmed ? null : new Date(Date.now() + 10 * 60 * 1000).toISOString();

      if (existing) {
        if (
          ["sold", "booked", "blocked", "maintenance"].includes(existing.status) ||
          (!isConfirmed && existing.status === "reserved" && existing.locked_by !== booking.user_id)
        ) {
          throw new Error(`Seat ${seatNumber} is no longer available`);
        }

        const { error } = await supabase
          .from("seat_inventory")
          .update({
            status,
            locked_by: isConfirmed ? null : booking.user_id,
            lock_expires_at: reservedUntil,
            reserved_until: reservedUntil,
            updated_at: now
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("seat_inventory").insert({
          event_id: booking.event_id,
          showtime_id: showtimeId,
          seat_number: seatNumber,
          status,
          locked_by: isConfirmed ? null : booking.user_id,
          lock_expires_at: reservedUntil,
          reserved_until: reservedUntil,
          updated_at: now
        });
        if (error) throw error;
      }
    }
    return;
  }

  const { data: inventory } = await supabase
    .from("general_inventory")
    .select("*")
    .eq("event_id", booking.event_id)
    .eq(showtimeId ? "showtime_id" : "event_id", showtimeId || booking.event_id)
    .limit(1)
    .maybeSingle();

  if (!inventory) return;

  const nextReserved = Math.max(0, Number(inventory.reserved_count || 0) + (isConfirmed ? 0 : Number(ticketCount || 1)));
  const nextSold = Math.max(0, Number(inventory.sold_count || 0) + (isConfirmed ? Number(ticketCount || 1) : 0));
  const nextRemaining = Math.max(0, Number(inventory.total_capacity || inventory.remaining_count || 0) - nextSold - nextReserved);

  await supabase
    .from("general_inventory")
    .update({
      sold_count: nextSold,
      reserved_count: nextReserved,
      remaining_count: nextRemaining,
      updated_at: now
    })
    .eq("id", inventory.id);
}

export async function GET(request) {
  const { supabase, user, error } = await getBearerUser(request);
  if (error) return error;

  try {
    const role = await readProfileRole(supabase, user.id);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id") || user.id;
    
    console.log(`[API/BOOKINGS] Fetch triggered. User ID: ${user.id}, Email: ${user.email}, Role: ${role}, Client: ${request.headers.get('user-agent')}`);
    const eventId = searchParams.get("event_id");

    let query = supabase
      .from("bookings")
      .select("*, events(*), tickets(*)")
      .order("created_at", { ascending: false });

    if (role === "admin") {
      if (userId !== "all") query = query.eq("user_id", userId);
    } else if (role === "organiser" || role === "organizer") {
      query = query.or(`user_id.eq.${user.id},organiser_id.eq.${user.id}`);
    } else {
      query = query.eq("user_id", user.id);
    }

    if (eventId) query = query.eq("event_id", eventId);

    const { data, error: queryError } = await query;
    if (queryError) throw queryError;

    return jsonOk(ok((data || []).map(normalizeBooking), { resource: "bookings" }));
  } catch (err) {
    console.error("[api/v1/bookings] failed:", err);
    return jsonError(err.message || "Unable to load bookings");
  }
}

export async function POST(request) {
  const { supabase, user, error } = await getBearerUser(request);
  if (error) return error;

  try {
    const body = await request.json();
    const payload = body.booking || body;
    const eventId = payload.eventId || payload.event_id;
    const ticketCount = Number(payload.ticketCount || payload.ticket_count || payload.quantity || 1);
    const totalPrice = payload.totalPrice ?? payload.total_price;
    const customerDetails = payload.customerDetails || payload.customer_details || {};

    // Strip out properties that don't belong in the bookings table
    const { booking_status, event_name, location, ...cleanPayload } = payload;

    if (!eventId || !ticketCount || totalPrice == null) {
      return jsonError("event_id, ticket_count and total_price are required", 400, "booking_payload_invalid");
    }

    const { data: eventRow, error: eventError } = await supabase
      .from("events")
      .select("id,title,location,organiser_id")
      .eq("id", String(eventId))
      .maybeSingle();
    if (eventError) throw eventError;
    if (!eventRow) return jsonError("Event not found", 404, "event_not_found");

    const isConfirmed = Number(totalPrice) === 0 || payload.status === "Confirmed";
    const selectedSeats = getSelectedSeats(payload, customerDetails);
    const now = new Date().toISOString();

    const bookingInsert = {
      ...cleanPayload,
      event_id: String(eventId),
      user_id: user.id,
      organiser_id: payload.organiser_id || eventRow.organiser_id || null,
      ticket_count: ticketCount,
      base_amount: Number(payload.base_amount ?? totalPrice),
      platform_charge: Number(payload.platform_charge || 0),
      gst_amount: Number(payload.gst_amount || 0),
      gst_percent: Number(payload.gst_percent || 0),
      partner_bonus: Number(payload.partner_bonus || 0),
      platform_revenue: Number(payload.platform_revenue || 0),
      partner_total: Number(payload.partner_total ?? payload.base_amount ?? totalPrice),
      discount_amount: Number(payload.discount_amount || 0),
      total_price: Number(totalPrice),
      status: isConfirmed ? "Confirmed" : "Pending",
      payment_status: isConfirmed ? "paid" : "pending",
      scanned: false,
      selected_seats: selectedSeats,
      showtime_id: payload.showtime_id || customerDetails.showtimeId || null,
      customer_details: customerDetails,
      updated_at: now
    };

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert([bookingInsert])
      .select("*, events(*), tickets(*)")
      .single();
    if (bookingError) throw bookingError;

    const bookingRef = String(booking.id).slice(-8).toUpperCase();
    await supabase.from("bookings").update({ booking_ref: bookingRef }).eq("id", booking.id);

    const { error: itemError } = await supabase.from("booking_items").insert({
      booking_id: booking.id,
      seat_id: selectedSeats.map((seat) => seat.id || seat.seat_number).filter(Boolean).join(",") || null,
      ticket_category_id: optionalUuid(payload.ticket_category_id || customerDetails.category_id),
      qty: ticketCount,
      unit_price: ticketCount ? Number(payload.base_amount ?? totalPrice) / ticketCount : Number(totalPrice)
    });
    if (itemError) throw itemError;

    await applyInventoryReservation(supabase, { ...booking, booking_ref: bookingRef }, selectedSeats, ticketCount, isConfirmed);

    // Queue booking confirmation notification
    if (isConfirmed) {
      await supabase.from("notification_queue").insert({
        user_id: user.id,
        channel: "email",
        event_type: "booking_confirmation",
        payload: {
          to: user.email,
          user_id: user.id,
          customer_name: customerDetails.name || user.user_metadata?.full_name || "Guest",
          event_name: payload.event_name || eventRow.title || eventRow.name || "Event",
          booking_reference: bookingRef,
          ticket_count: ticketCount,
          event_date: eventRow.date || eventRow.start_date || "TBD",
          event_time: eventRow.time || eventRow.start_time || "TBD",
          venue_name: eventRow.venue || payload.location || "TBD",
          venue_address: eventRow.address || "TBD",
          seat_numbers: selectedSeats.map(s => s.id || s.seat_number).join(", ") || "N/A",
          ticket_type: payload.ticket_category_name || "General Admission",
          payment_amount: totalPrice,
          invoice_number: `INV-${bookingRef}`,
          ticket_download_url: `${process.env.NEXT_PUBLIC_BASE_URL}/tickets/${booking.id}`,
          qr_ticket_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/tickets/${booking.id}/qr`,
          support_email: "support@bookmyticket.net"
        }
      });
    }

    return jsonOk(ok(normalizeBooking({ ...booking, booking_ref: bookingRef }), { resource: "booking" }), { status: 201 });
  } catch (err) {
    console.error("[api/v1/bookings:POST] failed:", err);
    return jsonError(err.message || "Unable to create booking");
  }
}
