import React, { useState } from 'react';
import { useAttendance } from '../../../context/AttendanceContext';
import { DayScheduleType, WeeklyScheduleConfig } from '../../../types/attendance';
import {
  CalendarDays,
  Building,
  Home,
  CheckCircle2,
  RotateCcw,
  Save,
  Users,
  Info,
} from 'lucide-react';

export const AdminScheduleManagementScreen: React.FC = () => {
  const {
    weeklySchedule,
    updateWeeklySchedule,
    resetSchedule,
    scheduleOverrides,
    setScheduleOverride,
  } = useAttendance();

  // Local state for weekly schedule form
  const [schedule, setSchedule] = useState<WeeklyScheduleConfig>(weeklySchedule);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // Future date override state
  const [overrideDate, setOverrideDate] = useState('');
  const [overrideType, setOverrideType] = useState<DayScheduleType>('office');

  const days: { key: keyof WeeklyScheduleConfig; label: string }[] = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
  ];

  const handleToggleDay = (key: keyof WeeklyScheduleConfig) => {
    setSchedule((prev) => ({
      ...prev,
      [key]: prev[key] === 'office' ? 'wfh' : 'office',
    }));
  };

  const handleSaveSchedule = () => {
    updateWeeklySchedule(schedule);
    setSaveNotice('Weekly schedule saved successfully.');
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const handleApplyToAllLearners = () => {
    updateWeeklySchedule(schedule);
    setSaveNotice('Weekly schedule successfully applied to all active DVT learners.');
    setTimeout(() => setSaveNotice(null), 3500);
  };

  const handleReset = () => {
    resetSchedule();
    setSchedule({
      monday: 'wfh',
      tuesday: 'office',
      wednesday: 'wfh',
      thursday: 'wfh',
      friday: 'office',
    });
    setSaveNotice('Schedule reset to DVT default hybrid pattern (Mon WFH, Tue Office, Wed WFH, Thu WFH, Fri Office).');
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const handleAddOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideDate) return;
    setScheduleOverride(overrideDate, overrideType);
    setSaveNotice(`Future schedule override set for ${overrideDate} as ${overrideType.toUpperCase()}.`);
    setOverrideDate('');
    setTimeout(() => setSaveNotice(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>DVT Learnership Governance</span>
            <span>·</span>
            <span>Hybrid Attendance Policy</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Work Schedule Management
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Configure Office days and Work From Home days. Learners cannot modify schedules; rules are authoritative.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded text-xs font-semibold hover:bg-slate-50 transition-colors shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Schedule</span>
          </button>
          <button
            onClick={handleSaveSchedule}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Schedule</span>
          </button>
          <button
            onClick={handleApplyToAllLearners}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0F4C81] text-white rounded text-xs font-semibold hover:bg-[#0A355C] transition-colors shadow-xs"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Apply To All Learners</span>
          </button>
        </div>
      </div>

      {saveNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveNotice}</span>
        </div>
      )}

      {/* 2. Weekly Schedule Configuration Grid */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Weekly Master Hybrid Schedule
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any weekday to toggle between <strong>Office</strong> (Physical attendance & GPS required) and <strong>Work From Home</strong>.
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Working Days Only (Mon - Fri)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {days.map(({ key, label }) => {
            const isOffice = schedule[key] === 'office';
            return (
              <div
                key={key}
                onClick={() => handleToggleDay(key)}
                className={`cursor-pointer p-4 rounded-lg border text-center transition-all ${
                  isOffice
                    ? 'bg-blue-50/60 border-[#0F4C81] ring-2 ring-[#0F4C81]/15 shadow-xs'
                    : 'bg-emerald-50/60 border-emerald-500 ring-2 ring-emerald-500/15 shadow-xs'
                }`}
              >
                <span className="text-xs font-bold text-slate-800 uppercase block mb-2">
                  {label}
                </span>

                <div className="flex justify-center mb-2">
                  {isOffice ? (
                    <Building className="w-6 h-6 text-[#0F4C81]" />
                  ) : (
                    <Home className="w-6 h-6 text-emerald-600" />
                  )}
                </div>

                <span
                  className={`inline-block text-xs font-bold uppercase px-2 py-0.5 rounded ${
                    isOffice
                      ? 'bg-[#0F4C81] text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {isOffice ? 'Office' : 'WFH'}
                </span>

                <p className="text-[10px] text-slate-500 mt-2">
                  {isOffice ? 'Campus (≤ 100m)' : 'Remote Contact'}
                </p>
              </div>
            );
          })}
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 flex items-start gap-2">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p>
            <strong>Default DVT Learnership Schedule:</strong> Monday (WFH), Tuesday (Office), Wednesday (WFH), Thursday (WFH), Friday (Office). Saturday and Sunday are strictly designated as non-working days.
          </p>
        </div>
      </div>

      {/* 3. Future Specific Date Overrides */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide pb-2 border-b border-slate-100">
          Configure Future Schedule Overrides
        </h3>

        <form onSubmit={handleAddOverride} className="flex flex-col sm:flex-row items-end gap-3 text-xs">
          <div className="flex-1 w-full">
            <label className="block font-semibold text-slate-700 uppercase tracking-wide text-[10px] mb-1">
              Select Specific Date
            </label>
            <input
              type="date"
              required
              value={overrideDate}
              onChange={(e) => setOverrideDate(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#0F4C81]"
            />
          </div>

          <div className="w-full sm:w-48">
            <label className="block font-semibold text-slate-700 uppercase tracking-wide text-[10px] mb-1">
              Designated Day Type
            </label>
            <select
              value={overrideType}
              onChange={(e) => setOverrideType(e.target.value as DayScheduleType)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#0F4C81] bg-white"
            >
              <option value="office">Office Day</option>
              <option value="wfh">Work From Home (WFH)</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 bg-[#0F4C81] text-white font-semibold rounded hover:bg-[#0A355C] transition-colors"
          >
            Apply Date Override
          </button>
        </form>

        {/* Existing Overrides Table */}
        {Object.keys(scheduleOverrides).length > 0 && (
          <div className="pt-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">
              Active Calendar Overrides
            </h4>
            <div className="space-y-1.5 text-xs">
              {Object.entries(scheduleOverrides).map(([dateStr, type]) => (
                <div
                  key={dateStr}
                  className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-200 rounded"
                >
                  <span className="font-mono font-bold text-slate-900">{dateStr}</span>
                  <span
                    className={`font-semibold uppercase text-[10px] px-2 py-0.5 rounded ${
                      type === 'office'
                        ? 'bg-blue-100 text-[#0F4C81]'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {type === 'office' ? 'Office Day' : 'Work From Home'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
