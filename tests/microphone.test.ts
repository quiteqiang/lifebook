import { describe, it, expect, vi } from 'vitest';
import { openMicrophone } from '../lib/microphone';
describe('microphone lifecycle', () => {
  it('releases a permission response that arrives after cancellation', async () => {
    const controller = new AbortController();
    const stop = vi.fn();
    let resolve!: (stream: MediaStream) => void;
    const request = new Promise<MediaStream>(r => { resolve = r; });
    const pending = openMicrophone(controller.signal, () => request);
    controller.abort();
    resolve({getTracks: () => [{stop}]} as unknown as MediaStream);
    expect(await pending).toBeNull();
    expect(stop).toHaveBeenCalledOnce();
  });
  it('returns the active stream and stops its tracks on cancellation', async () => {
    const controller = new AbortController();
    const stop = vi.fn();
    const stream = {getTracks: () => [{stop}]} as unknown as MediaStream;
    expect(await openMicrophone(controller.signal, async () => stream)).toBe(stream);
    expect(stop).not.toHaveBeenCalled();
    controller.abort();
    expect(stop).toHaveBeenCalledOnce();
  });
});
