import React, { useState, useMemo } from 'react';
import { useAttendance } from '../../../context/AttendanceContext';
import { AttendanceStatus } from '../../../types/attendance';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { evaluateWorkingDay } from '../../../utils/geoUtils';

type PeriodType = 'daily' | 'weekly' | 'monthly' | 'custom';

export const AdminRegisterDownloadsScreen: React.FC = () => {
  const { users, attendanceRecords, currentTime } = useAttendance();

  const [period, setPeriod] = useState<PeriodType>('monthly');
  const [customStart, setCustomStart] = useState('2026-11-02');
  const [customEnd, setCustomEnd] = useState('2026-11-13');
  const [selectedDatesPerPage, setSelectedDatesPerPage] = useState<4 | 5>(4);

  const learners = users.filter((u) => u.role === 'learner');

  // Compute list of working dates (excluding weekends & holidays) based on period
  const eligibleWorkingDates = useMemo(() => {
    // Generate dates covering November 2026
    const dates: string[] = [];

    let start = new Date(2026, 10, 2); // Mon 02 Nov 2026
    let end = new Date(2026, 10, 13); // Fri 13 Nov 2026

    if (period === 'daily') {
      const todayStr = currentTime.toISOString().split('T')[0];
      dates.push(todayStr);
      return dates;
    } else if (period === 'weekly') {
      start = new Date(2026, 10, 2);
      end = new Date(2026, 10, 6);
    } else if (period === 'monthly') {
      start = new Date(2026, 10, 2);
      end = new Date(2026, 10, 27);
    } else if (period === 'custom') {
      start = new Date(customStart);
      end = new Date(customEnd);
    }

    const cur = new Date(start);
    while (cur <= end) {
      const evalDay = evaluateWorkingDay(cur);
      // Strictly exclude weekends and public holidays
      if (evalDay.isWorkingDay) {
        dates.push(cur.toISOString().split('T')[0]);
      }
      cur.setDate(cur.getDate() + 1);
    }

    return dates;
  }, [period, customStart, customEnd, currentTime]);

  // Chunk dates into pages of 4 or 5 dates per page
  const datePages = useMemo(() => {
    const pages: string[][] = [];
    const chunkSize = selectedDatesPerPage;
    for (let i = 0; i < eligibleWorkingDates.length; i += chunkSize) {
      pages.push(eligibleWorkingDates.slice(i, i + chunkSize));
    }
    return pages.length > 0 ? pages : [[]];
  }, [eligibleWorkingDates, selectedDatesPerPage]);

  // Helper to get status for learner on date
  const getAttendanceStatus = (learnerId: string, dateStr: string): AttendanceStatus => {
    const record = attendanceRecords.find(
      (r) => r.learnerId === learnerId && r.date === dateStr
    );
    if (!record) {
      return 'Absent';
    }
    return record.status;
  };

  const formatDateHeader = (dateStr: string) => {
    const d = new Date(dateStr);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = String(d.getDate()).padStart(2, '0');
    return `${dayName} ${dayNum}`;
  };

  // CSV / Excel Export
  const handleExportCsv = (format: 'csv' | 'excel') => {
    const headers = ['Learner Number', 'Learner Name', ...eligibleWorkingDates.map(formatDateHeader)];
    const rows = learners.map((learner) => {
      const statusRow = eligibleWorkingDates.map((dateStr) =>
        getAttendanceStatus(learner.id, dateStr)
      );
      return [learner.learnerNumber, `"${learner.fullName}"`, ...statusRow];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const ext = format === 'excel' ? 'csv' : 'csv';
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute(
      'download',
      `DynamicDNA_DVT_Attendance_Register_${period.toUpperCase()}_${new Date().toISOString().split('T')[0]}.${ext}`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header (Hidden during print) */}
      <div className="print:hidden bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>DVT Learnership Programme</span>
            <span>·</span>
            <span>Official Register Generation</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Register Downloads & Printable Register
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Export verified registers to PDF (A4 Portrait), Excel, and CSV format.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print A4 Portrait Register</span>
          </button>
          <button
            onClick={() => handleExportCsv('excel')}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700 text-white rounded text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel (.CSV)</span>
          </button>
          <button
            onClick={() => handleExportCsv('csv')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded text-xs font-semibold hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Configuration & Period Selection Bar (Hidden during print) */}
      <div className="print:hidden bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="font-bold text-slate-700 uppercase tracking-wide text-[10px]">
            Period:
          </span>
          <div className="flex items-center bg-slate-100 p-1 rounded border border-slate-200">
            {(['daily', 'weekly', 'monthly', 'custom'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded capitalize font-medium transition-colors ${
                  period === p
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {period === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2 py-1 border border-slate-300 rounded text-xs bg-white"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2 py-1 border border-slate-300 rounded text-xs bg-white"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-slate-600 text-[11px]">Dates Per Page:</span>
          <select
            value={selectedDatesPerPage}
            onChange={(e) => setSelectedDatesPerPage(Number(e.target.value) as 4 | 5)}
            className="bg-white border border-slate-300 rounded px-2 py-1 text-xs"
          >
            <option value={4}>4 Dates per page</option>
            <option value={5}>5 Dates per page</option>
          </select>
        </div>
      </div>

      {/* 3. A4 PORTRAIT PRINTABLE REGISTER CONTAINER */}
      <div className="space-y-8">
        {datePages.map((pageDates, pageIdx) => (
          <div
            key={pageIdx}
            className="a4-portrait-page bg-white border border-slate-300 rounded-lg p-8 shadow-sm print:shadow-none print:border-none print:p-0 print:m-0"
            style={{
              minHeight: '297mm',
              width: '100%',
              maxWidth: '210mm',
              margin: '0 auto',
              pageBreakAfter: 'always',
            }}
          >
            {/* Register Header */}
            <div className="border-b-2 border-slate-900 pb-3 mb-4 flex justify-between items-start">
              <div>
                <p className="font-bold text-base text-slate-900 tracking-tight">
                  DynamicDNA | DVT Learnership Programme
                </p>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase mt-0.5">
                  ATTENDANCE REGISTER
                </h1>
                <p className="text-xs text-slate-600 mt-0.5">
                  Period: <span className="font-semibold text-slate-900 uppercase">{period} register</span> ({eligibleWorkingDates[0]} to {eligibleWorkingDates[eligibleWorkingDates.length - 1]})
                </p>
              </div>

              <div className="text-right text-xs">
                <span className="font-mono font-bold text-slate-900 block">
                  PAGE {pageIdx + 1} OF {datePages.length}
                </span>
                <span className="text-[10px] text-slate-500 uppercase block">
                  A4 Portrait Layout
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Workplace Centroid: -26.097841, 27.998357
                </span>
              </div>
            </div>

            {/* Matrix Table with Learner Names repeated on every page */}
            <div className="border border-slate-900 overflow-hidden mb-6">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b-2 border-slate-900 font-bold text-slate-900">
                    <th className="py-2.5 px-3 border-r border-slate-400 w-1/3">
                      Learner Name
                    </th>
                    {pageDates.map((dateStr) => (
                      <th
                        key={dateStr}
                        className="py-2.5 px-3 border-r border-slate-400 text-center font-mono text-xs"
                      >
                        {formatDateHeader(dateStr)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 text-slate-900">
                  {learners.map((learner) => (
                    <tr key={learner.id} className="border-b border-slate-300">
                      <td className="py-2 px-3 border-r border-slate-400 font-medium">
                        <div>
                          <span className="font-bold">{learner.fullName}</span>
                          <span className="block text-[10px] text-slate-500 font-mono">
                            {learner.learnerNumber}
                          </span>
                        </div>
                      </td>

                      {pageDates.map((dateStr) => {
                        const status = getAttendanceStatus(learner.id, dateStr);
                        return (
                          <td
                            key={dateStr}
                            className="py-2 px-3 border-r border-slate-400 text-center font-semibold text-xs whitespace-nowrap"
                          >
                            <span
                              className={
                                status === 'Present'
                                  ? 'text-emerald-700'
                                  : status === 'Late'
                                  ? 'text-amber-700'
                                  : 'text-rose-700'
                              }
                            >
                              {status}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Status Definitions Block */}
            <div className="border border-slate-300 bg-slate-50 p-3 rounded mb-6 text-[11px] text-slate-700 space-y-1">
              <p className="font-bold text-slate-900 text-xs">Status Definitions:</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <strong className="text-emerald-700">Present:</strong> Clocked-In Between 07:15 And 09:00
                </div>
                <div>
                  <strong className="text-amber-700">Late:</strong> Clocked-In After 09:00
                </div>
                <div>
                  <strong className="text-rose-700">Absent:</strong> No Attendance Recorded
                </div>
              </div>
              <p className="text-[10px] text-slate-500 pt-1">
                * Note: Weekends and public holidays are excluded from statutory register contact days.
              </p>
            </div>

            {/* Signature Block */}
            <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-400 text-xs text-slate-800">
              <div>
                <div className="border-b border-slate-900 h-8 mb-1" />
                <span className="font-bold block">DVT Programme Supervisor Signature</span>
                <span className="text-[11px] text-slate-500">Thabo Mokoena</span>
              </div>

              <div>
                <div className="border-b border-slate-900 h-8 mb-1" />
                <span className="font-bold block">SETA Workplace Facilitator Signature</span>
                <span className="text-[11px] text-slate-500">SETA Quality Assurer</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
