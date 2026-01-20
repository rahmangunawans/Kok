import { useParams } from "wouter";
import { useVideos, useCategories } from "@/hooks/use-videos";
import { VideoCard } from "@/components/VideoCard";
import { Loader2 } from "lucide-react";

export default function CategoryPage() {
  const { slug } = useParams();
  const { data: categories } = useCategories();
  
  // Find category ID based on slug (assuming slug matches category name or is derived)
  // For simplicity, we pass slug as category filter to backend, backend handles lookup
  const { data: videos, isLoading } = useVideos({ category: slug });
  
  const currentCategory = categories?.find(c => c.slug === slug || c.name.toLowerCase() === slug);

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-display font-bold capitalize">
            {currentCategory?.name || slug}
          </h1>
          <p className="text-muted-foreground">Browse our collection of {currentCategory?.name || slug}</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : videos && videos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8 md:gap-x-6">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/10 rounded-xl border border-dashed border-white/10">
            <p className="text-lg text-muted-foreground">No videos found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
