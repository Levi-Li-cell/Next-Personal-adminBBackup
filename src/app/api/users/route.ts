import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema/auth/user";
import { and, count, desc, like, or, type SQL } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    const filters: SQL[] = [];

    if (search) {
      filters.push(or(like(user.name, `%${search}%`), like(user.email, `%${search}%`))!);
    }

    const whereCondition = filters.length > 0 ? and(...filters) : undefined;

    const users = await db
      .select()
      .from(user)
      .where(whereCondition)
      .orderBy(desc(user.createdAt))
      .limit(limit)
      .offset(offset);

    const [totalResult] = await db
      .select({ value: count() })
      .from(user)
      .where(whereCondition);
    const total = totalResult?.value ?? 0;

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
