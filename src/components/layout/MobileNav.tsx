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
  CalendarDays,
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { activeScreen, setActiveScreen, currentUser } = useAttendance();

  const isLearner = currentUser?.role === 'learner';

  const navBtn = (id: ScreenId, label: string, Icon: React.ElementType) => {
    const isActive = activeScreen === id;
    return (
      <button
        onClick={() => setActiveScreen(id)}
        className={`flex flex-col items-center justify-center flex-1 py-1.5 min-h-[48px] touch-manipulation transition-colors ${
          isActive ? 'text-[#0F4C81] font-semibold' : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
        <span className="text-[9px] mt-0.5 tracking-tight truncate max-w-[64px]">{label}</span>
      </button>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex items-center justify-around px-1 shadow-sm safe-area-bottom md:hidden">
      {isLearner ? (
        <>
          {navBtn('learner_dashboard', 'Dashboard', LayoutDashboard)}
          {navBtn('learner_attendance', 'Attendance', Clock)}
          {navBtn('learner_history', 'History', History)}
          {navBtn('learner_report_absence', 'Absence', CalendarX)}
          {navBtn('learner_profile', 'Profile', User)}
        </>
      ) : (
        <>
          {navBtn('admin_dashboard', 'Dashboard', LayoutDashboard)}
          {navBtn('admin_learners', 'Learners', Users)}
          {navBtn('admin_attendance', 'Register', CheckSquare)}
          {navBtn('admin_absence_requests', 'Absences', CalendarX)}
          {navBtn('admin_schedule_management', 'Schedule', CalendarDays)}
        </>
      )}
    </nav>
  );
};
