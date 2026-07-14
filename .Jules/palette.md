## 2026-07-14 - Missing ARIA Labels on Icon-Only Buttons
**Learning:** Icon-only buttons (like Trash, Pencil) are frequently used across the app (in tables, lists, headers) without `aria-label` or `title` attributes, making them inaccessible to screen readers.
**Action:** When adding or reviewing icon-only buttons in the future, always ensure they have an `aria-label` and a `title` attribute.
