import { AttendanceStatus, Coordinates, WorkplaceOffice } from '../types/attendance';

export const DYNAMIC_DNA_OFFICE: WorkplaceOffice = {
  name: 'DynamicDNA',
  organization: 'DynamicDNA',
  programme: 'DVT Learnership Programme',
  coordinates: {
    latitude: -26.097841,
    longitude: 27.998357,
  },
  allowedRadiusMeters: 100,
};

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
 * Calculates distance in meters between two GPS coordinates using Haversine formula
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
  officeCoord: Coordinates = DYNAMIC_DNA_OFFICE.coordinates,
  maxRadius: number = DYNAMIC_DNA_OFFICE.allowedRadiusMeters
): { isWithin: boolean; distance: number } {
  const distance = calculateDistanceMeters(userCoord, officeCoord);
  return {
    isWithin: distance <= maxRadius,
    distance,
  };
}

/**
 * Checks if a given date is a working day (Monday - Friday) and not a public holiday
 */
export function evaluateWorkingDay(date: Date = new Date()): {
  isWorkingDay: boolean;
  isWeekend: boolean;
  isPublicHoliday: boolean;
  holidayName?: string;
  message?: string;
} {
  const dayOfWeek = date.getDay(); // 0 is Sunday, 6 is Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const dateString = date.toISOString().split('T')[0];
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
 * Evaluates Clock-In status based on time:
 * Clock-In opens: 07:15
 * Present: 07:15 - 09:00
 * Late: After 09:00
 */
export function evaluateClockInStatus(date: Date = new Date()): {
  isOpen: boolean;
  status: AttendanceStatus;
  message: string;
  timeString: string;
} {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  // 07:15 = 7*60 + 15 = 435 minutes
  // 09:00 = 9*60 = 540 minutes
  const openTime = 7 * 60 + 15;
  const lateTime = 9 * 60;

  const timeString = date.toTimeString().split(' ')[0];

  if (timeInMinutes < openTime) {
    return {
      isOpen: false,
      status: 'Present',
      message: 'Clock-In opens at 07:15.',
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
 * Evaluates whether Clock Out is permitted (from 15:15)
 */
export function isClockOutAllowed(date: Date = new Date()): {
  allowed: boolean;
  thresholdTimeString: string;
  minutesRemaining: number;
  message: string;
} {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  // 15:15 = 15 * 60 + 15 = 915 minutes
  const clockOutThreshold = 15 * 60 + 15;

  if (timeInMinutes >= clockOutThreshold) {
    return {
      allowed: true,
      thresholdTimeString: '15:15',
      minutesRemaining: 0,
      message: 'Clock-out is enabled.',
    };
  }

  return {
    allowed: false,
    thresholdTimeString: '15:15',
    minutesRemaining: clockOutThreshold - timeInMinutes,
    message: 'Clock-Out Available From 15:15',
  };
}

/**
 * Generates Daily Access ID
 * Example format: SR-20261102-X7K4Q
 */
export function generateDailyAccessId(date: Date = new Date(), seed: string = ''): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const dateSegment = `${yyyy}${mm}${dd}`;

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randPart = '';
  // Combine random chars with seed
  for (let i = 0; i < 5; i++) {
    const idx = Math.floor(Math.random() * chars.length);
    randPart += chars[idx];
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
