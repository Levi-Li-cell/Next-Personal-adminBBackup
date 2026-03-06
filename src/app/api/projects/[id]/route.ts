import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { project } from "@/db/schema/project";
import { eq } from "drizzle-orm";
import { deleteBlobUrls } from "@/lib/storage/blob";
import { extractImageUrlsFromHtml, htmlToMarkdown } from "@/lib/content/markdown";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const projectItem = await db
      .select()
      .from(project)
      .where(eq(project.id, id))
      .limit(1);

    if (!projectItem[0]) {
      return NextResponse.json(
        { success: false, error: "项目不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: projectItem[0],
    });
  } catch (error) {
    console.error("获取项目详情失败:", error);
    return NextResponse.json(
      { success: false, error: "获取项目详情失败" },
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
      .from(project)
      .where(eq(project.id, id))
      .limit(1);

    if (!existing[0]) {
      return NextResponse.json(
        { success: false, error: "项目不存在" },
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

    const updatedProject = await db
      .update(project)
      .set({
        title: body.title,
        description: body.description,
        content: contentMarkdown,
        coverImage: body.coverImage,
        imageLinks: nextImageLinks,
        techStack: body.techStack || [],
        demoUrl: body.demoUrl,
        githubUrl: body.githubUrl,
        status: body.status,
        publishedAt: body.status === "published" && !body.publishedAt ? new Date() : body.publishedAt,
      })
      .where(eq(project.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedProject[0],
    });
  } catch (error) {
    console.error("更新项目失败:", error);
    return NextResponse.json(
      { success: false, error: "更新项目失败" },
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
      .from(project)
      .where(eq(project.id, id))
      .limit(1);

    if (!existing[0]) {
      return NextResponse.json(
        { success: false, error: "项目不存在" },
        { status: 404 }
      );
    }

    const imageLinks = Array.isArray(existing[0].imageLinks) ? existing[0].imageLinks : [];
    await deleteBlobUrls(imageLinks);

    const deletedProject = await db
      .delete(project)
      .where(eq(project.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: deletedProject[0],
    });
  } catch (error) {
    console.error("删除项目失败:", error);
    return NextResponse.json(
      { success: false, error: "删除项目失败" },
      { status: 500 }
    );
  }
}
