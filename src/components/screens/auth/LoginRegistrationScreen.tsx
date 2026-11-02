import React, { useState } from 'react';
import { useAttendance } from '../../../context/AttendanceContext';
import { TEST_LOCATION_PRESETS, ADMIN_ACCESS_ID } from '../../../data/mockData';
import {
  ShieldCheck,
  Building,
  Home,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  LogIn,
  UserPlus,
  KeyRound,
  Mail,
  Phone,
  User,
  ArrowRight,
  Info,
  Compass,
  AlertCircle,
  HelpCircle,
  Calendar,
} from 'lucide-react';

export const LoginRegistrationScreen: React.FC = () => {
  const {
    loginWithLearnerEmail,
    loginWithAdminAccessId,
    submitRegistration,
    announcements,
    todayScheduleType,
    isLocationVerified,
    distanceFromOffice,
    workingDayStatus,
    selectedPresetId,
    setCoordinatesPreset,
    convertTodaySchedule,
    currentTime,
    users,
    registrationRequests,
  } = useAttendance();

  // Mode: 'login' | 'register'
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login Sub-mode: 'learner' | 'admin'
  const [loginRole, setLoginRole] = useState<'learner' | 'admin'>('learner');

  // Learner Login field
  const [workEmail, setWorkEmail] = useState('zwavhudi.tshivhase@learners.dynamicdna.co.za');
  
  // Admin Login field
  const [adminAccessId, setAdminAccessId] = useState(ADMIN_ACCESS_ID);

  // Registration fields
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regPhone, setRegPhone] = useState('+27 ');

  // Feedback states
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [gpsFeedback, setGpsFeedback] = useState<{
    verified: boolean;
    locationName: string;
  } | null>(null);
  
  // Registration submission confirmation state
  const [submittedRegDetails, setSubmittedRegDetails] = useState<{
    fullName: string;
    workEmail: string;
    status: string;
  } | null>(null);

  // Active urgent announcements
  const urgentAnnouncement = announcements.find(
    (a) => a.active && (a.category === 'urgent' || a.isUrgentNotice)
  );

  // Active general announcements
  const activeAnnouncements = announcements.filter((a) => a.active);

  // Calculated dynamic work email preview for registration
  const previewCleanFirst = regFirstName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const previewCleanLast = regLastName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const previewWorkEmail =
    previewCleanFirst && previewCleanLast
      ? `${previewCleanFirst}.${previewCleanLast}@learners.dynamicdna.co.za`
      : 'your.name@learners.dynamicdna.co.za';

  // Handle Learner Login
  const handleLearnerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setGpsFeedback(null);

    if (!workEmail.trim()) {
      setAuthError('Please enter your registered Work Email.');
      return;
    }

    const result = loginWithLearnerEmail(workEmail);

    if (!result.success) {
      setAuthError(result.message);
      if (result.locationStatus === 'failed') {
        setGpsFeedback({
          verified: false,
          locationName: result.locationName || 'Outside Workplace Perimeter',
        });
      }
    } else {
      setAuthSuccess(result.message);
      if (result.locationStatus === 'verified') {
        setGpsFeedback({
          verified: true,
          locationName: result.locationName || 'Randburg, Gauteng',
        });
      }
    }
  };

  // Handle Admin Login
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (!adminAccessId.trim()) {
      setAuthError('Please enter your Admin Access ID.');
      return;
    }

    const result = loginWithAdminAccessId(adminAccessId);
    if (!result.success) {
      setAuthError(result.message);
    } else {
      setAuthSuccess('Access granted. Redirecting to Admin Portal...');
    }
  };

  // Handle Registration Submit
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (!regFirstName.trim() || !regLastName.trim() || !regPhone.trim()) {
      setAuthError('All registration fields are required.');
      return;
    }

    const result = submitRegistration(regFirstName, regLastName, regPhone);
    setSubmittedRegDetails({
      fullName: `${regFirstName.trim()} ${regLastName.trim()}`,
      workEmail: result.workEmail,
      status: 'Pending Approval',
    });

    // Reset inputs
    setRegFirstName('');
    setRegLastName('');
    setRegPhone('+27 ');
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col justify-between selection:bg-[#0F4C81] selection:text-white">
      {/* Top Banner: Corporate System Header */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-[#0F4C81] flex items-center justify-center text-white font-bold text-sm tracking-wider shadow-xs">
              DVT
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-slate-900 tracking-tight leading-none">
                  SmartRegister
                </span>
                <span className="bg-blue-100 text-[#0F4C81] text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                  Enterprise
                </span>
              </div>
              <span className="text-xs font-medium text-slate-500">
                DynamicDNA · DVT Learnership Programme
              </span>
            </div>
          </div>

          {/* Today's Operational Status Indicator */}
          <div className="flex items-center gap-3 text-xs">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-100 rounded border border-slate-200 text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>
                {currentTime.toLocaleDateString('en-ZA', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded border font-semibold ${
                todayScheduleType === 'office'
                  ? 'bg-blue-50 border-blue-200 text-[#0F4C81]'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              {todayScheduleType === 'office' ? (
                <Building className="w-3.5 h-3.5" />
              ) : (
                <Home className="w-3.5 h-3.5" />
              )}
              <span>Today: {todayScheduleType === 'office' ? 'Office Schedule' : 'Work From Home'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main 3-Column Enterprise Workspace */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col justify-center">
        {/* Urgent Announcement Banner (Rendered full-width if active) */}
        {urgentAnnouncement && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-600 p-4 rounded-r-lg shadow-xs">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-red-700">
                    ⚠ URGENT NOTICE
                  </span>
                  <span className="text-[11px] text-red-500 font-medium">
                    · DynamicDNA Operations
                  </span>
                </div>
                <h3 className="text-sm font-bold text-red-900 mt-0.5">
                  {urgentAnnouncement.title}
                </h3>
                <p className="text-xs text-red-800 mt-1 leading-relaxed">
                  {urgentAnnouncement.message}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ==================================================
              COLUMN 1: BRANDING & SPECIFICATION OVERVIEW (3 cols)
             ================================================== */}
          <div className="lg:col-span-3 space-y-4">
            {/* System Info Card */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                <Building className="w-3.5 h-3.5 text-[#0F4C81]" />
                <span>Internal Portal</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                Learner Attendance Management
              </h2>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Replaces paper attendance registers for workplace learners. Enforces GPS proximity
                verification within 100 metres on Office Days and issues secure Daily Access IDs.
              </p>

              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-medium">Centroid:</span>
                  <span className="font-mono text-[11px] text-slate-900">-26.097841, 27.998357</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-medium">Geofence Radius:</span>
                  <span className="font-semibold text-slate-900">100 Metres</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-medium">Authentication:</span>
                  <span className="font-semibold text-slate-900">Daily Access ID (No passwords)</span>
                </div>
              </div>
            </div>

            {/* Attendance Rules Card */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs text-xs space-y-3">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#0F4C81]" />
                Attendance Policy Rules
              </h3>

              <div className="space-y-2">
                <div className="p-2 rounded bg-emerald-50 border border-emerald-100">
                  <div className="flex items-center justify-between font-bold text-emerald-900">
                    <span>Clock In: 07:15 - 09:00</span>
                    <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1 rounded">
                      PRESENT
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Full day attendance credited.
                  </p>
                </div>

                <div className="p-2 rounded bg-amber-50 border border-amber-100">
                  <div className="flex items-center justify-between font-bold text-amber-900">
                    <span>After 09:00</span>
                    <span className="text-[10px] bg-amber-200 text-amber-800 px-1 rounded">LATE</span>
                  </div>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Marked late; justification logged.
                  </p>
                </div>

                <div className="p-2 rounded bg-blue-50 border border-blue-100">
                  <div className="flex items-center justify-between font-bold text-blue-900">
                    <span>Clock Out</span>
                    <span className="text-[10px] bg-blue-200 text-blue-800 px-1 rounded">FROM 15:15</span>
                  </div>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    Terminal enables clock-out button.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Demo Credentials Assistant */}
            <div className="bg-slate-100 border border-slate-200 rounded-lg p-4 text-xs">
              <span className="font-bold text-slate-700 block mb-2">Demo Fast-Fill:</span>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setLoginRole('learner');
                    setWorkEmail('zwavhudi.tshivhase@learners.dynamicdna.co.za');
                  }}
                  className="w-full text-left p-1.5 bg-white hover:bg-blue-50 rounded border border-slate-200 text-[11px] font-medium text-slate-700 truncate block"
                >
                  Learner: zwavhudi.tshivhase@...
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setLoginRole('admin');
                    setAdminAccessId('ADMIN-DVT-2026-HQ');
                  }}
                  className="w-full text-left p-1.5 bg-white hover:bg-blue-50 rounded border border-slate-200 text-[11px] font-medium text-[#0F4C81] truncate block"
                >
                  Admin ID: ADMIN-DVT-2026-HQ
                </button>
              </div>
            </div>
          </div>

          {/* ==================================================
              COLUMN 2: AUTHENTICATION & REGISTRATION TERMINAL (5 cols)
             ================================================== */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              {/* Primary Tabs: [ Login ] | [ Register ] */}
              <div className="flex border-b border-slate-200 bg-slate-50">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setAuthError(null);
                    setAuthSuccess(null);
                  }}
                  className={`flex-1 py-3.5 text-center text-xs font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${
                    activeTab === 'login'
                      ? 'border-[#0F4C81] text-[#0F4C81] bg-white'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setAuthError(null);
                    setAuthSuccess(null);
                  }}
                  className={`flex-1 py-3.5 text-center text-xs font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${
                    activeTab === 'register'
                      ? 'border-[#0F4C81] text-[#0F4C81] bg-white'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Register</span>
                </button>
              </div>

              {/* Card Body */}
              <div className="p-6">
                {/* Error Banner */}
                {authError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800 flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">{authError}</div>
                  </div>
                )}

                {/* Success Banner */}
                {authSuccess && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">{authSuccess}</div>
                  </div>
                )}

                {/* GPS Location Status Callout */}
                {gpsFeedback && (
                  <div
                    className={`mb-4 p-3 rounded text-xs border flex items-start gap-2.5 ${
                      gpsFeedback.verified
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-red-50 border-red-200 text-red-900'
                    }`}
                  >
                    {gpsFeedback.verified ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold">
                        {gpsFeedback.verified ? 'Location Verified ✅' : 'Location Verification Failed ❌'}
                      </div>
                      <div className="text-[11px] mt-0.5 text-slate-600">
                        Current Location: <span className="font-semibold text-slate-800">{gpsFeedback.locationName}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ----------------- TAB: LOGIN ----------------- */}
                {activeTab === 'login' && (
                  <div>
                    {/* Sub-toggle: Learner Login vs Admin Login */}
                    <div className="flex p-1 bg-slate-100 rounded-md mb-5 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => {
                          setLoginRole('learner');
                          setAuthError(null);
                        }}
                        className={`flex-1 py-1.5 rounded transition-all flex items-center justify-center gap-1.5 ${
                          loginRole === 'learner'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>Learner Login</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLoginRole('admin');
                          setAuthError(null);
                        }}
                        className={`flex-1 py-1.5 rounded transition-all flex items-center justify-center gap-1.5 ${
                          loginRole === 'admin'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Admin Login</span>
                      </button>
                    </div>

                    {loginRole === 'learner' ? (
                      /* LEARNER LOGIN FORM */
                      <form onSubmit={handleLearnerLogin} className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Work Email
                          </label>
                          <div className="relative">
                            <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                            <input
                              type="email"
                              required
                              value={workEmail}
                              onChange={(e) => setWorkEmail(e.target.value)}
                              placeholder="e.g. firstname.lastname@learners.dynamicdna.co.za"
                              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F4C81] focus:border-transparent font-medium"
                            />
                          </div>
                          <p className="mt-1 text-[11px] text-slate-500">
                            Only approved learners on the DVT programme can authenticate.
                          </p>
                        </div>

                        {/* Location Verification Telemetry Note */}
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1">
                          <div className="flex items-center justify-between text-slate-700">
                            <span className="font-semibold flex items-center gap-1">
                              <Compass className="w-3.5 h-3.5 text-slate-500" />
                              GPS Requirement:
                            </span>
                            <span
                              className={`font-bold ${
                                todayScheduleType === 'office'
                                  ? isLocationVerified
                                    ? 'text-emerald-700'
                                    : 'text-red-700'
                                  : 'text-slate-600'
                              }`}
                            >
                              {todayScheduleType === 'office'
                                ? isLocationVerified
                                  ? 'Within 100m (Verified)'
                                  : 'Outside 100m'
                                : 'Not Required (WFH)'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {todayScheduleType === 'office'
                              ? 'Office Day: GPS verification is mandatory to issue your Daily Access ID.'
                              : 'Work From Home Day: Daily Access ID will be generated automatically.'}
                          </p>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2.5 bg-[#0F4C81] text-white rounded text-xs font-bold hover:bg-[#0A355C] transition-colors shadow-xs flex items-center justify-center gap-2"
                        >
                          <span>Get Access</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </form>
                    ) : (
                      /* ADMIN LOGIN FORM */
                      <form onSubmit={handleAdminLogin} className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Admin Access ID
                          </label>
                          <div className="relative">
                            <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                            <input
                              type="text"
                              required
                              value={adminAccessId}
                              onChange={(e) => setAdminAccessId(e.target.value)}
                              placeholder="e.g. ADMIN-DVT-2026-HQ"
                              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded text-xs text-slate-900 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-[#0F4C81] focus:border-transparent"
                            />
                          </div>
                          <p className="mt-1 text-[11px] text-slate-500">
                            Only approved administrators may access the Admin Portal.
                          </p>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2.5 bg-[#1F2937] text-white rounded text-xs font-bold hover:bg-slate-900 transition-colors shadow-xs flex items-center justify-center gap-2"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Admin Login</span>
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* ----------------- TAB: REGISTER ----------------- */}
                {activeTab === 'register' && (
                  <div>
                    {submittedRegDetails ? (
                      /* Post-submission pending screen */
                      <div className="space-y-4">
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-2">
                          <div className="flex items-center gap-2 font-bold text-amber-900">
                            <Clock className="w-4 h-4 text-amber-600" />
                            <span>Status: {submittedRegDetails.status}</span>
                          </div>
                          <p className="text-amber-800 font-medium">
                            Your registration request has been submitted.
                          </p>
                          <p className="text-amber-700 text-[11px]">
                            Please wait for administrator approval. Once approved, your sequential
                            Learner Number (e.g. DVT-2026-XXX) will be assigned.
                          </p>
                        </div>

                        <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs space-y-1.5">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Learner Name:</span>
                            <span className="font-semibold text-slate-800">
                              {submittedRegDetails.fullName}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Generated Work Email:</span>
                            <span className="font-mono text-slate-900 font-semibold text-[11px]">
                              {submittedRegDetails.workEmail}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Programme:</span>
                            <span className="text-slate-800">DVT Learnership Programme</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSubmittedRegDetails(null);
                            setActiveTab('login');
                            setLoginRole('learner');
                            setWorkEmail(submittedRegDetails.workEmail);
                          }}
                          className="w-full py-2 bg-[#0F4C81] text-white rounded text-xs font-semibold hover:bg-[#0A355C] transition-colors"
                        >
                          Return To Login
                        </button>
                      </div>
                    ) : (
                      /* Learner Self-Registration Form */
                      <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              First Name
                            </label>
                            <input
                              type="text"
                              required
                              value={regFirstName}
                              onChange={(e) => setRegFirstName(e.target.value)}
                              placeholder="e.g. Zwavhudi"
                              className="w-full px-3 py-2 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Last Name
                            </label>
                            <input
                              type="text"
                              required
                              value={regLastName}
                              onChange={(e) => setRegLastName(e.target.value)}
                              placeholder="e.g. Tshivhase"
                              className="w-full px-3 py-2 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Contact Number
                          </label>
                          <div className="relative">
                            <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                            <input
                              type="tel"
                              required
                              value={regPhone}
                              onChange={(e) => setRegPhone(e.target.value)}
                              placeholder="+27 71 000 0000"
                              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                            />
                          </div>
                        </div>

                        {/* Automatic Email Generation Callout */}
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs space-y-1">
                          <span className="font-semibold text-blue-900 block text-[11px] uppercase tracking-wider">
                            System Automatically Generates Work Email:
                          </span>
                          <span className="font-mono text-blue-800 font-bold block truncate">
                            {previewWorkEmail}
                          </span>
                          <p className="text-[10px] text-blue-700">
                            Upon submission, profile enters <span className="font-semibold">Pending Approval</span> status.
                          </p>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2.5 bg-[#0F4C81] text-white rounded text-xs font-bold hover:bg-[#0A355C] transition-colors shadow-xs flex items-center justify-center gap-2"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>Submit Registration</span>
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ==================================================
              COLUMN 3: ANNOUNCEMENT PANEL & NOTICES (4 cols)
             ================================================== */}
          <div className="lg:col-span-4 space-y-4">
            {/* Section: Current Announcements */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[#0F4C81]" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    Current Announcements
                  </h3>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded">
                  {activeAnnouncements.length} Active
                </span>
              </div>

              <div className="mt-3 space-y-3">
                {activeAnnouncements.map((ann) => (
                  <div
                    key={ann.id}
                    className={`p-3 rounded-lg border text-xs space-y-1.5 transition-colors ${
                      ann.category === 'urgent'
                        ? 'bg-red-50/70 border-red-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        className={`font-bold flex items-center gap-1.5 ${
                          ann.category === 'urgent' ? 'text-red-900' : 'text-slate-800'
                        }`}
                      >
                        {ann.category === 'urgent' && (
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        )}
                        <span>{ann.title}</span>
                      </h4>
                      <span className="text-[10px] text-slate-600 shrink-0">{ann.date}</span>
                    </div>
                    <p
                      className={`text-[11px] leading-relaxed ${
                        ann.category === 'urgent' ? 'text-red-800' : 'text-slate-600'
                      }`}
                    >
                      {ann.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Attendance & Proximity Test Simulator (Direct on Login Screen) */}
            <div className="bg-slate-900 text-white rounded-lg p-4 shadow-sm text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-sky-400" />
                  GPS & Schedule Simulator
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                  Testing
                </span>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Simulate Location:
                </label>
                <select
                  value={selectedPresetId}
                  onChange={(e) => setCoordinatesPreset(e.target.value)}
                  className="w-full bg-slate-800 text-white border border-slate-700 rounded px-2.5 py-1.5 text-xs focus:outline-none"
                >
                  {TEST_LOCATION_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.isWithinGeofence ? '(≤ 100m ✅)' : '(Outside ❌)'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Today's Schedule:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => convertTodaySchedule('office')}
                    className={`py-1 text-xs rounded border transition-colors ${
                      todayScheduleType === 'office'
                        ? 'bg-[#0F4C81] text-white border-blue-400 font-bold'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    Office Day
                  </button>
                  <button
                    type="button"
                    onClick={() => convertTodaySchedule('wfh')}
                    className={`py-1 text-xs rounded border transition-colors ${
                      todayScheduleType === 'wfh'
                        ? 'bg-emerald-700 text-white border-emerald-400 font-bold'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    Work From Home
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between text-[11px] text-slate-400">
                <span>Distance from centroid:</span>
                <span className="font-mono text-white font-semibold">{distanceFromOffice}m</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Corporate Enterprise Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 px-4 sm:px-8 text-center text-xs text-slate-600 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © 2026 DynamicDNA. All rights reserved. SmartRegister Attendance Management System.
          </span>
          <span className="text-[11px] text-slate-600">
            DVT Learnership Cohort 2026 · Microsoft Azure Enterprise Standard
          </span>
        </div>
      </footer>
    </div>
  );
};
