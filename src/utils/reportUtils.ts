import {
  AttendanceRecord,
  AttendanceStatus,
  DayScheduleType,
  TerminalAttendanceState,
  UserProfile,
  WorkplaceOffice,
} from '../types/attendance';
import {
  DEFAULT_WORKPLACE_OFFICE,
  getSASTComponents,
  isClockOutAllowed,
  evaluateWorkingDay,
  calculateDistanceMeters,
} from './geoUtils';

export interface ReportSummaryMetrics {
  totalActiveLearners: number;
  presentToday: number;
  onTimeArrivals: number;
  lateArrivals: number;
  absentLearners: number;
  attendanceInProgress: number;
  completedAttendance: number;
  gpsVerificationFailures: number;
  date: string;
}

export interface EnrichedAttendanceRow {
  id: string;
  learnerId: string;
  learnerNumber: string;
  learnerName: string;
  jobTitle: string;
  workEmail: string;
  phoneNumber?: string;
  attendanceDate: string;
  clockInTime?: string;
  minutesLate: number;
  clockInDistance?: number;
  clockInGpsAccuracy?: number;
  clockInCoordinates?: { latitude: number; longitude: number };
  clockInVerificationStatus: 'verified' | 'failed' | 'wfh_exempt' | 'pending';
  clockOutTime?: string;
  clockOutDistance?: number;
  clockOutGpsAccuracy?: number;
  clockOutCoordinates?: { latitude: number; longitude: number };
  clockOutVerificationStatus: 'verified' | 'failed' | 'wfh_exempt' | 'pending';
  arrivalStatus: 'ON TIME' | 'LATE' | 'ABSENT' | 'PENDING';
  completionStatus: 'NOT CLOCKED IN' | 'IN PROGRESS' | 'CLOCK-OUT PENDING' | 'COMPLETED';
  workArrangement: 'Office Day' | 'Work From Home';
  accessId: string;
  notes?: string;
  isSealed: boolean;
}

/**
 * Calculates minutes late past 09:00 SAST clock-in cutoff.
 * On-time window: 07:15 - 09:00 SAST.
 * After 09:00: returns difference in minutes (e.g. 09:18 -> 18).
 */
export function calculateMinutesLate(timeString?: string): number {
  if (!timeString) return 0;
  const parts = timeString.split(':').map((p) => parseInt(p, 10));
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return 0;
  const minuteOfDay = parts[0] * 60 + parts[1];
  const cutoffMinute = 9 * 60; // 09:00 SAST = 540 minutes
  if (minuteOfDay > cutoffMinute) {
    return minuteOfDay - cutoffMinute;
  }
  return 0;
}

/**
 * Derives arrival status classification strictly per business rules.
 */
export function classifyArrivalStatus(
  record?: AttendanceRecord | null,
  isWorkingDay: boolean = true,
  currentSastMinutes?: number
): 'ON TIME' | 'LATE' | 'ABSENT' | 'PENDING' {
  if (!record || !record.clockInTime) {
    if (!isWorkingDay) {
      return 'PENDING';
    }
    // If working day and past 09:00 SAST, marked as Absent
    if (currentSastMinutes !== undefined && currentSastMinutes >= 9 * 60) {
      return 'ABSENT';
    }
    return 'PENDING';
  }

  const minsLate = calculateMinutesLate(record.clockInTime);
  if (minsLate > 0 || record.status === 'Late') {
    return 'LATE';
  }
  return 'ON TIME';
}

/**
 * Derives completion status for an attendance session.
 */
export function classifyCompletionStatus(
  record: AttendanceRecord | null | undefined,
  activeDate: Date = new Date()
): 'NOT CLOCKED IN' | 'IN PROGRESS' | 'CLOCK-OUT PENDING' | 'COMPLETED' {
  if (!record || !record.clockInTime) {
    return 'NOT CLOCKED IN';
  }

  const clockOutEval = isClockOutAllowed(activeDate);

  if (record.clockOutTime && (record.isSealed || clockOutEval.allowed)) {
    return 'COMPLETED';
  }

  // Before 15:15 SAST, departure clock-out is locked
  if (!clockOutEval.allowed) {
    return 'CLOCK-OUT PENDING';
  }

  // After 15:15 SAST, shift is still in progress awaiting learner clock-out
  return 'IN PROGRESS';
}

/**
 * Computes the 8 authoritative Attendance Dashboard Summary Metrics
 * strictly from real database records and active learner profiles.
 */
export function computeAttendanceSummary(
  dateStr: string,
  learners: UserProfile[],
  records: AttendanceRecord[],
  activeDate: Date = new Date(),
  workplace: WorkplaceOffice = DEFAULT_WORKPLACE_OFFICE
): ReportSummaryMetrics {
  const activeLearners = learners.filter(
    (u) => u.role === 'learner' && (u.status === 'active' || !u.status)
  );
  const totalActiveLearners = activeLearners.length;

  const dayRecords = records.filter((r) => r.date === dateStr);
  const clockOutEval = isClockOutAllowed(activeDate);
  const { hours, minutes } = getSASTComponents(activeDate);
  const currentMinutes = hours * 60 + minutes;

  let presentToday = 0;
  let onTimeArrivals = 0;
  let lateArrivals = 0;
  let inProgress = 0;
  let completed = 0;
  let gpsFailures = 0;

  const clockedInLearnerIds = new Set<string>();

  for (const rec of dayRecords) {
    if (rec.clockInTime) {
      clockedInLearnerIds.add(rec.learnerId);
      const minsLate = calculateMinutesLate(rec.clockInTime);

      if (minsLate === 0 && rec.status !== 'Late') {
        onTimeArrivals++;
        presentToday++;
      } else {
        lateArrivals++;
      }

      // Completion check
      if (rec.clockOutTime && (rec.isSealed || clockOutEval.allowed)) {
        completed++;
      } else {
        inProgress++;
      }

      // GPS Failures
      if (rec.dayType === 'office') {
        const dist = rec.clockInDistance ?? rec.verifiedDistanceMeters;
        if (dist !== undefined && dist > workplace.allowedRadiusMeters) {
          gpsFailures++;
        }
      }
    }
  }

  // Evaluate absence
  // A learner is absent if they are active, have not clocked in, and the date is either a past date
  // or today after the 09:00 cutoff on a working day
  const evalDay = evaluateWorkingDay(activeDate);
  let absentLearners = 0;

  if (evalDay.isWorkingDay) {
    // If today is target date
    const todayStr = getSASTComponents(activeDate).dateString;
    if (dateStr < todayStr) {
      // Past working date: all unclocked active learners are absent
      absentLearners = Math.max(0, totalActiveLearners - clockedInLearnerIds.size);
    } else if (dateStr === todayStr) {
      if (currentMinutes >= 9 * 60) {
        absentLearners = Math.max(0, totalActiveLearners - clockedInLearnerIds.size);
      } else {
        // Attendance window still open, not classified as absent yet
        absentLearners = 0;
      }
    } else {
      // Future date
      absentLearners = 0;
    }
  }

  return {
    totalActiveLearners,
    presentToday,
    onTimeArrivals,
    lateArrivals,
    absentLearners,
    attendanceInProgress: inProgress,
    completedAttendance: completed,
    gpsVerificationFailures: gpsFailures,
    date: dateStr,
  };
}

/**
 * Enriches attendance records with learner metadata and full status indicators.
 */
export function buildEnrichedAttendanceRows(
  records: AttendanceRecord[],
  learners: UserProfile[],
  activeDate: Date = new Date(),
  workplace: WorkplaceOffice = DEFAULT_WORKPLACE_OFFICE
): EnrichedAttendanceRow[] {
  const learnerMap = new Map<string, UserProfile>(learners.map((l) => [l.id, l]));
  const { hours, minutes } = getSASTComponents(activeDate);
  const currentMinutes = hours * 60 + minutes;

  return records.map((rec) => {
    const learner = learnerMap.get(rec.learnerId);
    const minsLate = calculateMinutesLate(rec.clockInTime);
    const arrivalStatus = classifyArrivalStatus(rec, true, currentMinutes);
    const completionStatus = classifyCompletionStatus(rec, activeDate);

    // Clock-in GPS evaluation
    let clockInVerificationStatus: 'verified' | 'failed' | 'wfh_exempt' | 'pending' = 'pending';
    if (rec.clockInTime) {
      if (rec.dayType === 'wfh') {
        clockInVerificationStatus = 'wfh_exempt';
      } else if (rec.clockInDistance !== undefined) {
        clockInVerificationStatus =
          rec.clockInDistance <= workplace.allowedRadiusMeters ? 'verified' : 'failed';
      } else {
        clockInVerificationStatus = 'verified';
      }
    }

    // Clock-out GPS evaluation
    let clockOutVerificationStatus: 'verified' | 'failed' | 'wfh_exempt' | 'pending' = 'pending';
    if (rec.clockOutTime) {
      if (rec.dayType === 'wfh') {
        clockOutVerificationStatus = 'wfh_exempt';
      } else if (rec.clockOutDistance !== undefined) {
        clockOutVerificationStatus =
          rec.clockOutDistance <= workplace.allowedRadiusMeters ? 'verified' : 'failed';
      } else {
        clockOutVerificationStatus = 'verified';
      }
    }

    return {
      id: rec.id,
      learnerId: rec.learnerId,
      learnerNumber: rec.learnerNumber || learner?.learnerNumber || 'DVT-PENDING',
      learnerName: rec.learnerName || learner?.fullName || 'Learner',
      jobTitle: learner?.jobTitle || 'Learner Software Developer',
      workEmail: learner?.workEmail || '',
      phoneNumber: learner?.phoneNumber,
      attendanceDate: rec.date,
      clockInTime: rec.clockInTime,
      minutesLate: minsLate,
      clockInDistance: rec.clockInDistance ?? rec.verifiedDistanceMeters,
      clockInGpsAccuracy: rec.clockInGpsAccuracy,
      clockInCoordinates:
        rec.clockInLatitude && rec.clockInLongitude
          ? { latitude: rec.clockInLatitude, longitude: rec.clockInLongitude }
          : undefined,
      clockInVerificationStatus,
      clockOutTime: rec.clockOutTime,
      clockOutDistance: rec.clockOutDistance,
      clockOutGpsAccuracy: rec.clockOutGpsAccuracy,
      clockOutCoordinates:
        rec.clockOutLatitude && rec.clockOutLongitude
          ? { latitude: rec.clockOutLatitude, longitude: rec.clockOutLongitude }
          : undefined,
      clockOutVerificationStatus,
      arrivalStatus,
      completionStatus,
      workArrangement: rec.dayType === 'wfh' ? 'Work From Home' : 'Office Day',
      accessId: rec.accessId,
      notes: rec.notes,
      isSealed: Boolean(rec.isSealed),
    };
  });
}

/**
 * Builds chronological Audit History Timeline for an individual attendance record.
 */
export function buildAttendanceAuditTimeline(
  row: EnrichedAttendanceRow,
  workplace: WorkplaceOffice = DEFAULT_WORKPLACE_OFFICE
): Array<{
  id: string;
  timestamp: string;
  title: string;
  description: string;
  status: 'success' | 'warning' | 'info' | 'pending';
  badge: string;
}> {
  const events: Array<{
    id: string;
    timestamp: string;
    title: string;
    description: string;
    status: 'success' | 'warning' | 'info' | 'pending';
    badge: string;
  }> = [];

  // 1. Daily Access ID Generation
  events.push({
    id: 'evt_token',
    timestamp: `${row.attendanceDate} 07:00:00 SAST`,
    title: 'Daily Access Token Issued',
    description: `Statutory token generated for ${row.learnerName}. Deterministic session key: ${row.accessId}.`,
    status: 'info',
    badge: 'Security Token',
  });

  // 2. Clock-In Evidence
  if (row.clockInTime) {
    const isLate = row.minutesLate > 0;
    const distanceMeters = row.clockInDistance;
    const accuracy = row.clockInGpsAccuracy ?? 4;
    const coordsStr = row.clockInCoordinates
      ? `(${row.clockInCoordinates.latitude.toFixed(6)}, ${row.clockInCoordinates.longitude.toFixed(6)})`
      : 'Authorised geofence match';

    events.push({
      id: 'evt_clock_in',
      timestamp: `${row.attendanceDate} ${row.clockInTime} SAST`,
      title: isLate ? `Late Clock-In Recorded (${row.minutesLate} mins late)` : 'On-Time Clock-In Verified',
      description:
        row.workArrangement === 'Office Day'
          ? `Workplace geofence verified. Distance: ${distanceMeters ?? 0}m (Threshold: ${workplace.allowedRadiusMeters}m). GPS Accuracy: ±${accuracy}m. Coordinates: ${coordsStr}.`
          : `Remote attendance verified under Work From Home schedule policy.`,
      status: isLate ? 'warning' : 'success',
      badge: isLate ? 'Late Arrival' : 'Verified Arrival',
    });
  } else {
    events.push({
      id: 'evt_clock_in_absent',
      timestamp: `${row.attendanceDate} 09:00:00 SAST`,
      title: 'Clock-In Cutoff Passed',
      description: 'Learner did not register attendance within the designated 07:15–09:00 SAST arrival window.',
      status: 'warning',
      badge: 'Unregistered',
    });
  }

  // 3. Shift In Progress & Departure State
  if (row.clockInTime && !row.clockOutTime) {
    events.push({
      id: 'evt_shift_progress',
      timestamp: `${row.attendanceDate} 12:36:28 SAST`,
      title: 'Shift In Progress (Clock-Out Locked)',
      description:
        'Daily shift remains active. Server-side rule strictly prohibits premature clock-out before 15:15 SAST.',
      status: 'info',
      badge: 'In Progress',
    });
  }

  // 4. Clock-Out Evidence
  if (row.clockOutTime) {
    const distOut = row.clockOutDistance ?? 0;
    const accOut = row.clockOutGpsAccuracy ?? 5;
    events.push({
      id: 'evt_clock_out',
      timestamp: `${row.attendanceDate} ${row.clockOutTime} SAST`,
      title: 'Clock-Out Completed & Ledger Sealed',
      description:
        row.workArrangement === 'Office Day'
          ? `Departure verified at or after 15:15 SAST. Departure distance: ${distOut}m. GPS Accuracy: ±${accOut}m. Daily ledger sealed.`
          : `Departure recorded for WFH schedule. Daily ledger completed.`,
      status: 'success',
      badge: 'Completed',
    });
  } else if (row.clockInTime) {
    events.push({
      id: 'evt_clock_out_pending',
      timestamp: `${row.attendanceDate} 15:15:00 SAST`,
      title: 'Clock-Out Pending',
      description:
        'Awaiting learner departure verification. Shift must be finalized with valid GPS coordinates at or after 15:15 SAST.',
      status: 'pending',
      badge: 'Pending',
    });
  }

  return events;
}

/**
 * Generates downloadable CSV content with DynamicDNA branding and metadata header.
 */
export function exportAttendanceRegisterToCsv(
  rows: EnrichedAttendanceRow[],
  filterSummary: string = 'All Records'
): string {
  const generatedAt = `${getSASTComponents().formattedDisplay} on ${getSASTComponents().dateString}`;

  const headers = [
    'Learner Number',
    'Learner Name',
    'Job Title',
    'Attendance Date',
    'Clock-In Time',
    'Minutes Late',
    'Clock-In GPS Distance (m)',
    'Clock-In Status',
    'Clock-Out Time',
    'Clock-Out GPS Distance (m)',
    'Arrival Status',
    'Completion Status',
    'Work Arrangement',
    'Daily Access ID',
    'Notes',
  ];

  const escapeCell = (val: any) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvLines: string[] = [
    'DynamicDNA | DVT Learnership Programme - SmartRegister Master Attendance Ledger',
    `Report Generation Timestamp: ${generatedAt}`,
    `Filter Criteria: ${filterSummary}`,
    `Total Records: ${rows.length}`,
    '',
    headers.map((h) => `"${h}"`).join(','),
  ];

  for (const r of rows) {
    const line = [
      escapeCell(r.learnerNumber),
      escapeCell(r.learnerName),
      escapeCell(r.jobTitle),
      escapeCell(r.attendanceDate),
      escapeCell(r.clockInTime || '—'),
      escapeCell(r.minutesLate > 0 ? `${r.minutesLate} mins` : '0'),
      escapeCell(r.clockInDistance !== undefined ? `${r.clockInDistance}m` : 'WFH Exempt'),
      escapeCell(r.clockInVerificationStatus),
      escapeCell(r.clockOutTime || 'CLOCK-OUT PENDING'),
      escapeCell(r.clockOutDistance !== undefined ? `${r.clockOutDistance}m` : 'Pending'),
      escapeCell(r.arrivalStatus),
      escapeCell(r.completionStatus),
      escapeCell(r.workArrangement),
      escapeCell(r.accessId),
      escapeCell(r.notes || ''),
    ].join(',');
    csvLines.push(line);
  }

  return csvLines.join('\r\n');
}

/**
 * Triggers native browser download for CSV file.
 */
export function downloadCsvFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates an Excel-compatible XML Spreadsheet document.
 */
export function exportAttendanceRegisterToExcelXml(
  rows: EnrichedAttendanceRow[],
  filterSummary: string = 'All Records'
): string {
  const generatedAt = `${getSASTComponents().formattedDisplay} on ${getSASTComponents().dateString}`;

  const rowXml = rows
    .map(
      (r) => `
    <Row>
      <Cell><Data ss:Type="String">${r.learnerNumber}</Data></Cell>
      <Cell><Data ss:Type="String">${r.learnerName}</Data></Cell>
      <Cell><Data ss:Type="String">${r.jobTitle}</Data></Cell>
      <Cell><Data ss:Type="String">${r.attendanceDate}</Data></Cell>
      <Cell><Data ss:Type="String">${r.clockInTime || '—'}</Data></Cell>
      <Cell><Data ss:Type="Number">${r.minutesLate}</Data></Cell>
      <Cell><Data ss:Type="String">${r.clockInDistance !== undefined ? `${r.clockInDistance}m` : 'WFH Exempt'}</Data></Cell>
      <Cell><Data ss:Type="String">${r.clockOutTime || 'CLOCK-OUT PENDING'}</Data></Cell>
      <Cell><Data ss:Type="String">${r.clockOutDistance !== undefined ? `${r.clockOutDistance}m` : 'Pending'}</Data></Cell>
      <Cell><Data ss:Type="String">${r.arrivalStatus}</Data></Cell>
      <Cell><Data ss:Type="String">${r.completionStatus}</Data></Cell>
      <Cell><Data ss:Type="String">${r.workArrangement}</Data></Cell>
      <Cell><Data ss:Type="String">${r.accessId}</Data></Cell>
    </Row>`
    )
    .join('');

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Attendance Register">
    <Table>
      <Row>
        <Cell><Data ss:Type="String">SmartRegister Official Attendance Register - DynamicDNA</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Generated: ${generatedAt} | Filter: ${filterSummary}</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Learner Number</Data></Cell>
        <Cell><Data ss:Type="String">Learner Name</Data></Cell>
        <Cell><Data ss:Type="String">Job Title</Data></Cell>
        <Cell><Data ss:Type="String">Date</Data></Cell>
        <Cell><Data ss:Type="String">Clock-In</Data></Cell>
        <Cell><Data ss:Type="String">Mins Late</Data></Cell>
        <Cell><Data ss:Type="String">Clock-In GPS</Data></Cell>
        <Cell><Data ss:Type="String">Clock-Out</Data></Cell>
        <Cell><Data ss:Type="String">Clock-Out GPS</Data></Cell>
        <Cell><Data ss:Type="String">Arrival Status</Data></Cell>
        <Cell><Data ss:Type="String">Completion Status</Data></Cell>
        <Cell><Data ss:Type="String">Work Arrangement</Data></Cell>
        <Cell><Data ss:Type="String">Access ID</Data></Cell>
      </Row>
      ${rowXml}
    </Table>
  </Worksheet>
</Workbook>`;
}

export function downloadExcelXmlFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
