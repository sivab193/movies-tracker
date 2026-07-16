## 2024-05-14 - Accessible Password Toggles
**Learning:** Adding a basic "show password" feature often overlooks screen readers. Using button elements with dynamic `aria-label` and `title` attributes ("Show password" / "Hide password") makes this critical security interaction fully accessible while providing native tooltip hints for mouse users.
**Action:** Always wrap interactive icons in `<button>` tags with descriptive `aria-label` and `title` attributes, ensuring keyboard accessibility and screen-reader support when building toggleable UI states.
