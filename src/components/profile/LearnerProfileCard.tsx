import React, { useState } from 'react';
import { Mail, Linkedin, Github, ExternalLink, ShieldCheck, User } from 'lucide-react';

interface LearnerProfileCardProps {
  fullName: string;
  jobTitle?: string;
  programme?: string;
  workEmail: string;
  avatarUrl?: string;
  linkedInUrl?: string;
  gitHubUrl?: string;
  learnerNumber?: string;
  showEmail?: boolean;
  className?: string;
  onSelect?: () => void;
  isCompact?: boolean;
}

export const LearnerProfileCard: React.FC<LearnerProfileCardProps> = ({
  fullName,
  jobTitle = 'Software Developer',
  programme = 'DynamicDNA | DVT Learnership Programme',
  workEmail,
  avatarUrl,
  linkedInUrl,
  gitHubUrl,
  learnerNumber,
  showEmail = true,
  className = '',
  onSelect,
  isCompact = false,
}) => {
  const [imageError, setImageError] = useState(false);

  // Formatted initial initials
  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const handleSocialClick = (e: React.MouseEvent, url?: string) => {
    e.stopPropagation();
    if (!url) return;
    const formattedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    window.open(formattedUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      onClick={onSelect}
      className={`bg-white border border-[#E5E7EB] rounded-lg shadow-xs hover:shadow-md transition-all duration-200 p-5 text-[#333333] flex flex-col justify-between ${
        onSelect ? 'cursor-pointer hover:border-[#2F3E96]/40' : ''
      } ${className}`}
    >
      <div>
        {/* Top: Avatar & Learner ID / Programme Tag */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="relative">
            {avatarUrl && !imageError ? (
              <img
                src={avatarUrl}
                alt={fullName}
                onError={() => setImageError(true)}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-[#E5E7EB] shadow-xs"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#2F3E96] text-white font-bold text-lg sm:text-xl flex items-center justify-center border-2 border-[#E5E7EB] shadow-xs select-none">
                {initials || <User className="w-8 h-8 text-white/80" />}
              </div>
            )}
            <span
              className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"
              title="Active Learner"
            />
          </div>

          {learnerNumber && (
            <span className="font-mono text-[10px] font-bold text-[#2F3E96] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded shrink-0">
              {learnerNumber}
            </span>
          )}
        </div>

        {/* Profile Details */}
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
            {fullName}
          </h3>

          <p className="text-xs sm:text-sm font-semibold text-[#2F3E96]">
            {jobTitle}
          </p>

          <p className="text-xs text-slate-500 leading-relaxed">
            {programme}
          </p>

          {showEmail && workEmail && (
            <div className="pt-2 flex items-center gap-1.5 text-xs text-slate-600">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-mono truncate text-[11px] select-all">
                {workEmail}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Social Links & Action Footer */}
      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {linkedInUrl ? (
            <button
              type="button"
              onClick={(e) => handleSocialClick(e, linkedInUrl)}
              title="Open LinkedIn Profile (New Tab)"
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded text-[#0A66C2] bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 transition-colors cursor-pointer"
            >
              <Linkedin className="w-3.5 h-3.5 fill-current" />
              <span>LinkedIn</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-400 italic">No LinkedIn</span>
          )}

          {gitHubUrl ? (
            <button
              type="button"
              onClick={(e) => handleSocialClick(e, gitHubUrl)}
              title="Open GitHub Profile (New Tab)"
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <Github className="w-3.5 h-3.5 fill-current" />
              <span>GitHub</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-400 italic">No GitHub</span>
          )}
        </div>

        {onSelect && (
          <span className="text-xs text-[#2F3E96] font-semibold flex items-center gap-0.5">
            View
            <ExternalLink className="w-3 h-3" />
          </span>
        )}
      </div>
    </div>
  );
};
