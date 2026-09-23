import type { MixRecipeId } from './mix-recipes';

export interface MemoryEntry {
  id: string;
  createdAt: number;
  durationMs: number;
  waveform: number[];
  mimeType: string;
  title?: string;
  mixKind?: MixRecipeId;
  sourceIds?: string[];
}

export function normalizeWaveform(samples: number[], size = 36): number[] {
  if (samples.length === 0) return Array.from({ length: size }, () => 0.08);
  return Array.from({ length: size }, (_, index) => {
    const start = Math.floor(index * samples.length / size);
    const end = Math.max(start + 1, Math.floor((index + 1) * samples.length / size));
    const average = samples.slice(start, end).reduce((sum, value) => sum + Math.abs(value), 0) / (end - start);
    return Math.min(1, Math.max(0.08, average));
  });
}

export function createMemoryEntry(blob: Blob, durationMs: number, samples: number[] = []): MemoryEntry {
  return {
    id: `memory-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    durationMs: Math.max(0, Math.round(durationMs)),
    waveform: normalizeWaveform(samples),
    mimeType: blob.type || 'audio/webm',
  };
}

export function formatDuration(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

export function readMemoryMetadata(storage: Storage, key = 'lifebook:memories'): MemoryEntry[] {
  try {
    const parsed = JSON.parse(storage.getItem(key) || '[]') as MemoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeMemoryMetadata(storage: Storage, memories: MemoryEntry[], key = 'lifebook:memories'): void {
  storage.setItem(key, JSON.stringify(memories.slice(0, 24)));
}
