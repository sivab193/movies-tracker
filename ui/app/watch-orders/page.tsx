"use client";

import { useEffect, useState } from "react";
import { getAllWatchOrders } from "@/services/watch-order-service";
import { formatRuntimeMinutes, resolveApiUrl } from "@/lib/types";
import type { WatchOrder } from "@/lib/types";
import Link from "next/link";
import { Header } from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Loader2, ListOrdered, Film, Tv, Clock, ArrowRight } from "lucide-react";

export default function WatchOrdersPage() {
  const [watchOrders, setWatchOrders] = useState<WatchOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setWatchOrders(await getAllWatchOrders());
      } catch (err) {
        setError("Failed to load watch orders. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-1 container max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold flex items-center gap-2 mb-2">
            <ListOrdered className="w-8 h-8 text-primary" />
            Universe Watch Orders
          </h1>
          <p className="text-muted-foreground">
            Explore timelines and canonical viewing orders for your favorite cinematic universes.
          </p>
        </div>

        {error && (
          <div className="bg-destructive/15 text-destructive text-sm p-4 rounded-md mb-6 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin w-8 h-8 text-muted-foreground" />
          </div>
        ) : watchOrders.length === 0 ? (
          <div className="text-center py-20 border rounded-lg border-dashed">
            <ListOrdered className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No watch orders found</h3>
            <p className="text-muted-foreground">Check back later for curated timelines.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {watchOrders.map((order) => {
              const summary = order.summary || { movieCount: 0, seriesCount: 0, totalRuntimeMinutes: 0 };
              const posters = order.posterUrls || [];
              const itemCount = summary.movieCount + summary.seriesCount || order.items?.length || 0;

              return (
                <Link
                  key={order.id}
                  href={`/w/${order.slug || order.id}`}
                  className="group relative overflow-hidden rounded-xl border bg-card/60 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
                >
                  {/* Poster strip */}
                    <div className="relative h-32 overflow-hidden bg-muted">
                    {order.coverPosterUrl ? (
                      <img src={resolveApiUrl(order.coverPosterUrl)} alt="" aria-hidden className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full">
                        {posters.map((poster, i) => (
                        <img
                          key={`${poster}-${i}`}
                          src={resolveApiUrl(poster)}
                          alt=""
                          aria-hidden
                          className="h-full flex-1 object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                        ))}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
                  </div>

                  <div className="p-5 -mt-10 relative">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h2 className="text-xl font-semibold group-hover:text-primary transition-colors">
                        {order.name}
                      </h2>
                      <Badge variant="secondary" className="whitespace-nowrap">
                        {itemCount} items
                      </Badge>
                    </div>

                    {order.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{order.description}</p>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                      {summary.movieCount > 0 && (
                        <span className="flex items-center gap-1.5">
                          <Film className="w-3.5 h-3.5 text-blue-500" />
                          {summary.movieCount}
                        </span>
                      )}
                      {summary.seriesCount > 0 && (
                        <span className="flex items-center gap-1.5">
                          <Tv className="w-3.5 h-3.5 text-purple-500" />
                          {summary.seriesCount}
                        </span>
                      )}
                      {summary.totalRuntimeMinutes > 0 && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {formatRuntimeMinutes(summary.totalRuntimeMinutes)}
                        </span>
                      )}
                      <span className="ml-auto flex items-center gap-1 font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                        View timeline
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
