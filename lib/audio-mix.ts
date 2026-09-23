export type AudioBufferLike = {
  numberOfChannels: number;
  length: number;
  sampleRate: number;
  getChannelData: (channel: number) => Float32Array;
};

export type MergedAudioBuffer = AudioBufferLike;

export function mergeAudioBuffers(buffers: AudioBufferLike[]): MergedAudioBuffer {
  if (!buffers.length) throw new Error('At least one audio buffer is required.');
  const numberOfChannels = Math.max(...buffers.map(buffer => buffer.numberOfChannels));
  const sampleRate = buffers[0].sampleRate;
  const length = buffers.reduce((total, buffer) => total + buffer.length, 0);
  const channels = Array.from({ length: numberOfChannels }, () => new Float32Array(length));
  let offset = 0;

  for (const buffer of buffers) {
    for (let channel = 0; channel < numberOfChannels; channel += 1) {
      const sourceChannel = buffer.getChannelData(Math.min(channel, buffer.numberOfChannels - 1));
      channels[channel].set(sourceChannel, offset);
    }
    offset += buffer.length;
  }

  return { numberOfChannels, length, sampleRate, getChannelData: channel => channels[channel] };
}

export function audioBufferToWav(buffer: AudioBufferLike): ArrayBuffer {
  const bytesPerSample = 2;
  const blockAlign = buffer.numberOfChannels * bytesPerSample;
  const dataLength = buffer.length * blockAlign;
  const view = new DataView(new ArrayBuffer(44 + dataLength));
  const writeString = (offset: number, value: string) => { for (let index = 0; index < value.length; index += 1) view.setUint8(offset + index, value.charCodeAt(index)); };
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, buffer.numberOfChannels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  const channels = Array.from({ length: buffer.numberOfChannels }, (_, channel) => buffer.getChannelData(channel));
  let offset = 44;
  for (let frame = 0; frame < buffer.length; frame += 1) {
    for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
      const sample = Math.max(-1, Math.min(1, channels[channel][frame] ?? 0));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }
  return view.buffer;
}

export async function concatenateAudioBlobs(blobs: Blob[]): Promise<Blob> {
  if (!blobs.length) throw new Error('At least one audio recording is required.');
  const AudioContextConstructor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextConstructor) throw new Error('AudioContext is unavailable.');
  const context = new AudioContextConstructor();
  try {
    const buffers = await Promise.all(blobs.map(async blob => context.decodeAudioData(await blob.arrayBuffer())));
    return new Blob([audioBufferToWav(mergeAudioBuffers(buffers))], { type: 'audio/wav' });
  } finally {
    await context.close();
  }
}

