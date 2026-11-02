import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { TEST_LOCATION_PRESETS } from '../../data/mockData';
import { DYNAMIC_DNA_OFFICE } from '../../utils/geoUtils';
import {
  Building2,
  Clock,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  KeyRound,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Info,
  LogIn,
  UserPlus,
  ArrowRight,
  Sparkles,
  Lock,
  Mail,
  Phone,
  User,
  Radio,
  FileText,
  Calendar,
} from 'lucide-react';

export const LoginRegistrationScreen: React.FC = () => {
  const {
    loginWithLearnerEmail,
    loginWithAdminAccessId,
    submitLearnerRegistration,
    announcements,
    todayScheduleType,
    currentTime,
    currentCoordinates,
    selectedPresetId,
    setCoordinatesPreset,
    distanceFromOffice,
    isLocationVerified,
    convertTodaySchedule,
  } = useAttendance();

  // Tab State: 'login' | 'register'
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Learner Login Fields & States
  const [learnerEmail, setLearnerEmail] = useState('');
  const [learnerLoginFeedback, setLearnerLoginFeedback] = useState<{
    status: 'idle' | 'verified' | 'pending' | 'failed' | 'not_found';
    message: string;
    accessId?: string;
  }>({ status: 'idle', message: '' });

  // Admin Login Fields & States
  const [adminAccessId, setAdminAccessId] = useState('');
  const [adminFeedback, setAdminFeedback] = useState<{
    status: 'idle' | 'success' | 'failed';
    message: string;
  }>({ status: 'idle', message: '' });

  // Registration Form Fields & States
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regContactNumber, setRegContactNumber] = useState('');
  const [registrationSubmitted, setRegistrationSubmitted] = useState<{
    submitted: boolean;
    generatedEmail: string;
    firstName: string;
    lastName: string;
  } | null>(null);

  // Auto-calculated work email preview
  const previewEmail =
    regFirstName.trim() || regLastName.trim()
      ? `${regFirstName.trim().toLowerCase().replace(/[^a-z0-9]/g, '') || 'firstname'}.${
          regLastName.trim().toLowerCase().replace(/[^a-z0-9]/g, '') || 'lastname'
        }@learners.dynamicdna.co.za`
      : 'firstname.lastname@learners.dynamicdna.co.za';

  // Active Announcements (filter out inactive/expired ones)
  const activeAnnouncements = announcements.filter((a) => a.isActive);
  const urgentAnnouncements = activeAnnouncements.filter((a) => a.isUrgent);
  const standardAnnouncements = activeAnnouncements.filter((a) => !a.isUrgent);

  // Learner Login Handler
  const handleLearnerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!learnerEmail.trim()) {
      setLearnerLoginFeedback({
        status: 'failed',
        message: 'Please enter your work email address.',
      });
      return;
    }

    const result = loginWithLearnerEmail(learnerEmail);
    if (result.success) {
      setLearnerLoginFeedback({
        status: 'verified',
        message: result.message,
        accessId: result.accessId,
      });
    } else {
      setLearnerLoginFeedback({
        status: result.status || 'failed',
        message: result.message,
      });
    }
  };

  // Admin Login Handler
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminAccessId.trim()) {
      setAdminFeedback({
        status: 'failed',
        message: 'Please enter your Admin Access ID.',
      });
      return;
    }

    const result = loginWithAdminAccessId(adminAccessId);
    if (result.success) {
      setAdminFeedback({ status: 'success', message: result.message });
    } else {
      setAdminFeedback({ status: 'failed', message: result.message });
    }
  };

  // Registration Submit Handler
  const handleRegistrationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFirstName.trim() || !regLastName.trim() || !regContactNumber.trim()) {
      return;
    }

    const { generatedEmail } = submitLearnerRegistration(
      regFirstName,
      regLastName,
      regContactNumber
    );

    setRegistrationSubmitted({
      submitted: true,
      generatedEmail,
      firstName: regFirstName.trim(),
      lastName: regLastName.trim(),
    });
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-slate-800 flex flex-col font-sans antialiased">
      {/* 1. Portal Top Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-[#0F4C81] flex items-center justify-center text-white font-bold text-sm tracking-wider shadow-xs">
              DVT
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-slate-900 tracking-tight">
                  SmartRegister
                </span>
                <span className="text-[10px] font-bold text-[#0F4C81] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded uppercase">
                  Enterprise Portal
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                DynamicDNA | DVT Learnership Programme
              </p>
            </div>
          </div>

          {/* Center Tabs: [ Login ] [ Register ] */}
          <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              onClick={() => {
                setActiveTab('login');
                setRegistrationSubmitted(null);
              }}
              className={`flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'login'
                  ? 'bg-white text-[#0F4C81] shadow-xs border border-slate-200/60 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('register');
                setLearnerLoginFeedback({ status: 'idle', message: '' });
              }}
              className={`flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'register'
                  ? 'bg-white text-[#0F4C81] shadow-xs border border-slate-200/60 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register</span>
            </button>
          </div>

          {/* Right Live Indicators */}
          <div className="hidden md:flex items-center gap-3 text-xs">
            {/* Today Schedule Badge */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-semibold border ${
                todayScheduleType === 'office'
                  ? 'bg-blue-50 border-blue-200 text-[#0F4C81]'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              <span>Today: {todayScheduleType === 'office' ? 'Office Day' : 'Work From Home'}</span>
            </div>

            {/* Live Clock */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-slate-700 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentTime.toTimeString().split(' ')[0]} SAST</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Urgent Announcements Highlight Banner */}
      {urgentAnnouncements.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-300 px-4 py-3 shadow-xs">
          <div className="max-w-7xl mx-auto flex items-start gap-3">
            <div className="p-1.5 bg-amber-200 rounded text-amber-900 shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4 font-bold" />
            </div>
            <div className="flex-1 text-xs text-amber-900">
              {urgentAnnouncements.map((u) => (
                <div key={u.id} className="mb-1 last:mb-0">
                  <span className="font-bold uppercase tracking-wider text-[11px] text-amber-950">
                    URGENT NOTICE: {u.title}
                  </span>
                  <p className="mt-0.5 text-amber-800 leading-relaxed font-medium">
                    {u.content}
                  </p>
                </div>
              ))}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded border border-amber-300 shrink-0">
              Priority Alert
            </span>
          </div>
        </div>
      )}

      {/* 3. Main 3-Column Content Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ========================================================= */}
          {/* LEFT COLUMN: System Overview & Workplace Rules (col-span-3) */}
          {/* ========================================================= */}
          <div className="lg:col-span-3 space-y-5">
            {/* Organization Info Card */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-5 h-5 text-[#0F4C81]" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  DynamicDNA
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                SmartRegister is the official GPS-verified attendance management platform for the{' '}
                <strong className="text-slate-800">DVT Learnership Programme</strong>, replacing manual
                paper registers with cryptographically verifiable daily attendance records.
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 text-xs space-y-1.5 text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-500">Programme:</span>
                  <span className="font-semibold text-slate-800">DVT Learnership</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Academic Year:</span>
                  <span className="font-semibold text-slate-800">2026 Intake</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">System Mode:</span>
                  <span className="font-semibold text-emerald-700">Digital Register</span>
                </div>
              </div>
            </div>

            {/* Workplace Location & Geofence Card */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#0F4C81]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Workplace Coordinates
                  </h4>
                </div>
                <span className="text-[10px] bg-blue-50 text-[#0F4C81] border border-blue-200 px-1.5 py-0.2 rounded font-bold">
                  100m Geofence
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs space-y-1 font-mono text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Centroid:</span>
                  <span className="font-semibold text-slate-900">DynamicDNA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Latitude:</span>
                  <span>-26.097841</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Longitude:</span>
                  <span>27.998357</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Radius:</span>
                  <span className="font-bold text-[#0F4C81]">100 Metres</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-normal">
                Attendance can only be registered when learner device coordinates fall strictly within
                100 metres of the workplace centroid during Office Days.
              </p>
            </div>

            {/* Attendance Rules Summary */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs text-xs space-y-2.5">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Attendance Times</span>
              </h4>
              <div className="space-y-1.5 text-slate-600">
                <div className="flex justify-between items-center p-1.5 rounded bg-emerald-50/70 border border-emerald-100">
                  <span className="text-emerald-900 font-semibold">Clock In (Present):</span>
                  <span className="font-mono font-bold text-emerald-800">07:15 - 09:00</span>
                </div>
                <div className="flex justify-between items-center p-1.5 rounded bg-amber-50/70 border border-amber-100">
                  <span className="text-amber-900 font-semibold">Late Status:</span>
                  <span className="font-mono font-bold text-amber-800">After 09:00</span>
                </div>
                <div className="flex justify-between items-center p-1.5 rounded bg-blue-50/70 border border-blue-100">
                  <span className="text-[#0F4C81] font-semibold">Clock Out Allowed:</span>
                  <span className="font-mono font-bold text-[#0F4C81]">From 15:15</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* CENTER COLUMN: Interaction Forms (col-span-6) */}
          {/* ========================================================= */}
          <div className="lg:col-span-6 space-y-6">
            {activeTab === 'login' ? (
              <>
                {/* 1. LEARNER LOGIN SECTION */}
                <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                          <User className="w-4 h-4 text-[#0F4C81]" />
                          <span>Learner Login</span>
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Authenticate using your DynamicDNA work email address.
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                        No Password Required
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <form onSubmit={handleLearnerLogin} className="space-y-4">
                      <div>
                        <label
                          htmlFor="learner-email"
                          className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                        >
                          Work Email Address
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                          <input
                            id="learner-email"
                            type="email"
                            value={learnerEmail}
                            onChange={(e) => {
                              setLearnerEmail(e.target.value);
                              if (learnerLoginFeedback.status !== 'idle') {
                                setLearnerLoginFeedback({ status: 'idle', message: '' });
                              }
                            }}
                            placeholder="firstname.lastname@learners.dynamicdna.co.za"
                            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded focus:border-[#0F4C81] focus:ring-1 focus:ring-[#0F4C81] outline-none font-mono"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Only official DynamicDNA learner email addresses are permitted.
                        </p>
                      </div>

                      <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0F4C81] hover:bg-[#0A355C] text-white text-xs font-bold rounded shadow-xs transition-colors"
                      >
                        <Radio className="w-4 h-4" />
                        <span>Get Access</span>
                      </button>
                    </form>

                    {/* Feedback Messages */}
                    {learnerLoginFeedback.status === 'verified' && (
                      <div className="mt-4 p-4 rounded-md bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 space-y-1.5 animate-fadeIn">
                        <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Location Verified ✅</span>
                        </div>
                        <p className="text-emerald-700 font-medium">
                          Current Location: Randburg, Gauteng
                        </p>
                        {learnerLoginFeedback.accessId && (
                          <div className="pt-2 border-t border-emerald-200 flex items-center justify-between font-mono text-[11px]">
                            <span className="text-emerald-800 font-bold">Daily Access ID:</span>
                            <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-bold">
                              {learnerLoginFeedback.accessId}
                            </span>
                          </div>
                        )}
                        <p className="text-[11px] text-emerald-600 italic">
                          Redirecting to Learner Attendance Terminal...
                        </p>
                      </div>
                    )}

                    {learnerLoginFeedback.status === 'pending' && (
                      <div className="mt-4 p-4 rounded-md bg-amber-50 border border-amber-300 text-xs text-amber-900 space-y-2 animate-fadeIn">
                        <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span>Registration Pending Approval</span>
                        </div>
                        <p className="text-amber-800 font-medium leading-relaxed">
                          Your profile has not yet been approved by an Administrator.
                        </p>
                        <p className="text-amber-700 text-[11px]">
                          Please wait for approval before accessing SmartRegister. You will be assigned a
                          Learner Number (e.g. DVT-2026-00X) once verified.
                        </p>
                      </div>
                    )}

                    {learnerLoginFeedback.status === 'failed' && (
                      <div className="mt-4 p-4 rounded-md bg-rose-50 border border-rose-300 text-xs text-rose-900 space-y-1.5 animate-fadeIn">
                        <div className="flex items-center gap-2 font-bold text-sm text-rose-800">
                          <XCircle className="w-4 h-4 text-rose-600" />
                          <span>Location Verification Failed ❌</span>
                        </div>
                        <p className="text-rose-700 leading-relaxed font-medium">
                          {learnerLoginFeedback.message}
                        </p>
                        <div className="text-[11px] text-rose-600 pt-1">
                          Hint: Check test simulation presets below to place your device inside DynamicDNA (≤ 100m).
                        </div>
                      </div>
                    )}

                    {learnerLoginFeedback.status === 'not_found' && (
                      <div className="mt-4 p-4 rounded-md bg-slate-100 border border-slate-300 text-xs text-slate-700 space-y-1.5">
                        <div className="flex items-center gap-2 font-bold text-slate-800">
                          <HelpCircle className="w-4 h-4 text-slate-500" />
                          <span>Account Not Found</span>
                        </div>
                        <p className="text-slate-600">{learnerLoginFeedback.message}</p>
                        <button
                          type="button"
                          onClick={() => setActiveTab('register')}
                          className="mt-1 text-[#0F4C81] font-semibold underline text-xs"
                        >
                          Submit new learner registration now &rarr;
                        </button>
                      </div>
                    )}

                    {/* Quick Presets for Demo Reviewers */}
                    <div className="mt-6 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          One-Click Demo Personas:
                        </span>
                        <span className="text-[10px] text-slate-400">Click to autofill</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setLearnerEmail('zwavhudi.tshivhase@learners.dynamicdna.co.za');
                            setCoordinatesPreset('preset_dna_inside');
                            setLearnerLoginFeedback({ status: 'idle', message: '' });
                          }}
                          className="px-2.5 py-1.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded text-left transition-colors"
                        >
                          <div className="font-semibold text-slate-800 text-[11px]">
                            Zwavhudi Tshivhase
                          </div>
                          <div className="text-[10px] text-emerald-700 font-medium">
                            Active Learner · DVT-2026-001
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setLearnerEmail('kagiso.maseko@learners.dynamicdna.co.za');
                            setLearnerLoginFeedback({ status: 'idle', message: '' });
                          }}
                          className="px-2.5 py-1.5 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded text-left transition-colors"
                        >
                          <div className="font-semibold text-slate-800 text-[11px]">
                            Kagiso Maseko
                          </div>
                          <div className="text-[10px] text-amber-700 font-medium">
                            Pending Approval Status
                          </div>
                        </button>
                      </div>

                      {/* Location Simulator Quick bar */}
                      <div className="mt-3 p-2.5 bg-slate-50 rounded border border-slate-200 text-xs">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#0F4C81]" />
                            <span>GPS Telemetry Preset:</span>
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              isLocationVerified
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isLocationVerified ? 'Inside 100m ✅' : 'Outside 100m ❌'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                          <button
                            type="button"
                            onClick={() => setCoordinatesPreset('preset_dna_inside')}
                            className={`px-2 py-1 rounded text-left border ${
                              selectedPresetId === 'preset_dna_inside'
                                ? 'bg-blue-100/70 border-blue-300 text-[#0F4C81] font-semibold'
                                : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                            At DynamicDNA (25m)
                          </button>
                          <button
                            type="button"
                            onClick={() => setCoordinatesPreset('preset_cresta_mall')}
                            className={`px-2 py-1 rounded text-left border ${
                              selectedPresetId === 'preset_cresta_mall'
                                ? 'bg-rose-100/70 border-rose-300 text-rose-800 font-semibold'
                                : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                            Cresta Mall (1.4km)
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. ADMIN LOGIN SECTION */}
                <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                  <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-slate-600" />
                        <span>Admin Login</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Only approved administrators may access the Admin Portal.
                      </p>
                    </div>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono font-bold">
                      Supervisor
                    </span>
                  </div>

                  <div className="p-6">
                    <form onSubmit={handleAdminLogin} className="space-y-4">
                      <div>
                        <label
                          htmlFor="admin-id"
                          className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                        >
                          Admin Access ID
                        </label>
                        <div className="relative">
                          <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                          <input
                            id="admin-id"
                            type="text"
                            value={adminAccessId}
                            onChange={(e) => {
                              setAdminAccessId(e.target.value);
                              if (adminFeedback.status !== 'idle') {
                                setAdminFeedback({ status: 'idle', message: '' });
                              }
                            }}
                            placeholder="e.g. DVT-ADM-001"
                            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded focus:border-[#0F4C81] focus:ring-1 focus:ring-[#0F4C81] outline-none font-mono uppercase"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="submit"
                          className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded shadow-xs transition-colors flex items-center justify-center gap-2"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>Admin Login</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAdminAccessId('DVT-ADM-001');
                            setAdminFeedback({ status: 'idle', message: '' });
                          }}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold rounded transition-colors shrink-0"
                          title="Autofill DVT-ADM-001"
                        >
                          Demo Admin ID
                        </button>
                      </div>
                    </form>

                    {adminFeedback.status === 'failed' && (
                      <div className="mt-3 p-3 rounded bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                        <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span>{adminFeedback.message}</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              /* ========================================================= */
              /* REGISTRATION SECTION */
              /* ========================================================= */
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50/50 to-white border-b border-slate-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-[#0F4C81]" />
                        <span>Learner Profile Registration</span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        New workplace learners self-enrol for the DVT Programme.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded uppercase">
                      Admin Approval Required
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  {registrationSubmitted ? (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="p-5 bg-emerald-50 border border-emerald-300 rounded-lg text-xs space-y-3">
                        <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <span>Registration Request Submitted Successfully</span>
                        </div>

                        <p className="text-emerald-900 font-medium leading-relaxed">
                          Your registration request has been submitted.
                          <br />
                          <strong className="text-emerald-950">
                            Please wait for administrator approval.
                          </strong>
                        </p>

                        <div className="bg-white p-3 rounded border border-emerald-200 space-y-1.5 text-slate-700 font-mono text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Applicant:</span>
                            <span className="font-semibold text-slate-900">
                              {registrationSubmitted.firstName} {registrationSubmitted.lastName}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">System Generated Email:</span>
                            <span className="font-bold text-[#0F4C81]">
                              {registrationSubmitted.generatedEmail}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Status:</span>
                            <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                              Pending Approval
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Learner Number:</span>
                            <span className="text-slate-400 italic">
                              Generated upon admin approval (DVT-2026-XXX)
                            </span>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-500">
                          Once approved by your DVT supervisor, you can sign in directly using this work email.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setRegistrationSubmitted(null);
                          setActiveTab('login');
                          setLearnerEmail(registrationSubmitted.generatedEmail);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0F4C81] hover:bg-[#0A355C] text-white text-xs font-bold rounded shadow-xs transition-colors"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>Go to Login with this Email</span>
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleRegistrationSubmit} className="space-y-4">
                      {/* Name Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label
                            htmlFor="reg-fname"
                            className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1"
                          >
                            First Name
                          </label>
                          <input
                            id="reg-fname"
                            type="text"
                            required
                            value={regFirstName}
                            onChange={(e) => setRegFirstName(e.target.value)}
                            placeholder="e.g. Zwavhudi"
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:border-[#0F4C81] focus:ring-1 focus:ring-[#0F4C81] outline-none"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="reg-lname"
                            className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1"
                          >
                            Last Name
                          </label>
                          <input
                            id="reg-lname"
                            type="text"
                            required
                            value={regLastName}
                            onChange={(e) => setRegLastName(e.target.value)}
                            placeholder="e.g. Tshivhase"
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:border-[#0F4C81] focus:ring-1 focus:ring-[#0F4C81] outline-none"
                          />
                        </div>
                      </div>

                      {/* Contact Number */}
                      <div>
                        <label
                          htmlFor="reg-phone"
                          className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1"
                        >
                          Contact Number
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                          <input
                            id="reg-phone"
                            type="tel"
                            required
                            value={regContactNumber}
                            onChange={(e) => setRegContactNumber(e.target.value)}
                            placeholder="+27 82 000 0000"
                            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded focus:border-[#0F4C81] focus:ring-1 focus:ring-[#0F4C81] outline-none font-mono"
                          />
                        </div>
                      </div>

                      {/* System Auto-Generated Work Email Preview Box */}
                      <div className="p-3 bg-blue-50/70 border border-blue-200 rounded text-xs space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#0F4C81]">
                          <span>System Automatically Generates:</span>
                          <span className="font-mono">Work Email</span>
                        </div>
                        <div className="font-mono text-slate-900 font-semibold break-all text-xs">
                          {previewEmail}
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Domain suffix: @learners.dynamicdna.co.za
                        </p>
                      </div>

                      {/* Notice */}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600 space-y-1">
                        <div className="font-semibold text-slate-800">
                          Registration Approval Workflow:
                        </div>
                        <ol className="list-decimal list-inside space-y-0.5 text-slate-500">
                          <li>You submit your personal contact details.</li>
                          <li>System assigns status: Pending Approval.</li>
                          <li>An Administrator verifies your learnership status.</li>
                          <li>Upon approval, a unique Learner Number (DVT-2026-XXX) is generated.</li>
                        </ol>
                      </div>

                      <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0F4C81] hover:bg-[#0A355C] text-white text-xs font-bold rounded shadow-xs transition-colors"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Submit Registration</span>
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: Current Announcements & Details (col-span-3) */}
          {/* ========================================================= */}
          <div className="lg:col-span-3 space-y-5">
            {/* Current Announcements Panel */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Current Announcements
                  </h3>
                </div>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-bold">
                  {standardAnnouncements.length} Active
                </span>
              </div>

              <div className="p-4 divide-y divide-slate-100 max-h-[380px] overflow-y-auto space-y-3">
                {standardAnnouncements.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">
                    No active non-priority announcements posted today.
                  </p>
                ) : (
                  standardAnnouncements.map((ann) => (
                    <div key={ann.id} className="pt-3 first:pt-0 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <span className="text-amber-600">⚠</span>
                        <span>{ann.title}</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed text-[11px]">
                        {ann.content}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                        <span className="capitalize">{ann.category || 'General'}</span>
                        <span>{ann.postedDate}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Current Attendance Information */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs text-xs space-y-3">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-[#0F4C81]" />
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                  Attendance Information
                </h4>
              </div>

              <div className="space-y-2 text-slate-600">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Centroid:</span>
                  <span className="font-semibold text-slate-800">DynamicDNA</span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-mono">
                  <span className="text-slate-500">Latitude:</span>
                  <span>-26.097841</span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-mono">
                  <span className="text-slate-500">Longitude:</span>
                  <span>27.998357</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Office Radius:</span>
                  <span className="font-bold text-[#0F4C81]">100 Metres</span>
                </div>
                <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-slate-100">
                  <span className="text-slate-500">Today's Schedule:</span>
                  <span
                    className={`font-semibold px-1.5 py-0.2 rounded text-[10px] ${
                      todayScheduleType === 'office'
                        ? 'bg-blue-100 text-[#0F4C81]'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {todayScheduleType === 'office' ? 'Office Day' : 'Work From Home'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Clock In Window:</span>
                  <span className="font-mono font-medium">07:15 - 09:00</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Late Status:</span>
                  <span className="font-mono font-medium text-amber-700">After 09:00</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Clock Out Available:</span>
                  <span className="font-mono font-medium text-[#0F4C81]">From 15:15</span>
                </div>
              </div>
            </div>

            {/* Daily Access ID Security Policy */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <KeyRound className="w-3.5 h-3.5 text-[#0F4C81]" />
                <span className="uppercase text-[10px] tracking-wider">Access ID Rules</span>
              </div>
              <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
                <li>Valid for one day only.</li>
                <li>Expires automatically at midnight (00:00 SAST).</li>
                <li>Unique per learner per day.</li>
                <li>Generated only after successful GPS geofence verification.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* 4. Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; 2026 DynamicDNA. All Rights Reserved. SmartRegister Enterprise.</span>
          <span className="font-mono text-[11px] text-slate-400">
            DVT Learnership Attendance Management Engine · GPS Radius: 100m
          </span>
        </div>
      </footer>
    </div>
  );
};
