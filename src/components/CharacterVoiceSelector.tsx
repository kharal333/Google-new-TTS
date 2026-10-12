import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { CharacterVoice, CHARACTER_VOICES } from '../data/characters.ts';
import {
  Mic,
  Volume2,
  CheckCircle2,
  Sparkles,
  Users,
  Search,
  Filter,
  Play,
  Award,
} from 'lucide-react';

export const CharacterVoiceSelector: React.FC = () => {
  const { selectedVoice, setSelectedVoice, playVoiceFeedback, setActiveTab } = useApp();
  const [genderFilter, setGenderFilter] = useState<'all' | 'female' | 'male'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  const categories = ['all', 'Narrative', 'Professional', 'Casual', 'Calm', 'Dramatic', 'Character'];

  const filteredVoices = CHARACTER_VOICES.filter((voice) => {
    if (genderFilter !== 'all' && voice.gender !== genderFilter) return false;
    if (categoryFilter !== 'all' && voice.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        voice.name.toLowerCase().includes(q) ||
        voice.title.toLowerCase().includes(q) ||
        voice.bio.toLowerCase().includes(q) ||
        voice.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const femaleCount = CHARACTER_VOICES.filter((v) => v.gender === 'female').length;
  const maleCount = CHARACTER_VOICES.filter((v) => v.gender === 'male').length;

  const handleSelectAndActivate = (voice: CharacterVoice) => {
    setSelectedVoice(voice);
    playVoiceFeedback(voice, 'welcome');
  };

  const handlePreviewVoice = (e: React.MouseEvent, voice: CharacterVoice) => {
    e.stopPropagation();
    setPreviewingId(voice.id);
    playVoiceFeedback(voice, 'welcome');
    setTimeout(() => {
      setPreviewingId(null);
    }, 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Overview */}
      <div className="glass-card rounded-2xl p-6 border border-white/10 shadow-xl bg-gradient-to-r from-purple-950/20 via-slate-900/40 to-cyan-950/20 light:from-purple-50 light:to-cyan-50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
                <Mic className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-extrabold text-slate-100 light:text-slate-900">
                20 Gemini AI Character Voices
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 light:text-slate-600">
              Personalized vocal personas engineered with Google Gemini TTS. Select a voice for real-time speech feedback across the studio.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 font-semibold">
              {femaleCount} Female Personas
            </span>
            <span className="text-xs px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 font-semibold">
              {maleCount} Male Personas
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-6 pt-5 border-t border-white/10 light:border-slate-200">
          {/* Search Box */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 20 characters by name, style, or genre..."
              className="w-full pl-9 pr-4 py-2 rounded-xl glass-input text-xs text-slate-200 placeholder-slate-500 focus:outline-none light:text-slate-900 light:placeholder-slate-400"
            />
          </div>

          {/* Gender Buttons */}
          <div className="md:col-span-3 flex items-center gap-1.5">
            {(['all', 'female', 'male'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGenderFilter(g)}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl capitalize transition-all border ${
                  genderFilter === g
                    ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-cyan-500/50 text-cyan-300 shadow-sm light:bg-indigo-100 light:text-indigo-800'
                    : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white light:bg-slate-100 light:text-slate-700'
                }`}
              >
                {g === 'all' ? 'All (20)' : g}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <div className="md:col-span-4 flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-2 text-xs font-semibold rounded-xl whitespace-nowrap capitalize transition-all border ${
                  categoryFilter === cat
                    ? 'bg-purple-500/20 border-purple-400 text-purple-300 light:bg-purple-100 light:text-purple-800'
                    : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white light:bg-slate-100 light:text-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of 20 Character Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredVoices.map((voice) => {
          const isSelected = selectedVoice.id === voice.id;
          const isPreviewing = previewingId === voice.id;

          return (
            <div
              key={voice.id}
              onClick={() => handleSelectAndActivate(voice)}
              className={`group relative glass-card rounded-2xl p-5 border cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                isSelected
                  ? 'border-cyan-400/80 bg-cyan-950/20 shadow-xl shadow-cyan-500/15 ring-1 ring-cyan-400/50 light:border-indigo-500 light:bg-indigo-50/50'
                  : 'border-white/10 hover:border-white/25 hover:-translate-y-1 light:border-slate-200'
              }`}
            >
              {/* Top Row: Avatar & Gender */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="relative">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-base shadow-lg transition-transform group-hover:scale-105"
                      style={{ backgroundColor: voice.accentHex }}
                    >
                      {voice.name.charAt(0)}
                    </div>
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center ring-2 ring-slate-950">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                        voice.gender === 'female'
                          ? 'bg-pink-500/10 text-pink-300 border-pink-500/30'
                          : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                      }`}
                    >
                      {voice.gender}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">Gemini {voice.baseVoice}</span>
                  </div>
                </div>

                {/* Name & Title */}
                <h3 className="font-bold text-sm text-slate-100 group-hover:text-cyan-300 transition-colors light:text-slate-900 light:group-hover:text-indigo-600">
                  {voice.name}
                </h3>
                <p className="text-xs text-cyan-400 font-medium line-clamp-1 mb-2 light:text-indigo-600">
                  {voice.title}
                </p>

                {/* Bio */}
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-3 light:text-slate-600">
                  {voice.bio}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {voice.tags.slice(0, 3).map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-300 border border-white/5 light:bg-slate-100 light:text-slate-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Action Buttons */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 light:border-slate-200">
                <button
                  type="button"
                  onClick={(e) => handlePreviewVoice(e, voice)}
                  className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                    isPreviewing
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 animate-pulse'
                      : 'bg-white/[0.05] hover:bg-white/[0.1] border-white/10 text-slate-200 light:bg-slate-100 light:text-slate-800'
                  }`}
                  title="Listen to sample audio"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{isPreviewing ? 'Playing...' : 'Hear Voice'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedVoice(voice);
                    playVoiceFeedback(voice, 'welcome');
                    setActiveTab('studio');
                  }}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-cyan-400 text-slate-950 shadow-md'
                      : 'bg-white/[0.05] hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 light:bg-slate-100 light:text-slate-700'
                  }`}
                >
                  {isSelected ? 'Active' : 'Use'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
