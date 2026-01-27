import { useParams, Link } from "wouter";
import { useVideo, useEpisodes, useAddToWatchlist } from "@/hooks/use-videos";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Actor } from "@shared/schema";
import { Loader2, Play, Plus, Check, Star, Share2, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default function VideoDetail() {
  const { id } = useParams();
  const videoId = Number(id);
  const { data: video, isLoading: loadingVideo } = useVideo(videoId);
  const { data: episodes, isLoading: loadingEpisodes } = useEpisodes(videoId);
  const { data: actors } = useQuery<Actor[]>({
    queryKey: ["/api/videos", videoId, "actors"],
  });
  const { user } = useAuth();
  const { mutate: addToWatchlist, isPending: addingToWatchlist } = useAddToWatchlist();

  if (loadingVideo || loadingEpisodes) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!video) return <div className="p-8 text-center">Video not found</div>;

  return (
    <div className="min-h-screen pb-20">
      {/* Cinematic Background */}
      <div className="absolute top-0 left-0 w-full h-[70vh] -z-10 overflow-hidden">
        <img 
          src={video.bannerUrl || video.posterUrl} 
          alt="background" 
          className="w-full h-full object-cover opacity-20 blur-3xl scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/80 to-background" />
      </div>

      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          {/* Left Column - Poster */}
          <div className="w-full md:w-[300px] shrink-0 mx-auto md:mx-0 max-w-sm">
            <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative group">
              <img 
                src={video.posterUrl} 
                alt={video.title} 
                className="w-full h-full object-cover"
              />
              {video.isVip && (
                <div className="absolute top-4 right-4 bg-amber-500 text-black font-bold px-3 py-1 rounded-md shadow-lg">
                  VIP
                </div>
              )}
            </div>
            
            <div className="mt-6 space-y-3">
              <Button 
                onClick={() => user ? addToWatchlist(video.id) : null}
                variant="outline" 
                className="w-full h-12 rounded-xl border-white/10 bg-white/5 hover:bg-white/10"
                disabled={addingToWatchlist}
              >
                {addingToWatchlist ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Add to Watchlist
              </Button>
              <Button variant="ghost" className="w-full h-12 rounded-xl text-muted-foreground hover:text-foreground">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>

          {/* Right Column - Info */}
          <div className="flex-1 space-y-8 animate-fade-in">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight">
                {video.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm md:text-base text-muted-foreground">
                <div className="flex items-center text-amber-400 font-bold">
                  <Star className="w-4 h-4 mr-1 fill-amber-400" />
                  {(video.rating || 0).toFixed(1)}
                </div>
                <span>•</span>
                <span>{video.year}</span>
                <span>•</span>
                <span>{video.country}</span>
                <span>•</span>
                <Badge variant="secondary" className="bg-white/10 hover:bg-white/20">
                  {video.category?.name || "Genre"}
                </Badge>
              </div>
            </div>

            <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
              {video.description}
            </p>

            {/* Actions */}
            <div className="flex flex-wrap gap-4">
              {episodes && episodes.length > 0 && (
                <Link href={`/watch/${video.id}/${episodes[0].id}`}>
                  <Button size="lg" className="rounded-full px-8 h-14 text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
                    <Play className="mr-2 h-5 w-5 fill-current" />
                    Start Watching
                  </Button>
                </Link>
              )}
              {video.trailerUrl && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-lg border-white/20 bg-white/5 hover:bg-white/10 backdrop-blur-sm">
                      <Film className="mr-2 h-5 w-5" />
                      Watch Trailer
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl p-0 bg-black border-white/10 overflow-hidden">
                    <div className="aspect-video w-full">
                      {video.trailerUrl ? (
                        <iframe
                          src={video.trailerUrl.includes('youtube.com') || video.trailerUrl.includes('youtu.be') 
                            ? video.trailerUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')
                            : video.trailerUrl}
                          className="w-full h-full"
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                      ) : null}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Actors Section */}
            {actors && actors.length > 0 && (
              <div className="space-y-4 pt-8 border-t border-white/5">
                <h3 className="text-xl font-bold font-display">Cast / Actors</h3>
                <ScrollArea className="w-full whitespace-nowrap pb-4">
                  <div className="flex space-x-6">
                    {actors.map((actor) => (
                      <div key={actor.id} className="flex flex-col items-center gap-2 group">
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-white/5 group-hover:border-primary/50 transition-colors">
                          <img 
                            src={actor.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${actor.name}`} 
                            alt={actor.name}
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                          />
                        </div>
                        <span className="text-sm font-medium text-center truncate w-24">
                          {actor.name}
                        </span>
                      </div>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            )}

            {/* Episodes Grid */}
            <div className="space-y-4 pt-8 border-t border-white/5">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold font-display">Episodes</h3>
                <span className="text-sm text-muted-foreground">{episodes?.length} episodes</span>
              </div>
              
              {episodes && episodes.length > 0 ? (
                <ScrollArea className="w-full whitespace-nowrap pb-4">
                  <div className="flex space-x-4">
                    {episodes.map((episode) => (
                      <Link key={episode.id} href={`/watch/${video.id}/${episode.id}`}>
                        <div className="w-[160px] md:w-[200px] shrink-0 space-y-3 group cursor-pointer">
                          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted/20 border border-white/5">
                            {episode.thumbnailUrl ? (
                              <img src={episode.thumbnailUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-white/5">
                                <Play className="w-8 h-8 opacity-20" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Play className="w-8 h-8 fill-white text-white" />
                            </div>
                            <div className="absolute bottom-2 right-2 bg-black/80 text-xs px-1.5 py-0.5 rounded font-mono">
                              {episode.episodeNumber}
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                              {episode.title}
                            </p>
                            <p className="text-xs text-muted-foreground">Episode {episode.episodeNumber}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              ) : (
                <div className="p-8 text-center bg-muted/5 rounded-xl border border-dashed border-white/10">
                  <p className="text-muted-foreground">No episodes available yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
