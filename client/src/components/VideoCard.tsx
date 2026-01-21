import { type Video } from "@shared/schema";
import { Link } from "wouter";
import { PlayCircle, Star, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoCardProps {
  video: Video;
  className?: string;
  showRating?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export function VideoCard({ video, className, showRating = true, onClick }: VideoCardProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <Link 
      href={`/video/${video.id}`} 
      className={cn("group block w-full space-y-3 cursor-pointer", className)}
      onClick={handleClick}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-muted/20 shadow-lg border border-white/5 transition-transform duration-300 group-hover:scale-[1.02]">
        {/* Poster Image */}
        <img 
          src={video.posterUrl} 
          alt={video.title} 
          className="h-full w-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:opacity-75"
          loading="lazy"
        />
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-80" />

        {/* Hover Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="rounded-full bg-primary/90 p-3 text-primary-foreground shadow-xl backdrop-blur-sm transform scale-75 group-hover:scale-100 transition-transform">
            <PlayCircle className="w-8 h-8 fill-current" />
          </div>
        </div>

        {/* VIP Badge */}
        {video.isVip && (
          <div className="absolute top-2 right-2 rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-black shadow-lg">
            VIP
          </div>
        )}
        
        {/* Featured Badge */}
        {video.isFeatured && (
          <div className="absolute top-2 left-2 rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground shadow-lg">
            HOT
          </div>
        )}

        {/* Rating Overlay */}
        {showRating && video.rating > 0 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 text-xs font-medium text-amber-400">
            <Star className="w-3 h-3 fill-amber-400" />
            <span>{video.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      <div className="space-y-0.5">
        <h3 className="line-clamp-1 font-medium text-sm leading-tight group-hover:text-primary transition-colors">
          {video.title}
        </h3>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {video.year || "N/A"}
          </span>
          <span className="line-clamp-1 max-w-[50%] text-right">{video.country}</span>
        </div>
      </div>
    </Link>
  );
}
