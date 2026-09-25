# Life Book Fused UI Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved fused Life Book visual system with a centered mark, seamless dark-to-blue-gray transitions, fluid Library coverflow dragging, and a tactile 3D book-opening animation.

**Architecture:** Keep the current React ownership boundaries. `App.tsx` supplies the centered brand and tab transition state, `Library` owns pointer physics and book dialog state, and `styles.css` owns the fused palette and all visual motion. Existing audio and memory storage APIs remain untouched.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, Lucide React, CSS transforms/transitions.

**Spec:** `docs/superpowers/specs/2026-09-25-life-book-fused-ui-design.md`

## Global Constraints

- Keep the existing twelve monthly volumes and their current information hierarchy.
- Keep `LibraryProps` unchanged and preserve close, replay, and native button semantics.
- Do not add dependencies or modify audio recording, transcription, or storage behavior.
- Production uses one unified fused design; `.superpowers/` remains ignored and preview HTML is not an app route.
- All motion must have a `prefers-reduced-motion: reduce` path that preserves state changes without animation.

## Review Focus

- **Header semantics:** the visible brand title is gone while the centered mark still exposes an accessible name; test in the App shell test.
- **Drag continuity:** pointer movement changes the active position without a boundary jump and release clamps to valid months; test in the Library interaction suite.
- **Dialog interaction:** opening a book exposes a modal, the page control toggles the flip state, and close/replay controls remain available; test in the Library interaction suite.
- **Short viewport:** the header transition and caption remain readable at the existing `max-height: 680px` rule; verify with the production browser preview.
- **Reduced motion:** CSS removes transform/opacity animation while buttons and content still update; verify with a focused CSS assertion and browser inspection.

---

### Task 1: Center the brand mark and add the unified tab transition

**Files:**
- Modify: `App.tsx` brand header markup and stage class names.
- Modify: `styles.css` shell, brand, navigation, and stage transition rules.
- Test: `tests/today-orb.test.tsx` for the accessible centered brand mark.

**Interfaces:**
- Consumes: existing `tab` state and `.app-shell.is-library` class.
- Produces: a `.brand` containing only an accessible `BookOpen` mark and a `.main-stage` that receives a tab transition class.

- [ ] **Step 1: Write the failing test**

Add a test that renders the app and asserts the header has no visible `Life Book` text, has an accessible brand label, and keeps both navigation buttons:

```tsx
it('uses an icon-only accessible brand header', () => {
  render(<App />);
  expect(screen.queryByText('Life Book')).toBeNull();
  expect(screen.getByRole('banner', { name: 'Life Book' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Library' })).toBeTruthy();
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npm test -- --run tests/today-orb.test.tsx`

Expected: FAIL because the current header renders the visible `Life Book` span and has no banner accessible name.

- [ ] **Step 3: Implement the header and transition contract**

In `App.tsx`, replace the header span with a visually hidden accessible label and add a transition-aware class to the stage:

```tsx
<header className="brand" aria-label="Life Book">
  <BookOpen strokeWidth={1.25} aria-hidden="true" />
  <span className="sr-only">Life Book</span>
</header>
<section className={`main-stage ${phase} tab-${tab}`} ...>
```

In `styles.css`, center `.brand`, add the gold/aqua fused mark treatment, and define `.main-stage` opacity/translate transitions plus a reduced-motion override. Keep the existing shell size and navigation dimensions.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `npm test -- --run tests/today-orb.test.tsx`

Expected: PASS, including the existing Today orb assertions.

- [ ] **Step 5: Commit**

```bash
git add App.tsx styles.css tests/today-orb.test.tsx
git commit -m "feat: center Life Book brand mark"
```

### Task 2: Refine Library drag physics and fused visual feedback

**Files:**
- Modify: `components/ui/library.tsx` pointer state and settle calculation.
- Modify: `styles.css` carousel, active book, glow, and caption transition rules.
- Test: `tests/library.test.tsx` drag continuity and clamped settling assertions.

**Interfaces:**
- Consumes: the existing `posRef`, `pitchRef`, pointer capture handlers, and `paint` callback.
- Produces: continuous drag transforms, velocity-based bounded settling, and an `.is-dragging`/active visual state.

- [ ] **Step 1: Write the failing interaction tests**

Extend the Library test suite with assertions that a drag updates immediately, a large release cannot select beyond December, and the active book carries the visual class during dragging:

```tsx
it('keeps drag motion continuous and clamps the release target', () => {
  render(<Library />);
  const carousel = screen.getByRole('region', { name: 'Memory volumes' }).querySelector('.library-books-carousel') as HTMLElement;
  const down = pointerEvent('pointerdown', 220, 11);
  const move = pointerEvent('pointermove', 20, 11);
  fireEvent(carousel, down);
  fireEvent(carousel, move);
  expect(carousel.classList.contains('is-dragging')).toBe(true);
  expect(screen.getByTestId('library-active-volume').textContent).toContain('December 2026');
  fireEvent(carousel, pointerEvent('pointerup', 20, 11));
});
```

Use the existing pointer-event helper shape in the file so the test remains compatible with jsdom.

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npm test -- --run tests/library.test.tsx`

Expected: FAIL because the current implementation does not expose an active visual state and does not verify the bounded release behavior.

- [ ] **Step 3: Implement the motion refinement**

Keep pointer capture and `touch-action: pan-y`. Update `paint` to use one smoothed distance value for translate, `rotateY`, opacity, and `translateZ`; mark the nearest book with an `is-active` class; retain `Math.max(0, Math.min(volumes.length - 1, target))` before settling. On pointer end, cap velocity carry to two positions and remove the drag class after the release animation is scheduled.

Add CSS for `.library-book.is-active` and `.library-books-carousel.is-dragging` using a restrained aqua edge glow. Keep the existing gold focus outline. Add transitions for glow/filter only, not the transform written by the animation frame.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `npm test -- --run tests/library.test.tsx`

Expected: PASS for all existing month, dialog, and drag tests.

- [ ] **Step 5: Commit**

```bash
git add components/ui/library.tsx styles.css tests/library.test.tsx
git commit -m "feat: smooth Library coverflow dragging"
```

### Task 3: Build the 3D book-opening and page-turn treatment

**Files:**
- Modify: `components/ui/library.tsx` open-book markup and flip state wiring.
- Modify: `styles.css` portal entrance, book depth, page edges, spine, and leaf rotation.
- Test: `tests/library.test.tsx` dialog and flip-state assertions.

**Interfaces:**
- Consumes: existing `openVolume`, `flipped`, `closeBook`, and `onReplay` behavior.
- Produces: a modal book with a semantic page-turn button that toggles `.is-flipped` and preserves close/replay actions.

- [ ] **Step 1: Write the failing dialog test**

Add an assertion that opening a monthly book exposes the page control, and clicking it toggles the flip class without removing the modal:

```tsx
it('turns the open book page in place', () => {
  render(<Library />);
  fireEvent.click(screen.getByRole('button', { name: /July 2026/ }));
  const page = screen.getByRole('button', { name: 'Flip page' });
  expect(page.className).not.toContain('is-flipped');
  fireEvent.click(page);
  expect(page.className).toContain('is-flipped');
  expect(screen.getByRole('dialog', { name: /July 2026/ })).toBeTruthy();
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npm test -- --run tests/library.test.tsx`

Expected: FAIL if the final class contract is not present after the initial markup refinement.

- [ ] **Step 3: Implement the 3D book layers**

Keep the current left/right content and controls. Add explicit spine, cover-depth, and page-edge elements around `.library-real-book`; keep `.library-flip-leaf` as the interactive leaf. Use `perspective`, `transform-style: preserve-3d`, `transform-origin: left center`, and `backface-visibility: hidden`. Add a `.library-portal.is-opening` entrance class and remove it only after the opening transition completes or immediately under reduced motion.

Use a 700–1000ms ease-out leaf transition, synchronized shadow changes, and a `prefers-reduced-motion` rule that sets transforms to their final state and transitions to `none`.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `npm test -- --run tests/library.test.tsx`

Expected: PASS for opening, flipping, closing, and existing replay controls.

- [ ] **Step 5: Commit**

```bash
git add components/ui/library.tsx styles.css tests/library.test.tsx
git commit -m "feat: add tactile 3D Library page turn"
```

### Task 4: Integrate, verify responsive behavior, and run the full suite

**Files:**
- Modify: `styles.css` only for final token cleanup or short-height corrections found during verification.
- Test: all existing tests and the Library/App interaction suites.

**Interfaces:**
- Consumes: the completed header, carousel, and dialog behavior from Tasks 1–3.
- Produces: a build-ready unified UI with no preview artifacts in the application bundle.

- [ ] **Step 1: Run all tests**

Run: `npm test -- --run`

Expected: all test files pass, including the new centered-brand, drag, and flip assertions.

- [ ] **Step 2: Run type-check and production build**

Run: `npm run build`

Expected: TypeScript emits no errors and Vite produces `dist/index.html` and the application assets.

- [ ] **Step 3: Verify the real browser interactions**

Run the existing local preview on port 5174 and verify: the centered icon appears on Today and Library; Library background has no header seam; mouse drag and release move through months; click opens the modal; page click and `Turn 3D Page` flip the leaf; close and replay remain usable.

- [ ] **Step 4: Verify reduced motion and short height**

Use a browser with reduced motion enabled and a viewport under 680px tall. Confirm content changes still occur, but transform/opacity animations are removed and the Library caption remains readable.

- [ ] **Step 5: Inspect the diff and commit the integration**

Run: `git diff --check && git status --short`

Expected: no whitespace errors and only intended product files are changed. Then commit:

```bash
git add App.tsx components/ui/library.tsx styles.css tests/today-orb.test.tsx tests/library.test.tsx
git commit -m "feat: unify Life Book Library interactions"
```
