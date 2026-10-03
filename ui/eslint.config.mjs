import { defineConfig } from "eslint/config"
import nextCoreWebVitals from "eslint-config-next/core-web-vitals"
import nextTypeScript from "eslint-config-next/typescript"

export default defineConfig([
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    // The existing application predates the strict Next.js 16 lint defaults.
    // Keep legacy debt visible without making the repository's lint command unusable.
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react/no-unescaped-entities": "warn",
      "prefer-const": "warn",
      "jsx-a11y/alt-text": "warn",
      "@next/next/no-html-link-for-pages": "warn",
    },
  },
])
