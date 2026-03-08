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

// Single list of events; sections filter by flags. Card: id, title, img, date, location, type (Paid/Free), category, featured, trending, exclusive, virtual, spotlight
export const HOME_EVENTS = [
  { id: 1, title: "Kaber Vasuki - Frangipani Tour 2026", date: "Apr 25, 2026", location: "Coimbatore, Tamil Nadu, India", type: "Paid", category: "Concert", img: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&h=280&fit=crop", featured: true, trending: true, exclusive: false, virtual: false, spotlight: true },
  { id: 2, title: "Top Model Of Tamil Nadu 2026", date: "Apr 5, 2026", location: "Coimbatore, Tamil Nadu, India", type: "Paid", category: "Competition", img: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=500&h=280&fit=crop", featured: true, trending: true, exclusive: false, virtual: false, spotlight: false },
  { id: 3, title: "Ani Vs U1 A Singalong By Strums N Beats", date: "Mar 14, 2026", location: "Coimbatore, Tamil Nadu, India", type: "Paid", category: "Musics", img: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&h=280&fit=crop", featured: true, trending: true, exclusive: true, virtual: false, spotlight: false },
  { id: 4, title: "Saree, These Are Just Jokes!", date: "Mar 13, 2026", location: "Coimbatore, Tamil Nadu, India", type: "Paid", category: "Comedy Show", img: "https://images.unsplash.com/photo-1585699324551-f6f0e9a120eb?w=500&h=280&fit=crop", featured: true, trending: true, exclusive: false, virtual: false, spotlight: false },
  { id: 5, title: "AORA - GARC 2026", date: "Jul 16, 2026", location: "Coimbatore, Tamil Nadu, India", type: "Paid", category: "Conference", img: "https://images.unsplash.com/photo-1540575861501-7ad058c647a0?w=500&h=280&fit=crop", featured: true, trending: false, exclusive: true, virtual: false, spotlight: false },
  { id: 6, title: "Bharathanatyam Recital By Harinie Jeevitha", date: "Mar 28, 2026", location: "Coimbatore, Tamil Nadu, India", type: "Paid", category: "Classical Dance", img: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=500&h=280&fit=crop", featured: false, trending: true, exclusive: false, virtual: false, spotlight: true },
  { id: 7, title: "Flames - A Tamil Sing Along Event", date: "Mar 15, 2026", location: "Coimbatore, Tamil Nadu, India", type: "Paid", category: "Live Shows", img: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=280&fit=crop", featured: false, trending: true, exclusive: false, virtual: false, spotlight: false },
  { id: 8, title: "Thadam 360 - Education Expo & Job Fair 2026", date: "Mar 27, 2026", location: "Coimbatore, Tamil Nadu, India", type: "Free", category: "Exhibition", img: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&h=280&fit=crop", featured: false, trending: false, exclusive: true, virtual: false, spotlight: false },
  { id: 9, title: "Coimbatore Kidz Run", date: "Mar 8, 2026", location: "Decathlon Sports, Coimbatore", type: "Paid", category: "Marathon", img: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=500&h=280&fit=crop", featured: true, trending: true, exclusive: false, virtual: false, spotlight: true },
  { id: 10, title: "Every Founder Must Know These 10 Business Contracts", date: "Mar 21, 2026", location: "Online", type: "Free", category: "Conference", img: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=500&h=280&fit=crop", featured: false, trending: false, exclusive: false, virtual: true, spotlight: false },
  { id: 11, title: "Financial Wellness Workshop", date: "Mar 6, 2026", location: "Online", type: "Free", category: "Conference", img: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=500&h=280&fit=crop", featured: false, trending: false, exclusive: false, virtual: true, spotlight: false },
  { id: 12, title: "Colours Of Wildlife - Budding Artist Award Mar 2026", date: "Mar 1, 2026", location: "Online", type: "Paid", category: "Exhibition", img: "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=500&h=280&fit=crop", featured: false, trending: false, exclusive: false, virtual: true, spotlight: false },
  { id: 13, title: "Digital Raaga - Online Singing Contest", date: "Feb 28, 2026", location: "Online", type: "Paid", category: "Musics", img: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&h=280&fit=crop", featured: false, trending: false, exclusive: false, virtual: true, spotlight: false },
  { id: 14, title: "Holi Blast 2026", date: "Mar 8, 2026", location: "Coimbatore, Tamil Nadu, India", type: "Paid", category: "Others", img: "https://images.unsplash.com/photo-1605640840605-14ac1855827b?w=500&h=280&fit=crop", featured: true, trending: true, exclusive: false, virtual: false, spotlight: false },
  { id: 15, title: "Women's Day Marathon 2026", date: "Mar 8, 2026", location: "Coimbatore, Tamil Nadu, India", type: "Paid", category: "Marathon", img: "https://images.unsplash.com/photo-1452626038303-9dae5c870eb7?w=500&h=280&fit=crop", featured: true, trending: false, exclusive: false, virtual: false, spotlight: false },
  {
    id: 16,
    title: "The Grand Coimbatore Music Festival 2026",
    date: "May 15, 2026",
    time: "06:00 PM",
    venue: "Codissia Amphitheatre",
    location: "Codissia Trade Fair Complex, GV Residency, Coimbatore",
    city: "Coimbatore",
    address: "Avinashi Road, Civil Aerodrome Post, Coimbatore, Tamil Nadu 641014",
    type: "Paid",
    price: "499",
    category: "Concert",
    img: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1000&h=600&fit=crop",
    featured: true,
    trending: true,
    exclusive: true,
    virtual: false,
    spotlight: false,
    ageLimit: "6+ Years",
    language: "Tamil, English, Hindi",
    description: "Experience the biggest music festival in Coimbatore with top artists performing live under the stars. Enjoy a night of rhythm, lights, and food.",
    features: [
      { icon: '🛡️', label: 'CCTV Surveillance & Security' },
      { icon: '🪑', label: 'Premium Seating Available' },
      { icon: '🚗', label: 'Ample Parking Space' },
      { icon: '🍽️', label: 'Multi-cuisine Food Stall' },
    ],
    parking: "Free Parking is available for all ticket holders at the main Codissia parking lot.",
    refundPolicy: [
      "No refund once tickets are booked.",
      "In case of event cancellation, a full refund will be processed within 7-10 working days.",
      "Resale of tickets is strictly prohibited."
    ],
    tags: ["Concert", "Music Festival", "Live Event", "Coimbatore Events"]
  },
];

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
