import { cn } from "@/lib/utils"

type BrandLogoProps = {
  variant?: "logo" | "mark"
  className?: string
  decorative?: boolean
}

/** Follow the app's theme class, including a manually selected theme. */
export function BrandLogo({ variant = "mark", className, decorative = false }: BrandLogoProps) {
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center", className)}>
      <img
        src={`/brand/${variant}-light.svg`}
        alt={decorative ? "" : "MediaVerse"}
        width={variant === "logo" ? 623 : 144}
        height={variant === "logo" ? 687 : 144}
        className="h-full w-full object-contain dark:hidden"
      />
      <img
        src={`/brand/${variant}-dark.svg`}
        alt={decorative ? "" : "MediaVerse"}
        width={variant === "logo" ? 623 : 144}
        height={variant === "logo" ? 687 : 144}
        className="hidden h-full w-full object-contain dark:block"
      />
    </span>
  )
}
