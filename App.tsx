import { useEffect, useRef, useState } from 'react';
import { BookOpen, Home, Mic, Square, X } from 'lucide-react';
import { VoicePoweredOrb } from '@/components/ui/voice-powered-orb';
import { Button } from '@/components/ui/button';
import { Library } from '@/components/ui/library';
import { readAudio, saveAudio } from '@/lib/audio-store';
import { createMemoryEntry, type MemoryEntry, readMemoryMetadata, writeMemoryMetadata } from '@/lib/memories';

type Phase = 'idle' | 'recording' | 'saving';

function initialMemories(): MemoryEntry[] {
  if (typeof window === 'undefined') return [];
  return readMemoryMetadata(window.localStorage);
}

export default function App() {
  const [tab, setTab] = useState<'today' | 'book'>('today');
  const [phase, setPhase] = useState<Phase>('idle');
  const [ready, setReady] = useState(false);
  const [voice, setVoice] = useState(false);
  const [error, setError] = useState(false);
  const [memories, setMemories] = useState<MemoryEntry[]>(initialMemories);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const levelsRef = useRef<number[]>([]);
  const finishTimerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const persistMemory = async (blob: Blob) => {
    const entry = createMemoryEntry(blob, Date.now() - startedAtRef.current, levelsRef.current);
    try {
      await saveAudio(entry, blob);
      const next = [entry, ...memories].slice(0, 24);
      if (typeof window !== 'undefined') writeMemoryMetadata(window.localStorage, next);
      finishTimerRef.current = window.setTimeout(() => { setMemories(next); setPhase('idle'); }, 1450);
    } catch {
      setPhase('idle');
      setError(true);
    }
  };

  const beginRecording = () => {
    setError(false);
    setReady(false);
    setPhase('recording');
    startedAtRef.current = Date.now();
    levelsRef.current = [];
  };

  const endRecording = () => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      setPhase('idle');
      return;
    }
    setPhase('saving');
    recorder.stop();
  };

  const handleMicrophoneStream = (stream: MediaStream | null) => {
    if (!stream || phase !== 'recording' || recorderRef.current) return;
    try {
      const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find(type => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = event => { if (event.data.size > 0) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        recorderRef.current = null;
        setReady(false);
        void persistMemory(blob);
      };
      recorder.onerror = () => { recorderRef.current = null; setPhase('idle'); setError(true); };
      recorder.start(250);
      recorderRef.current = recorder;
    } catch {
      setPhase('idle');
      setError(true);
    }
  };

  const playMemory = async (id: string) => {
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    const blob = await readAudio(id);
    if (!blob) { setError(true); return; }
    if (audioRef.current) {
      audioRef.current.pause();
      if (audioRef.current.src.startsWith('blob:')) URL.revokeObjectURL(audioRef.current.src);
    }
    const audio = new Audio(URL.createObjectURL(blob));
    audio.onended = () => { URL.revokeObjectURL(audio.src); setPlayingId(null); };
    audioRef.current = audio;
    setPlayingId(id);
    void audio.play().catch(() => { setPlayingId(null); setError(true); });
  };

  useEffect(() => () => {
    if (finishTimerRef.current) window.clearTimeout(finishTimerRef.current);
    recorderRef.current?.stop();
    audioRef.current?.pause();
  }, []);

    const isRecording = phase === 'recording';
  return <main className={`app-shell ${tab === 'book' ? 'is-library' : ''}`}>
    <header className="brand" aria-label="Life Book"><BookOpen strokeWidth={1.25} aria-hidden="true" /></header>
    <section className={`main-stage ${phase} tab-${tab}`} aria-label={tab === 'today' ? 'Today' : 'Library'}>
      {tab === 'today' ? <div className={`orb-position ${voice ? 'is-speaking' : ''}`}>
        <VoicePoweredOrb enableVoiceControl={isRecording} onVoiceDetected={level => { setVoice(level); if (level) levelsRef.current.push(0.75); }} onMicrophoneState={state => { if (state === 'ready') setReady(true); else { setPhase('idle'); setError(true); } }} onMicrophoneStream={handleMicrophoneStream} />
      </div> : <div className="mybook-roll-scene library-scene">
        <Library onReplay={() => { const latest = memories[0]; if (latest) void playMemory(latest.id); else setError(true); }} />
      </div>}
      {tab === 'today' && <div className="record-position">
        <Button className={`record-button ${isRecording ? 'is-recording' : ''} ${isRecording && !ready ? 'is-pending' : ''}`} size="icon"
          aria-label={isRecording ? 'Stop voice input' : 'Start voice input'} aria-pressed={isRecording} disabled={phase === 'saving'}
          onClick={() => isRecording ? endRecording() : beginRecording()}>
          {isRecording ? <Square fill="currentColor" strokeWidth={0} /> : <Mic strokeWidth={1.7} />}
        </Button>
        <span className="sr-only" role="status">{phase === 'saving' ? 'Saving memory.' : isRecording ? ready ? 'Microphone on. Speak to animate the orb.' : 'Waiting for microphone permission.' : 'Microphone off.'}</span>
      </div>}
    </section>
    {error && <div className="error-message" role="alert"><span>Microphone or playback unavailable. Check browser permissions and try again.</span><button aria-label="Dismiss message" onClick={() => setError(false)}><X size={18}/></button></div>}
    <nav className="bottom-nav" aria-label="Main navigation">
      <button aria-current={tab === 'today' ? 'page' : undefined} onClick={() => setTab('today')}><Home strokeWidth={1.7}/><span>Today</span></button>
      <button aria-current={tab === 'book' ? 'page' : undefined} onClick={() => { if (isRecording) endRecording(); setError(false); setTab('book'); }}><BookOpen strokeWidth={1.5}/><span>Library</span></button>
    </nav>
    <div className="home-indicator" aria-hidden="true" />
  </main>;
}
