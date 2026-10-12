/**
 * Audio processing utilities: WAV concatenation, Base64 decoders,
 * Web Speech offline synthesis fallback, and glassmorphic audio synthesis.
 */

// Helper to convert base64 to ArrayBuffer
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Convert ArrayBuffer to Base64
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Concatenates multiple WAV audio ArrayBuffers into a single unified WAV file.
 * Strips 44-byte RIFF header from chunks after the first, recalculates total PCM size,
 * and updates RIFF and data chunk lengths.
 */
export function concatenateWavBuffers(buffers: ArrayBuffer[]): ArrayBuffer {
  if (buffers.length === 0) return new ArrayBuffer(0);
  if (buffers.length === 1) return buffers[0];

  // Validate first buffer has WAV header (at least 44 bytes)
  const firstHeader = new Uint8Array(buffers[0], 0, Math.min(44, buffers[0].byteLength));
  const isWav =
    String.fromCharCode(...firstHeader.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...firstHeader.slice(8, 12)) === 'WAVE';

  if (!isWav) {
    // If not standard WAV, simple concatenation of raw buffers
    let totalLen = 0;
    for (const b of buffers) totalLen += b.byteLength;
    const combined = new Uint8Array(totalLen);
    let offset = 0;
    for (const b of buffers) {
      combined.set(new Uint8Array(b), offset);
      offset += b.byteLength;
    }
    return combined.buffer;
  }

  // Calculate total audio PCM payload
  let totalDataLength = 0;
  for (let i = 0; i < buffers.length; i++) {
    const b = buffers[i];
    if (b.byteLength > 44) {
      totalDataLength += b.byteLength - 44;
    }
  }

  // Allocate new buffer: 44 bytes header + totalDataLength
  const outBuffer = new ArrayBuffer(44 + totalDataLength);
  const outView = new DataView(outBuffer);
  const outBytes = new Uint8Array(outBuffer);

  // Copy header from first buffer
  outBytes.set(new Uint8Array(buffers[0], 0, 44), 0);

  // Update RIFF chunk size (total size - 8)
  outView.setUint32(4, 36 + totalDataLength, true);

  // Update data chunk size (offset 40)
  outView.setUint32(40, totalDataLength, true);

  // Append PCM bytes
  let currentOffset = 44;
  for (let i = 0; i < buffers.length; i++) {
    const b = buffers[i];
    if (b.byteLength > 44) {
      const pcmChunk = new Uint8Array(b, 44, b.byteLength - 44);
      outBytes.set(pcmChunk, currentOffset);
      currentOffset += pcmChunk.byteLength;
    }
  }

  return outBuffer;
}

/**
 * Creates a synthetic WAV audio buffer with natural acoustic modulation
 * when running completely offline or fallback mode.
 */
export function generateSyntheticSpeechWav(
  text: string,
  speed: number = 1.0,
  pitch: number = 1.0,
  isFemale: boolean = true
): Promise<ArrayBuffer> {
  return new Promise((resolve) => {
    // Approximate duration: ~15 characters per second at 1.0 speed
    const charRate = 14 * Math.max(0.5, Math.min(2.0, speed));
    const estimatedDuration = Math.max(1.5, Math.min(180, text.length / charRate));
    const sampleRate = 24000;
    const totalSamples = Math.floor(sampleRate * estimatedDuration);

    const buffer = new ArrayBuffer(44 + totalSamples * 2);
    const view = new DataView(buffer);

    // Write RIFF header
    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + totalSamples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
    view.setUint16(22, 1, true); // NumChannels (1 mono)
    view.setUint32(24, sampleRate, true); // SampleRate (24000)
    view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
    view.setUint16(32, 2, true); // BlockAlign (NumChannels * BitsPerSample/8)
    view.setUint16(34, 16, true); // BitsPerSample (16 bits)
    writeString(36, 'data');
    view.setUint32(40, totalSamples * 2, true); // Subchunk2Size

    // Base fundamental frequency based on persona gender & pitch
    const baseFreq = isFemale ? 220 * pitch : 130 * pitch;

    // Generate harmonic waveforms simulating speech formants with pauses for punctuation
    let sampleOffset = 44;
    const words = text.split(/\s+/);
    const samplesPerWord = Math.floor(totalSamples / Math.max(1, words.length));

    for (let w = 0; w < words.length; w++) {
      const word = words[w];
      const hasPause = /[,.!?—;:]$/.test(word);
      const activeWordSamples = hasPause ? Math.floor(samplesPerWord * 0.75) : Math.floor(samplesPerWord * 0.95);
      const pauseSamples = samplesPerWord - activeWordSamples;

      for (let i = 0; i < activeWordSamples; i++) {
        if (sampleOffset >= buffer.byteLength) break;
        const t = (w * samplesPerWord + i) / sampleRate;
        const envelope = Math.sin((i / activeWordSamples) * Math.PI); // Smooth speech vowel envelope

        // Harmonics
        const f1 = baseFreq * (1 + 0.05 * Math.sin(t * 8));
        const s1 = Math.sin(2 * Math.PI * f1 * t);
        const s2 = 0.5 * Math.sin(4 * Math.PI * f1 * t);
        const s3 = 0.25 * Math.sin(6 * Math.PI * f1 * t);
        const noise = (Math.random() * 2 - 1) * 0.04; // Consonant texture

        const sampleVal = (s1 + s2 + s3 + noise) * envelope * 0.35;
        const int16Val = Math.max(-32768, Math.min(32767, Math.floor(sampleVal * 32767)));
        view.setInt16(sampleOffset, int16Val, true);
        sampleOffset += 2;
      }

      // Silence pause
      for (let p = 0; p < pauseSamples; p++) {
        if (sampleOffset >= buffer.byteLength) break;
        view.setInt16(sampleOffset, 0, true);
        sampleOffset += 2;
      }
    }

    // Fill remaining
    while (sampleOffset < buffer.byteLength) {
      view.setInt16(sampleOffset, 0, true);
      sampleOffset += 2;
    }

    resolve(buffer);
  });
}

/**
 * Plays a pleasant glassmorphic chime/sound effect for interactive feedback.
 */
export function playChimeFeedback(type: 'click' | 'success' | 'generate' | 'delete' | 'switch') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'success') {
      // Shimmering glass chord (C major 7th glass chime)
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08 / (idx + 1), ctx.currentTime + 0.05 + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8 + idx * 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.04);
        osc.stop(ctx.currentTime + 1.2);
      });
    } else if (type === 'click' || type === 'switch') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'generate') {
      // Dual futuristic acoustic pulse
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(640, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'delete') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    }
  } catch {
    // Non-blocking
  }
}

/**
 * Trigger download for a Blob
 */
export function triggerFileDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 2000);
}
