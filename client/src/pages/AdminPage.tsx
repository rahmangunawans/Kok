import { useQuery, useMutation } from "@tanstack/react-query";
import { Video, Category, Episode, InsertVideo, InsertEpisode, InsertCategory, insertVideoSchema, insertEpisodeSchema, insertCategorySchema, Actor, insertActorSchema } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Pencil, Trash2, LayoutDashboard, Film, Tag, Users, Play, List, Search, Download } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

interface ExternalSearchResult {
  id: string | number;
  title: string;
  titleEnglish?: string;
  synopsis?: string;
  posterUrl?: string;
  rating?: number;
  year?: number;
  episodes?: number;
  type?: string;
  source: "mal" | "mdl";
}

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [isEpisodeDialogOpen, setIsEpisodeDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isActorDialogOpen, setIsActorDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isVideoActorsDialogOpen, setIsVideoActorsDialogOpen] = useState(false);
  
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingActor, setEditingActor] = useState<Actor | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: number } | null>(null);
  
  const [importSource, setImportSource] = useState<"mal" | "mdl">("mal");
  const [importSearchQuery, setImportSearchQuery] = useState("");
  const [importSearchResults, setImportSearchResults] = useState<ExternalSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { data: videos, isLoading: videosLoading } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: actors } = useQuery<Actor[]>({
    queryKey: ["/api/actors"],
  });

  const { data: episodes } = useQuery<Episode[]>({
    queryKey: ["/api/videos", selectedVideoId, "episodes"],
    enabled: !!selectedVideoId,
  });

  const { data: videoActors } = useQuery<Actor[]>({
    queryKey: ["/api/videos", selectedVideoId, "actors"],
    enabled: !!selectedVideoId && isVideoActorsDialogOpen,
  });

  const videoMutation = useMutation({
    mutationFn: async (data: any) => {
      const method = editingVideo ? "PATCH" : "POST";
      const url = editingVideo ? `/api/videos/${editingVideo.id}` : "/api/videos";
      const res = await apiRequest(method, url, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({ title: "Berhasil", description: `Video telah ${editingVideo ? "diperbarui" : "ditambahkan"}` });
      setIsVideoDialogOpen(false);
      setEditingVideo(null);
    },
    onError: () => {
      toast({ title: "Gagal", description: "Terjadi kesalahan", variant: "destructive" });
    },
  });

  const deleteVideoMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/videos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({ title: "Berhasil", description: "Video telah dihapus" });
    },
  });

  const episodeMutation = useMutation({
    mutationFn: async (data: any) => {
      const method = editingEpisode ? "PATCH" : "POST";
      const url = editingEpisode ? `/api/episodes/${editingEpisode.id}` : "/api/episodes";
      const res = await apiRequest(method, url, { ...data, videoId: selectedVideoId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos", selectedVideoId, "episodes"] });
      toast({ title: "Berhasil", description: `Episode telah ${editingEpisode ? "diperbarui" : "ditambahkan"}` });
      setEditingEpisode(null);
      episodeForm.reset({ title: "", episodeNumber: 1, sourceUrl: "", duration: 0, thumbnailUrl: "" });
    },
  });

  const deleteEpisodeMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/episodes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos", selectedVideoId, "episodes"] });
      toast({ title: "Berhasil", description: "Episode telah dihapus" });
    },
  });

  const categoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const method = editingCategory ? "PATCH" : "POST";
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : "/api/categories";
      const res = await apiRequest(method, url, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Berhasil", description: `Kategori telah ${editingCategory ? "diperbarui" : "ditambahkan"}` });
      setIsCategoryDialogOpen(false);
      setEditingCategory(null);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Berhasil", description: "Kategori telah dihapus" });
    },
  });

  const actorMutation = useMutation({
    mutationFn: async (data: any) => {
      const method = editingActor ? "PATCH" : "POST";
      const url = editingActor ? `/api/actors/${editingActor.id}` : "/api/actors";
      const res = await apiRequest(method, url, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/actors"] });
      toast({ title: "Berhasil", description: `Aktor telah ${editingActor ? "diperbarui" : "ditambahkan"}` });
      setIsActorDialogOpen(false);
      setEditingActor(null);
    },
  });

  const deleteActorMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/actors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/actors"] });
      toast({ title: "Berhasil", description: "Aktor telah dihapus" });
    },
  });

  const addActorToVideoMutation = useMutation({
    mutationFn: async (actorId: number) => {
      await apiRequest("POST", `/api/videos/${selectedVideoId}/actors`, { actorId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos", selectedVideoId, "actors"] });
      toast({ title: "Berhasil", description: "Aktor ditambahkan ke video" });
    },
  });

  const removeActorFromVideoMutation = useMutation({
    mutationFn: async (actorId: number) => {
      await apiRequest("DELETE", `/api/videos/${selectedVideoId}/actors/${actorId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos", selectedVideoId, "actors"] });
      toast({ title: "Berhasil", description: "Aktor dihapus dari video" });
    },
  });

  const videoForm = useForm({
    resolver: zodResolver(insertVideoSchema),
    defaultValues: {
      title: "",
      description: "",
      posterUrl: "",
      bannerUrl: "",
      rating: 0,
      year: new Date().getFullYear(),
      country: "",
      categoryId: undefined as number | undefined,
      isFeatured: false,
      isVip: false,
    },
  });

  const episodeForm = useForm({
    resolver: zodResolver(insertEpisodeSchema),
    defaultValues: {
      title: "",
      episodeNumber: 1,
      sourceUrl: "",
      duration: 0,
      thumbnailUrl: "",
    },
  });

  const categoryForm = useForm({
    resolver: zodResolver(insertCategorySchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  const actorForm = useForm({
    resolver: zodResolver(insertActorSchema),
    defaultValues: {
      name: "",
      avatarUrl: "",
    },
  });

  const handleDelete = () => {
    if (!deleteConfirm) return;
    const { type, id } = deleteConfirm;
    if (type === "video") deleteVideoMutation.mutate(id);
    else if (type === "category") deleteCategoryMutation.mutate(id);
    else if (type === "actor") deleteActorMutation.mutate(id);
    else if (type === "episode") deleteEpisodeMutation.mutate(id);
    setDeleteConfirm(null);
  };

  const handleExternalSearch = async () => {
    if (!importSearchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const endpoint = importSource === "mal" 
        ? `/api/external/mal/search?q=${encodeURIComponent(importSearchQuery)}`
        : `/api/external/mdl/search?q=${encodeURIComponent(importSearchQuery)}`;
      
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("Search failed");
      
      const data = await res.json();
      setImportSearchResults(data);
    } catch (error) {
      toast({ title: "Error", description: "Gagal mencari data", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  };

  const handleImportResult = async (result: ExternalSearchResult) => {
    const animeCat = categories?.find(c => (c as Category).slug === "anime");
    const dramaCat = categories?.find(c => (c as Category).slug === "drama");
    
    // If it's MDL and we don't have a synopsis, fetch details first
    let finalResult: any = { ...result };
    if (result.source === "mdl" && !result.synopsis) {
      try {
        toast({ title: "Mohon tunggu", description: "Mengambil detail drama..." });
        const res = await fetch(`/api/external/mdl/${result.id}`);
        if (res.ok) {
          finalResult = await res.json();
        }
      } catch (error) {
        console.error("Failed to fetch MDL details during import:", error);
      }
    }
    
    videoForm.reset({
      title: finalResult.title,
      description: finalResult.synopsis || "",
      posterUrl: finalResult.posterUrl || "",
      bannerUrl: finalResult.posterUrl || "",
      rating: finalResult.rating || 0,
      year: parseInt(finalResult.year) || new Date().getFullYear(),
      country: finalResult.source === "mal" ? "Japan" : (finalResult.country || "Korea"),
      categoryId: finalResult.source === "mal" ? animeCat?.id : dramaCat?.id,
      isFeatured: false,
      isVip: false,
    });
    
    setIsImportDialogOpen(false);
    setEditingVideo(null);
    setIsVideoDialogOpen(true);
    toast({ title: "Data diimpor", description: "Silakan review dan simpan video" });
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !user.isAdmin) {
    return <Redirect to="/admin/login" />;
  }

  if (videosLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-muted-foreground">Kelola konten video, episode, kategori, dan aktor</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Video</CardTitle>
              <Film className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{videos?.length || 0}</div>
            </CardContent>
          </Card>
          <Card className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Kategori</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories?.length || 0}</div>
            </CardContent>
          </Card>
          <Card className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Aktor</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{actors?.length || 0}</div>
            </CardContent>
          </Card>
          <Card className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {videos?.reduce((acc, v) => acc + (v.views || 0), 0).toLocaleString() || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="videos" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="videos" data-testid="tab-videos">Videos</TabsTrigger>
            <TabsTrigger value="categories" data-testid="tab-categories">Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="videos" className="space-y-4">
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                data-testid="button-import-video"
                variant="outline"
                onClick={() => { 
                  setImportSearchQuery("");
                  setImportSearchResults([]);
                  setIsImportDialogOpen(true); 
                }} 
                className="gap-2"
              >
                <Download className="h-4 w-4" /> Import dari MAL/MDL
              </Button>
              <Button 
                data-testid="button-add-video"
                onClick={() => { 
                  setEditingVideo(null); 
                  videoForm.reset({
                    title: "",
                    description: "",
                    posterUrl: "",
                    bannerUrl: "",
                    rating: 0,
                    year: new Date().getFullYear(),
                    country: "",
                    categoryId: undefined,
                    isFeatured: false,
                    isVip: false,
                  }); 
                  setIsVideoDialogOpen(true); 
                }} 
                className="gap-2"
              >
                <Plus className="h-4 w-4" /> Tambah Video
              </Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Poster</TableHead>
                      <TableHead>Judul</TableHead>
                      <TableHead>Tahun</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {videos?.map(video => (
                      <TableRow key={video.id} data-testid={`row-video-${video.id}`}>
                        <TableCell>
                          {video.posterUrl && (
                            <img 
                              src={video.posterUrl} 
                              alt={video.title} 
                              className="w-12 h-16 object-cover rounded"
                            />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{video.title}</TableCell>
                        <TableCell>{video.year}</TableCell>
                        <TableCell>
                          {categories?.find(c => c.id === video.categoryId)?.name || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {video.isFeatured && <Badge variant="default">Featured</Badge>}
                            {video.isVip && <Badge variant="secondary">VIP</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>{video.views?.toLocaleString() || 0}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              data-testid={`button-episodes-${video.id}`}
                              onClick={() => { 
                                setSelectedVideoId(video.id); 
                                setEditingEpisode(null);
                                episodeForm.reset({ title: "", episodeNumber: 1, sourceUrl: "", duration: 0, thumbnailUrl: "" });
                                setIsEpisodeDialogOpen(true); 
                              }}
                            >
                              <List className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              data-testid={`button-actors-${video.id}`}
                              onClick={() => { 
                                setSelectedVideoId(video.id); 
                                setIsVideoActorsDialogOpen(true); 
                              }}
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              data-testid={`button-edit-video-${video.id}`}
                              onClick={() => { 
                                setEditingVideo(video); 
                                videoForm.reset({
                                  title: video.title,
                                  description: video.description || "",
                                  posterUrl: video.posterUrl || "",
                                  bannerUrl: video.bannerUrl || "",
                                  rating: video.rating || 0,
                                  year: video.year || new Date().getFullYear(),
                                  country: video.country || "",
                                  categoryId: video.categoryId ?? undefined,
                                  isFeatured: video.isFeatured || false,
                                  isVip: video.isVip || false,
                                }); 
                                setIsVideoDialogOpen(true); 
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive"
                              data-testid={`button-delete-video-${video.id}`}
                              onClick={() => setDeleteConfirm({ type: "video", id: video.id })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!videos || videos.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          Belum ada video. Klik "Tambah Video" untuk menambahkan.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <div className="flex justify-end pt-4">
              <Button 
                data-testid="button-add-category"
                onClick={() => { 
                  setEditingCategory(null); 
                  categoryForm.reset({ name: "", slug: "" }); 
                  setIsCategoryDialogOpen(true); 
                }} 
                className="gap-2"
              >
                <Plus className="h-4 w-4" /> Tambah Kategori
              </Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories?.map(cat => (
                      <TableRow key={cat.id} data-testid={`row-category-${cat.id}`}>
                        <TableCell>{cat.name}</TableCell>
                        <TableCell>{cat.slug}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              data-testid={`button-edit-category-${cat.id}`}
                              onClick={() => { 
                                setEditingCategory(cat); 
                                categoryForm.reset({ name: cat.name, slug: cat.slug }); 
                                setIsCategoryDialogOpen(true); 
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive"
                              data-testid={`button-delete-category-${cat.id}`}
                              onClick={() => setDeleteConfirm({ type: "category", id: cat.id })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!categories || categories.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                          Belum ada kategori.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>

      <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
        <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{editingVideo ? "Edit Video" : "Tambah Video"}</DialogTitle>
          </DialogHeader>
          <Form {...videoForm}>
            <form onSubmit={videoForm.handleSubmit((data) => videoMutation.mutate(data))} className="space-y-4">
              <FormField control={videoForm.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Judul</FormLabel>
                  <FormControl><Input data-testid="input-video-title" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={videoForm.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi</FormLabel>
                  <FormControl><Textarea data-testid="input-video-description" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={videoForm.control} name="posterUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Poster</FormLabel>
                    <FormControl><Input data-testid="input-video-poster" placeholder="https://..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={videoForm.control} name="bannerUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Banner</FormLabel>
                    <FormControl><Input data-testid="input-video-banner" placeholder="https://..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FormField control={videoForm.control} name="year" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tahun</FormLabel>
                    <FormControl>
                      <Input 
                        data-testid="input-video-year"
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value) || new Date().getFullYear())} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={videoForm.control} name="country" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Negara</FormLabel>
                    <FormControl><Input data-testid="input-video-country" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={videoForm.control} name="rating" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rating (0-10)</FormLabel>
                    <FormControl>
                      <Input 
                        data-testid="input-video-rating"
                        type="number" 
                        step="0.1"
                        min="0"
                        max="10"
                        {...field} 
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={videoForm.control} name="categoryId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategori</FormLabel>
                  <Select 
                    value={field.value?.toString() || ""} 
                    onValueChange={(val) => field.onChange(val ? parseInt(val) : undefined)}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-video-category">
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories?.map(cat => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex gap-6">
                <FormField control={videoForm.control} name="isFeatured" render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox 
                        data-testid="checkbox-video-featured"
                        checked={field.value} 
                        onCheckedChange={field.onChange} 
                      />
                    </FormControl>
                    <FormLabel className="font-normal">Featured</FormLabel>
                  </FormItem>
                )} />
                <FormField control={videoForm.control} name="isVip" render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox 
                        data-testid="checkbox-video-vip"
                        checked={field.value} 
                        onCheckedChange={field.onChange} 
                      />
                    </FormControl>
                    <FormLabel className="font-normal">VIP Only</FormLabel>
                  </FormItem>
                )} />
              </div>
              <Button type="submit" className="w-full" data-testid="button-save-video" disabled={videoMutation.isPending}>
                {videoMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEpisodeDialogOpen} onOpenChange={setIsEpisodeDialogOpen}>
        <DialogContent className="max-w-4xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Kelola Episode - {videos?.find(v => v.id === selectedVideoId)?.title}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 pt-4">
            <Form {...episodeForm}>
              <form onSubmit={episodeForm.handleSubmit((data) => episodeMutation.mutate(data))} className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-lg">
                <FormField control={episodeForm.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Judul Episode</FormLabel>
                    <FormControl><Input data-testid="input-episode-title" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={episodeForm.control} name="episodeNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>No. Episode</FormLabel>
                    <FormControl>
                      <Input 
                        data-testid="input-episode-number"
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value) || 1)} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={episodeForm.control} name="sourceUrl" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Streaming Link (m3u8/mp4)</FormLabel>
                    <FormControl><Input data-testid="input-episode-source" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="md:col-span-2" data-testid="button-save-episode" disabled={episodeMutation.isPending}>
                  {episodeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingEpisode ? "Update Episode" : "Tambah Episode"}
                </Button>
              </form>
            </Form>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Judul</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {episodes?.map((ep) => (
                  <TableRow key={ep.id} data-testid={`row-episode-${ep.id}`}>
                    <TableCell>{ep.episodeNumber}</TableCell>
                    <TableCell>{ep.title}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          data-testid={`button-edit-episode-${ep.id}`}
                          onClick={() => { 
                            setEditingEpisode(ep); 
                            episodeForm.reset({
                              title: ep.title,
                              episodeNumber: ep.episodeNumber,
                              sourceUrl: ep.sourceUrl,
                              duration: ep.duration ?? 0,
                              thumbnailUrl: ep.thumbnailUrl ?? "",
                            }); 
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive"
                          data-testid={`button-delete-episode-${ep.id}`}
                          onClick={() => setDeleteConfirm({ type: "episode", id: ep.id })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!episodes || episodes.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      Belum ada episode.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Kategori" : "Tambah Kategori"}</DialogTitle>
          </DialogHeader>
          <Form {...categoryForm}>
            <form onSubmit={categoryForm.handleSubmit((data) => categoryMutation.mutate(data))} className="space-y-4">
              <FormField control={categoryForm.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama</FormLabel>
                  <FormControl><Input data-testid="input-category-name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={categoryForm.control} name="slug" render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl><Input data-testid="input-category-slug" placeholder="contoh: drama-korea" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full" data-testid="button-save-category" disabled={categoryMutation.isPending}>
                {categoryMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isActorDialogOpen} onOpenChange={setIsActorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingActor ? "Edit Aktor" : "Tambah Aktor"}</DialogTitle>
          </DialogHeader>
          <Form {...actorForm}>
            <form onSubmit={actorForm.handleSubmit((data) => actorMutation.mutate(data))} className="space-y-4">
              <FormField control={actorForm.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama</FormLabel>
                  <FormControl><Input data-testid="input-actor-name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={actorForm.control} name="avatarUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Foto</FormLabel>
                  <FormControl><Input data-testid="input-actor-photo" placeholder="https://..." {...field} value={field.value || ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full" data-testid="button-save-actor" disabled={actorMutation.isPending}>
                {actorMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus item ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Batal</AlertDialogCancel>
            <AlertDialogAction data-testid="button-confirm-delete" onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isVideoActorsDialogOpen} onOpenChange={setIsVideoActorsDialogOpen}>
        <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Kelola Aktor - {videos?.find(v => v.id === selectedVideoId)?.title}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 pt-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Aktor saat ini:</p>
              <div className="flex flex-wrap gap-2">
                {videoActors?.map((actor) => (
                  <Badge 
                    key={actor.id} 
                    variant="secondary" 
                    className="flex items-center gap-1 pr-1"
                    data-testid={`badge-video-actor-${actor.id}`}
                  >
                    {actor.avatarUrl && (
                      <img src={actor.avatarUrl} alt={actor.name} className="w-5 h-5 rounded-full object-cover" />
                    )}
                    {actor.name}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 ml-1"
                      data-testid={`button-remove-actor-${actor.id}`}
                      onClick={() => removeActorFromVideoMutation.mutate(actor.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
                {(!videoActors || videoActors.length === 0) && (
                  <p className="text-sm text-muted-foreground">Belum ada aktor ditambahkan</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Tambah aktor:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
                {actors?.filter(a => !videoActors?.some(va => va.id === a.id)).map((actor) => (
                  <Card 
                    key={actor.id} 
                    className="hover-elevate cursor-pointer p-2"
                    onClick={() => addActorToVideoMutation.mutate(actor.id)}
                    data-testid={`card-add-actor-${actor.id}`}
                  >
                    <div className="flex items-center gap-2">
                      {actor.avatarUrl && (
                        <img src={actor.avatarUrl} alt={actor.name} className="w-8 h-8 rounded-full object-cover" />
                      )}
                      <span className="text-sm font-medium truncate">{actor.name}</span>
                      <Plus className="h-4 w-4 ml-auto text-muted-foreground" />
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <Button 
                variant="outline" 
                className="gap-2"
                data-testid="button-create-new-actor"
                onClick={() => { 
                  setEditingActor(null); 
                  actorForm.reset({ name: "", avatarUrl: "" }); 
                  setIsActorDialogOpen(true); 
                }}
              >
                <Plus className="h-4 w-4" /> Buat Aktor Baru
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Import dari MyAnimeList / MyDramaList</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <Select value={importSource} onValueChange={(v: "mal" | "mdl") => setImportSource(v)}>
                <SelectTrigger className="w-[200px]" data-testid="select-import-source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mal">MyAnimeList</SelectItem>
                  <SelectItem value="mdl">MyDramaList</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex-1 flex gap-2">
                <Input 
                  data-testid="input-import-search"
                  placeholder={importSource === "mal" ? "Cari anime..." : "Cari drama..."}
                  value={importSearchQuery}
                  onChange={(e) => setImportSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleExternalSearch()}
                />
                <Button 
                  data-testid="button-import-search"
                  onClick={handleExternalSearch} 
                  disabled={isSearching}
                >
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            {importSearchResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Hasil pencarian:</p>
                <div className="grid gap-2 max-h-[400px] overflow-y-auto">
                  {importSearchResults.map((result) => (
                    <Card 
                      key={`${result.source}-${result.id}`} 
                      className="hover-elevate cursor-pointer"
                      onClick={() => handleImportResult(result)}
                      data-testid={`card-import-result-${result.id}`}
                    >
                      <CardContent className="p-3 flex gap-3">
                        {result.posterUrl && (
                          <img 
                            src={result.posterUrl} 
                            alt={result.title}
                            className="w-16 h-24 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{result.title}</h4>
                          {result.titleEnglish && result.titleEnglish !== result.title && (
                            <p className="text-sm text-muted-foreground truncate">{result.titleEnglish}</p>
                          )}
                          <div className="flex gap-2 mt-1 flex-wrap">
                            {result.year && <Badge variant="secondary">{result.year}</Badge>}
                            {result.rating && <Badge variant="secondary">{result.rating}/10</Badge>}
                            {result.type && <Badge variant="outline">{result.type}</Badge>}
                            <Badge>{result.source === "mal" ? "MAL" : "MDL"}</Badge>
                          </div>
                          {result.synopsis && (
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{result.synopsis}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            {importSearchResults.length === 0 && !isSearching && importSearchQuery && (
              <p className="text-center text-muted-foreground py-8">
                Tidak ada hasil ditemukan. Coba kata kunci lain.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
