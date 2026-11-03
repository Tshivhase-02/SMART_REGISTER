import React, { useState, useMemo } from 'react';
import { useAttendance } from '../../../context/AttendanceContext';
import {
  Users,
  Search,
  X,
  Briefcase,
  Filter,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { LearnerProfileCard } from '../../profile/LearnerProfileCard';
import { LearnerProfileModal } from '../../profile/LearnerProfileModal';
import {
  searchLearnerDirectoryApi,
  PublicDirectoryCard,
} from '../../../services/learnerApi';

export const LearnerDirectoryScreen: React.FC = () => {
  const { users, currentUser } = useAttendance();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('All');
  const [selectedLearnerForModal, setSelectedLearnerForModal] = useState<PublicDirectoryCard | null>(null);

  // Common role tags for quick filtering
  const roleFilters = [
    'All',
    'Java Developer',
    'Software Developer',
    'Frontend Developer',
    'Data Analyst',
    'Business Analyst',
  ];

  // Base directory search
  const directoryCards = useMemo(() => {
    return searchLearnerDirectoryApi(users, searchQuery);
  }, [users, searchQuery]);

  // Apply role chip filter
  const filteredCards = useMemo(() => {
    if (selectedRoleFilter === 'All') {
      return directoryCards;
    }
    return directoryCards.filter((card) =>
      card.jobTitle.toLowerCase().includes(selectedRoleFilter.toLowerCase())
    );
  }, [directoryCards, selectedRoleFilter]);

  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedRoleFilter('All');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header (Microsoft 365 Enterprise Header) */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>DynamicDNA · DVT Learnership Programme</span>
            <span>·</span>
            <span className="text-[#2F3E96] font-bold">Networking Portal</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#333333] tracking-tight">
            Learner Directory
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Connect with fellow learners and discover their professional skills.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded text-xs font-semibold text-[#2F3E96]">
            <UserCheck className="w-4 h-4 text-[#2F3E96]" />
            <span>{filteredCards.length} Active Learners</span>
          </div>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 sm:p-5 shadow-xs space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or job title..."
            className="w-full pl-10 pr-10 py-2.5 text-sm border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2F3E96] focus:border-[#2F3E96] transition-colors placeholder:text-slate-400 bg-slate-50/50"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1 shrink-0">
            <Filter className="w-3 h-3" />
            <span>Roles:</span>
          </span>
          {roleFilters.map((role) => {
            const isSelected = selectedRoleFilter === role;
            return (
              <button
                key={role}
                onClick={() => setSelectedRoleFilter(role)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#2F3E96] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {role}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Directory Grid */}
      {filteredCards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredCards.map((card) => {
            const isSelf = card.id === currentUser?.id;
            return (
              <div key={card.id} className="relative group">
                <LearnerProfileCard
                  fullName={card.fullName}
                  jobTitle={card.jobTitle}
                  programme={card.programme}
                  workEmail={card.workEmail}
                  avatarUrl={card.avatarUrl}
                  linkedInUrl={card.linkedInUrl}
                  gitHubUrl={card.gitHubUrl}
                  showEmail={false} // Hidden in cards for privacy, revealed in details modal
                  onSelect={() => setSelectedLearnerForModal(card)}
                  className="h-full border border-[#E5E7EB] hover:border-[#2F3E96]/50"
                />
                {isSelf && (
                  <span className="absolute top-3 right-3 bg-[#F4B52C] text-[#2F3E96] font-bold text-[9px] uppercase px-2 py-0.5 rounded shadow-xs border border-[#F4B52C]">
                    You
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-10 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            No learners found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? `No active learners matched "${searchQuery}". Try searching by another name or role title.`
              : 'There are currently no active learners matching this filter.'}
          </p>
          {(searchQuery || selectedRoleFilter !== 'All') && (
            <button
              onClick={handleClearSearch}
              className="mt-2 px-4 py-2 bg-[#2F3E96] text-white rounded text-xs font-semibold hover:bg-[#25327a] transition-colors cursor-pointer"
            >
              Reset Search & Filters
            </button>
          )}
        </div>
      )}

      {/* 4. Learner Profile Details Modal */}
      <LearnerProfileModal
        learner={selectedLearnerForModal}
        onClose={() => setSelectedLearnerForModal(null)}
      />
    </div>
  );
};
