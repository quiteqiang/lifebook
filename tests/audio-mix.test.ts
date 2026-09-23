import { describe, expect, it } from 'vitest';
import { mergeAudioBuffers } from '@/lib/audio-mix';

describe('audio tape splicing', () => {
  it('places source buffers back-to-back in one combined buffer', () => {
    const first = { numberOfChannels: 1, length: 3, sampleRate: 8_000, getChannelData: () => new Float32Array([0.1, 0.2, 0.3]) };
    const second = { numberOfChannels: 1, length: 2, sampleRate: 8_000, getChannelData: () => new Float32Array([0.4, 0.5]) };

    const merged = mergeAudioBuffers([first, second]);

    expect(merged.length).toBe(5);
    expect(Array.from(merged.getChannelData(0)).map(value => Number(value.toFixed(3)))).toEqual([0.1, 0.2, 0.3, 0.4, 0.5]);
  });

  it('keeps stereo channels aligned when one source is mono', () => {
    const mono = { numberOfChannels: 1, length: 2, sampleRate: 8_000, getChannelData: () => new Float32Array([0.2, 0.4]) };
    const stereo = { numberOfChannels: 2, length: 2, sampleRate: 8_000, getChannelData: (channel: number) => new Float32Array(channel ? [0.8, 0.6] : [0.5, 0.3]) };

    const merged = mergeAudioBuffers([mono, stereo]);

    expect(merged.numberOfChannels).toBe(2);
    expect(Array.from(merged.getChannelData(0)).map(value => Number(value.toFixed(3)))).toEqual([0.2, 0.4, 0.5, 0.3]);
    expect(Array.from(merged.getChannelData(1)).map(value => Number(value.toFixed(3)))).toEqual([0.2, 0.4, 0.8, 0.6]);
  });
});
