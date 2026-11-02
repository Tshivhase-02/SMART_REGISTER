import React, { useState } from 'react';
import { useAttendance } from '../../../context/AttendanceContext';
import { AbsenceReason } from '../../../types/attendance';
import { CalendarX, CheckCircle2, Clock, AlertTriangle, Send } from 'lucide-react';

const REASON_OPTIONS: AbsenceReason[] = [
  'Sick',
  'Family Emergency',
  'Medical Appointment',
  'Transport Issues',
  'Study Leave',
  'Other',
];

export const LearnerReportAbsenceScreen: React.FC = () => {
  const { currentUser, absenceRequests, submitAbsenceRequest, currentTime } = useAttendance();

  const [date, setDate] = useState(currentTime.toISOString().split('T')[0]);
  const [reason, setReason] = useState<AbsenceReason>('Sick');
  const [comments, setComments] = useState('');
  const [successNotice, setSuccessNotice] = useState(false);

  const learnerRequests = absenceRequests.filter((r) => r.learnerId === currentUser?.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comments.trim()) return;

    submitAbsenceRequest(date, reason, comments);
    setSuccessNotice(true);
    setComments('');
    setTimeout(() => setSuccessNotice(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>DVT Learnership Programme</span>
            <span>·</span>
            <span>Absence Management</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Report Absence
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Submit formal notification of unavoidable absence for supervisor review.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Form: 5 cols */}
        <div className="md:col-span-5 bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <CalendarX className="w-4 h-4 text-rose-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Absence Application
            </h3>
          </div>

          {successNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Absence request submitted successfully. Status: Pending.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wide text-[10px] mb-1">
                Absence Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#0F4C81] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wide text-[10px] mb-1">
                Reason <span className="text-rose-500">*</span>
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as AbsenceReason)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#0F4C81] focus:outline-none bg-white"
              >
                {REASON_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wide text-[10px] mb-1">
                Comments & Justification <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="Provide details regarding the reason for absence..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#0F4C81] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#0F4C81] hover:bg-[#0A355C] text-white font-semibold rounded transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Absence Request</span>
            </button>
          </form>
        </div>

        {/* Existing Absence Requests: 7 cols */}
        <div className="md:col-span-7 bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              My Submitted Absence Requests
            </h3>
            <span className="text-[11px] text-slate-500">{learnerRequests.length} on file</span>
          </div>

          <div className="space-y-2.5 text-xs">
            {learnerRequests.length === 0 ? (
              <p className="text-center text-slate-400 py-8">
                No absence requests submitted.
              </p>
            ) : (
              learnerRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-3 border border-slate-200 rounded bg-slate-50 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{req.date}</span>
                      <span className="font-semibold text-slate-700">· {req.reason}</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
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

                  <p className="text-[11px] text-slate-600 italic">
                    "{req.comments}"
                  </p>

                  <div className="text-[10px] text-slate-400 flex justify-between pt-1 border-t border-slate-200">
                    <span>Submitted: {req.submittedAt}</span>
                    {req.reviewedBy && <span>Reviewer: {req.reviewedBy}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
