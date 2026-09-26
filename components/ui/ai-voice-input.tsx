import { useEffect, useState } from 'react';
import { Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

type AIVoiceInputProps = {
  active: boolean;
  ready: boolean;
  disabled: boolean;
  onStart: () => void;
  onStop: () => void;
};

const barHeights = [9, 16, 23, 13, 28, 17, 22, 12, 19, 10];

export function AIVoiceInput({ active, ready, disabled, onStart, onStop }: AIVoiceInputProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!active) {
      setElapsedSeconds(0);
      return;
    }

    const startedAt = Date.now();
    setElapsedSeconds(0);
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 250);
    return () => window.clearInterval(timer);
  }, [active]);

  const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
  const seconds = String(elapsedSeconds % 60).padStart(2, '0');

  return <div className={cn('ai-voice-input', active && 'is-active', active && !ready && 'is-pending')}>
    <button
      type="button"
      className="ai-voice-button"
      aria-label={active ? 'Stop voice input' : 'Start voice input'}
      aria-pressed={active}
      disabled={disabled}
      onClick={active ? onStop : onStart}
    >
      <Mic strokeWidth={1.8} aria-hidden="true" />
    </button>
    <span className="ai-voice-timer" aria-label={`Elapsed recording time ${minutes}:${seconds}`}>{minutes}:{seconds}</span>
    <span className="ai-voice-visualizer" aria-hidden="true">
      {barHeights.map((height, index) => <span key={index} style={{ height, animationDelay: `${index * -0.12}s` }} />)}
    </span>
    <span className="ai-voice-caption">{active ? 'Listening...' : 'Click to speak'}</span>
  </div>;
}
