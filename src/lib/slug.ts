export function toSlug(name: string): string {
  const base = name.includes('@') ? name.split('@')[0] : name;
  return base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // strip Latin accent marks
    .replace(/[\u05b0-\u05c7]/g, '')  // strip Hebrew niqqud / vowel marks
    .replace(/[._]/g, ' ')            // dots/underscores → spaces (email local-parts)
    .toLowerCase()
    // Keep: Latin a-z, digits 0-9, Hebrew letters U+05D0–U+05EA, spaces, hyphens
    .replace(/[^a-z0-9\u05d0-\u05ea -]/g, '')
    .trim()
    .replace(/\s+/g, '-');            // spaces → hyphens
}
