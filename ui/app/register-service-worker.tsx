"use client"

import { useEffect } from "react"

export default function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return

    const swUrl = "/sw.js"
    const registerWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register(swUrl)
        console.log("Service worker registered:", registration)
      } catch (error) {
        console.error("Service worker registration failed:", error)
      }
    }

    registerWorker()
  }, [])

  return null
}
