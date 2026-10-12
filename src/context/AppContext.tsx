import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { CharacterVoice, CHARACTER_VOICES } from '../data/characters.ts';
import { StoredConversion, getAllConversionsFromDB, saveConversionToDB, deleteConversionFromDB, updateFavoriteInDB, updateCloudSyncInDB } from '../utils/indexedDB.ts';
import { playChimeFeedback, generateSyntheticSpeechWav } from '../utils/audioUtils.ts';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  plan: string;
  charLimit: number;
  monthlyQuotaUsed: number;
}

interface AppContextType {
  // Theme & Accessibility
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  dyslexicFont: boolean;
  setDyslexicFont: (enabled: boolean) => void;
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
  audioFeedbackEnabled: boolean;
  setAudioFeedbackEnabled: (enabled: boolean) => void;

  // Network & Offline Status
  isOnline: boolean;

  // User Auth
  user: UserProfile | null;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  logoutUser: () => void;
  loginUser: (email: string, name: string) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;

  // Navigation
  activeTab: 'studio' | 'dashboard' | 'voices' | 'analytics' | 'cloud';
  setActiveTab: (tab: 'studio' | 'dashboard' | 'voices' | 'analytics' | 'cloud') => void;

  // Characters
  selectedVoice: CharacterVoice;
  setSelectedVoice: (voice: CharacterVoice) => void;
  playVoiceFeedback: (voice: CharacterVoice, type: 'welcome' | 'generating' | 'success' | 'saved') => void;

  // Conversions & History
  conversions: StoredConversion[];
  addConversion: (conversion: StoredConversion) => Promise<void>;
  deleteConversion: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  syncConversionToCloud: (id: string, provider: 'googleDrive' | 'dropbox') => Promise<void>;

  // Cloud Storage
  googleDriveConnected: boolean;
  setGoogleDriveConnected: (connected: boolean) => void;
  dropboxConnected: boolean;
  setDropboxConnected: (connected: boolean) => void;
  isCloudModalOpen: boolean;
  setIsCloudModalOpen: (open: boolean) => void;

  // Global Audio Player
  currentTrack: StoredConversion | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  setPlaybackRate: (rate: number) => void;
  volume: number;
  setVolume: (vol: number) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  isLooping: boolean;
  setIsLooping: (loop: boolean) => void;
  playTrack: (track: StoredConversion) => void;
  pauseTrack: () => void;
  togglePlayPause: () => void;
  seekTrack: (seconds: number) => void;

  // Generation Progress
  isGenerating: boolean;
  setIsGenerating: (generating: boolean) => void;
  generationProgress: {
    percent: number;
    currentChunk: number;
    totalChunks: number;
    status: string;
    elapsedSeconds: number;
    estimatedRemainingSeconds: number;
  };
  setGenerationProgress: React.Dispatch<React.SetStateAction<{
    percent: number;
    currentChunk: number;
    totalChunks: number;
    status: string;
    elapsedSeconds: number;
    estimatedRemainingSeconds: number;
  }>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial seed conversions to make historical dashboard rich and instantly interactive
const INITIAL_SEED_CONVERSIONS: StoredConversion[] = [
  {
    id: 'seed-conv-1',
    title: 'WCAG 2.2 Neurodiversity & Dyslexia Synthesis',
    text: 'Accessibility in digital interfaces requires multimodal sensory redundancy. When users with dyslexia or cognitive processing variances encounter long technical documentation, synthesized speech provides a cognitive bridge that reduces reading fatigue.',
    characterId: 'lyra-starlight',
    characterName: 'Lyra Starlight',
    characterGender: 'female',
    baseVoice: 'Kore',
    durationSeconds: 24,
    wordCount: 38,
    characterCount: 260,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    format: 'wav',
    isFavorite: true,
    cloudSync: {
      googleDrive: { synced: true, fileId: 'gd_seed_1', url: 'https://drive.google.com' },
      dropbox: { synced: true, fileId: 'db_seed_1', url: 'https://dropbox.com' },
    },
    tags: ['Accessibility', 'WCAG', 'Dyslexia'],
  },
  {
    id: 'seed-conv-2',
    title: 'Financial Q3 Earnings Teleconference Briefing',
    text: 'Good morning ladies and gentlemen. Today we report consolidated revenues of forty-two million dollars, representing thirty-six percent organic growth. Operational efficiency gains across distributed edge architectures drove exceptional margins.',
    characterId: 'elena-vance',
    characterName: 'Elena Vance',
    characterGender: 'female',
    baseVoice: 'Aoede',
    durationSeconds: 26,
    wordCount: 42,
    characterCount: 278,
    createdAt: new Date(Date.now() - 3600000 * 22).toISOString(),
    format: 'mp3',
    isFavorite: false,
    cloudSync: {
      googleDrive: { synced: true, fileId: 'gd_seed_2', url: 'https://drive.google.com' },
    },
    tags: ['Finance', 'Corporate', 'Earnings'],
  },
  {
    id: 'seed-conv-3',
    title: 'The Whispering Spire of Aethelgard: Book I',
    text: 'High above the mist-cloaked valley of elder runes, Master Rowan gazed toward the twin suns. The stones whispered ancient verses to any traveler who had the stillness of mind to listen.',
    characterId: 'rowan-oakwood',
    characterName: 'Rowan Oakwood',
    characterGender: 'male',
    baseVoice: 'Fenrir',
    durationSeconds: 22,
    wordCount: 35,
    characterCount: 202,
    createdAt: new Date(Date.now() - 3600000 * 50).toISOString(),
    format: 'wav',
    isFavorite: true,
    cloudSync: {
      dropbox: { synced: true, fileId: 'db_seed_3', url: 'https://dropbox.com' },
    },
    tags: ['Fantasy', 'Audiobook', 'Fiction'],
  },
  {
    id: 'seed-conv-4',
    title: 'Quantum Computing Fundamentals & Coherence',
    text: 'In superconducting qubits, decoherence represents the principal obstacle to fault-tolerant universal quantum computation. Cryogenic refrigeration systems maintain operational temperatures at fifteen millikelvin.',
    characterId: 'arthur-pendelton',
    characterName: 'Arthur Pendelton',
    characterGender: 'male',
    baseVoice: 'Fenrir',
    durationSeconds: 25,
    wordCount: 32,
    characterCount: 228,
    createdAt: new Date(Date.now() - 3600000 * 95).toISOString(),
    format: 'mp3',
    isFavorite: false,
    tags: ['Academic', 'Physics', 'Computing'],
  },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme
  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('auravoice_theme') as 'dark' | 'light') || 'dark';
  });

  // Accessibility
  const [dyslexicFont, setDyslexicFont] = useState<boolean>(() => {
    return localStorage.getItem('auravoice_dyslexic') === 'true';
  });
  const [highContrast, setHighContrast] = useState<boolean>(() => {
    return localStorage.getItem('auravoice_contrast') === 'true';
  });
  const [audioFeedbackEnabled, setAudioFeedbackEnabled] = useState<boolean>(true);

  // Network Status
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // User
  const [user, setUser] = useState<UserProfile | null>({
    id: 'usr_pro_01',
    name: 'Sohail Kharal',
    email: 'sohailkharal607@gmail.com',
    role: 'Accessibility Specialist',
    avatar: 'SK',
    plan: 'Pro Studio Unlimited',
    charLimit: 20000,
    monthlyQuotaUsed: 84500,
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Navigation
  const [activeTab, setActiveTab] = useState<'studio' | 'dashboard' | 'voices' | 'analytics' | 'cloud'>('studio');

  // Selected Voice
  const [selectedVoice, setSelectedVoice] = useState<CharacterVoice>(CHARACTER_VOICES[0]);

  // Conversions History
  const [conversions, setConversions] = useState<StoredConversion[]>(INITIAL_SEED_CONVERSIONS);

  // Cloud Storage
  const [googleDriveConnected, setGoogleDriveConnected] = useState<boolean>(true);
  const [dropboxConnected, setDropboxConnected] = useState<boolean>(true);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState<boolean>(false);

  // Audio Player
  const [currentTrack, setCurrentTrack] = useState<StoredConversion | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(0.9);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(false);

  // Global HTMLAudioElement
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Generation Progress
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState({
    percent: 0,
    currentChunk: 0,
    totalChunks: 0,
    status: 'Ready',
    elapsedSeconds: 0,
    estimatedRemainingSeconds: 0,
  });

  // Sync theme with HTML class
  useEffect(() => {
    localStorage.setItem('auravoice_theme', theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  // Sync accessibility classes
  useEffect(() => {
    localStorage.setItem('auravoice_dyslexic', String(dyslexicFont));
    if (dyslexicFont) {
      document.body.classList.add('font-accessible');
    } else {
      document.body.classList.remove('font-accessible');
    }
  }, [dyslexicFont]);

  // Online / offline listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize IndexedDB conversions
  useEffect(() => {
    const loadDB = async () => {
      try {
        const stored = await getAllConversionsFromDB();
        if (stored && stored.length > 0) {
          setConversions(stored);
        } else {
          // Pre-populate IndexedDB with seed items so offline mode has data
          for (const item of INITIAL_SEED_CONVERSIONS) {
            // Generate synthetic audio blob for seed item so it can be played offline immediately
            const audioBuf = await generateSyntheticSpeechWav(
              item.text,
              1.0,
              item.characterGender === 'female' ? 1.05 : 0.95,
              item.characterGender === 'female'
            );
            const blob = new Blob([audioBuf], { type: 'audio/wav' });
            item.audioBlob = blob;
            await saveConversionToDB(item);
          }
          setConversions(INITIAL_SEED_CONVERSIONS);
        }
      } catch (err) {
        console.warn('Error loading conversions from IndexedDB:', err);
      }
    };
    loadDB();
  }, []);

  // Audio Element Setup
  useEffect(() => {
    const audio = new Audio();
    audioElementRef.current = audio;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onEnded = () => {
      if (isLooping) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        setIsPlaying(false);
        setCurrentTime(0);
      }
    };

    const onError = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [isLooping]);

  // Synchronize playbackRate, volume, isMuted with audio element
  useEffect(() => {
    if (audioElementRef.current) {
      audioElementRef.current.playbackRate = playbackRate;
      audioElementRef.current.volume = isMuted ? 0 : volume;
    }
  }, [playbackRate, volume, isMuted]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
    playChimeFeedback('switch');
  };

  const playVoiceFeedback = (voice: CharacterVoice, type: 'welcome' | 'generating' | 'success' | 'saved') => {
    if (!audioFeedbackEnabled) return;

    playChimeFeedback(type === 'success' ? 'success' : type === 'generating' ? 'generate' : 'click');

    // Also speak preview sentence using Web Speech API with voice's characteristics
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const phrase = voice.feedbackPhrases[type] || voice.sampleText;
      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.pitch = voice.defaultPitch;
      utterance.rate = voice.defaultSpeed;

      // Match system voices by gender preference if available
      const voices = window.speechSynthesis.getVoices();
      const targetGenderWord = voice.gender === 'female' ? 'female' : 'male';
      const matched = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.toLowerCase().includes(targetGenderWord) ||
            (voice.gender === 'female' ? v.name.includes('Samantha') || v.name.includes('Victoria') || v.name.includes('Zira') : v.name.includes('David') || v.name.includes('George') || v.name.includes('Alex')))
      );
      if (matched) utterance.voice = matched;

      utterance.volume = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const addConversion = async (conv: StoredConversion) => {
    // Generate blob URL if audioBlob exists
    if (conv.audioBlob && !conv.audioUrl) {
      conv.audioUrl = URL.createObjectURL(conv.audioBlob);
    }
    await saveConversionToDB(conv);
    setConversions((prev) => [conv, ...prev.filter((p) => p.id !== conv.id)]);
    playChimeFeedback('success');
  };

  const deleteConversion = async (id: string) => {
    await deleteConversionFromDB(id);
    setConversions((prev) => prev.filter((c) => c.id !== id));
    if (currentTrack?.id === id) {
      pauseTrack();
      setCurrentTrack(null);
    }
    playChimeFeedback('delete');
  };

  const toggleFavorite = async (id: string) => {
    const item = conversions.find((c) => c.id === id);
    if (!item) return;
    const newFav = !item.isFavorite;
    await updateFavoriteInDB(id, newFav);
    setConversions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isFavorite: newFav } : c))
    );
    playChimeFeedback('click');
  };

  const syncConversionToCloud = async (id: string, provider: 'googleDrive' | 'dropbox') => {
    const item = conversions.find((c) => c.id === id);
    if (!item) return;

    try {
      const response = await fetch('/api/cloud/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          fileName: `${item.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.${item.format || 'wav'}`,
          conversionId: id,
          size: item.characterCount * 12,
        }),
      });
      const data = await response.json();
      const syncObj = { synced: true, fileId: data.fileId, url: data.cloudUrl };
      await updateCloudSyncInDB(id, provider, syncObj);

      setConversions((prev) =>
        prev.map((c) => {
          if (c.id === id) {
            return {
              ...c,
              cloudSync: {
                ...c.cloudSync,
                [provider]: syncObj,
              },
            };
          }
          return c;
        })
      );
      playChimeFeedback('success');
    } catch (err) {
      console.error('Failed to sync to cloud:', err);
    }
  };

  // Audio Playback Controls
  const playTrack = async (track: StoredConversion) => {
    const audio = audioElementRef.current;
    if (!audio) return;

    setCurrentTrack(track);

    let src = track.audioUrl;
    if (!src && track.audioBlob) {
      src = URL.createObjectURL(track.audioBlob);
      track.audioUrl = src;
    }

    if (!src) {
      // Generate synthetic buffer if missing
      const buf = await generateSyntheticSpeechWav(
        track.text,
        1.0,
        track.characterGender === 'female' ? 1.05 : 0.95,
        track.characterGender === 'female'
      );
      const blob = new Blob([buf], { type: 'audio/wav' });
      src = URL.createObjectURL(blob);
      track.audioBlob = blob;
      track.audioUrl = src;
    }

    audio.src = src;
    audio.playbackRate = playbackRate;
    audio.volume = isMuted ? 0 : volume;

    try {
      await audio.play();
      setIsPlaying(true);
    } catch (e) {
      console.warn('Playback interrupted:', e);
      setIsPlaying(false);
    }
  };

  const pauseTrack = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    }
  };

  const togglePlayPause = () => {
    if (!currentTrack) {
      if (conversions.length > 0) {
        playTrack(conversions[0]);
      }
      return;
    }
    if (isPlaying) {
      pauseTrack();
    } else {
      audioElementRef.current?.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const seekTrack = (seconds: number) => {
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = seconds;
      setCurrentTime(seconds);
    }
  };

  const logoutUser = () => {
    setUser(null);
    playChimeFeedback('click');
  };

  const loginUser = (email: string, name: string) => {
    setUser({
      id: 'usr_' + Date.now().toString(36),
      name: name || 'Aura Member',
      email: email || 'user@example.com',
      role: 'Voice Creator',
      avatar: (name || 'AM').substring(0, 2).toUpperCase(),
      plan: 'Pro Studio Unlimited',
      charLimit: 20000,
      monthlyQuotaUsed: 12000,
    });
    setIsAuthModalOpen(false);
    playChimeFeedback('success');
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme: setThemeState,
        toggleTheme,
        dyslexicFont,
        setDyslexicFont,
        highContrast,
        setHighContrast,
        audioFeedbackEnabled,
        setAudioFeedbackEnabled,
        isOnline,
        user,
        setUser,
        logoutUser,
        loginUser,
        isAuthModalOpen,
        setIsAuthModalOpen,
        activeTab,
        setActiveTab,
        selectedVoice,
        setSelectedVoice,
        playVoiceFeedback,
        conversions,
        addConversion,
        deleteConversion,
        toggleFavorite,
        syncConversionToCloud,
        googleDriveConnected,
        setGoogleDriveConnected,
        dropboxConnected,
        setDropboxConnected,
        isCloudModalOpen,
        setIsCloudModalOpen,
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        playbackRate,
        setPlaybackRate,
        volume,
        setVolume,
        isMuted,
        setIsMuted,
        isLooping,
        setIsLooping,
        playTrack,
        pauseTrack,
        togglePlayPause,
        seekTrack,
        isGenerating,
        setIsGenerating,
        generationProgress,
        setGenerationProgress,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
