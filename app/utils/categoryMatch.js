/**
 * Normalize event category for matching: lowercase, trim, slug (spaces -> hyphens).
 * Used so Admin Total Events and Home Page category filter stay in sync with
 * event data (e.g. "Comedy Show" matches "Comedy", "Musics" matches "Music").
 */
function toSlug(str) {
  return String(str || "").toLowerCase().trim().replace(/\s+/g, "-");
}

/**
 * Returns true if an event's category matches the given category (name/slug).
 * Handles: exact match, slug match, "Comedy Show" -> Comedy, "Musics" -> Music.
 */
export function eventMatchesCategory(event, category) {
  const evCat = String(event?.category ?? "").trim().toLowerCase();
  const evType = String(event?.type ?? "").trim().toLowerCase();
  const evSlug = toSlug(event?.category);
  const evTypeSlug = toSlug(event?.type);
  const catName = String(category?.name ?? "").toLowerCase();
  const catSlug = String(category?.slug ?? toSlug(category?.name)).toLowerCase();

  if (!evCat && !evType) return false;

  // Check category matches
  if (evCat === catName || evSlug === catSlug) return true;
  if (evSlug.startsWith(catSlug + "-") || evSlug.endsWith("-" + catSlug)) return true;
  if (catName.length >= 2 && evCat.includes(catName)) return true;
  if (catSlug.length >= 2 && evSlug.includes(catSlug)) return true;

  // Check type matches (Crucial for Sports events)
  if (evType === catName || evTypeSlug === catSlug) return true;
  if (catName.length >= 2 && evType.includes(catName)) return true;

  if (evCat.replace(/s$/, "") === catName || evSlug.replace(/s$/, "") === catSlug) return true;
  return false;
}
