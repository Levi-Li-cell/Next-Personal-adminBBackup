import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { blog } from "@/db/schema/blog";
import { v4 as uuidv4 } from "uuid";
import { and, count, desc, eq, ilike, type SQL } from "drizzle-orm";
import { extractImageUrlsFromHtml, htmlToMarkdown } from "@/lib/content/markdown";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const contentHtml = String(body.content || "");
    const contentMarkdown = htmlToMarkdown(contentHtml);
    const editorImageLinks = extractImageUrlsFromHtml(contentHtml);
    const mergedImageLinks = [...new Set([...editorImageLinks, body.coverImage].filter(Boolean))];
    const tags = Array.isArray(body.tags) ? body.tags : [];
    
    const newBlog = await db
      .insert(blog)
      .values({
        id: uuidv4(),
        title: body.title,
        slug: body.slug,
        excerpt: body.excerpt || "",
        content: contentMarkdown,
        coverImage: body.coverImage || null,
        imageLinks: mergedImageLinks,
        category: body.category || "未分类",
        tags: tags,
        authorId: body.authorId || null,
        status: body.status || "draft",
        publishedAt: body.status === "published" ? new Date() : null,
      })
      .returning();

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
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const offset = (page - 1) * limit;

    const filters: SQL[] = [];

    if (status !== "all") {
      filters.push(eq(blog.status, status));
    }

    if (category) {
      filters.push(eq(blog.category, category));
    }

    if (search) {
      filters.push(ilike(blog.title, `%${search}%`));
    }

    const whereCondition = filters.length > 0 ? and(...filters) : undefined;

    const blogs = await db
      .select()
      .from(blog)
      .where(whereCondition)
      .orderBy(desc(blog.createdAt))
      .limit(limit)
      .offset(offset);

    const [totalResult] = await db
      .select({ value: count() })
      .from(blog)
      .where(whereCondition);
    const total = totalResult?.value ?? 0;

    return NextResponse.json({
      success: true,
      data: blogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
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
