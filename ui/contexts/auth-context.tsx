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
import { getMySettings } from "@/services/user-service"

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)

      if (firebaseUser) {
        try {
          // Fetch user profile from Backend API
          const profile = await getMySettings()
          setUserProfile(profile)
        } catch (err) {
          console.error("Auth context error: Failed to fetch user profile", err)
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

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    if (!auth) throw new Error("Firebase not initialized")
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    // Update Firebase profile with display name
    const { updateProfile } = await import("firebase/auth")
    await updateProfile(userCredential.user, { displayName })
    // Sync to backend with displayName
    const token = await userCredential.user.getIdToken()
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
    await fetch(`${apiBase}/users/me`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` }
    })
    // Update displayName in backend
    await fetch(`${apiBase}/users/settings`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ displayName })
    })
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
