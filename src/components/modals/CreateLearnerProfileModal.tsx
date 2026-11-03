import React, { useState, useMemo } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { UserPlus, CheckCircle2, ShieldCheck, X, Lock } from 'lucide-react';
import { toProperCase, generateWorkEmail } from '../../utils/nameUtils';

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
    workEmail: string;
  } | null>(null);

  // Live auto-generated read-only preview of work email
  const previewEmail = useMemo(() => {
    if (!firstName.trim() && !lastName.trim()) {
      return 'FirstName.LastName@dynamicdna.co.za';
    }
    const existingEmails = users.map((u) => u.workEmail);
    return generateWorkEmail(firstName, lastName, existingEmails);
  }, [firstName, lastName, users]);

  if (!isOpen) return null;

  // Next expected learner number
  const nextNum = `DVT-2026-${String(users.filter((u) => u.role === 'learner').length + 1).padStart(3, '0')}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !phoneNumber.trim()) return;

    // Automatically convert to Proper Case as per DynamicDNA standards
    const properFirst = toProperCase(firstName);
    const properLast = toProperCase(lastName);
    setFirstName(properFirst);
    setLastName(properLast);

    const profile = registerLearnerProfile(properFirst, properLast, phoneNumber);
    setCreatedProfile({
      learnerNumber: profile.learnerNumber,
      fullName: profile.fullName,
      workEmail: profile.workEmail,
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
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2.5">
            <img
              src="/dynamicdna-logo.png"
              alt="DynamicDNA"
              className="h-8 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
            <div>
              <h3 className="font-bold text-[#333333] text-sm">Learner Profile Creation</h3>
              <p className="text-[11px] text-[#2F3E96] font-medium">DynamicDNA | DVT Learnership Programme</p>
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
                <div className="mt-3 p-2.5 bg-white border border-emerald-300 rounded font-mono text-center space-y-1">
                  <span className="text-[10px] text-slate-500 block uppercase">
                    System Assigned Learner Number:
                  </span>
                  <span className="text-lg font-bold text-[#2F3E96] block">
                    {createdProfile.learnerNumber}
                  </span>
                  <div className="pt-1 border-t border-slate-100 text-[11px] text-[#2F3E96] font-bold">
                    {createdProfile.workEmail}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Name formatted to Proper Case. Your read-only enterprise work email has been registered as <code>FirstName.LastName@dynamicdna.co.za</code>.
            </p>

            <button
              type="button"
              onClick={handleFinish}
              className="w-full py-2.5 px-4 bg-[#F4B52C] hover:bg-[#E0A220] text-white font-semibold rounded transition-colors shadow-xs cursor-pointer"
            >
              Enter SmartRegister Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="bg-blue-50 border border-[#2F3E96]/30 text-slate-800 p-3 rounded text-[11px]">
              <div className="flex items-center gap-1.5 font-bold mb-0.5 text-[#2F3E96]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2F3E96]" />
                <span>Next Available Learner Number:</span>
              </div>
              <span className="font-mono font-bold text-sm text-[#2F3E96]">{nextNum}</span>
              <p className="text-slate-600 mt-1">
                Learner numbers and work emails are sequentially generated by the system in Proper Case.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wide text-[10px] mb-1">
                First Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Zwavhudi"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded text-xs focus:ring-1 focus:ring-[#2F3E96] focus:border-[#2F3E96] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wide text-[10px] mb-1">
                Last Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Tshivhase"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded text-xs focus:ring-1 focus:ring-[#2F3E96] focus:border-[#2F3E96] focus:outline-none"
              />
            </div>

            {/* Read-Only Auto-Generated Work Email Preview */}
            <div className="p-3 bg-slate-50 border border-[#E5E7EB] rounded space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  Assigned Work Email (Read-Only)
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
                Generated automatically as <code>FirstName.LastName@dynamicdna.co.za</code>
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wide text-[10px] mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="+27 60 816 4224"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded text-xs focus:ring-1 focus:ring-[#2F3E96] focus:border-[#2F3E96] focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#F4B52C] hover:bg-[#E0A220] text-white font-semibold rounded transition-colors shadow-xs cursor-pointer"
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
