import React, { useState, useEffect } from 'react';
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
  Navigation,
  ShieldCheck,
  ShieldAlert,
  Info,
  Radio,
  X,
} from 'lucide-react';
import { evaluateClockInStatus, isClockOutAllowed } from '../../../utils/geoUtils';
import { TEST_LOCATION_PRESETS } from '../../../data/mockData';

export const LearnerAttendanceScreen: React.FC = () => {
  const {
    currentUser,
    currentTime,
    todayScheduleType,
    workplaceConfig,
    currentCoordinates,
    selectedPresetId,
    setCoordinatesPreset,
    captureAndVerifyLocation,
    locationVerificationResult,
    isCapturingLocation,
    lastLocationCapturedAt,
    distanceFromOffice,
    isLocationVerified,
    gpsAccuracyMeters,
    dailyAccessId,
    isDailyAccessVerified,
    workingDayStatus,
    systemControls,
    hasClockedInToday,
    hasClockedOutToday,
    todayRecord,
    clockIn,
    clockOut,
  } = useAttendance();

  const [clockInMessage, setClockInMessage] = useState<string | null>(null);
  const [clockOutMessage, setClockOutMessage] = useState<string | null>(null);
  const [showClockOutModal, setShowClockOutModal] = useState(false);
  const [notesInput, setNotesInput] = useState('');

  // Automatically request GPS verification when opening attendance screen on an Office day if not yet performed
  useEffect(() => {
    if (todayScheduleType === 'office' && !locationVerificationResult) {
      captureAndVerifyLocation();
    }
  }, [todayScheduleType, locationVerificationResult, captureAndVerifyLocation]);

  const clockInEval = evaluateClockInStatus(currentTime);
  const clockOutEval = isClockOutAllowed(currentTime);

  // Determine Clock-In State: 'Available' | 'Disabled' | 'Completed'
  const isClockInBlocked =
    (todayScheduleType === 'office' && !isLocationVerified) ||
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. Header */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>DynamicDNA · DVT Learnership Programme</span>
            <span>·</span>
            <span>GPS Attendance Terminal</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Daily Attendance Verification
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Learner: <strong>{currentUser?.fullName}</strong> ({currentUser?.learnerNumber})
          </p>
        </div>

        {/* Live Clock & Schedule Badge */}
        <div className="text-left sm:text-right">
          <div className="font-mono text-xl font-bold text-slate-900 tabular-nums">
            {currentTime.toTimeString().split(' ')[0]} <span className="text-xs text-slate-500">SAST</span>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded mt-1.5 border border-[#E5E7EB] bg-slate-50">
            {todayScheduleType === 'office' ? (
              <Building className="w-4 h-4 text-[#2F3E96]" />
            ) : (
              <Home className="w-4 h-4 text-emerald-600" />
            )}
            <span className="text-slate-800">
              Schedule: {todayScheduleType === 'office' ? 'Office Day (Mandatory GPS)' : 'Work From Home (GPS Exempt)'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Non-working day banner */}
      {!workingDayStatus.isWorkingDay && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">
              {workingDayStatus.isWeekend ? 'Weekend Notice' : workingDayStatus.holidayName}
            </h4>
            <p className="mt-0.5 font-medium">Attendance is not required today.</p>
          </div>
        </div>
      )}

      {/* 3. Authorised Workplace Coordinates & Geofence Parameters */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-[#2F3E96]" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Authorised Workplace Coordinates
            </h3>
          </div>
          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            Authoritative Centroid
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-50 p-3 rounded border border-[#E5E7EB]">
            <span className="text-[10px] text-slate-500 block uppercase font-semibold">
              Workplace Name:
            </span>
            <span className="font-bold text-slate-900 text-sm block mt-0.5">
              {workplaceConfig.name}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {workplaceConfig.programme}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded border border-[#E5E7EB]">
            <span className="text-[10px] text-slate-500 block uppercase font-semibold">
              Campus Centroid:
            </span>
            <span className="font-mono text-slate-800 text-xs block mt-0.5">
              Lat: {workplaceConfig.coordinates.latitude.toFixed(6)}
            </span>
            <span className="font-mono text-slate-800 text-xs block">
              Lng: {workplaceConfig.coordinates.longitude.toFixed(6)}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded border border-[#E5E7EB]">
            <span className="text-[10px] text-slate-500 block uppercase font-semibold">
              Permitted Radius:
            </span>
            <span className="font-bold text-[#2F3E96] text-base block mt-0.5 font-mono">
              {workplaceConfig.allowedRadiusMeters} metres
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Haversine Great-Circle boundary
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded border border-[#E5E7EB]">
            <span className="text-[10px] text-slate-500 block uppercase font-semibold">
              Accuracy Threshold:
            </span>
            <span className="font-bold text-slate-800 text-base block mt-0.5 font-mono">
              ≤ {workplaceConfig.gpsAccuracyThresholdMeters} metres
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Status: {workplaceConfig.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. SECTION 1: GPS Location Detection & Verification Display */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-[#2F3E96]" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              GPS Location Detection & Verification
            </h3>
          </div>
          <span className="text-[10px] text-slate-400">
            Browser Geolocation API (enableHighAccuracy: true)
          </span>
        </div>

        {/* Section 1 Required Exact Display: Your Current Location */}
        <div className="bg-slate-50 p-4 rounded-lg border border-[#E5E7EB] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Your Current Location
            </span>
            {lastLocationCapturedAt && (
              <span className="text-[11px] font-mono text-slate-500">
                Captured: {new Date(lastLocationCapturedAt).toLocaleTimeString('en-ZA', { timeZone: 'Africa/Johannesburg' })}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div className="bg-white p-2.5 rounded border border-[#E5E7EB]">
              <span className="text-[10px] text-slate-500 uppercase block font-sans font-semibold">
                Latitude:
              </span>
              <span className="text-sm font-bold text-slate-900">
                {currentCoordinates?.latitude !== undefined
                  ? currentCoordinates.latitude.toFixed(6)
                  : '--.------'}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded border border-[#E5E7EB]">
              <span className="text-[10px] text-slate-500 uppercase block font-sans font-semibold">
                Longitude:
              </span>
              <span className="text-sm font-bold text-slate-900">
                {currentCoordinates?.longitude !== undefined
                  ? currentCoordinates.longitude.toFixed(6)
                  : '--.------'}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded border border-[#E5E7EB]">
              <span className="text-[10px] text-slate-500 uppercase block font-sans font-semibold">
                Accuracy:
              </span>
              <span className="text-sm font-bold text-slate-900">
                {gpsAccuracyMeters} metres
              </span>
            </div>
          </div>

          {/* Action Button: [Verify My Location] / [Retry Location] */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
            {/* Primary Action Button: #F4B52C */}
            <button
              onClick={handleVerifyLocation}
              disabled={isCapturingLocation}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#F4B52C] hover:bg-[#E0A220] text-white font-semibold text-xs rounded transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCapturingLocation ? 'animate-spin' : ''}`} />
              <span>{isCapturingLocation ? 'Querying Browser GPS...' : 'Verify My Location'}</span>
            </button>

            {locationVerificationResult && (
              <button
                onClick={handleVerifyLocation}
                disabled={isCapturingLocation}
                className="w-full sm:w-auto px-4 py-2.5 bg-[#2F3E96] hover:bg-[#25327a] text-white font-semibold text-xs rounded transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Location</span>
              </button>
            )}

            <span className="text-[11px] text-slate-500">
              Only requests location on demand when verifying attendance. Continuous background tracking is disabled.
            </span>
          </div>
        </div>

        {/* SECTION 4: Location Verification Status Card */}
        {todayScheduleType === 'office' ? (
          <div>
            {isLocationVerified ? (
              // SUCCESS STATUS
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-950 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>LOCATION VERIFIED (SUCCESS)</span>
                </div>
                <p className="font-medium text-emerald-900">
                  Authorised radius: <strong>{workplaceConfig.allowedRadiusMeters} metres</strong>. Learner distance: <strong>{distanceFromOffice} metres</strong>. GPS Accuracy: <strong>{gpsAccuracyMeters} metres</strong>.
                </p>
                <p className="text-[11px] text-emerald-700">
                  Result: Physical presence at DynamicDNA confirmed. You may now clock in.
                </p>
              </div>
            ) : gpsAccuracyMeters > workplaceConfig.gpsAccuracyThresholdMeters ? (
              // WARNING STATUS: ACCURACY INSUFFICIENT
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-950 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>GPS ACCURACY INSUFFICIENT (WARNING)</span>
                </div>
                <p className="font-medium text-amber-900">
                  GPS accuracy is {gpsAccuracyMeters}m, which exceeds the required threshold of {workplaceConfig.gpsAccuracyThresholdMeters}m.
                </p>
                <p className="text-[11px] text-amber-800">
                  Please move closer to a window or outdoors to improve satellite signal, then click <strong>[Retry Location]</strong>.
                </p>
              </div>
            ) : (
              // ERROR STATUS: OUTSIDE AUTHORISED AREA OR DENIED
              <div className="p-4 bg-rose-50 border border-rose-300 rounded-lg text-xs text-rose-950 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-sm text-rose-800">
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>ATTENDANCE DENIED: OUTSIDE AUTHORISED WORKPLACE AREA</span>
                </div>
                <p className="font-medium text-rose-900">
                  Today is an Office Day. You must be physically present at DynamicDNA.
                </p>
                <p className="text-[11px] text-rose-800">
                  Authorised radius: {workplaceConfig.allowedRadiusMeters} metres. Current learner distance: <strong>{distanceFromOffice} metres</strong> (Exceeded by {distanceFromOffice - workplaceConfig.allowedRadiusMeters} metres).
                </p>
              </div>
            )}
          </div>
        ) : (
          // WORK FROM HOME CLEARED STATUS
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-950 space-y-1">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>WORK-FROM-HOME DAY: GPS VERIFICATION EXEMPT</span>
            </div>
            <p className="font-medium text-emerald-900">
              Work-From-Home Day: Workplace GPS verification not required.
            </p>
            <p className="text-[11px] text-emerald-700">
              Remote attendance authorization is active. You may log clock-in according to schedule hours.
            </p>
          </div>
        )}

        {/* Development & Reviewer Testing Presets Selector */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-[#2F3E96]" />
              <span>Reviewer & Test Simulation Coordinates</span>
            </span>
            <span className="text-[10px] text-slate-400">
              Test passing & failing geofences
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {TEST_LOCATION_PRESETS.map((preset) => {
              const isSelected = selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => setCoordinatesPreset(preset.id)}
                  className={`p-2 rounded border text-left transition-colors cursor-pointer text-xs ${
                    isSelected
                      ? 'border-[#2F3E96] bg-blue-50/80 font-bold text-[#2F3E96]'
                      : 'border-[#E5E7EB] bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className="block truncate font-semibold text-[11px]">{preset.name}</span>
                  <span className="block text-[9px] text-slate-500 mt-0.5">
                    {preset.isWithinGeofence ? '≤ 100m (Pass)' : '> 100m (Fail)'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Daily Access ID Verification Status Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#2F3E96]" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Daily Access ID Token
            </h3>
          </div>
          <span className="text-[10px] text-slate-400">
            Valid For Today Only (Expires at Midnight SAST)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-50 p-3 rounded border border-[#E5E7EB]">
            <span className="text-[10px] text-slate-500 block uppercase font-semibold">
              Daily Access ID:
            </span>
            <span
              className={`font-mono font-bold text-base ${
                isDailyAccessVerified && dailyAccessId ? 'text-[#2F3E96]' : 'text-rose-600'
              }`}
            >
              {isDailyAccessVerified && dailyAccessId ? dailyAccessId : 'Access Denied'}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Unique single-day cryptographic access token
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded border border-[#E5E7EB]">
            <span className="text-[10px] text-slate-500 block uppercase font-semibold">
              Schedule Rule Applied:
            </span>
            <span className="font-semibold text-slate-800 block">
              {todayScheduleType === 'office'
                ? `Office Day (Requires Physical Presence at ${workplaceConfig.name})`
                : 'Work From Home (GPS Not Required)'}
            </span>
          </div>
        </div>
      </div>

      {/* 6. Clock-In Terminal Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <LogIn className="w-4 h-4 text-[#2F3E96]" />
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
                  ? 'bg-blue-100 text-[#2F3E96]'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              State: {clockInButtonState}
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              07:15 - 09:00 (On-Time)
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
            <div className="bg-white/80 p-3 rounded border border-emerald-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
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
                <span className="text-slate-500 block">Distance:</span>
                <span className="font-mono text-slate-800">
                  {todayRecord?.verifiedDistanceMeters !== undefined
                    ? `${todayRecord.verifiedDistanceMeters}m`
                    : 'WFH Exempt'}
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
              Clock-in is locked. You may register departure at shift completion (from 15:15).
            </p>
          </div>
        ) : (
          <div className="space-y-3 text-xs">
            {clockInMessage && (
              <div
                className={`p-3 rounded border text-xs ${
                  clockInMessage.includes('successfully')
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}
              >
                {clockInMessage}
              </div>
            )}

            <div className="bg-slate-50 p-3 rounded border border-[#E5E7EB] space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-600">Expected Attendance Status:</span>
                <span
                  className={`font-bold uppercase ${
                    clockInEval.status === 'Present' ? 'text-emerald-700' : 'text-[#F4B52C]'
                  }`}
                >
                  {clockInEval.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">{clockInEval.message}</p>
            </div>

            {/* Optional attendance notes */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Attendance Notes (Optional):
              </label>
              <input
                type="text"
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="e.g. Morning team standup, Training room A"
                className="w-full px-3 py-1.5 border border-[#E5E7EB] rounded text-xs focus:ring-1 focus:ring-[#2F3E96] focus:border-[#2F3E96] bg-white"
              />
            </div>

            {/* Primary Button: #F4B52C, Text: White */}
            <button
              onClick={handleClockIn}
              disabled={clockInButtonState !== 'Available'}
              className={`w-full py-2.5 px-4 font-semibold text-xs rounded transition-colors flex items-center justify-center gap-2 ${
                clockInButtonState === 'Available'
                  ? 'bg-[#F4B52C] hover:bg-[#E0A220] text-white shadow-xs cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-[#E5E7EB]'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>
                {clockInButtonState === 'Available'
                  ? `Clock In (${clockInEval.status.toUpperCase()})`
                  : todayScheduleType === 'office' && !isLocationVerified
                  ? 'Clock In Disabled (GPS Verification Required)'
                  : !clockInEval.isOpen
                  ? 'Clock In Closed (Opens 07:15)'
                  : 'Clock In Disabled'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* 7. Clock-Out Terminal Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <LogOut className="w-4 h-4 text-[#2F3E96]" />
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
                  ? 'bg-blue-100 text-[#2F3E96]'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              State: {clockOutButtonState}
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Shift Clearance: 15:15
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
              Shift concluded at <strong>{todayRecord?.clockOutTime}</strong>. Daily attendance ledger sealed.
            </p>
          </div>
        ) : (
          <div className="space-y-3 text-xs">
            {clockOutMessage && (
              <div
                className={`p-3 rounded border text-xs ${
                  clockOutMessage.includes('successfully')
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}
              >
                {clockOutMessage}
              </div>
            )}

            {!clockOutEval.allowed ? (
              <div className="p-3 bg-slate-50 border border-[#E5E7EB] rounded text-slate-700 space-y-1">
                <p className="font-bold text-slate-900">Clock-Out Available From 15:15</p>
                <p className="text-[11px] text-slate-500">
                  {clockOutEval.minutesRemaining} minutes remaining until shift clearance threshold.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-900">
                <p className="font-bold">Shift Clearance Reached</p>
                <p className="text-[11px] text-emerald-700">
                  Clock-out is enabled. A confirmation modal will appear prior to final submission.
                </p>
              </div>
            )}

            {/* Primary Button: #F4B52C, Text: White */}
            <button
              onClick={() => setShowClockOutModal(true)}
              disabled={clockOutButtonState !== 'Available'}
              className={`w-full py-2.5 px-4 font-semibold text-xs rounded transition-colors flex items-center justify-center gap-2 ${
                clockOutButtonState === 'Available'
                  ? 'bg-[#F4B52C] hover:bg-[#E0A220] text-white shadow-xs cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-[#E5E7EB]'
              }`}
            >
              <LogOut className="w-4 h-4" />
              <span>
                {!hasClockedInToday
                  ? 'Clock-In Required First'
                  : !clockOutEval.allowed
                  ? 'Clock-Out Available From 15:15'
                  : 'Clock Out (Departure)'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* 8. Clock-Out Confirmation Modal */}
      {showClockOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <LogOut className="w-4 h-4 text-[#2F3E96]" />
                <span>Confirm Shift Departure</span>
              </div>
              <button
                onClick={() => setShowClockOutModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <p>
                Are you sure you want to clock out now?
              </p>
              <div className="p-3 bg-slate-50 border border-[#E5E7EB] rounded font-mono text-[11px] space-y-1">
                <p>Learner: <strong>{currentUser?.fullName}</strong></p>
                <p>Clock-In Recorded: {todayRecord?.clockInTime}</p>
                <p>Departure Time: {currentTime.toTimeString().split(' ')[0]} SAST</p>
              </div>
              <p className="text-rose-700 font-semibold">
                This will finalize and seal your attendance register for today.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowClockOutModal(false)}
                className="px-4 py-2 border border-[#E5E7EB] text-slate-700 text-xs font-semibold rounded hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              {/* Primary Button: #F4B52C */}
              <button
                onClick={handleConfirmClockOut}
                className="px-4 py-2 bg-[#F4B52C] hover:bg-[#E0A220] text-white text-xs font-semibold rounded transition-colors shadow-xs cursor-pointer"
              >
                Yes, Clock Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
