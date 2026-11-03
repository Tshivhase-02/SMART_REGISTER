import React, { useState, useRef, useEffect } from 'react';
import { useAttendance } from '../../../context/AttendanceContext';
import {
  User,
  Phone,
  Mail,
  Award,
  IdCard,
  CheckCircle2,
  Edit3,
  Camera,
  Trash2,
  Linkedin,
  Github,
  Lock,
  AlertCircle,
  Briefcase,
  Upload,
  Eye,
} from 'lucide-react';
import { LearnerProfileCard } from '../../profile/LearnerProfileCard';
import {
  validateLinkedInUrl,
  validateGitHubUrl,
  validateImageFile,
} from '../../../utils/validationUtils';
import { uploadProfilePictureApi } from '../../../services/learnerApi';

export const LearnerProfileScreen: React.FC = () => {
  const { currentUser, updateLearnerProfile } = useAttendance();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Form State
  const [firstName, setFirstName] = useState(currentUser?.firstName || '');
  const [lastName, setLastName] = useState(currentUser?.lastName || '');
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phoneNumber || '');
  const [jobTitle, setJobTitle] = useState(currentUser?.jobTitle || 'Java Developer');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.profilePictureUrl || currentUser?.avatarUrl || '');
  const [linkedInUrl, setLinkedInUrl] = useState(currentUser?.linkedInUrl || '');
  const [gitHubUrl, setGitHubUrl] = useState(currentUser?.gitHubUrl || '');

  // Reset form when currentUser updates
  useEffect(() => {
    if (currentUser) {
      setFirstName(currentUser.firstName || '');
      setLastName(currentUser.lastName || '');
      setPhoneNumber(currentUser.phoneNumber || '');
      setJobTitle(currentUser.jobTitle || 'Java Developer');
      setAvatarUrl(currentUser.profilePictureUrl || currentUser.avatarUrl || '');
      setLinkedInUrl(currentUser.linkedInUrl || '');
      setGitHubUrl(currentUser.gitHubUrl || '');
    }
  }, [currentUser]);

  if (!currentUser) return null;

  const jobTitleSuggestions = [
    'Java Developer',
    'Software Developer',
    'Business Analyst',
    'Data Analyst',
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'Software Tester',
    'Cloud Engineer',
    'IT Support Technician',
  ];

  const presetAvatars = [
    '/src/assets/images/avatar_learner_lerato_1793615780075.jpg',
    '/src/assets/images/avatar_admin_mokoena_1793615779301.jpg',
    '/src/assets/images/avatar_mentor_david_1793615779146.jpg',
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setValidationError(null);
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setValidationError(validation.error || 'Invalid image file.');
      return;
    }

    const uploadRes = await uploadProfilePictureApi(file);
    if (uploadRes.success && uploadRes.data) {
      setAvatarUrl(uploadRes.data);
    } else {
      setValidationError(uploadRes.error || 'Failed to process image upload.');
    }
  };

  const handleRemovePicture = () => {
    // Clear picture to show default initials
    setAvatarUrl('');
  };

  const handleCancel = () => {
    setFirstName(currentUser.firstName || '');
    setLastName(currentUser.lastName || '');
    setPhoneNumber(currentUser.phoneNumber || '');
    setJobTitle(currentUser.jobTitle || 'Java Developer');
    setAvatarUrl(currentUser.profilePictureUrl || currentUser.avatarUrl || '');
    setLinkedInUrl(currentUser.linkedInUrl || '');
    setGitHubUrl(currentUser.gitHubUrl || '');
    setValidationError(null);
    setIsEditing(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // 1. Required fields
    if (!firstName.trim()) {
      setValidationError('First name is required.');
      return;
    }
    if (!lastName.trim()) {
      setValidationError('Last name is required.');
      return;
    }
    if (!phoneNumber.trim()) {
      setValidationError('Contact number is required.');
      return;
    }

    // 2. LinkedIn URL validation
    if (linkedInUrl.trim()) {
      const liCheck = validateLinkedInUrl(linkedInUrl);
      if (!liCheck.isValid) {
        setValidationError(liCheck.error || 'Invalid LinkedIn URL.');
        return;
      }
    }

    // 3. GitHub URL validation
    if (gitHubUrl.trim()) {
      const ghCheck = validateGitHubUrl(gitHubUrl);
      if (!ghCheck.isValid) {
        setValidationError(ghCheck.error || 'Invalid GitHub URL.');
        return;
      }
    }

    // 4. Submit update
    const result = updateLearnerProfile(currentUser.id, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phoneNumber: phoneNumber.trim(),
      jobTitle: jobTitle.trim() || 'Software Developer',
      avatarUrl: avatarUrl,
      profilePictureUrl: avatarUrl,
      linkedInUrl: linkedInUrl.trim(),
      gitHubUrl: gitHubUrl.trim(),
    });

    if (result.success) {
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3500);
    } else {
      setValidationError(result.error || 'Failed to update profile.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Header (Microsoft 365 Enterprise Style) */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>DynamicDNA · DVT Learnership Programme</span>
            <span>·</span>
            <span>Identity & Directory Settings</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#333333] tracking-tight">
            Learner Profile
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Maintain your professional identity, technical role title, and public directory card.
          </p>
        </div>

        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#2F3E96] text-white rounded text-xs font-semibold hover:bg-[#25327a] transition-colors shadow-xs shrink-0 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        ) : (
          <button
            onClick={handleCancel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#E5E7EB] text-slate-700 rounded text-xs font-semibold hover:bg-slate-50 transition-colors shadow-xs shrink-0 cursor-pointer"
          >
            <span>Cancel</span>
          </button>
        )}
      </div>

      {/* Success Notification Banner */}
      {saveSuccess && (
        <div className="p-3.5 bg-emerald-50 border-l-4 border-emerald-600 text-emerald-900 rounded-r text-xs flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">
              Profile updated successfully! Your changes are now saved and visible across the Learner Directory.
            </span>
          </div>
          <button
            onClick={() => setSaveSuccess(false)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Validation Error Banner */}
      {validationError && (
        <div className="p-3.5 bg-rose-50 border-l-4 border-[#DC2626] text-rose-900 rounded-r text-xs flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
            <span>{validationError}</span>
          </div>
          <button
            onClick={() => setValidationError(null)}
            className="text-rose-700 hover:text-rose-900 font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Main Profile Grid: Settings Form & Live Professional Card Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Main Column: Profile Details or Edit Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-xs">
            {!isEditing ? (
              /* READ-ONLY VIEW */
              <div className="space-y-6 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4 text-[#2F3E96]" />
                    <span>Personal & Professional Information</span>
                  </h3>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Click "Edit Profile" to modify
                  </span>
                </div>

                {/* Read-Only System Fields */}
                <div className="space-y-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Official Enrolment Records (Read-Only)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3 rounded border border-[#E5E7EB]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500">
                          Learner Number:
                        </span>
                        <Lock className="w-3 h-3 text-slate-400" />
                      </div>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {currentUser.learnerNumber}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded border border-[#E5E7EB]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500">
                          Work Email:
                        </span>
                        <Lock className="w-3 h-3 text-slate-400" />
                      </div>
                      <span className="font-mono font-bold text-[#2F3E96] text-xs truncate block">
                        {currentUser.workEmail}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded border border-[#E5E7EB] sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500">
                          Programme:
                        </span>
                        <Lock className="w-3 h-3 text-slate-400" />
                      </div>
                      <span className="font-semibold text-slate-900 text-xs">
                        {currentUser.programme}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Editable Fields Summary */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Profile Attributes
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                        Full Name:
                      </span>
                      <span className="font-semibold text-slate-900 text-sm">
                        {currentUser.fullName}
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                        Job Title:
                      </span>
                      <span className="font-bold text-[#2F3E96] text-sm">
                        {currentUser.jobTitle || 'Java Developer'}
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded border border-slate-200 sm:col-span-2">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                        Contact Number (Private):
                      </span>
                      <span className="font-mono font-semibold text-slate-900 text-xs">
                        {currentUser.phoneNumber}
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded border border-slate-200 sm:col-span-2 space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Professional Social Links:
                      </span>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {currentUser.linkedInUrl ? (
                          <a
                            href={currentUser.linkedInUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#0A66C2]/10 text-[#0A66C2] font-semibold hover:underline"
                          >
                            <Linkedin className="w-3 h-3 fill-current" />
                            <span>LinkedIn Profile</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">No LinkedIn profile linked</span>
                        )}

                        {currentUser.gitHubUrl ? (
                          <a
                            href={currentUser.gitHubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-slate-800 font-semibold hover:underline"
                          >
                            <Github className="w-3 h-3 fill-current" />
                            <span>GitHub Profile</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">No GitHub profile linked</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs transition-colors cursor-pointer"
                  >
                    Edit Profile Details
                  </button>
                </div>
              </div>
            ) : (
              /* EDIT FORM */
              <form onSubmit={handleSave} className="space-y-4 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-[#2F3E96]" />
                    <span>Edit Profile Information</span>
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    All inputs validated
                  </span>
                </div>

                {/* Profile Picture Upload & Controls */}
                <div className="p-4 bg-slate-50 border border-[#E5E7EB] rounded-lg space-y-3">
                  <label className="block text-xs font-semibold text-slate-700">
                    Profile Picture Management
                  </label>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative shrink-0">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="Preview"
                          className="w-16 h-16 rounded-full object-cover border-2 border-[#2F3E96] shadow-xs"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-[#2F3E96] text-white font-bold text-lg flex items-center justify-center border-2 border-slate-300">
                          {firstName[0] || 'L'}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2 text-center sm:text-left">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        {/* Hidden file input */}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={handleFileUpload}
                          className="hidden"
                        />

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2F3E96] text-white rounded text-xs font-semibold hover:bg-[#25327a] transition-colors cursor-pointer shadow-xs"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Image</span>
                        </button>

                        {avatarUrl && (
                          <button
                            type="button"
                            onClick={handleRemovePicture}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 rounded text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500">
                        Supports JPEG, PNG, or WebP up to 2MB. Preview updates in real-time.
                      </p>
                    </div>
                  </div>

                  {/* Preset alternative avatars */}
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                      Or select from standard programme avatars:
                    </span>
                    <div className="flex items-center gap-2">
                      {presetAvatars.map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setAvatarUrl(url)}
                          className={`relative rounded-full p-0.5 border-2 cursor-pointer transition-transform hover:scale-105 ${
                            avatarUrl === url ? 'border-[#2F3E96]' : 'border-transparent'
                          }`}
                        >
                          <img
                            src={url}
                            alt="Preset"
                            className="w-9 h-9 rounded-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      First Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Zwavhudi"
                      className="w-full px-3 py-2 text-sm border-b-2 border-slate-700 focus:border-[#2F3E96] focus:outline-none transition-colors rounded-none placeholder:text-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Last Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Tshivhase"
                      className="w-full px-3 py-2 text-sm border-b-2 border-slate-700 focus:border-[#2F3E96] focus:outline-none transition-colors rounded-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Job Title Field (Free input + suggestions) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-700">
                      Job Title / Specialization <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Custom titles allowed</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Java Developer, Software Developer, Data Analyst..."
                    className="w-full px-3 py-2 text-sm border-b-2 border-slate-700 focus:border-[#2F3E96] focus:outline-none transition-colors rounded-none placeholder:text-slate-400"
                  />
                  {/* Quick role suggestions */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-slate-500 font-semibold">Quick picks:</span>
                    {jobTitleSuggestions.slice(0, 5).map((title) => (
                      <button
                        key={title}
                        type="button"
                        onClick={() => setJobTitle(title)}
                        className={`text-[10px] px-2 py-0.5 rounded transition-colors cursor-pointer ${
                          jobTitle === title
                            ? 'bg-[#2F3E96] text-white font-bold'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contact Number */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Contact Number (Private) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+27 60 816 4224"
                    className="w-full px-3 py-2 text-sm border-b-2 border-slate-700 focus:border-[#2F3E96] focus:outline-none transition-colors rounded-none placeholder:text-slate-400 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Your phone number is strictly private and is never displayed on directory cards.
                  </p>
                </div>

                {/* LinkedIn Profile URL */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    LinkedIn Profile URL
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={linkedInUrl}
                      onChange={(e) => setLinkedInUrl(e.target.value)}
                      placeholder="https://www.linkedin.com/in/zwavhudi-tshivhase"
                      className="w-full pl-8 pr-3 py-2 text-sm border-b-2 border-slate-700 focus:border-[#2F3E96] focus:outline-none transition-colors rounded-none placeholder:text-slate-400"
                    />
                    <Linkedin className="w-4 h-4 text-[#0A66C2] absolute left-1.5 top-2.5 fill-current" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Example: <code>https://www.linkedin.com/in/your-username</code>
                  </p>
                </div>

                {/* GitHub Profile URL */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    GitHub Profile URL
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={gitHubUrl}
                      onChange={(e) => setGitHubUrl(e.target.value)}
                      placeholder="https://github.com/zwavhudi-tshivhase"
                      className="w-full pl-8 pr-3 py-2 text-sm border-b-2 border-slate-700 focus:border-[#2F3E96] focus:outline-none transition-colors rounded-none placeholder:text-slate-400"
                    />
                    <Github className="w-4 h-4 text-slate-800 absolute left-1.5 top-2.5 fill-current" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Example: <code>https://github.com/your-username</code>
                  </p>
                </div>

                {/* Read-Only Informational Notice */}
                <div className="p-3 bg-slate-50 border border-[#E5E7EB] rounded text-[11px] text-slate-600 flex items-center justify-between">
                  <div>
                    <span className="font-semibold block text-slate-700">
                      Immutable System Identifiers:
                    </span>
                    <span>
                      Learner Number: <code>{currentUser.learnerNumber}</code> · Work Email: <code>{currentUser.workEmail}</code>
                    </span>
                  </div>
                  <Lock className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                </div>

                {/* Profile Actions: [Edit Profile] [Save Changes] [Cancel] */}
                <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 border border-[#E5E7EB] text-slate-700 hover:bg-slate-50 rounded text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  {/* Primary Button: #F4B52C, Text: White */}
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#F4B52C] hover:bg-[#E0A220] text-white font-semibold rounded text-xs transition-colors shadow-xs cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Live Professional Learner Profile Card Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-[#2F3E96]" />
              <span>Public Directory Card Preview</span>
            </span>
            <span className="text-[10px] text-slate-400">Live preview</span>
          </div>

          <LearnerProfileCard
            fullName={`${firstName || currentUser.firstName} ${lastName || currentUser.lastName}`.trim()}
            jobTitle={jobTitle || 'Java Developer'}
            programme={currentUser.programme || 'DynamicDNA | DVT Learnership Programme'}
            workEmail={currentUser.workEmail}
            avatarUrl={avatarUrl}
            linkedInUrl={linkedInUrl}
            gitHubUrl={gitHubUrl}
            learnerNumber={currentUser.learnerNumber}
            showEmail={true}
            className="border-2 border-[#2F3E96]/20 bg-linear-to-b from-white to-slate-50/50"
          />

          <div className="p-3.5 bg-blue-50/60 border border-blue-200/70 rounded-lg text-xs text-slate-600 space-y-1.5">
            <span className="font-bold text-[#2F3E96] block text-[11px] uppercase">
              How You Appear in SmartRegister:
            </span>
            <p className="leading-relaxed text-[11px]">
              This card is visible to other learners in the <strong>Learner Directory</strong>. Your social profiles (LinkedIn and GitHub) allow peers to connect with you professionally.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
