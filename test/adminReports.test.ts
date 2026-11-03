import {
  calculateMinutesLate,
  classifyArrivalStatus,
  classifyCompletionStatus,
  computeAttendanceSummary,
  buildEnrichedAttendanceRows,
  buildAttendanceAuditTimeline,
  exportAttendanceRegisterToCsv,
} from '../src/utils/reportUtils';
import {
  INITIAL_ATTENDANCE_RECORDS,
  INITIAL_LEARNERS,
} from '../src/data/mockData';
import { DEFAULT_WORKPLACE_OFFICE, isClockOutAllowed } from '../src/utils/geoUtils';
import { AttendanceRecord, UserProfile } from '../src/types/attendance';
import { createApp } from '../server';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    console.error(`  ✗ [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
    process.exitCode = 1;
  }
}

function createDateSAST(hours: number, minutes: number, seconds: number = 0, day: number = 3): Date {
  return new Date(Date.UTC(2026, 10, day, hours - 2, minutes, seconds, 0));
}

console.log('================================================================');
console.log('SMARTREGISTER ADMIN ATTENDANCE REPORTS MODULE VERIFICATION');
console.log('Timezone Authority: Africa/Johannesburg (SAST, UTC+2)');
console.log('================================================================\n');

// 1. LATE ARRIVAL CALCULATION (07:15 - 09:00 On-Time, After 09:00 Late)
console.log('1. Testing Late Arrival Calculation and Minutes Late Counter');
{
  assert(calculateMinutesLate('08:14:22') === 0, '08:14:22 is on-time (0 mins late)');
  assert(calculateMinutesLate('08:59:59') === 0, '08:59:59 is on-time (0 mins late)');
  assert(calculateMinutesLate('09:00:00') === 0, '09:00:00 is on-time (0 mins late)');
  assert(calculateMinutesLate('09:01:00') === 1, '09:01:00 is 1 minute late');
  assert(calculateMinutesLate('09:12:05') === 12, '09:12:05 is 12 minutes late');
  assert(calculateMinutesLate('09:18:22') === 18, '09:18:22 is 18 minutes late');
  assert(calculateMinutesLate('09:25:14') === 25, '09:25:14 is 25 minutes late');
  assert(calculateMinutesLate('10:30:00') === 90, '10:30:00 is 90 minutes late');
}

// 2. SUMMARY METRICS COMPUTATION (8 Database-Backed Counters)
console.log('\n2. Testing 8 Real Database-Backed Summary Metrics');
{
  const testDate = createDateSAST(12, 36, 28, 3); // 2026-11-03 12:36:28 SAST
  const summary = computeAttendanceSummary(
    '2026-11-03',
    INITIAL_LEARNERS,
    INITIAL_ATTENDANCE_RECORDS,
    testDate,
    DEFAULT_WORKPLACE_OFFICE
  );

  const activeLearners = INITIAL_LEARNERS.filter((u) => u.role === 'learner' && u.status === 'active');
  assert(summary.totalActiveLearners === activeLearners.length, `Total Active Learners matches: ${summary.totalActiveLearners}`);
  assert(summary.totalActiveLearners > 0, 'Active learners count is positive');
  assert(typeof summary.presentToday === 'number', 'Present today is valid number');
  assert(typeof summary.onTimeArrivals === 'number', 'On-time arrivals is valid number');
  assert(typeof summary.lateArrivals === 'number', 'Late arrivals is valid number');
  assert(typeof summary.absentLearners === 'number', 'Absent learners is valid number');
  assert(typeof summary.attendanceInProgress === 'number', 'Attendance in progress is valid number');
  assert(typeof summary.completedAttendance === 'number', 'Completed attendance is valid number');
  assert(typeof summary.gpsVerificationFailures === 'number', 'GPS failures is valid number');
  assert(
    summary.onTimeArrivals + summary.lateArrivals <= summary.totalActiveLearners,
    'Clocked-in count does not exceed active learners'
  );
}

// 3. SEPARATE AND INDEPENDENT EVIDENCE INTEGRITY
console.log('\n3. Testing Independent GPS Evidence & Historical Lock');
{
  const rows = buildEnrichedAttendanceRows(
    INITIAL_ATTENDANCE_RECORDS,
    INITIAL_LEARNERS,
    createDateSAST(12, 36, 28, 3),
    DEFAULT_WORKPLACE_OFFICE
  );

  const zwavhudiRow = rows.find((r) => r.learnerId === 'lrn_001' && r.attendanceDate === '2026-11-03');
  assert(Boolean(zwavhudiRow), 'Found attendance record for Zwavhudi on 2026-11-03');
  if (zwavhudiRow) {
    assert(zwavhudiRow.clockInDistance === 32, 'Clock-in distance locked at 32 metres');
    assert(zwavhudiRow.clockInTime === '08:22:10', 'Clock-in timestamp locked at 08:22:10');
    assert(zwavhudiRow.completionStatus === 'CLOCK-OUT PENDING', 'At 12:36 SAST, completion status is CLOCK-OUT PENDING');
    assert(zwavhudiRow.clockOutTime === undefined, 'No premature clock-out timestamp recorded');
    assert(zwavhudiRow.arrivalStatus === 'ON TIME', 'Arrival classified as ON TIME');
  }

  const lateRow = rows.find((r) => r.learnerId === 'lrn_003' && r.attendanceDate === '2026-11-03');
  if (lateRow) {
    assert(lateRow.arrivalStatus === 'LATE', 'Kgomotso arrival correctly classified as LATE');
    assert(lateRow.minutesLate === 18, `Minutes late correctly calculated as 18 mins (got ${lateRow.minutesLate})`);
    assert(lateRow.clockInDistance === 45, 'Clock-in distance preserved as 45 metres');
  }
}

// 4. CHRONOLOGICAL AUDIT TRAIL GENERATION
console.log('\n4. Testing Chronological Attendance Audit Timeline');
{
  const rows = buildEnrichedAttendanceRows(
    INITIAL_ATTENDANCE_RECORDS,
    INITIAL_LEARNERS,
    createDateSAST(12, 36, 28, 3),
    DEFAULT_WORKPLACE_OFFICE
  );
  const targetRow = rows[0];
  const timeline = buildAttendanceAuditTimeline(targetRow, DEFAULT_WORKPLACE_OFFICE);
  assert(timeline.length >= 3, `Audit timeline contains ${timeline.length} verifiable events`);
  assert(timeline.some((e) => e.id === 'evt_token'), 'Audit timeline includes security token event');
  assert(timeline.some((e) => e.id.startsWith('evt_clock_in')), 'Audit timeline includes clock-in event');
}

// 5. CSV EXPORT INTEGRITY
console.log('\n5. Testing CSV Export Structure');
{
  const rows = buildEnrichedAttendanceRows(
    INITIAL_ATTENDANCE_RECORDS,
    INITIAL_LEARNERS,
    createDateSAST(12, 36, 28, 3),
    DEFAULT_WORKPLACE_OFFICE
  );
  const csv = exportAttendanceRegisterToCsv(rows, 'Testing Export');
  assert(csv.includes('DynamicDNA | DVT Learnership Programme'), 'CSV includes official header');
  assert(csv.includes('Learner Number'), 'CSV includes column headers');
  assert(csv.includes('DVT-2026-001'), 'CSV includes learner rows');
  assert(csv.includes('CLOCK-OUT PENDING'), 'CSV reflects pending clock-out status');
}

// 6. BACKEND API ENDPOINT VERIFICATION
console.log('\n6. Testing Express Backend Admin Reports Endpoints');
async function runBackendTests() {
  const app = createApp();

  // Test 6.1: Summary Endpoint
  await new Promise<void>((resolve) => {
    const req = {
      headers: { 'x-user-role': 'admin' },
      query: { date: '2026-11-03' },
    } as any;
    const res = {
      json: (data: any) => {
        assert(data.success === true, 'GET /api/admin/reports/summary returned success: true');
        assert(typeof data.summary.totalActiveLearners === 'number', 'Summary contains totalActiveLearners');
        assert(typeof data.summary.onTimeArrivals === 'number', 'Summary contains onTimeArrivals');
        assert(typeof data.summary.lateArrivals === 'number', 'Summary contains lateArrivals');
        resolve();
      },
      status: (code: number) => ({
        json: (err: any) => {
          assert(false, `Summary endpoint returned unexpected status ${code}: ${JSON.stringify(err)}`);
          resolve();
        },
      }),
    } as any;

    // Simulate route handling
    const handlers = (app as any)._router.stack
      .filter((layer: any) => layer.route && layer.route.path === '/api/admin/reports/summary')
      .map((layer: any) => layer.route.stack);

    if (handlers.length > 0) {
      const middlewareChain = handlers[0];
      let idx = 0;
      const next = () => {
        idx++;
        if (idx < middlewareChain.length) {
          middlewareChain[idx].handle_request(req, res, next);
        }
      };
      middlewareChain[0].handle_request(req, res, next);
    } else {
      assert(false, 'Route /api/admin/reports/summary found in app');
      resolve();
    }
  });

  // Test 6.2: Role Enforcement - Rejection of unauthorized non-admin
  await new Promise<void>((resolve) => {
    const req = {
      headers: { 'x-user-role': 'learner' },
      query: { role: 'learner' },
    } as any;
    const res = {
      status: (code: number) => {
        assert(code === 403, `Non-admin role correctly rejected with HTTP 403 (got ${code})`);
        return {
          json: (data: any) => {
            assert(data.success === false, 'Error response has success: false');
            resolve();
          },
        };
      },
      json: () => {
        assert(false, 'Non-admin should not receive 200 OK');
        resolve();
      },
    } as any;

    const handlers = (app as any)._router.stack
      .filter((layer: any) => layer.route && layer.route.path === '/api/admin/reports/summary')
      .map((layer: any) => layer.route.stack);

    if (handlers.length > 0) {
      handlers[0][0].handle_request(req, res, () => {});
    } else {
      resolve();
    }
  });

  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passedTests}/${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('================================================================');
}

runBackendTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
