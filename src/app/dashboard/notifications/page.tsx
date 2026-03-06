"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Notification {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  eventType: string;
  timestamp: number;
  read: boolean;
}

interface NotificationResponse {
  success: boolean;
  data: Notification[];
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const [eventType, setEventType] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [creating, setCreating] = useState(false);
  const [newNotificationName, setNewNotificationName] = useState("测试用户");
  const [newNotificationEmail, setNewNotificationEmail] = useState("test@example.com");

  useEffect(() => {
    async function fetchNotifications() {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          unreadOnly: String(showOnlyUnread),
          eventType,
          page: String(page),
          limit: "20",
        });

        const response = await fetch(`/api/notifications?${params.toString()}`);
        const result: NotificationResponse = await response.json();

        if (result.success) {
          setNotifications(result.data);
          setSelectedIds([]);
          setTotalPages(result.pagination?.totalPages || 1);
          return;
        }

        toast.error(result.error || "获取通知失败");
      } catch (error) {
        console.error("获取通知失败:", error);
        toast.error("获取通知失败");
      } finally {
        setLoading(false);
      }
    }

    fetchNotifications();
  }, [showOnlyUnread, eventType, page, reloadKey]);

  // 标记为已读
  const markAsRead = async (id: string) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const result = await response.json();

      if (result.success) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === id ? { ...notification, read: true } : notification
          )
        );
        return;
      }

      toast.error(result.error || "标记失败");
    } catch (error) {
      console.error("标记通知失败:", error);
      toast.error("标记失败，请重试");
    }
  };

  // 标记全部已读
  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      const result = await response.json();

      if (result.success) {
        setNotifications((prev) =>
          prev.map((notification) => ({ ...notification, read: true }))
        );
        toast.success("已全部标记为已读");
        return;
      }

      toast.error(result.error || "操作失败");
    } catch (error) {
      console.error("标记全部已读失败:", error);
      toast.error("操作失败，请重试");
    }
  };

  // 删除通知
  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications?id=${id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (result.success) {
        setNotifications((prev) => prev.filter((notification) => notification.id !== id));
        return;
      }

      toast.error(result.error || "删除失败");
    } catch (error) {
      console.error("删除通知失败:", error);
      toast.error("删除失败，请重试");
    }
  };

  const createTestNotification = async () => {
    if (!newNotificationName.trim() || !newNotificationEmail.trim()) {
      toast.error("请输入用户名和邮箱");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: newNotificationName.trim(),
          userEmail: newNotificationEmail.trim(),
          eventType: "user_signup",
        }),
      });
      const result = await response.json();

      if (result.success) {
        toast.success("测试通知创建成功");
        setReloadKey((value) => value + 1);
        return;
      }

      toast.error(result.error || "创建通知失败");
    } catch (error) {
      console.error("创建测试通知失败:", error);
      toast.error("创建通知失败，请重试");
    } finally {
      setCreating(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredNotifications.length && filteredNotifications.length > 0) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(filteredNotifications.map((item) => item.id));
  };

  const batchMarkRead = async () => {
    if (selectedIds.length === 0) {
      toast.error("请先选择通知");
      return;
    }

    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const result = await response.json();
      if (!result.success) {
        toast.error(result.error || "批量标记失败");
        return;
      }

      toast.success("批量标记已读成功");
      setReloadKey((value) => value + 1);
    } catch (error) {
      console.error("批量标记失败:", error);
      toast.error("批量标记失败，请重试");
    }
  };

  const batchDelete = async () => {
    if (selectedIds.length === 0) {
      toast.error("请先选择通知");
      return;
    }

    try {
      const response = await fetch(`/api/notifications?ids=${selectedIds.join(",")}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!result.success) {
        toast.error(result.error || "批量删除失败");
        return;
      }

      toast.success("批量删除成功");
      setReloadKey((value) => value + 1);
    } catch (error) {
      console.error("批量删除失败:", error);
      toast.error("批量删除失败，请重试");
    }
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 1000 / 60);
    const hours = Math.floor(diff / 1000 / 60 / 60);
    const days = Math.floor(diff / 1000 / 60 / 60 / 24);

    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString("zh-CN");
  };

  // 过滤通知
  const filteredNotifications = showOnlyUnread
    ? notifications.filter((notification) => !notification.read)
    : notifications;

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
        <h1 className="text-3xl font-bold text-white">通知历史</h1>
        <Button
          variant="ghost"
          onClick={() => setReloadKey((value) => value + 1)}
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          刷新
        </Button>
      </div>

      {/* 筛选和操作 */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="show-unread"
                checked={showOnlyUnread}
                onCheckedChange={setShowOnlyUnread}
              />
              <Label htmlFor="show-unread" className="text-white">
                仅显示未读
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-white">类型</Label>
              <select
                value={eventType}
                onChange={(e) => {
                  setEventType(e.target.value);
                  setPage(1);
                }}
                className="bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white"
              >
                <option value="all">全部</option>
                <option value="user_signup">用户注册</option>
                <option value="system">系统</option>
                <option value="custom">自定义</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={toggleSelectAll} className="text-white/70 hover:text-white hover:bg-white/10">
                {selectedIds.length === notifications.length && notifications.length > 0 ? "取消全选" : "全选"}
              </Button>
              <Button variant="ghost" onClick={batchMarkRead} className="text-green-400 hover:text-green-300 hover:bg-white/10">
                批量已读
              </Button>
              <Button variant="ghost" onClick={batchDelete} className="text-red-400 hover:text-red-300 hover:bg-white/10">
                批量删除
              </Button>
            </div>
            <Button
              variant="ghost"
              onClick={markAllAsRead}
              className="text-purple-400 hover:text-purple-300 hover:bg-white/10"
            >
              <Check className="w-4 h-4 mr-2" />
              全部标记为已读
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-lg">创建测试通知</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="grid md:grid-cols-3 gap-3">
            <Input
              value={newNotificationName}
              onChange={(e) => setNewNotificationName(e.target.value)}
              placeholder="用户名"
              className="bg-white/5 border-white/10"
            />
            <Input
              type="email"
              value={newNotificationEmail}
              onChange={(e) => setNewNotificationEmail(e.target.value)}
              placeholder="邮箱"
              className="bg-white/5 border-white/10"
            />
            <Button
              type="button"
              onClick={createTestNotification}
              disabled={creating}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              {creating ? "创建中..." : "创建测试通知"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 通知列表 */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">选择</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">用户</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">邮箱</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">类型</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">时间</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">状态</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                    <tr>
                    <td colSpan={7} className="px-6 py-20 text-center text-white/60">
                      加载中...
                    </td>
                  </tr>
                ) : filteredNotifications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center text-white/60">
                      暂无通知
                    </td>
                  </tr>
                ) : (
                  filteredNotifications.map((notification) => (
                    <tr
                      key={notification.id}
                      className={`border-b border-white/5 hover:bg-white/5 ${
                        !notification.read ? "bg-purple-500/10" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(notification.id)}
                          onChange={() => toggleSelect(notification.id)}
                          className="h-4 w-4"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                            {notification.user.name?.[0]?.toUpperCase() || "U"}
                          </div>
                          <div>
                            <div className="font-medium text-white">{notification.user.name}</div>
                            <div className="text-white/60 text-sm">
                              {notification.eventType === "user_signup"
                                ? "新用户注册"
                                : notification.eventType === "system"
                                  ? "系统通知"
                                  : "自定义通知"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white/80">{notification.user.email}</td>
                      <td className="px-6 py-4 text-white/80">
                        {notification.eventType === "user_signup"
                          ? "用户注册"
                          : notification.eventType === "system"
                            ? "系统"
                            : "自定义"}
                      </td>
                      <td className="px-6 py-4 text-white/80">
                        {formatTime(notification.timestamp)}
                      </td>
                      <td className="px-6 py-4">
                        {notification.read ? (
                          <Badge className="bg-green-500/20 text-green-400">已读</Badge>
                        ) : (
                          <Badge className="bg-yellow-500/20 text-yellow-400">未读</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => markAsRead(notification.id)}
                              className="text-white/60 hover:text-white hover:bg-white/10"
                              aria-label="标记为已读"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteNotification(notification.id)}
                            className="text-white/60 hover:text-white hover:bg-white/10"
                            aria-label="删除"
                          >
                            <X className="w-4 h-4" />
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

      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          className="text-white/70 hover:text-white hover:bg-white/10"
        >
          上一页
        </Button>
        <span className="text-white/60 text-sm">第 {page} / {totalPages} 页</span>
        <Button
          variant="ghost"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          className="text-white/70 hover:text-white hover:bg-white/10"
        >
          下一页
        </Button>
      </div>
    </div>
  );
}
