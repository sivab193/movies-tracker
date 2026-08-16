import { ExternalLink, Tv } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { WatchProvider } from "@/lib/types"
import { OttMark } from "@/components/ott-provider"

export function WatchOnlineSection({ providers, className }: { providers?: WatchProvider[]; className?: string }) {
  return (
    <section className={className}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Tv className="h-5 w-5 text-primary" />
            Watch online
          </CardTitle>
        </CardHeader>
        <CardContent>
          {providers?.length ? (
            <div className="space-y-2">
              {providers.map((provider) => (
                <a key={`${provider.name}-${provider.url}`} href={provider.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg border p-2.5 transition-colors hover:border-primary/50 hover:bg-muted/50">
                  <OttMark name={provider.name} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{provider.name}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {(provider.regions?.length ? provider.regions : ["Region not specified"]).map((region) => <Badge key={region} variant="secondary" className="font-normal">{region}</Badge>)}
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                </a>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">Not available yet.</p>}
        </CardContent>
      </Card>
    </section>
  )
}
