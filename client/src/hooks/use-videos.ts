import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type Video, type InsertVideo, type InsertWatchHistory } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

// Fetch videos list with optional filters
export function useVideos(filters?: { category?: string; search?: string; featured?: boolean }) {
  return useQuery({
    queryKey: [api.videos.list.path, filters],
    queryFn: async () => {
      // Build query string manually since backend expects query params
      const params = new URLSearchParams();
      if (filters?.category) params.append("category", filters.category);
      if (filters?.search) params.append("search", filters.search);
      if (filters?.featured !== undefined) params.append("featured", String(filters.featured));
      
      const url = `${api.videos.list.path}?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch videos");
      return api.videos.list.responses[200].parse(await res.json());
    },
  });
}

// Fetch single video details
export function useVideo(id: number) {
  return useQuery({
    queryKey: [api.videos.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.videos.get.path, { id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Video not found");
      return api.videos.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

// Fetch categories
export function useCategories() {
  return useQuery({
    queryKey: [api.categories.list.path],
    queryFn: async () => {
      const res = await fetch(api.categories.list.path);
      if (!res.ok) throw new Error("Failed to fetch categories");
      return api.categories.list.responses[200].parse(await res.json());
    },
  });
}

// Fetch episodes for a video
export function useEpisodes(videoId: number) {
  return useQuery({
    queryKey: ["episodes", videoId],
    queryFn: async () => {
      const url = buildUrl(api.episodes.list.path, { videoId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch episodes");
      return api.episodes.list.responses[200].parse(await res.json());
    },
    enabled: !!videoId,
  });
}

// Fetch single episode details (sources, subtitles)
export function useEpisode(id: number) {
  return useQuery({
    queryKey: [api.episodes.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.episodes.get.path, { id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Episode not found");
      return api.episodes.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

// Create video (Admin)
export function useCreateVideo() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertVideo) => {
      const res = await fetch(api.videos.create.path, {
        method: api.videos.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create video");
      return api.videos.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.videos.list.path] });
      toast({ title: "Success", description: "Video created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create video", variant: "destructive" });
    }
  });
}

// Watch History
export function useWatchHistory() {
  return useQuery({
    queryKey: [api.history.list.path],
    queryFn: async () => {
      const res = await fetch(api.history.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch history");
      return api.history.list.responses[200].parse(await res.json());
    },
  });
}

export function useUpdateHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertWatchHistory) => {
      const res = await fetch(api.history.update.path, {
        method: api.history.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update history");
      return api.history.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.history.list.path] });
    },
  });
}

// Watchlist
export function useWatchlist() {
  return useQuery({
    queryKey: [api.watchlist.list.path],
    queryFn: async () => {
      const res = await fetch(api.watchlist.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch watchlist");
      return api.watchlist.list.responses[200].parse(await res.json());
    },
  });
}

export function useAddToWatchlist() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (videoId: number) => {
      const res = await fetch(api.watchlist.add.path, {
        method: api.watchlist.add.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add to watchlist");
      return api.watchlist.add.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.watchlist.list.path] });
      toast({ title: "Added to watchlist" });
    },
  });
}

export function useRemoveFromWatchlist() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (videoId: number) => {
      const url = buildUrl(api.watchlist.remove.path, { videoId });
      const res = await fetch(url, {
        method: api.watchlist.remove.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to remove from watchlist");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.watchlist.list.path] });
      toast({ title: "Removed from watchlist" });
    },
  });
}
