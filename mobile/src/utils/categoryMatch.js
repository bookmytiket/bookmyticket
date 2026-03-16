function toSlug(str) {
  return String(str || '').toLowerCase().trim().replace(/\s+/g, '-');
}

export function eventMatchesCategory(event, category) {
  const evCat = String(event?.category ?? '').trim().toLowerCase();
  const evSlug = toSlug(event?.category);
  const catName = String(category?.name ?? '').toLowerCase();
  const catSlug = String(category?.slug ?? toSlug(category?.name)).toLowerCase();
  if (!evCat) return false;
  if (evCat === catName || evSlug === catSlug) return true;
  if (evSlug.startsWith(catSlug + '-') || evSlug.endsWith('-' + catSlug)) return true;
  if (catName.length >= 2 && evCat.includes(catName)) return true;
  if (catSlug.length >= 2 && evSlug.includes(catSlug)) return true;
  if (evCat.replace(/s$/, '') === catName || evSlug.replace(/s$/, '') === catSlug) return true;
  return false;
}
