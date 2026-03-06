import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { blog } from "@/db/schema/blog";
import { project } from "@/db/schema/project";
import { user } from "@/db/schema/auth/user";
import { photo } from "@/db/schema/photo";
import { count, desc, sql } from "drizzle-orm";

// 安全地获取表计数
async function safeCountTable(table: any, defaultValue = 0): Promise<number> {
  try {
    const [result] = await db.select({ count: count() }).from(table);
    return result?.count || defaultValue;
  } catch (e) {
    console.warn(`获取表计数失败:`, e);
    return defaultValue;
  }
}

// 安全地执行查询
async function safeQuery<T>(queryFn: () => Promise<T>, defaultValue: T): Promise<T> {
  try {
    return await queryFn();
  } catch (e) {
    console.warn(`查询失败:`, e);
    return defaultValue;
  }
}

export async function GET(request: NextRequest) {
  try {
    // 获取各项统计数据（带错误处理）
    const totalBlogs = await safeCountTable(blog, 0);
    const totalProjects = await safeCountTable(project, 0);
    const totalUsers = await safeCountTable(user, 0);
    const totalPhotos = await safeCountTable(photo, 0);

    // 获取博客分类统计
    const categoryStats = await safeQuery(
      async () => {
        return await db
          .select({
            category: blog.category,
            count: count(),
          })
          .from(blog)
          .groupBy(blog.category);
      },
      []
    );

    // 获取最近的活动（最新的博客、项目、用户）
    const recentBlogs = await safeQuery(
      async () => {
        return await db
          .select({
            id: blog.id,
            title: blog.title,
            type: sql`'blog'`.as("type"),
            createdAt: blog.createdAt,
          })
          .from(blog)
          .orderBy(desc(blog.createdAt))
          .limit(3);
      },
      []
    );

    const recentProjects = await safeQuery(
      async () => {
        return await db
          .select({
            id: project.id,
            title: project.title,
            type: sql`'project'`.as("type"),
            createdAt: project.createdAt,
          })
          .from(project)
          .orderBy(desc(project.createdAt))
          .limit(3);
      },
      []
    );

    const recentUsers = await safeQuery(
      async () => {
        return await db
          .select({
            id: user.id,
            name: user.name,
            type: sql`'user'`.as("type"),
            createdAt: user.createdAt,
          })
          .from(user)
          .orderBy(desc(user.createdAt))
          .limit(3);
      },
      []
    );

    const getTime = (value: Date | null) => (value ? new Date(value).getTime() : 0);

    // 合并并按时间排序
    const recentActivities = [...recentBlogs, ...recentProjects, ...recentUsers]
      .sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt))
      .slice(0, 5);

    // 获取用户增长数据（按月统计）
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const userGrowth = await safeQuery(
      async () => {
        return await db
          .select({
            month: sql`DATE_TRUNC('month', ${user.createdAt})`.as("month"),
            count: count(),
          })
          .from(user)
          .where(sql`${user.createdAt} >= ${sixMonthsAgo}`)
          .groupBy(sql`DATE_TRUNC('month', ${user.createdAt})`)
          .orderBy(sql`DATE_TRUNC('month', ${user.createdAt})`);
      },
      []
    );

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalBlogs,
          totalProjects,
          totalUsers,
          totalPhotos,
        },
        categoryStats,
        recentActivities,
        userGrowth,
      },
    });
  } catch (error) {
    console.error("获取仪表盘统计数据失败:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "获取统计数据失败",
        data: {
          stats: { totalBlogs: 0, totalProjects: 0, totalUsers: 0, totalPhotos: 0 },
          categoryStats: [],
          recentActivities: [],
          userGrowth: [],
        }
      },
      { status: 500 }
    );
  }
}
