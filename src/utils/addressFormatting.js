export function formatStreetAddress(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}
