import React, { useState } from 'react';
import { AttendanceProvider, useAttendance } from './context/AttendanceContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { CreateLearnerProfileModal } from './components/modals/CreateLearnerProfileModal';

// Learner screens
import { LearnerDashboard } from './components/screens/learner/LearnerDashboard';
import { LearnerAttendanceScreen } from './components/screens/learner/LearnerAttendanceScreen';
import { LearnerHistoryScreen } from './components/screens/learner/LearnerHistoryScreen';
import { LearnerReportAbsenceScreen } from './components/screens/learner/LearnerReportAbsenceScreen';
import { LearnerProfileScreen } from './components/screens/learner/LearnerProfileScreen';
import { LearnerDirectoryScreen } from './components/screens/learner/LearnerDirectoryScreen';

// Admin screens
import { AdminDashboard } from './components/screens/admin/AdminDashboard';
import { AdminLearnersScreen } from './components/screens/admin/AdminLearnersScreen';
import { AdminAttendanceScreen } from './components/screens/admin/AdminAttendanceScreen';
import { AdminAbsenceRequestsScreen } from './components/screens/admin/AdminAbsenceRequestsScreen';
import { AdminRegisterDownloadsScreen } from './components/screens/admin/AdminRegisterDownloadsScreen';
import { AdminSystemControlsScreen } from './components/screens/admin/AdminSystemControlsScreen';
import { AdminScheduleManagementScreen } from './components/screens/admin/AdminScheduleManagementScreen';
import { AdminSettingsScreen } from './components/screens/admin/AdminSettingsScreen';

// Architecture documentation
import { SpecsDocumentationScreen } from './components/screens/SpecsDocumentationScreen';

// Microsoft-style Authentication Experience
import { MicrosoftAuthContainer } from './components/auth/MicrosoftAuthContainer';

const MainLayout: React.FC = () => {
  const {
    currentUser,
    activeScreen,
    isMobileDeviceView,
    setIsMobileDeviceView,
  } = useAttendance();

  const [isCreateProfileOpen, setIsCreateProfileOpen] = useState(false);

  // Authentication Completed First: if not signed in, show Microsoft 365 sign-in experience
  if (!currentUser) {
    return <MicrosoftAuthContainer />;
  }

  const renderActiveScreen = () => {
    // Specs documentation accessible from admin role only
    if (activeScreen === 'specs_documentation' && currentUser?.role === 'admin') {
      return <SpecsDocumentationScreen />;
    }

    // Learner Portal Screens
    if (currentUser?.role === 'learner') {
      switch (activeScreen) {
        case 'learner_dashboard':
          return <LearnerDashboard />;
        case 'learner_attendance':
          return <LearnerAttendanceScreen />;
        case 'learner_history':
          return <LearnerHistoryScreen />;
        case 'learner_report_absence':
          return <LearnerReportAbsenceScreen />;
        case 'learner_directory':
          return <LearnerDirectoryScreen />;
        case 'learner_profile':
          return <LearnerProfileScreen />;
        default:
          return <LearnerDashboard />;
      }
    }

    // Admin Portal Screens
    if (currentUser?.role === 'admin') {
      switch (activeScreen) {
        case 'admin_dashboard':
          return <AdminDashboard />;
        case 'admin_learners':
          return <AdminLearnersScreen />;
        case 'admin_attendance':
          return <AdminAttendanceScreen />;
        case 'admin_absence_requests':
          return <AdminAbsenceRequestsScreen />;
        case 'admin_register_downloads':
          return <AdminRegisterDownloadsScreen />;
        case 'admin_system_controls':
          return <AdminSystemControlsScreen />;
        case 'admin_schedule_management':
          return <AdminScheduleManagementScreen />;
        case 'admin_settings':
          return <AdminSettingsScreen />;
        default:
          return <AdminDashboard />;
      }
    }

    return <LearnerDashboard />;
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col text-[#333333] antialiased selection:bg-[#F4B52C] selection:text-[#2F3E96]">
      {/* Top Navigation Bar (Hidden during print) */}
      <div className="print:hidden">
        <Navbar onOpenCreateProfileModal={() => setIsCreateProfileOpen(true)} />
      </div>

      {/* Main Viewport Container */}
      {isMobileDeviceView ? (
        <div className="flex-1 py-8 px-4 flex flex-col items-center justify-center bg-slate-200 print:bg-white print:p-0">
          <div className="print:hidden mb-2 flex items-center justify-between w-full max-w-[420px] text-xs text-slate-600 px-2">
            <span className="font-semibold uppercase tracking-wider">
              Simulated Mobile View (390px)
            </span>
            <button
              onClick={() => setIsMobileDeviceView(false)}
              className="text-[#2F3E96] font-semibold hover:underline"
            >
              Exit Mobile View
            </button>
          </div>

          <div className="w-full max-w-[400px] h-[800px] bg-white border-8 border-slate-900 rounded-[38px] shadow-2xl overflow-hidden flex flex-col relative print:border-none print:shadow-none print:w-full print:max-w-none print:h-auto">
            {/* Phone Notch */}
            <div className="print:hidden h-6 bg-slate-900 flex justify-center items-center shrink-0">
              <div className="w-20 h-3.5 bg-black rounded-full" />
            </div>

            {/* Scrollable Screen Content */}
            <div className="flex-1 overflow-y-auto p-4 pb-20 bg-[#F5F5F5] print:bg-white print:p-0">
              {renderActiveScreen()}
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="print:hidden">
              <MobileNav />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex w-full">
          {/* Desktop Left Sidebar (Hidden during print) */}
          <div className="hidden md:block print:hidden">
            <Sidebar />
          </div>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8 max-w-7xl mx-auto w-full print:p-0 print:max-w-none">
            {renderActiveScreen()}
          </main>
        </div>
      )}

      {/* Bottom Nav for real mobile viewports */}
      {!isMobileDeviceView && (
        <div className="print:hidden">
          <MobileNav />
        </div>
      )}

      {/* Learner Registration Modal (Admin Only) */}
      {currentUser?.role === 'admin' && (
        <CreateLearnerProfileModal
          isOpen={isCreateProfileOpen}
          onClose={() => setIsCreateProfileOpen(false)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AttendanceProvider>
      <MainLayout />
    </AttendanceProvider>
  );
}
