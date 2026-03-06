import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

const DEFAULT_SETTINGS = {
  site: {
    name: "个人网站",
    description: "我的个人网站",
    url: "https://example.com",
    logo: "",
    favicon: "",
  },
  seo: {
    title: "个人网站 - 分享技术与生活",
    description: "这是我的个人网站，分享技术文章和生活感悟",
    keywords: "个人网站,技术博客,生活感悟",
    author: "管理员",
  },
  features: {
    enableComments: true,
    enableAnalytics: false,
    enableSocialShare: true,
  },
};

async function ensureSettingsTable() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS app_settings (
      id text PRIMARY KEY,
      payload jsonb NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    )
  `);
}

async function ensureSettingsAuditTable() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS app_settings_audit (
      id text PRIMARY KEY,
      actor_email text,
      actor_name text,
      payload jsonb NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL
    )
  `);
}

export async function GET() {
  try {
    await ensureSettingsTable();
    await ensureSettingsAuditTable();

    const result = await db.execute(sql`
      SELECT payload
      FROM app_settings
      WHERE id = 'default'
      LIMIT 1
    `);

    const row = (result as unknown as { rows?: Array<{ payload: unknown }> }).rows?.[0];

    const auditResult = await db.execute(sql`
      SELECT id, actor_email, actor_name, created_at
      FROM app_settings_audit
      ORDER BY created_at DESC
      LIMIT 10
    `);

    const audits = (auditResult as unknown as {
      rows?: Array<{
        id: string;
        actor_email: string | null;
        actor_name: string | null;
        created_at: Date | string;
      }>;
    }).rows || [];

    return NextResponse.json({
      success: true,
      data: row?.payload || DEFAULT_SETTINGS,
      audits: audits.map((item) => ({
        id: item.id,
        actorEmail: item.actor_email,
        actorName: item.actor_name,
        createdAt: item.created_at,
      })),
    });
  } catch (error) {
    console.error("获取设置失败:", error);
    return NextResponse.json(
      { success: false, error: "获取设置失败" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await ensureSettingsTable();
    await ensureSettingsAuditTable();
    const payload = await request.json();
    const session = await auth.api.getSession({ headers: request.headers });

    await db.execute(sql`
      INSERT INTO app_settings (id, payload, updated_at)
      VALUES ('default', ${JSON.stringify(payload)}::jsonb, now())
      ON CONFLICT (id)
      DO UPDATE SET payload = EXCLUDED.payload, updated_at = now()
    `);

    await db.execute(sql`
      INSERT INTO app_settings_audit (id, actor_email, actor_name, payload)
      VALUES (
        ${uuidv4()},
        ${session?.user?.email || null},
        ${session?.user?.name || null},
        ${JSON.stringify(payload)}::jsonb
      )
    `);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("保存设置失败:", error);
    return NextResponse.json(
      { success: false, error: "保存设置失败" },
      { status: 500 }
    );
  }
}
