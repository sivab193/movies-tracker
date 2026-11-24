type SectionHeadingProps = {
  chip: string
  label: string
  title: string
  description?: string
}

/** Shared act heading for the homepage: chip + mono label + big uppercase title. */
export function SectionHeading({ chip, label, title, description }: SectionHeadingProps) {
  return (
    <div className="mb-8 sm:mb-10">
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex bg-primary px-2 py-1 font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground">
          {chip}
        </span>
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </span>
      </div>
      <h2 className="mt-4 text-3xl font-bold uppercase tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground text-pretty">
          {description}
        </p>
      ) : null}
    </div>
  )
}
