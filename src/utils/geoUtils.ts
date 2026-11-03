import {
  AttendanceRecord,
  AttendanceStatus,
  Coordinates,
  LocationVerificationResult,
  TerminalAttendanceState,
  WorkplaceOffice,
} from '../types/attendance';

export const DEFAULT_WORKPLACE_OFFICE: WorkplaceOffice = {
  id: 'wp_dynamic_dna_campus',
  name: 'DynamicDNA Campus',
  organization: 'DynamicDNA',
  programme: 'DVT Learnership Programme',
  coordinates: {
    latitude: -26.097841,
    longitude: 27.998357,
  },
  allowedRadiusMeters: 100,
  gpsAccuracyThresholdMeters: 30, // 30 meters maximum acceptable accuracy
  isActive: true,
};

// Backwards-compatible export
export const DYNAMIC_DNA_OFFICE: WorkplaceOffice = DEFAULT_WORKPLACE_OFFICE;

// South African Statutory Public Holidays (YYYY-MM-DD)
export const SA_PUBLIC_HOLIDAYS_2026: Record<string, string> = {
  '2026-01-01': "New Year's Day",
  '2026-03-21': 'Human Rights Day',
  '2026-04-03': 'Good Friday',
  '2026-04-06': 'Family Day',
  '2026-04-27': 'Freedom Day',
  '2026-05-01': "Workers' Day",
  '2026-06-16': 'Youth Day',
  '2026-08-09': "National Women's Day",
  '2026-08-10': "Public Holiday observed (Women's Day)",
  '2026-09-24': 'Heritage Day',
  '2026-12-16': 'Day of Reconciliation',
  '2026-12-25': 'Christmas Day',
  '2026-12-26': 'Day of Goodwill',
};

/**
 * Authoritative South African Standard Time (SAST, UTC+2 / Africa/Johannesburg) Component Extractor.
 * Guarantees zero local browser/server timezone drift.
 */
export function getSASTComponents(date: Date = new Date()): {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  seconds: number;
  timeString: string;
  dateString: string;
  formattedDisplay: string;
} {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Johannesburg',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const partMap: Record<string, string> = {};
  for (const p of parts) {
    partMap[p.type] = p.value;
  }

  const year = parseInt(partMap.year, 10);
  const month = parseInt(partMap.month, 10);
  const day = parseInt(partMap.day, 10);
  const hours = parseInt(partMap.hour, 10);
  const minutes = parseInt(partMap.minute, 10);
  const seconds = parseInt(partMap.second, 10);
  const timeString = `${partMap.hour}:${partMap.minute}:${partMap.second}`;
  const dateString = `${partMap.year}-${partMap.month}-${partMap.day}`;
  const formattedDisplay = `${timeString} SAST`;

  return {
    year,
    month,
    day,
    hours,
    minutes,
    seconds,
    timeString,
    dateString,
    formattedDisplay,
  };
}

/**
 * Formats time in HH:mm:ss SAST
 */
export function formatSASTTime(date: Date = new Date()): string {
  return getSASTComponents(date).timeString;
}

/**
 * Formats date in YYYY-MM-DD in Africa/Johannesburg
 */
export function formatSASTDate(date: Date = new Date()): string {
  return getSASTComponents(date).dateString;
}

/**
 * Calculates distance in meters between two GPS coordinates using Haversine formula
 * Earth radius: 6,371,000 meters
 */
export function calculateDistanceMeters(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (coord1.latitude * Math.PI) / 180;
  const phi2 = (coord2.latitude * Math.PI) / 180;
  const deltaPhi = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const deltaLambda = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export function isWithinGeofence(
  userCoord: Coordinates,
  officeCoord: Coordinates = DEFAULT_WORKPLACE_OFFICE.coordinates,
  maxRadius: number = DEFAULT_WORKPLACE_OFFICE.allowedRadiusMeters
): { isWithin: boolean; distance: number } {
  const distance = calculateDistanceMeters(userCoord, officeCoord);
  return {
    isWithin: distance <= maxRadius,
    distance,
  };
}

/**
 * Verifies user coordinates against authorized workplace parameters.
 */
export function verifyLocationAgainstWorkplace(
  coords: Coordinates,
  workplace: WorkplaceOffice = DEFAULT_WORKPLACE_OFFICE,
  timestamp?: string
): LocationVerificationResult {
  const capturedAt = timestamp || new Date().toISOString();

  if (!workplace.isActive) {
    return {
      status: 'error',
      coordinates: coords,
      capturedAt,
      isWithinGeofence: false,
      isAccuracyAcceptable: false,
      message: 'Workplace attendance is temporarily inactive in system controls.',
      errorCode: 'INACTIVE_WORKPLACE',
    };
  }

  const distance = calculateDistanceMeters(coords, workplace.coordinates);
  const accuracy = Math.round(coords.accuracy ?? 10);
  const isAccuracyAcceptable = accuracy <= workplace.gpsAccuracyThresholdMeters;
  const isWithinGeofence = distance <= workplace.allowedRadiusMeters;

  if (!isAccuracyAcceptable) {
    return {
      status: 'warning',
      coordinates: coords,
      capturedAt,
      distanceMeters: distance,
      allowedRadiusMeters: workplace.allowedRadiusMeters,
      gpsAccuracyMeters: accuracy,
      accuracyThresholdMeters: workplace.gpsAccuracyThresholdMeters,
      isWithinGeofence,
      isAccuracyAcceptable: false,
      message: `GPS accuracy is ${accuracy}m (Threshold: ${workplace.gpsAccuracyThresholdMeters}m). Accuracy insufficient. Move closer to a window or outdoors to improve satellite lock.`,
      errorCode: 'ACCURACY_POOR',
    };
  }

  if (!isWithinGeofence) {
    const diff = distance - workplace.allowedRadiusMeters;
    return {
      status: 'error',
      coordinates: coords,
      capturedAt,
      distanceMeters: distance,
      allowedRadiusMeters: workplace.allowedRadiusMeters,
      gpsAccuracyMeters: accuracy,
      accuracyThresholdMeters: workplace.gpsAccuracyThresholdMeters,
      isWithinGeofence: false,
      isAccuracyAcceptable: true,
      message: `Outside authorised workplace area. Distance: ${distance}m (Allowed: ${workplace.allowedRadiusMeters}m, exceeded by ${diff}m). Physical presence at ${workplace.name} required.`,
      errorCode: 'OUTSIDE_RADIUS',
    };
  }

  return {
    status: 'success',
    coordinates: coords,
    capturedAt,
    distanceMeters: distance,
    allowedRadiusMeters: workplace.allowedRadiusMeters,
    gpsAccuracyMeters: accuracy,
    accuracyThresholdMeters: workplace.gpsAccuracyThresholdMeters,
    isWithinGeofence: true,
    isAccuracyAcceptable: true,
    message: `Authorised radius: ${workplace.allowedRadiusMeters} metres. Learner distance: ${distance} metres. Result: LOCATION VERIFIED.`,
  };
}

/**
 * Checks if a given date is a working day (Monday - Friday) and not a public holiday
 * Authoritative Africa/Johannesburg day check.
 */
export function evaluateWorkingDay(date: Date = new Date()): {
  isWorkingDay: boolean;
  isWeekend: boolean;
  isPublicHoliday: boolean;
  holidayName?: string;
  message?: string;
} {
  const { year, month, day, dateString } = getSASTComponents(date);
  // Construct UTC timestamp matching SAST calendar date at noon to determine day-of-week safely
  const sastDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const dayOfWeek = sastDate.getUTCDay(); // 0 is Sunday, 6 is Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const holidayName = SA_PUBLIC_HOLIDAYS_2026[dateString];
  const isPublicHoliday = Boolean(holidayName);

  if (isWeekend) {
    return {
      isWorkingDay: false,
      isWeekend: true,
      isPublicHoliday: false,
      message: 'Attendance is not required today.',
    };
  }

  if (isPublicHoliday) {
    return {
      isWorkingDay: false,
      isWeekend: false,
      isPublicHoliday: true,
      holidayName,
      message: 'Attendance is not required today.',
    };
  }

  return {
    isWorkingDay: true,
    isWeekend: false,
    isPublicHoliday: false,
  };
}

/**
 * Evaluates Clock-In status based on South African Standard Time:
 * Clock-In opens: 07:15 SAST
 * Present: 07:15 - 09:00 SAST
 * Late: After 09:00 SAST
 */
export function evaluateClockInStatus(date: Date = new Date()): {
  isOpen: boolean;
  status: AttendanceStatus;
  message: string;
  timeString: string;
} {
  const { hours, minutes, timeString } = getSASTComponents(date);
  const timeInMinutes = hours * 60 + minutes;

  // 07:15 = 7*60 + 15 = 435 minutes
  // 09:00 = 9*60 = 540 minutes
  const openTime = 7 * 60 + 15;
  const lateTime = 9 * 60;

  if (timeInMinutes < openTime) {
    return {
      isOpen: false,
      status: 'Present',
      message: 'Clock-In opens at 07:15 SAST.',
      timeString,
    };
  } else if (timeInMinutes <= lateTime) {
    return {
      isOpen: true,
      status: 'Present',
      message: 'On-time Clock-In (07:15 - 09:00 window).',
      timeString,
    };
  } else {
    return {
      isOpen: true,
      status: 'Late',
      message: 'Late Clock-In (after 09:00 cutoff).',
      timeString,
    };
  }
}

/**
 * Evaluates whether Clock Out is permitted (from 15:15 SAST).
 * Strictly enforced in Africa/Johannesburg timezone.
 *
 * Rules & Test Cases:
 * 12:00 -> false
 * 12:36 -> false
 * 14:59 -> false
 * 15:14 -> false
 * 15:15 -> true
 * 15:40 -> true
 */
export function isClockOutAllowed(date: Date = new Date()): {
  allowed: boolean;
  thresholdTimeString: string;
  minutesRemaining: number;
  sastTimeString: string;
  message: string;
} {
  const { hours, minutes, timeString } = getSASTComponents(date);
  const timeInMinutes = hours * 60 + minutes;

  // 15:15 SAST = 15 * 60 + 15 = 915 minutes
  const clockOutThreshold = 15 * 60 + 15;

  if (timeInMinutes >= clockOutThreshold) {
    return {
      allowed: true,
      thresholdTimeString: '15:15',
      minutesRemaining: 0,
      sastTimeString: timeString,
      message: 'Clock-out is enabled.',
    };
  }

  const minutesRemaining = clockOutThreshold - timeInMinutes;

  return {
    allowed: false,
    thresholdTimeString: '15:15',
    minutesRemaining,
    sastTimeString: timeString,
    message: 'Clock-out is not available yet. You may clock out from 15:15.',
  };
}

/**
 * Derives the Authoritative Terminal Attendance State:
 * - NOT_CLOCKED_IN: No clock-in recorded for today
 * - CLOCK_OUT_PENDING: Clock-in recorded, shift in progress before 15:15 SAST
 * - CLOCKED_IN: Clock-in recorded, 15:15 reached, departure clock-out available
 * - COMPLETED: Clock-out successfully recorded & persisted in attendance ledger
 */
export function deriveAttendanceState(
  todayRecord: AttendanceRecord | null,
  activeDate: Date = new Date()
): TerminalAttendanceState {
  if (!todayRecord || !todayRecord.clockInTime) {
    return 'NOT_CLOCKED_IN';
  }

  const clockOutEval = isClockOutAllowed(activeDate);

  // Authoritative Rule:
  // Before 15:15 SAST, daily attendance must remain in progress (CLOCK_OUT_PENDING).
  // A clock-out cannot be completed or sealed before 15:15 SAST.
  if (!clockOutEval.allowed) {
    return 'CLOCK_OUT_PENDING';
  }

  // At or after 15:15 SAST:
  // If properly clocked out and persisted, status is COMPLETED.
  if (todayRecord.clockOutTime && todayRecord.isSealed !== false) {
    return 'COMPLETED';
  }

  // At or after 15:15 SAST and not yet clocked out:
  // Shift clearance reached; clock-out is unlocked and available.
  return 'CLOCKED_IN';
}

/**
 * Generates Daily Access ID
 * Example format: SR-20261103-W9Q4A
 * Deterministic for (date, learnerId) to ensure token consistency.
 */
export function generateDailyAccessId(date: Date = new Date(), seed: string = ''): string {
  const { year, month, day } = getSASTComponents(date);
  const yyyy = year.toString();
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  const dateSegment = `${yyyy}${mm}${dd}`;

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randPart = '';

  if (seed) {
    // Generate deterministic 5-character token from seed + date
    const composite = `${seed.trim().toLowerCase()}_${dateSegment}`;
    let hash = 0;
    for (let i = 0; i < composite.length; i++) {
      hash = (hash << 5) - hash + composite.charCodeAt(i);
      hash |= 0;
    }
    let h = Math.abs(hash);
    for (let i = 0; i < 5; i++) {
      randPart += chars[(h + i * 7) % chars.length];
      h = Math.floor(h / 3) + (i + 1) * 13;
    }
  } else {
    for (let i = 0; i < 5; i++) {
      const idx = Math.floor(Math.random() * chars.length);
      randPart += chars[idx];
    }
  }

  return `SR-${dateSegment}-${randPart}`;
}

export function formatTimeShort(timeString?: string): string {
  if (!timeString) return '--:--';
  const parts = timeString.split(':');
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  return timeString;
}
