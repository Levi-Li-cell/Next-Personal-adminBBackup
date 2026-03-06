import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema/auth/user";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const userDetail = await db
      .select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    if (!userDetail[0]) {
      return NextResponse.json(
        { success: false, error: "用户不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: userDetail[0],
    });
  } catch (error) {
    console.error("获取用户详情失败:", error);
    return NextResponse.json(
      { success: false, error: "获取用户详情失败" },
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

    const updatedUser = await db
      .update(user)
      .set({
        name: body.name,
        email: body.email,
        role: body.role,
        emailVerified: Boolean(body.emailVerified),
      })
      .where(eq(user.id, id))
      .returning();

    if (!updatedUser[0]) {
      return NextResponse.json(
        { success: false, error: "用户不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedUser[0],
    });
  } catch (error) {
    console.error("更新用户失败:", error);
    const errorMessage = error instanceof Error ? error.message : "更新用户失败";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
