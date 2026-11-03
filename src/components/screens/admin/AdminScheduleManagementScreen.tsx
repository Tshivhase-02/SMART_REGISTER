import React, { useState } from 'react';
import { useAttendance } from '../../../context/AttendanceContext';
import { DayScheduleType, WeeklyScheduleConfig, WorkplaceOffice } from '../../../types/attendance';
import {
  CalendarDays,
  Building,
  Home,
  CheckCircle2,
  RotateCcw,
  Save,
  Users,
  Info,
  MapPin,
  ShieldCheck,
  History,
  Sliders,
} from 'lucide-react';

export const AdminScheduleManagementScreen: React.FC = () => {
  const {
    weeklySchedule,
    updateWeeklySchedule,
    resetSchedule,
    scheduleOverrides,
    setScheduleOverride,
    workplaceConfig,
    workplaceAuditLogs,
    updateWorkplaceConfig,
    resetWorkplaceConfig,
  } = useAttendance();

  // Local state for weekly schedule form
  const [schedule, setSchedule] = useState<WeeklyScheduleConfig>(weeklySchedule);

  // Local state for workplace form
  const [wpName, setWpName] = useState(workplaceConfig.name);
  const [wpLat, setWpLat] = useState(workplaceConfig.coordinates.latitude.toString());
  const [wpLng, setWpLng] = useState(workplaceConfig.coordinates.longitude.toString());
  const [wpRadius, setWpRadius] = useState(workplaceConfig.allowedRadiusMeters.toString());
  const [wpAccuracy, setWpAccuracy] = useState(workplaceConfig.gpsAccuracyThresholdMeters.toString());
  const [wpActive, setWpActive] = useState(workplaceConfig.isActive);
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

  const handleSaveWorkplace = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(wpLat);
    const lng = parseFloat(wpLng);
    const radius = parseInt(wpRadius, 10);
    const accuracy = parseInt(wpAccuracy, 10);

    if (isNaN(lat) || isNaN(lng) || isNaN(radius) || isNaN(accuracy)) {
      setSaveNotice('Please enter valid numeric values for coordinates, radius, and accuracy threshold.');
      return;
    }

    updateWorkplaceConfig(
      {
        name: wpName.trim(),
        coordinates: { latitude: lat, longitude: lng },
        allowedRadiusMeters: radius,
        gpsAccuracyThresholdMeters: accuracy,
        isActive: wpActive,
      },
      `Admin updated workplace parameters (${wpName.trim()}, ${radius}m radius, ${accuracy}m accuracy)`
    );

    setSaveNotice('Authorised workplace parameters updated successfully and logged in audit ledger.');
    setTimeout(() => setSaveNotice(null), 3500);
  };

  const handleResetWorkplace = () => {
    resetWorkplaceConfig();
    setWpName('DynamicDNA Campus');
    setWpLat('-26.097841');
    setWpLng('27.998357');
    setWpRadius('100');
    setWpAccuracy('30');
    setWpActive(true);
    setSaveNotice(
      'Workplace configuration restored to official DynamicDNA Campus defaults (-26.097841, 27.998357, 100m).'
    );
    setTimeout(() => setSaveNotice(null), 3500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>DVT Learnership Governance</span>
            <span>·</span>
            <span>Hybrid Attendance & Geofence Policy</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Work Schedule & Workplace Coordinates
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Configure Office days, Work From Home days, and authoritative workplace GPS geofence coordinates.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E7EB] text-slate-700 rounded text-xs font-semibold hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Schedule</span>
          </button>
          {/* Primary Button: Save */}
          <button
            onClick={handleSaveSchedule}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#F4B52C] hover:bg-[#E0A220] text-white rounded text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Schedule</span>
          </button>
          {/* Secondary Button: Apply */}
          <button
            onClick={handleApplyToAllLearners}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#2F3E96] hover:bg-[#25327a] text-white rounded text-xs font-semibold transition-colors shadow-xs cursor-pointer"
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
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-xs space-y-4">
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
                    ? 'bg-blue-50/60 border-[#2F3E96] ring-2 ring-[#2F3E96]/15 shadow-xs'
                    : 'bg-emerald-50/60 border-emerald-500 ring-2 ring-emerald-500/15 shadow-xs'
                }`}
              >
                <span className="text-xs font-bold text-slate-800 uppercase block mb-2">
                  {label}
                </span>

                <div className="flex justify-center mb-2">
                  {isOffice ? (
                    <Building className="w-6 h-6 text-[#2F3E96]" />
                  ) : (
                    <Home className="w-6 h-6 text-emerald-600" />
                  )}
                </div>

                <span
                  className={`inline-block text-xs font-bold uppercase px-2 py-0.5 rounded ${
                    isOffice
                      ? 'bg-[#2F3E96] text-white'
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

        <div className="p-3 bg-slate-50 border border-[#E5E7EB] rounded text-xs text-slate-600 flex items-start gap-2">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p>
            <strong>Default DVT Learnership Schedule:</strong> Monday (WFH), Tuesday (Office), Wednesday (WFH), Thursday (WFH), Friday (Office). Saturday and Sunday are strictly designated as non-working days.
          </p>
        </div>
      </div>

      {/* 3. Future Specific Date Overrides */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-xs space-y-4">
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
              className="w-full px-3 py-1.5 border border-[#E5E7EB] rounded text-xs focus:ring-1 focus:ring-[#2F3E96] focus:border-[#2F3E96]"
            />
          </div>

          <div className="w-full sm:w-48">
            <label className="block font-semibold text-slate-700 uppercase tracking-wide text-[10px] mb-1">
              Designated Day Type
            </label>
            <select
              value={overrideType}
              onChange={(e) => setOverrideType(e.target.value as DayScheduleType)}
              className="w-full px-3 py-1.5 border border-[#E5E7EB] rounded text-xs focus:ring-1 focus:ring-[#2F3E96] focus:border-[#2F3E96] bg-white"
            >
              <option value="office">Office Day</option>
              <option value="wfh">Work From Home (WFH)</option>
            </select>
          </div>

          {/* Primary Button: Apply Date Override */}
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 bg-[#F4B52C] hover:bg-[#E0A220] text-white font-semibold rounded transition-colors shadow-xs cursor-pointer"
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
                  className="flex justify-between items-center p-2.5 bg-slate-50 border border-[#E5E7EB] rounded"
                >
                  <span className="font-mono font-bold text-slate-900">{dateStr}</span>
                  <span
                    className={`font-semibold uppercase text-[10px] px-2 py-0.5 rounded ${
                      type === 'office'
                        ? 'bg-blue-100 text-[#2F3E96]'
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

      {/* 4. SECTION 2: Authorised Workplace Coordinates Configuration */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#2F3E96]" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Authorised Workplace Coordinates & Geofence
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Configured in the database/context. Learners' physical coordinates are evaluated against these authoritative settings.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetWorkplace}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1 bg-white border border-[#E5E7EB] text-slate-700 rounded text-xs font-semibold hover:bg-slate-50 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset to DynamicDNA Defaults</span>
          </button>
        </div>

        <form onSubmit={handleSaveWorkplace} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wide text-[10px] mb-1">
                Workplace Facility Name
              </label>
              <input
                type="text"
                required
                value={wpName}
                onChange={(e) => setWpName(e.target.value)}
                placeholder="DynamicDNA Campus"
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded text-xs focus:ring-1 focus:ring-[#2F3E96] focus:border-[#2F3E96]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wide text-[10px] mb-1">
                Latitude (WGS 84 Decimal Degrees)
              </label>
              <input
                type="number"
                step="any"
                required
                value={wpLat}
                onChange={(e) => setWpLat(e.target.value)}
                placeholder="-26.097841"
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded text-xs font-mono focus:ring-1 focus:ring-[#2F3E96] focus:border-[#2F3E96]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wide text-[10px] mb-1">
                Longitude (WGS 84 Decimal Degrees)
              </label>
              <input
                type="number"
                step="any"
                required
                value={wpLng}
                onChange={(e) => setWpLng(e.target.value)}
                placeholder="27.998357"
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded text-xs font-mono focus:ring-1 focus:ring-[#2F3E96] focus:border-[#2F3E96]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wide text-[10px] mb-1">
                Permitted Radius (Metres)
              </label>
              <input
                type="number"
                min="10"
                max="5000"
                required
                value={wpRadius}
                onChange={(e) => setWpRadius(e.target.value)}
                placeholder="100"
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded text-xs font-mono focus:ring-1 focus:ring-[#2F3E96] focus:border-[#2F3E96]"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Haversine great-circle perimeter (Default: 100m)
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wide text-[10px] mb-1">
                GPS Accuracy Threshold (Metres)
              </label>
              <input
                type="number"
                min="5"
                max="200"
                required
                value={wpAccuracy}
                onChange={(e) => setWpAccuracy(e.target.value)}
                placeholder="30"
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded text-xs font-mono focus:ring-1 focus:ring-[#2F3E96] focus:border-[#2F3E96]"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Maximum acceptable GPS error (Default: 30m)
              </span>
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer p-2.5 bg-slate-50 border border-[#E5E7EB] rounded">
                <input
                  type="checkbox"
                  checked={wpActive}
                  onChange={(e) => setWpActive(e.target.checked)}
                  className="rounded text-[#2F3E96] focus:ring-[#2F3E96] w-4 h-4 cursor-pointer"
                />
                <span className="font-semibold text-slate-800 text-xs">
                  Workplace Facility Active
                </span>
              </label>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Must be checked for learner GPS verification to succeed
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            {/* Primary Button: #F4B52C */}
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#F4B52C] hover:bg-[#E0A220] text-white font-semibold text-xs rounded transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Authorised Workplace Coordinates</span>
            </button>
          </div>
        </form>
      </div>

      {/* 5. SECTION 10: Workplace Configuration Audit Log */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#2F3E96]" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Workplace Configuration Audit Log
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {workplaceAuditLogs.length} Events Logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-slate-50 text-[10px] font-bold uppercase text-slate-600">
                <th className="py-2.5 px-3">Timestamp (SAST)</th>
                <th className="py-2.5 px-3">Administrator</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {workplaceAuditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 font-sans">
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('en-ZA', {
                      timeZone: 'Africa/Johannesburg',
                    })}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                    {log.adminName}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="inline-block px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-blue-100 text-[#2F3E96]">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-700">
                    <p>{log.details}</p>
                    {log.changes && log.changes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1 font-mono text-[10px]">
                        {log.changes.map((c, i) => (
                          <span
                            key={i}
                            className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-600"
                          >
                            {c.field}: {String(c.oldValue)} → <strong>{String(c.newValue)}</strong>
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

