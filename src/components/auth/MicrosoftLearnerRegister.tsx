import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { ArrowLeft, CheckCircle2, Clock } from 'lucide-react';

interface Props {
  onGoToLogin: () => void;
}

export const MicrosoftLearnerRegister: React.FC<Props> = ({ onGoToLogin }) => {
  const { submitRegistration } = useAttendance();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Successful submission state
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

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

    const result = submitRegistration(firstName, lastName, contactNumber, password);
    if (result.success) {
      setSubmittedEmail(result.generatedWorkEmail);
    }
  };

  // If successfully submitted, display the required approval workflow notice & generated email
  if (submittedEmail) {
    return (
      <div className="w-full max-w-[440px] bg-white border border-slate-200/90 rounded-md shadow-[0_2px_12px_rgba(0,0,0,0.08)] p-8 sm:p-10 text-slate-800 space-y-5">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="grid grid-cols-2 gap-0.5 w-6 h-6 shrink-0">
            <div className="bg-[#0F4C81] rounded-[1px]" />
            <div className="bg-[#1F2937] rounded-[1px]" />
            <div className="bg-[#0284c7] rounded-[1px]" />
            <div className="bg-[#10b981] rounded-[1px]" />
          </div>
          <span className="text-base font-bold text-slate-900 tracking-tight leading-none">
            SmartRegister
          </span>
        </div>

        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          DynamicDNA | DVT Learnership Programme
        </p>

        {/* 1. Work Email Generated Confirmation */}
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-600 rounded-r text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Your work email has been generated successfully.</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px] uppercase font-semibold">
              Work Email:
            </span>
            <span className="font-mono font-bold text-slate-900 text-sm break-all">
              {submittedEmail}
            </span>
          </div>
        </div>

        {/* 2. Registration Submitted Notice */}
        <div className="p-4 bg-blue-50 border-l-4 border-[#0F4C81] rounded-r text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-[#0F4C81] text-sm">
            <Clock className="w-4 h-4 shrink-0" />
            <span>Registration Submitted</span>
          </div>
          <p className="text-slate-700 leading-relaxed">
            Your registration request has been sent for administrator approval.
          </p>
          <p className="text-slate-600 font-medium">
            Please wait until your account has been approved.
          </p>
        </div>

        <div className="pt-3">
          <button
            type="button"
            onClick={onGoToLogin}
            className="w-full py-2.5 bg-[#0F4C81] hover:bg-[#0A355C] text-white font-semibold text-sm rounded transition-colors shadow-xs"
          >
            Return to Sign In
          </button>
        </div>
      </div>
    );
  }

  // Registration Form
  return (
    <div className="w-full max-w-[440px] bg-white border border-slate-200/90 rounded-md shadow-[0_2px_12px_rgba(0,0,0,0.08)] p-8 sm:p-10 text-slate-800">
      {/* 1. Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="grid grid-cols-2 gap-0.5 w-6 h-6 shrink-0">
              <div className="bg-[#0F4C81] rounded-[1px]" />
              <div className="bg-[#1F2937] rounded-[1px]" />
              <div className="bg-[#0284c7] rounded-[1px]" />
              <div className="bg-[#10b981] rounded-[1px]" />
            </div>
            <span className="text-base font-bold text-slate-900 tracking-tight leading-none">
              SmartRegister
            </span>
          </div>

          <button
            type="button"
            onClick={onGoToLogin}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        </div>

        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          DynamicDNA | DVT Learnership Programme
        </p>

        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mt-4">
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
            placeholder="e.g. Zwavhudi"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full px-3 py-2 text-sm border-b-2 border-slate-700 focus:border-[#0F4C81] focus:outline-none transition-colors rounded-none placeholder:text-slate-400 font-normal"
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
            placeholder="e.g. Tshivhase"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full px-3 py-2 text-sm border-b-2 border-slate-700 focus:border-[#0F4C81] focus:outline-none transition-colors rounded-none placeholder:text-slate-400 font-normal"
          />
        </div>

        <div>
          <label htmlFor="regContactNumber" className="block text-xs font-medium text-slate-700 mb-1">
            Contact Number
          </label>
          <input
            id="regContactNumber"
            type="tel"
            required
            placeholder="e.g. +27 71 892 4410"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            className="w-full px-3 py-2 text-sm border-b-2 border-slate-700 focus:border-[#0F4C81] focus:outline-none transition-colors rounded-none placeholder:text-slate-400 font-normal"
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
            className="w-full px-3 py-2 text-sm border-b-2 border-slate-700 focus:border-[#0F4C81] focus:outline-none transition-colors rounded-none placeholder:text-slate-400 font-normal"
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
            className="w-full px-3 py-2 text-sm border-b-2 border-slate-700 focus:border-[#0F4C81] focus:outline-none transition-colors rounded-none placeholder:text-slate-400 font-normal"
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="w-full py-2.5 bg-[#0F4C81] hover:bg-[#0A355C] text-white font-semibold text-sm rounded transition-colors shadow-xs"
          >
            Submit Registration
          </button>
        </div>

        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onGoToLogin}
            className="text-xs text-[#0F4C81] hover:underline font-semibold"
          >
            Already have a profile? Sign In
          </button>
        </div>
      </form>
    </div>
  );
};
