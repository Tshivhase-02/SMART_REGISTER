import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { UserPlus, CheckCircle2, ShieldCheck, X } from 'lucide-react';

export const CreateLearnerProfileModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { registerLearnerProfile, users } = useAttendance();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [createdProfile, setCreatedProfile] = useState<{
    learnerNumber: string;
    fullName: string;
  } | null>(null);

  if (!isOpen) return null;

  // Next expected learner number
  const nextNum = `DVT-2026-${String(users.filter((u) => u.role === 'learner').length + 1).padStart(3, '0')}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !phoneNumber.trim()) return;

    const profile = registerLearnerProfile(firstName, lastName, phoneNumber);
    setCreatedProfile({
      learnerNumber: profile.learnerNumber,
      fullName: profile.fullName,
    });
  };

  const handleFinish = () => {
    setCreatedProfile(null);
    setFirstName('');
    setLastName('');
    setPhoneNumber('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full p-6 text-xs space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#0F4C81] text-white flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Learner Profile Creation</h3>
              <p className="text-[11px] text-slate-500">DynamicDNA · DVT Learnership Programme</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {createdProfile ? (
          <div className="space-y-4 py-2">
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Profile Created Successfully</p>
                <p className="text-xs mt-1">
                  Welcome, <strong>{createdProfile.fullName}</strong>. Your official system learner number has been generated.
                </p>
                <div className="mt-3 p-2.5 bg-white border border-emerald-300 rounded font-mono text-center">
                  <span className="text-[10px] text-slate-500 block uppercase">
                    System Assigned Learner Number:
                  </span>
                  <span className="text-lg font-bold text-[#0F4C81]">
                    {createdProfile.learnerNumber}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              No passwords or OTPs required. When you open SmartRegister on an Office day within 100m or on a WFH day, your unique Daily Access ID will be generated automatically.
            </p>

            <button
              type="button"
              onClick={handleFinish}
              className="w-full py-2 px-4 bg-[#0F4C81] text-white font-semibold rounded hover:bg-[#0A355C] transition-colors"
            >
              Enter SmartRegister Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="bg-blue-50 border border-blue-200 text-blue-900 p-3 rounded text-[11px]">
              <div className="flex items-center gap-1.5 font-bold mb-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0F4C81]" />
                <span>Next Available Learner Number:</span>
              </div>
              <span className="font-mono font-bold text-sm text-[#0F4C81]">{nextNum}</span>
              <p className="text-slate-600 mt-1">
                Learner numbers are sequentially assigned by the system upon profile registration.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wide text-[10px] mb-1">
                First Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Zwavhudi"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#0F4C81] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wide text-[10px] mb-1">
                Last Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Tshivhase"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#0F4C81] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wide text-[10px] mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="e.g., +27 71 892 4410"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#0F4C81] focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-slate-600 hover:text-slate-900 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#0F4C81] text-white font-semibold rounded hover:bg-[#0A355C] transition-colors"
              >
                Create Profile & Generate Number
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
