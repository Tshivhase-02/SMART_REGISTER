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
    <div className="w-full max-w-[440px] bg-white border border-slate-200/90 rounded-md shadow-[0_2px_12px_rgba(0,0,0,0.08)] p-8 sm:p-10 text-slate-800">
      {/* 1. Header with Branding */}
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
            onClick={onGoToLearnerLogin}
            className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          DynamicDNA | DVT Learnership Programme
        </p>

        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mt-4">
          Admin Login
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
          <label htmlFor="adminAccessId" className="block text-xs font-medium text-slate-700 mb-1">
            Access ID
          </label>
          <input
            id="adminAccessId"
            type="text"
            required
            autoFocus
            placeholder="Enter Administrator Access ID"
            value={accessId}
            onChange={(e) => {
              setAccessId(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            className="w-full px-3 py-2 text-sm border-b-2 border-slate-700 focus:border-[#0F4C81] focus:outline-none transition-colors rounded-none placeholder:text-slate-400 font-normal"
          />
        </div>

        {/* Sign In Button */}
        <div className="pt-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-[#0F4C81] hover:bg-[#0A355C] text-white font-semibold text-sm rounded transition-colors shadow-xs"
          >
            {isSubmitting ? 'Verifying...' : 'Sign In'}
          </button>
        </div>
      </form>
    </div>
  );
};
