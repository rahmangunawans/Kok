import { pgTable, text, serial, integer, boolean, timestamp, jsonb, doublePrecision } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
});

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  posterUrl: text("poster_url").notNull(),
  bannerUrl: text("banner_url"),
  rating: doublePrecision("rating").default(0),
  year: integer("year"),
  country: text("country"),
  categoryId: integer("category_id").references(() => categories.id),
  views: integer("views").default(0),
  isFeatured: boolean("is_featured").default(false),
  isVip: boolean("is_vip").default(false),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  ogImage: text("og_image"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const episodes = pgTable("episodes", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").notNull().references(() => videos.id),
  title: text("title").notNull(),
  episodeNumber: integer("episode_number").notNull(),
  sourceUrl: text("source_url").notNull(), 
  duration: integer("duration"), 
  thumbnailUrl: text("thumbnail_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const videoSources = pgTable("video_sources", {
  id: serial("id").primaryKey(),
  episodeId: integer("episode_id").notNull().references(() => episodes.id),
  quality: text("quality").notNull(), // '360p', '480p', '720p', '1080p'
  url: text("url").notNull(),
  type: text("type").default("mp4"), // 'mp4', 'hls'
});

export const subtitles = pgTable("subtitles", {
  id: serial("id").primaryKey(),
  episodeId: integer("episode_id").notNull().references(() => episodes.id),
  language: text("language").notNull(), 
  url: text("url").notNull(),
  format: text("format").default("vtt"),
});

export const watchHistory = pgTable("watch_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  videoId: integer("video_id").notNull().references(() => videos.id),
  episodeId: integer("episode_id").notNull().references(() => episodes.id),
  progress: integer("progress").default(0), 
  lastWatched: timestamp("last_watched").defaultNow(),
});

export const watchlist = pgTable("watchlist", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  videoId: integer("video_id").notNull().references(() => videos.id),
  addedAt: timestamp("added_at").defaultNow(),
});

// === RELATIONS ===

export const usersRelations = relations(users, ({ many }) => ({
  watchHistory: many(watchHistory),
  watchlist: many(watchlist),
}));

export const videosRelations = relations(videos, ({ one, many }) => ({
  category: one(categories, {
    fields: [videos.categoryId],
    references: [categories.id],
  }),
  episodes: many(episodes),
  watchlist: many(watchlist),
  watchHistory: many(watchHistory),
}));

export const episodesRelations = relations(episodes, ({ one, many }) => ({
  video: one(videos, {
    fields: [episodes.videoId],
    references: [videos.id],
  }),
  sources: many(videoSources),
  subtitles: many(subtitles),
  watchHistory: many(watchHistory),
}));

export const videoSourcesRelations = relations(videoSources, ({ one }) => ({
  episode: one(episodes, {
    fields: [videoSources.episodeId],
    references: [episodes.id],
  }),
}));

export const subtitlesRelations = relations(subtitles, ({ one }) => ({
  episode: one(episodes, {
    fields: [subtitles.episodeId],
    references: [episodes.id],
  }),
}));

export const watchHistoryRelations = relations(watchHistory, ({ one }) => ({
  user: one(users, {
    fields: [watchHistory.userId],
    references: [users.id],
  }),
  video: one(videos, {
    fields: [watchHistory.videoId],
    references: [videos.id],
  }),
  episode: one(episodes, {
    fields: [watchHistory.episodeId],
    references: [episodes.id],
  }),
}));

export const watchlistRelations = relations(watchlist, ({ one }) => ({
  user: one(users, {
    fields: [watchlist.userId],
    references: [users.id],
  }),
  video: one(videos, {
    fields: [watchlist.videoId],
    references: [videos.id],
  }),
}));

// === INSERTS & TYPES ===

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;

export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export const insertVideoSchema = createInsertSchema(videos).omit({ id: true, createdAt: true, views: true });
export type InsertVideo = z.infer<typeof insertVideoSchema>;

export const insertEpisodeSchema = createInsertSchema(episodes).omit({ id: true, createdAt: true });
export type InsertEpisode = z.infer<typeof insertEpisodeSchema>;

export const insertVideoSourceSchema = createInsertSchema(videoSources).omit({ id: true });
export type InsertVideoSource = z.infer<typeof insertVideoSourceSchema>;

export const insertSubtitleSchema = createInsertSchema(subtitles).omit({ id: true });
export type InsertSubtitle = z.infer<typeof insertSubtitleSchema>;

export const insertWatchHistorySchema = createInsertSchema(watchHistory).omit({ id: true, lastWatched: true });
export type InsertWatchHistory = z.infer<typeof insertWatchHistorySchema>;

export const insertWatchlistSchema = createInsertSchema(watchlist).omit({ id: true, addedAt: true });
export type InsertWatchlist = z.infer<typeof insertWatchlistSchema>;

export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Video = typeof videos.$inferSelect;
export type Episode = typeof episodes.$inferSelect;
export type VideoSource = typeof videoSources.$inferSelect;
export type Subtitle = typeof subtitles.$inferSelect;
export type WatchHistory = typeof watchHistory.$inferSelect;
export type WatchlistItem = typeof watchlist.$inferSelect;

export type VideoWithCategory = Video & { category: Category | null };
export type VideoWithEpisodes = Video & { episodes: Episode[] };
export type EpisodeWithDetails = Episode & { sources: VideoSource[], subtitles: Subtitle[] };
