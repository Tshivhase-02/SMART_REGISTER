import React, { useState } from 'react';
import { useAttendance } from '../../../context/AttendanceContext';
import {
  LogIn,
  LogOut,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Clock,
  KeyRound,
  Building,
  Home,
  RefreshCw,
} from 'lucide-react';
import { evaluateClockInStatus, isClockOutAllowed } from '../../../utils/geoUtils';

export const LearnerAttendanceScreen: React.FC = () => {
  const {
    currentUser,
    currentTime,
    todayScheduleType,
    distanceFromOffice,
    isLocationVerified,
    dailyAccessId,
    isDailyAccessVerified,
    workingDayStatus,
    systemControls,
    hasClockedInToday,
    hasClockedOutToday,
    todayRecord,
    clockIn,
    clockOut,
    useBrowserGeolocation,
  } = useAttendance();

  const [clockInMessage, setClockInMessage] = useState<string | null>(null);
  const [clockOutMessage, setClockOutMessage] = useState<string | null>(null);
  const [isQueryingGps, setIsQueryingGps] = useState(false);

  const clockInEval = evaluateClockInStatus(currentTime);
  const clockOutEval = isClockOutAllowed(currentTime);

  // Determine Clock-In State: 'Available' | 'Disabled' | 'Completed'
  const isClockInBlocked =
    (todayScheduleType === 'office' && !isLocationVerified) ||
    !workingDayStatus.isWorkingDay ||
    systemControls.emergencyBroadcastActive ||
    !systemControls.isClockInEnabled;

  const clockInButtonState: 'Available' | 'Disabled' | 'Completed' = hasClockedInToday
    ? 'Completed'
    : isClockInBlocked
    ? 'Disabled'
    : 'Available';

  // Determine Clock-Out State: 'Available' | 'Disabled' | 'Completed'
  const isClockOutBlocked =
    !hasClockedInToday ||
    !clockOutEval.allowed ||
    !systemControls.isClockOutEnabled ||
    systemControls.emergencyBroadcastActive;

  const clockOutButtonState: 'Available' | 'Disabled' | 'Completed' = hasClockedOutToday
    ? 'Completed'
    : isClockOutBlocked
    ? 'Disabled'
    : 'Available';

  const handleClockIn = () => {
    const result = clockIn();
    setClockInMessage(result.message);
  };

  const handleClockOut = () => {
    const result = clockOut();
    setClockOutMessage(result.message);
  };

  const handleAcquireGps = async () => {
    setIsQueryingGps(true);
    await useBrowserGeolocation();
    setIsQueryingGps(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* 1. Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>DVT Learnership Programme</span>
            <span>·</span>
            <span>Daily Attendance Terminal</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Register Attendance
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Learner: <strong>{currentUser?.fullName}</strong> ({currentUser?.learnerNumber})
          </p>
        </div>

        {/* Live Clock & Schedule Badge */}
        <div className="text-left sm:text-right">
          <div className="font-mono text-xl font-bold text-slate-900 tabular-nums">
            {currentTime.toTimeString().split(' ')[0]}
          </div>
          <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded mt-1">
            {todayScheduleType === 'office' ? (
              <Building className="w-3.5 h-3.5 text-[#0F4C81]" />
            ) : (
              <Home className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span>Schedule: {todayScheduleType === 'office' ? 'Office Day' : 'Work From Home'}</span>
          </div>
        </div>
      </div>

      {/* 2. Non-working day banner */}
      {!workingDayStatus.isWorkingDay && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">
              {workingDayStatus.isWeekend ? 'Weekend' : workingDayStatus.holidayName}
            </h4>
            <p className="mt-0.5 font-medium">Attendance is not required today.</p>
          </div>
        </div>
      )}

      {/* 3. Daily Access ID Verification Status Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#0F4C81]" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Daily Access ID Verification
            </h3>
          </div>
          <span className="text-[10px] text-slate-400">
            Valid For Today Only (Expires at Midnight)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <span className="text-[10px] text-slate-500 block uppercase font-semibold">
              Daily Access ID:
            </span>
            <span
              className={`font-mono font-bold text-base ${
                isDailyAccessVerified && dailyAccessId ? 'text-[#0F4C81]' : 'text-rose-600'
              }`}
            >
              {isDailyAccessVerified && dailyAccessId ? dailyAccessId : 'Access Denied'}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Unique single-day cryptographic access token
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <span className="text-[10px] text-slate-500 block uppercase font-semibold">
              Schedule Rule Applied:
            </span>
            <span className="font-semibold text-slate-800 block">
              {todayScheduleType === 'office'
                ? 'Office (Requires GPS within 100m)'
                : 'Work From Home (GPS Not Required)'}
            </span>
          </div>
        </div>

        {/* Office Day Location Check Failure (Exact Spec) */}
        {todayScheduleType === 'office' && !isLocationVerified && (
          <div className="p-4 bg-rose-50 border-l-4 border-rose-600 rounded-r text-xs text-rose-900 space-y-1">
            <p className="font-bold text-sm text-rose-800">Attendance Denied</p>
            <p className="font-semibold text-rose-800">Today is an Office Day.</p>
            <p className="text-rose-700">You must be physically present at DynamicDNA.</p>
            <p className="text-[11px] text-rose-600 pt-1">
              Current distance: {distanceFromOffice}m (Allowed perimeter: 100m).
            </p>
            <button
              onClick={handleAcquireGps}
              disabled={isQueryingGps}
              className="mt-2 text-xs text-[#0F4C81] underline font-semibold flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${isQueryingGps ? 'animate-spin' : ''}`} />
              <span>Retry / Re-query Device GPS</span>
            </button>
          </div>
        )}

        {/* WFH Day Cleared Message */}
        {todayScheduleType === 'wfh' && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded text-xs text-emerald-900">
            <p className="font-bold">Today's Schedule: Work From Home</p>
            <p className="text-[11px] text-emerald-700">
              Attendance Available. GPS verification is not required.
            </p>
          </div>
        )}
      </div>

      {/* 4. Clock-In Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <LogIn className="w-4 h-4 text-[#0F4C81]" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Clock-In Terminal
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                clockInButtonState === 'Available'
                  ? 'bg-emerald-100 text-emerald-800'
                  : clockInButtonState === 'Completed'
                  ? 'bg-blue-100 text-[#0F4C81]'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              State: {clockInButtonState}
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              07:15 - 09:00 (Present)
            </span>
          </div>
        </div>

        {hasClockedInToday ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-900 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-bold text-sm">
                Attendance Already Registered For Today
              </span>
            </div>
            <div className="bg-white/80 p-2.5 rounded border border-emerald-200 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500 block">Status:</span>
                <span className="font-bold text-emerald-800 uppercase">
                  {todayRecord?.status}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Clock-In Time:</span>
                <span className="font-mono font-bold text-slate-800">
                  {todayRecord?.clockInTime}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Access ID:</span>
                <span className="font-mono text-slate-800">
                  {todayRecord?.accessId}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-emerald-700">
              Clock-in is locked. You may register departure at shift completion.
            </p>
          </div>
        ) : (
          <div className="space-y-3 text-xs">
            {clockInMessage && (
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded text-blue-900">
                {clockInMessage}
              </div>
            )}

            <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-600">Expected Attendance Status:</span>
                <span
                  className={`font-bold uppercase ${
                    clockInEval.status === 'Present' ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {clockInEval.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">{clockInEval.message}</p>
            </div>

            <button
              onClick={handleClockIn}
              disabled={clockInButtonState !== 'Available'}
              className={`w-full py-2.5 px-4 font-semibold text-xs rounded transition-colors flex items-center justify-center gap-2 ${
                clockInButtonState === 'Available'
                  ? 'bg-[#0F4C81] hover:bg-[#0A355C] text-white shadow-xs'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>
                {clockInButtonState === 'Available'
                  ? `Submit Clock-In (${clockInEval.status.toUpperCase()})`
                  : 'Clock-In Disabled'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* 5. Clock-Out Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <LogOut className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Clock-Out Terminal
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                clockOutButtonState === 'Available'
                  ? 'bg-emerald-100 text-emerald-800'
                  : clockOutButtonState === 'Completed'
                  ? 'bg-blue-100 text-[#0F4C81]'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              State: {clockOutButtonState}
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Threshold: 15:15
            </span>
          </div>
        </div>

        {hasClockedOutToday ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-900 space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-bold text-sm">Clock-Out Completed Successfully</span>
            </div>
            <p className="text-[11px] text-emerald-800">
              Shift concluded at {todayRecord?.clockOutTime}. Daily attendance sealed.
            </p>
          </div>
        ) : (
          <div className="space-y-3 text-xs">
            {clockOutMessage && (
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded text-blue-900">
                {clockOutMessage}
              </div>
            )}

            {!clockOutEval.allowed ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-slate-700 space-y-1">
                <p className="font-bold text-slate-900">Clock-Out Available From 15:15</p>
                <p className="text-[11px] text-slate-500">
                  {clockOutEval.minutesRemaining} minutes remaining until shift clearance threshold.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-900">
                <p className="font-bold">Shift Clearance Reached</p>
                <p className="text-[11px] text-emerald-700">Clock-out is enabled.</p>
              </div>
            )}

            <button
              onClick={handleClockOut}
              disabled={clockOutButtonState !== 'Available'}
              className={`w-full py-2.5 px-4 font-semibold text-xs rounded transition-colors flex items-center justify-center gap-2 ${
                clockOutButtonState === 'Available'
                  ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
              }`}
            >
              <LogOut className="w-4 h-4" />
              <span>
                {!hasClockedInToday
                  ? 'Clock-In Required First'
                  : !clockOutEval.allowed
                  ? 'Clock-Out Available From 15:15'
                  : 'Submit Clock-Out'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
