export interface TranscribeResult {
  text: string;
  language: string;
  language_probability: number;
}

/** 把录音 Blob 上传到本地识别服务，返回识别出的文字 */
export async function transcribeAudio(blob: Blob): Promise<TranscribeResult> {
  const form = new FormData();
  const ext = blob.type.includes('mp4') ? 'm4a' : 'webm';
  form.append('file', blob, `recording.${ext}`);
  const res = await fetch('/api/transcribe', { method: 'POST', body: form });
  if (!res.ok) throw new Error(`transcribe failed: ${res.status}`);
  return (await res.json()) as TranscribeResult;
}
