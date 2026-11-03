import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  AttendanceRecord,
  Coordinates,
  TerminalAttendanceState,
  UserProfile,
  WorkplaceOffice,
} from './src/types/attendance';
import {
  INITIAL_ATTENDANCE_RECORDS,
  INITIAL_LEARNERS,
  DEFAULT_SYSTEM_CONTROLS,
} from './src/data/mockData';
import {
  DEFAULT_WORKPLACE_OFFICE,
  calculateDistanceMeters,
  getSASTComponents,
  isClockOutAllowed,
  evaluateClockInStatus,
  evaluateWorkingDay,
  generateDailyAccessId,
  deriveAttendanceState,
} from './src/utils/geoUtils';
import {
  computeAttendanceSummary,
  buildEnrichedAttendanceRows,
  buildAttendanceAuditTimeline,
  exportAttendanceRegisterToCsv,
} from './src/utils/reportUtils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-Memory Server Attendance Database
let serverAttendanceRecords: AttendanceRecord[] = [...INITIAL_ATTENDANCE_RECORDS];
let serverWorkplaceConfig: WorkplaceOffice = { ...DEFAULT_WORKPLACE_OFFICE };

// Controllable Test Clock State for Automated Testing
// Default: follows real system clock projected to Africa/Johannesburg (SAST)
let testClockOffsetMs = 0;
let testClockFixedTime: Date | null = null;

export function getAuthoritativeServerDate(): Date {
  if (testClockFixedTime) {
    return new Date(testClockFixedTime.getTime());
  }
  return new Date(Date.now() + testClockOffsetMs);
}

export function setTestClock(date: Date | null) {
  testClockFixedTime = date;
  if (!date) {
    testClockOffsetMs = 0;
  }
}

export function setTestClockTime(hours: number, minutes: number, seconds: number = 0) {
  // Construct date on 2026-11-03 in SAST (UTC+2 -> subtract 2 hours for UTC representation)
  const d = new Date(Date.UTC(2026, 10, 3, hours - 2, minutes, seconds, 0));
  testClockFixedTime = d;
}

export function resetServerAttendanceData() {
  serverAttendanceRecords = [...INITIAL_ATTENDANCE_RECORDS];
  testClockFixedTime = null;
  testClockOffsetMs = 0;
}

export function createApp() {
  const app = express();
  app.use(express.json());

  // CORS / API Headers
  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    next();
  });

  // 1. Authoritative Server Time in Africa/Johannesburg (SAST)
  app.get('/api/time', (_req: Request, res: Response) => {
    const serverDate = getAuthoritativeServerDate();
    const sast = getSASTComponents(serverDate);
    const clockOutEval = isClockOutAllowed(serverDate);
    const clockInEval = evaluateClockInStatus(serverDate);

    res.json({
      iso: serverDate.toISOString(),
      sast,
      isClockInOpen: clockInEval.isOpen,
      clockInStatus: clockInEval.status,
      isClockOutAllowed: clockOutEval.allowed,
      clockOutThreshold: '15:15',
      minutesRemainingUntilClockOut: clockOutEval.minutesRemaining,
      serverTimeDisplay: sast.formattedDisplay,
    });
  });

  // 2. Controllable Test Clock API (For Automated Verification)
  app.post('/api/time/test-clock', (req: Request, res: Response) => {
    const { timeString, hours, minutes, seconds, reset } = req.body;

    if (reset) {
      setTestClock(null);
      const serverDate = getAuthoritativeServerDate();
      return res.json({
        success: true,
        message: 'Test clock reset to live system time.',
        serverTime: getSASTComponents(serverDate).formattedDisplay,
      });
    }

    if (typeof hours === 'number' && typeof minutes === 'number') {
      setTestClockTime(hours, minutes, seconds || 0);
    } else if (timeString && typeof timeString === 'string') {
      const parts = timeString.split(':').map((p) => parseInt(p, 10));
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        setTestClockTime(parts[0], parts[1], parts[2] || 0);
      }
    }

    const serverDate = getAuthoritativeServerDate();
    const sast = getSASTComponents(serverDate);
    const clockOutEval = isClockOutAllowed(serverDate);

    res.json({
      success: true,
      message: `Authoritative server clock set to ${sast.formattedDisplay}`,
      serverTime: sast.formattedDisplay,
      sast,
      isClockOutAllowed: clockOutEval.allowed,
    });
  });

  // 3. Learner's Today Attendance Status & Record
  app.get('/api/attendance/today/:learnerId', (req: Request, res: Response) => {
    const { learnerId } = req.params;
    const serverDate = getAuthoritativeServerDate();
    const sast = getSASTComponents(serverDate);
    const todayDateString = sast.dateString;
    const clockOutEval = isClockOutAllowed(serverDate);

    const record = serverAttendanceRecords.find(
      (r) => r.learnerId === learnerId && r.date === todayDateString
    );

    if (!record) {
      const dailyAccessId = generateDailyAccessId(serverDate, learnerId);
      return res.json({
        success: true,
        date: todayDateString,
        serverTime: sast.formattedDisplay,
        record: null,
        attendanceState: 'NOT_CLOCKED_IN' as TerminalAttendanceState,
        isClockOutAllowed: clockOutEval.allowed,
        dailyAccessId,
      });
    }

    // Critical Business Logic:
    // If server time is before 15:15 SAST, clock-out is impossible.
    // Daily attendance MUST remain in progress (CLOCK_OUT_PENDING).
    // An erroneous/future clock-out time is strictly invalidated.
    if (!clockOutEval.allowed && record.clockOutTime) {
      const sanitizedRecord: AttendanceRecord = {
        ...record,
        clockOutTime: undefined,
        clockOutTimestamp: undefined,
        clockOutDistance: undefined,
        isSealed: false,
        attendanceState: 'CLOCK_OUT_PENDING',
      };
      return res.json({
        success: true,
        date: todayDateString,
        serverTime: sast.formattedDisplay,
        record: sanitizedRecord,
        attendanceState: 'CLOCK_OUT_PENDING' as TerminalAttendanceState,
        isClockOutAllowed: false,
        dailyAccessId: record.accessId,
      });
    }

    const state = deriveAttendanceState(record, serverDate);
    res.json({
      success: true,
      date: todayDateString,
      serverTime: sast.formattedDisplay,
      record: {
        ...record,
        attendanceState: state,
      },
      attendanceState: state,
      isClockOutAllowed: clockOutEval.allowed,
      dailyAccessId: record.accessId,
    });
  });

  // 4. Server-Authoritative Clock-In Endpoint
  app.post('/api/attendance/clock-in', (req: Request, res: Response) => {
    const { learnerId, coordinates, notes, scheduleType } = req.body;
    const serverDate = getAuthoritativeServerDate();
    const serverTimestamp = serverDate.toISOString();
    const sast = getSASTComponents(serverDate);
    const todayDateString = sast.dateString;
    const clockInTimeString = sast.timeString;

    const learner = INITIAL_LEARNERS.find((u) => u.id === learnerId);
    if (!learner || learner.role !== 'learner') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: Active learner profile required.',
      });
    }

    // Check duplicate
    const existing = serverAttendanceRecords.find(
      (r) => r.learnerId === learnerId && r.date === todayDateString && r.clockInTime
    );
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Attendance Already Registered For Today. Duplicate clock-in rejected.',
        record: existing,
      });
    }

    // Evaluate clock-in window
    const clockInEval = evaluateClockInStatus(serverDate);
    if (!clockInEval.isOpen) {
      return res.status(400).json({
        success: false,
        error: 'Clock-In terminal is closed (opens at 07:15 SAST).',
      });
    }

    // GPS validation for office days
    const isOffice = (scheduleType || 'office') === 'office';
    let clockInDistance: number | undefined;
    if (isOffice) {
      if (!coordinates || typeof coordinates.latitude !== 'number' || typeof coordinates.longitude !== 'number') {
        return res.status(400).json({
          success: false,
          error: 'Attendance Denied: Physical GPS coordinates required for Office Day.',
        });
      }
      clockInDistance = calculateDistanceMeters(coordinates, serverWorkplaceConfig.coordinates);
      if (clockInDistance > serverWorkplaceConfig.allowedRadiusMeters) {
        return res.status(400).json({
          success: false,
          error: `Attendance Denied. Today is an Office Day. You must be physically present at DynamicDNA (within ${serverWorkplaceConfig.allowedRadiusMeters}m). Current distance: ${clockInDistance}m.`,
          distanceMeters: clockInDistance,
        });
      }
    }

    const accessId = generateDailyAccessId(serverDate, learner.id);
    const newRecord: AttendanceRecord = {
      id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      learnerId: learner.id,
      learnerNumber: learner.learnerNumber,
      learnerName: learner.fullName,
      date: todayDateString,
      clockInTime: clockInTimeString,
      clockInTimestamp: serverTimestamp,
      clockInLatitude: coordinates?.latitude,
      clockInLongitude: coordinates?.longitude,
      clockInGpsAccuracy: coordinates?.accuracy ? Math.round(coordinates.accuracy) : 4,
      clockInDistance,
      status: clockInEval.status,
      dayType: isOffice ? 'office' : 'wfh',
      verifiedDistanceMeters: clockInDistance,
      verificationStatus: isOffice ? 'verified' : 'wfh_exempt',
      accessId,
      isSealed: false,
      attendanceState: 'CLOCK_OUT_PENDING',
      notes: notes || (isOffice ? 'Office Attendance (GPS Verified)' : 'WFH Remote Attendance'),
    };

    serverAttendanceRecords = [newRecord, ...serverAttendanceRecords];

    res.status(201).json({
      success: true,
      message: `Clock-In registered successfully at ${clockInTimeString} SAST. Status: ${clockInEval.status}.`,
      record: newRecord,
      attendanceState: 'CLOCK_OUT_PENDING' as TerminalAttendanceState,
    });
  });

  // 5. Server-Authoritative Clock-Out Endpoint (Strict 15:15 SAST Rule)
  app.post('/api/attendance/clock-out', (req: Request, res: Response) => {
    const { learnerId, coordinates } = req.body;
    const serverDate = getAuthoritativeServerDate();
    const serverTimestamp = serverDate.toISOString();
    const sast = getSASTComponents(serverDate);
    const todayDateString = sast.dateString;
    const clockOutEval = isClockOutAllowed(serverDate);

    // RULE 1: Server-Side Time Enforcement
    // Must never allow clock-out before 15:15 SAST
    if (!clockOutEval.allowed) {
      return res.status(400).json({
        success: false,
        error: `Clock-out is not permitted before 15:15 SAST. Current authoritative time is ${sast.timeString} SAST.`,
        errorCode: 'EARLY_CLOCK_OUT_NOT_PERMITTED',
        attendanceState: 'CLOCK_OUT_PENDING' as TerminalAttendanceState,
        serverTime: sast.formattedDisplay,
        minutesRemaining: clockOutEval.minutesRemaining,
      });
    }

    // RULE 2: Existing Clock-In Verification
    const targetRecord = serverAttendanceRecords.find(
      (r) => r.learnerId === learnerId && r.date === todayDateString
    );

    if (!targetRecord || !targetRecord.clockInTime) {
      return res.status(400).json({
        success: false,
        error: 'Cannot clock out: No clock-in recorded for today.',
        errorCode: 'NO_CLOCK_IN_RECORDED',
      });
    }

    // RULE 3: Duplicate Clock-Out Prevention
    if (targetRecord.clockOutTime && targetRecord.isSealed) {
      return res.status(400).json({
        success: false,
        error: 'Duplicate clock-out rejected. Daily attendance ledger is already completed and sealed.',
        errorCode: 'DUPLICATE_CLOCK_OUT',
        record: targetRecord,
      });
    }

    // RULE 4: GPS Verification for Office Day Departure
    let clockOutDistance: number | undefined;
    if (targetRecord.dayType === 'office') {
      if (coordinates && typeof coordinates.latitude === 'number' && typeof coordinates.longitude === 'number') {
        clockOutDistance = calculateDistanceMeters(coordinates, serverWorkplaceConfig.coordinates);
        if (clockOutDistance > serverWorkplaceConfig.allowedRadiusMeters) {
          return res.status(400).json({
            success: false,
            error: `Clock-Out Denied. Today is an Office Day. You must be physically present at DynamicDNA (within ${serverWorkplaceConfig.allowedRadiusMeters}m). Current distance: ${clockOutDistance}m.`,
            errorCode: 'OUTSIDE_WORKPLACE_RADIUS',
            distanceMeters: clockOutDistance,
          });
        }
      }
    } else if (coordinates && typeof coordinates.latitude === 'number' && typeof coordinates.longitude === 'number') {
      clockOutDistance = calculateDistanceMeters(coordinates, serverWorkplaceConfig.coordinates);
    }

    const clockOutTimeString = sast.timeString;

    // RULE 5: Update record with server-generated clock-out and seal daily ledger
    // Crucial: preserve clockInDistance immutable, store clockOutDistance separately!
    let updatedRecord: AttendanceRecord | null = null;
    serverAttendanceRecords = serverAttendanceRecords.map((r) => {
      if (r.id === targetRecord.id) {
        updatedRecord = {
          ...r,
          clockOutTime: clockOutTimeString,
          clockOutTimestamp: serverTimestamp,
          clockOutDistance,
          clockOutLatitude: coordinates?.latitude,
          clockOutLongitude: coordinates?.longitude,
          clockOutGpsAccuracy: coordinates?.accuracy ? Math.round(coordinates.accuracy) : undefined,
          isSealed: true,
          attendanceState: 'COMPLETED',
        };
        return updatedRecord;
      }
      return r;
    });

    res.json({
      success: true,
      message: `Clock-Out recorded successfully at ${clockOutTimeString} SAST. Shift completed and attendance ledger sealed.`,
      record: updatedRecord,
      attendanceState: 'COMPLETED' as TerminalAttendanceState,
      serverTime: sast.formattedDisplay,
    });
  });

  // 6. Reset Session (For Automated Testing)
  app.post('/api/attendance/reset-today/:learnerId', (req: Request, res: Response) => {
    const { learnerId } = req.params;
    const serverDate = getAuthoritativeServerDate();
    const sast = getSASTComponents(serverDate);
    const todayDateString = sast.dateString;

    serverAttendanceRecords = serverAttendanceRecords.filter(
      (r) => !(r.learnerId === learnerId && r.date === todayDateString)
    );

    res.json({
      success: true,
      message: `Reset attendance record for learner ${learnerId} on ${todayDateString}.`,
    });
  });

  // Role Protection Middleware: Admin Authorization Enforced
  const verifyAdminRole = (req: Request, res: Response, next: () => void) => {
    const role = req.headers['x-user-role'] || req.query.role;
    if (role && role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access Denied: Administrative supervisory privileges required.',
      });
    }
    next();
  };

  // 7. All Records Query (Supervisory Inspection Protected)
  app.get('/api/attendance/records', verifyAdminRole, (_req: Request, res: Response) => {
    res.json({
      success: true,
      count: serverAttendanceRecords.length,
      records: serverAttendanceRecords,
    });
  });

  // 7a. Secure Learner Self-Registration Endpoint (Status = Pending Approval, Role = Learner Only)
  app.post('/api/learners/register', (req: Request, res: Response) => {
    const { firstName, lastName, contactNumber, password } = req.body;
    if (!firstName || !lastName || !contactNumber || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required registration fields.',
      });
    }

    // Role cannot be elevated by client request
    res.status(201).json({
      success: true,
      status: 'pending_approval',
      message: 'Registration submitted successfully. Awaiting administrator approval.',
    });
  });

  // 7b. Secure Profile Update Endpoint (Learner can only update own profile; role/status immutable)
  app.put('/api/learners/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const requestUserId = req.headers['x-user-id'];
    const requestUserRole = req.headers['x-user-role'];

    // Enforce authorization: must be self or admin
    if (requestUserRole !== 'admin' && requestUserId !== id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You may only update your own profile.',
      });
    }

    // Disallow role or status elevation from learner
    if (requestUserRole !== 'admin') {
      delete req.body.role;
      delete req.body.status;
      delete req.body.learnerNumber;
      delete req.body.workEmail;
    }

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      updatedFields: req.body,
    });
  });

  // =========================================================================
  // ADMIN ATTENDANCE REPORTS MODULE API ENDPOINTS
  // Role Protection: Admin Authorization Enforced
  // Timezone Authority: Africa/Johannesburg (SAST)
  // =========================================================================

  // 8. Admin Attendance Summary Metrics (8 Database-Backed Counters)
  app.get('/api/admin/reports/summary', verifyAdminRole, (req: Request, res: Response) => {
    const serverDate = getAuthoritativeServerDate();
    const sast = getSASTComponents(serverDate);
    const dateQuery = typeof req.query.date === 'string' ? req.query.date : sast.dateString;

    const summary = computeAttendanceSummary(
      dateQuery,
      INITIAL_LEARNERS,
      serverAttendanceRecords,
      serverDate,
      serverWorkplaceConfig
    );

    res.json({
      success: true,
      date: dateQuery,
      serverTime: sast.formattedDisplay,
      summary,
    });
  });

  // 9. Daily Attendance Register (Searchable, Filterable, Paginated)
  app.get('/api/admin/reports/register', verifyAdminRole, (req: Request, res: Response) => {
    const serverDate = getAuthoritativeServerDate();
    const sast = getSASTComponents(serverDate);

    const {
      date,
      startDate,
      endDate,
      search,
      arrivalStatus,
      completionStatus,
      arrangement,
      gpsStatus,
      programme,
      page = '1',
      pageSize = '10',
    } = req.query;

    // Enriched rows from active database
    let rows = buildEnrichedAttendanceRows(
      serverAttendanceRecords,
      INITIAL_LEARNERS,
      serverDate,
      serverWorkplaceConfig
    );

    // Filter by single date or date range
    if (typeof date === 'string' && date.trim()) {
      rows = rows.filter((r) => r.attendanceDate === date.trim());
    } else {
      if (typeof startDate === 'string' && startDate.trim()) {
        rows = rows.filter((r) => r.attendanceDate >= startDate.trim());
      }
      if (typeof endDate === 'string' && endDate.trim()) {
        rows = rows.filter((r) => r.attendanceDate <= endDate.trim());
      }
    }

    // Filter by search query
    if (typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          r.learnerName.toLowerCase().includes(q) ||
          r.learnerNumber.toLowerCase().includes(q) ||
          r.jobTitle.toLowerCase().includes(q) ||
          r.accessId.toLowerCase().includes(q) ||
          r.attendanceDate.includes(q)
      );
    }

    // Filter by Arrival Status
    if (typeof arrivalStatus === 'string' && arrivalStatus !== 'all') {
      rows = rows.filter((r) => r.arrivalStatus.toUpperCase() === arrivalStatus.toUpperCase());
    }

    // Filter by Completion Status
    if (typeof completionStatus === 'string' && completionStatus !== 'all') {
      rows = rows.filter((r) => r.completionStatus.toUpperCase() === completionStatus.toUpperCase());
    }

    // Filter by Work Arrangement
    if (typeof arrangement === 'string' && arrangement !== 'all') {
      if (arrangement === 'office') {
        rows = rows.filter((r) => r.workArrangement === 'Office Day');
      } else if (arrangement === 'wfh') {
        rows = rows.filter((r) => r.workArrangement === 'Work From Home');
      }
    }

    // Filter by GPS Status
    if (typeof gpsStatus === 'string' && gpsStatus !== 'all') {
      rows = rows.filter((r) => r.clockInVerificationStatus === gpsStatus);
    }

    // Sort descending by date, then learner number
    rows.sort((a, b) => {
      const dateCmp = b.attendanceDate.localeCompare(a.attendanceDate);
      if (dateCmp !== 0) return dateCmp;
      return a.learnerNumber.localeCompare(b.learnerNumber);
    });

    const total = rows.length;
    const p = Math.max(1, parseInt(page as string, 10) || 1);
    const size = Math.max(1, parseInt(pageSize as string, 10) || 10);
    const totalPages = Math.ceil(total / size) || 1;
    const startIndex = (p - 1) * size;
    const paginatedRecords = rows.slice(startIndex, startIndex + size);

    res.json({
      success: true,
      total,
      page: p,
      pageSize: size,
      totalPages,
      records: paginatedRecords,
      serverTime: sast.formattedDisplay,
    });
  });

  // 10. Individual Attendance Details & Audit Log
  app.get('/api/admin/reports/record/:id', verifyAdminRole, (req: Request, res: Response) => {
    const { id } = req.params;
    const serverDate = getAuthoritativeServerDate();

    const rows = buildEnrichedAttendanceRows(
      serverAttendanceRecords,
      INITIAL_LEARNERS,
      serverDate,
      serverWorkplaceConfig
    );

    const targetRow = rows.find((r) => r.id === id);
    if (!targetRow) {
      return res.status(404).json({
        success: false,
        error: `Attendance record with ID ${id} not found.`,
      });
    }

    const learner = INITIAL_LEARNERS.find((l) => l.id === targetRow.learnerId);
    const auditTimeline = buildAttendanceAuditTimeline(targetRow, serverWorkplaceConfig);

    res.json({
      success: true,
      record: targetRow,
      learner: learner || null,
      auditTimeline,
      workplace: serverWorkplaceConfig,
    });
  });

  // 11. Export Attendance Register Data
  app.get('/api/admin/reports/export', verifyAdminRole, (req: Request, res: Response) => {
    const serverDate = getAuthoritativeServerDate();
    const { format = 'csv', date, startDate, endDate, search } = req.query;

    let rows = buildEnrichedAttendanceRows(
      serverAttendanceRecords,
      INITIAL_LEARNERS,
      serverDate,
      serverWorkplaceConfig
    );

    if (typeof date === 'string' && date.trim()) {
      rows = rows.filter((r) => r.attendanceDate === date.trim());
    } else {
      if (typeof startDate === 'string' && startDate.trim()) {
        rows = rows.filter((r) => r.attendanceDate >= startDate.trim());
      }
      if (typeof endDate === 'string' && endDate.trim()) {
        rows = rows.filter((r) => r.attendanceDate <= endDate.trim());
      }
    }

    if (typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          r.learnerName.toLowerCase().includes(q) ||
          r.learnerNumber.toLowerCase().includes(q) ||
          r.jobTitle.toLowerCase().includes(q)
      );
    }

    if (format === 'csv') {
      const csvContent = exportAttendanceRegisterToCsv(
        rows,
        date ? `Single Date: ${date}` : `Date Range: ${startDate || 'Start'} to ${endDate || 'End'}`
      );
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="smartregister_${Date.now()}.csv"`);
      return res.send(csvContent);
    }

    res.json({
      success: true,
      count: rows.length,
      records: rows,
    });
  });

  return app;
}

async function startServer() {
  const app = createApp();
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[SmartRegister Server] Listening on http://0.0.0.0:${port} (Authoritative Timezone: Africa/Johannesburg)`);
  });
}

if (process.env.NODE_ENV !== 'test' && !process.env.TEST_RUNNER) {
  startServer().catch((err) => {
    console.error('Failed to start SmartRegister full-stack server:', err);
  });
}
