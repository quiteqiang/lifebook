# Life Book Fused UI Design Specification

**Date:** 2026-09-25  
**Status:** Approved for implementation planning  
**Decision:** Use one unified production design, based on the approved fusion of the two visual directions. The two independent HTML previews remain design references only and are not production routes.

## Goal

Make Life Book feel like one coherent, tactile voice journal: the header is reduced to a centered book mark, the black header fades into the deep blue-gray Library surface, Library browsing feels fluid under mouse or touch, and opening a monthly book produces a clear 3D page turn.

## Existing context

- `App.tsx` owns Today/Library tab state, the brand header, the stage, and audio replay wiring.
- `components/ui/library.tsx` owns the twelve monthly volumes, pointer dragging, coverflow positioning, the volume caption, and the open-book dialog.
- `styles.css` owns the shell, navigation, gradients, book treatment, and current flip-leaf animation.
- Existing behavior must remain available: twelve month volumes, click-to-open dialog, close dialog, replay voice, and mouse dragging.

## Visual direction

The final visual system combines the two approved directions:

1. **Editorial archive structure:** black negative space, warm gold rules, restrained serif editorial type, tall tactile book spines, and quiet spacing.
2. **Deep tide atmosphere:** deep navy-gray surface, cool blue-gray depth, restrained aqua/teal light, and stronger spatial separation between shelf, books, and background.

The page must avoid a hard horizontal seam between the brand header and Library. The shell and Library page use compatible layered gradients so the transition begins behind the centered mark and resolves gradually into the shelf area.

## Header and navigation

- Remove the visible `Life Book` text from the top brand header.
- Keep one centered `BookOpen` mark as the visual anchor. It remains accessible through an `aria-label` or visually hidden label such as `Life Book`.
- The mark uses the existing gold accent with a very low-opacity aqua halo; the halo must not compete with the books.
- Keep the bottom Today/Library navigation and its active state. Its colors should use the same gold and blue-gray tokens as the main surface.
- Switching tabs uses a short opacity/translate transition for the stage content and a background-color transition for the shell. Reduced-motion users receive no movement.

## Library browsing interaction

The existing monthly volume layout remains unchanged in size and information hierarchy. Only the interaction treatment changes.

- Pointer and touch dragging remain supported through pointer capture.
- During drag, the active volume follows the pointer continuously; neighboring volumes respond with a smaller, smoothed rotation and depth shift.
- The current coverflow transform must not jump when the pointer crosses a month boundary.
- On release, use the measured drag velocity to select the nearest reasonable month, then settle with a spring-like easing. Clamp the selection to January–December.
- Active and hovered books get a low-intensity aqua edge glow plus the existing warm highlight. The glow fades when the drag ends.
- The carousel keeps `touch-action: pan-y`, keyboard focus, and visible focus rings. Dragging must not prevent vertical page gestures outside the carousel.
- The active volume caption continues to update during drag and settles with the selected book.

## 3D book opening interaction

Clicking a monthly volume opens the existing dialog, but the book inside it becomes a real two-page 3D object.

- The dialog fades and slightly scales into place over the Library surface.
- The book has a visible spine, left/right page blocks, page edges, cover depth, and a soft contact shadow.
- The initial open state shows the cover or right leaf rotated toward the reader. It settles to the open spread using a perspective transform.
- Clicking the page or `Turn 3D Page` rotates the active leaf around the spine with `transform-origin` at the spine, `backface-visibility: hidden`, and synchronized shadow/edge changes.
- The flip duration is approximately 700–1000ms with a smooth ease-out curve. It must not block close or replay controls after the animation starts.
- The current entry copy, audio metadata, close button, and replay action remain intact.
- Dialog semantics stay intact: `role="dialog"`, `aria-modal="true"`, accessible close control, and keyboard-operable flip control.

## Component and style boundaries

- `App.tsx`: header markup and tab transition class/state only. Do not move audio recording or replay logic.
- `components/ui/library.tsx`: add the semantic hidden label for the centered mark if needed, preserve volume data, and refine drag/settle and open-book state transitions. Keep the `LibraryProps` interface unchanged.
- `styles.css`: define shared color tokens for the fused palette, centered brand treatment, tab transition, carousel glow, and book-opening 3D layers. Keep Library styles grouped together.
- Do not add a new UI dependency. Use existing React, Lucide icons, and CSS transforms.
- Do not ship the brainstorming preview HTML as app routes. Keep it ignored under `.superpowers/`.

## Accessibility and reduced motion

- The centered mark has an accessible name even though its text is visually hidden.
- Every monthly book remains a native button with a month-specific accessible name.
- Drag remains usable with pointer input; keyboard users can focus and activate each book directly.
- `prefers-reduced-motion: reduce` disables carousel easing, glow animation, dialog scale motion, and page rotation while preserving state changes and content.

## Verification criteria

1. The top of both Today and Library shows only a centered book mark; no visible `Life Book` text remains in the top header.
2. Library’s black header and deep blue-gray page read as one continuous gradient with no visible seam.
3. Dragging with a mouse changes book position continuously, and release settles to a nearby month without a jump.
4. Touch/pointer capture and keyboard activation still work; the selected caption matches the active book.
5. Clicking a book opens the dialog and visibly flips a 3D leaf; clicking the page or `Turn 3D Page` toggles the flip.
6. Close and Replay Voice still work, and all existing tests plus new interaction assertions pass.
7. Production build succeeds with no new dependencies.

## Out of scope

- Changing the monthly book colors, book data, or current Library information hierarchy.
- Adding new audio processing or transcription behavior.
- Shipping multiple production routes for the two preview directions.
- Replacing the existing Today orb.
