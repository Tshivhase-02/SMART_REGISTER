import React, { useState } from 'react';
import { useAttendance } from '../../../context/AttendanceContext';
import {
  Sliders,
  Power,
  Lock,
  Unlock,
  AlertTriangle,
  Building,
  Home,
  CheckCircle2,
  Radio,
} from 'lucide-react';

export const AdminSystemControlsScreen: React.FC = () => {
  const {
    systemControls,
    updateSystemControls,
    todayScheduleType,
    convertTodaySchedule,
  } = useAttendance();

  const [notice, setNotice] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>DVT Supervisory Authority</span>
            <span>·</span>
            <span>Real-time Operational Overrides</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            System Controls
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Immediate administrative overrides for terminal availability, WFH access, and emergency shutdowns.
          </p>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* 2. Control Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Clock-In Controls */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase">Clock-In Terminal Status</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Controls learner ability to log morning clock-ins.
              </p>
            </div>
            <span
              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                systemControls.isClockInEnabled
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {systemControls.isClockInEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                updateSystemControls({ isClockInEnabled: true });
                showFeedback('Clock-In terminal enabled.');
              }}
              disabled={systemControls.isClockInEnabled}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded ${
                systemControls.isClockInEnabled
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              Enable Clock-In
            </button>
            <button
              onClick={() => {
                updateSystemControls({ isClockInEnabled: false });
                showFeedback('Clock-In terminal disabled.');
              }}
              disabled={!systemControls.isClockInEnabled}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded ${
                !systemControls.isClockInEnabled
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }`}
            >
              Disable Clock-In
            </button>
          </div>
        </div>

        {/* Clock-Out Controls */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase">Clock-Out Terminal Status</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Controls departure registration availability.
              </p>
            </div>
            <span
              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                systemControls.isClockOutEnabled
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {systemControls.isClockOutEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                updateSystemControls({ isClockOutEnabled: true });
                showFeedback('Clock-Out terminal enabled.');
              }}
              disabled={systemControls.isClockOutEnabled}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded ${
                systemControls.isClockOutEnabled
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              Enable Clock-Out
            </button>
            <button
              onClick={() => {
                updateSystemControls({ isClockOutEnabled: false });
                showFeedback('Clock-Out terminal disabled.');
              }}
              disabled={!systemControls.isClockOutEnabled}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded ${
                !systemControls.isClockOutEnabled
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }`}
            >
              Disable Clock-Out
            </button>
          </div>
        </div>

        {/* Close / Reopen Attendance for Today */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase">Today's Daily Register</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Lock all submissions across today's session.
              </p>
            </div>
            <span
              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                systemControls.isAttendanceClosedToday
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {systemControls.isAttendanceClosedToday ? 'Closed' : 'Open'}
            </span>
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                updateSystemControls({ isAttendanceClosedToday: true });
                showFeedback('Attendance for today closed.');
              }}
              disabled={systemControls.isAttendanceClosedToday}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded ${
                systemControls.isAttendanceClosedToday
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-800 hover:bg-slate-900 text-white'
              }`}
            >
              Close Attendance For Today
            </button>
            <button
              onClick={() => {
                updateSystemControls({ isAttendanceClosedToday: false });
                showFeedback('Attendance for today reopened.');
              }}
              disabled={!systemControls.isAttendanceClosedToday}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded ${
                !systemControls.isAttendanceClosedToday
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-[#0F4C81] hover:bg-[#0A355C] text-white'
              }`}
            >
              Reopen Attendance
            </button>
          </div>
        </div>

        {/* Work From Home Attendance Override */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase">WFH Attendance Channel</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Permits learners to register attendance from home.
              </p>
            </div>
            <span
              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                systemControls.isWfhAttendanceEnabled
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {systemControls.isWfhAttendanceEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                updateSystemControls({ isWfhAttendanceEnabled: true });
                showFeedback('Work From Home attendance enabled.');
              }}
              disabled={systemControls.isWfhAttendanceEnabled}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded ${
                systemControls.isWfhAttendanceEnabled
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              Enable WFH Attendance
            </button>
            <button
              onClick={() => {
                updateSystemControls({ isWfhAttendanceEnabled: false });
                showFeedback('Work From Home attendance disabled.');
              }}
              disabled={!systemControls.isWfhAttendanceEnabled}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded ${
                !systemControls.isWfhAttendanceEnabled
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }`}
            >
              Disable WFH Attendance
            </button>
          </div>
        </div>
      </div>

      {/* 3. Convert Today's Schedule Mode (Office <-> WFH) */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase pb-2 border-b border-slate-100">
          Instant Daily Schedule Conversion
        </h3>
        <p className="text-xs text-slate-600">
          Current schedule designated for today: <strong className="uppercase font-mono text-[#0F4C81]">{todayScheduleType}</strong>. Switch immediately if weather or transport disruption occurs.
        </p>

        <div className="flex gap-3 pt-1">
          <button
            onClick={() => {
              convertTodaySchedule('wfh');
              showFeedback("Converted today's schedule to Work From Home (WFH).");
            }}
            className={`flex-1 py-2 px-3 rounded text-xs font-semibold flex items-center justify-center gap-1.5 border transition-colors ${
              todayScheduleType === 'wfh'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Home className="w-4 h-4 text-emerald-600" />
            <span>Convert Office Day To WFH</span>
          </button>

          <button
            onClick={() => {
              convertTodaySchedule('office');
              showFeedback("Converted today's schedule to Office (Requires 100m GPS).");
            }}
            className={`flex-1 py-2 px-3 rounded text-xs font-semibold flex items-center justify-center gap-1.5 border transition-colors ${
              todayScheduleType === 'office'
                ? 'bg-blue-50 border-[#0F4C81] text-[#0F4C81]'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Building className="w-4 h-4 text-[#0F4C81]" />
            <span>Convert WFH Day To Office</span>
          </button>
        </div>
      </div>

      {/* 4. Emergency Broadcast Message */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <h3 className="text-xs font-bold text-slate-900 uppercase">
            Emergency Lock & Administrator Broadcast Message
          </h3>
        </div>

        <div className="space-y-2 text-xs">
          <label className="block font-semibold text-slate-700">
            Emergency Message Displayed To Learners:
          </label>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded font-mono text-slate-800">
            "{systemControls.emergencyMessage}"
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-500">
              Activating blocks Daily Access IDs and displays this emergency message to all learners.
            </span>
            <button
              onClick={() => {
                const nextState = !systemControls.emergencyBroadcastActive;
                updateSystemControls({ emergencyBroadcastActive: nextState });
                showFeedback(
                  nextState
                    ? 'Emergency shutdown activated.'
                    : 'Emergency shutdown deactivated.'
                );
              }}
              className={`px-4 py-2 rounded text-xs font-bold transition-colors ${
                systemControls.emergencyBroadcastActive
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }`}
            >
              {systemControls.emergencyBroadcastActive
                ? 'Lift Emergency Suspension'
                : 'Broadcast Emergency Suspension'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
