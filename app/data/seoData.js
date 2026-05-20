export const seoData = {
  metaTitle: "BookMyTicket | Online Event Ticket Booking Platform | Concert, Marathon & Event Tickets",
  metaDescription: "BookMyTicket is a secure online event ticket booking platform for concerts, marathons, sports events, workshops, exhibitions, festivals, and local events. Get instant booking confirmation, QR tickets, secure payments, and organizer event management.",
  homepageH1: "Book Event Tickets Online Instantly with BookMyTicket",
  tagline: "Book Events Near You Instantly – Secure Online Ticket Booking with QR Passes",

  primaryKeywords: [
    "online event ticket booking",
    "event booking app",
    "book event tickets online",
    "ticket booking website",
    "secure ticket booking",
    "instant QR ticket booking",
    "digital ticket booking platform",
    "event registration platform",
    "online booking app",
    "ticket booking platform india"
  ],

  humanSearchKeywords: [
    "book event tickets near me",
    "best ticket booking app",
    "concert tickets near me",
    "marathon registration online",
    "sports event booking",
    "festival ticket booking",
    "local events near me",
    "safe ticket booking website",
    "instant ticket booking",
    "event booking website"
  ],

  organizerKeywords: [
    "event management platform",
    "event ticketing software",
    "event registration software",
    "ticket booking solution for organizers",
    "QR ticket management system",
    "white label ticket booking platform",
    "event organizer dashboard",
    "event analytics platform"
  ],

  geoKeywords: [
    "event ticket booking india",
    "ticket booking app india",
    "concert ticket booking india",
    "marathon registration india",
    "events in coimbatore",
    "events in chennai",
    "event booking tamil nadu"
  ],

  faqKeywords: [
    "How to book event tickets online",
    "Where can I book concert tickets",
    "How to register for marathon online",
    "Best event booking app in India",
    "Safe ticket booking website",
    "How to get QR event tickets"
  ],

  seoUrls: [
    "/concert-ticket-booking",
    "/marathon-registration",
    "/sports-event-booking",
    "/festival-ticket-booking",
    "/local-events-near-me",
    "/event-ticket-booking-india",
    "/events-in-coimbatore",
    "/events-in-chennai"
  ],

  schemaKeywords: [
    "Event",
    "Organization",
    "WebSite",
    "FAQ",
    "LocalBusiness",
    "Breadcrumb",
    "Product",
    "Offer",
    "Ticket"
  ],

  // Convenience helper to get a flat array of all keyword strings for meta tags
  getAllKeywords: function() {
    return [
      ...this.primaryKeywords,
      ...this.humanSearchKeywords,
      ...this.organizerKeywords,
      ...this.geoKeywords,
      ...this.schemaKeywords
    ];
  }
};
