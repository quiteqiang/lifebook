# Orb smooth motion report

## Changed files

- `components/ui/voice-powered-orb.tsx`: eased analyser levels with frame-time-aware exponential attack and release, then used the eased value for rotation, shader time, hover deformation, and hover intensity. Kept the microphone callback threshold on the raw level.
- `components/ui/orb-shaders.ts`: added a small breathing scale driven by the existing shader time.
- `tests/orb-motion.test.ts`: covered idle motion, speaking attack and release, equivalent elapsed time at 60 and 120 frames, and reduced motion.

## Motion decisions

- Attack response is 0.18 seconds; release response is 0.35 seconds. The slower release lets motion settle after speech rather than stopping at the threshold.
- Idle shader time advances at 0.18 seconds per second and rotation at 0.08 radians per second. Idle hover deformation is low, and speech raises all three motion channels smoothly.
- The level easing uses elapsed frame time, and rotation/time use the exact average eased level over each frame. This avoids material speed differences across display refresh rates.
- Reduced motion freezes shader time and rotation, removes hover deformation, and clears the eased voice level. Public props, microphone callbacks, MediaRecorder integration, palette, and WebGL fallback remain unchanged.

## Verification

- Red test: `npm test -- tests/orb-motion.test.ts` failed as expected before implementation because `advanceOrbMotion` did not exist.
- Focused: `npm test -- tests/orb-motion.test.ts tests/orb-palette.test.ts tests/today-orb.test.tsx` — 3 files, 11 tests passed.
- Full: `npm test` — 11 files, 42 tests passed.
- Build: `npm run build` — passed; 1,653 modules transformed. The sandboxed first attempt could not write `tsconfig.tsbuildinfo`; the authorized worktree build passed with write access.
- `git diff --check` — passed.
- Browser preview at `http://127.0.0.1:4173/`: the teal/mint Orb rendered and changed between two idle screenshots, confirming idle progression. Speaking and post-speaking values were verified by focused tests; a live microphone speaking cycle was not performed in the browser preview.

## Concerns

- Live microphone audio and the visual speaking transition still need a device-backed manual check. The browser preview inspection covered idle motion only.
- Vitest prints a Node experimental `localStorage` warning in an existing Today test; all tests pass.

## Low-frame-rate timing correction

- Review found that the original 50 ms cap applied to every frame. At a sustained 5 FPS, the Orb advanced only 50 ms for each 200 ms frame, making its motion four times slower.
- The first correction used the actual elapsed time through 250 ms and applied a 50 ms recovery step after a longer gap. The render loop continued updating `lastTime` before returning for a hidden tab. The following boundary correction supersedes that 250 ms threshold.
- A focused test was written first and failed because `orbFrameDelta` did not exist. It covers a 200 ms frame and a 2-second resume gap.
- Verification after the correction: focused Orb tests — 3 files, 12 tests passed; `npm test` — 11 files, 43 tests passed; `npm run build` — passed, 1,653 modules transformed; `git diff --check` — passed.

## Visible low-FPS boundary correction

- A sustained visible cadence of 300 ms still hit the prior 250 ms cap. The render loop now records when the page was hidden and clamps only its first resumed frame to 50 ms. A gap over one second is also treated as a suspended-render recovery. Other visible frames use their full elapsed time, including 300 ms frames.
- The focused boundary test failed first at the visible 300 ms assertion. It now covers ordinary 200 and 300 ms frames, a hidden/resumed frame, the next visible frame, and a two-second suspension gap.
- Verification: focused Orb tests — 3 files, 12 tests passed; `npm test` — 11 files, 43 tests passed; `npm run build` — passed, 1,653 modules transformed; `git diff --check` — passed.
