import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { blog } from "@/db/schema/blog";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log("创建博客请求:", JSON.stringify(body, null, 2));
    
    // 确保imageLinks和tags是数组
    const imageLinks = Array.isArray(body.imageLinks) ? body.imageLinks : [];
    const tags = Array.isArray(body.tags) ? body.tags : [];
    
    const newBlog = await db
      .insert(blog)
      .values({
        id: uuidv4(),
        title: body.title,
        slug: body.slug,
        excerpt: body.excerpt || "",
        content: body.content || "",
        coverImage: body.coverImage || null,
        imageLinks: imageLinks,
        category: body.category || "未分类",
        tags: tags,
        authorId: body.authorId,
        status: body.status || "draft",
        publishedAt: body.status === "published" ? new Date() : null,
      })
      .returning();

    console.log("博客创建成功:", newBlog[0]);

    return NextResponse.json({
      success: true,
      data: newBlog[0],
    });
  } catch (error) {
    console.error("创建博客失败:", error);
    const errorMessage = error instanceof Error ? error.message : "创建博客失败";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const blogs = await db
      .select()
      .from(blog);

    return NextResponse.json({
      success: true,
      data: blogs,
    });
  } catch (error) {
    console.error("获取博客列表失败:", error);
    const errorMessage = error instanceof Error ? error.message : "获取博客列表失败";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
