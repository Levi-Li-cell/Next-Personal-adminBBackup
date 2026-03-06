import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { blog } from "@/db/schema/blog";
import { eq } from "drizzle-orm";
import { deleteBlobUrls } from "@/lib/storage/blob";
import { extractImageUrlsFromHtml, htmlToMarkdown } from "@/lib/content/markdown";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const blogPost = await db
      .select()
      .from(blog)
      .where(eq(blog.id, id))
      .limit(1);

    if (!blogPost[0]) {
      return NextResponse.json(
        { success: false, error: "博客不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: blogPost[0],
    });
  } catch (error) {
    console.error("获取博客详情失败:", error);
    return NextResponse.json(
      { success: false, error: "获取博客详情失败" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db
      .select()
      .from(blog)
      .where(eq(blog.id, id))
      .limit(1);

    if (!existing[0]) {
      return NextResponse.json(
        { success: false, error: "博客不存在" },
        { status: 404 }
      );
    }

    const contentHtml = String(body.content || "");
    const contentMarkdown = htmlToMarkdown(contentHtml);
    const editorImageLinks = extractImageUrlsFromHtml(contentHtml);
    const nextImageLinks = [...new Set([...editorImageLinks, body.coverImage].filter(Boolean))];

    const previousImageLinks = Array.isArray(existing[0].imageLinks) ? existing[0].imageLinks : [];
    const removedLinks = previousImageLinks.filter((url) => !nextImageLinks.includes(url));

    await deleteBlobUrls(removedLinks);

    const updatedBlog = await db
      .update(blog)
      .set({
        title: body.title,
        slug: body.slug,
        excerpt: body.excerpt,
        content: contentMarkdown,
        coverImage: body.coverImage,
        imageLinks: nextImageLinks,
        category: body.category,
        tags: body.tags || [],
        status: body.status,
        publishedAt: body.status === "published" && !body.publishedAt ? new Date() : body.publishedAt,
      })
      .where(eq(blog.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedBlog[0],
    });
  } catch (error) {
    console.error("更新博客失败:", error);
    return NextResponse.json(
      { success: false, error: "更新博客失败" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db
      .select()
      .from(blog)
      .where(eq(blog.id, id))
      .limit(1);

    if (!existing[0]) {
      return NextResponse.json(
        { success: false, error: "博客不存在" },
        { status: 404 }
      );
    }

    const imageLinks = Array.isArray(existing[0].imageLinks) ? existing[0].imageLinks : [];
    await deleteBlobUrls(imageLinks);

    const deletedBlog = await db
      .delete(blog)
      .where(eq(blog.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: deletedBlog[0],
    });
  } catch (error) {
    console.error("删除博客失败:", error);
    return NextResponse.json(
      { success: false, error: "删除博客失败" },
      { status: 500 }
    );
  }
}
