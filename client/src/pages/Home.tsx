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

  const handleSwitchMode = (mode: "login" | "register") => {
    setAuthMode(mode);
    loginForm.reset();
    registerForm.reset();
  };

  useEffect(() => {
    if (user) {
      setShowAuthModal(false);
    }
  }, [user]);

  useEffect(() => {
    const handleOpenAuth = () => {
      setShowAuthModal(true);
      handleSwitchMode("login");
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
      <div className="max-w-[1400px] mx-auto px-4 space-y-12">
        
        {/* Latest Videos */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-display font-bold">Latest Updates</h2>
            <Link href="/category/all" className="text-sm font-medium text-primary hover:underline">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 md:gap-4">
            {allVideos?.slice(0, 14).map((video) => (
              <VideoCard key={video.id} video={video} onClick={(e) => {
                if (!user) {
                  e.preventDefault();
                  setShowAuthModal(true);
                }
              }} />
            ))}
          </div>
        </section>

        {/* Categories Preview */}
        {categories?.slice(0, 3).map((category) => (
          <section key={category.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl md:text-2xl font-display font-bold">{category.name}</h2>
              <Link href={`/category/${category.slug}`} className="text-sm font-medium text-primary hover:underline">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 md:gap-4">
              {allVideos
                ?.filter(v => v.categoryId === category.id)
                .slice(0, 14)
                .map((video) => (
                  <VideoCard key={video.id} video={video} onClick={(e) => {
                    if (!user) {
                      e.preventDefault();
                      setShowAuthModal(true);
                    }
                  }} />
                ))}
            </div>
          </section>
        ))}
      </div>

      {/* Modern Auth Modal - Updated Styling */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="max-w-[95vw] sm:max-w-[700px] p-0 overflow-hidden border-white/5 bg-[#121214] shadow-2xl [&>button]:hidden">
          <VisuallyHidden>
            <DialogTitle>{authMode === "login" ? "Login to YOUKU" : "Sign up for YOUKU"}</DialogTitle>
          </VisuallyHidden>
          
          <div className="relative w-full sm:min-h-[450px] bg-[#121214] text-white flex flex-col sm:flex-row rounded-2xl overflow-hidden">
            {/* Modal Close Button - Custom Styled */}
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute right-4 top-4 z-50 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all outline-none border-none"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Side: Form */}
            <div className="flex-1 p-6 sm:p-10 flex flex-col justify-center min-h-[400px] sm:min-h-0 pt-16 sm:pt-10">
              <div className="mb-6 sm:mb-8 text-center">
                <h2 className="text-xl sm:text-3xl font-display font-black tracking-tight mb-2 leading-tight">
                  {authMode === "login" ? "Welcome Back" : "Join YOUKU"}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 font-medium">
                  {authMode === "login" ? "Log in to your account" : "Create an account to start watching"}
                </p>
              </div>
              
              <div className="space-y-4">
                {authMode === "login" ? (
                  <Form {...loginForm} key="login-form">
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <div className="space-y-3">
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input 
                                  placeholder="Username" 
                                  {...field} 
                                  className="bg-[#1a1a1c] border-white/10 rounded-xl h-11 sm:h-12 px-4 focus-visible:ring-primary/40 focus-visible:border-primary transition-none placeholder:text-gray-500 text-sm text-white outline-none" 
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
                                  placeholder="Password" 
                                  {...field} 
                                  className="bg-[#1a1a1c] border-white/10 rounded-xl h-11 sm:h-12 px-4 focus-visible:ring-primary/40 focus-visible:border-primary transition-none placeholder:text-gray-500 text-sm text-white outline-none" 
                                />
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
                        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-11 sm:h-12 font-bold text-sm shadow-lg shadow-primary/20 transition-all active:scale-[0.98]" disabled={isLoggingIn}>
                          {isLoggingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Log In
                        </Button>
                        <p className="text-center text-xs text-gray-500">
                          Don't have an account?{' '}
                          <button 
                            type="button"
                            className="text-primary font-bold hover:underline"
                            onClick={() => handleSwitchMode("register")}
                          >
                            Sign UP
                          </button>
                        </p>
                      </div>
                    </form>
                  </Form>
                ) : (
                  <Form {...registerForm} key="register-form">
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <div className="space-y-3">
                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input 
                                  placeholder="Username" 
                                  {...field} 
                                  className="bg-[#1a1a1c] border-white/10 rounded-xl h-11 sm:h-12 px-4 focus-visible:ring-primary/40 focus-visible:border-primary transition-none placeholder:text-gray-500 text-sm text-white outline-none" 
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
                                  className="bg-[#1a1a1c] border-white/10 rounded-xl h-11 sm:h-12 px-4 focus-visible:ring-primary/40 focus-visible:border-primary transition-none placeholder:text-gray-500 text-sm text-white outline-none" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-11 sm:h-12 font-bold text-sm shadow-lg shadow-primary/20 transition-all active:scale-[0.98]" disabled={isRegistering}>
                          {isRegistering && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Create Account
                        </Button>
                        <p className="text-center text-xs text-gray-500">
                          Already have an account?{' '}
                          <button 
                            type="button"
                            className="text-primary font-bold hover:underline"
                            onClick={() => handleSwitchMode("login")}
                          >
                            Log In
                          </button>
                        </p>
                      </div>
                    </form>
                  </Form>
                )}

                <div className="pt-4">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/5"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                      <span className="bg-[#121214] px-4 text-gray-600">Or</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
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
              
              <p className="mt-6 sm:mt-8 text-[10px] text-gray-600 text-center leading-relaxed">
                By joining, you agree to our <span className="text-gray-400 hover:text-primary transition-colors cursor-pointer underline underline-offset-2">Terms</span> & <span className="text-gray-400 hover:text-primary transition-colors cursor-pointer underline underline-offset-2">Privacy</span>
              </p>
            </div>

            {/* Right Side: QR Code (Visible on Desktop only) */}
            <div className="hidden sm:flex flex-[0.7] bg-gradient-to-br from-[#1a1a1c] to-[#121214] flex-col items-center justify-center p-8 border-l border-white/5 min-h-[450px]">
              <div className="text-center mb-6">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">QR Login</h3>
                <p className="text-[9px] text-gray-600">Scan to log in</p>
              </div>
              
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-white p-3 rounded-xl shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]">
                  <img 
                    src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=YOUKU_AUTH_PLACEHOLDER" 
                    alt="QR Code" 
                    className="w-24 h-24"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5">
                  <span className="text-[9px] text-gray-400">Open <span className="text-primary font-black italic">YOUKU</span> App</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
