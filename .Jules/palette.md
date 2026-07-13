## 2023-11-09 - Accessible Movie Cards
**Learning:** Screen reader users often experience redundant noise when interactive cards (like a Movie Card) have internal elements with alt text.
**Action:** When a whole card is wrapped in a `Link` or `button`, add an `aria-label` to the wrapper (e.g., "View details for Movie Title") and set internal decorative elements (like posters) to `aria-hidden="true"` and `alt=""`. Also added `focus-visible` styles to ensure clear keyboard navigation visibility.
