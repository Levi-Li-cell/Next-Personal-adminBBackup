"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  User,
  Mail,
  Clock,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  role: string;
}

interface UserResponse {
  success: boolean;
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function UserManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  // 获取用户列表
  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });

        if (search) {
          params.append("search", search);
        }

        const response = await fetch(`/api/users?${params.toString()}`);
        const data: UserResponse & { error?: string } = await response.json();

        if (data.success) {
          setUsers(data.data);
          setTotalPages(data.pagination.totalPages);
          setTotal(data.pagination.total);
          return;
        }

        setError(data.error || "获取用户列表失败");
      } catch (err) {
        setError("网络错误，请稍后重试");
        console.error("获取用户列表失败:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [page, limit, search, reloadKey]);

  // 分页处理
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  // 角色样式
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-purple-500/20 text-purple-400">管理员</Badge>;
      case "user":
        return <Badge className="bg-blue-500/20 text-blue-400">普通用户</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400">{role}</Badge>;
    }
  };

  // 验证状态样式
  const getVerifiedBadge = (verified: boolean) => {
    return verified ? (
      <Badge className="bg-green-500/20 text-green-400">已验证</Badge>
    ) : (
      <Badge className="bg-yellow-500/20 text-yellow-400">未验证</Badge>
    );
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
        <h1 className="text-3xl font-bold text-white">用户管理</h1>
      </div>

      {/* 搜索和筛选 */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
              <Input
                placeholder="搜索用户..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-white/5 border-white/10"
              />
            </div>
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

      {/* 用户列表 */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">用户</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">邮箱</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">角色</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">状态</th>
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
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-white/60">
                      暂无用户
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                            {user.name?.[0]?.toUpperCase() || "U"}
                          </div>
                          <div>
                            <div className="font-medium text-white">{user.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white/80">{user.email}</td>
                      <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                      <td className="px-6 py-4">{getVerifiedBadge(user.emailVerified)}</td>
                      <td className="px-6 py-4 text-white/80">
                        {new Date(user.createdAt).toLocaleDateString("zh-CN")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-white/60 hover:text-white hover:bg-white/10"
                            aria-label="编辑"
                            onClick={() => router.push(`/dashboard/users/edit/${user.id}`)}
                          >
                            <User className="w-4 h-4" />
                          </Button>
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
      {!loading && !error && users.length > 0 && (
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
