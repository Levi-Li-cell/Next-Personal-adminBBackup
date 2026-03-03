import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { ssoToken, user, session } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { nanoid } from "nanoid";

// GET /api/auth/sso?token=xxx - 验证SSO token并创建session
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "缺少token参数" },
        { status: 400 }
      );
    }

    // 查找有效的 token
    const tokenRecord = await db.query.ssoToken.findFirst({
      where: and(
        eq(ssoToken.token, token),
        gt(ssoToken.expiresAt, new Date())
      ),
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { success: false, error: "Token无效或已过期" },
        { status: 401 }
      );
    }

    // 获取用户信息
    const userRecord = await db.query.user.findFirst({
      where: eq(user.id, tokenRecord.userId),
    });

    if (!userRecord) {
      return NextResponse.json(
        { success: false, error: "用户不存在" },
        { status: 404 }
      );
    }

    // 检查用户是否是管理员
    if ((userRecord as any).role !== "admin") {
      return NextResponse.json(
        { success: false, error: "非管理员用户" },
        { status: 403 }
      );
    }

    // 删除已使用的 token（一次性使用）
    await db.delete(ssoToken).where(eq(ssoToken.id, tokenRecord.id));

    // 创建新的 session
    const sessionToken = nanoid(32);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7天

    await db.insert(session).values({
      id: nanoid(),
      token: sessionToken,
      userId: userRecord.id,
      expiresAt,
    });

    // 返回成功响应，包含 session token
    const response = NextResponse.json({
      success: true,
      redirect: "/dashboard",
      sessionToken,
    });

    // 设置 session cookie
    response.cookies.set("better-auth.session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });

    return response;
  } catch (error) {
    console.error("SSO验证失败:", error);
    return NextResponse.json(
      { success: false, error: "SSO验证失败" },
      { status: 500 }
    );
  }
}
