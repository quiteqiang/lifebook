import { describe, expect, it } from 'vitest';
import { readAudio, saveAudio } from '../lib/audio-store';
import { createMemoryEntry, formatDuration, normalizeWaveform, readMemoryMetadata, writeMemoryMetadata } from '../lib/memories';

describe('memory cards', () => {
  it('compresses recorded amplitude samples into a stable card waveform', () => {
    expect(normalizeWaveform([0, 0.2, 0.8, 0.4], 4)).toEqual([0.08, 0.2, 0.8, 0.4]);
    expect(normalizeWaveform([], 4)).toEqual([0.08, 0.08, 0.08, 0.08]);
  });

  it('creates a playable recording card metadata object', () => {
    const entry = createMemoryEntry(new Blob(['audio'], { type: 'audio/webm' }), 1234, [0.5]);
    expect(entry.mimeType).toBe('audio/webm');
    expect(entry.durationMs).toBe(1234);
    expect(entry.waveform).toHaveLength(36);
    expect(entry.id).toMatch(/^memory-/);
  });

  it('formats duration for the compact card UI', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(65000)).toBe('1:05');
  });

  it('round trips metadata without storing audio bytes in localStorage', () => {
    const storage = new Map<string, string>();
    const adapter = { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) } as unknown as Storage;
    const memory = createMemoryEntry(new Blob(), 100);
    writeMemoryMetadata(adapter, [memory]);
    expect(readMemoryMetadata(adapter)).toEqual([memory]);
  });

  it('round trips the audio file through the local audio store', async () => {
    const blob = new Blob(['voice'], { type: 'audio/webm' });
    const memory = createMemoryEntry(blob, 100);
    await saveAudio(memory, blob);
    expect(await readAudio(memory.id)).toBe(blob);
  });
});
