/**
 * SmartRegister Learner API Service
 * Handles learner profile management, directory listing, searching, and picture upload
 * with full security, authorization, and privacy enforcement.
 */

import { UserProfile } from '../types/attendance';
import {
  validateLinkedInUrl,
  validateGitHubUrl,
  validateImageFile,
} from '../utils/validationUtils';

export interface PublicDirectoryCard {
  id: string;
  fullName: string;
  jobTitle: string;
  programme: string;
  avatarUrl: string;
  profilePictureUrl?: string;
  linkedInUrl?: string;
  gitHubUrl?: string;
  workEmail: string;
  // Note: Phone number, passwords, coordinates, and private attendance data are strictly omitted for privacy!
}

export interface ProfileUpdatePayload {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  jobTitle: string;
  avatarUrl?: string;
  profilePictureUrl?: string;
  linkedInUrl?: string;
  gitHubUrl?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Strips private and sensitive learner details to protect learner privacy in public directory
 */
export function sanitizeToPublicDirectoryCard(user: UserProfile): PublicDirectoryCard {
  return {
    id: user.id,
    fullName: user.fullName || `${user.firstName} ${user.lastName}`.trim(),
    jobTitle: user.jobTitle?.trim() || 'Software Developer',
    programme: user.programme || 'DVT Learnership Programme',
    avatarUrl: user.profilePictureUrl || user.avatarUrl,
    profilePictureUrl: user.profilePictureUrl,
    linkedInUrl: user.linkedInUrl,
    gitHubUrl: user.gitHubUrl,
    workEmail: user.workEmail,
  };
}

/**
 * Validates and processes a profile picture upload
 */
export async function uploadProfilePictureApi(file: File): Promise<ApiResponse<string>> {
  const validation = validateImageFile(file);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      resolve({
        success: true,
        data: dataUrl,
        message: 'Profile picture uploaded and processed successfully.',
      });
    };
    reader.onerror = () => {
      resolve({
        success: false,
        error: 'Failed to read image file. Please try another image.',
      });
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Validates and updates a learner's profile
 * Security rules:
 * - Learners can only edit their own profiles (enforced by matching currentUserId).
 * - Learner Number, Work Email, and Programme are immutable.
 * - External URLs (LinkedIn, GitHub) are strictly validated.
 */
export function updateLearnerProfileApi(
  currentUserId: string,
  targetProfileId: string,
  existingUser: UserProfile,
  payload: ProfileUpdatePayload
): ApiResponse<UserProfile> {
  // Authorization check
  if (currentUserId !== targetProfileId) {
    return {
      success: false,
      error: 'Unauthorized: You are only permitted to update your own profile.',
    };
  }

  // Validate required fields
  if (!payload.firstName.trim() || !payload.lastName.trim()) {
    return {
      success: false,
      error: 'First name and last name are required.',
    };
  }

  if (!payload.phoneNumber.trim()) {
    return {
      success: false,
      error: 'Contact number is required.',
    };
  }

  // Validate LinkedIn URL if provided
  if (payload.linkedInUrl && payload.linkedInUrl.trim()) {
    const liValidation = validateLinkedInUrl(payload.linkedInUrl);
    if (!liValidation.isValid) {
      return { success: false, error: liValidation.error };
    }
    payload.linkedInUrl = liValidation.normalized;
  } else {
    payload.linkedInUrl = '';
  }

  // Validate GitHub URL if provided
  if (payload.gitHubUrl && payload.gitHubUrl.trim()) {
    const ghValidation = validateGitHubUrl(payload.gitHubUrl);
    if (!ghValidation.isValid) {
      return { success: false, error: ghValidation.error };
    }
    payload.gitHubUrl = ghValidation.normalized;
  } else {
    payload.gitHubUrl = '';
  }

  const updatedProfile: UserProfile = {
    ...existingUser,
    firstName: payload.firstName.trim(),
    lastName: payload.lastName.trim(),
    fullName: `${payload.firstName.trim()} ${payload.lastName.trim()}`,
    phoneNumber: payload.phoneNumber.trim(),
    jobTitle: payload.jobTitle.trim() || 'Software Developer',
    avatarUrl: payload.avatarUrl || payload.profilePictureUrl || existingUser.avatarUrl,
    profilePictureUrl: payload.profilePictureUrl || payload.avatarUrl || existingUser.profilePictureUrl,
    linkedInUrl: payload.linkedInUrl,
    gitHubUrl: payload.gitHubUrl,
    // Immutable attributes preserved exactly as in existing record
    id: existingUser.id,
    learnerNumber: existingUser.learnerNumber,
    workEmail: existingUser.workEmail,
    programme: existingUser.programme,
    role: existingUser.role,
    status: existingUser.status,
  };

  return {
    success: true,
    data: updatedProfile,
    message: 'Profile updated successfully.',
  };
}

/**
 * Searches and filters approved, active learners in the directory
 * Matches across: First Name, Last Name, Full Name, and Job Title
 * Case-insensitive, partial matching
 */
export function searchLearnerDirectoryApi(
  allUsers: UserProfile[],
  searchQuery: string = ''
): PublicDirectoryCard[] {
  // Only approved and active learners should appear in the directory
  const activeLearners = allUsers.filter(
    (u) =>
      u.role === 'learner' &&
      u.status === 'active' &&
      u.learnerNumber !== 'PENDING'
  );

  const query = searchQuery.trim().toLowerCase();
  if (!query) {
    return activeLearners.map(sanitizeToPublicDirectoryCard);
  }

  return activeLearners
    .filter((learner) => {
      const first = (learner.firstName || '').toLowerCase();
      const last = (learner.lastName || '').toLowerCase();
      const full = (learner.fullName || `${first} ${last}`).toLowerCase();
      const job = (learner.jobTitle || '').toLowerCase();

      return (
        first.includes(query) ||
        last.includes(query) ||
        full.includes(query) ||
        job.includes(query)
      );
    })
    .map(sanitizeToPublicDirectoryCard);
}

/**
 * Retrieves a learner's public profile details by ID
 */
export function getLearnerProfileByIdApi(
  allUsers: UserProfile[],
  learnerId: string
): ApiResponse<PublicDirectoryCard> {
  const found = allUsers.find(
    (u) =>
      u.id === learnerId &&
      u.role === 'learner' &&
      u.status === 'active'
  );

  if (!found) {
    return {
      success: false,
      error: 'Learner profile not found or is currently inactive.',
    };
  }

  return {
    success: true,
    data: sanitizeToPublicDirectoryCard(found),
  };
}
