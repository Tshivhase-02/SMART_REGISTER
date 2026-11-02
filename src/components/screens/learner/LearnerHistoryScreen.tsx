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
        <div className="flex items-center bg-slate-100 p-1 rounded border border-slate-200 text-xs">
          {(['daily', 'weekly', 'monthly'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-3 py-1 rounded capitalize font-medium transition-colors ${
                timeFilter === filter
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Clock-In</th>
                <th className="py-3 px-4">Clock-Out</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Daily Access ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No attendance records logged for the selected period.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
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

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 font-semibold text-[11px] uppercase ${
                          rec.status === 'Present'
                            ? 'text-emerald-700'
                            : rec.status === 'Late'
                            ? 'text-amber-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {rec.status === 'Present' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {rec.status === 'Late' && <Clock className="w-3.5 h-3.5" />}
                        {rec.status === 'Absent' && <AlertTriangle className="w-3.5 h-3.5" />}
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
