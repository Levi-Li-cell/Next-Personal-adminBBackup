import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { photo } from "@/db/schema/photo";
import { and, desc, eq, ilike, type SQL } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "all";

    const conditions: SQL[] = [];

    if (search) {
      conditions.push(ilike(photo.title, `%${search}%`));
    }

    if (category !== "all") {
      conditions.push(eq(photo.album, category));
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    const photos = await db
      .select()
      .from(photo)
      .where(whereCondition)
      .orderBy(desc(photo.createdAt));

    return NextResponse.json({
      success: true,
      data: photos,
    });
  } catch (error) {
    console.error("获取照片列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取照片列表失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.url) {
      return NextResponse.json(
        { success: false, error: "缺少照片地址" },
        { status: 400 }
      );
    }

    const created = await db
      .insert(photo)
      .values({
        id: uuidv4(),
        title: body.filename || body.title || "未命名图片",
        url: body.url,
        thumbnailUrl: body.thumbnailUrl || body.url,
        album: body.category || body.album || "默认相册",
        status: "published",
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: created[0],
    });
  } catch (error) {
    console.error("创建照片记录失败:", error);
    return NextResponse.json(
      { success: false, error: "创建照片记录失败" },
      { status: 500 }
    );
  }
}
