import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { db } from "@/db";
import { photo } from "@/db/schema/photo";
import { eq } from "drizzle-orm";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db
      .select()
      .from(photo)
      .where(eq(photo.id, id))
      .limit(1);

    if (!existing[0]) {
      return NextResponse.json(
        { success: false, error: "照片不存在" },
        { status: 404 }
      );
    }

    const photoRecord = existing[0];

    await db.delete(photo).where(eq(photo.id, id));

    try {
      if (photoRecord.url) {
        await del(photoRecord.url);
      }
    } catch (blobError) {
      console.warn("删除 Blob 文件失败（已删除数据库记录）:", blobError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除照片失败:", error);
    return NextResponse.json(
      { success: false, error: "删除照片失败" },
      { status: 500 }
    );
  }
}
