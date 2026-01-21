import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useVideo, useEpisode, useEpisodes, useUpdateHistory, useVideos } from "@/hooks/use-videos";
import ReactPlayer from "react-player";
import { Loader2, ChevronLeft, ChevronRight, List, Star, Play, Settings, Subtitles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [currentSubtitle, setCurrentSubtitle] = useState("en");
  const [playbackRate, setPlaybackRate] = useState(1);
  const playerRef = useRef<ReactPlayer>(null);

  useEffect(() => {
    setHasWindow(true);
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          // Logic for play/pause would go here if we had state for it
          break;
        case "f":
          e.preventDefault();
          const playerElement = document.querySelector(".player-wrapper");
          if (playerElement?.requestFullscreen) {
            playerElement.requestFullscreen();
          }
          break;
        case "j":
          playerRef.current?.seekTo(playerRef.current.getCurrentTime() - 10);
          break;
        case "l":
          playerRef.current?.seekTo(playerRef.current.getCurrentTime() + 10);
          break;
        case "m":
          // Mute logic
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

  const handleEnded = useCallback(() => {
    if (user) {
      updateHistory({
        userId: user.id,
        videoId: vId,
        episodeId: eId,
        progress: Math.floor(playerRef.current?.getDuration() || 0),
      });
    }
    if (nextEpisode) {
      setLocation(`/watch/${vId}/${nextEpisode.id}`);
    }
  }, [user, vId, eId, nextEpisode, setLocation, updateHistory]);

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

  if (loadingEpisode || !hasWindow) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentEpisode) return <div>Episode not found</div>;

  // Multi-quality sources from user or episode data
  const sources = currentEpisode.sources?.length > 0 ? currentEpisode.sources : [
    { quality: "1080p", url: "https://cffaws.wetvinfo.com/svp_50217/01A41C6E77267B867049C1CEF4CE75F3A4E8E3260A7C9606FEACD7AD4380CC8751748AD2CF7976008675923AD906CB8A93A899B27C00CEC4F5EFE045CAFA5B0C37FE8BC1EA0D922B0198837D7FDD05E3199F82E56F742DB68A7DE7CF4F30FB0DA543BC8370384AE0EB49E7F7DB59F289224A354EB1924168079C4DC9C7868A1E5C/gzc_1000207_0bcarqayaaabduahwedlpbusrdgeqcfadbka.f321004.ts.m3u8?ver=4" },
    { quality: "720p", url: "https://cffaws.wetvinfo.com/svp_50217/01A41C6E77267B867049C1CEF4CE75F3A4E8E3260A7C9606FEACD7AD4380CC8751748AD2CF7976008675923AD906CB8A93A899B27C00CEC4F5EFE045CAFA5B0C37FE8BC1EA0D922B0198837D7FDD05E319785C3439C43A29772548A7B3026F8D7AD8DD8070BF78AFA08529A75A812DCAD9F5A433034712F7D53CF3DD7DD1D40192/gzc_1000207_0bcarqayaaabduahwedlpbusrdgeqcfadbka.f321003.ts.m3u8?ver=4" },
    { quality: "480p", url: "https://cffaws.wetvinfo.com/svp_50217/01A41C6E77267B867049C1CEF4CE75F3A4E8E3260A7C9606FEACD7AD4380CC8751748AD2CF7976008675923AD906CB8A93A899B27C00CEC4F5EFE045CAFA5B0C37FE8BC1EA0D922B0198837D7FDD05E319D680F5EA28868AEC38886863FF1780034EE38E59AAB7C8C2797A94A5ABBDB7EBE8B8467AD3C3C2FFB6EDCA34C24A02B6/gzc_1000207_0bcarqayaaabduahwedlpbusrdgeqcfadbka.f321002.ts.m3u8?ver=4" },
    { quality: "360p", url: "https://cffaws.wetvinfo.com/svp_50217/01A41C6E77267B867049C1CEF4CE75F3A4E8E3260A7C9606FEACD7AD4380CC8751748AD2CF7976008675923AD906CB8A93A899B27C00CEC4F5EFE045CAFA5B0C37FE8BC1EA0D922B0198837D7FDD05E319745A66387729CBF890B1654417968F92734ECAF82C36F26779C564B772780E44AD614DB7AF9B6772305148B0A7AB4E90/gzc_1000207_0bcarqayaaabduahwedlpbusrdgeqcfadbka.f321001.ts.m3u8?ver=4" }
  ];

  const videoUrl = sources.find(s => s.quality === quality)?.url || sources[0].url;

  const subtitleTracks = [
    { language: "en", label: "English", url: "https://cffaws.wetvinfo.com/svp_50217/gzc_1000207_0bcarqayaaabduahwedlpbusrdgeqcfadbka.f51503000.srt?vkey=014369C6A3F0F4949080A872CBB309B9306BA188B1CC9ADAEC76699E03732DC0E301269218FBAFD4E368025E146EACB43B18180559F0BB93AD4C2B0C88498A7377A90234FD2D15BFD22A02436F2309D2611D9F742AFD930385F07B6F67AD249FDEB011E97784EFB7B987AC1FC501C59FE844E419001312133EEDE2821C1E2CF348" },
    { language: "id", label: "Indonesian", url: "https://cffaws.wetvinfo.com/svp_50217/gzc_1000207_0bcarqayaaabduahwedlpbusrdgeqcfadbka.f51508000.srt?vkey=014369C6A3F0F4949080A872CBB309B9306BA188B1CC9ADAEC76699E03732DC0E301269218FBAFD4E368025E146EACB43B18180559F0BB93AD4C2B0C88498A7377A90234FD2D15BFD22A02436F2309D26130060E794C0C79308E9E3CB0F79019FDB98B1274B9349917111073E02ED71175D0168772C8D63E17D06D7D19FAF2EBDB" }
  ];

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Player Container */}
      <div className="relative w-full aspect-video md:h-[calc(100vh-200px)] bg-black shadow-2xl z-10 player-wrapper group">
        <div className="absolute top-4 left-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link href={`/video/${vId}`}>
            <Button variant="ghost" className="text-white hover:bg-white/10 backdrop-blur-sm">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Details
            </Button>
          </Link>
        </div>

        {/* Custom Player Controls Overlays */}
        <div className="absolute bottom-12 right-4 z-20 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Subtitle Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="text-white hover:bg-white/10 backdrop-blur-sm">
                <Subtitles className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1a1a1c] border-white/10 text-white">
              <DropdownMenuLabel>Subtitles</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuRadioGroup value={showSubtitles ? currentSubtitle : "off"} onValueChange={(v) => {
                if (v === "off") setShowSubtitles(false);
                else {
                  setShowSubtitles(true);
                  setCurrentSubtitle(v);
                }
              }}>
                <DropdownMenuRadioItem value="off">Off</DropdownMenuRadioItem>
                {subtitleTracks.map(sub => (
                  <DropdownMenuRadioItem key={sub.language} value={sub.language}>
                    {sub.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Quality Selection */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="text-white hover:bg-white/10 backdrop-blur-sm">
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1a1a1c] border-white/10 text-white">
              <DropdownMenuLabel>Quality</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuRadioGroup value={quality} onValueChange={setQuality}>
                {sources.map(s => (
                  <DropdownMenuRadioItem key={s.quality} value={s.quality}>
                    {s.quality}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <ReactPlayer
          ref={playerRef}
          url={videoUrl}
          width="100%"
          height="100%"
          controls={true}
          playing={true}
          playbackRate={playbackRate}
          config={{
            file: {
              attributes: {
                crossOrigin: "anonymous", 
              },
              tracks: showSubtitles ? subtitleTracks.map(sub => ({
                kind: 'subtitles',
                src: sub.url,
                srcLang: sub.language,
                label: sub.label,
                default: sub.language === currentSubtitle
              })) : []
            }
          }}
          onProgress={handleProgress}
          onEnded={handleEnded}
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
