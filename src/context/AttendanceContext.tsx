import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  AbsenceReason,
  AbsenceRequest,
  AttendanceRecord,
  AttendanceStatus,
  Coordinates,
  DayScheduleType,
  LocationVerificationResult,
  SystemControlsConfig,
  TerminalAttendanceState,
  UserProfile,
  WeeklyScheduleConfig,
  WorkplaceAuditLog,
  WorkplaceOffice,
} from '../types/attendance';
import {
  DEFAULT_WORKPLACE_OFFICE,
  DYNAMIC_DNA_OFFICE,
  calculateDistanceMeters,
  deriveAttendanceState,
  evaluateClockInStatus,
  evaluateWorkingDay,
  generateDailyAccessId,
  getSASTComponents,
  isClockOutAllowed,
  isWithinGeofence,
  verifyLocationAgainstWorkplace,
} from '../utils/geoUtils';
import {
  DEFAULT_SYSTEM_CONTROLS,
  DEFAULT_WEEKLY_SCHEDULE,
  INITIAL_ABSENCE_REQUESTS,
  INITIAL_ATTENDANCE_RECORDS,
  INITIAL_LEARNERS,
  TEST_LOCATION_PRESETS,
} from '../data/mockData';
import { toProperCase, generateWorkEmail } from '../utils/nameUtils';
import { attendanceVerificationService } from '../services/attendanceVerificationService';

export type LearnerScreenId =
  | 'learner_dashboard'
  | 'learner_attendance'
  | 'learner_history'
  | 'learner_report_absence'
  | 'learner_directory'
  | 'learner_profile';

export type AdminScreenId =
  | 'admin_dashboard'
  | 'admin_learners'
  | 'admin_attendance'
  | 'admin_absence_requests'
  | 'admin_register_downloads'
  | 'admin_system_controls'
  | 'admin_schedule_management'
  | 'admin_settings';

export type ScreenId = LearnerScreenId | AdminScreenId | 'specs_documentation';

interface AttendanceContextType {
  // User & Role
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  users: UserProfile[];
  activeScreen: ScreenId;
  setActiveScreen: (screen: ScreenId) => void;
  switchUserRole: (role: 'learner' | 'admin') => void;
  // Authentication & Registration Workflow
  loginLearner: (
    workEmail: string,
    password?: string
  ) => { success: boolean; isPendingApproval?: boolean; error?: string };
  adminLoginWithAccessId: (accessId: string) => { success: boolean; error?: string };
  submitRegistration: (
    firstName: string,
    lastName: string,
    contactNumber: string,
    password: string
  ) => { success: boolean; generatedWorkEmail: string };
  approveLearnerRegistration: (id: string) => { success: boolean; learnerNumber: string };
  rejectLearnerRegistration: (id: string, reason?: string) => { success: boolean };
  pendingRegistrations: UserProfile[];

  // Legacy/Compatibility Auth
  loginWithWorkEmail: (email: string) => { success: boolean; error?: string };
  adminLoginWithEmail: (email: string) => { success: boolean; error?: string };
  logout: () => void;
  registerLearnerProfile: (
    firstName: string,
    lastName: string,
    phoneNumber: string,
    workEmail?: string
  ) => UserProfile;
  updateProfileDetails: (phoneNumber: string, avatarUrl?: string) => void;
  updateLearnerProfile: (
    id: string,
    updates: Partial<UserProfile>
  ) => { success: boolean; error?: string };
  toggleLearnerStatus: (id: string) => void;
  editLearner: (updated: UserProfile) => void;

  // Time & Working Day
  currentTime: Date;
  isSimulatedTime: boolean;
  setSimulatedTime: (date: Date | null) => void;
  workingDayStatus: {
    isWorkingDay: boolean;
    isWeekend: boolean;
    isPublicHoliday: boolean;
    holidayName?: string;
    message?: string;
  };

  // Schedule Configuration
  weeklySchedule: WeeklyScheduleConfig;
  scheduleOverrides: Record<string, DayScheduleType>;
  updateWeeklySchedule: (newSchedule: WeeklyScheduleConfig) => void;
  setScheduleOverride: (dateStr: string, dayType: DayScheduleType) => void;
  resetSchedule: () => void;
  getScheduleForDate: (date: Date) => DayScheduleType;
  todayScheduleType: DayScheduleType;

  // Authorised Workplace Configuration & Audit
  workplaceConfig: WorkplaceOffice;
  workplaceAuditLogs: WorkplaceAuditLog[];
  updateWorkplaceConfig: (updates: Partial<WorkplaceOffice>, reason?: string) => void;
  resetWorkplaceConfig: () => void;

  // GPS Telemetry & Verification
  currentCoordinates: Coordinates;
  selectedPresetId: string;
  setCoordinatesPreset: (presetId: string) => void;
  useBrowserGeolocation: () => Promise<boolean>;
  captureAndVerifyLocation: () => Promise<LocationVerificationResult>;
  locationVerificationResult: LocationVerificationResult | null;
  isCapturingLocation: boolean;
  lastLocationCapturedAt: string | null;
  distanceFromOffice: number;
  isLocationVerified: boolean;
  gpsAccuracyMeters: number;

  // Daily Access ID & Verification
  dailyAccessId: string | null;
  isDailyAccessVerified: boolean;
  accessDeniedMessage: string | null;
  refreshDailyAccessId: () => void;

  // System Controls
  systemControls: SystemControlsConfig;
  updateSystemControls: (updater: Partial<SystemControlsConfig>) => void;
  convertTodaySchedule: (type: DayScheduleType) => void;

  // Attendance Records & Actions
  attendanceRecords: AttendanceRecord[];
  todayRecord: AttendanceRecord | null;
  attendanceState: TerminalAttendanceState;
  sastTimeString: string;
  hasClockedInToday: boolean;
  hasClockedOutToday: boolean;
  clockIn: (notes?: string) => { success: boolean; message: string };
  clockOut: () => { success: boolean; message: string };

  // Absence Reporting
  absenceRequests: AbsenceRequest[];
  submitAbsenceRequest: (date: string, reason: AbsenceReason, comments: string) => void;
  reviewAbsenceRequest: (requestId: string, status: 'Approved' | 'Rejected') => void;

  // Mobile Device Frame Simulation
  isMobileDeviceView: boolean;
  setIsMobileDeviceView: (val: boolean) => void;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('smartregister_learners_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const idMap = new Map<string, UserProfile>(parsed.map((p: UserProfile) => [p.id, p]));
          const merged = INITIAL_LEARNERS.map((init) => {
            const existing = idMap.get(init.id);
            if (!existing) return init;
            return {
              ...init,
              ...existing,
              jobTitle: existing.jobTitle || init.jobTitle,
              profilePictureUrl: existing.profilePictureUrl || init.profilePictureUrl,
              linkedInUrl: existing.linkedInUrl !== undefined ? existing.linkedInUrl : init.linkedInUrl,
              gitHubUrl: existing.gitHubUrl !== undefined ? existing.gitHubUrl : init.gitHubUrl,
            };
          });
          const initIds = new Set(INITIAL_LEARNERS.map((i) => i.id));
          const custom = parsed.filter((p: UserProfile) => !initIds.has(p.id));
          return [...merged, ...custom];
        }
      }
    } catch (e) {
      console.warn('localStorage read error', e);
    }
    return INITIAL_LEARNERS;
  });
  // Default unauthenticated so user starts on the Microsoft 365 style sign-in flow
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeScreen, setActiveScreenState] = useState<ScreenId>('learner_dashboard');

  // Schedule & Overrides
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklyScheduleConfig>(DEFAULT_WEEKLY_SCHEDULE);
  const [scheduleOverrides, setScheduleOverrides] = useState<Record<string, DayScheduleType>>({});

  // System Controls
  const [systemControls, setSystemControls] = useState<SystemControlsConfig>(DEFAULT_SYSTEM_CONTROLS);

  // Attendance & Absence Records
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE_RECORDS);
  const [absenceRequests, setAbsenceRequests] = useState<AbsenceRequest[]>(INITIAL_ABSENCE_REQUESTS);

  // Time & Simulation
  const [simulatedTime, setSimulatedTimeState] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isMobileDeviceView, setIsMobileDeviceView] = useState<boolean>(false);

  // GPS Telemetry State (defaults to Inside DynamicDNA Lab 25m)
  const defaultPreset = TEST_LOCATION_PRESETS[0];
  const [selectedPresetId, setSelectedPresetId] = useState<string>(defaultPreset.id);
  const [currentCoordinates, setCurrentCoordinates] = useState<Coordinates>(defaultPreset.coordinates);
  const [gpsAccuracyMeters, setGpsAccuracyMeters] = useState<number>(defaultPreset.coordinates.accuracy || 4);
  const [isCapturingLocation, setIsCapturingLocation] = useState<boolean>(false);
  const [lastLocationCapturedAt, setLastLocationCapturedAt] = useState<string | null>(null);

  // Authorised Workplace Configuration (Persisted)
  const [workplaceConfig, setWorkplaceConfig] = useState<WorkplaceOffice>(() => {
    try {
      const saved = localStorage.getItem('smartregister_workplace_config');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed reading workplace config from localStorage', e);
    }
    return DEFAULT_WORKPLACE_OFFICE;
  });

  // Workplace Audit Logs
  const [workplaceAuditLogs, setWorkplaceAuditLogs] = useState<WorkplaceAuditLog[]>(() => {
    try {
      const saved = localStorage.getItem('smartregister_workplace_audit_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed reading workplace audit logs', e);
    }
    return [
      {
        id: 'log_init_01',
        timestamp: '2026-11-01T08:00:00.000Z',
        adminId: 'adm_001',
        adminName: 'Thabo Mokoena (DVT Supervisor)',
        action: 'FULL_CONFIG_UPDATE',
        details: 'Initial configuration: DynamicDNA Campus coordinates set to (-26.097841, 27.998357) with 100m radius and 30m accuracy threshold.',
        changes: [
          { field: 'name', oldValue: 'Unassigned', newValue: 'DynamicDNA Campus' },
          { field: 'allowedRadiusMeters', oldValue: 0, newValue: 100 },
          { field: 'gpsAccuracyThresholdMeters', oldValue: 0, newValue: 30 },
          { field: 'isActive', oldValue: false, newValue: true },
        ],
      },
    ];
  });

  // Location Verification Result (Initialized for default coordinates)
  const [locationVerificationResult, setLocationVerificationResult] = useState<LocationVerificationResult | null>(() => {
    return verifyLocationAgainstWorkplace(defaultPreset.coordinates, DEFAULT_WORKPLACE_OFFICE);
  });

  // Daily Access IDs store per user per date: { [userId_dateStr]: string }
  const [issuedAccessIds, setIssuedAccessIds] = useState<Record<string, string>>({
    'lrn_001_2026-11-02': 'SR-20261102-X7K4Q',
    'lrn_002_2026-11-02': 'SR-20261102-M9L2P',
  });

  // Ticking time
  useEffect(() => {
    const timer = setInterval(() => {
      if (simulatedTime) {
        setSimulatedTimeState((prev) => (prev ? new Date(prev.getTime() + 1000) : null));
      } else {
        setCurrentTime(new Date());
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [simulatedTime]);

  const activeTime = simulatedTime || currentTime;
  const sastComponents = getSASTComponents(activeTime);
  const todayDateString = sastComponents.dateString;
  const sastTimeString = sastComponents.timeString;

  // Geofence calculation against current workplace configuration
  const geofenceResult = useMemo(() => {
    return isWithinGeofence(
      currentCoordinates,
      workplaceConfig.coordinates,
      workplaceConfig.allowedRadiusMeters
    );
  }, [currentCoordinates, workplaceConfig]);

  const distanceFromOffice = geofenceResult.distance;
  const isAccuracyAcceptable = gpsAccuracyMeters <= workplaceConfig.gpsAccuracyThresholdMeters;
  const isLocationVerified = geofenceResult.isWithin && isAccuracyAcceptable && workplaceConfig.isActive;

  // Working day evaluation
  const workingDayStatus = evaluateWorkingDay(activeTime);

  // Helper to determine day schedule type (office or wfh)
  const getScheduleForDate = (date: Date): DayScheduleType => {
    const dateStr = date.toISOString().split('T')[0];
    if (scheduleOverrides[dateStr]) {
      return scheduleOverrides[dateStr];
    }
    const dayOfWeek = date.getDay(); // 0 Sun, 1 Mon, 2 Tue, 3 Wed, 4 Thu, 5 Fri, 6 Sat
    switch (dayOfWeek) {
      case 1:
        return weeklySchedule.monday;
      case 2:
        return weeklySchedule.tuesday;
      case 3:
        return weeklySchedule.wednesday;
      case 4:
        return weeklySchedule.thursday;
      case 5:
        return weeklySchedule.friday;
      default:
        return 'wfh';
    }
  };

  const todayScheduleType = getScheduleForDate(activeTime);

  // Daily Access ID generation & validation
  // Rule:
  // - If Office Day: GPS verification is REQUIRED. If within 100m -> Generate Access ID. If not -> Denied!
  // - If WFH Day: GPS verification NOT required. Generate Access ID.
  const { dailyAccessId, isDailyAccessVerified, accessDeniedMessage } = useMemo(() => {
    if (!currentUser || currentUser.role !== 'learner') {
      return { dailyAccessId: null, isDailyAccessVerified: true, accessDeniedMessage: null };
    }

    if (!workingDayStatus.isWorkingDay) {
      return {
        dailyAccessId: null,
        isDailyAccessVerified: false,
        accessDeniedMessage: workingDayStatus.message || 'Attendance is not required today.',
      };
    }

    if (systemControls.emergencyBroadcastActive) {
      return {
        dailyAccessId: null,
        isDailyAccessVerified: false,
        accessDeniedMessage: systemControls.emergencyMessage,
      };
    }

    const key = `${currentUser.id}_${todayDateString}`;

    if (todayScheduleType === 'office') {
      if (!isLocationVerified) {
        return {
          dailyAccessId: null,
          isDailyAccessVerified: false,
          accessDeniedMessage:
            'Location Verification Failed. Access Denied. You are outside the authorised attendance zone. Today is an Office Day. You must be physically present at DynamicDNA.',
        };
      }
    } else {
      // WFH day
      if (!systemControls.isWfhAttendanceEnabled) {
        return {
          dailyAccessId: null,
          isDailyAccessVerified: false,
          accessDeniedMessage: 'Work From Home Attendance is temporarily disabled by the Administrator.',
        };
      }
    }

    // Priority 1: If an attendance record already exists for this learner today, its accessId is authoritative
    const existingLedgerRecord = attendanceRecords.find(
      (rec) => rec.learnerId === currentUser.id && rec.date === todayDateString
    );
    if (existingLedgerRecord?.accessId) {
      return { dailyAccessId: existingLedgerRecord.accessId, isDailyAccessVerified: true, accessDeniedMessage: null };
    }

    // Priority 2: Return session-cached access ID if present
    const existing = issuedAccessIds[key];
    if (existing) {
      return { dailyAccessId: existing, isDailyAccessVerified: true, accessDeniedMessage: null };
    }

    // Priority 3: Generate deterministic Daily Access Token for (activeTime, currentUser.id)
    const newId = generateDailyAccessId(activeTime, currentUser.id);
    return { dailyAccessId: newId, isDailyAccessVerified: true, accessDeniedMessage: null };
  }, [
    currentUser,
    todayDateString,
    todayScheduleType,
    isLocationVerified,
    workingDayStatus,
    systemControls,
    issuedAccessIds,
    activeTime,
    attendanceRecords,
  ]);

  // Sync issued access ID to map if newly generated
  useEffect(() => {
    if (currentUser && dailyAccessId) {
      const key = `${currentUser.id}_${todayDateString}`;
      if (!issuedAccessIds[key]) {
        setIssuedAccessIds((prev) => ({ ...prev, [key]: dailyAccessId }));
      }
    }
  }, [currentUser, dailyAccessId, todayDateString, issuedAccessIds]);

  // Raw today's record for active learner
  const rawTodayRecord = currentUser
    ? attendanceRecords.find(
        (rec) => rec.learnerId === currentUser.id && rec.date === todayDateString
      ) || null
    : null;

  // Authoritative Server-Side Time Evaluation for Clock-Out Clearance (15:15 SAST)
  const clockOutCheck = isClockOutAllowed(activeTime);
  const isClockOutAllowedNow = clockOutCheck.allowed;

  // Sanitized todayRecord:
  // Before 15:15 SAST, Clock-Out CANNOT be completed or sealed.
  // The application must never report a successful clock-out (e.g. at 15:40) when authoritative time is before 15:15.
  const todayRecord: AttendanceRecord | null = useMemo(() => {
    if (!rawTodayRecord) return null;

    if (!isClockOutAllowedNow && rawTodayRecord.clockOutTime) {
      // Authoritative business rule: daily attendance must remain IN PROGRESS before 15:15 SAST
      return {
        ...rawTodayRecord,
        clockOutTime: undefined,
        clockOutTimestamp: undefined,
        clockOutDistance: undefined,
        isSealed: false,
        attendanceState: 'CLOCK_OUT_PENDING',
      };
    }

    const state = deriveAttendanceState(rawTodayRecord, activeTime);
    return {
      ...rawTodayRecord,
      attendanceState: state,
    };
  }, [rawTodayRecord, isClockOutAllowedNow, activeTime]);

  // Derived logical attendance states:
  // NOT_CLOCKED_IN | CLOCKED_IN | CLOCK_OUT_PENDING | COMPLETED
  const attendanceState: TerminalAttendanceState = useMemo(() => {
    return deriveAttendanceState(todayRecord, activeTime);
  }, [todayRecord, activeTime]);

  const hasClockedInToday = todayRecord !== null && Boolean(todayRecord.clockInTime);
  const hasClockedOutToday =
    todayRecord !== null && Boolean(todayRecord.clockOutTime) && isClockOutAllowedNow;

  // Role switching (Protected: Admin or unauthenticated only)
  const switchUserRole = (role: 'learner' | 'admin') => {
    // Learners cannot switch to admin or trigger persona change
    if (currentUser && currentUser.role === 'learner') {
      console.warn('Unauthorized role switch attempt blocked for learner.');
      return;
    }
    if (role === 'learner') {
      const learner = users.find((u) => u.role === 'learner') || users[0];
      setCurrentUser(learner);
      setActiveScreenState('learner_dashboard');
    } else {
      const admin = users.find((u) => u.role === 'admin') || users[users.length - 1];
      setCurrentUser(admin);
      setActiveScreenState('admin_dashboard');
    }
  };

  // Screen routing with role guard
  const setActiveScreen = (screen: ScreenId) => {
    // If learner tries to access admin screen or specs documentation, block and keep on learner_dashboard
    if (currentUser?.role === 'learner' && (screen.startsWith('admin_') || screen === 'specs_documentation')) {
      setActiveScreenState('learner_dashboard');
      return;
    }
    setActiveScreenState(screen);
  };

  // Authentication & Registration Workflow
  const loginLearner = (
    workEmail: string,
    password?: string
  ): { success: boolean; isPendingApproval?: boolean; error?: string } => {
    const cleaned = workEmail.trim().toLowerCase();
    const found = users.find(
      (u) =>
        u.workEmail.toLowerCase() === cleaned ||
        (cleaned === 'zwavhuditshivhase144@gmail.com' && u.id === 'lrn_001') ||
        (cleaned.startsWith('zwavhudi') && u.id === 'lrn_001') ||
        u.learnerNumber.toLowerCase() === cleaned
    );

    if (!found) {
      return {
        success: false,
        error: "We couldn't find an account matching that work email address. Please check your spelling or select Create Learner Profile.",
      };
    }

    const DEV_TEST_EMAIL = 'zwavhudi.tshivhase@dynamicdna.co.za';
    const isDevTestAccount =
      cleaned === DEV_TEST_EMAIL ||
      cleaned === 'zwavhudi' ||
      found.workEmail.toLowerCase() === DEV_TEST_EMAIL;

    // For development test account only:
    // Disable validation for Registration Status & Approval Status to allow immediate login.
    // (All attendance rules: GPS, Schedule, Office Day, Time rules remain 100% active).
    if (!isDevTestAccount) {
      if (found.status === 'pending_approval') {
        return {
          success: false,
          isPendingApproval: true,
          error:
            'Your registration request has not yet been approved. Please contact your administrator if approval takes longer than expected.',
        };
      }

      if (found.status === 'rejected') {
        return {
          success: false,
          error:
            'Your registration request was not approved by the administrator. Please contact DynamicDNA administration.',
        };
      }

      if (found.status === 'inactive') {
        return {
          success: false,
          error: 'Your account is deactivated. Please contact your DVT Programme Administrator.',
        };
      }
    }

    // Check password if set on profile
    if (isDevTestAccount) {
      // Dev test account password: dynamic1937 (also fallback to password123 or blank for convenience)
      if (password && password !== 'dynamic1937' && password !== 'password123') {
        return {
          success: false,
          error: 'The password entered is incorrect. Development test account password is dynamic1937.',
        };
      }
    } else if (password && found.password && found.password !== password) {
      return {
        success: false,
        error: 'The password entered is incorrect. Please try again.',
      };
    }

    setCurrentUser(found);
    setActiveScreenState('learner_dashboard');
    return { success: true };
  };

  const adminLoginWithAccessId = (accessId: string): { success: boolean; error?: string } => {
    const cleaned = accessId.trim().toLowerCase();
    const validKeys = [
      'dynamic1937',
      'dvt-adm-001',
      'adm-2026-001',
      'admin',
      'adm',
      'master',
      'thabo.mokoena@dynamicdna.co.za',
      'thabo',
    ];

    const isMatch =
      validKeys.includes(cleaned) ||
      users.some((u) => u.role === 'admin' && (u.learnerNumber.toLowerCase() === cleaned || u.workEmail.toLowerCase() === cleaned));

    if (isMatch) {
      const adminUser = users.find((u) => u.role === 'admin') || INITIAL_LEARNERS.find((u) => u.role === 'admin')!;
      setCurrentUser(adminUser);
      setActiveScreenState('admin_dashboard');
      return { success: true };
    }

    return {
      success: false,
      error: 'Invalid Access ID. Please enter an authorized administrator Access ID (e.g. dynamic1937).',
    };
  };

  const submitRegistration = (
    rawFirstName: string,
    rawLastName: string,
    contactNumber: string,
    password: string
  ): { success: boolean; generatedWorkEmail: string } => {
    // 1. Convert names to Proper Case as per DynamicDNA specifications
    const firstName = toProperCase(rawFirstName);
    const lastName = toProperCase(rawLastName);
    const fullName = `${firstName} ${lastName}`;

    // 2. Generate unique work email: FirstName.LastName@dynamicdna.co.za
    const existingEmails = users.map((u) => u.workEmail);
    const generatedWorkEmail = generateWorkEmail(firstName, lastName, existingEmails);

    const newProfile: UserProfile = {
      id: `lrn_${Date.now()}`,
      learnerNumber: 'PENDING',
      firstName,
      lastName,
      fullName,
      workEmail: generatedWorkEmail,
      phoneNumber: contactNumber.trim(),
      password,
      programme: 'DVT Learnership Programme',
      role: 'learner',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
      status: 'pending_approval',
      dateSubmitted: todayDateString,
    };

    setUsers((prev) => [...prev, newProfile]);
    // Do NOT log in immediately! User awaits administrator review
    return { success: true, generatedWorkEmail };
  };

  const approveLearnerRegistration = (
    id: string
  ): { success: boolean; learnerNumber: string } => {
    // Generate next sequential DVT number
    const activeLearners = users.filter((u) => u.role === 'learner' && u.status === 'active');
    const nextNumber = activeLearners.length + 1;
    const learnerNumber = `DVT-2026-${String(nextNumber).padStart(3, '0')}`;

    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? {
              ...u,
              status: 'active',
              learnerNumber,
              approvedAt: todayDateString,
            }
          : u
      )
    );

    return { success: true, learnerNumber };
  };

  const rejectLearnerRegistration = (id: string, _reason?: string): { success: boolean } => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: 'rejected' } : u))
    );
    return { success: true };
  };

  // Legacy/Compatibility Auth
  const loginWithWorkEmail = (email: string) => loginLearner(email);
  const adminLoginWithEmail = (email: string) => adminLoginWithAccessId(email);

  const logout = () => {
    setCurrentUser(null);
  };

  // Learner profile self-registration
  const registerLearnerProfile = (
    rawFirstName: string,
    rawLastName: string,
    phoneNumber: string,
    workEmail?: string
  ): UserProfile => {
    const existingLearners = users.filter((u) => u.role === 'learner' && u.status === 'active');
    const nextNumber = existingLearners.length + 1;
    const learnerNumber = `DVT-2026-${String(nextNumber).padStart(3, '0')}`;

    const firstName = toProperCase(rawFirstName);
    const lastName = toProperCase(rawLastName);
    const fullName = `${firstName} ${lastName}`;
    const existingEmails = users.map((u) => u.workEmail);
    const computedEmail =
      workEmail?.trim() || generateWorkEmail(firstName, lastName, existingEmails);

    const newProfile: UserProfile = {
      id: `lrn_${Date.now()}`,
      learnerNumber,
      firstName,
      lastName,
      fullName,
      workEmail: computedEmail,
      phoneNumber: phoneNumber.trim(),
      programme: 'DVT Learnership Programme',
      role: 'learner',
      avatarUrl: '/src/assets/images/avatar_learner_lerato_1793615780075.jpg',
      status: 'active',
      dateSubmitted: todayDateString,
      approvedAt: todayDateString,
    };

    setUsers((prev) => [...prev, newProfile]);
    setCurrentUser(newProfile);
    setActiveScreenState('learner_dashboard');
    return newProfile;
  };

  const updateProfileDetails = (phoneNumber: string, avatarUrl?: string) => {
    if (!currentUser) return;
    const updated: UserProfile = {
      ...currentUser,
      phoneNumber: phoneNumber.trim(),
      avatarUrl: avatarUrl || currentUser.avatarUrl,
      profilePictureUrl: avatarUrl || currentUser.profilePictureUrl || currentUser.avatarUrl,
    };
    setUsers((prev) => {
      const next = prev.map((u) => (u.id === currentUser.id ? updated : u));
      try {
        localStorage.setItem('smartregister_learners_v2', JSON.stringify(next));
      } catch (e) {
        console.warn('localStorage save failed', e);
      }
      return next;
    });
    setCurrentUser(updated);
  };

  const updateLearnerProfile = (
    id: string,
    updates: Partial<UserProfile>
  ): { success: boolean; error?: string } => {
    if (!currentUser || currentUser.id !== id) {
      return { success: false, error: 'Unauthorized: You are only permitted to update your own profile.' };
    }

    const existing = users.find((u) => u.id === id);
    if (!existing) {
      return { success: false, error: 'Learner record not found.' };
    }

    const firstName = updates.firstName !== undefined ? updates.firstName.trim() : existing.firstName;
    const lastName = updates.lastName !== undefined ? updates.lastName.trim() : existing.lastName;
    const fullName = `${firstName} ${lastName}`.trim();

    const updated: UserProfile = {
      ...existing,
      firstName,
      lastName,
      fullName,
      phoneNumber: updates.phoneNumber !== undefined ? updates.phoneNumber.trim() : existing.phoneNumber,
      jobTitle: updates.jobTitle !== undefined ? updates.jobTitle.trim() : (existing.jobTitle || 'Software Developer'),
      avatarUrl: updates.avatarUrl || updates.profilePictureUrl || existing.avatarUrl,
      profilePictureUrl: updates.profilePictureUrl || updates.avatarUrl || existing.profilePictureUrl,
      linkedInUrl: updates.linkedInUrl !== undefined ? updates.linkedInUrl.trim() : existing.linkedInUrl,
      gitHubUrl: updates.gitHubUrl !== undefined ? updates.gitHubUrl.trim() : existing.gitHubUrl,
      // Immutable system attributes
      learnerNumber: existing.learnerNumber,
      workEmail: existing.workEmail,
      programme: existing.programme,
      role: existing.role,
      status: existing.status,
    };

    setUsers((prev) => {
      const next = prev.map((u) => (u.id === id ? updated : u));
      try {
        localStorage.setItem('smartregister_learners_v2', JSON.stringify(next));
      } catch (e) {
        console.warn('localStorage save failed', e);
      }
      return next;
    });

    setCurrentUser(updated);
    return { success: true };
  };

  const toggleLearnerStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u
      )
    );
  };

  const editLearner = (updated: UserProfile) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    if (currentUser?.id === updated.id) {
      setCurrentUser(updated);
    }
  };

  // GPS Controls & Verification
  const setCoordinatesPreset = (presetId: string) => {
    const preset = TEST_LOCATION_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setSelectedPresetId(presetId);
      setCurrentCoordinates(preset.coordinates);
      const acc = preset.coordinates.accuracy || 4;
      setGpsAccuracyMeters(acc);
      const timestamp = activeTime.toISOString();
      setLastLocationCapturedAt(timestamp);
      const verification = verifyLocationAgainstWorkplace(preset.coordinates, workplaceConfig, timestamp);
      setLocationVerificationResult(verification);
    }
  };

  const captureAndVerifyLocation = useCallback(async (): Promise<LocationVerificationResult> => {
    setIsCapturingLocation(true);
    const timestamp = activeTime.toISOString();
    setLastLocationCapturedAt(timestamp);

    if (!navigator.geolocation) {
      const fallback = verifyLocationAgainstWorkplace(currentCoordinates, workplaceConfig, timestamp);
      const notSupportedResult: LocationVerificationResult = {
        ...fallback,
        status: 'error',
        message: 'Geolocation API is not supported by your browser environment.',
        errorCode: 'NOT_SUPPORTED',
      };
      setLocationVerificationResult(notSupportedResult);
      setIsCapturingLocation(false);
      return notSupportedResult;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: Coordinates = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          const acc = Math.round(pos.coords.accuracy);
          setSelectedPresetId('browser_gps');
          setCurrentCoordinates(coords);
          setGpsAccuracyMeters(acc);

          const verification = verifyLocationAgainstWorkplace(coords, workplaceConfig, timestamp);
          setLocationVerificationResult(verification);
          setIsCapturingLocation(false);
          resolve(verification);
        },
        (error) => {
          let errMessage = 'Unable to acquire location signal.';
          let errCode: LocationVerificationResult['errorCode'] = 'POSITION_UNAVAILABLE';

          if (error.code === error.PERMISSION_DENIED) {
            errMessage =
              'Location permission denied. Please allow location permissions in your browser to verify physical presence.';
            errCode = 'PERMISSION_DENIED';
          } else if (error.code === error.TIMEOUT) {
            errMessage =
              'Location acquisition timed out. Please check your signal and click Retry Location.';
            errCode = 'TIMEOUT';
          }

          const fallback = verifyLocationAgainstWorkplace(currentCoordinates, workplaceConfig, timestamp);
          const errResult: LocationVerificationResult = {
            ...fallback,
            status: 'error',
            message: errMessage,
            errorCode: errCode,
          };
          setLocationVerificationResult(errResult);
          setIsCapturingLocation(false);
          resolve(errResult);
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    });
  }, [activeTime, currentCoordinates, workplaceConfig]);

  const useBrowserGeolocation = async (): Promise<boolean> => {
    const res = await captureAndVerifyLocation();
    return res.status === 'success';
  };

  // Workplace Configuration Operations (Admin Only)
  const updateWorkplaceConfig = (updates: Partial<WorkplaceOffice>, reason?: string) => {
    if (currentUser?.role !== 'admin') {
      console.warn('Unauthorized: Workplace configuration can only be modified by an administrator.');
      return;
    }
    setWorkplaceConfig((prev) => {
      const nextConfig: WorkplaceOffice = {
        ...prev,
        ...updates,
        coordinates: updates.coordinates
          ? { ...prev.coordinates, ...updates.coordinates }
          : prev.coordinates,
        updatedAt: activeTime.toISOString(),
        updatedBy: currentUser?.fullName || 'Administrator',
      };

      try {
        localStorage.setItem('smartregister_workplace_config', JSON.stringify(nextConfig));
      } catch (e) {
        console.warn('Failed saving workplace config', e);
      }

      // Record audit log entry
      const changes: WorkplaceAuditLog['changes'] = [];
      if (updates.name !== undefined && updates.name !== prev.name) {
        changes.push({ field: 'name', oldValue: prev.name, newValue: updates.name });
      }
      if (
        updates.coordinates?.latitude !== undefined &&
        updates.coordinates.latitude !== prev.coordinates.latitude
      ) {
        changes.push({
          field: 'latitude',
          oldValue: prev.coordinates.latitude,
          newValue: updates.coordinates.latitude,
        });
      }
      if (
        updates.coordinates?.longitude !== undefined &&
        updates.coordinates.longitude !== prev.coordinates.longitude
      ) {
        changes.push({
          field: 'longitude',
          oldValue: prev.coordinates.longitude,
          newValue: updates.coordinates.longitude,
        });
      }
      if (
        updates.allowedRadiusMeters !== undefined &&
        updates.allowedRadiusMeters !== prev.allowedRadiusMeters
      ) {
        changes.push({
          field: 'allowedRadiusMeters',
          oldValue: prev.allowedRadiusMeters,
          newValue: updates.allowedRadiusMeters,
        });
      }
      if (
        updates.gpsAccuracyThresholdMeters !== undefined &&
        updates.gpsAccuracyThresholdMeters !== prev.gpsAccuracyThresholdMeters
      ) {
        changes.push({
          field: 'gpsAccuracyThresholdMeters',
          oldValue: prev.gpsAccuracyThresholdMeters,
          newValue: updates.gpsAccuracyThresholdMeters,
        });
      }
      if (updates.isActive !== undefined && updates.isActive !== prev.isActive) {
        changes.push({ field: 'isActive', oldValue: prev.isActive, newValue: updates.isActive });
      }

      if (changes.length > 0) {
        const newLog: WorkplaceAuditLog = {
          id: `log_${Date.now()}`,
          timestamp: activeTime.toISOString(),
          adminId: currentUser?.id || 'adm_001',
          adminName: currentUser?.fullName || 'Thabo Mokoena (DVT Supervisor)',
          action: 'UPDATE_COORDINATES',
          details:
            reason || `Updated authorized workplace parameters: ${changes.map((c) => c.field).join(', ')}`,
          changes,
        };
        setWorkplaceAuditLogs((logs) => {
          const nextLogs = [newLog, ...logs];
          try {
            localStorage.setItem('smartregister_workplace_audit_logs', JSON.stringify(nextLogs));
          } catch (e) {
            console.warn('Failed saving workplace audit logs', e);
          }
          return nextLogs;
        });
      }

      // Re-verify current coordinates against new configuration
      const rechecked = verifyLocationAgainstWorkplace(currentCoordinates, nextConfig, activeTime.toISOString());
      setLocationVerificationResult(rechecked);

      return nextConfig;
    });
  };

  const resetWorkplaceConfig = () => {
    if (currentUser?.role !== 'admin') {
      console.warn('Unauthorized: Workplace configuration can only be reset by an administrator.');
      return;
    }
    setWorkplaceConfig(DEFAULT_WORKPLACE_OFFICE);
    try {
      localStorage.setItem('smartregister_workplace_config', JSON.stringify(DEFAULT_WORKPLACE_OFFICE));
    } catch (e) {
      console.warn('Failed resetting workplace config', e);
    }
    const resetLog: WorkplaceAuditLog = {
      id: `log_${Date.now()}`,
      timestamp: activeTime.toISOString(),
      adminId: currentUser?.id || 'adm_001',
      adminName: currentUser?.fullName || 'Thabo Mokoena (DVT Supervisor)',
      action: 'RESET_DEFAULT',
      details:
        'Reset workplace coordinates and parameters to official DynamicDNA Campus defaults (-26.097841, 27.998357).',
      changes: [
        {
          field: 'coordinates',
          oldValue: 'Custom',
          newValue: 'DynamicDNA Campus (-26.097841, 27.998357)',
        },
        { field: 'allowedRadiusMeters', oldValue: 'Custom', newValue: 100 },
        { field: 'gpsAccuracyThresholdMeters', oldValue: 'Custom', newValue: 30 },
      ],
    };
    setWorkplaceAuditLogs((logs) => {
      const nextLogs = [resetLog, ...logs];
      try {
        localStorage.setItem('smartregister_workplace_audit_logs', JSON.stringify(nextLogs));
      } catch (e) {
        console.warn('Failed saving workplace audit logs', e);
      }
      return nextLogs;
    });

    const rechecked = verifyLocationAgainstWorkplace(
      currentCoordinates,
      DEFAULT_WORKPLACE_OFFICE,
      activeTime.toISOString()
    );
    setLocationVerificationResult(rechecked);
  };

  const setSimulatedTime = (date: Date | null) => {
    setSimulatedTimeState(date);
    if (!date) {
      setCurrentTime(new Date());
    }
  };

  const refreshDailyAccessId = () => {
    if (currentUser) {
      const key = `${currentUser.id}_${todayDateString}`;
      const newId = generateDailyAccessId(activeTime, currentUser.id);
      setIssuedAccessIds((prev) => ({ ...prev, [key]: newId }));
    }
  };

  // Clock-In logic using Authoritative Verification Service
  const clockIn = (notes?: string): { success: boolean; message: string } => {
    if (!currentUser || currentUser.role !== 'learner') {
      return { success: false, message: 'Authentication required as a learner.' };
    }

    const verification = attendanceVerificationService.verifyClockIn({
      learner: currentUser,
      scheduleType: todayScheduleType,
      coordinates: currentCoordinates,
      capturedTimestamp: lastLocationCapturedAt || activeTime.toISOString(),
      workplace: workplaceConfig,
      existingRecords: attendanceRecords,
      systemControls,
      notes,
      simulatedDate: activeTime,
    });

    if (!verification.success || !verification.record) {
      return {
        success: false,
        message: verification.message,
      };
    }

    setAttendanceRecords((prev) => {
      const nextRecords = [verification.record!, ...prev];
      try {
        localStorage.setItem('smartregister_attendance_records', JSON.stringify(nextRecords));
      } catch (e) {
        console.warn('Failed saving attendance records', e);
      }
      return nextRecords;
    });

    return {
      success: true,
      message: verification.message,
    };
  };

  // Clock-Out logic using Authoritative Verification Service
  const clockOut = (): { success: boolean; message: string } => {
    if (!currentUser || currentUser.role !== 'learner') {
      return { success: false, message: 'Authentication required.' };
    }

    if (!hasClockedInToday || !todayRecord) {
      return { success: false, message: 'Cannot clock out: No clock-in recorded for today.' };
    }

    const verification = attendanceVerificationService.verifyClockOut({
      learner: currentUser,
      existingRecord: todayRecord,
      coordinates: currentCoordinates,
      capturedTimestamp: activeTime.toISOString(),
      workplace: workplaceConfig,
      systemControls,
      simulatedDate: activeTime,
    });

    if (!verification.success) {
      return {
        success: false,
        message: verification.message,
      };
    }

    setAttendanceRecords((prev) => {
      const nextRecords = prev.map((rec) => {
        if (rec.id === todayRecord.id) {
          return {
            ...rec,
            clockOutTime: verification.clockOutTime,
            clockOutTimestamp: verification.clockOutTimestamp,
            clockOutDistance: verification.clockOutDistance,
            clockOutGpsAccuracy: verification.clockOutGpsAccuracy,
            clockOutLatitude: currentCoordinates.latitude,
            clockOutLongitude: currentCoordinates.longitude,
          };
        }
        return rec;
      });
      try {
        localStorage.setItem('smartregister_attendance_records', JSON.stringify(nextRecords));
      } catch (e) {
        console.warn('Failed saving attendance records', e);
      }
      return nextRecords;
    });

    return {
      success: true,
      message: verification.message,
    };
  };

  // Absence Reporting
  const submitAbsenceRequest = (date: string, reason: AbsenceReason, comments: string) => {
    if (!currentUser) return;
    const newRequest: AbsenceRequest = {
      id: `abs_${Date.now()}`,
      learnerId: currentUser.id,
      learnerNumber: currentUser.learnerNumber,
      learnerName: currentUser.fullName,
      date,
      reason,
      comments,
      status: 'Pending',
      submittedAt: activeTime.toISOString().replace('T', ' ').substring(0, 19),
    };
    setAbsenceRequests((prev) => [newRequest, ...prev]);
  };

  const reviewAbsenceRequest = (requestId: string, status: 'Approved' | 'Rejected') => {
    setAbsenceRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            status,
            reviewedBy: currentUser?.fullName || 'Administrator',
            reviewDate: activeTime.toISOString().replace('T', ' ').substring(0, 19),
          };
        }
        return r;
      })
    );

    // If approved, create/update an Absent record in attendance ledger
    if (status === 'Approved') {
      const targetReq = absenceRequests.find((r) => r.id === requestId);
      if (targetReq) {
        setAttendanceRecords((prev) => {
          const exists = prev.find(
            (rec) => rec.learnerId === targetReq.learnerId && rec.date === targetReq.date
          );
          if (exists) {
            return prev.map((rec) =>
              rec.id === exists.id ? { ...rec, status: 'Absent', notes: targetReq.reason } : rec
            );
          }
          const newAbsentRecord: AttendanceRecord = {
            id: `att_${Date.now()}`,
            learnerId: targetReq.learnerId,
            learnerNumber: targetReq.learnerNumber,
            learnerName: targetReq.learnerName,
            date: targetReq.date,
            status: 'Absent',
            dayType: getScheduleForDate(new Date(targetReq.date)),
            accessId: `SR-${targetReq.date.replace(/-/g, '')}-ABS`,
            notes: `Reported Absence: ${targetReq.reason}`,
          };
          return [newAbsentRecord, ...prev];
        });
      }
    }
  };

  // Schedule Management actions (Admin Only)
  const updateWeeklySchedule = (newSchedule: WeeklyScheduleConfig) => {
    if (currentUser?.role !== 'admin') {
      console.warn('Unauthorized: Schedule management requires administrative privileges.');
      return;
    }
    setWeeklySchedule(newSchedule);
  };

  const setScheduleOverride = (dateStr: string, dayType: DayScheduleType) => {
    if (currentUser?.role !== 'admin') {
      console.warn('Unauthorized: Schedule overrides require administrative privileges.');
      return;
    }
    setScheduleOverrides((prev) => ({ ...prev, [dateStr]: dayType }));
  };

  const resetSchedule = () => {
    if (currentUser?.role !== 'admin') {
      console.warn('Unauthorized: Schedule reset requires administrative privileges.');
      return;
    }
    setWeeklySchedule(DEFAULT_WEEKLY_SCHEDULE);
    setScheduleOverrides({});
  };

  const convertTodaySchedule = (type: DayScheduleType) => {
    if (currentUser?.role !== 'admin') {
      console.warn('Unauthorized: Schedule conversion requires administrative privileges.');
      return;
    }
    setScheduleOverrides((prev) => ({ ...prev, [todayDateString]: type }));
  };

  const updateSystemControls = (updater: Partial<SystemControlsConfig>) => {
    if (currentUser?.role !== 'admin') {
      console.warn('Unauthorized: System controls modification requires administrative privileges.');
      return;
    }
    setSystemControls((prev) => ({ ...prev, ...updater }));
  };

  return (
    <AttendanceContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users,
        activeScreen,
        setActiveScreen,
        switchUserRole,
        loginLearner,
        adminLoginWithAccessId,
        submitRegistration,
        approveLearnerRegistration,
        rejectLearnerRegistration,
        pendingRegistrations: users.filter((u) => u.status === 'pending_approval'),
        loginWithWorkEmail,
        adminLoginWithEmail,
        logout,
        registerLearnerProfile,
        updateProfileDetails,
        updateLearnerProfile,
        toggleLearnerStatus,
        editLearner,
        currentTime: activeTime,
        isSimulatedTime: Boolean(simulatedTime),
        setSimulatedTime,
        workingDayStatus,
        weeklySchedule,
        scheduleOverrides,
        updateWeeklySchedule,
        setScheduleOverride,
        resetSchedule,
        getScheduleForDate,
        todayScheduleType,
        workplaceConfig,
        workplaceAuditLogs,
        updateWorkplaceConfig,
        resetWorkplaceConfig,
        currentCoordinates,
        selectedPresetId,
        setCoordinatesPreset,
        useBrowserGeolocation,
        captureAndVerifyLocation,
        locationVerificationResult,
        isCapturingLocation,
        lastLocationCapturedAt,
        distanceFromOffice,
        isLocationVerified,
        gpsAccuracyMeters,
        dailyAccessId,
        isDailyAccessVerified,
        accessDeniedMessage,
        refreshDailyAccessId,
        systemControls,
        updateSystemControls,
        convertTodaySchedule,
        attendanceRecords,
        todayRecord,
        attendanceState,
        sastTimeString,
        hasClockedInToday,
        hasClockedOutToday,
        clockIn,
        clockOut,
        absenceRequests,
        submitAbsenceRequest,
        reviewAbsenceRequest,
        isMobileDeviceView,
        setIsMobileDeviceView,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};
