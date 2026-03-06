import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { project } from "@/db/schema/project";
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
    
    const newProject = await db
      .insert(project)
      .values({
        id: uuidv4(),
        title: body.title,
        description: body.description,
        content: contentMarkdown,
        coverImage: body.coverImage,
        imageLinks: mergedImageLinks,
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
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    const filters: SQL[] = [];

    if (search) {
      filters.push(ilike(project.title, `%${search}%`));
    }

    if (status !== "all") {
      filters.push(eq(project.status, status));
    }

    const whereCondition = filters.length > 0 ? and(...filters) : undefined;

    const projects = await db
      .select()
      .from(project)
      .where(whereCondition)
      .orderBy(desc(project.createdAt))
      .limit(limit)
      .offset(offset);

    const [totalResult] = await db
      .select({ value: count() })
      .from(project)
      .where(whereCondition);
    const total = totalResult?.value ?? 0;

    return NextResponse.json({
      success: true,
      data: projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("获取项目列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取项目列表失败" },
      { status: 500 }
    );
  }
}
