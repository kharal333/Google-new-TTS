import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { StoredConversion } from '../utils/indexedDB.ts';
import { triggerFileDownload, playChimeFeedback } from '../utils/audioUtils.ts';
import {
  History,
  Play,
  Pause,
  Download,
  Trash2,
  Star,
  Search,
  Filter,
  Cloud,
  FileText,
  Clock,
  CheckCircle2,
  HardDrive,
  Share2,
  ExternalLink,
  Eye,
  X,
  Volume2,
} from 'lucide-react';

export const ConversionDashboard: React.FC = () => {
  const {
    conversions,
    deleteConversion,
    toggleFavorite,
    playTrack,
    pauseTrack,
    currentTrack,
    isPlaying,
    syncConversionToCloud,
    isOnline,
    setIsCloudModalOpen,
    setActiveTab,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'favorites' | 'synced'>('all');
  const [selectedItemForText, setSelectedItemForText] = useState<StoredConversion | null>(null);

  // Filter items
  const filteredConversions = conversions.filter((c) => {
    if (filterType === 'favorites' && !c.isFavorite) return false;
    if (
      filterType === 'synced' &&
      (!c.cloudSync || (!c.cloudSync.googleDrive?.synced && !c.cloudSync.dropbox?.synced))
    )
      return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.characterName.toLowerCase().includes(q) ||
        c.text.toLowerCase().includes(q) ||
        (c.tags && c.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }
    return true;
  });

  const handleDownload = (c: StoredConversion) => {
    if (c.audioBlob) {
      triggerFileDownload(c.audioBlob, `${c.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.${c.format || 'wav'}`);
    } else {
      alert('Audio file data is being prepared from local cache.');
    }
    playChimeFeedback('click');
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Summary Card */}
      <div className="glass-card rounded-2xl p-6 border border-white/10 shadow-xl bg-gradient-to-r from-blue-950/20 via-slate-900/40 to-indigo-950/20 light:from-blue-50 light:to-indigo-50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
                <History className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-extrabold text-slate-100 light:text-slate-900">
                Conversions & Document Archive
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 light:text-slate-600">
              Manage your historical conversions, cloud backups, and offline audio assets.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('studio')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-90 shadow-sm transition-all"
            >
              + New TTS Conversion
            </button>
            <button
              onClick={() => setIsCloudModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-slate-200 transition-all flex items-center gap-1.5 light:bg-slate-100 light:text-slate-800"
            >
              <Cloud className="w-3.5 h-3.5 text-cyan-400" />
              <span>Cloud Storage Hub</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-6 pt-5 border-t border-white/10 light:border-slate-200">
          <div className="md:col-span-7 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search historical records by title, text, character, or format..."
              className="w-full pl-9 pr-4 py-2 rounded-xl glass-input text-xs text-slate-200 placeholder-slate-500 focus:outline-none light:text-slate-900 light:placeholder-slate-400"
            />
          </div>

          <div className="md:col-span-5 flex items-center gap-2">
            {(['all', 'favorites', 'synced'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterType(tab)}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl capitalize transition-all border ${
                  filterType === tab
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 light:bg-indigo-100 light:text-indigo-800'
                    : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white light:bg-slate-100 light:text-slate-700'
                }`}
              >
                {tab === 'all'
                  ? `All (${conversions.length})`
                  : tab === 'favorites'
                  ? `Favorites (${conversions.filter((c) => c.isFavorite).length})`
                  : `Cloud Synced`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conversion Items List */}
      {filteredConversions.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-white/10 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center mx-auto text-slate-400">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-200 light:text-slate-800">No conversions found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto light:text-slate-600">
              {searchQuery
                ? 'Try adjusting your search keywords or active filter.'
                : 'Start your first speech synthesis in the studio to build your audio library.'}
            </p>
          </div>
          <button
            onClick={() => setActiveTab('studio')}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-md transition-all inline-flex items-center gap-1.5"
          >
            <span>Go to Studio</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredConversions.map((conv) => {
            const isThisPlaying = currentTrack?.id === conv.id && isPlaying;

            return (
              <div
                key={conv.id}
                className={`glass-card rounded-2xl p-4 sm:p-5 border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isThisPlaying
                    ? 'border-cyan-400/80 bg-cyan-950/20 shadow-lg shadow-cyan-500/10 light:border-indigo-400 light:bg-indigo-50/50'
                    : 'border-white/10 hover:border-white/20 light:border-slate-200'
                }`}
              >
                {/* Left Info Column */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {/* Play / Pause Toggle Button */}
                  <button
                    onClick={() => {
                      if (isThisPlaying) {
                        pauseTrack();
                      } else {
                        playTrack(conv);
                      }
                    }}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md transition-all ${
                      isThisPlaying
                        ? 'bg-cyan-400 text-slate-950 ring-2 ring-cyan-300 ring-offset-2 ring-offset-slate-950'
                        : 'bg-white/[0.08] hover:bg-white/[0.15] text-slate-200 hover:text-white border border-white/15 light:bg-slate-200 light:text-slate-800'
                    }`}
                    title={isThisPlaying ? 'Pause audio' : 'Play audio'}
                  >
                    {isThisPlaying ? (
                      <Pause className="w-5 h-5 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    )}
                  </button>

                  {/* Metadata */}
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-slate-100 truncate light:text-slate-900">
                        {conv.title}
                      </h3>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.2 rounded-full bg-white/10 text-slate-300 border border-white/10 light:bg-slate-200 light:text-slate-700">
                        {conv.format.toUpperCase()}
                      </span>
                      {conv.cloudSync?.googleDrive?.synced && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Drive
                        </span>
                      )}
                      {conv.cloudSync?.dropbox?.synced && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Dropbox
                        </span>
                      )}
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <HardDrive className="w-2.5 h-2.5" /> Offline Cache
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-1 light:text-slate-600">
                      {conv.text}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                      <span className="text-cyan-400 font-medium">Voice: {conv.characterName}</span>
                      <span>•</span>
                      <span>{conv.durationSeconds}s duration</span>
                      <span>•</span>
                      <span>{conv.characterCount.toLocaleString()} chars</span>
                      <span>•</span>
                      <span>{new Date(conv.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {/* View Full Document Text */}
                  <button
                    onClick={() => setSelectedItemForText(conv)}
                    className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white transition-all light:bg-slate-100 light:text-slate-700"
                    title="View Document Text"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {/* Favorite Toggle */}
                  <button
                    onClick={() => toggleFavorite(conv.id)}
                    className={`p-2 rounded-xl transition-all ${
                      conv.isFavorite
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                        : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white light:bg-slate-100'
                    }`}
                    title={conv.isFavorite ? 'Remove Favorite' : 'Mark Favorite'}
                  >
                    <Star className={`w-4 h-4 ${conv.isFavorite ? 'fill-current' : ''}`} />
                  </button>

                  {/* Cloud Sync Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => syncConversionToCloud(conv.id, 'googleDrive')}
                      className={`px-2 py-1.5 rounded-xl text-xs border transition-all flex items-center gap-1 ${
                        conv.cloudSync?.googleDrive?.synced
                          ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                          : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-slate-300 light:bg-slate-100 light:text-slate-700'
                      }`}
                      title="Save to Google Drive"
                    >
                      <Cloud className="w-3.5 h-3.5 text-blue-400" />
                      <span className="hidden sm:inline">Drive</span>
                    </button>

                    <button
                      onClick={() => syncConversionToCloud(conv.id, 'dropbox')}
                      className={`px-2 py-1.5 rounded-xl text-xs border transition-all flex items-center gap-1 ${
                        conv.cloudSync?.dropbox?.synced
                          ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                          : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-slate-300 light:bg-slate-100 light:text-slate-700'
                      }`}
                      title="Save to Dropbox"
                    >
                      <Cloud className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="hidden sm:inline">Dropbox</span>
                    </button>
                  </div>

                  {/* Download */}
                  <button
                    onClick={() => handleDownload(conv)}
                    className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white transition-all light:bg-slate-100 light:text-slate-700"
                    title={`Download audio file (${conv.format.toUpperCase()})`}
                  >
                    <Download className="w-4 h-4 text-cyan-400" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => {
                      if (confirm(`Delete conversion "${conv.title}"?`)) {
                        deleteConversion(conv.id);
                      }
                    }}
                    className="p-2 rounded-xl bg-white/[0.04] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all"
                    title="Delete Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Document Text Viewer Modal */}
      {selectedItemForText && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl glass-panel rounded-3xl p-6 border border-white/20 shadow-2xl space-y-4 max-h-[85vh] flex flex-col bg-slate-950/95 text-slate-100 light:bg-white/95 light:text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 light:border-slate-200">
              <div>
                <h3 className="font-bold text-base">{selectedItemForText.title}</h3>
                <p className="text-xs text-slate-400">
                  Voice: {selectedItemForText.characterName} •{' '}
                  {selectedItemForText.characterCount.toLocaleString()} Characters
                </p>
              </div>
              <button
                onClick={() => setSelectedItemForText(null)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pr-2 space-y-3">
              <div className="p-4 rounded-2xl glass-input text-sm leading-relaxed text-slate-200 whitespace-pre-wrap light:text-slate-800">
                {selectedItemForText.text}
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between light:border-slate-200">
              <button
                onClick={() => {
                  playTrack(selectedItemForText);
                  setSelectedItemForText(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-400 text-slate-950 hover:bg-cyan-300 flex items-center gap-2 shadow-md"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play Conversion</span>
              </button>

              <button
                onClick={() => setSelectedItemForText(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
