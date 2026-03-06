import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { blog } from "@/db/schema/blog";
import { project } from "@/db/schema/project";
import { list } from "@vercel/blob";
import { deleteBlobUrls } from "@/lib/storage/blob";

function collectUsedUrls(list: unknown[]) {
  const used = new Set<string>();

  for (const item of list) {
    if (typeof item !== "string") continue;
    used.add(item);
  }

  return used;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const dryRun = body?.dryRun !== false;

    const blogs = await db.select({ imageLinks: blog.imageLinks }).from(blog);
    const projects = await db.select({ imageLinks: project.imageLinks }).from(project);

    const usedUrls = new Set<string>();
    for (const item of blogs) {
      const current = Array.isArray(item.imageLinks) ? item.imageLinks : [];
      collectUsedUrls(current).forEach((url) => usedUrls.add(url));
    }
    for (const item of projects) {
      const current = Array.isArray(item.imageLinks) ? item.imageLinks : [];
      collectUsedUrls(current).forEach((url) => usedUrls.add(url));
    }

    const blobs = await list();
    const toDelete = blobs.blobs
      .map((item) => item.url)
      .filter((url) => url && !usedUrls.has(url));

    if (!dryRun) {
      await deleteBlobUrls(toDelete);
    }

    return NextResponse.json({
      success: true,
      dryRun,
      usedCount: usedUrls.size,
      candidateDeleteCount: toDelete.length,
      candidates: toDelete.slice(0, 50),
    });
  } catch (error) {
    console.error("Blob 清理失败:", error);
    return NextResponse.json(
      { success: false, error: "Blob 清理失败" },
      { status: 500 }
    );
  }
}
