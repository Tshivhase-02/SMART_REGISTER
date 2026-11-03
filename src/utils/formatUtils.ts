/**
 * SmartRegister - Name Formatting & Work Email Generation Utilities
 * DynamicDNA | DVT Learnership Programme
 */

/**
 * Converts any string to Proper Case (Title Case).
 * Capitalizes the first letter of each word and lowercases the remainder.
 * Handles hyphens and apostrophes cleanly.
 *
 * Examples:
 *   zwavhudi -> Zwavhudi
 *   tshivhase -> Tshivhase
 *   ZWAVHUDI -> Zwavhudi
 *   mulalo ramabulana -> Mulalo Ramabulana
 */
export function toProperCase(input: string): string {
  if (!input) return '';
  return input
    .trim()
    .toLowerCase()
    .replace(/(?:^|[\s\-'’])\p{L}/gu, (match) => match.toUpperCase());
}

/**
 * Sanitizes a name segment for clean email generation while maintaining Proper Case.
 */
export function sanitizeNameForEmail(name: string): string {
  const proper = toProperCase(name);
  // Remove whitespace and special punctuation invalid in standard email handles
  return proper.replace(/[^a-zA-Z0-9-]/g, '');
}

/**
 * Generates an official DynamicDNA work email automatically in the format:
 * FirstName.LastName@dynamicdna.co.za
 *
 * Rules:
 * - Auto-generated
 * - Read-only
 * - Unique per learner (resolves collision with increment if needed)
 * - Cannot be manually edited
 *
 * Examples:
 *   Zwavhudi.Tshivhase@dynamicdna.co.za
 *   Mulalo.Ramabulana@dynamicdna.co.za
 */
export function generateWorkEmail(
  firstName: string,
  lastName: string,
  existingEmails: string[] = []
): string {
  const properFirst = sanitizeNameForEmail(firstName);
  const properLast = sanitizeNameForEmail(lastName);

  if (!properFirst && !properLast) {
    return '';
  }

  const baseEmail = `${properFirst || 'Learner'}.${properLast || 'Profile'}@dynamicdna.co.za`;

  const normalizedExisting = new Set(
    existingEmails.map((e) => e.trim().toLowerCase())
  );

  if (!normalizedExisting.has(baseEmail.toLowerCase())) {
    return baseEmail;
  }

  // Ensure uniqueness per learner
  let counter = 2;
  while (
    normalizedExisting.has(
      `${properFirst || 'Learner'}.${properLast || 'Profile'}${counter}@dynamicdna.co.za`.toLowerCase()
    )
  ) {
    counter++;
  }

  return `${properFirst || 'Learner'}.${properLast || 'Profile'}${counter}@dynamicdna.co.za`;
}
