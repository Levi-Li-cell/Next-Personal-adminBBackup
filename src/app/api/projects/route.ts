import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { project } from "@/db/schema/project";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newProject = await db
      .insert(project)
      .values({
        id: uuidv4(),
        title: body.title,
        description: body.description,
        content: body.content,
        coverImage: body.coverImage,
        imageLinks: body.imageLinks || [],
        techStack: body.techStack || [],
        demoUrl: body.demoUrl,
        githubUrl: body.githubUrl,
        status: body.status,
        publishedAt: body.status === "published" ? new Date() : null,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newProject[0],
    });
  } catch (error) {
    console.error("创建项目失败:", error);
    return NextResponse.json(
      { success: false, error: "创建项目失败" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const projects = await db
      .select()
      .from(project)
      .orderBy(project.createdAt, "desc");

    return NextResponse.json({
      success: true,
      data: projects,
    });
  } catch (error) {
    console.error("获取项目列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取项目列表失败" },
      { status: 500 }
    );
  }
}
