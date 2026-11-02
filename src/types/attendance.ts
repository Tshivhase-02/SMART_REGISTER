export type UserRole = 'learner' | 'admin';

export type AttendanceStatus = 'Present' | 'Late' | 'Absent';

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
  status: UserAccountStatus;
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

export interface AttendanceRecord {
  id: string;
  learnerId: string;
  learnerNumber: string;
  learnerName: string;
  date: string; // YYYY-MM-DD
  clockInTime?: string; // HH:mm:ss
  clockOutTime?: string; // HH:mm:ss
  status: AttendanceStatus;
  dayType: DayScheduleType; // configured schedule for that day (internal record)
  verifiedDistanceMeters?: number;
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

export interface WorkplaceOffice {
  name: string;
  organization: string;
  programme: string;
  coordinates: Coordinates;
  allowedRadiusMeters: number;
}
