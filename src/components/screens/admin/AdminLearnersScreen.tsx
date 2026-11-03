import React, { useState, useMemo } from 'react';
import { useAttendance } from '../../../context/AttendanceContext';
import { UserProfile } from '../../../types/attendance';
import {
  Users,
  Search,
  Plus,
  Eye,
  Edit,
  Power,
  CheckCircle2,
  XCircle,
  Phone,
  IdCard,
} from 'lucide-react';
import { toProperCase } from '../../../utils/nameUtils';

export const AdminLearnersScreen: React.FC = () => {
  const {
    users,
    registerLearnerProfile,
    editLearner,
    toggleLearnerStatus,
    approveLearnerRegistration,
    rejectLearnerRegistration,
  } = useAttendance();

  const [activeTab, setActiveTab] = useState<'approved' | 'pending'>('approved');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLearnerForView, setSelectedLearnerForView] = useState<UserProfile | null>(null);
  const [selectedLearnerForEdit, setSelectedLearnerForEdit] = useState<UserProfile | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [approvalFeedback, setApprovalFeedback] = useState<string | null>(null);

  // New learner form fields
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newPhone, setNewPhone] = useState('+27 ');

  const pendingLearners = useMemo(() => {
    return users.filter(
      (u) =>
        u.role === 'learner' &&
        (u.approvalStatus === 'Pending Approval' || u.status === 'pending_approval')
    );
  }, [users]);

  const approvedLearners = useMemo(() => {
    return users.filter(
      (u) =>
        u.role === 'learner' &&
        u.approvalStatus !== 'Pending Approval' &&
        u.status !== 'pending_approval'
    );
  }, [users]);

  const displayedLearners = activeTab === 'pending' ? pendingLearners : approvedLearners;

  const filteredLearners = useMemo(() => {
    return displayedLearners.filter(
      (l) =>
        l.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.learnerNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.workEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.phoneNumber.includes(searchQuery)
    );
  }, [displayedLearners, searchQuery]);

  const handleApprove = (learner: UserProfile) => {
    approveLearnerRegistration(learner.id);
    setApprovalFeedback(`Learner registration for ${learner.fullName} approved. Sequential learner number generated.`);
    setTimeout(() => setApprovalFeedback(null), 4000);
  };

  const handleReject = (learner: UserProfile) => {
    rejectLearnerRegistration(learner.id, 'Registration declined by supervisor.');
    setApprovalFeedback(`Registration request for ${learner.fullName} rejected.`);
    setTimeout(() => setApprovalFeedback(null), 4000);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName.trim() || !newLastName.trim() || !newPhone.trim()) return;

    registerLearnerProfile(toProperCase(newFirstName), toProperCase(newLastName), newPhone);
    setIsAddModalOpen(false);
    setNewFirstName('');
    setNewLastName('');
    setNewPhone('+27 ');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLearnerForEdit) {
      const properFirst = toProperCase(selectedLearnerForEdit.firstName);
      const properLast = toProperCase(selectedLearnerForEdit.lastName);
      editLearner({
        ...selectedLearnerForEdit,
        firstName: properFirst,
        lastName: properLast,
        fullName: `${properFirst} ${properLast}`,
      });
      setSelectedLearnerForEdit(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>DVT Learnership Management</span>
            <span>·</span>
            <span>Learner Directory</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Learner Management
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Enrol new learners, maintain profile records, and control system activation status.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#F4B52C] hover:bg-[#E0A220] text-white rounded text-xs font-semibold transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Learner</span>
        </button>
      </div>

      {/* Feedback Toast */}
      {approvalFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-semibold text-emerald-900 flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{approvalFeedback}</span>
          </div>
          <button
            onClick={() => setApprovalFeedback(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Pending Registration Alert Banner */}
      {pendingLearners.length > 0 && activeTab !== 'pending' && (
        <div className="p-4 bg-amber-50 border border-[#F4B52C]/60 rounded-lg text-xs flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5 text-amber-950">
            <div className="p-1.5 bg-[#F4B52C]/30 rounded text-[#2F3E96]">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold">
                {pendingLearners.length} Registration Request{pendingLearners.length > 1 ? 's' : ''} Pending Approval
              </span>
              <p className="text-amber-800 text-[11px] mt-0.5">
                New learnership candidates have submitted self-registration requests requiring administrator verification.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('pending')}
            className="px-3.5 py-1.5 bg-[#2F3E96] hover:bg-[#25327B] text-white font-semibold text-xs rounded transition-colors shadow-xs shrink-0"
          >
            Review Requests ({pendingLearners.length})
          </button>
        </div>
      )}

      {/* 2. Directory Navigation Tabs & Search Bar */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-3.5 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        {/* Tabs */}
        <div className="inline-flex p-1 bg-[#F5F5F5] rounded-md border border-[#E5E7EB] text-xs">
          <button
            onClick={() => setActiveTab('approved')}
            className={`px-3 py-1.5 rounded transition-all ${
              activeTab === 'approved'
                ? 'bg-[#F4B52C] text-[#2F3E96] shadow-xs font-bold'
                : 'text-[#333333] hover:text-[#2F3E96] font-medium'
            }`}
          >
            Active Directory ({approvedLearners.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
              activeTab === 'pending'
                ? 'bg-[#F4B52C] text-[#2F3E96] shadow-xs font-bold'
                : 'text-[#333333] hover:text-[#2F3E96] font-medium'
            }`}
          >
            <span>Registration Requests</span>
            {pendingLearners.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-[#2F3E96] text-white">
                {pendingLearners.length}
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder={
              activeTab === 'pending'
                ? 'Search registration requests...'
                : 'Search by name, learner number, or phone...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#0F4C81] focus:outline-none"
          />
        </div>
      </div>

      {/* 3. Table */}
      {activeTab === 'pending' ? (
        /* PENDING REGISTRATION APPROVAL WORKFLOW TABLE */
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          <div className="p-4 bg-amber-50/60 border-b border-amber-200 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-950">
                Pending Registration Approval Queue
              </h3>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Review applicants. Approving assigns the sequential Learner Number (DVT-2026-XXX) and activates login access.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
              {filteredLearners.length} Awaiting Decision
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#2F3E96] text-white uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4 text-white">Applicant</th>
                  <th className="py-3 px-4 text-white">Generated Work Email</th>
                  <th className="py-3 px-4 text-white">Phone Number</th>
                  <th className="py-3 px-4 text-white">Submitted At</th>
                  <th className="py-3 px-4 text-white">Status</th>
                  <th className="py-3 px-4 text-right text-white">Approval Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {filteredLearners.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                      No pending learner registration requests at this time.
                    </td>
                  </tr>
                ) : (
                  filteredLearners.map((learner) => (
                    <tr key={learner.id} className="hover:bg-[#F4B52C]/10 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#2F3E96] text-white flex items-center justify-center font-bold text-xs">
                            {learner.firstName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{learner.fullName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {learner.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-[#2F3E96] font-semibold whitespace-nowrap">
                        {learner.workEmail}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {learner.phoneNumber}
                      </td>

                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {learner.registeredAt || '2026-11-02 08:30'}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-900 bg-amber-100 border border-[#F4B52C]/60 px-2 py-0.5 rounded">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#F4B52C] animate-pulse" />
                          <span>Pending Approval</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedLearnerForView(learner)}
                            className="px-2.5 py-1 text-white bg-[#2F3E96] hover:bg-[#25327B] rounded font-semibold text-[11px] flex items-center gap-1 shadow-xs transition-colors"
                            title="View Registration Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>

                          <button
                            onClick={() => handleReject(learner)}
                            className="px-2.5 py-1 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded font-semibold text-[11px] flex items-center gap-1 transition-colors"
                            title="Reject Registration"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>

                          <button
                            onClick={() => handleApprove(learner)}
                            className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold text-[11px] flex items-center gap-1 shadow-xs transition-colors"
                            title="Approve and assign sequential DVT-2026-XXX"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ACTIVE LEARNERS DIRECTORY TABLE */
        <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#2F3E96] text-white uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4 text-white">Learner Number</th>
                  <th className="py-3 px-4 text-white">Full Name</th>
                  <th className="py-3 px-4 text-white">Work Email</th>
                  <th className="py-3 px-4 text-white">Phone Number</th>
                  <th className="py-3 px-4 text-white">Programme</th>
                  <th className="py-3 px-4 text-white">Status</th>
                  <th className="py-3 px-4 text-right text-white">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {filteredLearners.map((learner) => (
                  <tr key={learner.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {learner.learnerNumber}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <img
                          src={learner.avatarUrl}
                          alt=""
                          className="w-6 h-6 rounded-full object-cover border border-slate-200"
                          referrerPolicy="no-referrer"
                        />
                        <span className="font-semibold text-slate-900">{learner.fullName}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {learner.workEmail}
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {learner.phoneNumber}
                    </td>

                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {learner.programme}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                          learner.status === 'active' ? 'text-emerald-700' : 'text-slate-400'
                        }`}
                      >
                        {learner.status === 'active' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span className="capitalize">{learner.status}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedLearnerForView(learner)}
                          className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100"
                          title="View Profile Dossier"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedLearnerForEdit(learner)}
                          className="p-1 text-[#0F4C81] hover:text-[#0A355C] rounded hover:bg-slate-100"
                          title="Edit Learner Information"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleLearnerStatus(learner.id)}
                          className={`p-1 rounded hover:bg-slate-100 ${
                            learner.status === 'active'
                              ? 'text-rose-600 hover:text-rose-800'
                              : 'text-emerald-600 hover:text-emerald-800'
                          }`}
                          title={learner.status === 'active' ? 'Deactivate' : 'Reactivate'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Profile Modal */}
      {selectedLearnerForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full p-6 text-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">
              Learner Profile Dossier
            </h3>

            <div className="flex items-center gap-4">
              <img
                src={selectedLearnerForView.avatarUrl}
                alt=""
                className="w-14 h-14 rounded-full object-cover border border-slate-200"
                referrerPolicy="no-referrer"
              />
              <div>
                <p className="font-bold text-base text-slate-900">
                  {selectedLearnerForView.fullName}
                </p>
                <span className="font-mono text-xs font-bold text-[#0F4C81]">
                  {selectedLearnerForView.learnerNumber}
                </span>
                <span className="block text-[11px] text-slate-500">
                  {selectedLearnerForView.programme}
                </span>
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-3 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">First Name:</span>
                <span className="font-semibold text-slate-800">{selectedLearnerForView.firstName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Last Name:</span>
                <span className="font-semibold text-slate-800">{selectedLearnerForView.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone Number:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {selectedLearnerForView.phoneNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="capitalize font-semibold text-emerald-700">
                  {selectedLearnerForView.status}
                </span>
              </div>
            </div>

            <div className="text-right pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedLearnerForView(null)}
                className="px-4 py-1.5 bg-slate-900 text-white font-semibold rounded text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Learner Modal */}
      {selectedLearnerForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full p-6 text-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Edit Learner Profile</h3>
            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">First Name</label>
                <input
                  type="text"
                  required
                  value={selectedLearnerForEdit.firstName}
                  onChange={(e) =>
                    setSelectedLearnerForEdit({
                      ...selectedLearnerForEdit,
                      firstName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#0F4C81]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={selectedLearnerForEdit.lastName}
                  onChange={(e) =>
                    setSelectedLearnerForEdit({
                      ...selectedLearnerForEdit,
                      lastName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#0F4C81]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={selectedLearnerForEdit.phoneNumber}
                  onChange={(e) =>
                    setSelectedLearnerForEdit({
                      ...selectedLearnerForEdit,
                      phoneNumber: e.target.value,
                    })
                  }
                  className="w-full px-3 py-1.5 border border-[#E5E7EB] rounded text-xs focus:ring-1 focus:ring-[#2F3E96]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedLearnerForEdit(null)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#F4B52C] hover:bg-[#E0A220] text-white font-semibold rounded shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Learner Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-xl max-w-md w-full p-6 text-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Add New Learner</h3>
            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">First Name</label>
                <input
                  type="text"
                  required
                  placeholder="Zwavhudi"
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#E5E7EB] rounded text-xs focus:ring-1 focus:ring-[#2F3E96]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  placeholder="Tshivhase"
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#E5E7EB] rounded text-xs focus:ring-1 focus:ring-[#2F3E96]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="+27 60 816 4224"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#E5E7EB] rounded text-xs focus:ring-1 focus:ring-[#2F3E96]"
                />
              </div>

              <div className="p-2.5 bg-slate-50 border border-[#E5E7EB] rounded text-[11px] text-slate-600">
                Learner number and work email (<code>FirstName.LastName@dynamicdna.co.za</code>) will be generated automatically in Proper Case.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#F4B52C] hover:bg-[#E0A220] text-white font-semibold rounded shadow-xs cursor-pointer"
                >
                  Register Learner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
