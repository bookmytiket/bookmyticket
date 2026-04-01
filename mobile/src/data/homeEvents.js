export const HOME_EVENTS = [
  {
    id: "virtual-1",
    title: "Mastering React Native: Online Workshop",
    img: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80",
    date: "2026-06-15",
    time: "10:00 AM",
    location: "Online (Zoom)",
    type: "Virtual",
    price: 499,
    category: "Workshop",
    featured: true,
    trending: true,
    virtual: true
  }
];

export const HERO_BANNER_SLIDES = [
  { id: 1, img: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=1200&h=480&fit=crop', title: 'Live Events & Experiences', sub: 'Book tickets for concerts, sports & more' },
  { id: 2, img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=480&fit=crop', title: 'Live Concerts', sub: 'Book your favourite artists' },
  { id: 3, img: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200&h=480&fit=crop', title: 'Sports & Marathons', sub: 'Events near you' },
];

export const BRAND_COUPONS = [
  {
      _id: "nykaa",
      logoUrl: "https://nykaa.com/favicon.ico",
      brandName: "Nykaa",
      title: "Get ₹250 Off on Nykaa Beauty Products!",
      description: "From bold lipsticks to skin-loving serums, discover your new favorites...",
      endDate: Date.now() + (69 * 24 * 60 * 60 * 1000),
      bannerUrl: "/coupons/nykaa_beauty_deal_1774253312733.png",
      discountType: "Percentage",
      discountValue: 250,
      redemptionMethod: "Online"
  },
  {
      _id: "amazon",
      logoUrl: "https://amazon.com/favicon.ico",
      brandName: "Amazon",
      title: "Up to 50% Off on Premium Electronics",
      description: "Upgrade your tech with the latest headphones, tablets and more.",
      endDate: Date.now() + (15 * 24 * 60 * 60 * 1000),
      bannerUrl: "/coupons/amazon_tech_deal_1774253329075.png",
      discountType: "Percentage",
      discountValue: 50,
      redemptionMethod: "Online"
  },
  {
      _id: "myntra",
      logoUrl: "https://myntra.com/favicon.ico",
      brandName: "Myntra",
      title: "Flat 40% Off on Summer Collections",
      description: "Trendy fashion and accessories to get you ready for the heat!",
      endDate: Date.now() + (30 * 24 * 60 * 60 * 1000),
      bannerUrl: "/coupons/myntra_fashion_deal_image_1774253345705.png",
      discountType: "Percentage",
      discountValue: 40,
      redemptionMethod: "Online"
  }
];
