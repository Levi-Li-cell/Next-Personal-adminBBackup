import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { chatMessages } from "@/db/schema/chat";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    await db.delete(chatMessages).where(eq(chatMessages.sessionId, sessionId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting chat history:", error);
    return NextResponse.json(
      { success: false, error: "聊天历史清除失败" },
      { status: 500 }
    );
  }
}
