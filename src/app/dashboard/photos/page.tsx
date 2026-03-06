"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  Trash2,
  Plus,
  Folder,
  Search,
  CheckSquare,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Photo {
  id: string;
  filename: string;
  url: string;
  size: number;
  category: string;
  uploadedAt: string;
}

interface Category {
  id: string;
  name: string;
  count: number;
}

interface PhotoRecord {
  id: string;
  title: string | null;
  url: string;
  album: string | null;
  createdAt: string;
}

export default function PhotosPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isCreateCategoryDialogOpen, setIsCreateCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [uploadCategory, setUploadCategory] = useState("默认相册");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);

  const refreshPhotos = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (search) {
        params.set("search", search);
      }
      if (selectedCategory !== "all") {
        params.set("category", selectedCategory);
      }

      const response = await fetch(`/api/photos?${params.toString()}`);
      const result: { success: boolean; data: PhotoRecord[]; error?: string } = await response.json();

      if (!result.success) {
        toast.error(result.error || "获取照片失败");
        return;
      }

      const mapped = result.data.map((item) => ({
        id: item.id,
        filename: item.title || "未命名图片",
        url: item.url,
        size: 0,
        category: item.album || "默认相册",
        uploadedAt: item.createdAt,
      }));

      const categoryMap = new Map<string, number>();
      mapped.forEach((item) => {
        categoryMap.set(item.category, (categoryMap.get(item.category) || 0) + 1);
      });

      const generatedCategories: Category[] = Array.from(categoryMap.entries()).map(([name, count], index) => ({
        id: String(index + 1),
        name,
        count,
      }));

      if (generatedCategories.length === 0) {
        generatedCategories.push({ id: "1", name: "默认相册", count: 0 });
      }

      setPhotos(mapped);
      setSelectedPhotoIds((prev) => prev.filter((id) => mapped.some((item) => item.id === id)));
      setCategories(generatedCategories);

      if (!generatedCategories.find((item) => item.name === uploadCategory)) {
        setUploadCategory(generatedCategories[0].name);
      }
    } catch (error) {
      console.error("获取照片失败:", error);
      toast.error("获取照片失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshPhotos();
  }, [search, selectedCategory, reloadKey]);

  // 过滤照片
  const filteredPhotos = photos.filter((photo) => {
    const matchesSearch = photo.filename.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory !== "all" ? photo.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // 处理文件上传
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles([...uploadedFiles, ...Array.from(e.target.files)]);
    }
  };

  // 上传照片
  const handleUpload = async () => {
    if (uploadedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress({ current: 0, total: uploadedFiles.length });

    try {
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        setUploadProgress({ current: i + 1, total: uploadedFiles.length });
        const formData = new FormData();
        formData.append("file", file);

        const uploadResp = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
          method: "POST",
          body: formData,
        });
        const uploadResult: { success: boolean; url?: string; error?: string } = await uploadResp.json();

        if (!uploadResult.success || !uploadResult.url) {
          throw new Error(uploadResult.error || "上传失败");
        }

        const createResp = await fetch("/api/photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            url: uploadResult.url,
            category: uploadCategory,
          }),
        });
        const createResult = await createResp.json();

        if (!createResult.success) {
          throw new Error(createResult.error || "保存照片记录失败");
        }
      }

      toast.success(`成功上传 ${uploadedFiles.length} 张照片`);
      setUploadedFiles([]);
      setIsUploadDialogOpen(false);
      setReloadKey((value) => value + 1);
    } catch (error) {
      toast.error("上传失败，请重试");
      console.error("上传照片失败:", error);
    } finally {
      setUploading(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  // 创建分类
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const newCategory: Category = {
        id: `category-${Date.now()}`,
        name: newCategoryName.trim(),
        count: 0,
      };

      if (!categories.find((item) => item.name === newCategory.name)) {
        setCategories([...categories, newCategory]);
      }
      setUploadCategory(newCategory.name);
      setNewCategoryName("");
      setIsCreateCategoryDialogOpen(false);
      toast.success("分类创建成功");
    } catch (error) {
      toast.error("创建分类失败，请重试");
      console.error("创建分类失败:", error);
    }
  };

  // 删除照片
  const handleDeletePhoto = async (id: string) => {
    try {
      const response = await fetch(`/api/photos/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || "删除失败");
        return;
      }

      setPhotos((prev) => prev.filter((photo) => photo.id !== id));
      setSelectedPhotoIds((prev) => prev.filter((photoId) => photoId !== id));
      toast.success("照片删除成功");
      setReloadKey((value) => value + 1);
    } catch (error) {
      toast.error("删除照片失败，请重试");
      console.error("删除照片失败:", error);
    }
  };

  const toggleSelectPhoto = (id: string) => {
    setSelectedPhotoIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedPhotoIds.length === filteredPhotos.length) {
      setSelectedPhotoIds([]);
      return;
    }

    setSelectedPhotoIds(filteredPhotos.map((item) => item.id));
  };

  const handleBatchDelete = async () => {
    if (selectedPhotoIds.length === 0) {
      return;
    }

    try {
      await Promise.all(
        selectedPhotoIds.map((id) =>
          fetch(`/api/photos/${id}`, {
            method: "DELETE",
          })
        )
      );

      toast.success(`成功删除 ${selectedPhotoIds.length} 张照片`);
      setSelectedPhotoIds([]);
      setReloadKey((value) => value + 1);
    } catch (error) {
      console.error("批量删除失败:", error);
      toast.error("批量删除失败，请重试");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>
        <h1 className="text-3xl font-bold text-white">照片管理</h1>
      </div>

      {/* 搜索和筛选 */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
              <Input
                placeholder="搜索照片..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-white/5 border-white/10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-white/10">
                <SelectItem value="all">全部分类</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name} ({category.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={toggleSelectAll}
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                {selectedPhotoIds.length === filteredPhotos.length && filteredPhotos.length > 0 ? (
                  <CheckSquare className="w-4 h-4 mr-2" />
                ) : (
                  <Square className="w-4 h-4 mr-2" />
                )}
                全选
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleBatchDelete}
                disabled={selectedPhotoIds.length === 0}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                批量删除
              </Button>
              <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                    <Upload className="w-4 h-4 mr-2" />
                    上传照片
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-white/10 text-white">
                  <DialogHeader>
                    <DialogTitle>上传照片</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="files" className="text-white">选择文件</Label>
                      <Input
                        id="files"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileChange}
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-white">选择分类</Label>
                      <Select value={uploadCategory} onValueChange={setUploadCategory}>
                        <SelectTrigger className="bg-white/5 border-white/10">
                          <SelectValue placeholder="选择分类" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-white/10">
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.name}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-white">已选择文件 ({uploadedFiles.length})</Label>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {uploadedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded">
                              <span className="text-white/80 text-sm">{file.name}</span>
                              <Badge className="bg-white/10 text-white/80">
                                {formatFileSize(file.size)}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {uploading && uploadProgress.total > 0 && (
                      <div className="text-sm text-white/70">
                        正在上传第 {uploadProgress.current} / {uploadProgress.total} 个文件...
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={handleUpload}
                        disabled={uploading || uploadedFiles.length === 0}
                        className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      >
                        {uploading ? "上传中..." : "上传"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsUploadDialogOpen(false)}
                        className="text-white/60 hover:text-white hover:bg-white/10"
                      >
                        取消
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={isCreateCategoryDialogOpen} onOpenChange={setIsCreateCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="ghost" className="text-white/60 hover:text-white hover:bg-white/10">
                    <Plus className="w-4 h-4 mr-2" />
                    新建分类
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-white/10 text-white">
                  <DialogHeader>
                    <DialogTitle>新建分类</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="category-name" className="text-white">分类名称</Label>
                      <Input
                        id="category-name"
                        placeholder="输入分类名称"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={handleCreateCategory}
                        disabled={!newCategoryName.trim()}
                        className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      >
                        创建
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsCreateCategoryDialogOpen(false)}
                        className="text-white/60 hover:text-white hover:bg-white/10"
                      >
                        取消
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 分类列表 */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium text-white mb-4">分类</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category.id}
                className={`cursor-pointer px-4 py-2 ${selectedCategory === category.name ? "bg-purple-500/20 text-purple-400" : "bg-white/10 text-white/80 hover:bg-white/20"}`}
                onClick={() => setSelectedCategory(category.name)}
              >
                <Folder className="w-4 h-4 mr-2 inline" />
                {category.name} ({category.count})
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 照片列表 */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium text-white mb-4">照片</h3>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <span className="text-white/60">加载中...</span>
            </div>
          ) : filteredPhotos.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <span className="text-white/60">暂无照片</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredPhotos.map((photo) => (
                <div key={photo.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => toggleSelectPhoto(photo.id)}
                    className="absolute z-10 top-2 left-2 h-7 w-7 rounded bg-black/50 flex items-center justify-center"
                    aria-label="选择照片"
                  >
                    {selectedPhotoIds.includes(photo.id) ? (
                      <CheckSquare className="w-4 h-4 text-white" />
                    ) : (
                      <Square className="w-4 h-4 text-white/80" />
                    )}
                  </button>
                  <div className="aspect-square overflow-hidden rounded-lg bg-white/5">
                    <img
                      src={photo.url}
                      alt={photo.filename}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                    <div className="space-y-2">
                      <div className="text-white text-sm truncate">{photo.filename}</div>
                      <div className="flex justify-between items-center">
                        <Badge className="bg-white/20 text-white/80 text-xs">
                          {photo.category}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletePhoto(photo.id)}
                          className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
