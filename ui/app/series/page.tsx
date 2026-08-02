"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { getAllSeries, getSeriesProgress } from "@/services/series-service";
import { Header } from "@/components/header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Tv, Star, Search, Clock } from "lucide-react";
import { formatRuntimeMinutes, resolveApiUrl, Series, SeriesProgress } from "@/lib/types";

export default function SeriesPage() {
  const { user, loading: authLoading } = useAuth();
  const [series, setSeries] = useState<Series[]>([]);
  const [progress, setProgress] = useState<SeriesProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await getAllSeries(debouncedSearch);
        setSeries(data);
      } catch (err) {
        setError("Failed to load series. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [debouncedSearch]);

  useEffect(() => {
    async function loadProgress() {
      if (user && !authLoading) {
        try {
          const userProgress = await getSeriesProgress(user.uid);
          setProgress(userProgress);
        } catch (err) {
          console.error("Failed to load series progress", err);
        }
      }
    }
    loadProgress();
  }, [user, authLoading]);

  // Helper to find user progress for a series
  const getProgressForSeries = (imdbId: string) => {
    return progress.find(p => p.imdbId === imdbId);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      
      <main className="flex-1 container max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
            <Tv className="w-8 h-8 text-primary" />
            Series
          </h1>
          <p className="text-muted-foreground">
            Explore TV series, track seasons, and see total runtimes.
          </p>
        </div>

        <div className="mb-8 relative max-w-md">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-5 h-5 text-muted-foreground" />
          </div>
          <Input
            type="text"
            placeholder="Search series..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
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
        ) : series.length === 0 ? (
          <div className="text-center py-20 border rounded-lg border-dashed">
            <Tv className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No series found</h3>
            <p className="text-muted-foreground">Try adjusting your search or check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {series.map((s) => {
              const userProgress = getProgressForSeries(s.imdbId);
              const genres = s.genre ? s.genre.split(',').map(g => g.trim()) : [];
              
              return (
                <Link href={`/series/${s.id}`} key={s.id} className="group block">
                  <Card className="h-full flex flex-col overflow-hidden hover:border-primary/50 transition-colors">
                    <div className="flex h-48">
                      {/* Poster */}
                      <div className="w-32 flex-shrink-0 bg-muted relative">
                        {s.posterUrl && s.posterUrl !== "N/A" ? (
                          <img
                            src={resolveApiUrl(s.posterUrl)}
                            alt={s.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Tv className="h-10 w-10 text-muted-foreground opacity-50" />
                          </div>
                        )}
                      </div>
                      
                      {/* Details */}
                      <div className="flex flex-col flex-1 p-4">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                            {s.title}
                          </h3>
                          {s.imdbRating && (
                            <Badge variant="secondary" className="flex items-center gap-1 shrink-0 ml-2">
                              <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                              {s.imdbRating}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-sm text-muted-foreground mb-2">
                          {s.year}–{s.isOngoing ? 'present' : (s.endYear || '')}
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mb-2">
                          {genres.slice(0, 3).map((g, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                              {g}
                            </Badge>
                          ))}
                          {genres.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">+{genres.length - 3}</span>
                          )}
                        </div>
                        
                        <div className="mt-auto pt-2 space-y-2">
                          <div className="text-sm font-medium">
                            {s.totalSeasons} season{s.totalSeasons !== 1 && 's'} · {s.totalEpisodes} episode{s.totalEpisodes !== 1 && 's'}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-bold text-primary flex items-center gap-1.5 bg-primary/10 px-2 py-1 rounded-md w-fit">
                              <Clock className="w-3.5 h-3.5" />
                              {formatRuntimeMinutes(s.totalRuntimeMinutes)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* User Progress */}
                    {user && (
                      <div className="bg-muted/50 px-4 py-2 text-xs border-t flex justify-between items-center mt-auto">
                        <span className="text-muted-foreground font-medium">Your Progress:</span>
                        <span className="font-semibold">
                          {userProgress ? userProgress.watchedSeasons.length : 0} / {s.totalSeasons} seasons watched
                        </span>
                      </div>
                    )}
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
