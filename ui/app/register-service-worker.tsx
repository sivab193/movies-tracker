"use client"

import { useEffect } from "react"

export default function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return

    const swUrl = "/sw.js"
    const registerWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register(swUrl)
        
        // Immediately check for a newer sw.js whenever the page loads
        registration.update()

        // If a new service worker is already waiting, tell it to take over
        if (registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" })
        }

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // New update installed; tell it to activate immediately
                newWorker.postMessage({ type: "SKIP_WAITING" })
              }
            })
          }
        })
      } catch (error) {
        console.error("Service worker registration failed:", error)
      }
    }

    registerWorker()

    // Also check for updates when user returns to tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        navigator.serviceWorker.getRegistration().then((reg) => reg?.update())
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [])

  return null
}
