import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { TEST_LOCATION_PRESETS } from '../../data/mockData';
import {
  Clock,
  MapPin,
  ShieldCheck,
  User,
  Users,
  ChevronDown,
  Layers,
  Smartphone,
  Monitor,
  RotateCcw,
  UserPlus,
  KeyRound,
  Building,
  Home,
  AlertTriangle,
  LogOut,
} from 'lucide-react';

export const Navbar: React.FC<{ onOpenCreateProfileModal: () => void }> = ({
  onOpenCreateProfileModal,
}) => {
  const {
    currentUser,
    activeScreen,
    setActiveScreen,
    currentTime,
    isSimulatedTime,
    setSimulatedTime,
    todayScheduleType,
    distanceFromOffice,
    isLocationVerified,
    dailyAccessId,
    isDailyAccessVerified,
    accessDeniedMessage,
    selectedPresetId,
    setCoordinatesPreset,
    switchUserRole,
    logout,
    isMobileDeviceView,
    setIsMobileDeviceView,
    convertTodaySchedule,
    systemControls,
    updateSystemControls,
  } = useAttendance();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isTestControlsOpen, setIsTestControlsOpen] = useState(false);

  // Screen titles
  const screenTitleMap: Record<string, string> = {
    learner_dashboard: 'Learner Dashboard',
    learner_attendance: 'Attendance Terminal (Clock In / Out)',
    learner_history: 'Attendance History',
    learner_report_absence: 'Report Absence',
    learner_directory: 'Learner Directory & Professional Skills',
    learner_profile: 'My Profile',
    admin_dashboard: 'Admin Dashboard',
    admin_learners: 'Learner Management',
    admin_attendance: 'Attendance Register Overview',
    admin_absence_requests: 'Absence Requests Review',
    admin_register_downloads: 'Register Downloads & Printable A4',
    admin_system_controls: 'System Controls & Overrides',
    admin_schedule_management: 'Work Schedule Management',
    admin_settings: 'Workplace Settings',
    specs_documentation: 'Enterprise Specifications & Deliverables',
  };

  const handleSimulateTime = (hours: number, minutes: number) => {
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    setSimulatedTime(d);
  };

  const isLearner = currentUser?.role === 'learner';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="flex items-center justify-between px-3 sm:px-6 h-14">
        {/* Left: Brand & Organization */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <img
              src="/dynamicdna-logo.png"
              alt="DynamicDNA"
              className="h-8 w-auto object-contain shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="h-5 w-px bg-[#E5E7EB] hidden sm:block" />
            <div className="flex flex-col">
              <span className="text-base font-bold text-[#333333] leading-none tracking-tight">
                SmartRegister
              </span>
              <span className="text-[10px] font-semibold text-[#2F3E96] tracking-wide mt-0.5">
                DynamicDNA | DVT Learnership Programme
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center text-slate-300 mx-1">/</div>
          <span className="hidden md:inline-block text-xs font-semibold text-[#333333] bg-[#F5F5F5] border border-[#E5E7EB] px-2 py-0.5 rounded">
            {screenTitleMap[activeScreen] || 'Dashboard'}
          </span>
        </div>

        {/* Center: Live Schedule & Daily Access Status */}
        <div className="hidden lg:flex items-center gap-2">
          {/* Today's Schedule Badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded border ${
              todayScheduleType === 'office'
                ? 'bg-blue-50 border-[#2F3E96]/30 text-[#2F3E96]'
                : 'bg-amber-50 border-[#F4B52C]/40 text-amber-900'
            }`}
          >
            {todayScheduleType === 'office' ? (
              <Building className="w-3.5 h-3.5 text-[#2F3E96]" />
            ) : (
              <Home className="w-3.5 h-3.5 text-[#F4B52C]" />
            )}
            <span>Today: {todayScheduleType === 'office' ? 'Office' : 'Work From Home'}</span>
          </div>

          {/* Daily Access ID indicator (For Learners) */}
          {isLearner && (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-medium rounded border ${
                isDailyAccessVerified && dailyAccessId
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>
                {isDailyAccessVerified && dailyAccessId
                  ? dailyAccessId
                  : 'Access Denied'}
              </span>
            </div>
          )}

          {/* SAST Live Time */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded border bg-slate-50 border-slate-200 text-slate-700">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-mono tabular-nums font-semibold">
              {currentTime.toTimeString().split(' ')[0]}
            </span>
            {isSimulatedTime && (
              <span className="text-[9px] text-amber-800 font-bold bg-[#F4B52C]/30 px-1 rounded">
                SIM
              </span>
            )}
          </div>

          {/* Simulator Bar Toggle */}
          <button
            onClick={() => setIsTestControlsOpen(!isTestControlsOpen)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
            title="Adjust simulation tools: switch Office/WFH, shift time, or GPS radius"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#2F3E96]" />
            <span>Test Tools</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
        </div>

        {/* Right: New Profile, Mobile View, Persona Switcher */}
        <div className="flex items-center gap-2">
          {/* Create Learner Profile Button (Primary Button: Background #F4B52C, Text: White) */}
          <button
            onClick={onOpenCreateProfileModal}
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#F4B52C] hover:bg-[#E0A220] rounded transition-colors shadow-xs"
            title="Create new learner profile"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>New Learner</span>
          </button>

          {/* Mobile frame toggle */}
          <button
            onClick={() => setIsMobileDeviceView(!isMobileDeviceView)}
            className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors"
            title="Toggle simulated mobile view"
          >
            {isMobileDeviceView ? (
              <>
                <Monitor className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Desktop</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Mobile</span>
              </>
            )}
          </button>

          {/* User Profile & Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2 pl-2 pr-2.5 py-1 text-xs font-medium rounded hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.fullName}
                  className="w-6 h-6 rounded-full object-cover border border-slate-200"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#2F3E96] text-white flex items-center justify-center font-bold text-[10px]">
                  {currentUser?.firstName?.charAt(0) || 'U'}
                </div>
              )}
              <div className="text-left hidden sm:block">
                <span className="block font-semibold text-slate-800 leading-tight">
                  {currentUser?.fullName}
                </span>
                <span className="block text-[10px] text-slate-500 uppercase font-mono">
                  {currentUser?.role === 'admin' ? 'DVT Admin' : currentUser?.learnerNumber}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Profile Dropdown */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-1 w-64 bg-white border border-slate-200 rounded-md shadow-lg py-1.5 z-50 text-xs">
                <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                  <p className="font-semibold text-slate-900">{currentUser?.fullName}</p>
                  <p className="text-[11px] text-[#2F3E96] font-mono font-semibold">
                    {currentUser?.learnerNumber} · {currentUser?.role?.toUpperCase()}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {currentUser?.programme}
                  </p>
                </div>

                {/* Role Switcher */}
                <div className="px-3 py-2 border-b border-slate-100">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Switch Role Persona:
                  </span>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => {
                        switchUserRole('learner');
                        setIsProfileMenuOpen(false);
                      }}
                      className={`px-2 py-1 text-left rounded text-[11px] font-medium transition-colors ${
                        currentUser?.role === 'learner'
                          ? 'bg-[#2F3E96] text-white font-semibold'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Zwavhudi (Learner)
                    </button>
                    <button
                      onClick={() => {
                        switchUserRole('admin');
                        setIsProfileMenuOpen(false);
                      }}
                      className={`px-2 py-1 text-left rounded text-[11px] font-medium transition-colors ${
                        currentUser?.role === 'admin'
                          ? 'bg-[#2F3E96] text-white font-semibold'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Thabo (Admin)
                    </button>
                  </div>
                </div>

                {isLearner && (
                  <>
                    <button
                      onClick={() => {
                        setActiveScreen('learner_directory');
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-slate-700 hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 text-[#2F3E96]" />
                      <span>Learner Directory</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveScreen('learner_profile');
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-slate-700 hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-[#2F3E96]" />
                      <span>My Profile</span>
                    </button>
                  </>
                )}

                <button
                  onClick={() => {
                    onOpenCreateProfileModal();
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-[#2F3E96] hover:bg-amber-50 flex items-center gap-2 font-medium"
                >
                  <UserPlus className="w-3.5 h-3.5 text-[#F4B52C]" />
                  <span>Create New Learner Profile</span>
                </button>

                <div className="pt-1 mt-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      logout();
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Simulator Tools Bar */}
      {isTestControlsOpen && (
        <div className="bg-slate-900 text-white px-3 sm:px-6 py-2.5 text-xs border-t border-slate-700 shadow-inner">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Shift Time preset */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-300">Simulate Shift Time:</span>
              <button
                onClick={() => handleSimulateTime(8, 15)}
                className="bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 px-2 py-0.5 rounded text-xs"
              >
                08:15 (Present Window)
              </button>
              <button
                onClick={() => handleSimulateTime(9, 25)}
                className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 px-2 py-0.5 rounded text-xs"
              >
                09:25 (Late Window)
              </button>
              <button
                onClick={() => handleSimulateTime(15, 30)}
                className="bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 px-2 py-0.5 rounded text-xs"
              >
                15:30 (Clock-Out Enabled)
              </button>
              {isSimulatedTime && (
                <button
                  onClick={() => setSimulatedTime(null)}
                  className="bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700 px-1.5 py-0.5 rounded text-xs flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Live</span>
                </button>
              )}
            </div>

            {/* GPS Simulation */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-300">GPS Location:</span>
              <select
                value={selectedPresetId}
                onChange={(e) => setCoordinatesPreset(e.target.value)}
                className="bg-slate-800 text-white border border-slate-700 rounded px-2 py-0.5 text-xs"
              >
                {TEST_LOCATION_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.isWithinGeofence ? '(≤ 100m ✅)' : '(Outside ❌)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Toggle Today's Schedule (Office vs WFH) */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-300">Today's Schedule:</span>
              <button
                onClick={() => convertTodaySchedule('office')}
                className={`px-2 py-0.5 rounded text-xs border transition-colors ${
                  todayScheduleType === 'office'
                    ? 'bg-[#2F3E96] text-white border-blue-400 font-bold'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                Office Day
              </button>
              <button
                onClick={() => convertTodaySchedule('wfh')}
                className={`px-2 py-0.5 rounded text-xs border transition-colors ${
                  todayScheduleType === 'wfh'
                    ? 'bg-[#F4B52C] text-[#2F3E96] border-amber-300 font-bold'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                Work From Home
              </button>
            </div>

            <button
              onClick={() => setIsTestControlsOpen(false)}
              className="text-slate-400 hover:text-white underline text-xs ml-auto"
            >
              Hide Bar
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
