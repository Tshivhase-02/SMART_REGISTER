import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { Clock } from 'lucide-react';

interface Props {
  onGoToRegister: () => void;
  onGoToAdmin: () => void;
}

export const MicrosoftLearnerLogin: React.FC<Props> = ({ onGoToRegister, onGoToAdmin }) => {
  const { loginLearner } = useAttendance();

  const [workEmail, setWorkEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingApprovalState, setPendingApprovalState] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setPendingApprovalState(false);

    if (!workEmail.trim()) {
      setErrorMessage('Please enter your work email.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const result = loginLearner(workEmail, password);
      if (!result.success) {
        if (result.isPendingApproval) {
          setPendingApprovalState(true);
        } else {
          setErrorMessage(result.error || "We couldn't find an account matching that work email.");
        }
      }
      setIsSubmitting(false);
    }, 250);
  };

  return (
    <div className="w-full max-w-[440px] bg-white border border-slate-200/90 rounded-md shadow-[0_2px_12px_rgba(0,0,0,0.08)] p-8 sm:p-10 text-slate-800">
      {/* 1. Header & Branding */}
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-2">
          {/* 4-Square Corporate Emblem */}
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

        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mt-4">
          Sign In
        </h1>
      </div>

      {/* 2. Pending Approval Alert State */}
      {pendingApprovalState && (
        <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r text-xs space-y-1.5 text-slate-800">
          <div className="flex items-center gap-1.5 font-bold text-amber-800 text-sm">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Account Pending Approval</span>
          </div>
          <p className="text-slate-700 leading-relaxed">
            Your registration request has not yet been approved.
          </p>
          <p className="text-slate-500 text-[11px]">
            Please contact your administrator if approval takes longer than expected.
          </p>
        </div>
      )}

      {/* 3. General Error Message */}
      {errorMessage && !pendingApprovalState && (
        <div className="mb-4 text-xs text-[#DC2626] font-medium leading-relaxed bg-rose-50 border-l-2 border-[#DC2626] p-2.5">
          {errorMessage}
        </div>
      )}

      {/* 4. Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="workEmail" className="block text-xs font-medium text-slate-700 mb-1">
            Work Email
          </label>
          <input
            id="workEmail"
            type="email"
            required
            autoFocus
            placeholder="name.surname@learners.dynamicdna.co.za"
            value={workEmail}
            onChange={(e) => {
              setWorkEmail(e.target.value);
              if (errorMessage) setErrorMessage(null);
              if (pendingApprovalState) setPendingApprovalState(false);
            }}
            className="w-full px-3 py-2 text-sm border-b-2 border-slate-700 focus:border-[#0F4C81] focus:outline-none transition-colors rounded-none placeholder:text-slate-400 font-normal"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-medium text-slate-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errorMessage) setErrorMessage(null);
              if (pendingApprovalState) setPendingApprovalState(false);
            }}
            className="w-full px-3 py-2 text-sm border-b-2 border-slate-700 focus:border-[#0F4C81] focus:outline-none transition-colors rounded-none placeholder:text-slate-400 font-normal"
          />
        </div>

        {/* Login Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-[#0F4C81] hover:bg-[#0A355C] text-white font-semibold text-sm rounded transition-colors shadow-xs"
          >
            {isSubmitting ? 'Signing in...' : 'Login'}
          </button>
        </div>

        {/* Create Learner Profile Link */}
        <div className="pt-3 text-center">
          <button
            type="button"
            onClick={onGoToRegister}
            className="text-xs text-[#0F4C81] hover:underline font-semibold"
          >
            Create Learner Profile
          </button>
        </div>
      </form>

      {/* Discreet footer access for supervisors / admins */}
      <div className="mt-8 pt-4 border-t border-slate-100 text-center">
        <button
          type="button"
          onClick={onGoToAdmin}
          className="text-[11px] text-slate-400 hover:text-slate-700 transition-colors"
        >
          Administrator Sign In
        </button>
      </div>
    </div>
  );
};
