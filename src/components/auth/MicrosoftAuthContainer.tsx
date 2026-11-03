import React, { useState } from 'react';
import { MicrosoftLearnerLogin } from './MicrosoftLearnerLogin';
import { MicrosoftLearnerRegister } from './MicrosoftLearnerRegister';
import { MicrosoftAdminLogin } from './MicrosoftAdminLogin';

type AuthView = 'login' | 'register' | 'admin';

export const MicrosoftAuthContainer: React.FC = () => {
  const [currentView, setCurrentView] = useState<AuthView>('login');

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col justify-between items-center p-4 selection:bg-[#F4B52C] selection:text-[#2F3E96]">
      {/* Top spacing */}
      <div className="w-full h-8" />

      {/* Main Centered Authentication Card */}
      <div className="w-full flex flex-col items-center justify-center my-auto">
        {currentView === 'login' && (
          <MicrosoftLearnerLogin
            onGoToRegister={() => setCurrentView('register')}
            onGoToAdmin={() => setCurrentView('admin')}
          />
        )}

        {currentView === 'register' && (
          <MicrosoftLearnerRegister
            onGoToLogin={() => setCurrentView('login')}
          />
        )}

        {currentView === 'admin' && (
          <MicrosoftAdminLogin
            onGoToLearnerLogin={() => setCurrentView('login')}
          />
        )}
      </div>

      {/* Microsoft-Style Subtle Enterprise Footer */}
      <footer className="w-full max-w-[440px] text-center py-4 text-[11px] text-slate-500 space-x-3">
        <span>Terms of use</span>
        <span>·</span>
        <span>Privacy & cookies</span>
        <span>·</span>
        <span>DynamicDNA (Pty) Ltd</span>
      </footer>
    </div>
  );
};
