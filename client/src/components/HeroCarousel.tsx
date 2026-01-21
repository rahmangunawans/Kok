import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { type Video } from "@shared/schema";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Play, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeroCarouselProps {
  videos: Video[];
}

export function HeroCarousel({ videos }: HeroCarouselProps) {
  const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000 })]);

  if (!videos.length) return null;

  return (
    <div className="relative w-full overflow-hidden" ref={emblaRef}>
      <div className="flex touch-pan-y">
        {videos.map((video) => (
          <div key={video.id} className="relative flex-[0_0_100%] min-w-0">
            {/* Aspect ratio container: 16:9 on mobile, 21:9 on desktop */}
            <div className="relative w-full aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/9] xl:aspect-[24/9] max-h-[70vh]">
              <img
                src={video.bannerUrl || video.posterUrl}
                alt={video.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
              
              {/* Content Content */}
              <div className="absolute inset-0 container mx-auto px-4 flex flex-col justify-end pb-12 sm:justify-center sm:pb-0">
                <div className="max-w-2xl space-y-4 animate-fade-in">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary uppercase tracking-wider">
                    <span className="bg-primary/20 text-primary px-2 py-0.5 rounded">Featured</span>
                    {video.year && <span className="text-white/80">• {video.year}</span>}
                    {video.country && <span className="text-white/80">• {video.country}</span>}
                  </div>
                  
                  <h1 className="text-4xl sm:text-5xl lg:text-7xl font-display font-bold text-white leading-tight">
                    {video.title}
                  </h1>
                  
                  <p className="text-white/70 text-sm sm:text-lg line-clamp-3 max-w-xl">
                    {video.description}
                  </p>
                  
                  <div className="flex items-center gap-3 pt-4">
                    <Link href={`/video/${video.id}`}>
                      <Button size="lg" className="rounded-full px-8 text-lg h-12 gap-2 shadow-lg shadow-primary/25">
                        <Play className="w-5 h-5 fill-current" />
                        Watch Now
                      </Button>
                    </Link>
                    <Link href={`/video/${video.id}`}>
                      <Button size="lg" variant="outline" className="rounded-full px-8 text-lg h-12 gap-2 bg-white/5 border-white/20 hover:bg-white/10 backdrop-blur-sm">
                        <Info className="w-5 h-5" />
                        Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
