/** Own one stream per session, including permission requests resolved after unmount. */
export async function openMicrophone(
  signal: AbortSignal,
  request: () => Promise<MediaStream> = () => navigator.mediaDevices.getUserMedia({audio: {
    echoCancellation: false, noiseSuppression: false, autoGainControl: false, sampleRate: 44100,
  }}),
): Promise<MediaStream | null> {
  if (signal.aborted) return null;
  const stream = await request();
  const stop = () => stream.getTracks().forEach(track => track.stop());
  if (signal.aborted) {stop(); return null;}
  signal.addEventListener('abort', stop, {once: true});
  return stream;
}
