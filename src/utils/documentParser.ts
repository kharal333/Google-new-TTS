/**
 * Document file parsing and intelligent semantic text chunking for Gemini TTS.
 * Splits up to 20,000 characters into natural chunks on sentence/paragraph boundaries.
 */

export interface ParsedDocument {
  name: string;
  size: number;
  text: string;
  wordCount: number;
  characterCount: number;
  readingTimeMinutes: number;
  type: string;
}

export function parseFileToText(file: File): Promise<ParsedDocument> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      let content = (e.target?.result as string) || '';

      // Clean common control characters or formatting artifacts
      content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

      // Strip basic subtitle timestamps if SRT
      if (file.name.endsWith('.srt') || file.name.endsWith('.vtt')) {
        content = content
          .replace(/^\d+\s*$/gm, '')
          .replace(/^\d{2}:\d{2}:\d{2}[,\.]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,\.]\d{3}.*$/gm, '')
          .replace(/<[^>]+>/g, '')
          .replace(/\n{2,}/g, '\n');
      }

      // Enforce max 20,000 character limit
      if (content.length > 20000) {
        content = content.substring(0, 20000);
      }

      const words = content.trim() ? content.trim().split(/\s+/).length : 0;
      const readingTime = Math.ceil(words / 180);

      resolve({
        name: file.name,
        size: file.size,
        text: content,
        wordCount: words,
        characterCount: content.length,
        readingTimeMinutes: Math.max(1, readingTime),
        type: file.type || file.name.split('.').pop() || 'text/plain',
      });
    };

    reader.onerror = () => reject(new Error('Failed to read document file.'));

    reader.readAsText(file);
  });
}

/**
 * Splits text into chunks of maximum size ~1,800 characters, respecting sentence
 * and paragraph boundaries so Gemini TTS voice synthesis maintains natural prosody.
 */
export function chunkTextForTTS(text: string, maxChunkLength: number = 1800): string[] {
  if (!text || text.trim().length === 0) return [];

  // Enforce 20k max safety limit
  const sanitized = text.length > 20000 ? text.substring(0, 20000) : text;

  if (sanitized.length <= maxChunkLength) {
    return [sanitized.trim()];
  }

  const chunks: string[] = [];
  // Split on paragraph boundaries first
  const paragraphs = sanitized.split(/\n\s*\n/);
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    const pTrimmed = paragraph.trim();
    if (!pTrimmed) continue;

    if (currentChunk.length + pTrimmed.length + 2 <= maxChunkLength) {
      currentChunk += (currentChunk ? '\n\n' : '') + pTrimmed;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }

      // If single paragraph is larger than maxChunkLength, split by sentences
      if (pTrimmed.length > maxChunkLength) {
        const sentences = pTrimmed.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [pTrimmed];
        for (const sentence of sentences) {
          const sTrimmed = sentence.trim();
          if (!sTrimmed) continue;

          if (currentChunk.length + sTrimmed.length + 1 <= maxChunkLength) {
            currentChunk += (currentChunk ? ' ' : '') + sTrimmed;
          } else {
            if (currentChunk) {
              chunks.push(currentChunk.trim());
            }
            // If single sentence is somehow giant, slice it directly
            if (sTrimmed.length > maxChunkLength) {
              for (let i = 0; i < sTrimmed.length; i += maxChunkLength) {
                chunks.push(sTrimmed.substring(i, i + maxChunkLength));
              }
              currentChunk = '';
            } else {
              currentChunk = sTrimmed;
            }
          }
        }
      } else {
        currentChunk = pTrimmed;
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

export const SAMPLE_DOCUMENTS = [
  {
    title: 'Accessibility & Neurodiversity in Digital Interfaces',
    category: 'Accessibility',
    characterCount: 1420,
    text: `Digital accessibility is fundamentally about equity. When we design software that accommodates neurodivergent thinkers, individuals with dyslexia, and visually impaired users, we create an internet where knowledge is genuinely democratized. Text-to-speech technologies do not merely convert written glyphs into audio waveforms; they unlock comprehension, reduce cognitive fatigue, and provide alternative pathways to retain complex information. 

By allowing learners to adjust pitch, cadence, and select specific character vocal personalities, auditory engagement is dramatically amplified. Features like real-time visual synchronization and dyslexia-friendly typographic scales transform dense academic treatises into welcoming sonic experiences.`,
  },
  {
    title: 'The Starlight Navigator: Chronicle of Eos-7',
    category: 'Sci-Fi / Drama',
    characterCount: 1850,
    text: `The quantum telemetry monitors pulsed with faint bioluminescent teal as Captain Miranda Cruz initiated the sub-orbital descent vector. Outside the reinforced viewport of the Eos-7, the atmosphere of Kepler-452b blazed like incandescent amethyst. 

"All crew, secure inertial dampeners," Cruz ordered, her voice cutting through the ambient hum of the ion core with calm steel. "We have one window through the ionized storm front. If the harmonic shielding holds, we touch down at the crystal coordinates in two minutes."

In the co-pilot seat, Jasper grinned, fingers dancing across the translucent holographic console. "Shielding is holding at ninety-four percent, Captain. The storm isn't a barrier—it's a welcome party. Engaging atmospheric stabilizers now."`,
  },
  {
    title: 'Mindfulness & Morning Clarity Meditation',
    category: 'Mindfulness',
    characterCount: 1180,
    text: `Take a comfortable posture, whether seated in your chair or resting gently upon a cushion. Allow your spine to rise naturally, like a bamboo reed swaying gently in a mountain breeze. 

Release any tension that may have gathered around your jaw, your forehead, and your shoulders. Take a slow, restorative breath in through your nose... feeling the cool air fill your lungs... and exhale gently through your mouth, letting every concern of yesterday dissolve.

You are here, entirely present in this moment. The breath is your anchor, constant and rhythmic. With every gentle cycle, allow clarity and peaceful stillness to expand through your mind.`,
  },
  {
    title: 'Executive Financial Briefing: Q4 Market Horizons',
    category: 'Business',
    characterCount: 1390,
    text: `Good morning, colleagues and shareholders. Today’s quarterly briefing highlights sustained macro momentum across high-growth AI compute platforms and sustainable energy infrastructure.

Key performance indicators indicate a 34% year-over-year expansion in distributed edge computing deployments, driven by rising demand for localized inference and low-latency voice models. Operating margins remain robust at 28.4%, while capital expenditures continue to align with strategic initiatives in data center decarbonization. As we navigate the upcoming fiscal year, our diversified product portfolio and disciplined capital allocation position us favorably against market volatility.`,
  },
];
