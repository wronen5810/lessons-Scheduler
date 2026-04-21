export function toSlug(name: string): string {
  const base = name.includes('@') ? name.split('@')[0] : name;
  return base
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // strip accent marks
    .replace(/[._]/g, ' ')            // dots/underscores → spaces (email local-parts)
    .replace(/[^a-z0-9 -]/g, '')      // only letters, digits, spaces, hyphens
    .trim()
    .replace(/\s+/g, '-');            // spaces → hyphens
}
