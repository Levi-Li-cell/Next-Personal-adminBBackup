import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema/auth/user";
import { desc, like, or } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    let query = db.select().from(user);

    // 搜索条件
    if (search) {
      query = query.where(
        or(
          like(user.name, `%${search}%`),
          like(user.email, `%${search}%`)
        )
      ) as any;
    }

    const users = await query
      .orderBy(desc(user.createdAt))
      .limit(limit)
      .offset(offset);

    // 获取总数
    const totalResult = await db.select().from(user);
    const total = totalResult.length;

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("获取用户列表失败:", error);
    const errorMessage = error instanceof Error ? error.message : "获取用户列表失败";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
