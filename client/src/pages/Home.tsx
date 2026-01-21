import { useVideos, useCategories } from "@/hooks/use-videos";
import { HeroCarousel } from "@/components/HeroCarousel";
import { VideoCard } from "@/components/VideoCard";
import { Loader2, MonitorPlay, LogIn, UserPlus } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Home() {
  const [location, setLocation] = useLocation();
  const { user, login, register, isLoggingIn, isRegistering } = useAuth();
  const searchParams = new URLSearchParams(window.location.search);
  const searchTerm = searchParams.get("search");

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", password: "", avatarUrl: "" },
  });

  const onLoginSubmit = (data: any) => {
    login(data);
  };

  const onRegisterSubmit = (data: any) => {
    register(data);
  };

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
      {/* Auth Section for Guests */}
      {!user && (
        <section className="container mx-auto px-4 pt-8">
          <Card className="w-full max-w-4xl mx-auto border-white/10 bg-background/60 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="hidden md:flex flex-col justify-center p-8 bg-primary/10 border-r border-white/5">
                <div className="bg-primary/20 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                  <MonitorPlay className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-3xl font-display font-bold mb-4">Start Your Journey with YOUKU</h2>
                <p className="text-muted-foreground mb-6">Enjoy exclusive Asian dramas, movies, and variety shows. Join millions of fans worldwide.</p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">✓</div>
                    <span className="text-sm">HD quality streaming</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">✓</div>
                    <span className="text-sm">Multilingual subtitles</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">✓</div>
                    <span className="text-sm">Download for offline viewing</span>
                  </div>
                </div>
              </div>
              <div className="p-8">
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-8 bg-secondary/50">
                    <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign In
                    </TabsTrigger>
                    <TabsTrigger value="register" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Register
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login">
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="Username" {...field} className="bg-secondary/50 border-white/5" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} className="bg-secondary/50 border-white/5" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full h-11" disabled={isLoggingIn}>
                          {isLoggingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Sign In
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>

                  <TabsContent value="register">
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="Username" {...field} className="bg-secondary/50 border-white/5" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password (min. 6 chars)</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} className="bg-secondary/50 border-white/5" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="avatarUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Avatar URL (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="https://..." {...field} className="bg-secondary/50 border-white/5" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full h-11" disabled={isRegistering}>
                          {isRegistering && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Create Account
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </Card>
        </section>
      )}

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
          <div className="flex overflow-x-auto pb-4 -mx-4 px-4 gap-x-4 gap-y-8 md:gap-x-6 scrollbar-hide">
            {allVideos?.slice(0, 12).map((video) => (
              <div key={video.id} className="min-w-[160px] sm:min-w-[200px] md:min-w-[220px] lg:min-w-[240px]">
                <VideoCard video={video} />
              </div>
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
            <div className="flex overflow-x-auto pb-4 -mx-4 px-4 gap-x-4 gap-y-8 md:gap-x-6 scrollbar-hide">
              {allVideos
                ?.filter(v => v.categoryId === category.id)
                .slice(0, 10)
                .map((video) => (
                  <div key={video.id} className="min-w-[160px] sm:min-w-[200px] md:min-w-[220px] lg:min-w-[240px]">
                    <VideoCard video={video} />
                  </div>
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
