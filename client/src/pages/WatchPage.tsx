import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useVideo, useEpisode, useEpisodes, useUpdateHistory } from "@/hooks/use-videos";
import ReactPlayer from "react-player";
import { Loader2, ChevronLeft, ChevronRight, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

export default function WatchPage() {
  const { videoId, episodeId } = useParams();
  const vId = Number(videoId);
  const eId = Number(episodeId);

  const { data: video } = useVideo(vId);
  const { data: currentEpisode, isLoading: loadingEpisode } = useEpisode(eId);
  const { data: allEpisodes } = useEpisodes(vId);
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
                crossOrigin: "anonymous", // Needed for subtitles usually
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
      <div className="flex-1 bg-background border-t border-white/10">
        <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row gap-8">
          
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
          </div>

          {/* Episode List Sidebar (Desktop) / Drawer (Mobile) */}
          <div className="w-full md:w-[350px] shrink-0">
            <div className="bg-card rounded-xl border border-white/5 overflow-hidden flex flex-col h-[400px]">
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-muted/20">
                <h3 className="font-bold flex items-center gap-2">
                  <List className="w-4 h-4" /> Episodes
                </h3>
                <span className="text-xs text-muted-foreground">{sortedEpisodes?.length} total</span>
              </div>
              <ScrollArea className="flex-1 p-2">
                <div className="space-y-1">
                  {sortedEpisodes?.map((ep) => (
                    <Link key={ep.id} href={`/watch/${vId}/${ep.id}`}>
                      <div className={cn(
                        "flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group",
                        ep.id === eId && "bg-primary/10 border border-primary/20"
                      )}>
                        <div className="relative w-24 aspect-video bg-black rounded overflow-hidden shrink-0">
                          {ep.thumbnailUrl && <img src={ep.thumbnailUrl} className="w-full h-full object-cover" />}
                          <div className="absolute bottom-1 right-1 bg-black/80 text-[10px] px-1 rounded font-mono">
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
