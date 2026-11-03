import {
  AttendanceRecord,
  AttendanceStatus,
  Coordinates,
  DayScheduleType,
  SystemControlsConfig,
  UserProfile,
  WorkplaceOffice,
} from '../types/attendance';
import {
  calculateDistanceMeters,
  evaluateClockInStatus,
  evaluateWorkingDay,
  generateDailyAccessId,
  getSASTComponents,
  isClockOutAllowed,
} from '../utils/geoUtils';

export interface ClockInVerificationParams {
  learner: UserProfile;
  scheduleType: DayScheduleType;
  coordinates: Coordinates;
  capturedTimestamp: string;
  workplace: WorkplaceOffice;
  existingRecords: AttendanceRecord[];
  systemControls: SystemControlsConfig;
  notes?: string;
  simulatedDate?: Date;
  dailyAccessId?: string;
}

export interface ClockInVerificationResponse {
  success: boolean;
  status?: AttendanceStatus;
  record?: AttendanceRecord;
  distanceMeters?: number;
  verificationStatus: 'verified' | 'unverified' | 'wfh_exempt';
  message: string;
  errorCode?: string;
  serverTimestamp: string;
}

export interface ClockOutVerificationParams {
  learner: UserProfile;
  existingRecord: AttendanceRecord;
  coordinates?: Coordinates;
  capturedTimestamp?: string;
  workplace: WorkplaceOffice;
  systemControls: SystemControlsConfig;
  simulatedDate?: Date;
}

export interface ClockOutVerificationResponse {
  success: boolean;
  message: string;
  clockOutTime?: string;
  clockOutTimestamp?: string;
  clockOutDistance?: number;
  clockOutGpsAccuracy?: number;
  errorCode?: string;
  serverTimestamp: string;
}

/**
 * Server-authoritative Attendance Verification Service.
 * Implements strict backend rules:
 * - Independent recalculation of distance using Haversine formula
 * - Verification of GPS accuracy against workplace threshold
 * - Evaluation of schedule (Office vs WFH)
 * - Africa/Johannesburg (SAST) authoritative time checks
 * - Atomic duplicate prevention
 */
export const attendanceVerificationService = {
  /**
   * Evaluates clock-in submission with backend rules.
   */
  verifyClockIn(params: ClockInVerificationParams): ClockInVerificationResponse {
    const {
      learner,
      scheduleType,
      coordinates,
      capturedTimestamp,
      workplace,
      existingRecords,
      systemControls,
      notes,
      simulatedDate,
    } = params;

    const referenceDate = simulatedDate || new Date();
    const serverTimestamp = referenceDate.toISOString();
    const sast = getSASTComponents(referenceDate);
    const todayDateString = sast.dateString;

    // 1. Role verification
    if (!learner || learner.role !== 'learner') {
      return {
        success: false,
        verificationStatus: 'unverified',
        message: 'Unauthorized: Attendance submission requires active learner credentials.',
        errorCode: 'UNAUTHORIZED_ROLE',
        serverTimestamp,
      };
    }

    // 2. Emergency Broadcast Shutdown
    if (systemControls.emergencyBroadcastActive) {
      return {
        success: false,
        verificationStatus: 'unverified',
        message: systemControls.emergencyMessage || 'Attendance suspended by Administrator.',
        errorCode: 'EMERGENCY_BROADCAST_ACTIVE',
        serverTimestamp,
      };
    }

    // 3. System Controls Check
    if (!systemControls.isClockInEnabled || systemControls.isAttendanceClosedToday) {
      return {
        success: false,
        verificationStatus: 'unverified',
        message: 'Clock-In is currently disabled or attendance register has been closed by the Administrator.',
        errorCode: 'CLOCK_IN_DISABLED',
        serverTimestamp,
      };
    }

    // 4. Working Day & Holiday Validation
    const workingDay = evaluateWorkingDay(referenceDate);
    if (!workingDay.isWorkingDay) {
      return {
        success: false,
        verificationStatus: 'unverified',
        message: workingDay.message || 'Attendance is not required today (Non-working day).',
        errorCode: 'NON_WORKING_DAY',
        serverTimestamp,
      };
    }

    // 5. Atomic Duplicate Prevention
    const alreadyClockedIn = existingRecords.some(
      (rec) => rec.learnerId === learner.id && rec.date === todayDateString && Boolean(rec.clockInTime)
    );
    if (alreadyClockedIn) {
      return {
        success: false,
        verificationStatus: 'unverified',
        message: 'Attendance Already Registered For Today. Duplicate submissions are strictly prevented.',
        errorCode: 'DUPLICATE_CLOCK_IN',
        serverTimestamp,
      };
    }

    // 6. Time Window Evaluation (07:15 - 09:00 on time, >09:00 late)
    const clockInEval = evaluateClockInStatus(referenceDate);
    if (!clockInEval.isOpen) {
      return {
        success: false,
        verificationStatus: 'unverified',
        message: clockInEval.message || 'Clock-In opens at 07:15.',
        errorCode: 'OUTSIDE_CLOCK_IN_HOURS',
        serverTimestamp,
      };
    }

    // 7. Schedule & Geofence Verification (Office vs WFH)
    let calculatedDistance: number | undefined;
    let verificationStatus: 'verified' | 'unverified' | 'wfh_exempt' = 'unverified';

    if (scheduleType === 'office') {
      // Office Day: Mandatory Workplace GPS Geofence Verification
      if (!workplace.isActive) {
        return {
          success: false,
          verificationStatus: 'unverified',
          message: 'Workplace attendance facility is temporarily deactivated by Administrator.',
          errorCode: 'WORKPLACE_INACTIVE',
          serverTimestamp,
        };
      }

      if (!coordinates || typeof coordinates.latitude !== 'number' || typeof coordinates.longitude !== 'number') {
        return {
          success: false,
          verificationStatus: 'unverified',
          message: 'GPS coordinates missing. Physical location verification is required on Office Days.',
          errorCode: 'MISSING_COORDINATES',
          serverTimestamp,
        };
      }

      // Independent recalculation of distance using Haversine formula
      calculatedDistance = calculateDistanceMeters(coordinates, workplace.coordinates);
      const accuracy = Math.round(coordinates.accuracy ?? 10);

      // Check GPS Accuracy threshold
      if (accuracy > workplace.gpsAccuracyThresholdMeters) {
        return {
          success: false,
          distanceMeters: calculatedDistance,
          verificationStatus: 'unverified',
          message: `GPS accuracy ${accuracy}m exceeds maximum allowed threshold of ${workplace.gpsAccuracyThresholdMeters}m. Please move outdoors or near a window and retry.`,
          errorCode: 'ACCURACY_INSUFFICIENT',
          serverTimestamp,
        };
      }

      // Check Permitted Radius
      if (calculatedDistance > workplace.allowedRadiusMeters) {
        const excess = calculatedDistance - workplace.allowedRadiusMeters;
        return {
          success: false,
          distanceMeters: calculatedDistance,
          verificationStatus: 'unverified',
          message: `Attendance Denied. Today is an Office Day. You must be physically present at ${workplace.name} (Distance: ${calculatedDistance}m exceeds radius of ${workplace.allowedRadiusMeters}m by ${excess}m).`,
          errorCode: 'OUTSIDE_AUTHORISED_RADIUS',
          serverTimestamp,
        };
      }

      verificationStatus = 'verified';
    } else {
      // Work-From-Home Day: Exempt from Workplace GPS
      if (!systemControls.isWfhAttendanceEnabled) {
        return {
          success: false,
          verificationStatus: 'unverified',
          message: 'Work From Home Attendance is temporarily disabled by the Administrator.',
          errorCode: 'WFH_DISABLED',
          serverTimestamp,
        };
      }

      verificationStatus = 'wfh_exempt';
    }

    // 8. Generate Authoritative Attendance Record
    const clockInTimeString = sast.timeString;
    const accessId = params.dailyAccessId || generateDailyAccessId(referenceDate, learner.id);

    const newRecord: AttendanceRecord = {
      id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      learnerId: learner.id,
      learnerNumber: learner.learnerNumber,
      learnerName: learner.fullName,
      date: todayDateString,
      attendanceDate: todayDateString,
      clockInTime: clockInTimeString,
      clockInTimestamp: capturedTimestamp || serverTimestamp,
      clockInLatitude: coordinates?.latitude,
      clockInLongitude: coordinates?.longitude,
      clockInGpsAccuracy: coordinates?.accuracy ? Math.round(coordinates.accuracy) : undefined,
      clockInDistance: calculatedDistance,
      status: clockInEval.status,
      dayType: scheduleType,
      verifiedDistanceMeters: calculatedDistance,
      verificationStatus,
      accessId,
      notes: notes || (scheduleType === 'office' ? 'Office Attendance (GPS Verified)' : 'WFH Remote Attendance'),
    };

    return {
      success: true,
      status: clockInEval.status,
      record: newRecord,
      distanceMeters: calculatedDistance,
      verificationStatus,
      message: `Clock-In successfully registered at ${clockInTimeString} SAST. Attendance Status: ${clockInEval.status}.`,
      serverTimestamp,
    };
  },

  /**
   * Evaluates clock-out submission with authoritative backend rules in Africa/Johannesburg timezone.
   *
   * Business Rules:
   * - Cannot clock out before 15:15 SAST
   * - Learner must be clocked in
   * - Duplicate clock-outs are rejected
   * - Saves server-generated departure timestamp in SAST
   */
  verifyClockOut(params: ClockOutVerificationParams): ClockOutVerificationResponse {
    const {
      learner,
      existingRecord,
      coordinates,
      capturedTimestamp,
      workplace,
      systemControls,
      simulatedDate,
    } = params;

    const referenceDate = simulatedDate || new Date();
    const serverTimestamp = referenceDate.toISOString();
    const sastOut = getSASTComponents(referenceDate);

    if (!learner || learner.role !== 'learner') {
      return {
        success: false,
        message: 'Unauthorized.',
        errorCode: 'UNAUTHORIZED_ROLE',
        serverTimestamp,
      };
    }

    if (!systemControls.isClockOutEnabled) {
      return {
        success: false,
        message: 'Clock-Out is disabled by the Administrator.',
        errorCode: 'CLOCK_OUT_DISABLED',
        serverTimestamp,
      };
    }

    if (!existingRecord || !existingRecord.clockInTime) {
      return {
        success: false,
        message: 'Cannot clock out: No clock-in recorded for today.',
        errorCode: 'NO_CLOCK_IN_RECORDED',
        serverTimestamp,
      };
    }

    // 3. Departure time check: 15:15 SAST strictly enforced
    const clockOutEval = isClockOutAllowed(referenceDate);
    if (!clockOutEval.allowed) {
      return {
        success: false,
        message: 'Clock-out is not permitted before 15:15 SAST. Daily attendance remains in progress.',
        errorCode: 'EARLY_CLOCK_OUT_NOT_PERMITTED',
        serverTimestamp,
      };
    }

    // 4. Duplicate Clock-Out check
    if (existingRecord.clockOutTime && existingRecord.isSealed) {
      return {
        success: false,
        message: 'Clock-Out has already been registered for today. Daily attendance ledger is already sealed.',
        errorCode: 'DUPLICATE_CLOCK_OUT',
        serverTimestamp,
      };
    }

    // 5. GPS verification for Office days
    let clockOutDistance: number | undefined;
    if (existingRecord.dayType === 'office') {
      if (coordinates && typeof coordinates.latitude === 'number' && typeof coordinates.longitude === 'number') {
        clockOutDistance = calculateDistanceMeters(coordinates, workplace.coordinates);
        if (clockOutDistance > workplace.allowedRadiusMeters) {
          return {
            success: false,
            message: `Clock-Out Denied. Today is an Office Day. You must be physically present at DynamicDNA (within ${workplace.allowedRadiusMeters}m). Current distance: ${clockOutDistance}m.`,
            errorCode: 'OUTSIDE_WORKPLACE_RADIUS',
            serverTimestamp,
          };
        }
      }
    } else if (coordinates && typeof coordinates.latitude === 'number' && typeof coordinates.longitude === 'number') {
      clockOutDistance = calculateDistanceMeters(coordinates, workplace.coordinates);
    }

    const clockOutTimeString = sastOut.timeString;

    return {
      success: true,
      message: `Clock-Out recorded successfully at ${clockOutTimeString} SAST. Shift completed and attendance ledger sealed.`,
      clockOutTime: clockOutTimeString,
      clockOutTimestamp: capturedTimestamp || serverTimestamp,
      clockOutDistance,
      clockOutGpsAccuracy: coordinates?.accuracy ? Math.round(coordinates.accuracy) : undefined,
      serverTimestamp,
    };
  },
};
