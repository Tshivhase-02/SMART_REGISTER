import React, { useState, useMemo } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { ArrowLeft, CheckCircle2, Clock, Lock } from 'lucide-react';
import { toProperCase, generateWorkEmail } from '../../utils/nameUtils';

interface Props {
  onGoToLogin: () => void;
}

export const MicrosoftLearnerRegister: React.FC<Props> = ({ onGoToLogin }) => {
  const { submitRegistration, users } = useAttendance();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live auto-generated read-only preview of work email
  const previewEmail = useMemo(() => {
    if (!firstName.trim() && !lastName.trim()) {
      return 'FirstName.LastName@dynamicdna.co.za';
    }
    const existingEmails = users.map((u) => u.workEmail);
    return generateWorkEmail(firstName, lastName, existingEmails);
  }, [firstName, lastName, users]);

  // Successful submission state
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [submittedFullName, setSubmittedFullName] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!firstName.trim() || !lastName.trim() || !contactNumber.trim() || !password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    // Automatically convert names to Proper Case as per DynamicDNA rules
    const properFirst = toProperCase(firstName);
    const properLast = toProperCase(lastName);
    setFirstName(properFirst);
    setLastName(properLast);

    const result = submitRegistration(properFirst, properLast, contactNumber, password);
    if (result.success) {
      setSubmittedEmail(result.generatedWorkEmail);
      setSubmittedFullName(`${properFirst} ${properLast}`);
    }
  };

  // If successfully submitted, display the required approval workflow notice & generated email
  if (submittedEmail) {
    return (
      <div className="w-full max-w-[440px] bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-8 sm:p-10 text-[#333333] space-y-5">
        <div className="mb-2">
          <img
            src="/dynamicdna-logo.png"
            alt="DynamicDNA"
            className="h-14 w-auto object-contain"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="flex flex-col">
          <span className="text-xl font-bold text-[#333333] tracking-tight leading-tight">
            SmartRegister
          </span>
          <span className="text-xs font-semibold text-[#2F3E96] tracking-wide mt-0.5">
            DynamicDNA | DVT Learnership Programme
          </span>
        </div>

        {/* 1. Work Email Generated Confirmation */}
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-600 rounded-r text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Registration Profile Created in Proper Case</span>
          </div>
          {submittedFullName && (
            <p className="text-slate-700 font-medium">
              Learner: <strong>{submittedFullName}</strong>
            </p>
          )}
          <div>
            <span className="text-slate-500 block text-[11px] uppercase font-semibold">
              Assigned Work Email (Read-Only):
            </span>
            <span className="font-mono font-bold text-[#2F3E96] text-sm break-all">
              {submittedEmail}
            </span>
          </div>
        </div>

        {/* 2. Registration Submitted Notice */}
        <div className="p-4 bg-amber-50 border-l-4 border-[#F4B52C] rounded-r text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-amber-900 text-sm">
            <Clock className="w-4 h-4 text-[#F4B52C] shrink-0" />
            <span>Registration Submitted for Approval</span>
          </div>
          <p className="text-slate-700 leading-relaxed">
            Your registration request has been submitted to the administrator for enrollment approval.
          </p>
          <p className="text-slate-600 font-medium text-[11px]">
            Please wait until your account has been approved before signing in.
          </p>
        </div>

        <div className="pt-3">
          <button
            type="button"
            onClick={onGoToLogin}
            className="w-full py-2.5 bg-[#2F3E96] hover:bg-[#25327B] text-white font-semibold text-sm rounded transition-colors shadow-xs cursor-pointer"
          >
            Return to Sign In
          </button>
        </div>
      </div>
    );
  }

  // Registration Form
  return (
    <div className="w-full max-w-[440px] bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-8 sm:p-10 text-[#333333]">
      {/* 1. Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <img
            src="/dynamicdna-logo.png"
            alt="DynamicDNA"
            className="h-14 w-auto object-contain"
            referrerPolicy="no-referrer"
          />

          <button
            type="button"
            onClick={onGoToLogin}
            className="text-xs text-[#2F3E96] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        </div>

        <div className="flex flex-col">
          <span className="text-xl font-bold text-[#333333] tracking-tight leading-tight">
            SmartRegister
          </span>
          <span className="text-xs font-semibold text-[#2F3E96] tracking-wide mt-0.5">
            DynamicDNA | DVT Learnership Programme
          </span>
        </div>

        <h1 className="text-2xl font-semibold text-[#333333] tracking-tight mt-5">
          Create Learner Profile
        </h1>
      </div>

      {errorMessage && (
        <div className="mb-4 text-xs text-[#DC2626] font-medium leading-relaxed bg-rose-50 border-l-2 border-[#DC2626] p-2.5">
          {errorMessage}
        </div>
      )}

      {/* 2. Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        <div>
          <label htmlFor="regFirstName" className="block text-xs font-medium text-slate-700 mb-1">
            First Name
          </label>
          <input
            id="regFirstName"
            type="text"
            required
            autoFocus
            placeholder="Zwavhudi"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full px-3 py-2 text-sm border-b-2 border-slate-700 focus:border-[#2F3E96] focus:outline-none transition-colors rounded-none placeholder:text-slate-400 font-normal"
          />
        </div>

        <div>
          <label htmlFor="regLastName" className="block text-xs font-medium text-slate-700 mb-1">
            Last Name
          </label>
          <input
            id="regLastName"
            type="text"
            required
            placeholder="Tshivhase"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full px-3 py-2 text-sm border-b-2 border-slate-700 focus:border-[#2F3E96] focus:outline-none transition-colors rounded-none placeholder:text-slate-400 font-normal"
          />
        </div>

        {/* Read-Only Auto-Generated Work Email Display */}
        <div className="p-3 bg-slate-50 border border-[#E5E7EB] rounded space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-500">
              Generated Work Email (Read-Only)
            </span>
            <span className="text-[9px] font-bold uppercase text-[#2F3E96] bg-[#2F3E96]/10 px-1.5 py-0.5 rounded flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" />
              <span>Read-Only</span>
            </span>
          </div>
          <div className="font-mono text-xs font-bold text-[#2F3E96] break-all">
            {previewEmail}
          </div>
          <p className="text-[10px] text-slate-400">
            Automatically generated as <code>FirstName.LastName@dynamicdna.co.za</code>
          </p>
        </div>

        <div>
          <label htmlFor="regContactNumber" className="block text-xs font-medium text-slate-700 mb-1">
            Contact Number
          </label>
          <input
            id="regContactNumber"
            type="tel"
            required
            placeholder="+27 60 816 4224"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            className="w-full px-3 py-2 text-sm border-b-2 border-slate-700 focus:border-[#2F3E96] focus:outline-none transition-colors rounded-none placeholder:text-slate-400 font-normal"
          />
        </div>

        <div>
          <label htmlFor="regPassword" className="block text-xs font-medium text-slate-700 mb-1">
            Password
          </label>
          <input
            id="regPassword"
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 text-sm border-b-2 border-slate-700 focus:border-[#2F3E96] focus:outline-none transition-colors rounded-none placeholder:text-slate-400 font-normal"
          />
        </div>

        <div>
          <label htmlFor="regConfirmPassword" className="block text-xs font-medium text-slate-700 mb-1">
            Confirm Password
          </label>
          <input
            id="regConfirmPassword"
            type="password"
            required
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 text-sm border-b-2 border-slate-700 focus:border-[#2F3E96] focus:outline-none transition-colors rounded-none placeholder:text-slate-400 font-normal"
          />
        </div>

        {/* Submit Registration (Primary Button: Background #F4B52C, Text: White) */}
        <div className="pt-4">
          <button
            type="submit"
            className="w-full py-2.5 bg-[#F4B52C] hover:bg-[#E0A220] text-white font-semibold text-sm rounded transition-colors shadow-xs"
          >
            Submit Registration
          </button>
        </div>

        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onGoToLogin}
            className="text-xs text-[#2F3E96] hover:underline font-semibold"
          >
            Already have a profile? Sign In
          </button>
        </div>
      </form>
    </div>
  );
};
