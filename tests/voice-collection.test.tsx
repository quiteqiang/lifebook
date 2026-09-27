import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VoiceCollection } from '@/components/ui/voice-collection';

const memories = [
  { id: 'memory-1', createdAt: 1, durationMs: 12_000, waveform: [0.2, 0.5], mimeType: 'audio/wav' },
];

describe('simplified MyBook collection page', () => {
  it('keeps the collection focused and moves mixing behind one entry point', () => {
    render(<VoiceCollection memories={memories} playingId={null} onPlay={vi.fn()} onOpenMixer={vi.fn()} />);

    expect(screen.getByRole('heading', { name: '声音收藏' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open mixer' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Voice 01/ })).toBeTruthy();
    expect(screen.queryByText('MAKE A NEW SOUND')).toBeNull();
    expect(screen.queryByText('放入磁带')).toBeNull();
  });
});

