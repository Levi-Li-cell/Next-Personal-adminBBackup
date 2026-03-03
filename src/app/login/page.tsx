"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// 包装组件以避免Suspense错误
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);

  // 检查URL中是否有sso token参数
  useEffect(() => {
    const ssoToken = searchParams.get('sso');
    const error = searchParams.get('error');

    if (error) {
      const errorMessages: Record<string, string> = {
        missing_token: "缺少登录凭证",
        invalid_token: "登录凭证无效或已过期",
        user_not_found: "用户不存在",
        not_admin: "您不是管理员，无法访问后台",
        session_failed: "创建会话失败",
        sso_failed: "单点登录失败",
      };
      toast.error(errorMessages[error] || "登录失败");
    }

    if (ssoToken) {
      handleSsoLogin(ssoToken);
    }
  }, [searchParams]);

  const handleSsoLogin = async (token: string) => {
    setSsoLoading(true);
    try {
      const response = await fetch(`/api/auth/sso?token=${token}`);
      const data = await response.json();

      if (data.success) {
        toast.success("登录成功");
        router.push(data.redirect || "/dashboard");
      } else {
        toast.error(data.error || "单点登录失败");
        router.push("/login");
      }
    } catch (error) {
      console.error("SSO登录失败:", error);
      toast.error("单点登录失败");
      router.push("/login");
    } finally {
      setSsoLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        toast.error("登录失败: " + result.error.message);
      } else {
        toast.success("登录成功");
        router.push("/dashboard");
      }
    } catch (error) {
      toast.error("登录失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  // SSO 登录中显示加载状态
  if (ssoLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-white/60">正在验证登录信息...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="w-full max-w-md p-8 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            管理后台
          </h1>
          <p className="text-white/60 mt-2">登录以管理您的网站</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white/5 border-white/10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-white/5 border-white/10"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            disabled={loading}
          >
            {loading ? "登录中..." : "登录"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <a
            href="http://localhost:3000"
            className="text-sm text-purple-400 hover:text-purple-300"
          >
            返回前台网站
          </a>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <Loader2 className="w-12 h-12 animate-spin text-purple-400" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
