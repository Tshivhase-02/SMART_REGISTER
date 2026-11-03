import React, { useState } from 'react';
import { useAttendance } from '../../../context/AttendanceContext';
import { CalendarX, Check, X, CheckCircle2, XCircle, Clock } from 'lucide-react';

export const AdminAbsenceRequestsScreen: React.FC = () => {
  const { absenceRequests, reviewAbsenceRequest } = useAttendance();

  const [filterStatus, setFilterStatus] = useState<'all' | 'Pending' | 'Approved' | 'Rejected'>('all');

  const filteredRequests = absenceRequests.filter((r) =>
    filterStatus === 'all' ? true : r.status === filterStatus
  );

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>DVT Learnership Management</span>
            <span>·</span>
            <span>Absence Approvals</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Absence Requests
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Review learner absence submissions, verify justifications, and approve or reject filings.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center bg-slate-100 p-1 rounded border border-[#E5E7EB] text-xs">
          {(['all', 'Pending', 'Approved', 'Rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1 rounded capitalize font-medium transition-colors cursor-pointer ${
                filterStatus === status
                  ? 'bg-[#F4B52C] text-[#2F3E96] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Requests Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#2F3E96] text-white uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Learner Number</th>
                <th className="py-3 px-4">Learner Name</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Comments</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] text-slate-800">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No absence requests matching current filter.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-[#F4B52C]/10 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                      {req.date}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                      {req.learnerNumber}
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {req.learnerName}
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                      {req.reason}
                    </td>

                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {req.comments}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase px-2 py-0.5 rounded ${
                          req.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'Rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-[#F4B52C]/20 text-[#2F3E96] border border-[#F4B52C]/50'
                        }`}
                      >
                        {req.status === 'Approved' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {req.status === 'Rejected' && <XCircle className="w-3.5 h-3.5" />}
                        {req.status === 'Pending' && <Clock className="w-3.5 h-3.5 text-[#2F3E96]" />}
                        <span>{req.status}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {req.status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => reviewAbsenceRequest(req.id, 'Approved')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold flex items-center gap-1 shadow-xs transition-colors"
                          >
                            <Check className="w-3 h-3" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => reviewAbsenceRequest(req.id, 'Rejected')}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-semibold flex items-center gap-1 shadow-xs transition-colors"
                          >
                            <X className="w-3 h-3" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          Reviewed by {req.reviewedBy?.split(' ')[0]}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
