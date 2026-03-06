"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Globe,
  Search,
  Edit,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Settings {
  site: {
    name: string;
    description: string;
    url: string;
    logo: string;
    favicon: string;
  };
  seo: {
    title: string;
    description: string;
    keywords: string;
    author: string;
  };
  features: {
    enableComments: boolean;
    enableAnalytics: boolean;
    enableSocialShare: boolean;
  };
}

interface SettingsAuditItem {
  id: string;
  actorEmail: string | null;
  actorName: string | null;
  createdAt: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [audits, setAudits] = useState<SettingsAuditItem[]>([]);
  const [settings, setSettings] = useState<Settings>({
    site: {
      name: "个人网站",
      description: "我的个人网站",
      url: "https://example.com",
      logo: "",
      favicon: "",
    },
    seo: {
      title: "个人网站 - 分享技术与生活",
      description: "这是我的个人网站，分享技术文章和生活感悟",
      keywords: "个人网站,技术博客,生活感悟",
      author: "管理员",
    },
    features: {
      enableComments: true,
      enableAnalytics: false,
      enableSocialShare: true,
    },
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch("/api/settings");
        const result = await response.json();

        if (result.success) {
          setSettings(result.data);
          setAudits(result.audits || []);
          return;
        }

        toast.error(result.error || "获取设置失败");
      } catch (error) {
        console.error("获取设置失败:", error);
        toast.error("获取设置失败");
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const [section, field] = name.split(".") as [keyof Settings, string];

    if (section === "site") {
      setSettings((prev) => ({
        ...prev,
        site: {
          ...prev.site,
          [field]: value,
        },
      }));
      return;
    }

    if (section === "seo") {
      setSettings((prev) => ({
        ...prev,
        seo: {
          ...prev.seo,
          [field]: value,
        },
      }));
    }
  };

  // 处理开关变化
  const handleSwitchChange = (name: string, checked: boolean) => {
    const [section, field] = name.split('.');
    if (section !== "features") {
      return;
    }

    setSettings((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [field]: checked,
      },
    }));
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });
      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || "保存失败");
        return;
      }

      toast.success("设置保存成功");
      const refreshed = await fetch("/api/settings");
      const refreshedResult = await refreshed.json();
      if (refreshedResult.success) {
        setAudits(refreshedResult.audits || []);
      }
    } catch (error) {
      toast.error("保存失败，请重试");
      console.error("保存设置失败:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-white/60">加载中...</span>
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
        <h1 className="text-3xl font-bold text-white">系统设置</h1>
      </div>

      <form onSubmit={handleSubmit}>
        {/* 网站基本信息 */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-medium text-white">
              <Globe className="w-5 h-5" />
              网站基本信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="site.name" className="text-white">网站名称</Label>
              <Input
                id="site.name"
                name="site.name"
                placeholder="输入网站名称"
                value={settings.site.name}
                onChange={handleInputChange}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site.description" className="text-white">网站描述</Label>
              <Textarea
                id="site.description"
                name="site.description"
                placeholder="输入网站描述"
                value={settings.site.description}
                onChange={handleInputChange}
                className="bg-white/5 border-white/10"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site.url" className="text-white">网站 URL</Label>
              <Input
                id="site.url"
                name="site.url"
                placeholder="输入网站 URL"
                value={settings.site.url}
                onChange={handleInputChange}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site.logo" className="text-white">Logo URL</Label>
              <Input
                id="site.logo"
                name="site.logo"
                placeholder="输入 Logo URL"
                value={settings.site.logo}
                onChange={handleInputChange}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site.favicon" className="text-white">Favicon URL</Label>
              <Input
                id="site.favicon"
                name="site.favicon"
                placeholder="输入 Favicon URL"
                value={settings.site.favicon}
                onChange={handleInputChange}
                className="bg-white/5 border-white/10"
              />
            </div>
          </CardContent>
        </Card>

        {/* SEO 设置 */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-medium text-white">
              <Search className="w-5 h-5" />
              SEO 设置
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="seo.title" className="text-white">SEO 标题</Label>
              <Input
                id="seo.title"
                name="seo.title"
                placeholder="输入 SEO 标题"
                value={settings.seo.title}
                onChange={handleInputChange}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seo.description" className="text-white">SEO 描述</Label>
              <Textarea
                id="seo.description"
                name="seo.description"
                placeholder="输入 SEO 描述"
                value={settings.seo.description}
                onChange={handleInputChange}
                className="bg-white/5 border-white/10"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seo.keywords" className="text-white">SEO 关键词</Label>
              <Input
                id="seo.keywords"
                name="seo.keywords"
                placeholder="输入 SEO 关键词，用逗号分隔"
                value={settings.seo.keywords}
                onChange={handleInputChange}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seo.author" className="text-white">作者</Label>
              <Input
                id="seo.author"
                name="seo.author"
                placeholder="输入作者名称"
                value={settings.seo.author}
                onChange={handleInputChange}
                className="bg-white/5 border-white/10"
              />
            </div>
          </CardContent>
        </Card>

        {/* 功能开关 */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-medium text-white">
              <Edit className="w-5 h-5" />
              功能开关
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="features.enableComments" className="text-white">启用评论</Label>
                <p className="text-white/60 text-sm mt-1">允许访客在博客文章下方评论</p>
              </div>
              <Switch
                id="features.enableComments"
                checked={settings.features.enableComments}
                onCheckedChange={(checked) => handleSwitchChange("features.enableComments", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="features.enableAnalytics" className="text-white">启用分析</Label>
                <p className="text-white/60 text-sm mt-1">启用网站访问分析</p>
              </div>
              <Switch
                id="features.enableAnalytics"
                checked={settings.features.enableAnalytics}
                onCheckedChange={(checked) => handleSwitchChange("features.enableAnalytics", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="features.enableSocialShare" className="text-white">启用社交分享</Label>
                <p className="text-white/60 text-sm mt-1">允许访客分享文章到社交媒体</p>
              </div>
              <Switch
                id="features.enableSocialShare"
                checked={settings.features.enableSocialShare}
                onCheckedChange={(checked) => handleSwitchChange("features.enableSocialShare", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* 保存按钮 */}
        <div className="flex gap-4 mt-8">
          <Button
            type="submit"
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            disabled={saving}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "保存中..." : "保存设置"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            取消
          </Button>
        </div>
      </form>

      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-lg">最近配置变更</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {audits.length === 0 ? (
            <div className="text-white/60 text-sm">暂无变更记录</div>
          ) : (
            <div className="space-y-2">
              {audits.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 p-3 rounded-lg bg-white/5"
                >
                  <div className="text-white/80 text-sm">
                    {item.actorName || "未知用户"}
                    {item.actorEmail ? ` (${item.actorEmail})` : ""}
                  </div>
                  <div className="text-white/50 text-xs">
                    {new Date(item.createdAt).toLocaleString("zh-CN")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 提示信息 */}
      <Card className="bg-yellow-500/20 border-yellow-500/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-400">提示</h3>
              <p className="text-yellow-400/80 text-sm mt-1">
                保存设置后，部分更改可能需要刷新页面才能生效。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
