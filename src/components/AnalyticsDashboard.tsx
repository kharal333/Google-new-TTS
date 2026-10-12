import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Sparkles,
  Volume2,
  HardDrive,
  Users,
  CheckCircle2,
  PieChart,
  Activity,
  Layers,
} from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  const { conversions, user } = useApp();

  const totalChars = conversions.reduce((acc, c) => acc + c.characterCount, 0);
  const totalSeconds = conversions.reduce((acc, c) => acc + c.durationSeconds, 0);
  const totalMinutes = (totalSeconds / 60).toFixed(1);
  const totalWords = conversions.reduce((acc, c) => acc + c.wordCount, 0);

  // Group by character voice
  const voiceCounts: Record<string, number> = {};
  conversions.forEach((c) => {
    voiceCounts[c.characterName] = (voiceCounts[c.characterName] || 0) + 1;
  });

  const sortedVoices = Object.entries(voiceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Format ratio
  const wavCount = conversions.filter((c) => c.format === 'wav').length;
  const mp3Count = conversions.filter((c) => c.format === 'mp3').length;

  // Cloud sync percentage
  const syncedCount = conversions.filter(
    (c) => c.cloudSync?.googleDrive?.synced || c.cloudSync?.dropbox?.synced
  ).length;
  const syncRate = conversions.length > 0 ? Math.round((syncedCount / conversions.length) * 100) : 0;

  // Simulated activity distribution over recent 7 days
  const weeklyData = [
    { day: 'Mon', chars: 14200, count: 3 },
    { day: 'Tue', chars: 22400, count: 5 },
    { day: 'Wed', chars: 18900, count: 4 },
    { day: 'Thu', chars: 31200, count: 7 },
    { day: 'Fri', chars: 26800, count: 6 },
    { day: 'Sat', chars: 12500, count: 2 },
    { day: 'Sun', chars: totalChars > 20000 ? 19500 : 8400, count: conversions.length },
  ];
  const maxWeeklyChars = Math.max(...weeklyData.map((d) => d.chars));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-2xl p-6 border border-white/10 shadow-xl bg-gradient-to-r from-emerald-950/20 via-slate-900/40 to-teal-950/20 light:from-emerald-50 light:to-teal-50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <BarChart3 className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-extrabold text-slate-100 light:text-slate-900">
                Performance & Usage Analytics
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 light:text-slate-600">
              Real-time metrics tracking character conversion volumes, voice preferences, and audio exports.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-slate-300 light:bg-slate-100 light:text-slate-700">
              Account: <strong className="text-cyan-400">{user?.plan || 'Pro Tier'}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Characters */}
        <div className="glass-card rounded-2xl p-5 border border-white/10 space-y-2 light:border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Characters</span>
            <span className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-100 light:text-slate-900">
            {totalChars.toLocaleString()}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>20,000 max / request limit</span>
          </div>
        </div>

        {/* Audio Minutes Generated */}
        <div className="glass-card rounded-2xl p-5 border border-white/10 space-y-2 light:border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Audio Produced</span>
            <span className="p-2 rounded-xl bg-purple-500/15 text-purple-400">
              <Volume2 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-100 light:text-slate-900">
            {totalMinutes} <span className="text-sm font-normal text-slate-400">mins</span>
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{totalSeconds} total seconds</span>
          </div>
        </div>

        {/* Document Words Processed */}
        <div className="glass-card rounded-2xl p-5 border border-white/10 space-y-2 light:border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Words Synthesized</span>
            <span className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-100 light:text-slate-900">
            {totalWords.toLocaleString()}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-cyan-400">
            <Activity className="w-3.5 h-3.5" />
            <span>Across {conversions.length} documents</span>
          </div>
        </div>

        {/* Cloud Sync Backup Rate */}
        <div className="glass-card rounded-2xl p-5 border border-white/10 space-y-2 light:border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Cloud Backup Rate</span>
            <span className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
              <HardDrive className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-100 light:text-slate-900">
            {syncRate}%
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-blue-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Drive & Dropbox active</span>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Character Volume Activity Chart (7 Cols) */}
        <div className="lg:col-span-7 glass-card rounded-2xl p-6 border border-white/10 space-y-5 shadow-xl light:border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-100 light:text-slate-900">Weekly Synthesis Volume</h3>
              <p className="text-xs text-slate-400 light:text-slate-600">Daily characters converted to natural speech</p>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400 px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              7-Day Trend
            </span>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-52 flex items-end justify-between gap-3 pt-6 pb-2">
            {weeklyData.map((d, idx) => {
              const heightPercent = Math.max(15, Math.round((d.chars / maxWeeklyChars) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {(d.chars / 1000).toFixed(1)}k
                  </span>
                  <div className="w-full bg-white/[0.04] rounded-xl h-36 flex items-end p-1 light:bg-slate-100">
                    <div
                      className="w-full rounded-lg bg-gradient-to-t from-cyan-500 to-indigo-500 group-hover:from-cyan-400 group-hover:to-purple-400 transition-all duration-300"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-300 light:text-slate-700">{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Favorite Voice Personas & Format Ratio (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Top Characters */}
          <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-4 shadow-xl light:border-slate-200">
            <h3 className="font-bold text-sm text-slate-100 light:text-slate-900">Top Character Voices Used</h3>
            <div className="space-y-3">
              {sortedVoices.map(([voiceName, count], idx) => {
                const pct = Math.round((count / conversions.length) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-200 light:text-slate-800">{voiceName}</span>
                      <span className="font-mono text-cyan-400 font-bold">{count} conversions ({pct}%)</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden light:bg-slate-200">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Export Formats Breakdown */}
          <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-3 shadow-xl light:border-slate-200">
            <h3 className="font-bold text-sm text-slate-100 light:text-slate-900">Audio Format Distribution</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1 light:bg-slate-100">
                <p className="text-xs text-slate-400">WAV Lossless</p>
                <p className="text-xl font-bold text-cyan-400">{wavCount}</p>
                <p className="text-[10px] text-slate-500">24kHz Master Quality</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1 light:bg-slate-100">
                <p className="text-xs text-slate-400">MP3 Compressed</p>
                <p className="text-xl font-bold text-indigo-400">{mp3Count}</p>
                <p className="text-[10px] text-slate-500">Portable & Mobile</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
