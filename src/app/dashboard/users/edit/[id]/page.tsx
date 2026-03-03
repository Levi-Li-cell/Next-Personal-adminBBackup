"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  User,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface UserFormData {
  id: string;
  name: string;
  email: string;
  role: string;
  enabled: boolean;
}

interface UserDetailResponse {
  success: boolean;
  data: UserFormData;
}

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({
    id: "",
    name: "",
    email: "",
    role: "user",
    enabled: true,
  });
  const [error, setError] = useState<string | null>(null);

  // 获取用户详情
  useEffect(() => {
    async function fetchUserDetail() {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        // 这里需要实现用户详情API路由
        // 暂时使用模拟数据
        // const response = await fetch(`/api/users/${id}`);
        // const data: UserDetailResponse = await response.json();

        // 模拟数据
        const mockData: UserDetailResponse = {
          success: true,
          data: {
            id: id,
            name: id === "1" ? "管理员" : "测试用户",
            email: id === "1" ? "admin@example.com" : "test@example.com",
            role: id === "1" ? "admin" : "user",
            enabled: true,
          },
        };

        setFormData(mockData.data);
      } catch (err) {
        setError("网络错误，请稍后重试");
        console.error("获取用户详情失败:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchUserDetail();
  }, [id]);

  // 处理表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 处理选择变化
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 处理开关变化
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSaving(true);

    try {
      // 这里需要实现用户更新API路由
      // const response = await fetch(`/api/users/${id}`, {
      //   method: "PUT",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify(formData),
      // });
      // const data = await response.json();

      // 模拟成功响应
      const data: { success: boolean; error?: string } = { success: true };

      if (data.success) {
        toast.success("用户更新成功");
        router.push("/dashboard/users");
      } else {
        toast.error("更新失败: " + (data.error || "未知错误"));
      }
    } catch (error) {
      toast.error("更新失败，请重试");
      console.error("更新用户失败:", error);
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
        <h1 className="text-3xl font-bold text-white">编辑用户</h1>
      </div>

      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 基本信息 */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">姓名</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="输入用户姓名"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">邮箱</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="输入用户邮箱"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="bg-white/5 border-white/10"
                />
              </div>
            </div>

            {/* 角色管理 */}
            <div className="space-y-2">
              <Label htmlFor="role" className="text-white">角色</Label>
              <Select value={formData.role} onValueChange={(value) => handleSelectChange("role", value)}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="选择角色" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-white/10">
                  <SelectItem value="admin">管理员</SelectItem>
                  <SelectItem value="user">普通用户</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 账户状态 */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enabled" className="text-white">账户状态</Label>
                <p className="text-white/60 text-sm mt-1">
                  {formData.enabled ? "账户已启用" : "账户已禁用"}
                </p>
              </div>
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => handleSwitchChange("enabled", checked)}
              />
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
