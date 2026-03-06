"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

interface BlogResponse {
  success: boolean;
  data: BlogPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function BlogManagementPage() {
  const router = useRouter();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // 获取博客列表
  useEffect(() => {
    async function fetchBlogPosts() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          status: status,
        });

        if (search) {
          params.append("search", search);
        }

        if (category) {
          params.append("category", category);
        }

        const response = await fetch(`/api/blog?${params.toString()}`);
        const data: BlogResponse = await response.json();

        if (data.success) {
          setBlogPosts(data.data);
          setTotalPages(data.pagination.totalPages);
          setTotal(data.pagination.total);
        } else {
          setError("获取博客列表失败");
        }
      } catch (err) {
        setError("网络错误，请稍后重试");
        console.error("获取博客列表失败:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchBlogPosts();
  }, [page, limit, search, category, status, reloadKey]);

  // 删除博客
  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`/api/blog/${deleteId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("博客删除成功");
        // 重新获取博客列表
        setPage(1); // 重置到第一页
      } else {
        toast.error("删除失败: " + (data.error || "未知错误"));
      }
    } catch (err) {
      toast.error("删除失败，请重试");
      console.error("删除博客失败:", err);
    } finally {
      setDeleteId(null);
    }
  };

  // 状态样式
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-500/20 text-green-400">已发布</Badge>;
      case "draft":
        return <Badge className="bg-yellow-500/20 text-yellow-400">草稿</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400">{status}</Badge>;
    }
  };

  // 分页处理
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold text-white">博客管理</h1>
        <Button 
          onClick={() => router.push("/dashboard/blog/create")}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          创建博客
        </Button>
      </div>

      {/* 搜索和筛选 */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
              <Input
                placeholder="搜索标题..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-white/5 border-white/10"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-white/10">
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="published">已发布</SelectItem>
                <SelectItem value="draft">草稿</SelectItem>
              </SelectContent>
            </Select>
            <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue placeholder="每页显示" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-white/10">
                <SelectItem value="5">5条</SelectItem>
                <SelectItem value="10">10条</SelectItem>
                <SelectItem value="20">20条</SelectItem>
                <SelectItem value="50">50条</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 博客列表 */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">标题</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">分类</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">状态</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">阅读量</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">创建时间</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-white/60">
                      加载中...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-red-400">
                      {error}
                      <Button 
                        variant="ghost" 
                        className="mt-4 text-purple-400 hover:text-purple-300"
                        onClick={() => setReloadKey((value) => value + 1)}
                      >
                        重试
                      </Button>
                    </td>
                  </tr>
                ) : blogPosts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-white/60">
                      暂无博客文章
                    </td>
                  </tr>
                ) : (
                  blogPosts.map((post) => (
                    <tr key={post.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-6 py-4 text-white">
                        <div className="font-medium">{post.title}</div>
                        <div className="text-xs text-white/40 mt-1">{post.slug}</div>
                      </td>
                      <td className="px-6 py-4 text-white/80">{post.category}</td>
                      <td className="px-6 py-4">{getStatusBadge(post.status)}</td>
                      <td className="px-6 py-4 text-white/80">{post.viewCount}</td>
                      <td className="px-6 py-4 text-white/80">
                        {new Date(post.createdAt).toLocaleDateString("zh-CN")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-white/60 hover:text-white hover:bg-white/10"
                            onClick={() => router.push(`/blog/${post.slug}`)}
                            aria-label="预览"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-white/60 hover:text-white hover:bg-white/10"
                            onClick={() => router.push(`/dashboard/blog/edit/${post.id}`)}
                            aria-label="编辑"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Dialog open={deleteId === post.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                aria-label="删除"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-gray-800 border-white/10">
                              <DialogHeader>
                                <DialogTitle className="text-white">确认删除</DialogTitle>
                                <DialogDescription className="text-white/60">
                                  确定要删除这篇博客吗？此操作无法撤销。
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button 
                                  variant="ghost" 
                                  className="text-white/60 hover:text-white"
                                  onClick={() => setDeleteId(null)}
                                >
                                  取消
                                </Button>
                                <Button 
                                  className="bg-red-500 hover:bg-red-600"
                                  onClick={handleDelete}
                                >
                                  删除
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 分页 */}
      {!loading && !error && blogPosts.length > 0 && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-sm text-white/60">
            显示 {((page - 1) * limit) + 1} - {Math.min(page * limit, total)} 条，共 {total} 条
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              disabled={page === 1}
              onClick={() => handlePageChange(page - 1)}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? "default" : "ghost"}
                  className={
                    page === pageNum
                      ? "bg-purple-500 hover:bg-purple-600 text-white"
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  }
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            {totalPages > 5 && (
              <Button
                variant="ghost"
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              disabled={page === totalPages}
              onClick={() => handlePageChange(page + 1)}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
