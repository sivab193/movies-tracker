## 2026-07-10 - Missing ARIA Labels on Dialog Clear/Search Buttons
**Learning:** Custom UI dialogs often use icon-only close (X) and search buttons without ARIA labels, creating inaccessible tap targets for screen readers.
**Action:** Add explicit `aria-label` attributes describing the button's action (e.g., 'Clear movie selection', 'Search movies') whenever replacing default inputs with custom icon-only controls.
