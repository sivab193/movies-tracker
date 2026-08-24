"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { getAllSeries, getSeriesProgress, watchEntireSeries, unwatchEntireSeries } from "@/services/series-service";
import { Header } from "@/components/header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Tv, Search, Clock, Filter, X, SlidersHorizontal, Check } from "lucide-react";
import { formatRuntimeMinutes, resolveApiUrl, Series, SeriesProgress } from "@/lib/types";
import { OttMark } from "@/components/ott-provider";
import { RequestTitleDialog } from "@/components/request-title-dialog";

// Common TV genres
const GENRE_OPTIONS = [
  "Action",
  "Adventure",
  "Animation",
  "Biography",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Family",
  "Fantasy",
  "History",
  "Horror",
  "Music",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Sport",
  "Thriller",
  "War",
  "Western",
];

// Generate year range from 1990 to current year
function generateYearOptions(): string[] {
  const currentYear = new Date().getFullYear();
  const years: string[] = [];
  for (let y = currentYear; y >= 1990; y--) {
    years.push(String(y));
  }
  return years;
}

const YEAR_OPTIONS = generateYearOptions();

export default function SeriesPage() {
  const { user, loading: authLoading } = useAuth();
  const [series, setSeries] = useState<Series[]>([]);
  const [progress, setProgress] = useState<SeriesProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedYear, setSelectedYear] = useState("");
  const [watchAvailable, setWatchAvailable] = useState(false);
  const [sort, setSort] = useState("title_asc");
  const [updatingSeries, setUpdatingSeries] = useState<string | null>(null);

  const hasActiveFilters = selectedGenre !== "" || selectedLanguage !== "all" || selectedYear !== "" || watchAvailable;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await getAllSeries(
          debouncedSearch || undefined,
          selectedGenre || undefined,
          selectedYear || undefined,
          watchAvailable,
          sort,
          selectedLanguage
        );
        setSeries(data);
      } catch (err) {
        setError("Failed to load series. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [debouncedSearch, selectedGenre, selectedLanguage, selectedYear, watchAvailable, sort]);

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

  const toggleSeriesWatched = async (event: MouseEvent, seriesItem: Series) => {
    event.preventDefault();
    event.stopPropagation();
    if (!user || updatingSeries === seriesItem.imdbId) return;

    const existing = getProgressForSeries(seriesItem.imdbId);
    const completed = !!existing && existing.watchedSeasons.length >= seriesItem.totalSeasons;
    setUpdatingSeries(seriesItem.imdbId);
    try {
      const result = completed
        ? await unwatchEntireSeries(seriesItem.imdbId)
        : await watchEntireSeries(seriesItem.imdbId);
      setProgress((current) => {
        const withoutCurrent = current.filter((item) => item.imdbId !== seriesItem.imdbId);
        return result.seriesProgress ? [...withoutCurrent, result.seriesProgress] : withoutCurrent;
      });
    } catch (err) {
      console.error("Failed to update series progress", err);
      setError("Could not update watched status. Please try again.");
    } finally {
      setUpdatingSeries(null);
    }
  };

  const clearAllFilters = () => {
    setSelectedGenre("");
    setSelectedLanguage("all");
    setSelectedYear("");
    setWatchAvailable(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      
      <main className="flex-1 container max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
              <Tv className="w-8 h-8 text-primary" />
              Series
            </h1>
            <p className="text-muted-foreground">
              Explore TV series, track seasons, and see total runtimes.
            </p>
          </div>
          <div>
            <RequestTitleDialog />
          </div>
        </div>

        {/* Search & Filters Bar */}
        <div className="mb-8 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
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

            {/* Language Filter */}
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All languages</SelectItem>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="Tamil">Tamil</SelectItem>
                <SelectItem value="Hindi">Hindi</SelectItem>
                <SelectItem value="Malayalam">Malayalam</SelectItem>
                <SelectItem value="Telugu">Telugu</SelectItem>
                <SelectItem value="Kannada">Kannada</SelectItem>
                <SelectItem value="Korean">Korean</SelectItem>
              </SelectContent>
            </Select>

            {/* Genre Filter */}
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <Filter className="w-4 h-4 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Genre" />
              </SelectTrigger>
              <SelectContent>
                {GENRE_OPTIONS.map((genre) => (
                  <SelectItem key={genre} value={genre}>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Year Filter */}
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-full sm:w-[110px]">
                <Clock className="w-4 h-4 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {YEAR_OPTIONS.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button type="button" variant={watchAvailable ? "default" : "outline"} onClick={() => setWatchAvailable((current) => !current)} className="gap-2 whitespace-nowrap">
              <Tv className="h-4 w-4" />Watch online{watchAvailable ? " ✓" : ""}
            </Button>

            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-full sm:w-[150px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="title_asc">Title: A–Z</SelectItem>
                  <SelectItem value="title_desc">Title: Z–A</SelectItem>
                  <SelectItem value="latest">Newest series</SelectItem>
                  <SelectItem value="oldest">Oldest series</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters Chips */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground font-medium">Active filters:</span>
              {selectedLanguage !== "all" && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer gap-1 pr-1.5 hover:bg-destructive/15 hover:text-destructive transition-colors"
                  onClick={() => setSelectedLanguage("all")}
                >
                  {selectedLanguage}
                  <X className="w-3 h-3" />
                </Badge>
              )}
              {selectedGenre && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer gap-1 pr-1.5 hover:bg-destructive/15 hover:text-destructive transition-colors"
                  onClick={() => setSelectedGenre("")}
                >
                  {selectedGenre}
                  <X className="w-3 h-3" />
                </Badge>
              )}
              {selectedYear && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer gap-1 pr-1.5 hover:bg-destructive/15 hover:text-destructive transition-colors"
                  onClick={() => setSelectedYear("")}
                >
                  {selectedYear}
                  <X className="w-3 h-3" />
                </Badge>
              )}
              {watchAvailable && (
                <Badge variant="secondary" className="cursor-pointer gap-1 pr-1.5 hover:bg-destructive/15 hover:text-destructive transition-colors" onClick={() => setWatchAvailable(false)}>
                  Watch online <X className="w-3 h-3" />
                </Badge>
              )}
              <button
                onClick={clearAllFilters}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors ml-1"
              >
                Clear all
              </button>
            </div>
          )}
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
            <p className="text-muted-foreground">Try adjusting your search or filters.</p>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="mt-3 text-sm text-primary hover:underline"
              >
                Clear all filters
              </button>
            )}
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
                        <div className="flex justify-between items-start mb-1 gap-2">
                          <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                            {s.title}
                          </h3>
                          {s.watchProviders?.length ? <OttMark name={s.watchProviders[0].name} className="h-7 w-7 rounded-md text-[8px]" /> : null}
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
                          
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-bold text-primary flex items-center gap-1.5 bg-primary/10 px-2 py-1 rounded-md w-fit">
                              <Clock className="w-3.5 h-3.5" />
                              {formatRuntimeMinutes(s.totalRuntimeMinutes)}
                            </div>
                            {user && (
                              <Button
                                type="button"
                                size="sm"
                                variant={userProgress && userProgress.watchedSeasons.length >= s.totalSeasons ? "secondary" : "outline"}
                                className="h-8 gap-1.5 text-xs shrink-0"
                                disabled={updatingSeries === s.imdbId}
                                onClick={(event) => toggleSeriesWatched(event, s)}
                                aria-label={userProgress && userProgress.watchedSeasons.length >= s.totalSeasons ? `Mark ${s.title} unwatched` : `Mark ${s.title} watched`}
                              >
                                {updatingSeries === s.imdbId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                {userProgress && userProgress.watchedSeasons.length >= s.totalSeasons ? "Watched" : "Mark watched"}
                              </Button>
                            )}
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
