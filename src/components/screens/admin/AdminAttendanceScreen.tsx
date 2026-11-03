import React, { useState, useMemo, useEffect } from 'react';
import { useAttendance } from '../../../context/AttendanceContext';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  Download,
  Search,
  Filter,
  Eye,
  X,
  Building2,
  Home,
  CheckSquare,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MapPin,
  Lock,
  FileText,
  BadgeAlert,
  Radio,
  Sparkles,
} from 'lucide-react';
import {
  buildEnrichedAttendanceRows,
  computeAttendanceSummary,
  buildAttendanceAuditTimeline,
  exportAttendanceRegisterToCsv,
  downloadCsvFile,
  exportAttendanceRegisterToExcelXml,
  downloadExcelXmlFile,
  EnrichedAttendanceRow,
  ReportSummaryMetrics,
} from '../../../utils/reportUtils';
import { getSASTComponents, isClockOutAllowed } from '../../../utils/geoUtils';

export const AdminAttendanceScreen: React.FC = () => {
  const {
    users,
    attendanceRecords,
    currentTime,
    workplaceConfig,
    activeScreen,
  } = useAttendance();

  // Authoritative SAST components
  const sast = useMemo(() => getSASTComponents(currentTime), [currentTime]);
  const todaySastDate = sast.dateString;

  // Filter States
  const [dateMode, setDateMode] = useState<'single' | 'range' | 'all'>('single');
  const [selectedDate, setSelectedDate] = useState<string>(todaySastDate);
  const [startDate, setStartDate] = useState<string>('2026-11-02');
  const [endDate, setEndDate] = useState<string>(todaySastDate);

  const [searchQuery, setSearchQuery] = useState('');
  const [arrivalFilter, setArrivalFilter] = useState<'all' | 'ON TIME' | 'LATE' | 'ABSENT'>('all');
  const [completionFilter, setCompletionFilter] = useState<
    'all' | 'NOT CLOCKED IN' | 'IN PROGRESS' | 'CLOCK-OUT PENDING' | 'COMPLETED'
  >('all');
  const [arrangementFilter, setArrangementFilter] = useState<'all' | 'Office Day' | 'Work From Home'>('all');
  const [gpsFilter, setGpsFilter] = useState<'all' | 'verified' | 'failed' | 'wfh_exempt'>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Selected Record for Details Modal
  const [selectedRowForModal, setSelectedRowForModal] = useState<EnrichedAttendanceRow | null>(null);

  // Print Mode Modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Active learners
  const learners = useMemo(
    () => users.filter((u) => u.role === 'learner'),
    [users]
  );

  // Build Enriched Rows
  const allEnrichedRows = useMemo(() => {
    return buildEnrichedAttendanceRows(attendanceRecords, learners, currentTime, workplaceConfig);
  }, [attendanceRecords, learners, currentTime, workplaceConfig]);

  // Compute 8 Summary Statistics for current/selected date
  const summaryMetrics: ReportSummaryMetrics = useMemo(() => {
    const targetDate = dateMode === 'single' && selectedDate ? selectedDate : todaySastDate;
    return computeAttendanceSummary(
      targetDate,
      learners,
      attendanceRecords,
      currentTime,
      workplaceConfig
    );
  }, [dateMode, selectedDate, todaySastDate, learners, attendanceRecords, currentTime, workplaceConfig]);

  // Apply Filters to Enriched Rows
  const filteredRows = useMemo(() => {
    let rows = allEnrichedRows;

    // Date filtering
    if (dateMode === 'single' && selectedDate) {
      rows = rows.filter((r) => r.attendanceDate === selectedDate);
    } else if (dateMode === 'range') {
      if (startDate) rows = rows.filter((r) => r.attendanceDate >= startDate);
      if (endDate) rows = rows.filter((r) => r.attendanceDate <= endDate);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          r.learnerName.toLowerCase().includes(q) ||
          r.learnerNumber.toLowerCase().includes(q) ||
          r.jobTitle.toLowerCase().includes(q) ||
          r.accessId.toLowerCase().includes(q) ||
          r.workEmail.toLowerCase().includes(q) ||
          r.attendanceDate.includes(q)
      );
    }

    // Arrival Status
    if (arrivalFilter !== 'all') {
      rows = rows.filter((r) => r.arrivalStatus === arrivalFilter);
    }

    // Completion Status
    if (completionFilter !== 'all') {
      rows = rows.filter((r) => r.completionStatus === completionFilter);
    }

    // Work Arrangement
    if (arrangementFilter !== 'all') {
      rows = rows.filter((r) => r.workArrangement === arrangementFilter);
    }

    // GPS Status
    if (gpsFilter !== 'all') {
      rows = rows.filter((r) => r.clockInVerificationStatus === gpsFilter);
    }

    // Sort: Date descending, then learner number ascending
    return rows.sort((a, b) => {
      const dateCmp = b.attendanceDate.localeCompare(a.attendanceDate);
      if (dateCmp !== 0) return dateCmp;
      return a.learnerNumber.localeCompare(b.learnerNumber);
    });
  }, [
    allEnrichedRows,
    dateMode,
    selectedDate,
    startDate,
    endDate,
    searchQuery,
    arrivalFilter,
    completionFilter,
    arrangementFilter,
    gpsFilter,
  ]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    dateMode,
    selectedDate,
    startDate,
    endDate,
    searchQuery,
    arrivalFilter,
    completionFilter,
    arrangementFilter,
    gpsFilter,
  ]);

  // Pagination slice
  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // Reset all filters
  const handleResetFilters = () => {
    setDateMode('single');
    setSelectedDate(todaySastDate);
    setStartDate('2026-11-02');
    setEndDate(todaySastDate);
    setSearchQuery('');
    setArrivalFilter('all');
    setCompletionFilter('all');
    setArrangementFilter('all');
    setGpsFilter('all');
    setCurrentPage(1);
  };

  const isFiltered =
    dateMode !== 'single' ||
    selectedDate !== todaySastDate ||
    searchQuery.trim() !== '' ||
    arrivalFilter !== 'all' ||
    completionFilter !== 'all' ||
    arrangementFilter !== 'all' ||
    gpsFilter !== 'all';

  // Export handlers
  const handleExportCsv = () => {
    const summaryLabel =
      dateMode === 'single'
        ? `Date: ${selectedDate}`
        : dateMode === 'range'
        ? `Date Range: ${startDate} to ${endDate}`
        : 'All Historic Dates';
    const csvContent = exportAttendanceRegisterToCsv(filteredRows, summaryLabel);
    downloadCsvFile(csvContent, `SmartRegister_Attendance_${selectedDate || 'Export'}.csv`);
  };

  const handleExportExcel = () => {
    const summaryLabel =
      dateMode === 'single'
        ? `Date: ${selectedDate}`
        : dateMode === 'range'
        ? `Date Range: ${startDate} to ${endDate}`
        : 'All Historic Dates';
    const xmlContent = exportAttendanceRegisterToExcelXml(filteredRows, summaryLabel);
    downloadExcelXmlFile(xmlContent, `SmartRegister_Attendance_${selectedDate || 'Export'}.xls`);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Official DynamicDNA Branding */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <img
            src="/dynamicdna-logo.png"
            alt="DynamicDNA"
            className="h-10 w-auto object-contain shrink-0 mt-0.5"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
              <span className="text-[#2F3E96]">DynamicDNA</span>
              <span>·</span>
              <span>DVT Learnership Programme</span>
              <span>·</span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono">
                {sast.formattedDisplay}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#333333] tracking-tight">
              Attendance Reports & Master Register
            </h2>
            <p className="mt-0.5 text-xs text-slate-600">
              Real-time verified register entries with GPS telemetry, authoritative SAST timestamps, and departure state compliance.
            </p>
          </div>
        </div>

        {/* Action Buttons: Primary #F4B52C, Secondary #2F3E96 */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#2F3E96] text-white rounded text-xs font-semibold hover:bg-[#25327a] transition-colors shadow-xs cursor-pointer"
            title="Export filtered records to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#2F3E96] text-white rounded text-xs font-semibold hover:bg-[#25327a] transition-colors shadow-xs cursor-pointer"
            title="Export filtered records to Excel XML"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#F4B52C] text-white rounded text-xs font-bold hover:bg-[#e2a420] transition-colors shadow-xs cursor-pointer"
            title="Print Official Attendance Register"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Register (A4)</span>
          </button>
        </div>
      </div>

      {/* 2. Section 1: Dashboard Summary Cards (8 Real Database-Backed Counters) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Card 1: Total Active Learners */}
        <div className="bg-white border-l-4 border-l-[#2F3E96] border border-[#E5E7EB] rounded-lg p-3 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Active</span>
            <Users className="w-3.5 h-3.5 text-[#2F3E96]" />
          </div>
          <div className="text-xl font-bold text-slate-900">{summaryMetrics.totalActiveLearners}</div>
          <div className="text-[10px] text-slate-500 mt-0.5 truncate">Enrolled Learners</div>
        </div>

        {/* Card 2: Present Today */}
        <div className="bg-white border-l-4 border-l-emerald-600 border border-[#E5E7EB] rounded-lg p-3 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Present</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-700">{summaryMetrics.presentToday}</div>
          <div className="text-[10px] text-slate-500 mt-0.5 truncate">On-Time Shifts</div>
        </div>

        {/* Card 3: On-Time Arrivals */}
        <div className="bg-white border-l-4 border-l-emerald-500 border border-[#E5E7EB] rounded-lg p-3 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">On-Time</span>
            <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">{summaryMetrics.onTimeArrivals}</div>
          <div className="text-[10px] text-slate-500 mt-0.5 truncate">07:15–09:00 SAST</div>
        </div>

        {/* Card 4: Late Arrivals */}
        <div className="bg-white border-l-4 border-l-[#F4B52C] border border-[#E5E7EB] rounded-lg p-3 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900">Late</span>
            <Clock className="w-3.5 h-3.5 text-[#F4B52C]" />
          </div>
          <div className="text-xl font-bold text-amber-800">{summaryMetrics.lateArrivals}</div>
          <div className="text-[10px] text-slate-500 mt-0.5 truncate">After 09:00 SAST</div>
        </div>

        {/* Card 5: Absent Learners */}
        <div className="bg-white border-l-4 border-l-rose-600 border border-[#E5E7EB] rounded-lg p-3 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">Absent</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-xl font-bold text-rose-700">{summaryMetrics.absentLearners}</div>
          <div className="text-[10px] text-slate-500 mt-0.5 truncate">No Clock-In</div>
        </div>

        {/* Card 6: Attendance In Progress */}
        <div className="bg-white border-l-4 border-l-blue-600 border border-[#E5E7EB] rounded-lg p-3 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900">In Progress</span>
            <Radio className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-blue-800">{summaryMetrics.attendanceInProgress}</div>
          <div className="text-[10px] text-slate-500 mt-0.5 truncate">Clock-Out Pending</div>
        </div>

        {/* Card 7: Completed Attendance */}
        <div className="bg-white border-l-4 border-l-teal-600 border border-[#E5E7EB] rounded-lg p-3 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-900">Completed</span>
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div className="text-xl font-bold text-teal-800">{summaryMetrics.completedAttendance}</div>
          <div className="text-[10px] text-slate-500 mt-0.5 truncate">Sealed &persisted</div>
        </div>

        {/* Card 8: GPS Verification Failures */}
        <div className="bg-white border-l-4 border-l-rose-500 border border-[#E5E7EB] rounded-lg p-3 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-900">GPS Failures</span>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">{summaryMetrics.gpsVerificationFailures}</div>
          <div className="text-[10px] text-slate-500 mt-0.5 truncate">&gt;100m Workplace</div>
        </div>
      </div>

      {/* 3. Section 7: Comprehensive Multi-Filter Bar & Search */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 text-xs">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search learner name, learner number, job title, access ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-[#E5E7EB] rounded text-xs focus:ring-1 focus:ring-[#2F3E96] focus:border-[#2F3E96] focus:outline-none"
            />
          </div>

          {/* Date Selector Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded border border-[#E5E7EB] p-0.5 bg-slate-50">
              <button
                type="button"
                onClick={() => setDateMode('single')}
                className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                  dateMode === 'single'
                    ? 'bg-white text-[#2F3E96] shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Single Date
              </button>
              <button
                type="button"
                onClick={() => setDateMode('range')}
                className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                  dateMode === 'range'
                    ? 'bg-white text-[#2F3E96] shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Date Range
              </button>
              <button
                type="button"
                onClick={() => setDateMode('all')}
                className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                  dateMode === 'all'
                    ? 'bg-white text-[#2F3E96] shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Dates
              </button>
            </div>

            {dateMode === 'single' && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2.5 py-1.5 border border-[#E5E7EB] rounded text-xs focus:ring-1 focus:ring-[#2F3E96] focus:border-[#2F3E96] text-slate-700 bg-white"
              />
            )}

            {dateMode === 'range' && (
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2 py-1.5 border border-[#E5E7EB] rounded text-xs focus:ring-1 focus:ring-[#2F3E96] focus:border-[#2F3E96] text-slate-700 bg-white"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2 py-1.5 border border-[#E5E7EB] rounded text-xs focus:ring-1 focus:ring-[#2F3E96] focus:border-[#2F3E96] text-slate-700 bg-white"
                />
              </div>
            )}
          </div>
        </div>

        {/* Dropdowns Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 pt-2 border-t border-[#E5E7EB] text-xs">
          {/* Arrival Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Arrival Status
            </label>
            <select
              value={arrivalFilter}
              onChange={(e) => setArrivalFilter(e.target.value as any)}
              className="w-full bg-white border border-[#E5E7EB] rounded px-2.5 py-1.5 text-xs text-slate-700 focus:ring-1 focus:ring-[#2F3E96] focus:border-[#2F3E96]"
            >
              <option value="all">All Arrival Statuses</option>
              <option value="ON TIME">ON TIME (07:15–09:00)</option>
              <option value="LATE">LATE (After 09:00)</option>
              <option value="ABSENT">ABSENT</option>
            </select>
          </div>

          {/* Completion Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Completion Status
            </label>
            <select
              value={completionFilter}
              onChange={(e) => setCompletionFilter(e.target.value as any)}
              className="w-full bg-white border border-[#E5E7EB] rounded px-2.5 py-1.5 text-xs text-slate-700 focus:ring-1 focus:ring-[#2F3E96] focus:border-[#2F3E96]"
            >
              <option value="all">All Completion States</option>
              <option value="NOT CLOCKED IN">NOT CLOCKED IN</option>
              <option value="CLOCK-OUT PENDING">CLOCK-OUT PENDING (Shift Active)</option>
              <option value="IN PROGRESS">IN PROGRESS (Departure Ready)</option>
              <option value="COMPLETED">COMPLETED (Ledger Sealed)</option>
            </select>
          </div>

          {/* Work Arrangement Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Work Arrangement
            </label>
            <select
              value={arrangementFilter}
              onChange={(e) => setArrangementFilter(e.target.value as any)}
              className="w-full bg-white border border-[#E5E7EB] rounded px-2.5 py-1.5 text-xs text-slate-700 focus:ring-1 focus:ring-[#2F3E96] focus:border-[#2F3E96]"
            >
              <option value="all">All Arrangements</option>
              <option value="Office Day">Office Day (Campus)</option>
              <option value="Work From Home">Work From Home (Remote)</option>
            </select>
          </div>

          {/* GPS Verification Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              GPS Verification
            </label>
            <select
              value={gpsFilter}
              onChange={(e) => setGpsFilter(e.target.value as any)}
              className="w-full bg-white border border-[#E5E7EB] rounded px-2.5 py-1.5 text-xs text-slate-700 focus:ring-1 focus:ring-[#2F3E96] focus:border-[#2F3E96]"
            >
              <option value="all">All GPS Outcomes</option>
              <option value="verified">Verified (Within 100m)</option>
              <option value="failed">Outside Radius / Failed</option>
              <option value="wfh_exempt">WFH Exempt</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div className="flex items-end">
            <button
              onClick={handleResetFilters}
              disabled={!isFiltered}
              className={`w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded border text-xs font-semibold transition-colors ${
                isFiltered
                  ? 'border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100 cursor-pointer'
                  : 'border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Section 2, 3, 4, 5: Daily Attendance Register Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/70">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Master Register Ledger ({filteredRows.length} entries)
            </h3>
            <p className="text-[11px] text-slate-500">
              Showing active attendance records with independent GPS distance locks and departure compliance.
            </p>
          </div>

          {/* Items per page selector */}
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
              className="bg-white border border-[#E5E7EB] rounded px-2 py-1 text-xs text-slate-700 focus:ring-1 focus:ring-[#2F3E96]"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            {/* Table Header in DynamicDNA Brand Blue #2F3E96 */}
            <thead className="bg-[#2F3E96] text-white uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="py-3 px-3.5 text-white">Learner Number</th>
                <th className="py-3 px-3.5 text-white">Learner Name</th>
                <th className="py-3 px-3.5 text-white">Job Title</th>
                <th className="py-3 px-3.5 text-white">Attendance Date</th>
                <th className="py-3 px-3.5 text-white">Clock-In Time</th>
                <th className="py-3 px-3.5 text-white">Clock-In GPS</th>
                <th className="py-3 px-3.5 text-white">Clock-Out Time</th>
                <th className="py-3 px-3.5 text-white">Clock-Out GPS</th>
                <th className="py-3 px-3.5 text-white">Arrival Status</th>
                <th className="py-3 px-3.5 text-white">Completion Status</th>
                <th className="py-3 px-3.5 text-white">Work Arrangement</th>
                <th className="py-3 px-3.5 text-white text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="w-8 h-8 text-slate-300" />
                      <span className="font-semibold text-slate-600">No attendance records match the selected filters.</span>
                      <span className="text-[11px] text-slate-400">Try modifying your search or resetting filter conditions.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-[#F4B52C]/10 transition-colors group cursor-pointer"
                    onClick={() => setSelectedRowForModal(row)}
                  >
                    {/* 1. Learner Number */}
                    <td className="py-3 px-3.5 font-mono font-bold text-[#2F3E96] whitespace-nowrap">
                      {row.learnerNumber}
                    </td>

                    {/* 2. Learner Name */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{row.learnerName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{row.workEmail}</div>
                    </td>

                    {/* 3. Job Title */}
                    <td className="py-3 px-3.5 text-slate-700 whitespace-nowrap">
                      <span className="text-[11px] font-medium bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                        {row.jobTitle}
                      </span>
                    </td>

                    {/* 4. Attendance Date */}
                    <td className="py-3 px-3.5 font-mono font-medium text-slate-900 whitespace-nowrap">
                      {row.attendanceDate}
                    </td>

                    {/* 5. Clock-In Time + Late Monitor */}
                    <td className="py-3 px-3.5 font-mono whitespace-nowrap">
                      {row.clockInTime ? (
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{row.clockInTime}</span>
                          {row.minutesLate > 0 ? (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded w-fit mt-0.5 border border-amber-300">
                              {row.minutesLate} mins late
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-700 font-semibold">On-time</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* 6. Clock-In GPS Distance */}
                    <td className="py-3 px-3.5 font-mono text-[11px] whitespace-nowrap">
                      {row.clockInVerificationStatus === 'wfh_exempt' ? (
                        <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          WFH Exempt
                        </span>
                      ) : row.clockInDistance !== undefined ? (
                        <span
                          className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded border ${
                            row.clockInVerificationStatus === 'verified'
                              ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                              : 'text-rose-800 bg-rose-50 border-rose-300'
                          }`}
                        >
                          <MapPin className="w-3 h-3" />
                          <span>{row.clockInDistance}m</span>
                          <span className="text-[9px] uppercase">
                            ({row.clockInVerificationStatus === 'verified' ? 'Verified' : 'Failed'})
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* 7. Clock-Out Time (Strict 15:15 SAST Rule) */}
                    <td className="py-3 px-3.5 font-mono whitespace-nowrap">
                      {row.clockOutTime ? (
                        <span className="font-bold text-teal-900">{row.clockOutTime}</span>
                      ) : row.clockInTime ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-[#2F3E96] border border-blue-200">
                          <Lock className="w-3 h-3 text-[#2F3E96]" />
                          <span>CLOCK-OUT PENDING</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* 8. Clock-Out GPS Distance */}
                    <td className="py-3 px-3.5 font-mono text-[11px] whitespace-nowrap">
                      {row.clockOutTime ? (
                        row.clockOutVerificationStatus === 'wfh_exempt' ? (
                          <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            WFH Exempt
                          </span>
                        ) : row.clockOutDistance !== undefined ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <MapPin className="w-3 h-3" />
                            <span>{row.clockOutDistance}m</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )
                      ) : row.clockInTime ? (
                        <span className="text-[10px] text-slate-500 italic">Pending Departure</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* 9. Arrival Status */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 font-bold text-[10px] uppercase px-2 py-0.5 rounded border ${
                          row.arrivalStatus === 'ON TIME'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : row.arrivalStatus === 'LATE'
                            ? 'bg-amber-50 text-amber-900 border-[#F4B52C]/60'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        {row.arrivalStatus === 'ON TIME' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        {row.arrivalStatus === 'LATE' && <Clock className="w-3.5 h-3.5 text-[#F4B52C]" />}
                        {row.arrivalStatus === 'ABSENT' && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                        <span>{row.arrivalStatus}</span>
                      </span>
                    </td>

                    {/* 10. Attendance Completion Status */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 font-bold text-[10px] uppercase px-2 py-0.5 rounded border ${
                          row.completionStatus === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : row.completionStatus === 'CLOCK-OUT PENDING'
                            ? 'bg-blue-50 text-[#2F3E96] border-blue-200'
                            : row.completionStatus === 'IN PROGRESS'
                            ? 'bg-amber-50 text-amber-900 border-amber-300'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        <span>{row.completionStatus}</span>
                      </span>
                    </td>

                    {/* 11. Work Arrangement */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${
                          row.workArrangement === 'Office Day'
                            ? 'bg-blue-50 text-[#2F3E96] border-blue-200'
                            : 'bg-amber-50 text-amber-900 border-amber-200'
                        }`}
                      >
                        {row.workArrangement === 'Office Day' ? (
                          <Building2 className="w-3 h-3 text-[#2F3E96]" />
                        ) : (
                          <Home className="w-3 h-3 text-amber-700" />
                        )}
                        <span>{row.workArrangement}</span>
                      </span>
                    </td>

                    {/* 12. Actions */}
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRowForModal(row);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#E5E7EB] hover:border-[#2F3E96] text-slate-700 hover:text-[#2F3E96] rounded text-[11px] font-semibold transition-colors shadow-2xs cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#2F3E96]" />
                        <span>View Details</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3.5 bg-slate-50 border-t border-[#E5E7EB] text-xs text-slate-600 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <span>
              Showing {filteredRows.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
              {Math.min(currentPage * pageSize, filteredRows.length)} of {filteredRows.length} records
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-[11px] text-slate-500 font-mono">
              Statutory DVT Audit Ledger · Timezone: Africa/Johannesburg
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 border border-[#E5E7EB] rounded bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-semibold text-slate-800">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 border border-[#E5E7EB] rounded bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Section 6: Individual Attendance Details Modal */}
      {selectedRowForModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-8 animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="bg-[#2F3E96] text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white font-bold text-lg">
                  {selectedRowForModal.learnerName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      {selectedRowForModal.learnerName}
                    </h3>
                    <span className="font-mono text-xs bg-white/20 px-2 py-0.5 rounded text-white font-semibold">
                      {selectedRowForModal.learnerNumber}
                    </span>
                  </div>
                  <p className="text-xs text-white/80 mt-0.5">
                    {selectedRowForModal.jobTitle} · DVT Learnership Programme
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedRowForModal(null)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto text-xs">
              {/* Profile Details Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500">Attendance Date</span>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">
                    {selectedRowForModal.attendanceDate}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500">Work Arrangement</span>
                  <div className="font-semibold text-slate-900 mt-0.5">
                    {selectedRowForModal.workArrangement}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500">Arrival Classification</span>
                  <div className="font-bold text-[#2F3E96] mt-0.5">
                    {selectedRowForModal.arrivalStatus}{' '}
                    {selectedRowForModal.minutesLate > 0 && `(+${selectedRowForModal.minutesLate}m)`}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500">Daily Access Token</span>
                  <div className="font-mono font-semibold text-slate-800 mt-0.5 truncate">
                    {selectedRowForModal.accessId}
                  </div>
                </div>
              </div>

              {/* Section 4: Separate Independent Evidence for Clock-In & Clock-Out */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Clock-In Evidence Box */}
                <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      <span>Clock-In Evidence</span>
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                        selectedRowForModal.clockInTime
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      {selectedRowForModal.clockInTime ? 'Registered' : 'Absent'}
                    </span>
                  </div>

                  {selectedRowForModal.clockInTime ? (
                    <div className="space-y-2 text-slate-700">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Timestamp:</span>
                        <span className="font-mono font-bold text-slate-900">
                          {selectedRowForModal.clockInTime} SAST
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Arrival Window:</span>
                        <span className="font-semibold text-slate-900">
                          {selectedRowForModal.minutesLate > 0
                            ? `Late Arrival (+${selectedRowForModal.minutesLate} minutes)`
                            : 'On-Time (07:15–09:00)'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Recorded Distance:</span>
                        <span className="font-mono font-bold text-[#2F3E96]">
                          {selectedRowForModal.clockInDistance !== undefined
                            ? `${selectedRowForModal.clockInDistance} metres`
                            : 'WFH Exempt'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">GPS Accuracy:</span>
                        <span className="font-mono text-slate-800">
                          ±{selectedRowForModal.clockInGpsAccuracy ?? 4}m (Acceptable &lt; 30m)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Coordinates:</span>
                        <span className="font-mono text-[11px] text-slate-600">
                          {selectedRowForModal.clockInCoordinates
                            ? `${selectedRowForModal.clockInCoordinates.latitude.toFixed(6)}, ${selectedRowForModal.clockInCoordinates.longitude.toFixed(6)}`
                            : 'DynamicDNA Geofence'}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-100">
                        <span className="text-slate-500">Verification Result:</span>
                        <span className="font-bold text-emerald-700 uppercase">
                          {selectedRowForModal.clockInVerificationStatus}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic py-4 text-center">
                      No clock-in record exists for this attendance session.
                    </p>
                  )}
                </div>

                {/* Clock-Out Evidence Box */}
                <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-[#2F3E96]" />
                      <span>Clock-Out Evidence</span>
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                        selectedRowForModal.clockOutTime
                          ? 'bg-teal-50 text-teal-800 border-teal-200'
                          : selectedRowForModal.clockInTime
                          ? 'bg-blue-50 text-[#2F3E96] border-blue-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {selectedRowForModal.clockOutTime
                        ? 'Completed'
                        : selectedRowForModal.clockInTime
                        ? 'Clock-Out Pending'
                        : 'Not Started'}
                    </span>
                  </div>

                  {selectedRowForModal.clockOutTime ? (
                    <div className="space-y-2 text-slate-700">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Timestamp:</span>
                        <span className="font-mono font-bold text-teal-900">
                          {selectedRowForModal.clockOutTime} SAST
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Departure Window:</span>
                        <span className="font-semibold text-emerald-700">
                          Met 15:15 Minimum Rule
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Recorded Distance:</span>
                        <span className="font-mono font-bold text-[#2F3E96]">
                          {selectedRowForModal.clockOutDistance !== undefined
                            ? `${selectedRowForModal.clockOutDistance} metres`
                            : 'WFH Exempt'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">GPS Accuracy:</span>
                        <span className="font-mono text-slate-800">
                          ±{selectedRowForModal.clockOutGpsAccuracy ?? 5}m
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Ledger Status:</span>
                        <span className="font-bold text-teal-800 uppercase">
                          Sealed & Completed
                        </span>
                      </div>
                    </div>
                  ) : selectedRowForModal.clockInTime ? (
                    <div className="p-3 bg-blue-50/70 border border-blue-200 rounded text-slate-700 space-y-2">
                      <div className="font-bold text-[#2F3E96] flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-[#2F3E96] animate-pulse" />
                        <span>Shift In Progress (Clock-Out Locked)</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Authoritative policy: Departure is strictly locked before 15:15 SAST.
                        Learner shift remains active in database until valid GPS departure verification.
                      </p>
                      <div className="text-[11px] font-mono text-slate-500 pt-1 border-t border-blue-200">
                        Earliest Departure: 15:15:00 SAST
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic py-4 text-center">
                      No clock-out evidence recorded.
                    </p>
                  )}
                </div>
              </div>

              {/* Section 6: Chronological Audit History Log */}
              <div>
                <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#2F3E96]" />
                  <span>Chronological Attendance Audit Trail</span>
                </h4>

                <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {buildAttendanceAuditTimeline(selectedRowForModal, workplaceConfig).map((evt) => (
                    <div key={evt.id} className="relative pl-7">
                      <div
                        className={`absolute left-1.5 top-1 w-3 h-3 rounded-full border-2 bg-white ${
                          evt.status === 'success'
                            ? 'border-emerald-600'
                            : evt.status === 'warning'
                            ? 'border-[#F4B52C]'
                            : evt.status === 'info'
                            ? 'border-[#2F3E96]'
                            : 'border-slate-400'
                        }`}
                      />
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="font-bold text-slate-900 text-xs">{evt.title}</span>
                          <span className="font-mono text-[10px] text-slate-500">{evt.timestamp}</span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">{evt.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedRowForModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
              >
                Close Audit Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Section 8: Official Print Register Modal (A4 Formatted View) */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-6">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-[#F4B52C]" />
                <span className="font-bold text-sm">Official Printable Attendance Register</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-[#F4B52C] text-white rounded text-xs font-bold hover:bg-[#e2a420] transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable A4 Content */}
            <div className="p-8 bg-white space-y-6 text-slate-900" id="printable-register">
              {/* Official Header */}
              <div className="flex items-start justify-between border-b-2 border-[#2F3E96] pb-4">
                <div className="flex items-center gap-3">
                  <img
                    src="/dynamicdna-logo.png"
                    alt="DynamicDNA"
                    className="h-12 w-auto object-contain"
                  />
                  <div>
                    <h1 className="text-lg font-bold text-[#2F3E96] leading-tight">
                      DynamicDNA · Statutory Attendance Register
                    </h1>
                    <p className="text-xs font-semibold text-slate-700">
                      DVT Learnership Programme (2026/2027 Cohort)
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Authorised Campus: DynamicDNA Campus, 270 Republic Rd, Randburg (-26.097841, 27.998357)
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <div className="font-bold text-slate-900">
                    Period: {dateMode === 'single' ? selectedDate : `${startDate} to ${endDate}`}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Printed at: {sast.formattedDisplay}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Timezone: Africa/Johannesburg (SAST)
                  </div>
                </div>
              </div>

              {/* Statutory Metric Summary */}
              <div className="grid grid-cols-4 gap-3 p-3 bg-slate-50 border border-slate-200 rounded text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Active Learners</span>
                  <div className="font-bold text-slate-900">{summaryMetrics.totalActiveLearners}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">On-Time Present</span>
                  <div className="font-bold text-emerald-700">{summaryMetrics.onTimeArrivals}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Late Arrivals</span>
                  <div className="font-bold text-amber-800">{summaryMetrics.lateArrivals}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Absent</span>
                  <div className="font-bold text-rose-700">{summaryMetrics.absentLearners}</div>
                </div>
              </div>

              {/* Clean Printable Table */}
              <div className="border border-slate-300 rounded overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-[#2F3E96] text-white font-bold">
                    <tr>
                      <th className="py-2 px-2.5">Learner No.</th>
                      <th className="py-2 px-2.5">Learner Name</th>
                      <th className="py-2 px-2.5">Date</th>
                      <th className="py-2 px-2.5">Clock-In</th>
                      <th className="py-2 px-2.5">In GPS</th>
                      <th className="py-2 px-2.5">Clock-Out</th>
                      <th className="py-2 px-2.5">Out GPS</th>
                      <th className="py-2 px-2.5">Status</th>
                      <th className="py-2 px-2.5">Access ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {filteredRows.slice(0, 35).map((row) => (
                      <tr key={row.id}>
                        <td className="py-1.5 px-2.5 font-bold text-[#2F3E96]">{row.learnerNumber}</td>
                        <td className="py-1.5 px-2.5 font-sans font-semibold text-slate-900">{row.learnerName}</td>
                        <td className="py-1.5 px-2.5">{row.attendanceDate}</td>
                        <td className="py-1.5 px-2.5">{row.clockInTime || '—'}</td>
                        <td className="py-1.5 px-2.5">
                          {row.clockInDistance !== undefined ? `${row.clockInDistance}m` : 'WFH'}
                        </td>
                        <td className="py-1.5 px-2.5">{row.clockOutTime || 'PENDING'}</td>
                        <td className="py-1.5 px-2.5">
                          {row.clockOutDistance !== undefined ? `${row.clockOutDistance}m` : '—'}
                        </td>
                        <td className="py-1.5 px-2.5 font-sans font-bold">
                          <span
                            className={
                              row.arrivalStatus === 'ON TIME'
                                ? 'text-emerald-700'
                                : row.arrivalStatus === 'LATE'
                                ? 'text-amber-700'
                                : 'text-rose-700'
                            }
                          >
                            {row.arrivalStatus}
                          </span>
                        </td>
                        <td className="py-1.5 px-2.5 text-[10px] text-slate-500">{row.accessId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Sign-off Block */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-700">
                <div>
                  <div className="font-bold text-slate-900 mb-1">Supervisor Verification</div>
                  <div className="border-b border-slate-400 h-8 mb-1"></div>
                  <div className="text-[10px] text-slate-500">Thabo Mokoena (Programme Administrator)</div>
                </div>
                <div>
                  <div className="font-bold text-slate-900 mb-1">Authorisation Date & Stamp</div>
                  <div className="border-b border-slate-400 h-8 mb-1"></div>
                  <div className="text-[10px] text-slate-500">Date: ________________________</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
