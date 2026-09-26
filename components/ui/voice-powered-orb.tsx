"use client";
import { useEffect, useRef, useState } from 'react';
import { Renderer, Program, Mesh, Triangle, Vec3 } from 'ogl';
import { cn } from '@/lib/utils';
import { openMicrophone } from '@/lib/microphone';
import { vert, frag } from './orb-shaders';

interface VoicePoweredOrbProps {
  className?: string;
  hue?: number;
  enableVoiceControl?: boolean;
  voiceSensitivity?: number;
  maxRotationSpeed?: number;
  maxHoverIntensity?: number;
  onVoiceDetected?: (detected: boolean) => void;
  onMicrophoneState?: (state: 'ready' | 'error') => void;
  onMicrophoneStream?: (stream: MediaStream | null) => void;
}

interface OrbMotionState { level: number; time: number; rotation: number }
interface OrbMotionOptions { maxRotationSpeed: number; maxHoverIntensity: number }

export function orbFrameDelta(lastTime: number, now: number, resuming = false) {
  if (!lastTime) return 0;
  const elapsed = Math.max((now - lastTime) / 1000, 0);
  return resuming || elapsed > 1 ? 0.05 : elapsed;
}

export function advanceOrbMotion(
  previous: OrbMotionState, rawLevel: number, dt: number, reducedMotion: boolean, options: OrbMotionOptions,
) {
  if (reducedMotion) return {...previous, level: 0, hover: 0, hoverIntensity: 0};

  const target = Math.min(Math.max(rawLevel, 0), 1);
  const duration = Math.max(dt, 0);
  const response = target > previous.level ? 0.18 : 0.35;
  const blend = 1 - Math.exp(-duration / response);
  const level = previous.level + (target - previous.level) * blend;
  const averageLevel = duration > 0
    ? target + (previous.level - target) * response * blend / duration
    : previous.level;

  return {
    level,
    time: previous.time + duration * (0.18 + averageLevel * 0.82),
    rotation: previous.rotation + duration * (0.08 + averageLevel * (0.22 + options.maxRotationSpeed * 1.1)),
    hover: 0.14 + level * 0.86,
    hoverIntensity: options.maxHoverIntensity * (0.18 + level * 0.82),
  };
}

export function VoicePoweredOrb({className, hue = 0, enableVoiceControl = true,
  voiceSensitivity = 1.5, maxRotationSpeed = 1.2, maxHoverIntensity = 0.8,
  onVoiceDetected, onMicrophoneState, onMicrophoneStream}: VoicePoweredOrbProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<{ analyser: AnalyserNode; data: Uint8Array<ArrayBuffer> } | null>(null);
  const options = useRef({hue, voiceSensitivity, maxRotationSpeed, maxHoverIntensity, onVoiceDetected, onMicrophoneState});
  options.current = {hue, voiceSensitivity, maxRotationSpeed, maxHoverIntensity, onVoiceDetected, onMicrophoneState};
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    if (!enableVoiceControl) return;
    const controller = new AbortController();
    let context: AudioContext | undefined;
    let source: MediaStreamAudioSourceNode | undefined;
    const start = async () => {
      try {
        const stream = await openMicrophone(controller.signal);
        if (!stream) return;
        context = new AudioContext();
        await context.resume();
        if (controller.signal.aborted) return;
        const analyser = context.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.3;
        analyser.minDecibels = -90;
        analyser.maxDecibels = -10;
        source = context.createMediaStreamSource(stream);
        source.connect(analyser);
        audioRef.current = {analyser, data: new Uint8Array(analyser.frequencyBinCount)};
        options.current.onMicrophoneState?.('ready');
        onMicrophoneStream?.(stream);
      } catch {
        if (!controller.signal.aborted) {
          controller.abort();
          source?.disconnect();
          if (context && context.state !== 'closed') void context.close().catch(() => {});
          options.current.onMicrophoneState?.('error');
        }
      }
    };
    void start();
    return () => {
      controller.abort();
      audioRef.current = null;
      onMicrophoneStream?.(null);
      source?.disconnect();
      if (context && context.state !== 'closed') void context.close().catch(() => {});
      options.current.onVoiceDetected?.(false);
    };
  }, [enableVoiceControl]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let renderer: Renderer;
    try { renderer = new Renderer({alpha: true, premultipliedAlpha: true, antialias: true, dpr: Math.min(devicePixelRatio || 1, 2)}); }
    catch { setFallback(true); return; }
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.setAttribute('aria-hidden', 'true');
    container.appendChild(canvas);
    const geometry = new Triangle(gl);
    const program = new Program(gl, {vertex: vert, fragment: frag, uniforms: {
      iTime: {value: 0}, iResolution: {value: new Vec3()}, hue: {value: options.current.hue},
      hover: {value: 0}, rot: {value: 0}, hoverIntensity: {value: 0},
    }});
    const mesh = new Mesh(gl, {geometry, program});
    const resize = () => {
      renderer.setSize(container.clientWidth, container.clientHeight);
      program.uniforms.iResolution.value.set(canvas.width, canvas.height, canvas.width / canvas.height);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0, lastTime = 0, detected = false, wasHidden = document.hidden;
    const onVisibilityChange = () => { if (document.hidden) wasHidden = true; };
    document.addEventListener('visibilitychange', onVisibilityChange);
    let motion: OrbMotionState = {level: 0, time: 0, rotation: 0};
    const update = (now: number) => {
      frame = requestAnimationFrame(update);
      const hidden = document.hidden;
      const dt = orbFrameDelta(lastTime, now, wasHidden || hidden);
      lastTime = now;
      if (hidden) { wasHidden = true; return; }
      wasHidden = false;
      const settings = options.current;
      const audio = audioRef.current;
      let level = 0;
      if (audio) {
        audio.analyser.getByteFrequencyData(audio.data);
        let sum = 0;
        for (const value of audio.data) sum += (value / 255) ** 2;
        level = Math.min(Math.sqrt(sum / audio.data.length) * settings.voiceSensitivity * 3, 1);
      }
      const nextDetected = level > 0.1;
      if (nextDetected !== detected) { detected = nextDetected; settings.onVoiceDetected?.(detected); }
      const nextMotion = advanceOrbMotion(motion, level, dt, reducedMotion.matches, settings);
      motion = nextMotion;
      program.uniforms.iTime.value = nextMotion.time;
      program.uniforms.rot.value = nextMotion.rotation;
      program.uniforms.hue.value = settings.hue;
      program.uniforms.hover.value = nextMotion.hover;
      program.uniforms.hoverIntensity.value = nextMotion.hoverIntensity;
      renderer.render({scene: mesh});
    };
    frame = requestAnimationFrame(update);
    const onContextLost = (event: Event) => {event.preventDefault(); cancelAnimationFrame(frame); setFallback(true);};
    canvas.addEventListener('webglcontextlost', onContextLost);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      observer.disconnect();
      canvas.removeEventListener('webglcontextlost', onContextLost);
      geometry.remove();
      program.remove();
      canvas.remove();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);
  return <div ref={containerRef} className={cn('voice-orb relative h-full w-full', fallback && 'orb-fallback', className)} role="img" aria-label="Animated voice orb" />;
}
