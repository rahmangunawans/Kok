import { useVideos, useCategories } from "@/hooks/use-videos";
import { HeroCarousel } from "@/components/HeroCarousel";
import { VideoCard } from "@/components/VideoCard";
import { Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Home() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const searchTerm = searchParams.get("search");

  // Fetch data
  const { data: featuredVideos, isLoading: loadingFeatured } = useVideos({ featured: true });
  const { data: allVideos, isLoading: loadingAll } = useVideos({ search: searchTerm || undefined });
  const { data: categories } = useCategories();

  if (loadingFeatured || loadingAll) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  // If searching, just show grid
  if (searchTerm) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        <h2 className="text-2xl font-bold">Search Results for "{searchTerm}"</h2>
        {allVideos && allVideos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {allVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            No videos found matching your search.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      {/* Hero Section */}
      {featuredVideos && <HeroCarousel videos={featuredVideos.slice(0, 5)} />}

      {/* Categories Sections */}
      <div className="container mx-auto px-4 space-y-16">
        
        {/* Latest Videos */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl md:text-3xl font-display font-bold">Latest Updates</h2>
            <Link href="/category/all" className="text-sm font-medium text-primary hover:underline">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8 md:gap-x-6">
            {allVideos?.slice(0, 12).map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </section>

        {/* Categories Preview */}
        {categories?.slice(0, 3).map((category) => (
          <section key={category.id} className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl md:text-3xl font-display font-bold">{category.name}</h2>
              <Link href={`/category/${category.slug}`} className="text-sm font-medium text-primary hover:underline">
                View All
              </Link>
            </div>
            {/* Filter videos by category locally for this preview section */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8 md:gap-x-6">
              {allVideos
                ?.filter(v => v.categoryId === category.id)
                .slice(0, 6)
                .map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
