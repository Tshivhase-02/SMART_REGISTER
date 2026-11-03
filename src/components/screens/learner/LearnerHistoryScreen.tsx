import React, { useState, useMemo } from 'react';
import { useAttendance } from '../../../context/AttendanceContext';
import { History, Calendar, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export const LearnerHistoryScreen: React.FC = () => {
  const { currentUser, attendanceRecords } = useAttendance();

  const [timeFilter, setTimeFilter] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  const filteredRecords = useMemo(() => {
    let list = attendanceRecords.filter((r) => r.learnerId === currentUser?.id);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (timeFilter === 'daily') {
      list = list.filter((r) => r.date === todayStr);
    } else if (timeFilter === 'weekly') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];
      list = list.filter((r) => r.date >= weekAgoStr);
    } else if (timeFilter === 'monthly') {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      const monthAgoStr = monthAgo.toISOString().split('T')[0];
      list = list.filter((r) => r.date >= monthAgoStr);
    }

    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [attendanceRecords, currentUser, timeFilter]);

  return (
    <div className="space-y-5">
      {/* 1. Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>DVT Learnership Programme</span>
            <span>·</span>
            <span>Personal Attendance Ledger</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Attendance History
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Learner: <strong>{currentUser?.fullName}</strong> ({currentUser?.learnerNumber})
          </p>
        </div>

        {/* Filters: Daily, Weekly, Monthly */}
        <div className="flex items-center bg-slate-100 p-1 rounded border border-[#E5E7EB] text-xs">
          {(['daily', 'weekly', 'monthly'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-3 py-1 rounded capitalize font-medium transition-colors cursor-pointer ${
                timeFilter === filter
                  ? 'bg-[#F4B52C] text-[#2F3E96] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#2F3E96] text-white uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Clock-In</th>
                <th className="py-3 px-4">Clock-Out</th>
                <th className="py-3 px-4">GPS Verification</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Daily Access ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] text-slate-800">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No attendance records logged for the selected period.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[#F4B52C]/10 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                      {rec.date}
                    </td>

                    <td className="py-3 px-4 font-mono whitespace-nowrap">
                      {rec.clockInTime ? (
                        <span className="font-semibold">{rec.clockInTime}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono whitespace-nowrap">
                      {rec.clockOutTime ? (
                        <span className="font-semibold text-slate-700">{rec.clockOutTime}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] whitespace-nowrap">
                      {rec.verifiedDistanceMeters !== undefined ? (
                        <span className="inline-flex items-center gap-1 text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {rec.verifiedDistanceMeters}m (Office)
                        </span>
                      ) : rec.dayType === 'wfh' ? (
                        <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          WFH Exempt
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 font-semibold text-[11px] uppercase px-2 py-0.5 rounded ${
                          rec.status === 'Present'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : rec.status === 'Late'
                            ? 'bg-[#F4B52C]/20 text-slate-900 border border-[#F4B52C]/50 font-bold'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {rec.status === 'Present' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        {rec.status === 'Late' && <Clock className="w-3.5 h-3.5 text-[#2F3E96]" />}
                        {rec.status === 'Absent' && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                        <span>{rec.status}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                      {rec.accessId}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-500 flex justify-between">
          <span>Showing {filteredRecords.length} records</span>
          <span>Only official statuses (Present, Late, Absent) logged in register</span>
        </div>
      </div>
    </div>
  );
};
