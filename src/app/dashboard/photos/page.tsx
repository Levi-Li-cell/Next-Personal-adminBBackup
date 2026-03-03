"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  Trash2,
  Plus,
  Folder,
  Image as ImageIcon,
  Search,
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

export default function PhotosPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isCreateCategoryDialogOpen, setIsCreateCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  // 模拟数据
  useEffect(() => {
    setTimeout(() => {
      const mockCategories: Category[] = [
        { id: "1", name: "个人照片", count: 5 },
        { id: "2", name: "项目截图", count: 3 },
        { id: "3", name: "其他", count: 2 },
      ];

      const mockPhotos: Photo[] = [
        {
          id: "1",
          filename: "photo1.jpg",
          url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80",
          size: 1024000,
          category: "个人照片",
          uploadedAt: "2026-03-01T00:00:00Z",
        },
        {
          id: "2",
          filename: "photo2.jpg",
          url: "https://images.unsplash.com/photo-1517849845537-4d257902454a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80",
          size: 2048000,
          category: "项目截图",
          uploadedAt: "2026-03-02T00:00:00Z",
        },
        {
          id: "3",
          filename: "photo3.jpg",
          url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80",
          size: 1536000,
          category: "个人照片",
          uploadedAt: "2026-03-03T00:00:00Z",
        },
      ];

      setCategories(mockCategories);
      setPhotos(mockPhotos);
      setLoading(false);
    }, 500);
  }, []);

  // 过滤照片
  const filteredPhotos = photos.filter((photo) => {
    const matchesSearch = photo.filename.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory ? photo.category === selectedCategory : true;
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

    try {
      // 这里需要实现照片上传API
      // 暂时模拟上传成功
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success(`成功上传 ${uploadedFiles.length} 张照片`);
      setUploadedFiles([]);
      setIsUploadDialogOpen(false);

      // 刷新照片列表
      // 这里应该调用API获取最新照片列表
    } catch (error) {
      toast.error("上传失败，请重试");
      console.error("上传照片失败:", error);
    } finally {
      setUploading(false);
    }
  };

  // 创建分类
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      // 这里需要实现创建分类API
      // 暂时模拟创建成功
      const newCategory: Category = {
        id: (categories.length + 1).toString(),
        name: newCategoryName.trim(),
        count: 0,
      };

      setCategories([...categories, newCategory]);
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
      // 这里需要实现删除照片API
      // 暂时模拟删除成功
      setPhotos((prev) => prev.filter((photo) => photo.id !== id));
      toast.success("照片删除成功");
    } catch (error) {
      toast.error("删除照片失败，请重试");
      console.error("删除照片失败:", error);
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
                <SelectItem value="">全部分类</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name} ({category.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
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
                      <Select defaultValue={categories[0]?.name || ""}>
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
                  <Button variant="ghost" className="text-white/60 hover:text-white hover:bg-white/10">
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
