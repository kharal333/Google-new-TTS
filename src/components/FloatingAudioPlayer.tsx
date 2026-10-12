import React, { useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { triggerFileDownload } from '../utils/audioUtils.ts';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Repeat,
  Download,
  Sliders,
  ChevronUp,
  X,
  Maximize2,
} from 'lucide-react';

export const FloatingAudioPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlayPause,
    seekTrack,
    playbackRate,
    setPlaybackRate,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    isLooping,
    setIsLooping,
    pauseTrack,
  } = useApp();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animated Waveform Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const barCount = 36;
      const barWidth = width / barCount - 2;

      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + 2);
        let barHeight = 4;

        if (isPlaying) {
          // Dynamic sine wave modulated by index and phase
          const wave = Math.sin((i / barCount) * Math.PI * 4 + phase) * 0.5 + 0.5;
          barHeight = Math.max(3, wave * (height * 0.85));
        } else {
          barHeight = 4;
        }

        const y = (height - barHeight) / 2;
        // Gradient fill
        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        grad.addColorStop(0, '#06b6d4'); // Cyan
        grad.addColorStop(1, '#6366f1'); // Indigo

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }

      if (isPlaying) {
        phase += 0.08;
      }
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  if (!currentTrack) return null;

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    seekTrack(parseFloat(e.target.value));
  };

  const speedOptions = [0.75, 1.0, 1.25, 1.5, 2.0];

  return (
    <aside
      aria-label="Audio player"
      className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-2xl bg-slate-950/85 border-t border-white/15 shadow-[0_-10px_35px_rgba(0,0,0,0.5)] transition-all light:bg-white/90 light:border-slate-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Left: Track Info & Canvas Waveform */}
          <div className="flex items-center gap-3 w-full md:w-1/4 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-md shrink-0">
              {currentTrack.characterName.charAt(0)}
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-xs text-slate-100 truncate light:text-slate-900">
                {currentTrack.title}
              </h4>
              <p className="text-[11px] text-cyan-400 truncate light:text-indigo-600">
                Voice: {currentTrack.characterName} ({currentTrack.format.toUpperCase()})
              </p>
            </div>

            <canvas
              ref={canvasRef}
              width={80}
              height={26}
              className="hidden sm:block shrink-0 opacity-80"
            />
          </div>

          {/* Center: Playback Controls & Progress Bar */}
          <div className="flex flex-col items-center gap-1.5 w-full md:w-2/4">
            {/* Control Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => seekTrack(Math.max(0, currentTime - 10))}
                className="p-1.5 text-slate-400 hover:text-white transition-colors"
                title="Rewind 10 seconds"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={togglePlayPause}
                className="w-10 h-10 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-400/25 transition-transform active:scale-95"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>

              <button
                onClick={() => seekTrack(Math.min(duration || 0, currentTime + 10))}
                className="p-1.5 text-slate-400 hover:text-white transition-colors"
                title="Forward 10 seconds"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsLooping(!isLooping)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isLooping ? 'text-cyan-400 bg-cyan-500/15' : 'text-slate-400 hover:text-white'
                }`}
                title="Toggle Loop"
              >
                <Repeat className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Time Slider */}
            <div className="w-full flex items-center gap-2 text-[11px] text-slate-400 font-mono">
              <span>{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration || currentTrack.durationSeconds || 100}
                step="0.1"
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400 light:bg-slate-300"
              />
              <span>{formatTime(duration || currentTrack.durationSeconds)}</span>
            </div>
          </div>

          {/* Right: Speed, Volume & Download */}
          <div className="flex items-center justify-end gap-2.5 w-full md:w-1/4">
            {/* Speed Selector */}
            <select
              value={playbackRate}
              onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
              className="bg-white/[0.06] border border-white/10 rounded-lg text-xs font-semibold px-2 py-1 text-slate-200 focus:outline-none light:bg-slate-100 light:text-slate-800"
              title="Playback Speed"
            >
              {speedOptions.map((s) => (
                <option key={s} value={s} className="bg-slate-900 text-white">
                  {s}x
                </option>
              ))}
            </select>

            {/* Volume Toggle & Slider */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-slate-400 hover:text-white"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                className="w-16 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400 light:bg-slate-300"
              />
            </div>

            {/* Direct Download */}
            <button
              onClick={() => {
                if (currentTrack.audioBlob) {
                  triggerFileDownload(
                    currentTrack.audioBlob,
                    `${currentTrack.title}.${currentTrack.format}`
                  );
                }
              }}
              className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 hover:text-white transition-all light:bg-slate-100 light:text-slate-800"
              title={`Download audio file (${currentTrack.format.toUpperCase()})`}
            >
              <Download className="w-4 h-4 text-cyan-400" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
