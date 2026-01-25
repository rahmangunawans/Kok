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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Pencil, Trash2, LayoutDashboard, Film, Tag, Users, Play, List } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
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

  // States for Modals
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [isEpisodeDialogOpen, setIsEpisodeDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingActor, setEditingActor] = useState<Actor | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);

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

  if (videosLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Mutations
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
      setIsEpisodeDialogOpen(false);
      setEditingEpisode(null);
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

  // Forms
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
      categoryId: undefined,
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
          <p className="text-muted-foreground">Kelola konten video, episode, kategori, dan analitik</p>
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
              <CardTitle className="text-sm font-medium">Video Unggulan</CardTitle>
              <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {videos?.filter(v => v.isFeatured).length || 0}
              </div>
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
          <TabsList className="grid w-full grid-cols-4 max-w-md">
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="actors">Actors</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="videos" className="space-y-4">
            <div className="flex justify-end pt-4">
              <Button onClick={() => { setEditingVideo(null); videoForm.reset({
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
              }); setIsVideoDialogOpen(true); }} className="gap-2">
                <Plus className="h-4 w-4" /> Tambah Video
              </Button>
            </div>
            {/* ... */}
          </TabsContent>
          <TabsContent value="categories" className="space-y-4">
            <div className="flex justify-end pt-4">
              <Button onClick={() => { setEditingCategory(null); categoryForm.reset(); setIsCategoryDialogOpen(true); }} className="gap-2">
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
                      <TableRow key={cat.id}>
                        <TableCell>{cat.name}</TableCell>
                        <TableCell>{cat.slug}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => { setEditingCategory(cat); categoryForm.reset(cat); setIsCategoryDialogOpen(true); }}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="actors">
             {/* Actors list */}
          </TabsContent>

          <TabsContent value="analytics">
             <Card>
               <CardHeader>
                 <CardTitle>Statistik Penonton</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                   Grafik analitik akan ditampilkan di sini (MVP)
                 </div>
               </CardContent>
             </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Video Dialog */}
      <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
        <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{editingVideo ? "Edit Video" : "Tambah Video"}</DialogTitle>
          </DialogHeader>
          <Form {...videoForm}>
            <form onSubmit={videoForm.handleSubmit((data) => videoMutation.mutate(data))} className="space-y-4">
              <FormField control={videoForm.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Judul</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              {/* Other fields... */}
              <Button type="submit" className="w-full" disabled={videoMutation.isPending}>Simpan</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Episode Dialog */}
      <Dialog open={isEpisodeDialogOpen} onOpenChange={setIsEpisodeDialogOpen}>
        <DialogContent className="max-w-4xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Kelola Episode - {videos?.find(v => v.id === selectedVideoId)?.title}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 pt-4">
            <Form {...episodeForm}>
              <form onSubmit={episodeForm.handleSubmit((data) => episodeMutation.mutate(data))} className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-lg">
                <FormField control={episodeForm.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Judul Episode</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={episodeForm.control} name="episodeNumber" render={({ field }) => (
                  <FormItem><FormLabel>No. Episode</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={episodeForm.control} name="sourceUrl" render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>Streaming Link (m3u8/mp4)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" className="md:col-span-2" disabled={episodeMutation.isPending}>
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
                  <TableRow key={ep.id}>
                    <TableCell>{ep.episodeNumber}</TableCell>
                    <TableCell>{ep.title}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => { 
                            setEditingEpisode(ep); 
                            episodeForm.reset({
                              ...ep,
                              duration: ep.duration ?? 0,
                              thumbnailUrl: ep.thumbnailUrl ?? "",
                            }); 
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
