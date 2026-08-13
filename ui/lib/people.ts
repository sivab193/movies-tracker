export function personSlug(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export function creditNames(value?: string | string[] | null) {
  if (Array.isArray(value)) return value.filter(Boolean)
  if (!value || value === "N/A") return []
  return value.split(",").map((name) => name.trim()).filter(Boolean)
}
