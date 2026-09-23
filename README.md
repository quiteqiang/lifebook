# Life Book

A minimal, mobile-first React home page with the supplied OGL voice-powered orb.

## Run

```sh
npm install
npm run dev
```

Open http://localhost:5173. On a phone, microphone access requires HTTPS; localhost works on the development computer. Click the microphone and allow access to enable voice response. Click the stop button or switch to MyBook to release it.

```sh
npm run build
npm test
```

## Structure

- `App.tsx`: Today / MyBook layout, MediaRecorder lifecycle, keepsake box and playback controls.
- `components/ui/voice-powered-orb.tsx`: OGL rendering and audio analysis.
- `components/ui/card-stack.tsx`: Framer Motion 3D fan stack used by MyBook for browsing memory books.
- `components/ui/orb-shaders.ts`: original supplied GLSL shaders.
- `components/ui/button.tsx`: supplied shadcn-style button.
- `lib/microphone.ts`: cancellation-safe microphone ownership.
- `lib/memories.ts`: recording-card metadata, waveform normalization and local metadata persistence.
- `lib/audio-store.ts`: IndexedDB audio-file persistence with an in-memory fallback.
- `styles.css`: Tailwind v4 entry point and responsive page styles.

React, TypeScript, Tailwind v4, Framer Motion and shadcn aliases are configured. `components/ui` keeps reusable components separate from page composition and matches `components.json`; use `npx shadcn@latest add <component>` to add components later. No photos are required for the selected minimal design.

## Orb behavior

The supplied shader continuously flows while idle. Voice analysis uses FFT 512, smoothing 0.3, sensitivity 1.5, maximum rotation speed 1.2 and maximum hover intensity 0.8. The original purple/cyan palette is retained; hue is configurable. Canvas DPR is capped at 2, resizing uses ResizeObserver, and reduced-motion preferences stop continuous motion. WebGL failure displays a CSS fallback; the fallback does not respond to voice.

Microphone permission is requested only on button activation. A single audio session is owned by the component; stopping, navigating or unmounting releases tracks and AudioContext, including late permission responses. When recording stops, the Blob is saved to IndexedDB, a waveform card is created, and a 1.45-second CSS animation drops that card into the keepsake box. Metadata is capped at the latest 24 entries in localStorage. MyBook card controls load the stored Blob and play it locally.

Recording persistence and playback are implemented locally. Transcription, emotional responses, sync and a backend are not implemented.
