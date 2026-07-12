## 2024-05-19 - Accessible Clear Inputs
**Learning:** Found instances where literal text characters (like "✕") were being used as clear buttons within inputs. Screen readers announce these as "multiply" or "cross", which is confusing contextually. Furthermore, they lack adequate hit areas.
**Action:** Replace text-character icons with semantic SVG icons (like Lucide's `X`) and ensure icon-only buttons include descriptive `aria-label`s (e.g. `aria-label="Clear search"`) and proper spacing for tap targets.
