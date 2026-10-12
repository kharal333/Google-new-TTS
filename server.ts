import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize shared GoogleGenAI client
const apiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: !!apiKey,
    model: 'gemini-3.8-flash-lite-tts',
    characterLimit: 20000,
    timestamp: new Date().toISOString(),
  });
});

// Gemini TTS Generation Endpoint
app.post('/api/tts/generate', async (req: Request, res: Response) => {
  const { text, voiceName = 'Kore', characterStyle, speechPitch = 1.0, speechSpeed = 1.0, characterName } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text parameter is required and must be a string' });
  }

  // Enforce 20,000 character limit per generation
  if (text.length > 20000) {
    return res.status(400).json({
      error: `Text exceeds the maximum allowable limit of 20,000 characters (received ${text.length} characters).`,
    });
  }

  // Prebuilt voice mapping to valid Gemini prebuilt voices
  // Gemini TTS supported prebuilt voices include: 'Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede', 'Zephyr'
  const validGeminiVoices = ['Kore', 'Aoede', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];
  const targetVoice = validGeminiVoices.includes(voiceName) ? voiceName : 'Kore';

  // If no Gemini API key is configured or server-side ai is not initialized
  if (!ai || !apiKey) {
    return res.status(200).json({
      success: true,
      isSimulated: true,
      message: 'API Key not configured in environment. Using browser high-fidelity synthesis fallback.',
      voiceName: targetVoice,
      textLength: text.length,
      mimeType: 'audio/wav',
      audioData: null,
    });
  }

  try {
    // Generate speech using gemini-3.8-flash-lite-tts
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text,
              speechMetadata: {
                style: characterStyle || 'Natural, expressive human speech with clear articulation',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: targetVoice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error('No audio data received in Gemini TTS response candidates.');
    }

    return res.json({
      success: true,
      audioData: base64Audio,
      mimeType: 'audio/wav',
      voiceName: targetVoice,
      characterName: characterName || 'AuraVoice Voice',
      durationEstimated: Math.max(1, Math.round(text.length / 15)),
      textLength: text.length,
    });
  } catch (error: any) {
    console.error('Gemini TTS generation error:', error);
    // Graceful error propagation with simulation fallback flag so user experience is uninterrupted
    return res.status(200).json({
      success: true,
      isSimulated: true,
      errorDetail: error?.message || 'Gemini TTS request encountered a temporary error',
      voiceName: targetVoice,
      textLength: text.length,
      audioData: null,
    });
  }
});

// Cloud Storage Mock Management Endpoints for Google Drive & Dropbox
app.post('/api/cloud/save', (req: Request, res: Response) => {
  const { provider, fileName, fileType, size, conversionId } = req.body;
  const id = `${provider || 'drive'}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  res.json({
    success: true,
    fileId: id,
    provider: provider || 'google_drive',
    fileName: fileName || 'converted_speech.wav',
    cloudUrl: `https://${provider === 'dropbox' ? 'dropbox.com/s' : 'drive.google.com/file/d'}/${id}/view`,
    savedAt: new Date().toISOString(),
    conversionId,
  });
});

app.get('/api/cloud/files', (req: Request, res: Response) => {
  const provider = (req.query.provider as string) || 'google_drive';
  const sampleDocs = [
    {
      id: `${provider}_doc_1`,
      name: 'Accessibility_Guidelines_WCAG_2.2.md',
      size: '14.2 KB',
      characters: 8420,
      updatedAt: '2026-10-10T14:22:00Z',
      content: `Web Content Accessibility Guidelines (WCAG) 2.2 covers a wide range of recommendations for making Web content more accessible. Following these guidelines will make content more accessible to a wider range of people with disabilities, including accommodations for blindness and low vision, deafness and hearing loss, limited movement, speech disabilities, photosensitivity, and combinations of these, and will also address some learning disabilities and cognitive limitations. Speech synthesis systems provide vital assistive bridges when audio pacing, natural pauses, and pitch clarity are dynamically tuned for auditory comprehension.`,
    },
    {
      id: `${provider}_doc_2`,
      name: 'Quarterly_AI_Research_Summary.txt',
      size: '22.8 KB',
      characters: 12640,
      updatedAt: '2026-10-08T09:15:00Z',
      content: `Executive Summary: Advances in neural speech synthesis have fundamentally transformed accessibility tools and multimedia production. Traditional concatenative and parametric synthesizers have been superseded by latent diffusion and transformer-based autoregressive audio models capable of capturing nuanced prosody, emotional inflections, and conversational backchanneling. This paper benchmarks 20 unique character personas across academic, dramatic, and instructional domains. Key metrics include subjective mean opinion score (MOS), character boundary accuracy, and real-time factor (RTF).`,
    },
    {
      id: `${provider}_doc_3`,
      name: 'The_Chronicles_of_Aethelgard_Ch1.txt',
      size: '31.5 KB',
      characters: 17850,
      updatedAt: '2026-10-05T18:40:00Z',
      content: `Chapter 1: The Whispering Citadels. High above the sapphire mist of the Aethel Valley stood the crystalline spires of the ancient scholars. Master Rowan adjusted his velvet cloak as the autumnal wind carried echoes of long-forgotten incantations through the marbled arches. "Listen closely, apprentice," he whispered, gesturing toward the horizon where two suns cast double shadows across the valley. "The stones do not merely reflect the light—they preserve the voices of all who walked here before us."`,
    },
  ];

  res.json({
    provider,
    connected: true,
    files: sampleDocs,
  });
});

// Mount Vite or static dist
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    // Vite middleware in dev
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
