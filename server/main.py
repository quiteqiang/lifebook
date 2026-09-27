"""Life Book 语音识别后端：接收录音文件，用 faster-whisper 转文字。"""

import io
import os

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel

MODEL_SIZE = os.environ.get("WHISPER_MODEL", "tiny")
MAX_AUDIO_BYTES = 25 * 1024 * 1024  # 25MB 上限，约 30+ 分钟 opus 录音

app = FastAPI(title="lifebook-whisper")

# 开发模式下 vite (5173) 直连后端时放开 CORS；生产走 nginx 同源代理，无需 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

print(f"加载 faster-whisper 模型: {MODEL_SIZE} (cpu, int8) ...")
model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")
print("模型就绪")


@app.get("/api/health")
def health() -> dict:
    return {"ok": True, "model": MODEL_SIZE}


@app.post("/api/transcribe")
async def transcribe(file: UploadFile = File(...)) -> dict:
    audio = await file.read()
    if not audio:
        raise HTTPException(status_code=400, detail="empty audio file")
    if len(audio) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="audio file too large (max 25MB)")

    try:
        segments, info = model.transcribe(
            io.BytesIO(audio),
            vad_filter=True,
            beam_size=1,
            # 不传 language，让模型自动检测（中文/英文均可）
        )
        text = "".join(seg.text for seg in segments).strip()
    except Exception as exc:  # PyAV 解码失败等
        raise HTTPException(status_code=422, detail=f"transcription failed: {exc}") from exc

    return {
        "text": text,
        "language": info.language,
        "language_probability": round(info.language_probability, 2),
    }
