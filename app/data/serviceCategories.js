export const SERVICE_CATEGORIES = [
  "Mehendi Artist",
  "Photographer/Studio",
  "Makeup Artist",
  "Turf Booking",
  "Swimming Pool"
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
         c.includes("pool") || 
         c.includes("personal service");
};
