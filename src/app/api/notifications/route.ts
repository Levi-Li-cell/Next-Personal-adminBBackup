import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { SQL, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

async function ensureNotificationTable() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS admin_notification (
      id text PRIMARY KEY,
      user_name text NOT NULL,
      user_email text NOT NULL,
      event_type text NOT NULL DEFAULT 'user_signup',
      read boolean NOT NULL DEFAULT false,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    )
  `);

  const seedResult = await db.execute(sql`
    SELECT COUNT(*)::int AS count FROM admin_notification
  `);
  const count = (seedResult as unknown as { rows?: Array<{ count: number }> }).rows?.[0]?.count || 0;

  if (count === 0) {
    await db.execute(sql`
      INSERT INTO admin_notification (id, user_name, user_email, event_type, read)
      VALUES
        (${uuidv4()}, '系统管理员', 'admin@example.com', 'user_signup', false),
        (${uuidv4()}, '测试用户', 'test@example.com', 'user_signup', true)
    `);
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureNotificationTable();

    const searchParams = request.nextUrl.searchParams;
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const eventType = searchParams.get("eventType") || "all";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const whereParts: SQL[] = [];
    if (unreadOnly) {
      whereParts.push(sql`read = false`);
    }
    if (eventType !== "all") {
      whereParts.push(sql`event_type = ${eventType}`);
    }
    const whereClause = whereParts.length > 0
      ? sql`WHERE ${sql.join(whereParts, sql` AND `)}`
      : sql``;

    const result = await db.execute(sql`
      SELECT id, user_name, user_email, event_type, read, created_at
      FROM admin_notification
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `);

    const totalResult = await db.execute(sql`
      SELECT COUNT(*)::int AS total
      FROM admin_notification
      ${whereClause}
    `);

    const total = (totalResult as unknown as { rows?: Array<{ total: number }> }).rows?.[0]?.total || 0;

    const rows = (result as unknown as {
      rows?: Array<{
        id: string;
        user_name: string;
        user_email: string;
        event_type: string;
        read: boolean;
        created_at: Date | string;
      }>;
    }).rows || [];

    const notifications = rows.map((item) => ({
      id: item.id,
      user: {
        id: item.id,
        name: item.user_name,
        email: item.user_email,
      },
      eventType: item.event_type,
      timestamp: new Date(item.created_at).getTime(),
      read: item.read,
    }));

    return NextResponse.json({
      success: true,
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("获取通知列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取通知列表失败" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await ensureNotificationTable();

    const body = await request.json();
    const markAll = body.markAll === true;
    const ids: string[] = Array.isArray(body.ids)
      ? body.ids.filter((value: unknown): value is string => typeof value === "string" && value.length > 0)
      : [];

    if (markAll) {
      await db.execute(sql`
        UPDATE admin_notification
        SET read = true, updated_at = now()
        WHERE read = false
      `);

      return NextResponse.json({ success: true });
    }

    if (ids.length > 0) {
      const idSql = sql.join(ids.map((id: string) => sql`${id}`), sql`,`);
      await db.execute(sql`
        UPDATE admin_notification
        SET read = true, updated_at = now()
        WHERE id IN (${idSql})
      `);

      return NextResponse.json({ success: true });
    }

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "缺少通知ID" },
        { status: 400 }
      );
    }

    const updated = await db.execute(sql`
      UPDATE admin_notification
      SET read = true, updated_at = now()
      WHERE id = ${body.id}
      RETURNING id
    `);

    const rows = (updated as unknown as { rows?: Array<{ id: string }> }).rows || [];

    if (!rows[0]) {
      return NextResponse.json(
        { success: false, error: "通知不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("更新通知状态失败:", error);
    return NextResponse.json(
      { success: false, error: "更新通知状态失败" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await ensureNotificationTable();

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const ids: string[] = searchParams.get("ids")?.split(",").filter(Boolean) || [];

    if (ids.length > 0) {
      const idSql = sql.join(ids.map((item: string) => sql`${item}`), sql`,`);
      await db.execute(sql`
        DELETE FROM admin_notification
        WHERE id IN (${idSql})
      `);

      return NextResponse.json({ success: true });
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "缺少通知ID" },
        { status: 400 }
      );
    }

    const deleted = await db.execute(sql`
      DELETE FROM admin_notification
      WHERE id = ${id}
      RETURNING id
    `);

    const rows = (deleted as unknown as { rows?: Array<{ id: string }> }).rows || [];

    if (!rows[0]) {
      return NextResponse.json(
        { success: false, error: "通知不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除通知失败:", error);
    return NextResponse.json(
      { success: false, error: "删除通知失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureNotificationTable();

    const body = await request.json();

    if (!body.userName || !body.userEmail) {
      return NextResponse.json(
        { success: false, error: "缺少用户名或邮箱" },
        { status: 400 }
      );
    }

    const id = uuidv4();
    await db.execute(sql`
      INSERT INTO admin_notification (id, user_name, user_email, event_type, read)
      VALUES (
        ${id},
        ${body.userName},
        ${body.userEmail},
        ${body.eventType || "user_signup"},
        false
      )
    `);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("创建通知失败:", error);
    return NextResponse.json(
      { success: false, error: "创建通知失败" },
      { status: 500 }
    );
  }
}
