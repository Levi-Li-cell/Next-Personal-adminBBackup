import { pgTable, text, timestamp, jsonb, boolean, integer } from "drizzle-orm/pg-core";
import { user } from "./auth/user";

// 博客文章表
export const blog = pgTable("blog", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  coverImage: text("cover_image"),
  imageLinks: jsonb("image_links").$type<string[]>().default([]),
  category: text("category").notNull().default("未分类"),
  tags: jsonb("tags").$type<string[]>().default([]),
  authorId: text("author_id").references(() => user.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("draft"), // draft, published
  viewCount: integer("view_count").default(0),
  likeCount: integer("like_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
  publishedAt: timestamp("published_at"),
}).enableRLS();

export type BlogType = typeof blog.$inferSelect;
export type NewBlogType = typeof blog.$inferInsert;
