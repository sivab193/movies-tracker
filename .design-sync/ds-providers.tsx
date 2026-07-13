// The provider wrapper every preview card (and every design built from this system) mounts.
//
// It composes movies-tracker's REAL providers in the same order app/layout.tsx does —
// ThemeProvider outside, AuthProvider inside. Nothing here is a mock:
//   • ThemeProvider (contexts/theme-context) puts the light/dark class on <html>, which is
//     what activates the oklch token set. Without it, components render with no theme.
//   • AuthProvider (contexts/auth-context) supplies the context Header/BottomNav read via
//     useAuth(), which throws outside a provider. It needs no Firebase config to work:
//     lib/firebase only initializes when NEXT_PUBLIC_FIREBASE_* are set, and AuthProvider
//     handles a null `auth` by settling into the logged-out state — which is exactly the
//     state a design should be composed against.
import type { ReactNode } from 'react'
import { ThemeProvider } from '../ui/contexts/theme-context'
import { AuthProvider } from '../ui/contexts/auth-context'

export function DesignSystemProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  )
}
