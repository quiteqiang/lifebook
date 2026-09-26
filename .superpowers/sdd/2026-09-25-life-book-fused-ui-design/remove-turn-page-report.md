# Remove Library Turn 3D Page action

Removed the portal's `Turn 3D Page` button and its icon/ref/focus wiring. The in-book leaf remains keyboard reachable and toggles in both directions; Replay Voice and the reduced-motion flow remain available. Reduced-motion styling now leaves the flipped leaf visible and operable.

## Verification

- `npm test -- tests/library.test.tsx` — 15 passed.
- `npm test` — 43 passed across 11 files.
- `npm run build` — passed.
- `git diff --check` — passed.

The test runner emitted its existing Node localStorage experimental warning.
