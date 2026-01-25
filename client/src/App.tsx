import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/Navbar";

import Home from "@/pages/Home";
import CategoryPage from "@/pages/CategoryPage";
import VideoDetail from "@/pages/VideoDetail";
import WatchPage from "@/pages/WatchPage";
import ProfilePage from "@/pages/ProfilePage";
import AdminPage from "@/pages/AdminPage";
import AdminLogin from "@/pages/AdminLogin";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/category/:slug" component={CategoryPage} />
      <Route path="/video/:id" component={VideoDetail} />
      <Route path="/watch/:videoId/:episodeId" component={WatchPage} />
      
      <Route path="/login" component={Home} />
      <Route path="/register" component={Home} />
      
      <Route path="/profile" component={ProfilePage} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={AdminPage} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background font-body text-foreground flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Router />
          </main>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
