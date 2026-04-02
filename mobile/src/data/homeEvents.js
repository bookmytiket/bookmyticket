// External client advertisements
export const EXTERNAL_CLIENT_ADS = [
  { id: 1, img: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=400&fit=crop", alt: "Live concert event", title: "Live Concerts", link: "Events" },
  { id: 2, img: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200&h=400&fit=crop", alt: "Sports & marathon", title: "Sports & Marathons", link: "Events" },
  { id: 3, img: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&h=400&fit=crop", alt: "Comedy & live shows", title: "Comedy & Live Shows", link: "Events" },
  { id: 4, img: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&h=400&fit=crop", alt: "Festival experience", title: "Festivals & More", link: "Events" },
];

// Banner slides for image-based hero carousel
export const HERO_BANNER_SLIDES = [
  { id: 1, img: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=1200&h=480&fit=crop", title: "Live Events & Experiences", sub: "Book tickets for concerts, sports & more" },
  { id: 2, img: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=480&fit=crop", title: "Live Concerts", sub: "Book your favourite artists" },
  { id: 3, img: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200&h=480&fit=crop", title: "Sports & Marathons", sub: "Events near you" },
  { id: 4, img: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&h=480&fit=crop", title: "Comedy & Live Shows", sub: "Laugh out loud" },
  { id: 5, img: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&h=480&fit=crop", title: "Festivals & More", sub: "Discover experiences" },
];

export const HOME_EVENTS = [];

export const BRAND_COUPONS = [
  {
      _id: "nykaa",
      logoUrl: "https://nykaa.com/favicon.ico",
      brandName: "Nykaa",
      title: "Get ₹250 Off on Nykaa Beauty Products!",
      description: "From bold lipsticks to skin-loving serums, discover your new favorites...",
      endDate: Date.now() + (69 * 24 * 60 * 60 * 1000), 
      bannerUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc4033c8?w=800",
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
      bannerUrl: "https://images.unsplash.com/photo-1526733170375-bc8147d7ed7c?w=800",
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
      bannerUrl: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800",
      discountType: "Percentage",
      discountValue: 40,
      redemptionMethod: "Online"
  }
];
