import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { project } from "@/db/schema/project";
import { eq } from "drizzle-orm";

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

    const updatedProject = await db
      .update(project)
      .set({
        title: body.title,
        description: body.description,
        content: body.content,
        coverImage: body.coverImage,
        imageLinks: body.imageLinks || [],
        techStack: body.techStack || [],
        demoUrl: body.demoUrl,
        githubUrl: body.githubUrl,
        status: body.status,
        publishedAt: body.status === "published" && !body.publishedAt ? new Date() : body.publishedAt,
      })
      .where(eq(project.id, id))
      .returning();

    if (!updatedProject[0]) {
      return NextResponse.json(
        { success: false, error: "项目不存在" },
        { status: 404 }
      );
    }

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

    const deletedProject = await db
      .delete(project)
      .where(eq(project.id, id))
      .returning();

    if (!deletedProject[0]) {
      return NextResponse.json(
        { success: false, error: "项目不存在" },
        { status: 404 }
      );
    }

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
