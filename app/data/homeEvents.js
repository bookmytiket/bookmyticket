// External client advertisements — same format & size as Spotlight banner, auto-scroll 3s
export const EXTERNAL_CLIENT_ADS = [
  { id: 1, img: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=400&fit=crop", alt: "Live concert event", title: "Live Concerts", link: "/events" },
  { id: 2, img: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200&h=400&fit=crop", alt: "Sports & marathon", title: "Sports & Marathons", link: "/events?category=Sports" },
  { id: 3, img: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&h=400&fit=crop", alt: "Comedy & live shows", title: "Comedy & Live Shows", link: "/events?category=Comedy" },
  { id: 4, img: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&h=400&fit=crop", alt: "Festival experience", title: "Festivals & More", link: "/events" },
];

// Banner slides for image-based hero carousel (above video). First slide uses admin panel banner image.
export const HERO_BANNER_SLIDES = [
  { id: 1, img: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=1200&h=480&fit=crop", title: "Live Events & Experiences", sub: "Book tickets for concerts, sports & more" },
  { id: 2, img: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=480&fit=crop", title: "Live Concerts", sub: "Book your favourite artists" },
  { id: 3, img: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200&h=480&fit=crop", title: "Sports & Marathons", sub: "Events near you" },
  { id: 4, img: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&h=480&fit=crop", title: "Comedy & Live Shows", sub: "Laugh out loud" },
  { id: 5, img: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&h=480&fit=crop", title: "Festivals & More", sub: "Discover experiences" },
];

/// Single list of events; sections filter by flags. Card: id, title, img, date, location, type (Paid/Free), category, featured, trending, exclusive, virtual, spotlight
export const HOME_EVENTS = [];

export const MEMORIES = [
  { id: 1, img: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop", alt: "Concert Night" },
  { id: 2, img: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&h=300&fit=crop", alt: "Marathon 2025" },
  { id: 3, img: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=300&fit=crop", alt: "Live Music" },
  { id: 4, img: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=300&fit=crop", alt: "Festival" },
  { id: 5, img: "https://images.unsplash.com/photo-1585699324551-f6f0e9a120eb?w=400&h=300&fit=crop", alt: "Comedy Show" },
];

export const FEATURED_ORGANISERS = [
  { id: 1, name: "BookMyShow LIVE", logo: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=120&h=120&fit=crop", eventCount: 12 },
  { id: 2, name: "Medai Coimbatore", logo: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=120&h=120&fit=crop", eventCount: 5 },
  { id: 3, name: "Unherd Music Community", logo: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&h=120&fit=crop", eventCount: 3 },
  { id: 4, name: "LEA360 Community", logo: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=120&h=120&fit=crop", eventCount: 2 },
];
