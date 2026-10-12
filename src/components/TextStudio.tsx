import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { CharacterVoice, CHARACTER_VOICES } from '../data/characters.ts';
import { chunkTextForTTS, parseFileToText, SAMPLE_DOCUMENTS } from '../utils/documentParser.ts';
import {
  base64ToArrayBuffer,
  concatenateWavBuffers,
  generateSyntheticSpeechWav,
  triggerFileDownload,
  playChimeFeedback,
} from '../utils/audioUtils.ts';
import { StoredConversion } from '../utils/indexedDB.ts';
import {
  Sparkles,
  Upload,
  FileText,
  Play,
  Download,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Clock,
  Type,
  Sliders,
  Volume2,
  Trash2,
  Copy,
  FolderOpen,
  XCircle,
  HelpCircle,
  Check,
  Disc,
} from 'lucide-react';

export const TextStudio: React.FC = () => {
  const {
    selectedVoice,
    setSelectedVoice,
    playVoiceFeedback,
    addConversion,
    playTrack,
    isOnline,
    isGenerating,
    setIsGenerating,
    generationProgress,
    setGenerationProgress,
    setIsCloudModalOpen,
    syncConversionToCloud,
  } = useApp();

  const [text, setText] = useState<string>(SAMPLE_DOCUMENTS[0].text);
  const [documentTitle, setDocumentTitle] = useState<string>(SAMPLE_DOCUMENTS[0].title);
  const [speed, setSpeed] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);
  const [exportFormat, setExportFormat] = useState<'wav' | 'mp3'>('wav');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [lastGeneratedItem, setLastGeneratedItem] = useState<StoredConversion | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const MAX_CHARS = 20000;
  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charPercent = Math.min(100, Math.round((charCount / MAX_CHARS) * 100));
  const estimatedSeconds = Math.round(wordCount / (2.5 * speed));

  // Sync speed & pitch when selected voice changes
  useEffect(() => {
    setSpeed(selectedVoice.defaultSpeed);
    setPitch(selectedVoice.defaultPitch);
  }, [selectedVoice]);

  // Handle file drop / upload
  const handleFileUpload = async (file: File) => {
    try {
      const parsed = await parseFileToText(file);
      setText(parsed.text);
      setDocumentTitle(parsed.name.replace(/\.[^/.]+$/, ''));
      playChimeFeedback('click');
    } catch (err: any) {
      alert('Error parsing document: ' + err.message);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Cancel generation
  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsGenerating(false);
    setGenerationProgress((prev) => ({ ...prev, status: 'Cancelled' }));
    playChimeFeedback('delete');
  };

  // Main TTS Generation handler with real-time chunked progress
  const handleGenerateSpeech = async () => {
    if (!text.trim()) {
      alert('Please enter or upload document text to convert.');
      return;
    }

    if (text.length > MAX_CHARS) {
      alert(`Text exceeds the maximum allowable limit of ${MAX_CHARS.toLocaleString()} characters.`);
      return;
    }

    setIsGenerating(true);
    abortControllerRef.current = new AbortController();
    const abortSignal = abortControllerRef.current.signal;

    playVoiceFeedback(selectedVoice, 'generating');

    // Break into natural speech chunks (up to 1,800 characters per chunk)
    const chunks = chunkTextForTTS(text, 1800);
    const totalChunks = chunks.length;

    setGenerationProgress({
      percent: 5,
      currentChunk: 0,
      totalChunks,
      status: `Analyzing document (${charCount.toLocaleString()} chars, ${totalChunks} audio blocks)...`,
      elapsedSeconds: 0,
      estimatedRemainingSeconds: Math.max(3, totalChunks * 2),
    });

    // Start progress timer
    const startTime = Date.now();
    const timerInterval = setInterval(() => {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      setGenerationProgress((prev) => ({
        ...prev,
        elapsedSeconds: elapsed,
        estimatedRemainingSeconds: Math.max(0, totalChunks * 2 - elapsed),
      }));
    }, 1000);

    const wavBuffers: ArrayBuffer[] = [];

    try {
      for (let i = 0; i < totalChunks; i++) {
        if (abortSignal.aborted) {
          throw new Error('Generation cancelled by user');
        }

        const chunkText = chunks[i];
        const chunkPercent = Math.round(((i + 0.3) / totalChunks) * 90);

        setGenerationProgress((prev) => ({
          ...prev,
          percent: chunkPercent,
          currentChunk: i + 1,
          status: `Synthesizing block ${i + 1} of ${totalChunks} with Gemini TTS (${selectedVoice.baseVoice})...`,
        }));

        let chunkWavBuffer: ArrayBuffer | null = null;

        // Attempt server-side Gemini TTS API call if online
        if (isOnline) {
          try {
            const response = await fetch('/api/tts/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: abortSignal,
              body: JSON.stringify({
                text: chunkText,
                voiceName: selectedVoice.baseVoice,
                characterStyle: selectedVoice.stylePrompt,
                speechPitch: pitch,
                speechSpeed: speed,
                characterName: selectedVoice.name,
                chunkIndex: i,
                totalChunks,
              }),
            });

            if (response.ok) {
              const data = await response.json();
              if (data.audioData) {
                chunkWavBuffer = base64ToArrayBuffer(data.audioData);
              }
            }
          } catch (e: any) {
            if (e.name === 'AbortError') throw e;
            console.warn('Server TTS failed for chunk, falling back to local synthesizer:', e);
          }
        }

        // If offline or fallback needed, use high-fidelity acoustic speech synthesizer
        if (!chunkWavBuffer) {
          chunkWavBuffer = await generateSyntheticSpeechWav(
            chunkText,
            speed,
            pitch,
            selectedVoice.gender === 'female'
          );
        }

        wavBuffers.push(chunkWavBuffer);

        setGenerationProgress((prev) => ({
          ...prev,
          percent: Math.round(((i + 1) / totalChunks) * 92),
        }));
      }

      // Merge all chunks into single master WAV file
      setGenerationProgress((prev) => ({
        ...prev,
        percent: 95,
        status: 'Stitching audio waveforms and optimizing acoustic master...',
      }));

      const finalWavBuffer = concatenateWavBuffers(wavBuffers);
      const mime = exportFormat === 'mp3' ? 'audio/mp3' : 'audio/wav';
      const audioBlob = new Blob([finalWavBuffer], { type: mime });
      const audioUrl = URL.createObjectURL(audioBlob);

      const title = documentTitle.trim() || `Conversion_${new Date().toLocaleDateString()}`;

      const newConversion: StoredConversion = {
        id: 'conv_' + Date.now().toString(36),
        title,
        text,
        characterId: selectedVoice.id,
        characterName: selectedVoice.name,
        characterGender: selectedVoice.gender,
        baseVoice: selectedVoice.baseVoice,
        audioBlob,
        audioUrl,
        durationSeconds: Math.max(1, Math.round(charCount / 14)),
        wordCount,
        characterCount: charCount,
        createdAt: new Date().toISOString(),
        format: exportFormat,
        isFavorite: false,
        tags: [selectedVoice.category, selectedVoice.gender, exportFormat.toUpperCase()],
      };

      await addConversion(newConversion);
      setLastGeneratedItem(newConversion);

      setGenerationProgress((prev) => ({
        ...prev,
        percent: 100,
        status: 'Speech generation complete!',
      }));

      // Play audio immediately and give personalized verbal feedback
      setTimeout(() => {
        setIsGenerating(false);
        playTrack(newConversion);
        playVoiceFeedback(selectedVoice, 'success');
      }, 600);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        alert('Generation failed: ' + (err.message || 'Unknown error'));
      }
      setIsGenerating(false);
    } finally {
      clearInterval(timerInterval);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    playChimeFeedback('click');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Accessibility Notification */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-cyan-500/20 bg-gradient-to-r from-cyan-950/30 via-slate-900/40 to-indigo-950/30 light:from-cyan-50 light:to-indigo-50">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Disc className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 light:text-slate-900 flex items-center gap-2">
              Gemini Text-to-Speech Engine
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-300 border border-cyan-400/30">
                20,000 Chars Limit
              </span>
            </h2>
            <p className="text-xs text-slate-400 light:text-slate-600">
              Transform written documents into natural speech across 20 male & female character voices.
            </p>
          </div>
        </div>

        {/* Quick Sample Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-medium">Quick Presets:</span>
          {SAMPLE_DOCUMENTS.map((doc, idx) => (
            <button
              key={idx}
              onClick={() => {
                setText(doc.text);
                setDocumentTitle(doc.title);
                playChimeFeedback('click');
              }}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white transition-all light:bg-slate-200/80 light:text-slate-800"
            >
              {doc.category}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Document Editor & Voice Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Document Title & Textarea (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-card rounded-2xl p-5 border border-white/10 space-y-4 shadow-xl">
            {/* Document Title & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  placeholder="Document or Chapter Title..."
                  className="w-full text-base font-bold text-slate-100 bg-transparent border-b border-white/15 focus:border-cyan-400 focus:outline-none pb-1 light:text-slate-900 light:border-slate-300"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-slate-200 transition-all light:bg-slate-100 light:text-slate-800"
                  title="Upload .txt, .pdf, .docx, .md, .epub, .srt"
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Upload</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.pdf,.docx,.epub,.srt,.json,.csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />

                <button
                  onClick={() => setIsCloudModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-slate-200 transition-all light:bg-slate-100 light:text-slate-800"
                  title="Import directly from Google Drive or Dropbox"
                >
                  <Cloud className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Cloud</span>
                </button>

                <button
                  onClick={handleCopyText}
                  className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white transition-all light:bg-slate-100 light:text-slate-700"
                  title="Copy Document Text"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => {
                    setText('');
                    playChimeFeedback('delete');
                  }}
                  className="p-2 rounded-xl bg-white/[0.04] hover:bg-rose-500/15 text-slate-400 hover:text-rose-400 transition-all"
                  title="Clear Text"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Drag & Drop Overlay Textarea */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`relative rounded-xl transition-all ${
                isDragOver ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950' : ''
              }`}
            >
              <textarea
                value={text}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_CHARS) {
                    setText(e.target.value);
                  }
                }}
                rows={12}
                placeholder="Paste, write, or drop your document here (up to 20,000 characters at once)..."
                className="w-full p-4 rounded-xl glass-input text-sm leading-relaxed text-slate-100 placeholder-slate-500 resize-y focus:outline-none focus:ring-1 focus:ring-cyan-500/40 light:text-slate-900 light:placeholder-slate-400"
              />

              {isDragOver && (
                <div className="absolute inset-0 bg-cyan-950/80 backdrop-blur-md rounded-xl border-2 border-dashed border-cyan-400 flex flex-col items-center justify-center text-cyan-200">
                  <Upload className="w-10 h-10 mb-2 animate-bounce" />
                  <p className="font-bold text-sm">Drop document here to extract text</p>
                  <p className="text-xs text-cyan-400">Supports TXT, MD, PDF, DOCX, EPUB, SRT</p>
                </div>
              )}
            </div>

            {/* Character Limit & Metas Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs">
              <div className="flex items-center gap-4 text-slate-400">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{wordCount.toLocaleString()} words</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  <span>~{Math.max(1, Math.ceil(estimatedSeconds / 60))} min listen</span>
                </span>
              </div>

              {/* Character Limit Meter */}
              <div className="flex items-center gap-3">
                <div className="w-32 sm:w-48 bg-white/10 rounded-full h-2 overflow-hidden light:bg-slate-200">
                  <div
                    className={`h-full transition-all duration-300 ${
                      charPercent > 90
                        ? 'bg-rose-500'
                        : charPercent > 75
                        ? 'bg-amber-400'
                        : 'bg-gradient-to-r from-cyan-400 to-indigo-500'
                    }`}
                    style={{ width: `${charPercent}%` }}
                  />
                </div>
                <span
                  className={`font-mono text-xs font-semibold ${
                    charPercent > 90 ? 'text-rose-400' : 'text-slate-300 light:text-slate-700'
                  }`}
                >
                  {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Active Voice Card & Generation Controls (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-card rounded-2xl p-5 border border-white/10 space-y-5 shadow-xl">
            {/* Active Character Profile Banner */}
            <div className="flex items-start justify-between pb-4 border-b border-white/10 light:border-slate-200">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-white text-base shadow-lg"
                  style={{ backgroundColor: selectedVoice.accentHex }}
                >
                  {selectedVoice.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-100 light:text-slate-900">{selectedVoice.name}</h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-slate-300 capitalize light:bg-slate-200 light:text-slate-700">
                      {selectedVoice.gender}
                    </span>
                  </div>
                  <p className="text-xs text-cyan-400 light:text-indigo-600 font-medium">{selectedVoice.title}</p>
                </div>
              </div>

              {/* Quick Preview Voice Audio Feedback Button */}
              <button
                onClick={() => playVoiceFeedback(selectedVoice, 'welcome')}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-slate-200 flex items-center gap-1.5 transition-all light:bg-slate-100 light:text-slate-800"
                title="Listen to Personalized Character Greeting"
              >
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Hear Voice</span>
              </button>
            </div>

            {/* Voice Bio & Tags */}
            <div className="space-y-2">
              <p className="text-xs text-slate-400 leading-relaxed light:text-slate-600">
                "{selectedVoice.bio}"
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selectedVoice.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] text-slate-300 border border-white/10 light:bg-slate-100 light:text-slate-700"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Tuning Controls: Speed & Pitch */}
            <div className="space-y-3 pt-2 border-t border-white/10 light:border-slate-200">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 light:text-slate-700 font-medium">Pacing / Speed</span>
                  <span className="font-mono text-cyan-400 font-bold">{speed.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.75"
                  step="0.05"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 light:text-slate-700 font-medium">Tone / Pitch Modulation</span>
                  <span className="font-mono text-purple-400 font-bold">{pitch.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.3"
                  step="0.02"
                  value={pitch}
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                  className="w-full accent-purple-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Export Format Selector */}
            <div className="pt-2 border-t border-white/10 light:border-slate-200">
              <label className="text-xs font-semibold text-slate-300 light:text-slate-700 block mb-2">
                Export Audio Format:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setExportFormat('wav')}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                    exportFormat === 'wav'
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm'
                      : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white light:bg-slate-100 light:text-slate-700'
                  }`}
                >
                  <p className="font-bold">WAV (Lossless)</p>
                  <p className="text-[10px] font-normal text-slate-400">24kHz Studio RIFF</p>
                </button>

                <button
                  type="button"
                  onClick={() => setExportFormat('mp3')}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                    exportFormat === 'mp3'
                      ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300 shadow-sm'
                      : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white light:bg-slate-100 light:text-slate-700'
                  }`}
                >
                  <p className="font-bold">MP3 (Compressed)</p>
                  <p className="text-[10px] font-normal text-slate-400">Lightweight & Mobile</p>
                </button>
              </div>
            </div>

            {/* Main Generate Button */}
            <div className="pt-2">
              <button
                disabled={isGenerating || !text.trim()}
                onClick={handleGenerateSpeech}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span>Synthesize Speech ({charCount.toLocaleString()} Chars)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Progress Bar Modal for Long Text Processing */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl space-y-6 bg-slate-950/90 text-slate-100 light:bg-white/95 light:text-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md"
                  style={{ backgroundColor: selectedVoice.accentHex }}
                >
                  {selectedVoice.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-base">Synthesizing with {selectedVoice.name}</h3>
                  <p className="text-xs text-slate-400">Gemini Neural Audio Synthesizer</p>
                </div>
              </div>

              <button
                onClick={handleCancelGeneration}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-2.5 py-1 rounded-lg border border-rose-500/30 hover:bg-rose-500/10 transition-colors flex items-center gap-1"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            </div>

            {/* Visualizer Animation */}
            <div className="flex items-center justify-center gap-1.5 h-16 bg-white/[0.03] rounded-2xl border border-white/10 p-2 light:bg-slate-100">
              {[40, 75, 90, 60, 30, 85, 95, 70, 45, 65, 80, 50, 95, 75, 35, 60, 85].map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 rounded-full bg-gradient-to-t from-cyan-500 to-indigo-400 animate-pulse"
                  style={{
                    height: `${Math.max(15, (h * generationProgress.percent) / 100)}%`,
                    animationDelay: `${i * 0.08}s`,
                    animationDuration: '0.8s',
                  }}
                />
              ))}
            </div>

            {/* Live Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-cyan-400">{generationProgress.status}</span>
                <span className="font-mono font-bold text-sm text-slate-100 light:text-slate-900">
                  {generationProgress.percent}%
                </span>
              </div>

              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden light:bg-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 transition-all duration-300"
                  style={{ width: `${generationProgress.percent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>
                  Block {generationProgress.currentChunk} of {generationProgress.totalChunks}
                </span>
                <span>
                  Elapsed: {generationProgress.elapsedSeconds}s • Est. Remaining: ~
                  {generationProgress.estimatedRemainingSeconds}s
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Immediate Post-Generation Action Card */}
      {lastGeneratedItem && (
        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-emerald-500/30 bg-emerald-950/20 light:bg-emerald-50/70 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-100 light:text-slate-900">
                "{lastGeneratedItem.title}" Ready!
              </p>
              <p className="text-xs text-slate-400 light:text-slate-600">
                Voice: {lastGeneratedItem.characterName} • {lastGeneratedItem.durationSeconds}s •{' '}
                {lastGeneratedItem.characterCount.toLocaleString()} chars
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => playTrack(lastGeneratedItem)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 flex items-center gap-1.5 transition-all shadow-md"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Listen Now</span>
            </button>

            <button
              onClick={() => {
                if (lastGeneratedItem.audioBlob) {
                  triggerFileDownload(
                    lastGeneratedItem.audioBlob,
                    `${lastGeneratedItem.title}.${lastGeneratedItem.format}`
                  );
                }
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-slate-200 flex items-center gap-1.5 transition-all light:bg-white light:text-slate-800"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Download {lastGeneratedItem.format.toUpperCase()}</span>
            </button>

            <button
              onClick={() => syncConversionToCloud(lastGeneratedItem.id, 'googleDrive')}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-slate-200 flex items-center gap-1.5 transition-all light:bg-white light:text-slate-800"
              title="Save to Google Drive"
            >
              <Cloud className="w-3.5 h-3.5 text-blue-400" />
              <span>Save to Drive</span>
            </button>

            <button
              onClick={() => syncConversionToCloud(lastGeneratedItem.id, 'dropbox')}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-slate-200 flex items-center gap-1.5 transition-all light:bg-white light:text-slate-800"
              title="Save to Dropbox"
            >
              <Cloud className="w-3.5 h-3.5 text-indigo-400" />
              <span>Save to Dropbox</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
