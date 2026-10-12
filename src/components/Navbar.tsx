import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  Volume2,
  Sparkles,
  Sun,
  Moon,
  Wifi,
  WifiOff,
  Cloud,
  BarChart3,
  History,
  Mic,
  Sliders,
  User,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Eye,
  Type,
  CheckCircle2,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    theme,
    toggleTheme,
    dyslexicFont,
    setDyslexicFont,
    highContrast,
    setHighContrast,
    audioFeedbackEnabled,
    setAudioFeedbackEnabled,
    isOnline,
    user,
    logoutUser,
    setIsAuthModalOpen,
    activeTab,
    setActiveTab,
    selectedVoice,
    googleDriveConnected,
    dropboxConnected,
    setIsCloudModalOpen,
  } = useApp();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAccessibilityMenuOpen, setIsAccessibilityMenuOpen] = useState(false);

  const navItems = [
    { id: 'studio', label: 'Studio TTS', icon: Sparkles, badge: '20k chars' },
    { id: 'dashboard', label: 'Conversions', icon: History, count: true },
    { id: 'voices', label: '20 Voices', icon: Mic, badge: 'Gemini' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'cloud', label: 'Cloud Sync', icon: Cloud },
  ] as const;

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/70 border-b border-white/10 transition-colors dark:bg-slate-950/75 light:bg-white/80 light:border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('studio')}
              className="flex items-center gap-3 group text-left focus:outline-none"
            >
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-indigo-500 to-purple-600 p-[1px] shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-slate-950/80 rounded-[11px] flex items-center justify-center backdrop-blur-sm light:bg-white/90">
                  <Volume2 className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300 transition-colors animate-pulse" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent light:from-cyan-600 light:to-purple-700">
                    AuraVoice
                  </span>
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    Gemini TTS
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block light:text-slate-600">
                  Accessible Document & Character Voice Studio
                </p>
              </div>
            </button>

            {/* Offline / Online Pill */}
            <div
              className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-md border transition-all ${
                isOnline
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 light:bg-emerald-50 light:border-emerald-200 light:text-emerald-700'
                  : 'bg-amber-500/15 border-amber-500/35 text-amber-300 animate-pulse light:bg-amber-50 light:border-amber-300 light:text-amber-800'
              }`}
              title={isOnline ? 'Online: Direct Gemini API pipeline active' : 'Offline Mode: Stored audio and local synthesis engine active'}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>Offline Mode</span>
                </>
              )}
            </div>
          </div>

          {/* Desktop Nav Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-white/[0.03] p-1.5 rounded-2xl border border-white/10 backdrop-blur-md light:bg-slate-100/80 light:border-slate-200">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm light:bg-white light:text-indigo-600 light:border-slate-300 light:shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.05] light:text-slate-600 light:hover:text-slate-900 light:hover:bg-white/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400 light:text-indigo-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {'badge' in item && item.badge && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/20 light:bg-indigo-50 light:text-indigo-600">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-2">
            {/* Quick Selected Character Pill */}
            <button
              onClick={() => setActiveTab('voices')}
              className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all light:bg-slate-100 light:border-slate-200"
              title="Current Active Character Voice"
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                style={{ backgroundColor: selectedVoice.accentHex }}
              >
                {selectedVoice.name.charAt(0)}
              </div>
              <span className="font-medium text-slate-200 light:text-slate-800">{selectedVoice.name}</span>
              <span className="text-[10px] text-slate-400 capitalize">({selectedVoice.gender})</span>
            </button>

            {/* Cloud Sync Quick Indicator */}
            <button
              onClick={() => setIsCloudModalOpen(true)}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/10 transition-all light:text-slate-600 light:hover:bg-slate-100"
              title="Cloud Storage Management (Google Drive & Dropbox)"
            >
              <div className="relative">
                <Cloud className="w-4 h-4" />
                {(googleDriveConnected || dropboxConnected) && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
                )}
              </div>
            </button>

            {/* Accessibility Options Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsAccessibilityMenuOpen(!isAccessibilityMenuOpen)}
                className={`p-2 rounded-xl border transition-all ${
                  dyslexicFont || highContrast
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.06] border-transparent hover:border-white/10 light:text-slate-600'
                }`}
                title="Accessibility Preferences (Dyslexia Font, Contrast, Voice Feedback)"
              >
                <Sliders className="w-4 h-4" />
              </button>

              {isAccessibilityMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl glass-panel p-4 z-50 shadow-2xl border border-white/15 bg-slate-950/90 text-slate-200 light:bg-white/95 light:text-slate-800 light:border-slate-200">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10 light:border-slate-200">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Accessibility Studio</span>
                    <button
                      onClick={() => setIsAccessibilityMenuOpen(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <label className="flex items-center justify-between cursor-pointer p-1.5 rounded-lg hover:bg-white/[0.05]">
                      <div className="flex items-center gap-2">
                        <Type className="w-4 h-4 text-cyan-400" />
                        <div>
                          <p className="font-semibold">Dyslexia-Friendly Font</p>
                          <p className="text-[10px] text-slate-400">Lexend high-legibility typeface</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={dyslexicFont}
                        onChange={(e) => setDyslexicFont(e.target.checked)}
                        className="rounded accent-cyan-500 w-4 h-4"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer p-1.5 rounded-lg hover:bg-white/[0.05]">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-purple-400" />
                        <div>
                          <p className="font-semibold">High Contrast Borders</p>
                          <p className="text-[10px] text-slate-400">Sharpen element definition</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={highContrast}
                        onChange={(e) => setHighContrast(e.target.checked)}
                        className="rounded accent-purple-500 w-4 h-4"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer p-1.5 rounded-lg hover:bg-white/[0.05]">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-emerald-400" />
                        <div>
                          <p className="font-semibold">Voice UI Audio Feedback</p>
                          <p className="text-[10px] text-slate-400">Acoustic chimes & voice cues</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={audioFeedbackEnabled}
                        onChange={(e) => setAudioFeedbackEnabled(e.target.checked)}
                        className="rounded accent-emerald-500 w-4 h-4"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/10 transition-all light:text-slate-600 light:hover:bg-slate-100"
              title={theme === 'dark' ? 'Switch to Pearlescent Light Glass' : 'Switch to Obsidian Dark Glass'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            {/* User Profile / Auth Button */}
            <div className="relative">
              {user ? (
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1.5 pr-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all light:bg-slate-100 light:border-slate-200"
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                    {user.avatar}
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-sm hover:opacity-90 transition-opacity"
                >
                  Sign In
                </button>
              )}

              {isUserMenuOpen && user && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl glass-panel p-3.5 z-50 shadow-2xl border border-white/15 bg-slate-950/95 text-slate-200 light:bg-white/95 light:text-slate-800 light:border-slate-200">
                  <div className="pb-3 border-b border-white/10 light:border-slate-200">
                    <p className="font-bold text-sm text-white light:text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      {user.plan}
                    </div>
                  </div>

                  <div className="py-2.5 text-xs space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span>Per-request Limit:</span>
                      <span className="font-semibold text-slate-200 light:text-slate-800">20,000 Chars</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Cloud Sync:</span>
                      <span className="text-emerald-400 font-medium">Drive + Dropbox</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      logoutUser();
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full mt-2 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/10 light:text-slate-700"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="lg:hidden glass-panel border-t border-white/10 px-4 pt-3 pb-5 space-y-2 bg-slate-950/95 light:bg-white/95">
          <div className="grid grid-cols-2 gap-2 pb-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2.5 p-3 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/25 to-indigo-500/25 text-cyan-300 border border-cyan-500/40 light:bg-indigo-50 light:text-indigo-600'
                      : 'bg-white/[0.03] text-slate-300 hover:bg-white/[0.08] light:bg-slate-100 light:text-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4 text-cyan-400" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span>Status: {isOnline ? 'Online (Gemini API)' : 'Offline (Local Storage)'}</span>
            <button
              onClick={() => {
                setIsCloudModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="text-cyan-400 hover:underline"
            >
              Cloud Storage Manager
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
