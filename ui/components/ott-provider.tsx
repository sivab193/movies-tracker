import { cn } from "@/lib/utils"

export const OTT_OPTIONS = ["Sun NXT", "Netflix", "Prime Video", "Disney+ Hotstar", "JioHotstar", "ZEE5", "SonyLIV", "aha", "Apple TV+", "MUBI", "Other"]

const BRAND_STYLES: Record<string, string> = {
  "Sun NXT": "bg-red-600 text-white",
  Netflix: "bg-[#e50914] text-white",
  "Prime Video": "bg-[#00a8e1] text-white",
  "Disney+ Hotstar": "bg-[#113ccf] text-white",
  JioHotstar: "bg-[#113ccf] text-white",
  ZEE5: "bg-zinc-900 text-white",
  SonyLIV: "bg-gradient-to-br from-violet-600 to-red-500 text-white",
  aha: "bg-amber-400 text-black",
  "Apple TV+": "bg-zinc-800 text-white",
  MUBI: "bg-yellow-300 text-black",
}

export function OttMark({ name, className }: { name: string; className?: string }) {
  const letters = name.replace(/[^a-z0-9]/gi, "").slice(0, 2).toUpperCase()
  return (
    <span aria-hidden="true" className={cn("inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-black tracking-tight shadow-sm", BRAND_STYLES[name] || "bg-primary text-primary-foreground", className)}>
      {letters}
    </span>
  )
}
