import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { Clock, Eye, EyeOff, Loader2, HelpCircle, X, ShieldAlert } from 'lucide-react';
import { validateEmail } from '../../utils/validationUtils';

interface Props {
  onGoToRegister: () => void;
  onGoToAdmin: () => void;
}

export const MicrosoftLearnerLogin: React.FC<Props> = ({ onGoToRegister, onGoToAdmin }) => {
  const { loginLearner } = useAttendance();

  const [workEmail, setWorkEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingApprovalState, setPendingApprovalState] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMessage(null);
    setPendingApprovalState(false);

    // Required field validation
    if (!workEmail.trim()) {
      setErrorMessage('Please enter your work email.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    // Email format validation
    const emailValidation = validateEmail(workEmail);
    if (!emailValidation.isValid) {
      setErrorMessage(emailValidation.error || 'Please enter a valid work email.');
      return;
    }

    // Prevent repeated login submissions
    setIsSubmitting(true);

    setTimeout(() => {
      const result = loginLearner(workEmail, password);
      if (!result.success) {
        if (result.isPendingApproval) {
          setPendingApprovalState(true);
        } else {
          setErrorMessage(
            result.error || "We couldn't find an account matching that work email address."
          );
        }
        setIsSubmitting(false);
      } else {
        // Logged in successfully
        setIsSubmitting(false);
      }
    }, 450);
  };

  return (
    <div className="w-full max-w-[440px] bg-white border border-[#E5E7EB] rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-7 sm:p-10 text-[#333333] transition-all">
      {/* 1. Official DynamicDNA Header & Branding */}
      <div className="mb-6">
        <div className="mb-3.5 flex items-center justify-between">
          <img
            src="/dynamicdna-logo.png"
            alt="DynamicDNA"
            className="h-12 sm:h-14 w-auto object-contain"
            referrerPolicy="no-referrer"
          />
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden sm:inline">
            DVT Programme
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-xl font-bold text-[#333333] tracking-tight leading-tight">
            SmartRegister
          </span>
          <span className="text-xs font-semibold text-[#2F3E96] tracking-wide mt-0.5">
            DynamicDNA | DVT Learnership Programme
          </span>
        </div>

        <h1 className="text-2xl font-semibold text-[#333333] tracking-tight mt-6">
          Sign In
        </h1>
      </div>

      {/* 2. Pending Approval Alert State */}
      {pendingApprovalState && (
        <div className="mb-5 p-3.5 bg-amber-50 border-l-4 border-[#F4B52C] rounded-r text-xs space-y-1.5 text-slate-800 animate-fadeIn">
          <div className="flex items-center gap-1.5 font-bold text-amber-900 text-sm">
            <Clock className="w-4 h-4 text-[#F4B52C] shrink-0" />
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

      {/* 3. Authentication Error Message */}
      {errorMessage && !pendingApprovalState && (
        <div className="mb-5 text-xs text-[#DC2626] font-medium leading-relaxed bg-rose-50 border-l-4 border-[#DC2626] p-3 rounded-r flex items-start gap-2 animate-fadeIn">
          <ShieldAlert className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 4. Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Work Email with persistent visible label */}
        <div>
          <label
            htmlFor="workEmail"
            className="block text-xs font-medium text-slate-700 mb-1.5"
          >
            Work Email
          </label>
          <input
            id="workEmail"
            type="email"
            required
            autoFocus
            disabled={isSubmitting}
            placeholder="Zwavhudi.Tshivhase@dynamicdna.co.za"
            value={workEmail}
            onChange={(e) => {
              setWorkEmail(e.target.value);
              if (errorMessage) setErrorMessage(null);
              if (pendingApprovalState) setPendingApprovalState(false);
            }}
            className="w-full px-3 py-2 text-sm border-b-2 border-slate-700 focus:border-[#2F3E96] focus:outline-none transition-colors rounded-none placeholder:text-slate-400 font-normal disabled:bg-slate-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Password with Show/Hide Toggle & persistent visible label */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="password"
              className="block text-xs font-medium text-slate-700"
            >
              Password
            </label>
            <button
              type="button"
              onClick={() => setIsForgotPasswordOpen(true)}
              className="text-xs text-[#2F3E96] hover:underline cursor-pointer"
            >
              Forgot password?
            </button>
          </div>

          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              disabled={isSubmitting}
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMessage) setErrorMessage(null);
                if (pendingApprovalState) setPendingApprovalState(false);
              }}
              className="w-full pl-3 pr-10 py-2 text-sm border-b-2 border-slate-700 focus:border-[#2F3E96] focus:outline-none transition-colors rounded-none placeholder:text-slate-400 font-normal disabled:bg-slate-50 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#2F3E96] transition-colors p-1 cursor-pointer"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Login Button (Primary Button: Background #F4B52C, Text: White) */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-[#F4B52C] hover:bg-[#E0A220] text-white font-semibold text-sm rounded transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Login</span>
            )}
          </button>
        </div>

        {/* Below the login form: Don't have a learner account? Create Learner Profile */}
        <div className="pt-4 text-center border-t border-slate-100">
          <p className="text-xs text-slate-600 mb-1">
            Don't have a learner account?
          </p>
          <button
            type="button"
            onClick={onGoToRegister}
            className="text-xs text-[#2F3E96] hover:underline font-bold cursor-pointer"
          >
            Create Learner Profile
          </button>
        </div>
      </form>

      {/* Discreet footer access for supervisors / admins */}
      <div className="mt-6 pt-3 text-center">
        <button
          type="button"
          onClick={onGoToAdmin}
          className="text-[11px] text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
        >
          Administrator Sign In
        </button>
      </div>

      {/* Forgot Password Modal */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full border border-slate-200 p-6 space-y-4 text-xs animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <HelpCircle className="w-4 h-4 text-[#2F3E96]" />
                <span>Password Recovery Assistance</span>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-600 leading-relaxed">
              SmartRegister accounts are managed through the <strong>DynamicDNA | DVT Learnership Programme</strong> directory.
            </p>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-slate-800 space-y-1">
              <span className="font-bold text-[#2F3E96] block text-[11px] uppercase">
                Reset Policy:
              </span>
              <p className="text-[11px] leading-relaxed">
                To reset your password, contact your DVT Programme Administrator or email the IT desk with your official Learner Number (e.g. <code>DVT-2026-001</code>).
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(false)}
                className="px-4 py-2 bg-[#2F3E96] text-white rounded text-xs font-semibold hover:bg-[#25327a] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
