import React, { useState } from 'react';
import { useAttendance } from '../../../context/AttendanceContext';
import { UserProfile } from '../../../types/attendance';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  FileSpreadsheet,
  CalendarDays,
  UserCheck,
  XCircle,
  Eye,
  Check,
  X,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    users,
    attendanceRecords,
    absenceRequests,
    currentTime,
    setActiveScreen,
    approveLearnerRegistration,
    rejectLearnerRegistration,
    pendingRegistrations,
  } = useAttendance();

  const [selectedLearnerForView, setSelectedLearnerForView] = useState<UserProfile | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const activeLearners = users.filter((u) => u.role === 'learner' && u.status === 'active');
  const totalLearners = activeLearners.length;

  const todayStr = currentTime.toISOString().split('T')[0];
  const todayRecords = attendanceRecords.filter((r) => r.date === todayStr);

  const presentToday = todayRecords.filter((r) => r.status === 'Present').length;
  const lateToday = todayRecords.filter((r) => r.status === 'Late').length;
  const recordedToday = presentToday + lateToday;
  const absentToday = Math.max(0, totalLearners - recordedToday);
  const attendanceRate = totalLearners > 0 ? Math.round((recordedToday / totalLearners) * 100) : 0;

  const recentAttendance = attendanceRecords.slice(0, 5);
  const recentAbsences = absenceRequests.slice(0, 4);

  const handleApprove = (id: string, name: string) => {
    const res = approveLearnerRegistration(id);
    if (res.success) {
      setActionNotice(`Approved ${name}! Assigned Learner Number: ${res.learnerNumber}. Account Status: Active.`);
      setTimeout(() => setActionNotice(null), 5000);
    }
  };

  const handleReject = (id: string, name: string) => {
    const res = rejectLearnerRegistration(id);
    if (res.success) {
      setActionNotice(`Registration request for ${name} has been rejected.`);
      setTimeout(() => setActionNotice(null), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header & Quick Controls (Branding kept exclusively in sidebar/header) */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg px-5 py-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#333333] tracking-tight">
            Administrator Dashboard
          </h2>
          <p className="text-xs text-slate-500">
            Workplace attendance monitoring, schedule configuration, registration approvals, and statutory registers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Secondary Button: #2F3E96, Text: White */}
          <button
            onClick={() => setActiveScreen('admin_register_downloads')}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#2F3E96] text-white rounded text-xs font-semibold hover:bg-[#25327a] transition-colors shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Attendance Registers (A4)</span>
          </button>
          <button
            onClick={() => setActiveScreen('admin_schedule_management')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#E5E7EB] text-slate-700 rounded text-xs font-semibold hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <CalendarDays className="w-3.5 h-3.5 text-[#2F3E96]" />
            <span>Manage Schedules</span>
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionNotice && (
        <div className="p-3 bg-emerald-50 border-l-4 border-emerald-600 rounded text-xs text-emerald-900 font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. 5 Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
            Total Learners
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {totalLearners}
            </span>
            <span className="text-[11px] text-slate-500">enrolled</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">DVT 2026 Cohort</p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
            Present Today
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-600">
              {presentToday}
            </span>
            <span className="text-[11px] text-slate-500">on-time</span>
          </div>
          <p className="text-[10px] text-emerald-600 mt-1">07:15 - 09:00 window</p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
            Late Today
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-600">
              {lateToday}
            </span>
            <span className="text-[11px] text-slate-500">after 09:00</span>
          </div>
          <p className="text-[10px] text-amber-600 mt-1">Late status logged</p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
            Absent Today
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-rose-600">
              {absentToday}
            </span>
            <span className="text-[11px] text-slate-500">unrecorded</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">No attendance logged</p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 shadow-xs col-span-2 lg:col-span-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
            Attendance Rate
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#2F3E96]">
              {attendanceRate}%
            </span>
            <span className="text-[11px] text-slate-500">target: ≥85%</span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5">
            <div
              className="bg-[#2F3E96] h-1.5 rounded-full"
              style={{ width: `${Math.min(100, attendanceRate)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Pending Registrations Section (Learner Approval Management) */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#2F3E96]" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Pending Registrations
            </h3>
            {pendingRegistrations.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#F4B52C]/20 text-[#2F3E96] font-mono text-[11px] font-bold border border-[#F4B52C]/40">
                {pendingRegistrations.length} awaiting review
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-500">
            Approved registrations automatically generate DVT Learner Numbers
          </span>
        </div>

        {pendingRegistrations.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded border border-dashed border-[#E5E7EB]">
            No pending learner registrations requiring administrator review.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#2F3E96] text-white font-semibold uppercase text-[10px]">
                  <th className="py-2.5 px-3">First Name</th>
                  <th className="py-2.5 px-3">Last Name</th>
                  <th className="py-2.5 px-3">Contact Number</th>
                  <th className="py-2.5 px-3">Generated Work Email</th>
                  <th className="py-2.5 px-3">Date Submitted</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {pendingRegistrations.map((lrn) => (
                  <tr key={lrn.id} className="hover:bg-[#F4B52C]/10 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{lrn.firstName}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{lrn.lastName}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">{lrn.phoneNumber}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{lrn.workEmail}</td>
                    <td className="py-2.5 px-3 text-slate-500">{lrn.dateSubmitted || 'Today'}</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold uppercase">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Pending Approval</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Secondary Button: View */}
                        <button
                          onClick={() => setSelectedLearnerForView(lrn)}
                          className="px-2.5 py-1 bg-[#2F3E96] hover:bg-[#25327a] text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                          title="View Details"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => handleApprove(lrn.id, lrn.fullName)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors shadow-xs cursor-pointer"
                          title="Approve & Generate Learner Number"
                        >
                          <Check className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleReject(lrn.id, lrn.fullName)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                          title="Reject Registration"
                        >
                          <X className="w-3 h-3" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Recent Attendance & Recent Absence Requests Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Attendance Stream (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Recent Attendance
            </h3>
            <button
              onClick={() => setActiveScreen('admin_attendance')}
              className="text-xs text-[#2F3E96] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>View Full Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {recentAttendance.map((rec) => (
              <div
                key={rec.id}
                className="p-2.5 rounded border border-[#E5E7EB] bg-slate-50 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{rec.learnerName}</span>
                    <span className="font-mono text-[10px] text-slate-500">
                      ({rec.learnerNumber})
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {rec.date} · In: {rec.clockInTime || '—'} · Out: {rec.clockOutTime || '—'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      rec.status === 'Present'
                        ? 'bg-emerald-100 text-emerald-800'
                        : rec.status === 'Late'
                        ? 'bg-[#F4B52C]/20 text-[#2F3E96] border border-[#F4B52C]/50'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {rec.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Absence Requests (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Recent Absence Requests
            </h3>
            <button
              onClick={() => setActiveScreen('admin_absence_requests')}
              className="text-xs text-[#2F3E96] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Review All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {recentAbsences.map((req) => (
              <div
                key={req.id}
                className="p-2.5 rounded border border-slate-100 bg-slate-50 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{req.learnerName}</span>
                  <span
                    className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      req.status === 'Approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : req.status === 'Rejected'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 flex justify-between">
                  <span>{req.date} · {req.reason}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* View Learner Registration Modal */}
      {selectedLearnerForView && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-slate-200 overflow-hidden text-xs">
            <div className="p-4 bg-[#2F3E96] text-white flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm">Learner Registration Details</h4>
                <p className="text-[11px] text-blue-100">DynamicDNA DVT Learnership Programme</p>
              </div>
              <button
                onClick={() => setSelectedLearnerForView(null)}
                className="text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">First Name</span>
                  <span className="font-semibold text-slate-800">{selectedLearnerForView.firstName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Last Name</span>
                  <span className="font-semibold text-slate-800">{selectedLearnerForView.lastName}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Generated Work Email</span>
                <span className="font-mono font-semibold text-slate-900">{selectedLearnerForView.workEmail}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Contact Number</span>
                  <span className="font-mono text-slate-800">{selectedLearnerForView.phoneNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Date Submitted</span>
                  <span className="text-slate-800">{selectedLearnerForView.dateSubmitted || 'Today'}</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded border border-amber-200">
                <span className="text-[10px] text-amber-800 block uppercase font-bold">Registration Status</span>
                <span className="font-bold text-amber-900 text-xs">Pending Administrator Approval</span>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Upon approval, this learner will be assigned the next sequential DVT number and granted dashboard access.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => setSelectedLearnerForView(null)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded font-medium hover:bg-slate-200"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleApprove(selectedLearnerForView.id, selectedLearnerForView.fullName);
                    setSelectedLearnerForView(null);
                  }}
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded font-semibold hover:bg-emerald-700 shadow-xs"
                >
                  Approve Registration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
