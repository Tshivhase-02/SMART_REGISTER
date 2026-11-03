import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { ArrowLeft } from 'lucide-react';

interface Props {
  onGoToLearnerLogin: () => void;
}

export const MicrosoftAdminLogin: React.FC<Props> = ({ onGoToLearnerLogin }) => {
  const { adminLoginWithAccessId } = useAttendance();

  const [accessId, setAccessId] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!accessId.trim()) {
      setErrorMessage('Please enter an Access ID.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const result = adminLoginWithAccessId(accessId);
      if (!result.success) {
        setErrorMessage(result.error || 'Invalid Access ID.');
      }
      setIsSubmitting(false);
    }, 250);
  };

  return (
    <div className="w-full max-w-[440px] bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-8 sm:p-10 text-[#333333]">
      {/* 1. Official DynamicDNA Header & Branding */}
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
            onClick={onGoToLearnerLogin}
            className="p-1 text-slate-400 hover:text-[#2F3E96] transition-colors"
            title="Back to Learner Login"
          >
            <ArrowLeft className="w-4 h-4" />
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
          Administrator Sign In
        </h1>
      </div>

      {errorMessage && (
        <div className="mb-4 text-xs text-[#DC2626] font-medium leading-relaxed bg-rose-50 border-l-2 border-[#DC2626] p-2.5">
          {errorMessage}
        </div>
      )}

      {/* 2. Admin Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="adminAccessId" className="block text-xs font-semibold text-[#333333] mb-1">
            Access ID
          </label>
          <input
            id="adminAccessId"
            type="text"
            required
            autoFocus
            placeholder="dynamic1937"
            value={accessId}
            onChange={(e) => {
              setAccessId(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            className="w-full px-3 py-2 text-sm border-b-2 border-slate-700 focus:border-[#2F3E96] focus:outline-none transition-colors rounded-none placeholder:text-slate-400 font-mono font-medium"
          />
          <p className="text-[11px] text-slate-500 mt-1.5">
            Temporary Admin Access ID: <code className="bg-slate-100 text-[#2F3E96] font-bold px-1.5 py-0.5 rounded font-mono">dynamic1937</code>
          </p>
        </div>

        {/* Sign In Button (Primary Button: Background #F4B52C, Text: White) */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-[#F4B52C] hover:bg-[#E0A220] text-white font-semibold text-sm rounded transition-colors shadow-xs cursor-pointer"
          >
            {isSubmitting ? 'Verifying...' : 'Sign In'}
          </button>
        </div>
      </form>
    </div>
  );
};
