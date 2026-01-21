import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useVideo, useEpisode, useEpisodes, useUpdateHistory, useVideos } from "@/hooks/use-videos";
import ReactPlayer from "react-player";
import { Loader2, ChevronLeft, ChevronRight, List, Star, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

export default function WatchPage() {
  const { videoId, episodeId } = useParams();
  const vId = Number(videoId);
  const eId = Number(episodeId);

  const { data: video } = useVideo(vId);
  const { data: currentEpisode, isLoading: loadingEpisode } = useEpisode(eId);
  const { data: allEpisodes } = useEpisodes(vId);
  const { data: relatedVideos } = useVideos({ category: video?.categoryId?.toString() });
  const { user } = useAuth();
  const { mutate: updateHistory } = useUpdateHistory();

  const [hasWindow, setHasWindow] = useState(false);
  const playerRef = useRef<ReactPlayer>(null);

  useEffect(() => {
    setHasWindow(true);
  }, []);

  // Save progress every 30 seconds
  const handleProgress = ({ playedSeconds }: { playedSeconds: number }) => {
    if (user && playedSeconds > 5 && Math.floor(playedSeconds) % 30 === 0) {
      updateHistory({
        userId: user.id,
        videoId: vId,
        episodeId: eId,
        progress: Math.floor(playedSeconds),
      });
    }
  };

  const sortedEpisodes = allEpisodes?.sort((a, b) => a.episodeNumber - b.episodeNumber);
  const currentIndex = sortedEpisodes?.findIndex(e => e.id === eId) ?? -1;
  const nextEpisode = currentIndex !== -1 && sortedEpisodes ? sortedEpisodes[currentIndex + 1] : null;
  const prevEpisode = currentIndex !== -1 && sortedEpisodes ? sortedEpisodes[currentIndex - 1] : null;

  if (loadingEpisode || !hasWindow) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentEpisode) return <div>Episode not found</div>;

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Player Container */}
      <div className="relative w-full aspect-video md:h-[calc(100vh-200px)] bg-black shadow-2xl z-10">
        <div className="absolute top-4 left-4 z-20">
          <Link href={`/video/${vId}`}>
            <Button variant="ghost" className="text-white hover:bg-white/10 backdrop-blur-sm">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Details
            </Button>
          </Link>
        </div>

        <ReactPlayer
          ref={playerRef}
          url={currentEpisode.sourceUrl}
          width="100%"
          height="100%"
          controls={true}
          playing={true}
          config={{
            file: {
              attributes: {
                crossOrigin: "anonymous", 
              },
              tracks: currentEpisode.subtitles?.map(sub => ({
                kind: 'subtitles',
                src: sub.url,
                srcLang: sub.language,
                label: sub.language.toUpperCase(),
                default: sub.language === 'en'
              }))
            }
          }}
          onProgress={handleProgress}
          onEnded={() => {
            if (user) {
              updateHistory({
                userId: user.id,
                videoId: vId,
                episodeId: eId,
                progress: Math.floor(playerRef.current?.getDuration() || 0),
              });
            }
          }}
          style={{ backgroundColor: "black" }}
        />
      </div>

      {/* Info & Playlist Bar */}
      <div className="flex-1 bg-background border-t border-white/10 pb-20">
        <div className="container mx-auto px-4 py-6 flex flex-col lg:flex-row gap-8">
          
          <div className="flex-1 space-y-4">
            <h1 className="text-2xl md:text-3xl font-display font-bold">
              {video?.title} - <span className="text-primary">Ep {currentEpisode.episodeNumber}</span>
            </h1>
            <h2 className="text-xl text-muted-foreground">{currentEpisode.title}</h2>
            
            <div className="flex items-center gap-4 pt-2">
              <Button 
                variant="outline" 
                disabled={!prevEpisode}
                onClick={() => prevEpisode && (window.location.href = `/watch/${vId}/${prevEpisode.id}`)}
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              <Button 
                variant="default"
                disabled={!nextEpisode}
                onClick={() => nextEpisode && (window.location.href = `/watch/${vId}/${nextEpisode.id}`)}
              >
                Next Episode <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="pt-6">
              <p className="text-muted-foreground leading-relaxed max-w-3xl">
                {video?.description}
              </p>
            </div>

            {/* Recommendations Section */}
            <div className="pt-10 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-display font-bold">Recommended for You</h3>
                <Link href={`/category/${video?.categoryId}`}>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                    See More <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {relatedVideos?.filter(v => v.id !== vId).slice(0, 4).map((v) => (
                  <Link key={v.id} href={`/video/${v.id}`}>
                    <div className="group cursor-pointer space-y-2">
                      <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-white/5">
                        <img 
                          src={v.posterUrl} 
                          alt={v.title} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20 scale-75 group-hover:scale-100 transition-transform">
                            <Play className="w-5 h-5 text-primary-foreground fill-current" />
                          </div>
                        </div>
                      </div>
                      <h4 className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                        {v.title}
                      </h4>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>{v.year}</span>
                        <div className="flex items-center gap-1 text-accent">
                          <Star className="w-3 h-3 fill-current" />
                          {v.rating}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Episode List Sidebar */}
          <div className="w-full lg:w-[350px] shrink-0">
            <div className="bg-card rounded-xl border border-white/5 overflow-hidden flex flex-col h-[500px] sticky top-24">
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-muted/20">
                <h3 className="font-bold flex items-center gap-2">
                  <List className="w-4 h-4 text-primary" /> Episodes
                </h3>
                <span className="text-xs text-muted-foreground">{sortedEpisodes?.length} total</span>
              </div>
              <ScrollArea className="flex-1 p-2">
                <div className="space-y-1">
                  {sortedEpisodes?.map((ep) => (
                    <Link key={ep.id} href={`/watch/${vId}/${ep.id}`}>
                      <div className={cn(
                        "flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group",
                        ep.id === eId ? "bg-primary/10 border border-primary/20" : "hover:bg-accent/5"
                      )}>
                        <div className="relative w-24 aspect-video bg-black rounded overflow-hidden shrink-0 border border-white/5">
                          {ep.thumbnailUrl && <img src={ep.thumbnailUrl} className="w-full h-full object-cover" />}
                          <div className="absolute bottom-1 right-1 bg-black/80 text-[10px] px-1 rounded font-mono text-white">
                            Ep {ep.episodeNumber}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className={cn(
                            "text-sm font-medium line-clamp-2",
                            ep.id === eId ? "text-primary" : "text-foreground group-hover:text-primary"
                          )}>
                            {ep.title}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
