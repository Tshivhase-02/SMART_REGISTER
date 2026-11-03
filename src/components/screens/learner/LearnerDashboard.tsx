import React from 'react';
import { useAttendance } from '../../../context/AttendanceContext';
import {
  Building,
  Home,
  CheckCircle2,
  Clock,
  MapPin,
  CalendarX,
  History,
  AlertTriangle,
  ArrowRight,
  KeyRound,
  ShieldAlert,
  Users,
  User,
  Navigation,
  RefreshCw,
} from 'lucide-react';
import { evaluateClockInStatus, isClockOutAllowed } from '../../../utils/geoUtils';

export const LearnerDashboard: React.FC = () => {
  const {
    currentUser,
    setActiveScreen,
    currentTime,
    todayScheduleType,
    workplaceConfig,
    currentCoordinates,
    gpsAccuracyMeters,
    captureAndVerifyLocation,
    isCapturingLocation,
    distanceFromOffice,
    isLocationVerified,
    dailyAccessId,
    isDailyAccessVerified,
    accessDeniedMessage,
    hasClockedInToday,
    hasClockedOutToday,
    todayRecord,
    attendanceRecords,
    absenceRequests,
    workingDayStatus,
    systemControls,
  } = useAttendance();

  // Compute stats for current learner
  const learnerAttendance = attendanceRecords.filter((r) => r.learnerId === currentUser?.id);
  const presentCount = learnerAttendance.filter((r) => r.status === 'Present').length;
  const lateCount = learnerAttendance.filter((r) => r.status === 'Late').length;
  const absentCount = learnerAttendance.filter((r) => r.status === 'Absent').length;
  const totalDays = presentCount + lateCount + absentCount;
  const attendanceRate = totalDays > 0 ? Math.round(((presentCount + lateCount) / totalDays) * 100) : 100;

  const clockInEval = evaluateClockInStatus(currentTime);
  const clockOutEval = isClockOutAllowed(currentTime);

  const greetingTime = () => {
    const hours = currentTime.getHours();
    if (hours < 12) return 'Good Morning';
    if (hours < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-5">
      {/* 1. Emergency Broadcast Notice (if active) */}
      {systemControls.emergencyBroadcastActive && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-lg text-xs text-rose-900 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Emergency System Notice</h4>
            <p className="mt-0.5">{systemControls.emergencyMessage}</p>
          </div>
        </div>
      )}

      {/* 2. Non-working day message (Weekend / Public Holiday) */}
      {!workingDayStatus.isWorkingDay && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-3">
          <Clock className="w-5 h-5 text-[#2F3E96] shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">
              {workingDayStatus.isWeekend ? 'Weekend Notice' : workingDayStatus.holidayName}
            </h4>
            <p className="mt-0.5 font-medium">Attendance is not required today.</p>
          </div>
        </div>
      )}

      {/* 3. Welcome Banner */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>DynamicDNA · DVT Learnership Programme</span>
            <span>·</span>
            <span className="font-mono text-slate-700">{currentUser?.learnerNumber}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {greetingTime()} {currentUser?.firstName}
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Welcome to SmartRegister. Review your schedule and register daily attendance.
          </p>
        </div>

        {/* Daily Access ID pill */}
        <div className="bg-slate-50 border border-[#E5E7EB] p-3 rounded-md text-xs text-left sm:text-right shrink-0">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">
            Today's Daily Access ID:
          </span>
          <span
            className={`font-mono font-bold text-sm block ${
              isDailyAccessVerified && dailyAccessId
                ? 'text-[#2F3E96]'
                : 'text-rose-600'
            }`}
          >
            {isDailyAccessVerified && dailyAccessId
              ? dailyAccessId
              : 'Access Denied'}
          </span>
          <span className="text-[10px] text-slate-400">
            {isDailyAccessVerified
              ? 'Expires automatically at midnight'
              : 'Geofence verification required'}
          </span>
        </div>
      </div>

      {/* 4. Today's Status Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Schedule Card */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
            Today's Schedule
          </span>
          <div className="flex items-center gap-2">
            {todayScheduleType === 'office' ? (
              <Building className="w-5 h-5 text-[#2F3E96]" />
            ) : (
              <Home className="w-5 h-5 text-emerald-600" />
            )}
            <span className="text-base font-bold text-slate-900">
              {todayScheduleType === 'office' ? 'Office' : 'Work From Home'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {todayScheduleType === 'office'
              ? 'Physical attendance at DynamicDNA'
              : 'Remote attendance authorized'}
          </p>
        </div>

        {/* Location Status Card */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
              Location Status
            </span>
            <button
              onClick={() => captureAndVerifyLocation()}
              disabled={isCapturingLocation}
              className="text-[10px] text-[#2F3E96] font-semibold hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
              title="Query device GPS"
            >
              <RefreshCw className={`w-3 h-3 ${isCapturingLocation ? 'animate-spin' : ''}`} />
              <span>{isCapturingLocation ? 'Verifying...' : 'Verify'}</span>
            </button>
          </div>

          <div>
            {todayScheduleType === 'office' ? (
              isLocationVerified ? (
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-bold">Verified (Office)</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-rose-700">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span className="text-sm font-bold">Not Verified</span>
                </div>
              )
            ) : (
              <div className="flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-bold">Verified (WFH Exempt)</span>
              </div>
            )}
          </div>

          <div className="text-xs text-slate-600 pt-1 space-y-0.5 border-t border-slate-100 font-mono text-[11px]">
            <p className="text-slate-500">
              GPS:{' '}
              <span className="font-semibold text-slate-800">
                {currentCoordinates?.latitude.toFixed(4)}, {currentCoordinates?.longitude.toFixed(4)}
              </span>{' '}
              <span className="text-[10px] text-slate-400">({gpsAccuracyMeters}m)</span>
            </p>
            <p className="text-slate-500">
              Distance:{' '}
              <span
                className={`font-semibold ${
                  distanceFromOffice <= workplaceConfig.allowedRadiusMeters
                    ? 'text-emerald-700'
                    : 'text-rose-700'
                }`}
              >
                {distanceFromOffice > 1000
                  ? `${(distanceFromOffice / 1000).toFixed(1)} km`
                  : `${distanceFromOffice}m`}{' '}
                / {workplaceConfig.allowedRadiusMeters}m
              </span>
            </p>
          </div>
        </div>

        {/* Clock-In Status Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
            Clock-In Status
          </span>
          <div className="flex items-center gap-2">
            {hasClockedInToday ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-base font-bold text-emerald-700">
                  {todayRecord?.status}
                </span>
              </>
            ) : (
              <>
                <Clock className="w-5 h-5 text-amber-500" />
                <span className="text-base font-bold text-amber-800">
                  {clockInEval.isOpen ? 'Available' : 'Opens 07:15'}
                </span>
              </>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {hasClockedInToday
              ? `Logged at ${todayRecord?.clockInTime}`
              : 'Window: 07:15 - 09:00 (Late after 09:00)'}
          </p>
        </div>

        {/* Clock-Out Status Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
            Clock-Out Status
          </span>
          <div className="flex items-center gap-2">
            {hasClockedOutToday ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-slate-600" />
                <span className="text-base font-bold text-slate-800">Completed</span>
              </>
            ) : clockOutEval.allowed ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-base font-bold text-emerald-700">Available</span>
              </>
            ) : (
              <>
                <Clock className="w-5 h-5 text-slate-400" />
                <span className="text-base font-bold text-slate-600">Locked (15:15)</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {hasClockedOutToday
              ? `Logged at ${todayRecord?.clockOutTime}`
              : 'Available at 15:15'}
          </p>
        </div>
      </div>

      {/* 5. Access Denied Banner on Office Day if outside geofence */}
      {todayScheduleType === 'office' && !isLocationVerified && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-lg text-xs text-rose-900 space-y-1">
          <div className="flex items-center gap-2 font-bold text-sm text-rose-800">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Attendance Denied</span>
          </div>
          <p className="font-medium">
            Today is an Office Day. You must be physically present at DynamicDNA (within 100 metres).
          </p>
          <p className="text-[11px] text-rose-700">
            Current distance: <strong>{distanceFromOffice} metres</strong> from DynamicDNA campus centroid.
          </p>
        </div>
      )}

      {/* 6. Attendance Summary Strip (Present Days, Late Days, Absent Days, Attendance Percentage) */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Attendance Summary
          </h3>
          <span className="text-[11px] text-slate-500">DVT Programme Target: ≥ 85%</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <span className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">
              Present Days
            </span>
            <span className="text-2xl font-bold font-mono text-emerald-600">
              {presentCount}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <span className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">
              Late Days
            </span>
            <span className="text-2xl font-bold font-mono text-amber-600">
              {lateCount}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <span className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">
              Absent Days
            </span>
            <span className="text-2xl font-bold font-mono text-rose-600">
              {absentCount}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded border border-[#E5E7EB]">
            <span className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">
              Attendance Percentage
            </span>
            <span className="text-2xl font-bold font-mono text-[#2F3E96]">
              {attendanceRate}%
            </span>
          </div>
        </div>
      </div>

      {/* 7. Quick Actions */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-xs">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => setActiveScreen('learner_attendance')}
            className="flex flex-col items-center justify-center p-3 rounded border border-[#E5E7EB] bg-slate-50 hover:bg-[#F4B52C]/10 hover:border-[#F4B52C] transition-colors text-slate-800 text-center cursor-pointer"
          >
            <Clock className="w-5 h-5 text-[#2F3E96] mb-1" />
            <span className="text-xs font-semibold">Clock-In</span>
            <span className="text-[10px] text-slate-500">Morning Terminal</span>
          </button>

          <button
            onClick={() => setActiveScreen('learner_attendance')}
            className="flex flex-col items-center justify-center p-3 rounded border border-[#E5E7EB] bg-slate-50 hover:bg-[#F4B52C]/10 hover:border-[#F4B52C] transition-colors text-slate-800 text-center cursor-pointer"
          >
            <Clock className="w-5 h-5 text-[#2F3E96] mb-1" />
            <span className="text-xs font-semibold">Clock-Out</span>
            <span className="text-[10px] text-slate-500">From 15:15</span>
          </button>

          <button
            onClick={() => setActiveScreen('learner_history')}
            className="flex flex-col items-center justify-center p-3 rounded border border-[#E5E7EB] bg-slate-50 hover:bg-[#2F3E96]/10 hover:border-[#2F3E96] transition-colors text-slate-800 text-center cursor-pointer"
          >
            <History className="w-5 h-5 text-[#2F3E96] mb-1" />
            <span className="text-xs font-semibold">History</span>
            <span className="text-[10px] text-slate-500">Timesheets</span>
          </button>

          <button
            onClick={() => setActiveScreen('learner_report_absence')}
            className="flex flex-col items-center justify-center p-3 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-slate-800 text-center cursor-pointer"
          >
            <CalendarX className="w-5 h-5 text-rose-600 mb-1" />
            <span className="text-xs font-semibold">Absence</span>
            <span className="text-[10px] text-slate-500">Submit Leave</span>
          </button>

          <button
            onClick={() => setActiveScreen('learner_directory')}
            className="flex flex-col items-center justify-center p-3 rounded border border-[#E5E7EB] bg-slate-50 hover:bg-[#2F3E96]/10 hover:border-[#2F3E96] transition-colors text-slate-800 text-center cursor-pointer"
          >
            <Users className="w-5 h-5 text-[#2F3E96] mb-1" />
            <span className="text-xs font-semibold">Directory</span>
            <span className="text-[10px] text-slate-500">Find Peers</span>
          </button>

          <button
            onClick={() => setActiveScreen('learner_profile')}
            className="flex flex-col items-center justify-center p-3 rounded border border-[#E5E7EB] bg-slate-50 hover:bg-[#2F3E96]/10 hover:border-[#2F3E96] transition-colors text-slate-800 text-center cursor-pointer"
          >
            <User className="w-5 h-5 text-[#2F3E96] mb-1" />
            <span className="text-xs font-semibold">My Profile</span>
            <span className="text-[10px] text-slate-500">Card & Skills</span>
          </button>
        </div>
      </div>
    </div>
  );
};
