import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { playChimeFeedback } from '../utils/audioUtils.ts';
import {
  Cloud,
  CheckCircle2,
  X,
  Upload,
  Download,
  Folder,
  FileText,
  RefreshCw,
  ExternalLink,
  Shield,
  HardDrive,
  ArrowRight,
} from 'lucide-react';

interface CloudDoc {
  id: string;
  name: string;
  size: string;
  characters: number;
  updatedAt: string;
  content: string;
}

export const CloudStorageModal: React.FC = () => {
  const {
    isCloudModalOpen,
    setIsCloudModalOpen,
    googleDriveConnected,
    setGoogleDriveConnected,
    dropboxConnected,
    setDropboxConnected,
    conversions,
    setActiveTab,
  } = useApp();

  const [activeProvider, setActiveProvider] = useState<'google_drive' | 'dropbox'>('google_drive');
  const [cloudFiles, setCloudFiles] = useState<CloudDoc[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch cloud files from server endpoint
  useEffect(() => {
    if (!isCloudModalOpen) return;
    const fetchCloudFiles = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/cloud/files?provider=${activeProvider}`);
        const data = await res.json();
        setCloudFiles(data.files || []);
      } catch (err) {
        console.warn('Failed to fetch cloud files:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCloudFiles();
  }, [activeProvider, isCloudModalOpen]);

  if (!isCloudModalOpen) return null;

  const handleImportDoc = (doc: CloudDoc) => {
    // Pass document content to Studio editor
    sessionStorage.setItem('auravoice_import_text', doc.content);
    sessionStorage.setItem('auravoice_import_title', doc.name);
    setIsCloudModalOpen(false);
    setActiveTab('studio');
    playChimeFeedback('click');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-3xl glass-panel rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl space-y-6 max-h-[90vh] flex flex-col bg-slate-950/95 text-slate-100 light:bg-white/95 light:text-slate-900">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 light:border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-100 light:text-slate-900">
                Cloud Storage Integration Hub
              </h2>
              <p className="text-xs text-slate-400 light:text-slate-600">
                Import written documents from and save converted audio to Google Drive & Dropbox.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCloudModalOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cloud Providers Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Google Drive Card */}
          <div
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeProvider === 'google_drive'
                ? 'bg-blue-500/15 border-blue-400 ring-1 ring-blue-400/50 light:bg-blue-50'
                : 'bg-white/[0.03] border-white/10 hover:border-white/20 light:bg-slate-100'
            }`}
            onClick={() => setActiveProvider('google_drive')}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                  G
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-100 light:text-slate-900">Google Drive</h4>
                  <p className="text-[11px] text-slate-400">sohailkharal607@gmail.com</p>
                </div>
              </div>

              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  googleDriveConnected
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-500/20 text-slate-400'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                {googleDriveConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            <div className="mt-3 pt-3 border-t border-white/10 text-xs flex justify-between text-slate-400 light:border-slate-200">
              <span>Cloud Storage Used:</span>
              <span className="font-semibold text-slate-200 light:text-slate-800">1.8 GB / 15 GB</span>
            </div>
          </div>

          {/* Dropbox Card */}
          <div
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeProvider === 'dropbox'
                ? 'bg-indigo-500/15 border-indigo-400 ring-1 ring-indigo-400/50 light:bg-indigo-50'
                : 'bg-white/[0.03] border-white/10 hover:border-white/20 light:bg-slate-100'
            }`}
            onClick={() => setActiveProvider('dropbox')}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  D
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-100 light:text-slate-900">Dropbox</h4>
                  <p className="text-[11px] text-slate-400">AuraVoice Pro Sync</p>
                </div>
              </div>

              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  dropboxConnected
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-500/20 text-slate-400'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                {dropboxConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            <div className="mt-3 pt-3 border-t border-white/10 text-xs flex justify-between text-slate-400 light:border-slate-200">
              <span>Cloud Storage Used:</span>
              <span className="font-semibold text-slate-200 light:text-slate-800">420 MB / 2 GB</span>
            </div>
          </div>
        </div>

        {/* Cloud Documents Available to Import */}
        <div className="flex-1 overflow-y-auto space-y-3 min-h-[220px]">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-cyan-400" />
              <span>Available Documents on {activeProvider === 'dropbox' ? 'Dropbox' : 'Google Drive'}</span>
            </h4>
            <span className="text-[11px] text-slate-400">Click to import directly into TTS Studio</span>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
              Syncing documents from {activeProvider}...
            </div>
          ) : cloudFiles.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No documents found in cloud directory.</div>
          ) : (
            <div className="space-y-2">
              {cloudFiles.map((file) => (
                <div
                  key={file.id}
                  className="p-3.5 rounded-xl glass-card border border-white/10 hover:border-cyan-400/50 transition-all flex items-center justify-between gap-3 group light:border-slate-200"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-slate-200 truncate group-hover:text-cyan-300 light:text-slate-800">
                        {file.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {file.size} • {file.characters.toLocaleString()} characters
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleImportDoc(file)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.08] hover:bg-cyan-500 hover:text-slate-950 text-slate-200 transition-all flex items-center gap-1 shrink-0 light:bg-slate-200 light:text-slate-800"
                  >
                    <span>Import to Studio</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 light:border-slate-200">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>End-to-end tokenized cloud authorization</span>
          </span>

          <button
            onClick={() => setIsCloudModalOpen(false)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-slate-200"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
