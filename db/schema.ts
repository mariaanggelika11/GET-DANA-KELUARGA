import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const releases = sqliteTable("releases", {
  id: text("id").primaryKey(),
  versionName: text("version_name").notNull(),
  versionCode: integer("version_code").notNull().unique(),
  releaseDate: text("release_date").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  minAndroid: text("min_android").notNull(),
  minSdk: integer("min_sdk").notNull(),
  sha256: text("sha256").notNull(),
  signerSha256: text("signer_sha256").notNull(),
  objectKey: text("object_key").notNull().unique(),
  releaseNotes: text("release_notes").notNull(),
  status: text("status", { enum: ["draft", "published", "archived"] })
    .notNull()
    .default("draft"),
  active: integer("active", { mode: "boolean" }).notNull().default(false),
  downloads: integer("downloads").notNull().default(0),
  createdAt: text("created_at").notNull(),
});
export const screenshots = sqliteTable("screenshots", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  alt: text("alt").notNull(),
  objectKey: text("object_key").notNull().unique(),
  contentType: text("content_type").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull(),
});
export const content = sqliteTable("content", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull(),
});
export const audit = sqliteTable("audit", {
  id: text("id").primaryKey(),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  target: text("target").notNull(),
  createdAt: text("created_at").notNull(),
});
