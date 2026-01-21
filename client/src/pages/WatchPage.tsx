import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useVideo, useEpisode, useEpisodes, useUpdateHistory, useVideos } from "@/hooks/use-videos";
import * as shaka from "shaka-player/dist/shaka-player.ui.js";
import "shaka-player/dist/controls.css";
import { Loader2, ChevronLeft, ChevronRight, List, Star, Play, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

export default function WatchPage() {
  const { videoId, episodeId } = useParams();
  const [, setLocation] = useLocation();
  const vId = Number(videoId);
  const eId = Number(episodeId);

  const { data: video } = useVideo(vId);
  const { data: currentEpisode, isLoading: loadingEpisode } = useEpisode(eId);
  const { data: allEpisodes } = useEpisodes(vId);
  const { data: relatedVideos } = useVideos({ category: video?.categoryId?.toString() });
  const { user } = useAuth();
  const { mutate: updateHistory } = useUpdateHistory();

  const [hasWindow, setHasWindow] = useState(false);
  const [quality, setQuality] = useState("auto");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    setHasWindow(true);
  }, []);

  // Initialize Shaka Player
  useEffect(() => {
    if (!currentEpisode || !videoRef.current || !videoContainerRef.current) return;

    const initPlayer = async () => {
      // @ts-ignore
      shaka.polyfill.installAll();
      // @ts-ignore
      if (!shaka.Player.isBrowserSupported()) {
        console.error("Browser not supported!");
        return;
      }

      // @ts-ignore
      const player = new shaka.Player(videoRef.current);
      playerRef.current = player;

      // @ts-ignore
      const ui = new shaka.ui.Overlay(
        player,
        videoContainerRef.current,
        videoRef.current
      );

      // Configure Shaka UI
      const config = {
        'controlPanelElements': [
          'play_pause',
          'time_and_duration',
          'spacer',
          'mute',
          'volume',
          'captions',
          'quality',
          'playback_rate',
          'fullscreen',
          'overflow_menu'
        ],
        'addLanguageControls': true,
        'addQualityControls': true,
        'castReceiverAppId': 'CC1AD845',
        'clearBufferOnQualityChange': true,
      };
      ui.configure(config);

      player.addEventListener("error", (event: any) => {
        console.error("Error code", event.detail.code, "object", event.detail);
      });

      // Handle quality selection change to reload the player with the new URL
      // Note: Shaka usually handles quality internally if the manifest allows it,
      // but here we are using multiple single-stream URLs.
      // So we use the 'quality' state to trigger a reload.

      try {
        const sources = currentEpisode.sources && currentEpisode.sources.length > 0 
          ? currentEpisode.sources 
          : [];
        
        const videoUrl = sources.find((s: any) => s.quality === quality)?.url || sources[0]?.url || currentEpisode.sourceUrl;

        await player.load(videoUrl);
        
        // Add subtitles to Shaka Player after loading
        if (currentEpisode.subtitles && currentEpisode.subtitles.length > 0) {
          currentEpisode.subtitles.forEach((sub: any) => {
            player.addTextTrackAsync(
              sub.url,
              sub.language.toLowerCase(),
              'subtitles',
              'text/vtt',
              null,
              sub.language === "ID" ? "Indonesian" : "English"
            );
          });
        }
      } catch (e: any) {
        console.error("Error loading video", e);
      }
    };

    initPlayer();

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [currentEpisode, quality]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const video = videoRef.current;
      if (!video) return;

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          if (video.paused) video.play();
          else video.pause();
          break;
        case "f":
          e.preventDefault();
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            videoContainerRef.current?.requestFullscreen();
          }
          break;
        case "j":
          video.currentTime = Math.max(0, video.currentTime - 10);
          break;
        case "l":
          video.currentTime = Math.min(video.duration, video.currentTime + 10);
          break;
        case "m":
          video.muted = !video.muted;
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const sortedEpisodes = allEpisodes?.sort((a, b) => a.episodeNumber - b.episodeNumber);
  const currentIndex = sortedEpisodes?.findIndex(e => e.id === eId) ?? -1;
  const nextEpisode = currentIndex !== -1 && sortedEpisodes ? sortedEpisodes[currentIndex + 1] : null;
  const prevEpisode = currentIndex !== -1 && sortedEpisodes ? sortedEpisodes[currentIndex - 1] : null;

  const handleProgress = useCallback(() => {
    const video = videoRef.current;
    if (!video || !user) return;

    const playedSeconds = video.currentTime;
    if (playedSeconds > 5 && Math.floor(playedSeconds) % 30 === 0) {
      updateHistory({
        userId: user.id,
        videoId: vId,
        episodeId: eId,
        progress: Math.floor(playedSeconds),
      });
    }
  }, [user, vId, eId, updateHistory]);

  const handleEnded = useCallback(() => {
    const video = videoRef.current;
    if (user && video) {
      updateHistory({
        userId: user.id,
        videoId: vId,
        episodeId: eId,
        progress: Math.floor(video.duration || 0),
      });
    }
    if (nextEpisode) {
      setLocation(`/watch/${vId}/${nextEpisode.id}`);
    }
  }, [user, vId, eId, nextEpisode, setLocation, updateHistory]);

  if (loadingEpisode || !hasWindow) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentEpisode) return <div>Episode not found</div>;

  const sources = currentEpisode.sources && currentEpisode.sources.length > 0 
    ? currentEpisode.sources 
    : [];

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div 
        ref={videoContainerRef}
        className="relative w-full aspect-video md:h-[calc(100vh-200px)] bg-black shadow-2xl z-10 player-wrapper group"
      >
        <div className="absolute top-4 left-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link href={`/video/${vId}`}>
            <Button variant="ghost" className="text-white hover:bg-white/10 backdrop-blur-sm">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Details
            </Button>
          </Link>
        </div>

        {/* Manual Quality Selection (Since we are using multiple HLS URLs instead of a single manifest) */}
        <div className="absolute bottom-16 right-4 z-20 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {sources.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="text-white hover:bg-white/10 backdrop-blur-sm h-8 px-2 text-xs">
                  <Settings className="h-3 w-3 mr-1" /> {quality}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#1a1a1c] border-white/10 text-white">
                <DropdownMenuLabel>Quality</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuRadioGroup value={quality} onValueChange={setQuality}>
                  {sources.map((s: any) => (
                    <DropdownMenuRadioItem key={s.quality} value={s.quality}>
                      {s.quality}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Remove manually implemented controls to avoid duplication with Shaka UI */}
        <video
          ref={videoRef}
          className="w-full h-full"
          onTimeUpdate={handleProgress}
          onEnded={handleEnded}
          autoPlay
        />
      </div>

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
                onClick={() => prevEpisode && setLocation(`/watch/${vId}/${prevEpisode.id}`)}
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              <Button 
                variant="default"
                disabled={!nextEpisode}
                onClick={() => nextEpisode && setLocation(`/watch/${vId}/${nextEpisode.id}`)}
              >
                Next Episode <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="pt-6">
              <p className="text-muted-foreground leading-relaxed max-w-3xl">
                {video?.description}
              </p>
            </div>

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
