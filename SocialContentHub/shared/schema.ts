import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const contentRequests = pgTable("content_requests", {
  id: serial("id").primaryKey(),
  topic: text("topic").notNull(),
  contentType: text("content_type").notNull(), // 'profile' | 'review' | 'info'
  generatedContent: text("generated_content"),
  sessionId: text("session_id"),
  shareId: text("share_id").unique(),
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertContentRequestSchema = createInsertSchema(contentRequests).pick({
  topic: true,
  contentType: true,
});

export const generateContentSchema = z.object({
  topic: z.string().min(1, "주제를 입력해주세요").max(500, "주제는 500자 이내로 입력해주세요"),
  contentType: z.enum(["profile", "review", "info"], {
    errorMap: () => ({ message: "올바른 콘텐츠 타입을 선택해주세요" })
  }),
  tone: z.enum(["formal", "casual"]).optional()
});

export const generateTopicSchema = z.object({
  contentType: z.enum(["profile", "review", "info"], {
    errorMap: () => ({ message: "올바른 콘텐츠 타입을 선택해주세요" })
  }),
  industry: z.string().optional()
});

export type InsertContentRequest = z.infer<typeof insertContentRequestSchema>;
export type ContentRequest = typeof contentRequests.$inferSelect;
export type GenerateContentRequest = z.infer<typeof generateContentSchema>;
export type GenerateTopicRequest = z.infer<typeof generateTopicSchema>;

// User schema (keeping existing)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
