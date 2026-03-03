-- 创建blog表
CREATE TABLE IF NOT EXISTS "blog" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"excerpt" text,
	"content" text NOT NULL,
	"cover_image" text,
	"image_links" json DEFAULT '[]'::json,
	"category" text DEFAULT '未分类' NOT NULL,
	"tags" json DEFAULT '[]'::json,
	"author_id" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"view_count" integer DEFAULT 0,
	"like_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"published_at" timestamp,
	CONSTRAINT "blog_slug_unique" UNIQUE("slug")
);

-- 启用行级安全策略
ALTER TABLE "blog" ENABLE ROW LEVEL SECURITY;

-- 添加外键约束
ALTER TABLE "blog" ADD CONSTRAINT "blog_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;

-- 创建project表
CREATE TABLE IF NOT EXISTS "project" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"content" text,
	"cover_image" text,
	"image_links" json DEFAULT '[]'::json,
	"tech_stack" json DEFAULT '[]'::json,
	"demo_url" text,
	"github_url" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"sort_order" text DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"published_at" timestamp
);

-- 启用行级安全策略
ALTER TABLE "project" ENABLE ROW LEVEL SECURITY;

-- 为user表添加image_links字段（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'image_links') THEN
        ALTER TABLE "user" ADD COLUMN "image_links" json DEFAULT '[]'::json;
    END IF;
END $$;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS "blog_author_id_idx" ON "blog" ("author_id");
CREATE INDEX IF NOT EXISTS "blog_status_idx" ON "blog" ("status");
CREATE INDEX IF NOT EXISTS "blog_created_at_idx" ON "blog" ("created_at");

CREATE INDEX IF NOT EXISTS "project_status_idx" ON "project" ("status");
CREATE INDEX IF NOT EXISTS "project_created_at_idx" ON "project" ("created_at");
