/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { TextStudio } from './components/TextStudio.tsx';
import { ConversionDashboard } from './components/ConversionDashboard.tsx';
import { CharacterVoiceSelector } from './components/CharacterVoiceSelector.tsx';
import { AnalyticsDashboard } from './components/AnalyticsDashboard.tsx';
import { FloatingAudioPlayer } from './components/FloatingAudioPlayer.tsx';
import { CloudStorageModal } from './components/CloudStorageModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';

const AppContent: React.FC = () => {
  const { activeTab, togglePlayPause, seekTrack, currentTime, duration, isCloudModalOpen, setIsCloudModalOpen, isAuthModalOpen, setIsAuthModalOpen } = useApp();

  // Global Accessible Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is actively editing text in textarea or input
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        seekTrack(Math.max(0, currentTime - 5));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        seekTrack(Math.min(duration || 100, currentTime + 5));
      } else if (e.code === 'Escape') {
        if (isCloudModalOpen) setIsCloudModalOpen(false);
        if (isAuthModalOpen) setIsAuthModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause, seekTrack, currentTime, duration, isCloudModalOpen, isAuthModalOpen]);

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-slate-950 text-slate-100 transition-colors dark:bg-slate-950 dark:text-slate-100 light:bg-slate-50 light:text-slate-900 pb-28">
      {/* Dynamic Ambient Background Glass Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Top Left Cyan Orb */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-cyan-500/15 blur-[120px] animate-ambient-slow" />
        {/* Top Right Purple Orb */}
        <div className="absolute top-10 -right-32 w-[30rem] h-[30rem] rounded-full bg-purple-600/15 blur-[140px] animate-ambient-slow" style={{ animationDelay: '-4s' }} />
        {/* Bottom Left Indigo Orb */}
        <div className="absolute bottom-20 -left-20 w-80 h-80 rounded-full bg-indigo-500/12 blur-[100px] animate-ambient-slow" style={{ animationDelay: '-8s' }} />
        {/* Center Pink Highlight */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[34rem] h-[34rem] rounded-full bg-pink-500/8 blur-[150px] pointer-events-none" />
      </div>

      {/* Main Content Hierarchy */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {activeTab === 'studio' && <TextStudio />}
          {activeTab === 'dashboard' && <ConversionDashboard />}
          {activeTab === 'voices' && <CharacterVoiceSelector />}
          {activeTab === 'analytics' && <AnalyticsDashboard />}
          {activeTab === 'cloud' && (
            <div className="space-y-6">
              <ConversionDashboard />
            </div>
          )}
        </main>

        {/* Global Persistent Sticky Player */}
        <FloatingAudioPlayer />

        {/* Modals */}
        <CloudStorageModal />
        <AuthModal />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
