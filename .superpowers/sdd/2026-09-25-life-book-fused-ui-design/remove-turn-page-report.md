# Remove Library Turn 3D Page action

Removed the portal's `Turn 3D Page` button and its icon/ref/focus wiring. The in-book leaf remains keyboard reachable and toggles in both directions; Replay Voice and the reduced-motion flow remain available. Reduced-motion styling now leaves the flipped leaf visible and operable.

## Verification

- `npm test -- tests/library.test.tsx` — 15 passed.
- `npm test` — 43 passed across 11 files.
- `npm run build` — passed.
- `git diff --check` — passed.

The test runner emitted its existing Node localStorage experimental warning.

## Follow-up: visible reverse target

Added a separate reverse face inside the page leaf. The leaf now remains a visible, readable pointer/touch target after its 3D turn, and its accessible label changes to `Flip page back`. Reduced-motion mode presents the reverse face in place so the same control remains usable without motion.

- Library tests — 16 passed, including reverse-face content, accessible label, and CSS contracts.
- Full suite — 44 passed across 11 files.
- `npm run build` — passed.
- `git diff --check` — passed.

The full suite emitted the existing Node localStorage experimental warning.
