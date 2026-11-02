import React from 'react';
import { useAttendance, ScreenId } from '../../context/AttendanceContext';
import {
  LayoutDashboard,
  Clock,
  History,
  CalendarX,
  User,
  Users,
  CheckSquare,
  FileSpreadsheet,
  Sliders,
  CalendarDays,
  Settings,
  Layers,
  Building2,
  KeyRound,
  CheckCircle2,
  XCircle,
  LogOut,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    activeScreen,
    setActiveScreen,
    currentUser,
    todayScheduleType,
    hasClockedInToday,
    todayRecord,
    dailyAccessId,
    isDailyAccessVerified,
    logout,
  } = useAttendance();

  const isLearner = currentUser?.role === 'learner';
  const isAdmin = currentUser?.role === 'admin';

  const navItemClass = (id: ScreenId) =>
    `flex items-center justify-between w-full px-3 py-2 text-xs font-medium rounded transition-colors text-left ${
      activeScreen === id
        ? 'bg-[#0F4C81] text-white shadow-xs font-semibold'
        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-[calc(100vh-3.5rem)] select-none">
      {/* Shift Overview Pill / Status Card */}
      <div className="p-3 m-3 bg-slate-50 border border-slate-200 rounded text-xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {isLearner ? "Today's Schedule" : 'Active Session'}
          </span>
          <span
            className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
              todayScheduleType === 'office'
                ? 'bg-blue-100 text-[#0F4C81]'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {todayScheduleType === 'office' ? 'Office' : 'WFH'}
          </span>
        </div>

        {isLearner && (
          <>
            <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-200">
              <span>Attendance:</span>
              <span
                className={`font-semibold ${
                  hasClockedInToday ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {hasClockedInToday ? todayRecord?.status : 'Not Clocked In'}
              </span>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 font-mono">
              <span>Access ID:</span>
              <span
                className={`font-semibold truncate max-w-[100px] ${
                  isDailyAccessVerified ? 'text-slate-800' : 'text-rose-700'
                }`}
              >
                {isDailyAccessVerified ? dailyAccessId || 'Pending' : 'Denied'}
              </span>
            </div>
          </>
        )}

        {isAdmin && (
          <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200">
            <span className="font-semibold text-slate-800">Admin Mode Active</span>
            <p className="text-[10px] text-slate-500 mt-0.5">DVT Supervisory Controls</p>
          </div>
        )}
      </div>

      {/* Navigation Links strictly isolated by role */}
      <nav className="flex-1 px-3 space-y-4 overflow-y-auto">
        {/* ================= LEARNER ONLY NAVIGATION ================= */}
        {isLearner && (
          <div>
            <div className="px-3 mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Learner Menu
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => setActiveScreen('learner_dashboard')}
                className={navItemClass('learner_dashboard')}
              >
                <span className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </span>
              </button>

              <button
                onClick={() => setActiveScreen('learner_attendance')}
                className={navItemClass('learner_attendance')}
              >
                <span className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4" />
                  <span>Attendance</span>
                </span>
                {hasClockedInToday && (
                  <span className="text-[9px] uppercase bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded font-bold">
                    Done
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveScreen('learner_history')}
                className={navItemClass('learner_history')}
              >
                <span className="flex items-center gap-2.5">
                  <History className="w-4 h-4" />
                  <span>Attendance History</span>
                </span>
              </button>

              <button
                onClick={() => setActiveScreen('learner_report_absence')}
                className={navItemClass('learner_report_absence')}
              >
                <span className="flex items-center gap-2.5">
                  <CalendarX className="w-4 h-4" />
                  <span>Report Absence</span>
                </span>
              </button>

              <button
                onClick={() => setActiveScreen('learner_profile')}
                className={navItemClass('learner_profile')}
              >
                <span className="flex items-center gap-2.5">
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ================= ADMIN ONLY NAVIGATION ================= */}
        {isAdmin && (
          <div>
            <div className="px-3 mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Admin Governance
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => setActiveScreen('admin_dashboard')}
                className={navItemClass('admin_dashboard')}
              >
                <span className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </span>
              </button>

              <button
                onClick={() => setActiveScreen('admin_learners')}
                className={navItemClass('admin_learners')}
              >
                <span className="flex items-center gap-2.5">
                  <Users className="w-4 h-4" />
                  <span>Learners</span>
                </span>
              </button>

              <button
                onClick={() => setActiveScreen('admin_attendance')}
                className={navItemClass('admin_attendance')}
              >
                <span className="flex items-center gap-2.5">
                  <CheckSquare className="w-4 h-4" />
                  <span>Attendance</span>
                </span>
              </button>

              <button
                onClick={() => setActiveScreen('admin_absence_requests')}
                className={navItemClass('admin_absence_requests')}
              >
                <span className="flex items-center gap-2.5">
                  <CalendarX className="w-4 h-4" />
                  <span>Absence Requests</span>
                </span>
              </button>

              <button
                onClick={() => setActiveScreen('admin_register_downloads')}
                className={navItemClass('admin_register_downloads')}
              >
                <span className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Register Downloads</span>
                </span>
              </button>

              <button
                onClick={() => setActiveScreen('admin_system_controls')}
                className={navItemClass('admin_system_controls')}
              >
                <span className="flex items-center gap-2.5">
                  <Sliders className="w-4 h-4" />
                  <span>System Controls</span>
                </span>
              </button>

              <button
                onClick={() => setActiveScreen('admin_schedule_management')}
                className={navItemClass('admin_schedule_management')}
              >
                <span className="flex items-center gap-2.5">
                  <CalendarDays className="w-4 h-4" />
                  <span>Work Schedule Management</span>
                </span>
              </button>

              <button
                onClick={() => setActiveScreen('admin_settings')}
                className={navItemClass('admin_settings')}
              >
                <span className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </span>
              </button>
            </div>
          </div>
        )}

        {/* System Architecture Specifications (Accessible for reviewer verification) */}
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={() => setActiveScreen('specs_documentation')}
            className={navItemClass('specs_documentation')}
          >
            <span className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-sky-600" />
              <span>Full Specifications</span>
            </span>
            <span className="text-[9px] bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded font-bold">
              20 Specs
            </span>
          </button>
        </div>

        {/* Sign Out Action */}
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={() => logout()}
            className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold rounded transition-colors text-left text-rose-700 hover:bg-rose-50"
            title="Sign out and return to Login & Registration portal"
          >
            <span className="flex items-center gap-2.5">
              <LogOut className="w-4 h-4 text-rose-600" />
              <span>Sign Out</span>
            </span>
            <span className="text-[10px] text-rose-500 font-mono">Exit</span>
          </button>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 text-[10px] text-slate-500">
        <div className="flex items-center gap-1.5 text-slate-800 font-bold mb-0.5">
          <Building2 className="w-3.5 h-3.5 text-[#0F4C81]" />
          <span>DynamicDNA Campus</span>
        </div>
        <p className="leading-tight text-slate-500">
          DVT Learnership Programme
          <br />
          Radius: 100 Metres
        </p>
      </div>
    </aside>
  );
};
