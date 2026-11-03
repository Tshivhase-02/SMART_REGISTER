import React, { useState } from 'react';
import { X, Linkedin, Github, Mail, Shield, User, ExternalLink, Briefcase, Award } from 'lucide-react';
import { PublicDirectoryCard } from '../../services/learnerApi';

interface LearnerProfileModalProps {
  learner: PublicDirectoryCard | null;
  onClose: () => void;
}

export const LearnerProfileModal: React.FC<LearnerProfileModalProps> = ({ learner, onClose }) => {
  const [imageError, setImageError] = useState(false);

  if (!learner) return null;

  const initials = learner.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const handleOpenExternal = (url?: string) => {
    if (!url) return;
    const formatted = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    window.open(formatted, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden text-[#333333] animate-scaleUp">
        {/* Modal Top Header with DynamicDNA Blue */}
        <div className="bg-[#2F3E96] p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#F4B52C]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-100">
              Learner Profile Card
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Hero section: Photo & Identity */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-5 border-b border-slate-100 text-center sm:text-left">
            <div className="relative shrink-0">
              {learner.avatarUrl && !imageError ? (
                <img
                  src={learner.avatarUrl}
                  alt={learner.fullName}
                  onError={() => setImageError(true)}
                  className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 shadow-sm"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-[#2F3E96] text-white font-bold text-2xl flex items-center justify-center border-4 border-slate-100 shadow-sm select-none">
                  {initials || <User className="w-10 h-10 text-white/80" />}
                </div>
              )}
              <span
                className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full"
                title="Active Learner"
              />
            </div>

            <div className="space-y-1.5 flex-1">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                {learner.fullName}
              </h3>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2F3E96] bg-[#2F3E96]/10 px-2.5 py-0.5 rounded">
                <Briefcase className="w-3.5 h-3.5" />
                <span>{learner.jobTitle}</span>
              </div>
              <p className="text-xs text-slate-500">
                {learner.programme}
              </p>
            </div>
          </div>

          {/* Professional Credentials & Contact */}
          <div className="space-y-3">
            <h4 className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
              Professional Details
            </h4>

            <div className="grid grid-cols-1 gap-2.5 text-xs">
              <div className="p-3 bg-slate-50 border border-[#E5E7EB] rounded flex items-center justify-between">
                <span className="text-slate-500 font-medium">Work Email:</span>
                <span className="font-mono font-semibold text-slate-900 select-all">
                  {learner.workEmail}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-[#E5E7EB] rounded flex items-center justify-between">
                <span className="text-slate-500 font-medium">Programme Status:</span>
                <span className="font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                  Enrolled & Active
                </span>
              </div>
            </div>
          </div>

          {/* Professional Social Links */}
          <div className="space-y-3">
            <h4 className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
              Professional Connections
            </h4>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              {learner.linkedInUrl ? (
                <button
                  type="button"
                  onClick={() => handleOpenExternal(learner.linkedInUrl)}
                  className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#0A66C2] hover:bg-[#084e96] text-white rounded text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  <Linkedin className="w-4 h-4 fill-current" />
                  <span>View LinkedIn Profile</span>
                  <ExternalLink className="w-3 h-3 ml-auto opacity-75" />
                </button>
              ) : (
                <div className="w-full sm:w-auto flex-1 p-2 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-400 italic">
                  LinkedIn profile not linked
                </div>
              )}

              {learner.gitHubUrl ? (
                <button
                  type="button"
                  onClick={() => handleOpenExternal(learner.gitHubUrl)}
                  className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-black text-white rounded text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  <Github className="w-4 h-4 fill-current" />
                  <span>View GitHub Profile</span>
                  <ExternalLink className="w-3 h-3 ml-auto opacity-75" />
                </button>
              ) : (
                <div className="w-full sm:w-auto flex-1 p-2 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-400 italic">
                  GitHub profile not linked
                </div>
              )}
            </div>
          </div>

          {/* Privacy Notice Banner */}
          <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded text-[11px] text-amber-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-[#F4B52C] shrink-0" />
            <span>
              DynamicDNA directory protects learner privacy. Personal contact numbers and attendance records are not shared.
            </span>
          </div>

          {/* Footer Action */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-white border border-[#E5E7EB] hover:bg-slate-50 text-slate-700 font-semibold rounded text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
