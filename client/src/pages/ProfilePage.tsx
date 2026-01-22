import { useWatchHistory, useWatchlist } from "@/hooks/use-videos";
import { useAuth } from "@/hooks/use-auth";
import { VideoCard } from "@/components/VideoCard";
import { Loader2, History, Bookmark, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "wouter";

export default function ProfilePage() {
  const { user } = useAuth();
  const { data: history, isLoading: loadingHistory } = useWatchHistory();
  const { data: watchlist, isLoading: loadingWatchlist } = useWatchlist();

  if (!user) {
    return <div className="p-8 text-center">Please log in to view your profile.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen space-y-8">
      {/* Profile Header */}
      <div className="flex items-center gap-6 p-6 rounded-2xl bg-card border border-white/5 shadow-xl">
        <Avatar className="w-24 h-24 border-2 border-primary/20">
          <AvatarImage src={user.avatarUrl || undefined} />
          <AvatarFallback className="text-2xl bg-primary/10 text-primary">{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <h1 className="text-3xl font-display font-bold">{user.username}</h1>
          <p className="text-muted-foreground">Member since {new Date().getFullYear()}</p>
          {user.isAdmin && (
            <span className="inline-block px-2 py-0.5 rounded bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
              Administrator
            </span>
          )}
        </div>
      </div>

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="bg-white/5 border border-white/5 p-1">
          <TabsTrigger value="history" className="gap-2">
            <History className="w-4 h-4" /> Watch History
          </TabsTrigger>
          <TabsTrigger value="watchlist" className="gap-2">
            <Bookmark className="w-4 h-4" /> My List
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-6">
          {loadingHistory ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>
          ) : history && history.length > 0 ? (
            <div className="grid gap-4">
              {history.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 rounded-xl bg-card/50 border border-white/5 hover:bg-card transition-colors">
                  <Link href={`/watch/${item.videoId}/${item.episodeId}`} className="shrink-0 w-40 aspect-video rounded-lg overflow-hidden bg-black/20 relative group block">
                     <img src={item.episode.thumbnailUrl || item.video.posterUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <Clock className="w-8 h-8 text-white" />
                     </div>
                     <div className="absolute bottom-0 left-0 h-1 bg-primary z-10" style={{ width: `${Math.min(100, (item.progress || 0) / (item.episode.duration || 1) * 100)}%` }} />
                  </Link>
                  <div className="flex-1 py-1">
                    <h3 className="font-bold text-lg mb-1">{item.video.title}</h3>
                    <p className="text-primary font-medium text-sm mb-2">{item.episode.title}</p>
                    <p className="text-xs text-muted-foreground">Watched {new Date(item.lastWatched || "").toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground border border-dashed border-white/10 rounded-xl">
              No watch history yet.
            </div>
          )}
        </TabsContent>

        <TabsContent value="watchlist" className="mt-6">
          {loadingWatchlist ? (
             <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>
          ) : watchlist && watchlist.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {watchlist.map((item) => (
                <VideoCard key={item.id} video={item.video} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground border border-dashed border-white/10 rounded-xl">
              Your watchlist is empty.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
