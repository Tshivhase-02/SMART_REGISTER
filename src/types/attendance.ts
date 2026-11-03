export type UserRole = 'learner' | 'admin';

export type AttendanceStatus = 'Present' | 'Late' | 'Absent';

export type TerminalAttendanceState =
  | 'NOT_CLOCKED_IN'
  | 'CLOCKED_IN'
  | 'CLOCK_OUT_PENDING'
  | 'COMPLETED';

export type DayScheduleType = 'office' | 'wfh';

export type AbsenceReason =
  | 'Sick'
  | 'Family Emergency'
  | 'Medical Appointment'
  | 'Transport Issues'
  | 'Study Leave'
  | 'Other';

export type AbsenceStatus = 'Pending' | 'Approved' | 'Rejected';

export type UserAccountStatus = 'active' | 'pending_approval' | 'rejected' | 'inactive';

export interface UserProfile {
  id: string;
  learnerNumber: string; // e.g., DVT-2026-001 or 'PENDING'
  firstName: string;
  lastName: string;
  fullName: string;
  workEmail: string; // firstname.lastname@learners.dynamicdna.co.za
  phoneNumber: string;
  password?: string;
  programme: string; // "DVT Learnership Programme"
  role: UserRole;
  avatarUrl: string;
  profilePictureUrl?: string;
  jobTitle?: string;
  linkedInUrl?: string;
  gitHubUrl?: string;
  status: UserAccountStatus;
  approvalStatus?: string;
  registeredAt?: string;
  dateSubmitted?: string;
  approvedAt?: string;
  dailyAccessId?: string; // e.g. SR-20261102-X7K4Q
  accessIdIssuedDate?: string; // YYYY-MM-DD
}

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface WorkplaceOffice {
  id?: string;
  name: string;
  organization: string;
  programme: string;
  coordinates: Coordinates;
  allowedRadiusMeters: number;
  gpsAccuracyThresholdMeters: number;
  isActive: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export type LocationVerificationStatusType =
  | 'idle'
  | 'detecting'
  | 'success'
  | 'warning'
  | 'error';

export interface LocationVerificationResult {
  status: LocationVerificationStatusType;
  coordinates?: Coordinates;
  capturedAt?: string;
  distanceMeters?: number;
  allowedRadiusMeters?: number;
  gpsAccuracyMeters?: number;
  accuracyThresholdMeters?: number;
  isWithinGeofence: boolean;
  isAccuracyAcceptable: boolean;
  message: string;
  errorCode?:
    | 'PERMISSION_DENIED'
    | 'POSITION_UNAVAILABLE'
    | 'TIMEOUT'
    | 'ACCURACY_POOR'
    | 'OUTSIDE_RADIUS'
    | 'INACTIVE_WORKPLACE'
    | 'NOT_SUPPORTED';
}

export interface WorkplaceAuditLog {
  id: string;
  timestamp: string;
  adminId: string;
  adminName: string;
  action:
    | 'UPDATE_COORDINATES'
    | 'UPDATE_RADIUS'
    | 'UPDATE_ACCURACY'
    | 'TOGGLE_ACTIVE'
    | 'RESET_DEFAULT'
    | 'FULL_CONFIG_UPDATE';
  details: string;
  changes: {
    field: string;
    oldValue: string | number | boolean;
    newValue: string | number | boolean;
  }[];
}

export interface AttendanceRecord {
  id: string;
  learnerId: string;
  learnerNumber: string;
  learnerName: string;
  date: string; // YYYY-MM-DD
  attendanceDate?: string;
  clockInTime?: string; // HH:mm:ss
  clockInTimestamp?: string;
  clockInLatitude?: number;
  clockInLongitude?: number;
  clockInGpsAccuracy?: number;
  clockInDistance?: number;
  clockOutTime?: string; // HH:mm:ss
  clockOutTimestamp?: string;
  clockOutLatitude?: number;
  clockOutLongitude?: number;
  clockOutGpsAccuracy?: number;
  clockOutDistance?: number;
  status: AttendanceStatus;
  dayType: DayScheduleType; // configured schedule for that day (internal record)
  verifiedDistanceMeters?: number;
  verificationStatus?: 'verified' | 'unverified' | 'wfh_exempt';
  accessId: string;
  notes?: string;
}

export interface AbsenceRequest {
  id: string;
  learnerId: string;
  learnerNumber: string;
  learnerName: string;
  date: string; // YYYY-MM-DD
  reason: AbsenceReason;
  comments: string;
  status: AbsenceStatus;
  submittedAt: string;
  reviewedBy?: string;
  reviewDate?: string;
}

export interface WeeklyScheduleConfig {
  monday: DayScheduleType;
  tuesday: DayScheduleType;
  wednesday: DayScheduleType;
  thursday: DayScheduleType;
  friday: DayScheduleType;
}

export interface SystemControlsConfig {
  isClockInEnabled: boolean;
  isClockOutEnabled: boolean;
  isAttendanceClosedToday: boolean;
  isWfhAttendanceEnabled: boolean;
  emergencyBroadcastActive: boolean;
  emergencyMessage: string;
}

