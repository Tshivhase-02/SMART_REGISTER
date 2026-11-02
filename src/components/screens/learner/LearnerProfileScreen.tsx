import React, { useState } from 'react';
import { useAttendance } from '../../../context/AttendanceContext';
import { User, Phone, Award, IdCard, CheckCircle2, Edit3, Camera } from 'lucide-react';

export const LearnerProfileScreen: React.FC = () => {
  const { currentUser, updateProfileDetails } = useAttendance();

  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phoneNumber || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!currentUser) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileDetails(phoneNumber, avatarUrl);
    setSaveSuccess(true);
    setIsEditing(false);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const sampleAvatars = [
    '/src/assets/images/avatar_learner_lerato_1793615780075.jpg',
    '/src/assets/images/avatar_admin_mokoena_1793615779301.jpg',
    '/src/assets/images/avatar_mentor_david_1793615779146.jpg',
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 1. Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>DVT Learnership Programme</span>
            <span>·</span>
            <span>Learner Profile</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            My Profile
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Personal identity and contact details registered on SmartRegister.
          </p>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0F4C81] text-white rounded text-xs font-semibold hover:bg-[#0A355C] transition-colors shadow-xs shrink-0"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{isEditing ? 'Cancel Edit' : 'Update Details'}</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Profile updated successfully.</span>
        </div>
      )}

      {/* 2. Profile Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-6">
        {/* Photo and Name */}
        <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-slate-100">
          <div className="relative">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.fullName}
              className="w-20 h-20 rounded-full object-cover border-2 border-slate-200"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="text-center sm:text-left space-y-1">
            <h3 className="text-xl font-bold text-slate-900">{currentUser.fullName}</h3>
            <span className="inline-block text-xs font-mono font-bold text-[#0F4C81] bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
              {currentUser.learnerNumber}
            </span>
            <p className="text-xs text-slate-500">{currentUser.programme}</p>
          </div>
        </div>

        {/* Details Grid */}
        {!isEditing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 p-3.5 rounded border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                Learner Number:
              </span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {currentUser.learnerNumber}
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                Programme:
              </span>
              <span className="font-semibold text-slate-900 text-sm">
                {currentUser.programme}
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                First Name:
              </span>
              <span className="font-semibold text-slate-900 text-sm">
                {currentUser.firstName}
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                Last Name:
              </span>
              <span className="font-semibold text-slate-900 text-sm">
                {currentUser.lastName}
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded border border-slate-200 sm:col-span-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                Phone Number (Editable):
              </span>
              <span className="font-semibold text-slate-900 text-sm font-mono">
                {currentUser.phoneNumber}
              </span>
            </div>
          </div>
        ) : (
          /* Edit Form: Allows Updating Phone Number & Profile Picture */
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="bg-blue-50 border border-blue-200 p-3 rounded text-[11px] text-slate-700">
              <strong>Permitted Updates:</strong> As per system policy, learners may update their <strong>Phone Number</strong> and <strong>Profile Picture</strong>. First Name, Last Name, and Learner Number are locked.
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wide text-[10px] mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#0F4C81] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wide text-[10px] mb-1">
                Select Profile Picture
              </label>
              <div className="flex items-center gap-3 pt-1">
                {sampleAvatars.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setAvatarUrl(url)}
                    className={`relative rounded-full p-0.5 border-2 ${
                      avatarUrl === url ? 'border-[#0F4C81]' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={url}
                      alt="Preset"
                      className="w-12 h-12 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {avatarUrl === url && (
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-[#0F4C81] text-white rounded-full flex items-center justify-center text-[10px]">
                        ✓
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3.5 py-1.5 text-slate-600 hover:text-slate-900 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#0F4C81] text-white font-semibold rounded hover:bg-[#0A355C] transition-colors"
              >
                Save Updates
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
