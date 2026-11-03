/**
 * Validation utilities for SmartRegister
 * Follows DynamicDNA & Microsoft 365 validation guidelines
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  normalized?: string;
}

/**
 * Validates work email or personal email address format
 */
export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Work email is required.' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address (e.g. FirstName.LastName@dynamicdna.co.za).' };
  }
  return { isValid: true, normalized: trimmed };
}

/**
 * Validates a LinkedIn profile URL
 * Accepts formats:
 * - https://www.linkedin.com/in/username
 * - https://linkedin.com/in/username
 * - linkedin.com/in/username
 */
export function validateLinkedInUrl(url: string): ValidationResult {
  const trimmed = url.trim();
  if (!trimmed) {
    return { isValid: true, normalized: '' }; // Optional field
  }

  // Prepend https:// if omitted
  let formatted = trimmed;
  if (!/^https?:\/\//i.test(formatted)) {
    formatted = `https://${formatted}`;
  }

  try {
    const parsed = new URL(formatted);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    if (host !== 'linkedin.com') {
      return {
        isValid: false,
        error: 'Please enter a valid LinkedIn URL (e.g. https://www.linkedin.com/in/your-profile).',
      };
    }
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    if (pathParts.length < 2 || pathParts[0] !== 'in') {
      return {
        isValid: false,
        error: 'LinkedIn profile URL must include the "/in/your-username" path.',
      };
    }
    return { isValid: true, normalized: formatted };
  } catch {
    return {
      isValid: false,
      error: 'Invalid URL format. Example: https://www.linkedin.com/in/zwavhudi-tshivhase',
    };
  }
}

/**
 * Validates a GitHub profile URL
 * Accepts formats:
 * - https://github.com/username
 * - http://github.com/username
 * - github.com/username
 */
export function validateGitHubUrl(url: string): ValidationResult {
  const trimmed = url.trim();
  if (!trimmed) {
    return { isValid: true, normalized: '' }; // Optional field
  }

  // Prepend https:// if omitted
  let formatted = trimmed;
  if (!/^https?:\/\//i.test(formatted)) {
    formatted = `https://${formatted}`;
  }

  try {
    const parsed = new URL(formatted);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    if (host !== 'github.com') {
      return {
        isValid: false,
        error: 'Please enter a valid GitHub URL (e.g. https://github.com/your-username).',
      };
    }
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    if (pathParts.length < 1) {
      return {
        isValid: false,
        error: 'GitHub URL must include your username (e.g. https://github.com/your-username).',
      };
    }
    return { isValid: true, normalized: formatted };
  } catch {
    return {
      isValid: false,
      error: 'Invalid URL format. Example: https://github.com/zwavhudi-tshivhase',
    };
  }
}

/**
 * Validates uploaded image file type and size
 * Maximum size: 2MB (2 * 1024 * 1024 bytes)
 * Allowed types: JPEG, PNG, WebP, GIF
 */
export function validateImageFile(file: File): ValidationResult {
  const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  if (!allowedMimeTypes.includes(file.type.toLowerCase())) {
    return {
      isValid: false,
      error: 'Unsupported file format. Please upload a JPEG, PNG, or WebP image.',
    };
  }

  if (file.size > MAX_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `File size (${sizeMb} MB) exceeds the maximum allowed limit of 2 MB.`,
    };
  }

  return { isValid: true };
}
