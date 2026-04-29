"use client";

/**
 * BookingDisclaimer
 * Reusable disclaimer block shown on all booking/checkout pages.
 * type="event"   → Event Organiser disclaimer
 * type="service" → Service Provider disclaimer
 */
export default function BookingDisclaimer({ type = "event" }) {
  const isService = type === "service";

  return (
    <div
      style={{
        marginTop: "24px",
        padding: "18px 22px",
        borderRadius: "14px",
        border: "1.5px solid #fecaca",
        background: "#fff5f5",
        borderLeft: "4px solid #dc2626",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: "13px",
          fontWeight: 700,
          fontStyle: "italic",
          color: "#cc0000",
          lineHeight: "1.75",
        }}
      >
        <span style={{ display: "block", marginBottom: "6px", fontSize: "14px" }}>
          Disclaimer:
        </span>
        {isService ? (
          <>
            BookMyTicket is a service discovery platform assisting{" "}
            <strong>Service Providers</strong> with bookings only. BookMyTicket
            is not responsible for service delivery, postponement, cancellation,
            or refunds. All such decisions and refund processing rest solely
            with the <strong>Service Provider</strong>.
          </>
        ) : (
          <>
            BookMyTicket is a ticketing platform assisting the{" "}
            <strong>Event Organiser</strong> with event registrations only.
            BookMyTicket is not responsible for event operations, postponement,
            cancellation, or refunds. All such decisions and refund processing
            rest solely with the <strong>Event Organiser</strong>.
          </>
        )}
      </p>
    </div>
  );
}
