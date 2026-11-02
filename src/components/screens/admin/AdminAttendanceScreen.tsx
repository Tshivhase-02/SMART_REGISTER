import React, { useState, useMemo } from 'react';
import { useAttendance } from '../../../context/AttendanceContext';
import {
  CheckSquare,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
} from 'lucide-react';

export const AdminAttendanceScreen: React.FC = () => {
  const { attendanceRecords, currentTime } = useAttendance();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Present' | 'Late' | 'Absent'>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');

  const filteredRecords = useMemo(() => {
    let list = attendanceRecords;

    if (selectedDate) {
      list = list.filter((r) => r.date === selectedDate);
    }

    if (statusFilter !== 'all') {
      list = list.filter((r) => r.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.learnerName.toLowerCase().includes(q) ||
          r.learnerNumber.toLowerCase().includes(q) ||
          r.accessId.toLowerCase().includes(q) ||
          r.date.includes(q)
      );
    }

    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [attendanceRecords, selectedDate, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>DVT Learnership Management</span>
            <span>·</span>
            <span>Master Attendance Ledger</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Attendance Register Overview
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Real-time verified register entries with status classification (Present, Late, Absent).
          </p>
        </div>
      </div>

      {/* 2. Filters & Search */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search learner name, number, date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#0F4C81] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Date Picker */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-2.5 py-1 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#0F4C81] text-slate-700 bg-white"
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="text-xs text-rose-600 hover:underline font-medium"
            >
              Clear Date
            </button>
          )}

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-700 focus:ring-1 focus:ring-[#0F4C81]"
          >
            <option value="all">All Statuses</option>
            <option value="Present">Present (On-Time)</option>
            <option value="Late">Late Arrivals</option>
            <option value="Absent">Absent</option>
          </select>
        </div>
      </div>

      {/* 3. Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Learner Number</th>
                <th className="py-3 px-4">Learner Name</th>
                <th className="py-3 px-4">Clock-In</th>
                <th className="py-3 px-4">Clock-Out</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Access ID</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No attendance records found matching current query.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                      {rec.date}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                      {rec.learnerNumber}
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {rec.learnerName}
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

                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {rec.notes || 'Routine attendance'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-500 flex justify-between items-center">
          <span>Showing {filteredRecords.length} records</span>
          <span>DVT Learnership Statutory Audit Record</span>
        </div>
      </div>
    </div>
  );
};
