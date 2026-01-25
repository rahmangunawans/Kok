import { useQuery, useMutation } from "@tanstack/react-query";
import { Video, Category, insertVideoSchema } from "@shared/schema";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Pencil, Trash2, LayoutDashboard, Film, Tag } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);

  const { data: videos, isLoading: videosLoading } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/videos", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({ title: "Berhasil", description: "Video telah ditambahkan" });
      setIsDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/videos/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({ title: "Berhasil", description: "Video telah diperbarui" });
      setIsDialogOpen(false);
      setEditingVideo(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/videos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({ title: "Berhasil", description: "Video telah dihapus" });
    },
  });

  const form = useForm({
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

  const onSubmit = (data: any) => {
    if (editingVideo) {
      updateMutation.mutate({ id: editingVideo.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (video: Video) => {
    setEditingVideo(video);
    form.reset({
      title: video.title,
      description: video.description || "",
      posterUrl: video.posterUrl,
      bannerUrl: video.bannerUrl || "",
      rating: video.rating || 0,
      year: video.year || new Date().getFullYear(),
      country: video.country || "",
      categoryId: video.categoryId as any,
      isFeatured: video.isFeatured || false,
      isVip: video.isVip || false,
    });
    setIsDialogOpen(true);
  };

  if (authLoading || videosLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !user.isAdmin) {
    return <Redirect to="/" />;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
            <p className="text-muted-foreground">Kelola konten video dan kategori Anda</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingVideo(null);
              form.reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-video" className="gap-2">
                <Plus className="h-4 w-4" /> Tambah Video
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingVideo ? "Edit Video" : "Tambah Video Baru"}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Judul</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kategori</FormLabel>
                          <Select 
                            onValueChange={(val) => field.onChange(Number(val))} 
                            value={field.value !== undefined ? String(field.value) : ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih kategori" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories?.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id.toString()}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deskripsi</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} data-testid="input-description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="posterUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Poster URL</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-poster-url" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bannerUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Banner URL</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-banner-url" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="rating"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rating</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.1" 
                              {...field} 
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              data-testid="input-rating" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tahun</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-year" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Negara</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-country" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex gap-4">
                    <FormField
                      control={form.control}
                      name="isFeatured"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl>
                            <input 
                              type="checkbox" 
                              checked={field.value} 
                              onChange={field.onChange}
                              className="h-4 w-4"
                            />
                          </FormControl>
                          <FormLabel className="cursor-pointer">Unggulan</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isVip"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl>
                            <input 
                              type="checkbox" 
                              checked={field.value} 
                              onChange={field.onChange}
                              className="h-4 w-4"
                            />
                          </FormControl>
                          <FormLabel className="cursor-pointer">VIP</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-video"
                  >
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingVideo ? "Simpan Perubahan" : "Tambah Video"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Video</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Tahun</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {videos?.map((video) => (
                  <TableRow key={video.id} className="hover-elevate">
                    <TableCell className="font-medium">{video.title}</TableCell>
                    <TableCell>
                      {categories?.find(c => c.id === video.categoryId)?.name || "N/A"}
                    </TableCell>
                    <TableCell>{video.year}</TableCell>
                    <TableCell>{video.rating}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => openEditDialog(video)}
                          data-testid={`button-edit-${video.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-destructive"
                          onClick={() => {
                            if (confirm("Apakah Anda yakin ingin menghapus video ini?")) {
                              deleteMutation.mutate(video.id);
                            }
                          }}
                          data-testid={`button-delete-${video.id}`}
                        >
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
      </div>
    </div>
  );
}
