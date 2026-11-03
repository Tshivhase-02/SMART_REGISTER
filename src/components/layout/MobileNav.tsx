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
        className={`flex flex-col items-center justify-center flex-1 py-1.5 min-h-[48px] touch-manipulation transition-colors relative cursor-pointer ${
          isActive
            ? 'text-[#2F3E96] font-bold'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        {isActive && (
          <span className="absolute top-0 left-2 right-2 h-0.5 bg-[#F4B52C] rounded-full" />
        )}
        <Icon className={`w-4 h-4 ${isActive ? 'text-[#2F3E96] stroke-[2.5]' : 'text-slate-500 stroke-[1.75]'}`} />
        <span className="text-[9px] mt-0.5 tracking-tight truncate max-w-[64px]">{label}</span>
      </button>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex items-center justify-around px-1 shadow-sm safe-area-bottom md:hidden">
      {isLearner ? (
        <>
          {navBtn('learner_dashboard', 'Dashboard', LayoutDashboard)}
          {navBtn('learner_history', 'History', History)}
          {navBtn('learner_report_absence', 'Absence', CalendarX)}
          {navBtn('learner_directory', 'Directory', Users)}
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
