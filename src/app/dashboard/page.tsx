"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/client";
import { DashboardLayout } from "@/components/dashboard-layout";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">加载中...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">仪表盘</h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="博客文章" value="0" description="已发布" />
          <StatCard title="项目" value="0" description="已展示" />
          <StatCard title="用户" value="0" description="已注册" />
          <StatCard title="照片" value="0" description="已上传" />
        </div>

        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h2 className="text-xl font-semibold text-white mb-4">欢迎回来</h2>
          <p className="text-white/60">
            欢迎使用个人网站管理后台。从这里可以管理博客文章、项目展示、用户和照片。
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
      <div className="text-white/60 text-sm">{title}</div>
      <div className="text-3xl font-bold text-white mt-2">{value}</div>
      <div className="text-white/40 text-sm mt-1">{description}</div>
    </div>
  );
}
