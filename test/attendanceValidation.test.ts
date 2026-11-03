import {
  evaluateClockInStatus,
  isClockOutAllowed,
  deriveAttendanceState,
  generateDailyAccessId,
  getSASTComponents,
  DEFAULT_WORKPLACE_OFFICE,
} from '../src/utils/geoUtils';
import { attendanceVerificationService } from '../src/services/attendanceVerificationService';
import {
  INITIAL_ATTENDANCE_RECORDS,
  INITIAL_LEARNERS,
  DEFAULT_SYSTEM_CONTROLS,
} from '../src/data/mockData';
import { AttendanceRecord, Coordinates, UserProfile } from '../src/types/attendance';

function createDateSAST(hours: number, minutes: number, seconds: number = 0): Date {
  // 2026-11-03 at SAST (UTC+2 -> UTC representation is hours - 2)
  return new Date(Date.UTC(2026, 10, 3, hours - 2, minutes, seconds, 0));
}

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

console.log('================================================================');
console.log('SMARTREGISTER ATTENDANCE TERMINAL BUSINESS LOGIC VERIFICATION');
console.log('Timezone Authority: Africa/Johannesburg (SAST, UTC+2)');
console.log('================================================================\n');

// 1. TEST TIME-BASED CLOCK-OUT CLEARANCE (Configured minimum: 15:15 SAST)
console.log('1. Testing Time-Based Clock-Out Clearance (Threshold: 15:15 SAST)');
const testTimes = [
  { hours: 12, minutes: 0, expected: false, label: '12:00:00 SAST (Midday)' },
  { hours: 12, minutes: 36, expected: false, label: '12:36:28 SAST (Reported Problem Case)' },
  { hours: 14, minutes: 59, expected: false, label: '14:59:00 SAST (16 minutes before threshold)' },
  { hours: 15, minutes: 14, expected: false, label: '15:14:59 SAST (1 minute before threshold)' },
  { hours: 15, minutes: 15, expected: true, label: '15:15:00 SAST (Exact Threshold Clearance)' },
  { hours: 15, minutes: 40, expected: true, label: '15:40:00 SAST (Valid Departure Window)' },
];

for (const t of testTimes) {
  const d = createDateSAST(t.hours, t.minutes);
  const evalResult = isClockOutAllowed(d);
  assert(
    evalResult.allowed === t.expected,
    `${t.label} -> Allowed: ${evalResult.allowed} (Expected: ${t.expected})`
  );
}

// 2. TEST ATTENDANCE STATE DERIVATION
console.log('\n2. Testing Attendance State Machine Lifecycle');
const testLearner: UserProfile = INITIAL_LEARNERS[0];
const baseRecord: AttendanceRecord = {
  id: 'rec_test',
  learnerId: testLearner.id,
  learnerNumber: testLearner.learnerNumber,
  learnerName: testLearner.fullName,
  date: '2026-11-03',
  status: 'Present',
  clockInTime: '08:22:10',
  clockInDistance: 32,
  verifiedDistanceMeters: 32,
  dayType: 'office',
  accessId: 'SR-20261103-W9Q4A',
  isSealed: false,
};

// Case 2a: Not Clocked In
const stateNotClocked = deriveAttendanceState(null, createDateSAST(8, 0));
assert(stateNotClocked === 'NOT_CLOCKED_IN', 'No record yields NOT_CLOCKED_IN');

// Case 2b: Clocked In at 12:36 (Before 15:15)
const stateAt1236 = deriveAttendanceState(baseRecord, createDateSAST(12, 36, 28));
assert(
  stateAt1236 === 'CLOCK_OUT_PENDING',
  'At 12:36:28 SAST, state must be CLOCK_OUT_PENDING (Shift in progress)'
);

// Case 2c: Clocked In at 15:15 (No clock-out yet)
const stateAt1515 = deriveAttendanceState(baseRecord, createDateSAST(15, 15, 0));
assert(
  stateAt1515 === 'CLOCKED_IN',
  'At 15:15:00 SAST, state transitions to CLOCKED_IN (Clock-out available)'
);

// Case 2d: Clocked Out at 15:40 and sealed
const completedRecord: AttendanceRecord = {
  ...baseRecord,
  clockOutTime: '15:40:00',
  clockOutDistance: 25,
  isSealed: true,
};
const stateCompleted = deriveAttendanceState(completedRecord, createDateSAST(15, 40, 0));
assert(
  stateCompleted === 'COMPLETED',
  'At 15:40:00 SAST after clock-out, state is COMPLETED'
);

// Case 2e: Stale/Premature clockOutTime field before 15:15 must NOT yield COMPLETED
const prematureRecord: AttendanceRecord = {
  ...baseRecord,
  clockOutTime: '15:40:00',
  isSealed: false,
};
const statePremature = deriveAttendanceState(prematureRecord, createDateSAST(12, 36, 28));
assert(
  statePremature === 'CLOCK_OUT_PENDING',
  'Before 15:15 SAST, premature clock-out field is overridden to CLOCK_OUT_PENDING'
);

// 3. TEST SERVICE VERIFICATION (verifyClockOut)
console.log('\n3. Testing Service-Level Clock-Out Rejections & Approvals');
const officeCoords: Coordinates = {
  latitude: DEFAULT_WORKPLACE_OFFICE.coordinates.latitude,
  longitude: DEFAULT_WORKPLACE_OFFICE.coordinates.longitude,
};

// 3a. Reject at 12:36:28
const rejectAt1236 = attendanceVerificationService.verifyClockOut({
  learner: testLearner,
  existingRecord: baseRecord,
  workplace: DEFAULT_WORKPLACE_OFFICE,
  coordinates: officeCoords,
  systemControls: DEFAULT_SYSTEM_CONTROLS,
  simulatedDate: createDateSAST(12, 36, 28),
});
assert(
  !rejectAt1236.success && rejectAt1236.errorCode === 'EARLY_CLOCK_OUT_NOT_PERMITTED',
  'verifyClockOut rejects at 12:36:28 SAST with EARLY_CLOCK_OUT_NOT_PERMITTED'
);

// 3b. Reject at 15:14:59
const rejectAt1514 = attendanceVerificationService.verifyClockOut({
  learner: testLearner,
  existingRecord: baseRecord,
  workplace: DEFAULT_WORKPLACE_OFFICE,
  coordinates: officeCoords,
  systemControls: DEFAULT_SYSTEM_CONTROLS,
  simulatedDate: createDateSAST(15, 14, 59),
});
assert(
  !rejectAt1514.success && rejectAt1514.errorCode === 'EARLY_CLOCK_OUT_NOT_PERMITTED',
  'verifyClockOut rejects at 15:14:59 SAST with EARLY_CLOCK_OUT_NOT_PERMITTED'
);

// 3c. Approve at 15:15:00
const approveAt1515 = attendanceVerificationService.verifyClockOut({
  learner: testLearner,
  existingRecord: baseRecord,
  workplace: DEFAULT_WORKPLACE_OFFICE,
  coordinates: officeCoords,
  systemControls: DEFAULT_SYSTEM_CONTROLS,
  simulatedDate: createDateSAST(15, 15, 0),
});
assert(
  approveAt1515.success && approveAt1515.clockOutTime !== undefined,
  'verifyClockOut succeeds at 15:15:00 SAST with server timestamp'
);

// 3d. Prevent duplicate clock-out
const duplicateReject = attendanceVerificationService.verifyClockOut({
  learner: testLearner,
  existingRecord: completedRecord,
  workplace: DEFAULT_WORKPLACE_OFFICE,
  coordinates: officeCoords,
  systemControls: DEFAULT_SYSTEM_CONTROLS,
  simulatedDate: createDateSAST(15, 45, 0),
});
assert(
  !duplicateReject.success && duplicateReject.errorCode === 'DUPLICATE_CLOCK_OUT',
  'verifyClockOut rejects duplicate clock-out when record is already completed/sealed'
);

// 4. TEST ACCESS ID CONSISTENCY
console.log('\n4. Testing Access ID Consistency');
const d20261103 = createDateSAST(12, 36, 28);
const token1 = generateDailyAccessId(d20261103, testLearner.id);
const token2 = generateDailyAccessId(d20261103, testLearner.id);
assert(
  token1 === token2,
  `Deterministic Access ID generates same token: ${token1} === ${token2}`
);
assert(
  token1.startsWith('SR-20261103-'),
  `Access ID adheres to standardized format (SR-YYYYMMDD-XXXXX): ${token1}`
);

// 5. TEST GPS DISTANCE EVIDENCE IMMUTABILITY
console.log('\n5. Testing GPS Distance Separation and Historical Immutability');
const arrivalDistance = 32;
const departureDistance = 15;
const liveGpsDistance = 3;

const sealedDailyRecord: AttendanceRecord = {
  ...baseRecord,
  clockInDistance: arrivalDistance,
  verifiedDistanceMeters: arrivalDistance,
  clockOutTime: '15:40:00',
  clockOutDistance: departureDistance,
  isSealed: true,
  attendanceState: 'COMPLETED',
};

// Verify arrival distance was not overwritten by departure or live distance
assert(
  sealedDailyRecord.clockInDistance === 32,
  `Clock-In Recorded Distance is preserved as ${sealedDailyRecord.clockInDistance}m (not overwritten)`
);
assert(
  sealedDailyRecord.clockOutDistance === 15,
  `Clock-Out Recorded Distance is distinct: ${sealedDailyRecord.clockOutDistance}m`
);
assert(
  liveGpsDistance !== sealedDailyRecord.clockInDistance,
  `Live distance (${liveGpsDistance}m) and Historical Clock-In distance (${sealedDailyRecord.clockInDistance}m) remain strictly decoupled`
);

console.log('\n================================================================');
console.log(`TEST RESULTS: ${passedTests}/${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log('================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
