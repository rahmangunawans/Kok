import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useVideo, useEpisode, useEpisodes, useUpdateHistory, useVideos } from "@/hooks/use-videos";
import { useQuery } from "@tanstack/react-query";
import { Actor } from "@shared/schema";
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
  const vId = videoId && !isNaN(Number(videoId)) ? Number(videoId) : 0;
  const eId = episodeId && !isNaN(Number(episodeId)) ? Number(episodeId) : 0;

  const { data: video, isLoading: loadingVideo } = useVideo(vId);
  const { data: currentEpisode, isLoading: loadingEpisode, error: episodeError } = useEpisode(eId);
  const { data: allEpisodes } = useEpisodes(vId);
  const { data: actors } = useQuery<Actor[]>({
    queryKey: ["/api/videos", vId, "actors"],
  });
  const { data: relatedVideos } = useVideos({ category: video?.categoryId?.toString() });
  const { user } = useAuth();
  const { mutate: updateHistory } = useUpdateHistory();

  const [hasWindow, setHasWindow] = useState(false);
  const [quality, setQuality] = useState("auto"); // Default to auto
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const shakaPlayerRef = useRef<any>(null);

  useEffect(() => {
    setHasWindow(true);
  }, []);

  const sortedEpisodes = allEpisodes?.sort((a, b) => a.episodeNumber - b.episodeNumber);
  const currentIndex = sortedEpisodes?.findIndex(e => e.id === eId) ?? -1;
  const nextEpisode = currentIndex !== -1 && sortedEpisodes ? sortedEpisodes[currentIndex + 1] : null;
  const prevEpisode = currentIndex !== -1 && sortedEpisodes ? sortedEpisodes[currentIndex - 1] : null;

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
        case "c":
          // Toggle captions
          if (playerRef.current) {
            const isVisible = playerRef.current.isTextTrackVisible();
            playerRef.current.setTextTrackVisibility(!isVisible);
          }
          break;
        case "n":
          // Next episode shortcut
          if (nextEpisode) {
            setLocation(`/watch/${vId}/${nextEpisode.id}`);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextEpisode, vId, setLocation]);

  // Manual quality switch effect
  useEffect(() => {
    if (!shakaPlayerRef.current || !currentEpisode || quality === "auto") return;
    
    const switchSource = async () => {
      if (!currentEpisode) return;
      const sources = currentEpisode.sources || [];
      const selectedSource = sources.find((s: any) => s.quality === quality);
      const videoUrl = selectedSource?.url;
      
      if (videoUrl && shakaPlayerRef.current) {
        try {
          const video = videoRef.current;
          if (!video) return;

          const currentTime = video.currentTime;
          const isPaused = video.paused;
          const player = shakaPlayerRef.current;
          
          await player.load(videoUrl);
          
          // Re-add subtitles after loading new quality source
          if (currentEpisode.subtitles?.length) {
            for (const sub of currentEpisode.subtitles) {
              try {
                await player.addTextTrackAsync(
                  sub.url, 
                  sub.language.toLowerCase(), 
                  'subtitles', 
                  'application/x-subrip', 
                  null, 
                  sub.language === "ID" ? "Indonesian" : "English"
                );
              } catch (e) {
                console.error("Failed to re-add subtitle", e);
              }
            }
            player.setTextTrackVisibility(true);
            const langs = player.getTextLanguages();
            if (langs.includes('id')) player.selectTextLanguage('id');
            else if (langs.length) player.selectTextLanguage(langs[0]);
          }
          
          video.currentTime = currentTime;
          if (!isPaused) video.play().catch(() => {});
        } catch (e) {
          console.error("Error switching quality", e);
        }
      }
    };

    switchSource();
  }, [quality]); // Removed currentEpisode from dependency to avoid loop

  // Initialize Shaka Player
  useEffect(() => {
    const currentEpId = currentEpisode?.id;
    if (!currentEpId || !videoRef.current || !videoContainerRef.current) return;

    let ui: any = null;
    let isMounted = true;

    const initPlayer = async () => {
      const ep = currentEpisode;
      if (!videoRef.current || !videoContainerRef.current || !ep) return;

      try {
        // @ts-ignore
        shaka.polyfill.installAll();
        
        if (playerRef.current) {
          try {
            await playerRef.current.destroy();
          } catch (e) {}
        }

        // @ts-ignore
        const player = new shaka.Player();
        await player.attach(videoRef.current);
        if (!isMounted) {
          player.destroy();
          return;
        }
        
        playerRef.current = player;
        shakaPlayerRef.current = player;

        // @ts-ignore
        ui = new shaka.ui.Overlay(player, videoContainerRef.current, videoRef.current);
        const uiConfig = {
          'controlPanelElements': [
            'play_pause', 'time_and_duration', 'spacer', 'mute', 'volume', 
            'quality', 'captions', 'playback_rate', 'fullscreen', 'overflow_menu'
          ],
          'addBigPlayButton': true,
          'clearBufferOnQualityChange': true
        };
        ui.configure(uiConfig);

        const sources = ep.sources || [];
        const manifestUrl = ep.sourceUrl || (sources.length > 0 ? sources[0].url : null);
        
        player.configure({
          manifest: { retryParameters: { maxAttempts: 5 } },
          streaming: { bufferingGoal: 30, rebufferingGoal: 10 }
        });

        if (manifestUrl) {
          const isHls = manifestUrl.toLowerCase().includes('.m3u8');
          
          try {
            if (isHls) {
              await player.load(manifestUrl, null, 'application/x-mpegurl');
            } else {
              await player.load(manifestUrl);
            }
          } catch (loadErr) {
            console.error("Initial load failed, trying fallback", loadErr);
            if (sources.length > 0) {
              await player.load(sources[0].url);
            } else {
              throw loadErr;
            }
          }

          if (ep.subtitles?.length) {
            for (const sub of ep.subtitles) {
              try {
                await player.addTextTrackAsync(sub.url, sub.language.toLowerCase(), 'subtitles', 'application/x-subrip', null, sub.language === "ID" ? "Indonesian" : "English");
              } catch (e) {}
            }
            player.setTextTrackVisibility(true);
            const langs = player.getTextLanguages();
            if (langs.includes('id')) player.selectTextLanguage('id');
          }

          if (videoRef.current && isMounted) {
            videoRef.current.play().catch(() => {});
          }
        }
      } catch (e) {
        console.error("Init error", e);
      }
    };

    initPlayer();
    return () => {
      isMounted = false;
      if (ui) ui.destroy();
      if (playerRef.current) playerRef.current.destroy();
      playerRef.current = null;
      shakaPlayerRef.current = null;
    };
  }, [currentEpisode?.id]); // Use optional chaining in dependency array if needed

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

  if (loadingEpisode || loadingVideo || !hasWindow) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-white/50 text-sm animate-pulse">Loading video player...</p>
        </div>
      </div>
    );
  }

  if (episodeError || !currentEpisode) {
    return (
      <div className="h-screen w-full bg-black flex flex-col items-center justify-center gap-4">
        <p className="text-white/70">Episode not found or failed to load</p>
        <Link href="/">
          <Button variant="outline">Back to Home</Button>
        </Link>
      </div>
    );
  }

  const sourcesData = currentEpisode.sources && currentEpisode.sources.length > 0 
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

        {/* Custom Quality Switcher (Overlaying Shaka) to handle separate manifests */}
        <div className="absolute top-4 right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="text-white hover:bg-white/10 backdrop-blur-sm h-8 px-3 text-xs font-bold">
                <Settings className="h-3 w-3 mr-2" /> {quality.toUpperCase()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1a1a1c] border-white/10 text-white">
              <DropdownMenuLabel>Quality</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuRadioGroup value={quality} onValueChange={setQuality}>
                <DropdownMenuRadioItem value="auto" className="text-xs">Auto</DropdownMenuRadioItem>
                {sourcesData.map((s: any) => (
                  <DropdownMenuRadioItem key={s.quality} value={s.quality} className="text-xs">
                    {s.quality}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
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

              {video?.trailerUrl && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-primary/20 hover:bg-primary/5">
                      <Play className="mr-2 h-4 w-4 fill-primary" /> Trailer
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl p-0 bg-black border-white/10 overflow-hidden">
                    <div className="aspect-video w-full">
                      <iframe
                        src={video.trailerUrl.includes('youtube.com') || video.trailerUrl.includes('youtu.be') 
                          ? video.trailerUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')
                          : video.trailerUrl}
                        className="w-full h-full"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            <div className="pt-6">
              <p className="text-muted-foreground leading-relaxed max-w-3xl">
                {video?.description}
              </p>
            </div>

            {/* Actors Section */}
            {actors && actors.length > 0 && (
              <div className="pt-10 space-y-6">
                <h3 className="text-xl font-display font-bold">Cast / Actors</h3>
                <ScrollArea className="w-full whitespace-nowrap pb-4">
                  <div className="flex space-x-6">
                    {actors.map((actor) => (
                      <div key={actor.id} className="flex flex-col items-center gap-2 group">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-white/5 group-hover:border-primary/50 transition-colors">
                          <img 
                            src={actor.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${actor.name}`} 
                            alt={actor.name}
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                          />
                        </div>
                        <span className="text-xs font-medium text-center truncate w-20">
                          {actor.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

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
