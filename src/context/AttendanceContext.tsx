import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  AbsenceReason,
  AbsenceRequest,
  AttendanceRecord,
  AttendanceStatus,
  Coordinates,
  DayScheduleType,
  SystemControlsConfig,
  UserProfile,
  WeeklyScheduleConfig,
} from '../types/attendance';
import {
  DYNAMIC_DNA_OFFICE,
  evaluateClockInStatus,
  evaluateWorkingDay,
  generateDailyAccessId,
  isClockOutAllowed,
  isWithinGeofence,
} from '../utils/geoUtils';
import {
  DEFAULT_SYSTEM_CONTROLS,
  DEFAULT_WEEKLY_SCHEDULE,
  INITIAL_ABSENCE_REQUESTS,
  INITIAL_ATTENDANCE_RECORDS,
  INITIAL_LEARNERS,
  TEST_LOCATION_PRESETS,
} from '../data/mockData';

export type LearnerScreenId =
  | 'learner_dashboard'
  | 'learner_attendance'
  | 'learner_history'
  | 'learner_report_absence'
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
  rejectLearnerRegistration: (id: string) => { success: boolean };
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

  // GPS Telemetry
  currentCoordinates: Coordinates;
  selectedPresetId: string;
  setCoordinatesPreset: (presetId: string) => void;
  useBrowserGeolocation: () => Promise<boolean>;
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
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_LEARNERS);
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
  const todayDateString = activeTime.toISOString().split('T')[0];

  // Geofence calculation
  const geofenceResult = isWithinGeofence(
    currentCoordinates,
    DYNAMIC_DNA_OFFICE.coordinates,
    DYNAMIC_DNA_OFFICE.allowedRadiusMeters
  );
  const distanceFromOffice = geofenceResult.distance;
  const isLocationVerified = geofenceResult.isWithin;

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

    // Verified: return or generate Daily Access ID
    const existing = issuedAccessIds[key];
    if (existing) {
      return { dailyAccessId: existing, isDailyAccessVerified: true, accessDeniedMessage: null };
    }

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

  // Today's record for active learner
  const todayRecord = currentUser
    ? attendanceRecords.find(
        (rec) => rec.learnerId === currentUser.id && rec.date === todayDateString
      ) || null
    : null;

  const hasClockedInToday = todayRecord !== null && Boolean(todayRecord.clockInTime);
  const hasClockedOutToday = todayRecord !== null && Boolean(todayRecord.clockOutTime);

  // Role switching
  const switchUserRole = (role: 'learner' | 'admin') => {
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
    // If learner tries to access admin screen, block and route to learner_dashboard
    if (currentUser?.role === 'learner' && screen.startsWith('admin_')) {
      setActiveScreenState('learner_dashboard');
      return;
    }
    // If admin tries to access learner screen, allow or route to admin_dashboard
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

    // Check password if set on profile
    if (password && found.password && found.password !== password) {
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
      error: 'Invalid Access ID. Please enter an authorized administrator Access ID.',
    };
  };

  const submitRegistration = (
    firstName: string,
    lastName: string,
    contactNumber: string,
    password: string
  ): { success: boolean; generatedWorkEmail: string } => {
    const cleanFirst = firstName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanLast = lastName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const generatedWorkEmail = `${cleanFirst}.${cleanLast}@learners.dynamicdna.co.za`;

    const newProfile: UserProfile = {
      id: `lrn_${Date.now()}`,
      learnerNumber: 'PENDING',
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      fullName: `${firstName.trim()} ${lastName.trim()}`,
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

  const rejectLearnerRegistration = (id: string): { success: boolean } => {
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
    firstName: string,
    lastName: string,
    phoneNumber: string,
    workEmail?: string
  ): UserProfile => {
    const existingLearners = users.filter((u) => u.role === 'learner' && u.status === 'active');
    const nextNumber = existingLearners.length + 1;
    const learnerNumber = `DVT-2026-${String(nextNumber).padStart(3, '0')}`;

    const cleanFirst = firstName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanLast = lastName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const computedEmail =
      workEmail?.trim() || `${cleanFirst}.${cleanLast}@learners.dynamicdna.co.za`;

    const newProfile: UserProfile = {
      id: `lrn_${Date.now()}`,
      learnerNumber,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      fullName: `${firstName.trim()} ${lastName.trim()}`,
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
    };
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));
    setCurrentUser(updated);
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

  // GPS Controls
  const setCoordinatesPreset = (presetId: string) => {
    const preset = TEST_LOCATION_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setSelectedPresetId(presetId);
      setCurrentCoordinates(preset.coordinates);
      setGpsAccuracyMeters(preset.coordinates.accuracy || 4);
    }
  };

  const useBrowserGeolocation = async (): Promise<boolean> => {
    if (!navigator.geolocation) return false;
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setSelectedPresetId('browser_gps');
          setCurrentCoordinates({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
          setGpsAccuracyMeters(Math.round(pos.coords.accuracy));
          resolve(true);
        },
        () => resolve(false),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
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

  // Clock-In logic
  const clockIn = (notes?: string): { success: boolean; message: string } => {
    if (!currentUser || currentUser.role !== 'learner') {
      return { success: false, message: 'Authentication required as a learner.' };
    }

    if (systemControls.emergencyBroadcastActive) {
      return { success: false, message: systemControls.emergencyMessage };
    }

    if (!systemControls.isClockInEnabled || systemControls.isAttendanceClosedToday) {
      return { success: false, message: 'Clock-In is currently closed by the Administrator.' };
    }

    if (!workingDayStatus.isWorkingDay) {
      return { success: false, message: workingDayStatus.message || 'Attendance is not required today.' };
    }

    if (hasClockedInToday) {
      return { success: false, message: 'Attendance Already Registered For Today' };
    }

    // Check Office day vs WFH day requirements
    if (todayScheduleType === 'office') {
      if (!isLocationVerified) {
        return {
          success: false,
          message:
            'Attendance Denied. Today is an Office Day. You must be physically present at DynamicDNA.',
        };
      }
    } else {
      if (!systemControls.isWfhAttendanceEnabled) {
        return {
          success: false,
          message: 'Work From Home Attendance is disabled by the Administrator.',
        };
      }
    }

    const clockInEval = evaluateClockInStatus(activeTime);
    if (!clockInEval.isOpen) {
      return { success: false, message: clockInEval.message };
    }

    const accessId = dailyAccessId || generateDailyAccessId(activeTime, currentUser.id);
    const clockInTimeString = activeTime.toTimeString().split(' ')[0];

    const newRecord: AttendanceRecord = {
      id: `att_${Date.now()}`,
      learnerId: currentUser.id,
      learnerNumber: currentUser.learnerNumber,
      learnerName: currentUser.fullName,
      date: todayDateString,
      clockInTime: clockInTimeString,
      status: clockInEval.status, // Strictly 'Present' or 'Late'
      dayType: todayScheduleType,
      verifiedDistanceMeters: todayScheduleType === 'office' ? distanceFromOffice : undefined,
      accessId,
      notes: notes || (todayScheduleType === 'office' ? 'Office Attendance' : 'WFH Attendance'),
    };

    setAttendanceRecords((prev) => [newRecord, ...prev]);
    return {
      success: true,
      message: `Clock-In registered successfully at ${clockInTimeString}. Status: ${clockInEval.status}`,
    };
  };

  // Clock-Out logic
  const clockOut = (): { success: boolean; message: string } => {
    if (!currentUser || currentUser.role !== 'learner') {
      return { success: false, message: 'Authentication required.' };
    }

    if (!systemControls.isClockOutEnabled) {
      return { success: false, message: 'Clock-Out is disabled by the Administrator.' };
    }

    if (!hasClockedInToday || !todayRecord) {
      return { success: false, message: 'Cannot clock out: No clock-in recorded for today.' };
    }

    if (hasClockedOutToday) {
      return { success: false, message: 'Clock-Out has already been registered for today.' };
    }

    const clockOutEval = isClockOutAllowed(activeTime);
    if (!clockOutEval.allowed) {
      return { success: false, message: clockOutEval.message };
    }

    const clockOutTimeString = activeTime.toTimeString().split(' ')[0];

    setAttendanceRecords((prev) =>
      prev.map((rec) => {
        if (rec.id === todayRecord.id) {
          return {
            ...rec,
            clockOutTime: clockOutTimeString,
          };
        }
        return rec;
      })
    );

    return {
      success: true,
      message: `Clock-Out recorded successfully at ${clockOutTimeString}.`,
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

  // Schedule Management actions
  const updateWeeklySchedule = (newSchedule: WeeklyScheduleConfig) => {
    setWeeklySchedule(newSchedule);
  };

  const setScheduleOverride = (dateStr: string, dayType: DayScheduleType) => {
    setScheduleOverrides((prev) => ({ ...prev, [dateStr]: dayType }));
  };

  const resetSchedule = () => {
    setWeeklySchedule(DEFAULT_WEEKLY_SCHEDULE);
    setScheduleOverrides({});
  };

  const convertTodaySchedule = (type: DayScheduleType) => {
    setScheduleOverrides((prev) => ({ ...prev, [todayDateString]: type }));
  };

  const updateSystemControls = (updater: Partial<SystemControlsConfig>) => {
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
        currentCoordinates,
        selectedPresetId,
        setCoordinatesPreset,
        useBrowserGeolocation,
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
