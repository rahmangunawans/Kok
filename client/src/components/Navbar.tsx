import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Search, User as UserIcon, LogOut, MonitorPlay, Crown, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useVideos } from "@/hooks/use-videos";
import { Badge } from "@/components/ui/badge";

export function Navbar() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [showVipModal, setShowVipModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  
  const { data: searchResults } = useVideos({ search: search.length >= 2 ? search : undefined });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      setLocation(`/?search=${encodeURIComponent(search)}`);
      setShowSearch(false);
    }
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Movies", href: "/category/movie" },
    { name: "Drama", href: "/category/drama" },
    { name: "Anime", href: "/category/anime" },
  ];

  const vipPlans = [
    {
      id: 'monthly',
      name: 'Monthly Subscription',
      price: 'Rp15500',
      originalPrice: 'Rp39000',
      discount: '60% off',
      saving: 'Saved Rp23500'
    },
    {
      id: 'quarterly',
      name: 'Quarterly Subscription',
      price: 'Rp55000',
      originalPrice: 'Rp109000',
      discount: '50% off'
    },
    {
      id: 'annual',
      name: 'Annual Subscription',
      price: 'Rp189000',
      originalPrice: 'Rp369000',
      discount: '50% off'
    },
    {
      id: '12month',
      name: '12-Month Plan',
      price: 'Rp309000',
      originalPrice: 'Rp449000',
      discount: '30% off'
    }
  ];

  const [selectedPlan, setSelectedPlan] = useState(vipPlans[0]);

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-2 md:gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-display font-bold text-xl md:text-2xl text-primary tracking-tight shrink-0 hover:opacity-80 transition-opacity">
            <MonitorPlay className="w-7 h-7 md:w-8 md:h-8" />
            <span>YOUKU</span>
          </Link>

          {/* Navigation - Desktop */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="/" className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${location === "/" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-white/5"}`}>
              Home
            </Link>
            <Link href="/category/drama" className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${location === "/category/drama" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-white/5"}`}>
              Drama
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${location.startsWith("/category/") && location !== "/category/drama" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-white/5"}`}>
                  All
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                <DropdownMenuItem onClick={() => setLocation("/category/movie")}>Movies</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/category/anime")}>Anime</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/category/variety")}>Variety</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/category/documentary")}>Documentary</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Search Bar - Center Desktop */}
          <div className="hidden md:block flex-1 max-w-md mx-auto">
            <form onSubmit={handleSearchSubmit} className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Search movies, dramas..." 
                className="pl-10 bg-secondary/50 border-transparent focus-visible:bg-secondary focus-visible:ring-primary/20 rounded-full h-10 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {/* Autocomplete Results Desktop */}
              {search.length >= 2 && searchResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-white/5 rounded-2xl shadow-2xl overflow-hidden z-50">
                  {searchResults.length > 0 ? (
                    searchResults.slice(0, 5).map((video) => (
                      <Link 
                        key={video.id} 
                        href={`/video/${video.id}`}
                        onClick={() => setSearch("")}
                        className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                      >
                        <img src={video.posterUrl} alt={video.title} className="w-10 h-14 object-cover rounded-md" />
                        <div>
                          <p className="font-medium text-sm text-white line-clamp-1">{video.title}</p>
                          <p className="text-xs text-muted-foreground">{video.year} • {video.country}</p>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-muted-foreground">No results found</div>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* User Menu / Auth Profile Icon */}
          <div className="flex items-center gap-2 shrink-0">
            <Button 
              onClick={() => setShowVipModal(true)}
              className="flex bg-accent hover:bg-accent/90 text-accent-foreground font-bold gap-1 rounded-full px-4 md:px-6 h-9 md:h-10"
            >
              <Crown className="w-4 h-4" />
              <span className="hidden xs:inline">VIP</span>
            </Button>

            {/* Mobile Search Trigger */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9 rounded-full"
              onClick={() => setShowSearch(!showSearch)}
            >
              {showSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 md:h-10 md:w-10 rounded-full p-0">
                  <Avatar className="h-8 w-8 md:h-9 md:w-9 border border-primary/20">
                    <AvatarImage src={user?.avatarUrl || undefined} alt={user?.username || "Guest"} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user ? user.username.slice(0, 2).toUpperCase() : <UserIcon className="w-5 h-5" />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                {user ? (
                  <>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.username}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.isAdmin ? 'Admin' : 'Member'}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setLocation("/profile")}>
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Profile & History</span>
                    </DropdownMenuItem>
                    {user.isAdmin && (
                      <DropdownMenuItem onClick={() => setLocation("/admin")}>
                        <MonitorPlay className="mr-2 h-4 w-4" />
                        <span>Admin Panel</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => logout()} className="text-red-500 focus:text-red-500 focus:bg-red-500/10">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuLabel>Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setLocation("/login")}>
                      <span>Sign In / Register</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Search Bar - Expandable */}
        {showSearch && (
          <div className="md:hidden p-4 border-t border-white/5 animate-in slide-in-from-top duration-200">
            <form onSubmit={handleSearchSubmit} className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                autoFocus
                placeholder="Search movies, dramas..." 
                className="pl-10 bg-secondary/50 border-transparent focus-visible:bg-secondary focus-visible:ring-primary/20 rounded-full h-10 w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {/* Autocomplete Results Mobile */}
              {search.length >= 2 && searchResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-white/5 rounded-2xl shadow-2xl overflow-hidden z-50">
                  {searchResults.length > 0 ? (
                    searchResults.slice(0, 5).map((video) => (
                      <Link 
                        key={video.id} 
                        href={`/video/${video.id}`}
                        onClick={() => {
                          setSearch("");
                          setShowSearch(false);
                        }}
                        className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                      >
                        <img src={video.posterUrl} alt={video.title} className="w-10 h-14 object-cover rounded-md" />
                        <div>
                          <p className="font-medium text-sm text-white line-clamp-1">{video.title}</p>
                          <p className="text-xs text-muted-foreground">{video.year} • {video.country}</p>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-muted-foreground">No results found</div>
                  )}
                </div>
              )}
            </form>
          </div>
        )}
      </nav>

      {/* Mobile Sub-Nav (Desktop doesn't need this, it's already in the main header) */}
      <div className="md:hidden sticky top-16 z-40 w-full border-b border-white/5 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-2">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${location === link.href ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-white/5"}`}>
              {link.name}
            </Link>
          ))}
        </div>
      </div>

      {/* VIP Modal */}
      <Dialog open={showVipModal} onOpenChange={setShowVipModal}>
        <DialogContent className="sm:max-w-[480px] p-0 border-white/5 bg-background overflow-hidden max-h-[90vh] flex flex-col">
          <div className="relative p-6 bg-gradient-to-br from-accent/20 to-background">
            <DialogHeader>
              <DialogTitle className="text-2xl font-display font-black text-accent flex items-center gap-2">
                <Crown className="w-6 h-6 fill-current" />
                YOUKU VIP
              </DialogTitle>
              <div className="mt-2 text-sm text-muted-foreground">
                {!user && (
                  <Link href="/login" className="text-primary hover:underline font-medium">Log in/Sign up</Link>
                )}
              </div>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
            <div className="grid grid-cols-1 gap-3">
              {vipPlans.map((plan) => (
                <div 
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${selectedPlan.id === plan.id ? 'border-accent bg-accent/5 shadow-[0_0_20px_rgba(208,153,46,0.1)]' : 'border-white/5 bg-secondary/30 hover:border-white/20'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-white text-sm md:text-base">{plan.name}</span>
                    {plan.discount && (
                      <Badge className="bg-accent text-accent-foreground text-[10px] font-black border-0">
                        {plan.discount}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl md:text-2xl font-black text-accent">{plan.price}</span>
                    <span className="text-xs md:text-sm text-muted-foreground line-through">{plan.originalPrice}</span>
                  </div>
                  {selectedPlan.id === plan.id && (
                    <div className="absolute right-4 bottom-4">
                      <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-accent-foreground stroke-[3]" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
              <p className="text-xs md:text-sm font-medium text-accent">
                New subscribers get 60% off the first term!
              </p>
            </div>
          </div>

          <div className="p-6 border-t border-white/5 bg-secondary/10">
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="text-2xl font-black text-accent">{selectedPlan.price}</span>
                {selectedPlan.saving && (
                  <p className="text-xs text-green-500 font-medium">{selectedPlan.saving}</p>
                )}
              </div>
              <span className="text-xs text-muted-foreground">Choose Payment Method</span>
            </div>
            
            <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-black h-12 text-base md:text-lg rounded-full shadow-lg shadow-accent/20">
              Pay now {selectedPlan.price}
            </Button>
            
            <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
              <button className="hover:text-accent">VIP Membership Terms</button>
              <button className="hover:text-accent">Privacy Policy</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
