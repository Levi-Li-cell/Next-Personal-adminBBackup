"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Users,
  FileText,
  Folder,
  Calendar,
  Clock,
  User,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  TrendingUp,
  PieChart,
  LineChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import * as echarts from "echarts";

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  change?: string;
  trend?: "up" | "down";
  color: string;
}

function StatCard({ title, value, icon, change, trend, color }: StatCardProps) {
  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-white/60">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            {change && (
              <div className="flex items-center gap-1 mt-1 text-sm">
                {trend === "up" ? (
                  <ArrowUpRight className="w-3 h-3 text-green-400" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 text-red-400" />
                )}
                <span className={trend === "up" ? "text-green-400" : "text-red-400"}>
                  {change}
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${color.replace("text-", "bg-")}${color.includes("purple") ? "/20" : "/10"}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface Activity {
  id: string;
  type: string;
  user: string;
  action: string;
  timestamp: string;
}

// 图表组件
function Chart({ title, type, data }: { title: string; type: string; data: any }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      chartInstance.current = echarts.init(chartRef.current);

      let option;

      if (type === "line") {
        option = {
          grid: {
            left: "3%",
            right: "4%",
            bottom: "3%",
            containLabel: true,
          },
          xAxis: {
            type: "category",
            data: data.xAxis,
            axisLine: {
              lineStyle: {
                color: "rgba(255, 255, 255, 0.2)",
              },
            },
            axisLabel: {
              color: "rgba(255, 255, 255, 0.6)",
            },
          },
          yAxis: {
            type: "value",
            axisLine: {
              lineStyle: {
                color: "rgba(255, 255, 255, 0.2)",
              },
            },
            axisLabel: {
              color: "rgba(255, 255, 255, 0.6)",
            },
            splitLine: {
              lineStyle: {
                color: "rgba(255, 255, 255, 0.1)",
              },
            },
          },
          series: [
            {
              data: data.series,
              type: "line",
              smooth: true,
              lineStyle: {
                color: "#a855f7",
                width: 2,
              },
              areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  {
                    offset: 0,
                    color: "rgba(168, 85, 247, 0.3)",
                  },
                  {
                    offset: 1,
                    color: "rgba(168, 85, 247, 0.05)",
                  },
                ]),
              },
              itemStyle: {
                color: "#a855f7",
              },
            },
          ],
        };
      } else if (type === "pie") {
        option = {
          tooltip: {
            trigger: "item",
            formatter: "{b}: {c} ({d}%)",
            textStyle: {
              color: "#fff",
            },
          },
          legend: {
            orient: "vertical",
            right: 10,
            top: "center",
            textStyle: {
              color: "rgba(255, 255, 255, 0.6)",
            },
          },
          series: [
            {
              type: "pie",
              radius: "60%",
              center: ["40%", "50%"],
              data: data.series,
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: "rgba(0, 0, 0, 0.5)",
                },
              },
            },
          ],
        };
      }

      if (option) {
        chartInstance.current.setOption(option);
      }

      const handleResize = () => {
        chartInstance.current?.resize();
      };

      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        chartInstance.current?.dispose();
      };
    }
  }, [type, data]);

  return (
    <Card className="bg-white/5 border-white/10 h-full">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
          {type === "line" ? <TrendingUp className="w-5 h-5" /> : <PieChart className="w-5 h-5" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={chartRef} style={{ width: "100%", height: "300px" }} />
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalBlogs: 0,
    totalProjects: 0,
    totalUsers: 0,
    totalPhotos: 0,
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [userGrowthData, setUserGrowthData] = useState<{ xAxis: string[]; series: number[] }>({
    xAxis: [],
    series: [],
  });
  const [blogCategoryData, setBlogCategoryData] = useState<{ series: { value: number; name: string }[] }>({
    series: [],
  });
  const [loading, setLoading] = useState(true);

  // 模拟数据
  useEffect(() => {
    setTimeout(() => {
      setStats({
        totalBlogs: 12,
        totalProjects: 8,
        totalUsers: 24,
        totalPhotos: 42,
      });
      setActivities([
        {
          id: "1",
          type: "blog",
          user: "管理员",
          action: "创建了新博客",
          timestamp: "2分钟前",
        },
        {
          id: "2",
          type: "project",
          user: "管理员",
          action: "更新了项目信息",
          timestamp: "15分钟前",
        },
        {
          id: "3",
          type: "user",
          user: "系统",
          action: "新用户注册",
          timestamp: "1小时前",
        },
        {
          id: "4",
          type: "photo",
          user: "管理员",
          action: "上传了新照片",
          timestamp: "2小时前",
        },
      ]);
      
      // 用户增长数据
      setUserGrowthData({
        xAxis: ['1月', '2月', '3月', '4月', '5月', '6月'],
        series: [5, 8, 12, 15, 20, 24],
      });
      
      // 博客分类数据
      setBlogCategoryData({
        series: [
          { value: 5, name: '技术分享' },
          { value: 3, name: '生活感悟' },
          { value: 2, name: '项目经验' },
          { value: 1, name: '其他' },
        ],
      });
      
      setLoading(false);
    }, 500);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold text-white">仪表盘</h1>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="博客文章"
          value={stats.totalBlogs.toString()}
          icon={<FileText className="w-5 h-5 text-purple-400" />}
          change="+2 篇"
          trend="up"
          color="text-purple-400"
        />
        <StatCard
          title="项目"
          value={stats.totalProjects.toString()}
          icon={<Folder className="w-5 h-5 text-blue-400" />}
          change="+1 个"
          trend="up"
          color="text-blue-400"
        />
        <StatCard
          title="用户"
          value={stats.totalUsers.toString()}
          icon={<Users className="w-5 h-5 text-green-400" />}
          change="+3 人"
          trend="up"
          color="text-green-400"
        />
        <StatCard
          title="照片"
          value={stats.totalPhotos.toString()}
          icon={<BarChart3 className="w-5 h-5 text-pink-400" />}
          change="+5 张"
          trend="up"
          color="text-pink-400"
        />
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Chart title="用户增长趋势" type="line" data={userGrowthData} />
        <Chart title="博客分类分布" type="pie" data={blogCategoryData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 最近活动 */}
        <Card className="bg-white/5 border-white/10 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-white">最近活动</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center">
                <span className="text-white/60">加载中...</span>
              </div>
            ) : activities.length === 0 ? (
              <div className="py-12 text-center">
                <span className="text-white/60">暂无活动</span>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-white/60" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{activity.user}</span>
                        <Badge className="bg-white/10 text-white/80">
                          {activity.type === "blog" ? "博客" : 
                           activity.type === "project" ? "项目" : 
                           activity.type === "user" ? "用户" : "照片"}
                        </Badge>
                      </div>
                      <p className="text-white/60 text-sm mt-1">{activity.action}</p>
                      <div className="flex items-center gap-2 text-white/40 text-xs mt-2">
                        <Clock className="w-3 h-3" />
                        <span>{activity.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 快速操作 */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-white">快速操作</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button
                variant="ghost"
                className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10"
                onClick={() => router.push("/dashboard/blog/create")}
              >
                <FileText className="w-4 h-4 mr-2" />
                创建博客
                <ChevronRight className="w-4 h-4 ml-auto" />
              </Button>
              <Separator className="bg-white/10" />
              <Button
                variant="ghost"
                className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10"
                onClick={() => router.push("/dashboard/projects/create")}
              >
                <Folder className="w-4 h-4 mr-2" />
                创建项目
                <ChevronRight className="w-4 h-4 ml-auto" />
              </Button>
              <Separator className="bg-white/10" />
              <Button
                variant="ghost"
                className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10"
                onClick={() => router.push("/dashboard/photos")}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                管理照片
                <ChevronRight className="w-4 h-4 ml-auto" />
              </Button>
              <Separator className="bg-white/10" />
              <Button
                variant="ghost"
                className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10"
                onClick={() => router.push("/dashboard/users")}
              >
                <Users className="w-4 h-4 mr-2" />
                管理用户
                <ChevronRight className="w-4 h-4 ml-auto" />
              </Button>
              <Separator className="bg-white/10" />
              <Button
                variant="ghost"
                className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10"
                onClick={() => router.push("/dashboard/notifications")}
              >
                <Calendar className="w-4 h-4 mr-2" />
                查看通知
                <ChevronRight className="w-4 h-4 ml-auto" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
