export const SERVICE_CATEGORIES = [
  "Event Organiser",
  "Mehendi Artist",
  "Photographer/Studio",
  "Makeup Artist"
];

export const isServiceProvider = (category) => {
  if (!category) return false;
  const c = String(category).trim().toLowerCase();
  return c.includes("mehandi") || 
         c.includes("mehendi") || 
         c.includes("photograph") || 
         c.includes("makeup") || 
         c.includes("artist") || 
         c.includes("personal service");
};
