/**
 * Utility functions for learner name formatting and enterprise work email generation.
 * Follows DynamicDNA strict proper-casing and domain standards:
 * - Proper Case for all names (e.g., 'zwavhudi' -> 'Zwavhudi', 'tshivhase' -> 'Tshivhase')
 * - Auto-generated, read-only, unique work email format: FirstName.LastName@dynamicdna.co.za
 */

/**
 * Converts a string to Proper Case (Title Case).
 * Handles multiple names, hyphens, and whitespace cleanly.
 * Example: 'zwavhudi' -> 'Zwavhudi', 'tshivhase' -> 'Tshivhase', 'mulalo ramabulana' -> 'Mulalo Ramabulana'
 */
export function toProperCase(str: string): string {
  if (!str) return '';
  return str
    .trim()
    .split(/\s+/)
    .map((word) =>
      word
        .split('-')
        .map((part) => {
          if (!part) return '';
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        })
        .join('-')
    )
    .join(' ');
}

/**
 * Strips non-alphanumeric characters while preserving casing of letters.
 */
function sanitizeNameForEmail(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, '');
}

/**
 * Generates an official DynamicDNA learner work email.
 * Format: FirstName.LastName@dynamicdna.co.za
 * Ensures Proper Case and uniqueness across registered learners.
 *
 * Examples:
 * - Zwavhudi.Tshivhase@dynamicdna.co.za
 * - Mulalo.Ramabulana@dynamicdna.co.za
 */
export function generateWorkEmail(
  firstName: string,
  lastName: string,
  existingEmails: string[] = []
): string {
  const properFirst = sanitizeNameForEmail(toProperCase(firstName));
  const properLast = sanitizeNameForEmail(toProperCase(lastName));

  if (!properFirst && !properLast) {
    return 'Learner@dynamicdna.co.za';
  }

  const baseLocalPart = properFirst && properLast
    ? `${properFirst}.${properLast}`
    : properFirst || properLast;

  const baseEmail = `${baseLocalPart}@dynamicdna.co.za`;

  // Check uniqueness (case-insensitive)
  const lowerExisting = new Set(existingEmails.map((e) => e.toLowerCase()));
  if (!lowerExisting.has(baseEmail.toLowerCase())) {
    return baseEmail;
  }

  // If collision exists, append sequence number: FirstName.LastName2@dynamicdna.co.za
  let counter = 2;
  while (lowerExisting.has(`${baseLocalPart}${counter}@dynamicdna.co.za`.toLowerCase())) {
    counter++;
  }

  return `${baseLocalPart}${counter}@dynamicdna.co.za`;
}
