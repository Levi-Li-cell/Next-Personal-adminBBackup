"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Upload,
  X,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Editor } from "@tinymce/tinymce-react";

interface ProjectFormData {
  title: string;
  description: string;
  content: string;
  techStack: string[];
  demoUrl: string | null;
  githubUrl: string | null;
  coverImage: string | null;
  imageLinks: string[];
  status: string;
}

interface ProjectDetailResponse {
  success: boolean;
  data: ProjectFormData;
}

export default function EditProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>({
    title: "",
    description: "",
    content: "",
    techStack: [],
    demoUrl: null,
    githubUrl: null,
    coverImage: null,
    imageLinks: [],
    status: "draft",
  });
  const [techInput, setTechInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  // 获取项目详情
  useEffect(() => {
    async function fetchProjectDetail() {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/projects/${id}`);
        const data: ProjectDetailResponse = await response.json();

        if (data.success) {
          setFormData(data.data);
        } else {
          setError("获取项目详情失败");
        }
      } catch (err) {
        setError("网络错误，请稍后重试");
        console.error("获取项目详情失败:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProjectDetail();
  }, [id]);

  // 处理表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 处理选择变化
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 处理技术栈添加
  const handleAddTech = () => {
    if (techInput.trim() && !formData.techStack.includes(techInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        techStack: [...prev.techStack, techInput.trim()],
      }));
      setTechInput("");
    }
  };

  // 处理技术栈删除
  const handleRemoveTech = (tech: string) => {
    setFormData((prev) => ({
      ...prev,
      techStack: prev.techStack.filter((t) => t !== tech),
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
    if (!id) return;

    setSaving(true);

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("项目更新成功");
        router.push("/dashboard/projects");
      } else {
        toast.error("更新失败: " + (data.error || "未知错误"));
      }
    } catch (error) {
      toast.error("更新失败，请重试");
      console.error("更新项目失败:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
        <span className="ml-3 text-white/60">加载中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-6 text-center">
        <p className="text-red-400">{error}</p>
        <Button 
          variant="ghost" 
          className="mt-4 text-purple-400 hover:text-purple-300"
          onClick={() => router.back()}
        >
          返回
        </Button>
      </div>
    );
  }

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
        <h1 className="text-3xl font-bold text-white">编辑项目</h1>
      </div>

      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 基本信息 */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-white">标题</Label>
              <Input
                id="title"
                name="title"
                placeholder="输入项目标题"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="bg-white/5 border-white/10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-white">描述</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="输入项目描述"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                required
                className="bg-white/5 border-white/10"
              />
            </div>

            {/* 技术栈 */}
            <div className="space-y-2">
              <Label className="text-white">技术栈</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="输入技术栈并按Enter添加"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddTech()}
                  className="flex-1 bg-white/5 border-white/10"
                />
                <Button onClick={handleAddTech} className="bg-purple-500 hover:bg-purple-600">
                  <Plus className="w-4 h-4 mr-2" />
                  添加
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.techStack.map((tech) => (
                  <div key={tech} className="flex items-center gap-1 bg-white/5 px-3 py-1 rounded-full">
                    <span className="text-white/80 text-sm">{tech}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-white/40 hover:text-red-400 hover:bg-red-500/10"
                      onClick={() => handleRemoveTech(tech)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* 链接 */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="demoUrl" className="text-white">演示链接</Label>
                <Input
                  id="demoUrl"
                  name="demoUrl"
                  placeholder="输入项目演示链接"
                  value={formData.demoUrl || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, demoUrl: e.target.value || null }))}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="githubUrl" className="text-white">GitHub 链接</Label>
                <Input
                  id="githubUrl"
                  name="githubUrl"
                  placeholder="输入 GitHub 仓库链接"
                  value={formData.githubUrl || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, githubUrl: e.target.value || null }))}
                  className="bg-white/5 border-white/10"
                />
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
              <Label htmlFor="content" className="text-white">详细内容</Label>
              <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                <Editor
                  license_key="gpl"
                  id="content"
                  name="content"
                  initialValue={formData.content}
                  onEditorChange={(content) => setFormData((prev) => ({ ...prev, content }))}
                  init={{
                    height: 400,
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

            {/* 状态 */}
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

            {/* 提交按钮 */}
            <div className="flex gap-4">
              <Button
                type="submit"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                disabled={saving}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "保存中..." : "保存"}
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
