"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Upload,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Editor } from "@tinymce/tinymce-react";

interface BlogFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  status: string;
  coverImage: string | null;
  imageLinks: string[];
  authorId: string;
}

export default function CreateBlogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<BlogFormData>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "技术",
    tags: [],
    status: "draft",
    coverImage: null,
    imageLinks: [],
    authorId: "sZeM49ADgrey0t5HI5JyjphYJClcg4H", // 使用默认管理员ID
  });
  const [tagInput, setTagInput] = useState("");

  // 处理表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 处理选择变化
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 处理标签添加
  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  // 处理标签删除
  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  // 处理图片上传
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setFormData((prev) => ({ ...prev, coverImage: data.url }));
        // 将图片链接添加到imageLinks数组
        setFormData((prev) => ({ ...prev, imageLinks: [...prev.imageLinks, data.url] }));
        toast.success("图片上传成功");
      } else {
        toast.error("图片上传失败: " + (data.error || "未知错误"));
      }
    } catch (error) {
      toast.error("图片上传失败，请重试");
      console.error("图片上传失败:", error);
    }
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/blog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("博客创建成功");
        router.push("/dashboard/blog");
      } else {
        toast.error("创建失败: " + (data.error || "未知错误"));
      }
    } catch (error) {
      toast.error("创建失败，请重试");
      console.error("创建博客失败:", error);
    } finally {
      setLoading(false);
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
        <h1 className="text-3xl font-bold text-white">创建博客</h1>
      </div>

      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 基本信息 */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-white">标题</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="输入博客标题"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug" className="text-white">Slug</Label>
                <Input
                  id="slug"
                  name="slug"
                  placeholder="输入URL友好的slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  required
                  className="bg-white/5 border-white/10"
                />
              </div>
            </div>

            {/* 摘要 */}
            <div className="space-y-2">
              <Label htmlFor="excerpt" className="text-white">摘要</Label>
              <Textarea
                id="excerpt"
                name="excerpt"
                placeholder="输入博客摘要"
                value={formData.excerpt}
                onChange={handleInputChange}
                rows={3}
                required
                className="bg-white/5 border-white/10"
              />
            </div>

            {/* 分类和状态 */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-white">分类</Label>
                <Select value={formData.category} onValueChange={(value) => handleSelectChange("category", value)}>
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-white/10">
                    <SelectItem value="技术">技术</SelectItem>
                    <SelectItem value="生活">生活</SelectItem>
                    <SelectItem value="旅行">旅行</SelectItem>
                    <SelectItem value="美食">美食</SelectItem>
                    <SelectItem value="其他">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" className="text-white">状态</Label>
                <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-white/10">
                    <SelectItem value="draft">草稿</SelectItem>
                    <SelectItem value="published">已发布</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 标签 */}
            <div className="space-y-2">
              <Label className="text-white">标签</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="输入标签并按Enter添加"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                  className="flex-1 bg-white/5 border-white/10"
                />
                <Button onClick={handleAddTag} className="bg-purple-500 hover:bg-purple-600">
                  <Plus className="w-4 h-4 mr-2" />
                  添加
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <div key={tag} className="flex items-center gap-1 bg-white/5 px-3 py-1 rounded-full">
                    <span className="text-white/80 text-sm">{tag}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-white/40 hover:text-red-400 hover:bg-red-500/10"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* 封面图片 */}
            <div className="space-y-2">
              <Label htmlFor="coverImage" className="text-white">封面图片</Label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    id="coverImage"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                {formData.coverImage && (
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-white/10">
                    <img 
                      src={formData.coverImage} 
                      alt="封面图片" 
                      className="w-full h-full object-cover"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 bg-black/50 text-white hover:bg-red-500/80"
                      onClick={() => setFormData((prev) => ({ ...prev, coverImage: null }))}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* 内容 */}
            <div className="space-y-2">
              <Label htmlFor="content" className="text-white">内容</Label>
              <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                <Editor
                  license_key="gpl"
                  id="content"
                  name="content"
                  initialValue={formData.content}
                  onEditorChange={(content) => setFormData((prev) => ({ ...prev, content }))}
                  init={{
                    height: 500,
                    menubar: false,
                    plugins: [
                      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor',
                      'searchreplace', 'visualblocks', 'code', 'fullscreen',
                      'insertdatetime', 'media', 'table', 'paste', 'help', 'wordcount'
                    ],
                    toolbar: 'undo redo | formatselect | ' +
                    'bold italic backcolor | alignleft aligncenter ' +
                    'alignright alignjustify | bullist numlist outdent indent | ' +
                    'removeformat | help',
                    skin: 'oxide-dark',
                    content_css: 'dark',
                    promotion: false
                  }}
                />
              </div>
            </div>

            {/* 提交按钮 */}
            <div className="flex gap-4">
              <Button
                type="submit"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                disabled={loading}
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? "保存中..." : "保存"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                取消
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
