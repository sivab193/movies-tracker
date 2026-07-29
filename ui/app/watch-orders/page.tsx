"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getAllWatchOrders } from "@/services/watch-order-service";
import { Header } from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ListOrdered, Film, Tv, CheckCircle, Clock } from "lucide-react";

export default function WatchOrdersPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [watchOrders, setWatchOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Pass auth token if required by your API setup
        const data = await getAllWatchOrders();
        setWatchOrders(data);
      } catch (err) {
        setError("Failed to load watch orders. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    if (!authLoading) {
      loadData();
    }
  }, [authLoading]);

  // Check if a movie has been watched by the logged-in user
  const hasWatched = (imdbId: string) => {
    if (!userProfile?.watchHistory) return false;
    return userProfile.watchHistory.some((entry: any) => entry.imdbId === imdbId);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      
      <main className="flex-1 container max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
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
          <div className="space-y-6">
            {watchOrders.map((order) => {
              const isExpanded = expandedId === order.id;
              
              return (
                <Card 
                  key={order.id} 
                  id={order.id}
                  className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-2 ring-primary border-primary/50' : 'hover:border-primary/30 cursor-pointer'}`}
                  onClick={() => !isExpanded && setExpandedId(order.id)}
                >
                  <CardHeader className={`${isExpanded ? 'bg-primary/5' : ''}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl mb-1">{order.name}</CardTitle>
                        <CardDescription>{order.description}</CardDescription>
                      </div>
                      <Badge variant="secondary" className="whitespace-nowrap">
                        {order.items?.length || 0} Items
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  {isExpanded && (
                    <CardContent className="pt-6 border-t bg-card/50">
                      <div className="relative border-l-2 border-primary/20 ml-3 md:ml-4 space-y-8 pb-4">
                        {order.items?.sort((a: any, b: any) => a.orderIndex - b.orderIndex).map((item: any, index: number) => {
                          const isMovie = item.type?.toLowerCase() === 'movie';
                          const watched = isMovie && item.itemId ? hasWatched(item.itemId) : false;
                          
                          return (
                            <div key={item.id || index} className="relative pl-6 md:pl-8">
                              {/* Timeline Dot */}
                              <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-background border-2 border-primary ring-4 ring-background" />
                              
                              <div className="bg-background rounded-lg border p-4 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                                  <h4 className="font-semibold text-lg flex items-center gap-2">
                                    {item.title}
                                    {user && watched && (
                                      <span title="Watched"><CheckCircle className="w-4 h-4 text-green-500" /></span>
                                    )}
                                  </h4>
                                  <div className="flex gap-2 items-center">
                                    <span className="text-sm font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                      {item.year}
                                    </span>
                                    <Badge variant="outline" className={isMovie ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-purple-500/10 text-purple-500 border-purple-500/20"}>
                                      {isMovie ? <Film className="w-3 h-3 mr-1" /> : <Tv className="w-3 h-3 mr-1" />}
                                      {isMovie ? 'Movie' : 'Series'}
                                    </Badge>
                                  </div>
                                </div>
                                {item.notes && (
                                  <p className="text-sm text-muted-foreground mt-2 border-l-2 border-muted pl-3">
                                    {item.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-6 flex justify-end">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedId(null);
                          }}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Collapse Timeline ↑
                        </button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
