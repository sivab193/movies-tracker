"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  type User,
} from "firebase/auth"
import { auth, googleProvider } from "@/lib/firebase"
import type { UserProfile } from "@/lib/types"
import { getMySession, updateUserSettings } from "@/services/user-service"
import { SignupWelcomeDialog, type WelcomePrefs } from "@/components/signup-welcome-dialog"

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showWelcome, setShowWelcome] = useState(false)
  const [pendingDisplayName, setPendingDisplayName] = useState<string | null>(null)

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)

      if (firebaseUser) {
        try {
          // Fetch only identity and access flags. History is loaded by the
          // dashboard/settings pages, so navigation is not blocked by it.
          const profile = await getMySession(firebaseUser)
          setUserProfile(profile)
          if (profile?.isNewUser) {
            setShowWelcome(true)
          }
        } catch (err) {
          console.error("Auth context error: Failed to fetch signed-in session", err)
          // Fallback minimal profile if API fails (e.g. new user not yet synced)
          setUserProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            createdAt: new Date(),
          } as UserProfile)
        }
      } else {
        setUserProfile(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    if (!auth || !googleProvider) throw new Error("Firebase not initialized")
    await signInWithPopup(auth, googleProvider)
  }

  const signInWithEmail = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase not initialized")
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    if (!auth) throw new Error("Firebase not initialized")
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    // The name is optional. When given, it is offered as the suggested display
    // name in the welcome dialog (only used if the user goes public).
    // The backend still assigns the default MV #N display name and the
    // MediaVerse icon as the profile picture.
    const name = displayName?.trim() || null
    setPendingDisplayName(name)
    if (name) {
      const { updateProfile } = await import("firebase/auth")
      await updateProfile(userCredential.user, { displayName: name })
    }
    // Create the backend record.
    const token = await userCredential.user.getIdToken()
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
    await fetch(`${apiBase}/users/session`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` }
    })
  }

  const handleWelcomeComplete = async (prefs: WelcomePrefs) => {
    // Throws on validation errors (e.g. custom URL taken); the dialog shows
    // the message and stays open so the user can fix it.
    await updateUserSettings(prefs)
    setUserProfile((prev) =>
      prev
        ? {
            ...prev,
            isNewUser: false,
            displayName: prefs.displayName ?? prev.displayName,
            photoURL: prefs.photoURL ?? prev.photoURL,
          }
        : prev
    )
    setPendingDisplayName(null)
    setShowWelcome(false)
  }

  const resetPassword = async (email: string) => {
    if (!auth) throw new Error("Firebase not initialized")
    await sendPasswordResetEmail(auth, email)
  }

  const signOut = async () => {
    if (!auth) throw new Error("Firebase not initialized")
    await firebaseSignOut(auth)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        resetPassword,
        signOut,
      }}
    >
      {children}
      <SignupWelcomeDialog
        open={showWelcome}
        displayName={userProfile?.displayName}
        photoURL={userProfile?.photoURL}
        suggestedDisplayName={pendingDisplayName}
        onComplete={handleWelcomeComplete}
      />
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
