import React, { useState, useEffect } from 'react';
import { useAttendance } from '../../../context/AttendanceContext';
import {
  LogIn,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building,
  Home,
  RefreshCw,
  X,
  Check,
  MapPin,
} from 'lucide-react';
import { evaluateClockInStatus, isClockOutAllowed } from '../../../utils/geoUtils';

export const LearnerAttendanceScreen: React.FC = () => {
  const {
    currentUser,
    currentTime,
    todayScheduleType,
    captureAndVerifyLocation,
    locationVerificationResult,
    isCapturingLocation,
    isLocationVerified,
    workingDayStatus,
    systemControls,
    hasClockedInToday,
    hasClockedOutToday,
    todayRecord,
    attendanceState,
    sastTimeString,
    clockIn,
    clockOut,
  } = useAttendance();

  const [clockInMessage, setClockInMessage] = useState<string | null>(null);
  const [clockOutMessage, setClockOutMessage] = useState<string | null>(null);
  const [showClockOutModal, setShowClockOutModal] = useState(false);
  const [notesInput, setNotesInput] = useState('');

  const clockInEval = evaluateClockInStatus(currentTime);
  const clockOutEval = isClockOutAllowed(currentTime);

  const isOfficeDay = todayScheduleType === 'office';

  // Determine Clock-In State: 'Available' | 'Disabled' | 'Completed'
  const isClockInBlocked =
    (isOfficeDay && !isLocationVerified) ||
    !workingDayStatus.isWorkingDay ||
    systemControls.emergencyBroadcastActive ||
    !systemControls.isClockInEnabled ||
    !clockInEval.isOpen;

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

  const handleVerifyLocation = async () => {
    await captureAndVerifyLocation();
  };

  const handleClockIn = () => {
    const result = clockIn(notesInput || undefined);
    setClockInMessage(result.message);
  };

  const handleConfirmClockOut = () => {
    const result = clockOut();
    setClockOutMessage(result.message);
    setShowClockOutModal(false);
  };

  // Location Result Display (Display detected place name without raw coordinates)
  const getLocationDisplay = () => {
    if (!isOfficeDay) {
      return {
        status: 'verified',
        title: 'Remote Attendance Authorised.',
        detectedPlace: null,
        message: 'Location verification is not required for Work From Home.',
      };
    }

    if (!locationVerificationResult) {
      return {
        status: 'unverified',
        title: 'Location verification required.',
        detectedPlace: null,
        message: 'Please press Verify Location to verify your presence at DynamicDNA Campus.',
      };
    }

    if (locationVerificationResult?.errorCode === 'PERMISSION_DENIED') {
      return {
        status: 'permission_denied',
        title: 'Location permission denied.',
        detectedPlace: null,
        message: 'Location permission denied – Allow location access in your browser.',
      };
    }

    if (
      locationVerificationResult?.errorCode === 'POSITION_UNAVAILABLE' ||
      locationVerificationResult?.errorCode === 'TIMEOUT' ||
      locationVerificationResult?.errorCode === 'NOT_SUPPORTED'
    ) {
      return {
        status: 'unable',
        title: 'Unable to detect location.',
        detectedPlace: null,
        message: 'Unable to detect location – Please try again.',
      };
    }

    if (locationVerificationResult?.errorCode === 'ACCURACY_POOR') {
      return {
        status: 'accuracy_poor',
        title: 'GPS accuracy insufficient.',
        detectedPlace: null,
        message: 'GPS accuracy insufficient – Please wait for a more accurate reading.',
      };
    }

    if (isLocationVerified) {
      return {
        status: 'verified',
        title: 'Location Verified.',
        detectedPlace: 'DynamicDNA Campus.',
        message: 'You are within the authorised workplace area.',
      };
    }

    const rawPlace = locationVerificationResult?.detectedPlace?.trim();
    const hasKnownPlace = Boolean(
      rawPlace &&
        rawPlace !== 'Unable to identify your current location.' &&
        rawPlace !== 'Unable to identify your current location'
    );
    const detectedPlace = hasKnownPlace ? rawPlace! : 'Unable to identify your current location.';

    return {
      status: 'outside',
      title: 'Outside Authorised Area.',
      detectedPlace: detectedPlace,
      message: hasKnownPlace
        ? `You are currently at ${detectedPlace}, which is outside the authorised workplace area.`
        : 'You are currently outside the authorised workplace area.',
    };
  };

  const locationDisplay = getLocationDisplay();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 1. Terminal Header */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span className="text-[#2F3E96] font-bold">DynamicDNA · DVT Learnership Programme</span>
            <span>·</span>
            <span>Attendance Terminal</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#333333] tracking-tight">
            Daily Attendance
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Learner: <strong className="text-slate-800">{currentUser?.fullName}</strong> ({currentUser?.learnerNumber})
          </p>
        </div>

        {/* Live Clock & Schedule Badge */}
        <div className="text-left sm:text-right space-y-1">
          <div className="font-mono text-xl font-bold text-[#333333] tabular-nums">
            {sastTimeString || currentTime.toTimeString().split(' ')[0]} <span className="text-xs text-slate-500 font-sans">SAST</span>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded border border-[#E5E7EB] bg-slate-50 text-slate-800">
            {isOfficeDay ? (
              <Building className="w-3.5 h-3.5 text-[#2F3E96]" />
            ) : (
              <Home className="w-3.5 h-3.5 text-[#F4B52C]" />
            )}
            <span>Schedule: {isOfficeDay ? 'Office Day' : 'Work From Home'}</span>
          </div>
        </div>
      </div>

      {/* 2. Messages */}
      {clockInMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{clockInMessage}</span>
          </div>
          <button
            onClick={() => setClockInMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {clockOutMessage && (
        <div className="p-3.5 bg-blue-50 border border-blue-300 rounded-lg text-xs text-blue-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#2F3E96] shrink-0" />
            <span className="font-medium">{clockOutMessage}</span>
          </div>
          <button
            onClick={() => setClockOutMessage(null)}
            className="text-[#2F3E96] hover:underline text-xs font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3. Location Verification Status */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Location Status
          </h3>
          {isOfficeDay && (
            <button
              onClick={handleVerifyLocation}
              disabled={isCapturingLocation}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-[#2F3E96] hover:bg-slate-50 border border-[#E5E7EB] rounded transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCapturingLocation ? 'animate-spin' : ''}`} />
              <span>{isCapturingLocation ? 'Verifying...' : 'Verify Location'}</span>
            </button>
          )}
        </div>

        <div
          className={`p-4 rounded-lg border flex items-start gap-3 ${
            locationDisplay.status === 'verified'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : locationDisplay.status === 'unverified'
              ? 'bg-blue-50 border-blue-200 text-blue-950'
              : locationDisplay.status === 'permission_denied' || locationDisplay.status === 'accuracy_poor'
              ? 'bg-amber-50 border-amber-200 text-amber-950'
              : 'bg-rose-50 border-rose-200 text-rose-950'
          }`}
        >
          {locationDisplay.status === 'verified' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : locationDisplay.status === 'unverified' ? (
            <MapPin className="w-5 h-5 text-[#2F3E96] shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <h4
              className={`font-bold text-sm ${
                locationDisplay.status === 'verified'
                  ? 'text-emerald-900'
                  : locationDisplay.status === 'unverified'
                  ? 'text-[#2F3E96]'
                  : 'text-slate-900'
              }`}
            >
              {locationDisplay.title}
            </h4>
            {locationDisplay.detectedPlace && (
              <div className="text-slate-800 font-medium text-xs flex items-baseline gap-1">
                <span className="font-semibold text-slate-500">Detected place:</span>
                <span className="font-bold">{locationDisplay.detectedPlace}</span>
              </div>
            )}
            <p className="text-xs opacity-90 leading-relaxed">{locationDisplay.message}</p>
            {isOfficeDay && (
              <div className="text-[10px] text-slate-400 pt-0.5">
                Map data © OpenStreetMap contributors
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Action Terminal (Clock-In & Clock-Out Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Morning Clock-In Terminal */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Step 1 · Arrival
              </span>
              <span className="text-[11px] text-slate-500 font-medium">07:15 - 09:00</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">Morning Clock-In</h3>

            {hasClockedInToday ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Clock-In Recorded</span>
                </div>
                <p className="text-slate-600">
                  Time: <strong>{todayRecord?.clockInTime} SAST</strong>
                </p>
                <p className="text-slate-600">
                  Status: <strong>
                    {todayRecord?.status === 'Present'
                      ? 'Present – On Time'
                      : todayRecord?.status === 'Late'
                      ? 'Present – Late'
                      : todayRecord?.status}
                  </strong>
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Log your arrival for today's session. Arriving after 09:00 is marked as late.
              </p>
            )}
          </div>

          {!hasClockedInToday && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <button
                onClick={handleClockIn}
                disabled={clockInButtonState !== 'Available'}
                className={`w-full py-2.5 px-4 rounded-md font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer ${
                  clockInButtonState === 'Available'
                    ? 'bg-[#F4B52C] hover:bg-[#E0A220] text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Clock In Now</span>
              </button>
              {clockInButtonState === 'Disabled' && (
                <p className="text-[10px] text-center text-slate-500">
                  {isOfficeDay && !isLocationVerified
                    ? 'Verify location first.'
                    : !clockInEval.isOpen
                    ? 'Terminal opens at 07:15 SAST.'
                    : 'Clock-in is temporarily disabled.'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Afternoon Clock-Out Terminal */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Step 2 · Departure
              </span>
              <span className="text-[11px] text-slate-500 font-medium">From 15:15 SAST</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">Afternoon Clock-Out</h3>

            {hasClockedOutToday ? (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-[#2F3E96] font-bold">
                  <CheckCircle2 className="w-4 h-4 text-[#2F3E96]" />
                  <span>Clock-Out Completed</span>
                </div>
                <p className="text-slate-600">
                  Time: <strong>{todayRecord?.clockOutTime} SAST</strong>
                </p>
                <p className="text-slate-600">
                  Daily attendance ledger is sealed.
                </p>
              </div>
            ) : hasClockedInToday ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-amber-800 font-bold">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>
                    {clockOutEval.allowed ? 'Ready for Clock-Out' : 'Shift in Progress'}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  {clockOutEval.allowed
                    ? 'Minimum shift threshold (15:15 SAST) reached. You may clock out.'
                    : `Clock-out opens at 15:15 SAST (${clockOutEval.minutesRemaining} min remaining).`}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                You must complete clock-in before departure clock-out is permitted.
              </p>
            )}
          </div>

          {hasClockedInToday && !hasClockedOutToday && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowClockOutModal(true)}
                disabled={clockOutButtonState !== 'Available'}
                className={`w-full py-2.5 px-4 rounded-md font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer ${
                  clockOutButtonState === 'Available'
                    ? 'bg-[#F4B52C] hover:bg-[#E0A220] text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                <LogOut className="w-4 h-4" />
                <span>Clock Out Now</span>
              </button>
              {clockOutButtonState === 'Disabled' && (
                <p className="text-[10px] text-center text-slate-500">
                  Clock-out is permitted from 15:15 SAST.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Clock-Out Confirmation Modal */}
      {showClockOutModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full border border-slate-200 p-5 space-y-4 text-[#333333]">
            <div className="flex items-center gap-2.5 text-[#2F3E96]">
              <LogOut className="w-5 h-5 text-[#F4B52C]" />
              <h4 className="font-bold text-base text-slate-900">Confirm Clock-Out</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to clock out? This will seal your attendance ledger for today.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowClockOutModal(false)}
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
