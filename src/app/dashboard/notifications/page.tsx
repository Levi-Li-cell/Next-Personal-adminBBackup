"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Check,
  Clock,
  Mail,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Notification {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  timestamp: number;
  read: boolean;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  // 模拟通知数据
  useEffect(() => {
    setTimeout(() => {
      const mockNotifications: Notification[] = [
        {
          id: "1",
          user: {
            id: "1",
            name: "测试用户1",
            email: "test1@example.com",
          },
          timestamp: Date.now() - 1000 * 60 * 30, // 30分钟前
          read: false,
        },
        {
          id: "2",
          user: {
            id: "2",
            name: "测试用户2",
            email: "test2@example.com",
          },
          timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2小时前
          read: true,
        },
        {
          id: "3",
          user: {
            id: "3",
            name: "测试用户3",
            email: "test3@example.com",
          },
          timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1天前
          read: false,
        },
      ];

      setNotifications(mockNotifications);
      setLoading(false);
    }, 500);
  }, []);

  // 标记为已读
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  // 标记全部已读
  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true }))
    );
  };

  // 删除通知
  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
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

      {/* 通知列表 */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">用户</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">邮箱</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">时间</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">状态</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-white/60">
                      加载中...
                    </td>
                  </tr>
                ) : filteredNotifications.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-white/60">
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
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                            {notification.user.name?.[0]?.toUpperCase() || "U"}
                          </div>
                          <div>
                            <div className="font-medium text-white">{notification.user.name}</div>
                            <div className="text-white/60 text-sm">新用户注册</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white/80">{notification.user.email}</td>
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
    </div>
  );
}
