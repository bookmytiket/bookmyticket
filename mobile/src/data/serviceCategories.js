export const SERVICE_CATEGORIES = [
  {
    id: "mehendi",
    name: "Mehendi Artist",
    icon: "brush",
    image: "https://images.unsplash.com/photo-1590424753042-7e923e3e0986?w=800&q=80",
    gradient: ['#8B5CF6', '#A78BFA'],
    description: "Traditional and modern henna art"
  },
  {
    id: "photo",
    name: "Photographer/Studio",
    icon: "camera",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80",
    gradient: ['#3B82F6', '#60A5FA'],
    description: "Professional photography & studio"
  },
  {
    id: "makeup",
    name: "Makeup Artist",
    icon: "color-palette",
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80",
    gradient: ['#EC4899', '#F472B6'],
    description: "Bridal and occasion makeup"
  },
  {
    id: "turf",
    name: "Turf Booking",
    icon: "football",
    image: "https://images.unsplash.com/photo-1529900948632-5a67411b86c1?w=800&q=80",
    gradient: ['#10B981', '#34D399'],
    description: "Football, cricket & sports turfs"
  },
  {
    id: "other",
    name: "Other",
    icon: "ellipsis-horizontal",
    image: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&q=80",
    gradient: ['#64748B', '#94A3B8'],
    description: "Other professional services"
  }
];

export const isServiceProvider = (category) => {
  if (!category) return false;
  const c = String(category).trim().toLowerCase();
  return c.includes("mehandi") || 
         c.includes("mehendi") || 
         c.includes("photograph") || 
         c.includes("makeup") || 
         c.includes("artist") || 
         c.includes("turf") || 
         c.includes("personal service") ||
         c.includes("organiser");
};
