export async function fetchPublicEvents(supabase, filters = {}) {
  const { district, city, type, featured } = filters;

  let query = supabase
    .from("events")
    .select("*")
    .or("publish_status.eq.published,status.eq.published")
    .eq("visibility_status", "public")
    .eq("approval_status", "approved")
    .eq("listing_status", "active")
    .eq("entity_type", "event");

  if (district && district !== "All" && district !== "India") {
    query = query.ilike("district", `%${district}%`);
  } else if (city && city !== "All Cities" && city !== "India") {
    query = query.ilike("city", `%${city}%`);
  }

  if (type) query = query.eq("type", type);
  if (featured) query = query.or("featured.eq.true,is_spotlight.eq.true,is_exclusive.eq.true");

  const { data: events, error } = await query.order("updated_at", { ascending: false });
  if (error) throw error;
  if (!events?.length) return [];

  const organiserEvents = events.filter((event) => event.entity_type !== "service" && event.entity_type !== "vendor");
  const eventIds = organiserEvents.map((event) => event.id);

  const [tournamentsRes, marathonsRes, categoriesRes, showtimesRes] = await Promise.all([
    supabase.from("tournament_events").select("*").in("event_id", eventIds),
    supabase.from("marathon_config").select("*").in("event_id", eventIds),
    supabase.from("tournament_categories").select("*").in("event_id", eventIds),
    supabase.from("event_showtimes").select("*").in("event_id", eventIds).order("start_at", { ascending: true })
  ]);

  const tournaments = tournamentsRes.data || [];
  const marathons = marathonsRes.data || [];
  const categories = categoriesRes.data || [];
  const showtimes = showtimesRes.data || [];

  return organiserEvents.map((event) => {
    const tournament = tournaments.find((item) => item.event_id === event.id || item.id === event.id) || null;
    const marathon = marathons.find((item) => item.event_id === event.id || item.id === event.id) || null;
    const tournamentCategories = categories.filter((item) => item.event_id === event.id);
    const eventShowtimes = showtimes.filter((item) => item.event_id === event.id);
    const dynamicConfig = safeJson(event.dynamic_config) || {};

    let price = Number(event.price || 0);
    if (tournamentCategories.length) {
      price = Math.min(...tournamentCategories.map((item) => Number(item.category_fee) || 0));
    } else if (tournament?.registration_fee) {
      price = Number(tournament.registration_fee);
    } else if (dynamicConfig.marathonCategories?.length) {
      price = Math.min(...dynamicConfig.marathonCategories.map((item) => Number(item.price) || 0));
    }

    return {
      ...event,
      img: tournament?.banner_image || marathon?.banner_image || event.img || event.image_url,
      price,
      venue: tournament?.venue || marathon?.venue || event.venue || event.location,
      city: event.city || tournament?.city || marathon?.city,
      district: event.district || tournament?.district || marathon?.district,
      category: event.category || dynamicConfig.basicInfo?.category,
      tournament_data: tournament ? { ...tournament, categories: tournamentCategories } : null,
      marathon_data: marathon,
      showtimes: eventShowtimes,
      sync_version: event.updated_at || event.created_at
    };
  });
}

export async function fetchEventDetail(supabase, id) {
  const { data: event, error } = await supabase
    .from("events")
    .select(`
      *, 
      tournament_events!event_id(*), 
      marathon_config!event_id(*), 
      tournament_categories!event_id(*), 
      event_showtimes(*),
      event_ticket_categories(*),
      ticket_categories(*)
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!event) return null;

  // Fetch V2 marathon tables separately to avoid FK issues
  const [marathonV2, marathonCats, marathonSponsors, marathonBenefits] = await Promise.all([
    supabase.from("marathon_events").select("*").eq("id", id).maybeSingle(),
    supabase.from("marathon_categories").select("*").or(`marathon_id.eq.${id},event_id.eq.${id}`).order('distance_km'),
    supabase.from("marathon_sponsors").select("*").eq("marathon_id", id).order('rank_order'),
    supabase.from("marathon_benefits").select("*").eq("marathon_id", id)
  ]);

  if (marathonV2.data) {
    event.marathon_events = [marathonV2.data];
  }
  event.marathon_categories = marathonCats.data || [];
  event.marathon_sponsors = marathonSponsors.data || [];
  event.marathon_benefits = marathonBenefits.data || [];

  return event;
}

function safeJson(value) {
  if (!value) return null;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
