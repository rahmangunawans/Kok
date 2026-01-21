import { useVideos, useCategories } from "@/hooks/use-videos";
import { HeroCarousel } from "@/components/HeroCarousel";
import { VideoCard } from "@/components/VideoCard";
import { Loader2, MonitorPlay, LogIn, UserPlus, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { SiFacebook, SiGoogle } from "react-icons/si";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Home() {
  const [location] = useLocation();
  const { user, login, register, isLoggingIn, isRegistering } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  
  const searchParams = new URLSearchParams(window.location.search);
  const searchTerm = searchParams.get("search");

  useEffect(() => {
    if (user) {
      setShowAuthModal(false);
    }
  }, [user]);

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
          <div className="flex overflow-x-auto pb-4 -mx-4 px-4 gap-x-4 gap-y-8 md:gap-x-6 scrollbar-hide">
            {allVideos?.slice(0, 12).map((video) => (
              <div key={video.id} className="min-w-[160px] sm:min-w-[200px] md:min-w-[220px] lg:min-w-[240px]">
                <VideoCard video={video} onClick={() => !user && setShowAuthModal(true)} />
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
            <div className="flex overflow-x-auto pb-4 -mx-4 px-4 gap-x-4 gap-y-8 md:gap-x-6 scrollbar-hide">
              {allVideos
                ?.filter(v => v.categoryId === category.id)
                .slice(0, 10)
                .map((video) => (
                  <div key={video.id} className="min-w-[160px] sm:min-w-[200px] md:min-w-[220px] lg:min-w-[240px]">
                    <VideoCard video={video} onClick={() => !user && setShowAuthModal(true)} />
                  </div>
                ))}
            </div>
          </section>
        ))}
      </div>

      {/* Auth Modal inspired by Screenshot */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="max-w-[850px] p-0 overflow-hidden border-none bg-transparent">
          <div className="relative w-full aspect-[850/500] bg-[#1a1b1e] text-white flex rounded-xl shadow-2xl overflow-hidden">
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute right-4 top-4 z-50 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Side: Form */}
            <div className="flex-1 p-10 flex flex-col justify-center">
              <h2 className="text-2xl font-bold mb-8 text-center">{authMode === "login" ? "Log in" : "Sign up"}</h2>
              
              {authMode === "login" ? (
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input 
                              placeholder="Please enter your username" 
                              {...field} 
                              className="bg-transparent border-0 border-b border-gray-700 rounded-none px-0 h-10 focus-visible:ring-0 focus-visible:border-primary transition-colors placeholder:text-gray-500" 
                            />
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
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Please input your password" 
                              {...field} 
                              className="bg-transparent border-0 border-b border-gray-700 rounded-none px-0 h-10 focus-visible:ring-0 focus-visible:border-primary transition-colors placeholder:text-gray-500" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-start">
                      <button type="button" className="text-xs text-pink-600 hover:underline">Forgot password</button>
                    </div>
                    <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700 text-white rounded-full h-11 font-bold" disabled={isLoggingIn}>
                      {isLoggingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Log In
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full border-gray-700 bg-transparent text-gray-300 hover:bg-white/5 rounded-full h-11"
                      onClick={() => setAuthMode("register")}
                    >
                      Sign UP
                    </Button>
                  </form>
                </Form>
              ) : (
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-5">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input 
                              placeholder="Please enter your username" 
                              {...field} 
                              className="bg-transparent border-0 border-b border-gray-700 rounded-none px-0 h-10 focus-visible:ring-0 focus-visible:border-primary transition-colors placeholder:text-gray-500" 
                            />
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
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Please input your password (min 6 chars)" 
                              {...field} 
                              className="bg-transparent border-0 border-b border-gray-700 rounded-none px-0 h-10 focus-visible:ring-0 focus-visible:border-primary transition-colors placeholder:text-gray-500" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700 text-white rounded-full h-11 font-bold" disabled={isRegistering}>
                      {isRegistering && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Register
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full border-gray-700 bg-transparent text-gray-300 hover:bg-white/5 rounded-full h-11"
                      onClick={() => setAuthMode("login")}
                    >
                      Back to Log In
                    </Button>
                  </form>
                </Form>
              )}

              <div className="mt-10">
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-800"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-[#1a1b1e] px-2 text-gray-500">Or log in with</span>
                  </div>
                </div>
                <div className="flex gap-4 justify-center">
                  <Button variant="outline" className="flex-1 border-gray-700 bg-transparent hover:bg-white/5 rounded-full text-xs py-1 h-9">
                    <SiFacebook className="mr-2 h-3.5 w-3.5 text-blue-500" />
                    Facebook
                  </Button>
                  <Button variant="outline" className="flex-1 border-gray-700 bg-transparent hover:bg-white/5 rounded-full text-xs py-1 h-9">
                    <SiGoogle className="mr-2 h-3.5 w-3.5 text-red-500" />
                    Google
                  </Button>
                </div>
                <p className="mt-6 text-[10px] text-gray-500 text-center">
                  By logging in, you agree to the <span className="text-gray-400">"Terms of Use"</span> & <span className="text-gray-400">"Privacy Policy"</span>
                </p>
              </div>
            </div>

            {/* Right Side: QR Code (Placeholder as per screenshot) */}
            <div className="hidden md:flex flex-[0.8] bg-gradient-to-br from-[#2a2c31] to-[#1a1b1e] flex-col items-center justify-center p-10 border-l border-gray-800">
              <h3 className="text-sm font-medium mb-8 text-gray-300">log in with QR code</h3>
              <div className="bg-white p-3 rounded-lg mb-6">
                <img 
                  src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=YOUKU_AUTH_PLACEHOLDER" 
                  alt="QR Code" 
                  className="w-32 h-32"
                />
              </div>
              <p className="text-[10px] text-gray-500 text-center">
                open <span className="text-primary font-bold italic">YOUKU</span> app to scan the QR code to log in
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
