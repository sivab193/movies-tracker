"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { getOttProviders, type OttProviderDefinition } from "@/services/ott-provider-service"

type OttProviderContextValue = {
  providers: OttProviderDefinition[]
  refresh: () => Promise<void>
}

const OttProviderContext = createContext<OttProviderContextValue>({ providers: [], refresh: async () => {} })

export function OttProviderCatalogProvider({ children }: { children: ReactNode }) {
  const [providers, setProviders] = useState<OttProviderDefinition[]>([])
  const refresh = useCallback(async () => {
    try {
      setProviders(await getOttProviders())
    } catch (error) {
      console.error("Failed to load OTT provider definitions", error)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])
  return <OttProviderContext.Provider value={{ providers, refresh }}>{children}</OttProviderContext.Provider>
}

export const useOttProviders = () => useContext(OttProviderContext)
