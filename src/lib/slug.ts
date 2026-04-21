export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // strip accent marks
    .replace(/[^a-z0-9 -]/g, '')      // only letters, digits, spaces, hyphens
    .trim()
    .replace(/\s+/g, '-');            // spaces → hyphens
}
