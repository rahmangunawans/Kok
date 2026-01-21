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
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { SiFacebook, SiGoogle } from "react-icons/si";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

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

  useEffect(() => {
    const handleOpenAuth = () => {
      setShowAuthModal(true);
      setAuthMode("login");
    };
    window.addEventListener('open-auth-modal', handleOpenAuth);
    return () => window.removeEventListener('open-auth-modal', handleOpenAuth);
  }, []);

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
                <VideoCard video={video} onClick={(e) => {
                  if (!user) {
                    e.preventDefault();
                    setShowAuthModal(true);
                  }
                }} />
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
                    <VideoCard video={video} onClick={(e) => {
                      if (!user) {
                        e.preventDefault();
                        setShowAuthModal(true);
                      }
                    }} />
                  </div>
                ))}
            </div>
          </section>
        ))}
      </div>

      {/* Modern Auth Modal - Updated Styling */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="max-w-[95vw] sm:max-w-[850px] p-0 overflow-hidden border-white/5 bg-[#121214] shadow-2xl [&>button]:hidden">
          <VisuallyHidden>
            <DialogTitle>{authMode === "login" ? "Login to YOUKU" : "Sign up for YOUKU"}</DialogTitle>
          </VisuallyHidden>
          
          <div className="relative w-full sm:h-[500px] bg-[#121214] text-white flex flex-col sm:flex-row rounded-2xl overflow-hidden">
            {/* Modal Close Button - Custom Styled */}
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute right-4 top-4 z-50 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all outline-none border-none"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Side: Form */}
            <div className="flex-1 p-8 sm:p-12 flex flex-col justify-start sm:justify-center pt-16 sm:pt-12">
              <div className="mb-6 sm:mb-10 text-center">
                <h2 className="text-2xl sm:text-3xl font-display font-black tracking-tight mb-2">
                  {authMode === "login" ? "Welcome Back" : "Join YOUKU"}
                </h2>
                <p className="text-sm text-gray-500 font-medium">
                  {authMode === "login" ? "Log in to your account to continue" : "Create an account to start watching"}
                </p>
              </div>
              
              <div className="space-y-4 sm:space-y-6">
                {authMode === "login" ? (
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4 sm:space-y-6">
                      <div className="space-y-3 sm:space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <div className="relative group">
                                  <Input 
                                    placeholder="Username" 
                                    {...field} 
                                    className="bg-white/5 border-white/10 rounded-xl h-12 px-4 focus-visible:ring-primary/20 focus-visible:border-primary transition-all placeholder:text-gray-600" 
                                  />
                                </div>
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
                                <div className="relative group">
                                  <Input 
                                    type="password" 
                                    placeholder="Password" 
                                    {...field} 
                                    className="bg-white/5 border-white/10 rounded-xl h-12 px-4 focus-visible:ring-primary/20 focus-visible:border-primary transition-all placeholder:text-gray-600" 
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="flex justify-end">
                        <button type="button" className="text-xs text-primary/80 hover:text-primary transition-colors font-medium">Forgot password?</button>
                      </div>
                      
                      <div className="space-y-3">
                        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 font-bold text-base shadow-lg shadow-primary/20 transition-all active:scale-[0.98]" disabled={isLoggingIn}>
                          {isLoggingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Log In
                        </Button>
                        <p className="text-center text-sm text-gray-500">
                          Don't have an account?{' '}
                          <button 
                            type="button"
                            className="text-primary font-bold hover:underline"
                            onClick={() => setAuthMode("register")}
                          >
                            Sign UP
                          </button>
                        </p>
                      </div>
                    </form>
                  </Form>
                ) : (
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4 sm:space-y-6">
                      <div className="space-y-3 sm:space-y-4">
                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input 
                                  placeholder="Username" 
                                  {...field} 
                                  className="bg-white/5 border-white/10 rounded-xl h-12 px-4 focus-visible:ring-primary/20 focus-visible:border-primary transition-all placeholder:text-gray-600" 
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
                                  placeholder="Password (min 6 chars)" 
                                  {...field} 
                                  className="bg-white/5 border-white/10 rounded-xl h-12 px-4 focus-visible:ring-primary/20 focus-visible:border-primary transition-all placeholder:text-gray-600" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 font-bold text-base shadow-lg shadow-primary/20 transition-all active:scale-[0.98]" disabled={isRegistering}>
                          {isRegistering && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Create Account
                        </Button>
                        <p className="text-center text-sm text-gray-500">
                          Already have an account?{' '}
                          <button 
                            type="button"
                            className="text-primary font-bold hover:underline"
                            onClick={() => setAuthMode("login")}
                          >
                            Log In
                          </button>
                        </p>
                      </div>
                    </form>
                  </Form>
                )}

                <div className="pt-4 sm:pt-6">
                  <div className="relative mb-4 sm:mb-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/5"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                      <span className="bg-[#121214] px-4 text-gray-600">Or continue with</span>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Button variant="outline" className="flex-1 border-white/5 bg-white/5 hover:bg-white/10 rounded-xl h-11 transition-all active:scale-[0.98]">
                      <SiFacebook className="mr-2 h-4 w-4 text-[#1877F2]" />
                      <span className="text-xs font-bold">Facebook</span>
                    </Button>
                    <Button variant="outline" className="flex-1 border-white/5 bg-white/5 hover:bg-white/10 rounded-xl h-11 transition-all active:scale-[0.98]">
                      <SiGoogle className="mr-2 h-4 w-4 text-[#EA4335]" />
                      <span className="text-xs font-bold">Google</span>
                    </Button>
                  </div>
                </div>
              </div>
              
              <p className="mt-8 sm:mt-10 text-[10px] text-gray-600 text-center leading-relaxed">
                By joining, you agree to our <span className="text-gray-400 hover:text-primary transition-colors cursor-pointer underline underline-offset-2">Terms of Use</span> & <span className="text-gray-400 hover:text-primary transition-colors cursor-pointer underline underline-offset-2">Privacy Policy</span>
              </p>
            </div>

            {/* Right Side: QR Code (Visible on Desktop only) */}
            <div className="hidden sm:flex flex-[0.8] bg-gradient-to-br from-[#1a1a1c] to-[#121214] flex-col items-center justify-center p-12 border-l border-white/5 min-h-[500px]">
              <div className="text-center mb-10">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-2">QR Code Login</h3>
                <p className="text-xs text-gray-600">Scan to log in instantly</p>
              </div>
              
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-white p-4 rounded-xl shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]">
                  <img 
                    src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=YOUKU_AUTH_PLACEHOLDER" 
                    alt="QR Code" 
                    className="w-32 h-32 lg:w-40 lg:h-40"
                  />
                </div>
              </div>
              
              <div className="mt-10 flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5">
                  <span className="text-[10px] text-gray-400">Open <span className="text-primary font-black italic">YOUKU</span> App</span>
                </div>
                <p className="text-[10px] text-gray-600 max-w-[180px] text-center leading-normal">
                  Available on iOS and Android. Scan the code to sync your account.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
