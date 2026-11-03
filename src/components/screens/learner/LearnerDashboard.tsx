import React, { useState } from 'react';
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
  Users,
  User,
  RefreshCw,
  LogOut,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { evaluateClockInStatus, isClockOutAllowed } from '../../../utils/geoUtils';

export const LearnerDashboard: React.FC = () => {
  const {
    currentUser,
    setActiveScreen,
    currentTime,
    todayScheduleType,
    isLocationVerified,
    locationVerificationResult,
    captureAndVerifyLocation,
    isCapturingLocation,
    hasClockedInToday,
    hasClockedOutToday,
    todayRecord,
    attendanceState,
    sastTimeString,
    clockIn,
    clockOut,
    workingDayStatus,
    systemControls,
  } = useAttendance();

  const [clockActionMessage, setClockActionMessage] = useState<string | null>(null);
  const [showClockOutConfirm, setShowClockOutConfirm] = useState(false);

  const clockInEval = evaluateClockInStatus(currentTime);
  const clockOutEval = isClockOutAllowed(currentTime);

  const greetingTime = () => {
    const hours = currentTime.getHours();
    if (hours < 12) return 'Good Morning';
    if (hours < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Check if clock in is allowed
  const isOfficeDay = todayScheduleType === 'office';
  const canClockIn =
    !hasClockedInToday &&
    clockInEval.isOpen &&
    systemControls.isClockInEnabled &&
    workingDayStatus.isWorkingDay &&
    (!isOfficeDay || isLocationVerified);

  // Check if clock out is allowed
  const canClockOut =
    hasClockedInToday &&
    !hasClockedOutToday &&
    clockOutEval.allowed &&
    systemControls.isClockOutEnabled;

  const handleClockIn = () => {
    const res = clockIn();
    setClockActionMessage(res.message);
  };

  const handleConfirmClockOut = () => {
    const res = clockOut();
    setClockActionMessage(res.message);
    setShowClockOutConfirm(false);
  };

  // Location display logic according to specifications:
  // - Location verified.
  // - Location verification failed.
  // - Location permission required.
  // - Unable to determine location.
  const getLocationDisplay = () => {
    if (!isOfficeDay) {
      return {
        status: 'verified',
        title: 'Remote attendance authorized.',
        description: 'Location verification is not required for Work From Home.',
      };
    }

    if (isLocationVerified) {
      return {
        status: 'verified',
        title: 'Location verified.',
        description: 'You are at DynamicDNA campus.',
      };
    }

    if (locationVerificationResult?.errorCode === 'PERMISSION_DENIED') {
      return {
        status: 'permission_required',
        title: 'Location permission required.',
        description: 'Please enable location permissions in your browser to verify attendance.',
      };
    }

    if (
      locationVerificationResult?.errorCode === 'POSITION_UNAVAILABLE' ||
      locationVerificationResult?.errorCode === 'TIMEOUT'
    ) {
      return {
        status: 'unable',
        title: 'Unable to determine location.',
        description: 'Please ensure GPS or location services are active on your device.',
      };
    }

    return {
      status: 'failed',
      title: 'Location verification failed.',
      description: 'You must be present at DynamicDNA to register office attendance.',
    };
  };

  const locationDisplay = getLocationDisplay();

  // Progress steps
  const isStep1Done = hasClockedInToday;
  const isStep2Active = hasClockedInToday && !hasClockedOutToday;
  const isStep3Done = hasClockedOutToday || attendanceState === 'COMPLETED';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. Emergency Notice (if active by administrator) */}
      {systemControls.emergencyBroadcastActive && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-lg text-xs text-rose-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">System Notice</h4>
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

      {/* Action Notification Message */}
      {clockActionMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{clockActionMessage}</span>
          </div>
          <button
            onClick={() => setClockActionMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3. Welcome Header */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span className="text-[#2F3E96] font-bold">DynamicDNA · DVT Learnership Programme</span>
            <span>·</span>
            <span className="font-mono text-slate-700 font-bold">{currentUser?.learnerNumber}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#333333] tracking-tight">
            {greetingTime()}, {currentUser?.firstName}
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            SmartRegister attendance dashboard for the DVT Learnership Programme.
          </p>
        </div>

        {/* Work Arrangement Badge */}
        <div className="shrink-0 flex items-center sm:flex-col sm:items-end gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Today's Arrangement
          </span>
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-bold ${
              isOfficeDay
                ? 'bg-blue-50 border-[#2F3E96]/30 text-[#2F3E96]'
                : 'bg-amber-50 border-[#F4B52C]/40 text-amber-900'
            }`}
          >
            {isOfficeDay ? (
              <Building className="w-4 h-4 text-[#2F3E96]" />
            ) : (
              <Home className="w-4 h-4 text-[#F4B52C]" />
            )}
            <span>{isOfficeDay ? 'Office Day' : 'Work From Home'}</span>
          </div>
        </div>
      </div>

      {/* 4. Attendance Status Card & Progress */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 sm:p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#2F3E96]" />
            <span>Today's Attendance</span>
          </h3>
          <span className="text-xs font-mono text-slate-500 font-medium">
            {sastTimeString || currentTime.toTimeString().split(' ')[0]} SAST
          </span>
        </div>

        {/* Simple 3-Stage Progress Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isStep1Done ? 'bg-emerald-500' : 'bg-amber-400'
                }`}
              />
              1. Clock In (07:15–09:00)
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isStep3Done
                    ? 'bg-emerald-500'
                    : isStep2Active
                    ? 'bg-[#2F3E96] animate-pulse'
                    : 'bg-slate-300'
                }`}
              />
              2. Shift in Progress
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isStep3Done ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              />
              3. Clock Out (from 15:15)
            </span>
          </div>

          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
            <div
              className={`h-full transition-all duration-500 ${
                isStep1Done ? 'bg-emerald-500 w-1/3' : 'bg-slate-200 w-0'
              }`}
            />
            <div
              className={`h-full transition-all duration-500 ${
                isStep3Done
                  ? 'bg-emerald-500 w-1/3'
                  : isStep2Active
                  ? 'bg-[#2F3E96] w-1/3'
                  : 'bg-slate-200 w-0'
              }`}
            />
            <div
              className={`h-full transition-all duration-500 ${
                isStep3Done ? 'bg-emerald-500 w-1/3' : 'bg-slate-200 w-0'
              }`}
            />
          </div>
        </div>

        {/* Status Grid: Clock-In & Clock-Out details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Clock-In Box */}
          <div className="p-4 bg-slate-50 border border-[#E5E7EB] rounded-md space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Clock-In Status
            </span>
            {hasClockedInToday ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-sm font-bold text-slate-900">
                    Recorded at {todayRecord?.clockInTime} SAST
                  </span>
                  <span className="text-xs text-emerald-700 block font-semibold">
                    {todayRecord?.status || 'Present'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <span className="text-sm font-bold text-slate-900">
                    {clockInEval.isOpen ? 'Available Now' : 'Opens at 07:15 SAST'}
                  </span>
                  <span className="text-xs text-slate-500 block">
                    Window: 07:15 – 09:00 (Late after 09:00)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Clock-Out Box */}
          <div className="p-4 bg-slate-50 border border-[#E5E7EB] rounded-md space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Clock-Out Status
            </span>
            {isStep3Done ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#2F3E96] shrink-0" />
                <div>
                  <span className="text-sm font-bold text-slate-900">
                    Recorded at {todayRecord?.clockOutTime} SAST
                  </span>
                  <span className="text-xs text-[#2F3E96] block font-semibold">
                    Completed & Ledger Sealed
                  </span>
                </div>
              </div>
            ) : hasClockedInToday ? (
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#2F3E96] shrink-0" />
                <div>
                  <span className="text-sm font-bold text-slate-900">
                    {clockOutEval.allowed ? 'Ready to Clock Out' : 'Pending (Opens 15:15)'}
                  </span>
                  <span className="text-xs text-slate-500 block">
                    {clockOutEval.allowed
                      ? 'Shift completed. You may clock out.'
                      : 'Available at or after 15:15 SAST'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-400 shrink-0" />
                <div>
                  <span className="text-sm font-bold text-slate-600">Pending Clock-In</span>
                  <span className="text-xs text-slate-400 block">
                    Clock-in required before departure
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 5. Short GPS Verification Result (When applicable) */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            {locationDisplay.status === 'verified' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : locationDisplay.status === 'permission_required' ? (
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            )}
            <div>
              <span
                className={`font-bold block ${
                  locationDisplay.status === 'verified'
                    ? 'text-emerald-700'
                    : locationDisplay.status === 'permission_required'
                    ? 'text-amber-700'
                    : 'text-rose-700'
                }`}
              >
                {locationDisplay.title}
              </span>
              <span className="text-slate-500 block text-[11px]">
                {locationDisplay.description}
              </span>
            </div>
          </div>

          {isOfficeDay && (
            <button
              onClick={() => captureAndVerifyLocation()}
              disabled={isCapturingLocation}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#E5E7EB] bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shrink-0 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#2F3E96] ${isCapturingLocation ? 'animate-spin' : ''}`} />
              <span>{isCapturingLocation ? 'Verifying...' : 'Verify Location'}</span>
            </button>
          )}
        </div>

        {/* 6. Clear Clock-In or Clock-Out Action Button */}
        <div className="pt-4 border-t border-slate-100">
          {!hasClockedInToday ? (
            <div className="space-y-2">
              <button
                onClick={handleClockIn}
                disabled={!canClockIn}
                className={`w-full sm:w-auto py-2.5 px-6 rounded-md font-bold text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer ${
                  canClockIn
                    ? 'bg-[#F4B52C] hover:bg-[#E0A220] text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Clock In</span>
              </button>
              {!canClockIn && (
                <p className="text-[11px] text-slate-500">
                  {isOfficeDay && !isLocationVerified
                    ? 'Location verification at DynamicDNA is required before clocking in.'
                    : !clockInEval.isOpen
                    ? 'The clock-in window opens at 07:15 SAST.'
                    : !workingDayStatus.isWorkingDay
                    ? 'Attendance is not scheduled for today.'
                    : 'Clock-in is temporarily unavailable.'}
                </p>
              )}
            </div>
          ) : !hasClockedOutToday ? (
            <div className="space-y-2">
              <button
                onClick={() => setShowClockOutConfirm(true)}
                disabled={!canClockOut}
                className={`w-full sm:w-auto py-2.5 px-6 rounded-md font-bold text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer ${
                  canClockOut
                    ? 'bg-[#F4B52C] hover:bg-[#E0A220] text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                <LogOut className="w-4 h-4" />
                <span>Clock Out</span>
              </button>
              {!canClockOut && (
                <p className="text-[11px] text-slate-500">
                  Clock-out is permitted from 15:15 SAST. Minimum shift duration required.
                </p>
              )}
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Today's attendance completed successfully.</span>
            </div>
          )}
        </div>
      </div>

      {/* 7. Quick Links to My Profile, Attendance History and Learner Directory */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Quick Access
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* My Profile */}
          <button
            onClick={() => setActiveScreen('learner_profile')}
            className="p-4 bg-white border border-[#E5E7EB] hover:border-[#2F3E96]/40 hover:shadow-xs rounded-lg text-left transition-all cursor-pointer group flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-md bg-blue-50 text-[#2F3E96] flex items-center justify-center font-bold">
                <User className="w-5 h-5 text-[#2F3E96]" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#2F3E96] group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#333333] group-hover:text-[#2F3E96] transition-colors">
                My Profile
              </h4>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                View your learner card, update job title, and manage profile photo.
              </p>
            </div>
          </button>

          {/* Attendance History */}
          <button
            onClick={() => setActiveScreen('learner_history')}
            className="p-4 bg-white border border-[#E5E7EB] hover:border-[#2F3E96]/40 hover:shadow-xs rounded-lg text-left transition-all cursor-pointer group flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-md bg-blue-50 text-[#2F3E96] flex items-center justify-center font-bold">
                <History className="w-5 h-5 text-[#2F3E96]" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#2F3E96] group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#333333] group-hover:text-[#2F3E96] transition-colors">
                Attendance History
              </h4>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Review past attendance timesheets, arrival records, and logs.
              </p>
            </div>
          </button>

          {/* Learner Directory */}
          <button
            onClick={() => setActiveScreen('learner_directory')}
            className="p-4 bg-white border border-[#E5E7EB] hover:border-[#2F3E96]/40 hover:shadow-xs rounded-lg text-left transition-all cursor-pointer group flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-md bg-blue-50 text-[#2F3E96] flex items-center justify-center font-bold">
                <Users className="w-5 h-5 text-[#2F3E96]" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#2F3E96] group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#333333] group-hover:text-[#2F3E96] transition-colors">
                Learner Directory
              </h4>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Connect with peers and professional skills in the learnership.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Clock-Out Confirmation Modal */}
      {showClockOutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full border border-slate-200 p-5 space-y-4 text-[#333333]">
            <div className="flex items-center gap-2.5 text-[#2F3E96]">
              <LogOut className="w-5 h-5 text-[#F4B52C]" />
              <h4 className="font-bold text-base text-slate-900">Confirm Clock-Out</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to clock out for today? This will seal your attendance ledger for today.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowClockOutConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClockOut}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#F4B52C] hover:bg-[#E0A220] rounded cursor-pointer shadow-xs"
              >
                Confirm Clock-Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
