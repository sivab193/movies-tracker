## 2026-07-17 - Demo Data Caveat in Next.js
**Learning:** Next.js components may contain hardcoded fallback demo data (like `DEMO_MOVIES`) that directly sets formatted strings (e.g., `runtime: "142 min"`) instead of raw values. This causes global formatting utilities (like `formatRuntimeToHHMM`) to behave incorrectly or show bugs exclusively on demo states.
**Action:** Always check the fallback state or demo constants in the specific page component being rendered (e.g., `ui/app/timer/page.tsx`) to ensure the mocked data matches the expected input type for global formatters.
