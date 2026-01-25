import { db } from "./db";
import { 
  users, videos, episodes, categories, watchHistory, watchlist, videoSources, subtitles, actors, videoActors,
  type User, type InsertUser, type Video, type InsertVideo, 
  type Episode, type InsertEpisode, type WatchHistory, type InsertWatchHistory,
  type WatchlistItem, type Category, type InsertCategory, type Actor, type InsertActor
} from "@shared/schema";
import { eq, desc, and, ilike } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Auth
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Videos
  getVideos(category?: string, search?: string, featured?: boolean): Promise<Video[]>;
  getVideo(id: number): Promise<Video | undefined>;
  createVideo(video: InsertVideo): Promise<Video>;
  updateVideo(id: number, video: Partial<InsertVideo>): Promise<Video | undefined>;
  deleteVideo(id: number): Promise<void>;
  
  // Episodes
  getEpisodes(videoId: number): Promise<Episode[]>;
  getEpisode(id: number): Promise<Episode | undefined>;
  createEpisode(episode: InsertEpisode): Promise<Episode>;
  updateEpisode(id: number, episode: Partial<InsertEpisode>): Promise<Episode | undefined>;
  deleteEpisode(id: number): Promise<void>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<void>;
  
  // User Data
  getWatchHistory(userId: number): Promise<(WatchHistory & { video: Video, episode: Episode })[]>;
  updateWatchHistory(history: InsertWatchHistory): Promise<WatchHistory>;
  
  getWatchlist(userId: number): Promise<(WatchlistItem & { video: Video })[]>;
  addToWatchlist(userId: number, videoId: number): Promise<WatchlistItem>;
  removeFromWatchlist(userId: number, videoId: number): Promise<void>;
  
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // Auth
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Videos
  async getVideos(categorySlug?: string, search?: string, featured?: boolean): Promise<Video[]> {
    let query = db.select().from(videos);
    
    if (categorySlug) {
      // Join would be better, but doing simple filtering for MVP
      const category = await this.getCategoryBySlug(categorySlug);
      if (category) {
        query.where(eq(videos.categoryId, category.id));
      }
    }
    
    if (featured) {
      query.where(eq(videos.isFeatured, true));
    }
    
    if (search) {
      query.where(ilike(videos.title, `%${search}%`));
    }
    
    return await query.orderBy(desc(videos.createdAt));
  }

  async getVideo(id: number): Promise<Video | undefined> {
    const [video] = await db.select().from(videos).where(eq(videos.id, id));
    return video;
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const [video] = await db.insert(videos).values(insertVideo).returning();
    return video;
  }

  async updateVideo(id: number, video: Partial<InsertVideo>): Promise<Video | undefined> {
    const [updated] = await db.update(videos).set(video).where(eq(videos.id, id)).returning();
    return updated;
  }

  async deleteVideo(id: number): Promise<void> {
    await db.delete(videos).where(eq(videos.id, id));
  }

  // Episodes
  async getEpisodes(videoId: number): Promise<Episode[]> {
    return await db.select().from(episodes)
      .where(eq(episodes.videoId, videoId))
      .orderBy(episodes.episodeNumber);
  }

  async getEpisode(id: number): Promise<Episode | undefined> {
    const [episode] = await db.select().from(episodes).where(eq(episodes.id, id));
    return episode;
  }

  async createEpisode(insertEpisode: InsertEpisode): Promise<Episode> {
    const [episode] = await db.insert(episodes).values(insertEpisode).returning();
    return episode;
  }

  async updateEpisode(id: number, episode: Partial<InsertEpisode>): Promise<Episode | undefined> {
    const [updated] = await db.update(episodes).set(episode).where(eq(episodes.id, id)).returning();
    return updated;
  }

  async deleteEpisode(id: number): Promise<void> {
    await db.delete(episodes).where(eq(episodes.id, id));
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(insertCategory).returning();
    return category;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updated] = await db.update(categories).set(category).where(eq(categories.id, id)).returning();
    return updated;
  }

  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Actors
  async getActors(): Promise<Actor[]> {
    return await db.select().from(actors);
  }

  async createActor(insertActor: InsertActor): Promise<Actor> {
    const [actor] = await db.insert(actors).values(insertActor).returning();
    return actor;
  }

  async updateActor(id: number, actor: Partial<InsertActor>): Promise<Actor | undefined> {
    const [updated] = await db.update(actors).set(actor).where(eq(actors.id, id)).returning();
    return updated;
  }

  async deleteActor(id: number): Promise<void> {
    await db.delete(actors).where(eq(actors.id, id));
  }

  async createActor(insertActor: InsertActor): Promise<Actor> {
    const [actor] = await db.insert(actors).values(insertActor).returning();
    return actor;
  }

  async updateActor(id: number, actor: Partial<InsertActor>): Promise<Actor | undefined> {
    const [updated] = await db.update(actors).set(actor).where(eq(actors.id, id)).returning();
    return updated;
  }

  async deleteActor(id: number): Promise<void> {
    await db.delete(actors).where(eq(actors.id, id));
  }

  // Watch History
  async getWatchHistory(userId: number): Promise<(WatchHistory & { video: Video, episode: Episode })[]> {
    // Basic join simulation or use drizzle relations in query if setup
    // For simplicity in storage implementation, let's assume direct join logic via ORM
    const history = await db.query.watchHistory.findMany({
      where: eq(watchHistory.userId, userId),
      with: {
        video: true,
        episode: true
      },
      orderBy: desc(watchHistory.lastWatched),
      limit: 20
    });
    return history;
  }

  async updateWatchHistory(item: InsertWatchHistory): Promise<WatchHistory> {
    // Upsert logic
    const existing = await db.select().from(watchHistory).where(
      and(
        eq(watchHistory.userId, item.userId),
        eq(watchHistory.videoId, item.videoId),
        eq(watchHistory.episodeId, item.episodeId)
      )
    );

    if (existing.length > 0) {
      const [updated] = await db.update(watchHistory)
        .set({ ...item, lastWatched: new Date() })
        .where(eq(watchHistory.id, existing[0].id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(watchHistory).values(item).returning();
      return created;
    }
  }

  // Watchlist
  async getWatchlist(userId: number): Promise<(WatchlistItem & { video: Video })[]> {
    return await db.query.watchlist.findMany({
      where: eq(watchlist.userId, userId),
      with: {
        video: true
      },
      orderBy: desc(watchlist.addedAt)
    });
  }

  async addToWatchlist(userId: number, videoId: number): Promise<WatchlistItem> {
    const [item] = await db.insert(watchlist).values({ userId, videoId }).returning();
    return item;
  }

  async removeFromWatchlist(userId: number, videoId: number): Promise<void> {
    await db.delete(watchlist).where(
      and(eq(watchlist.userId, userId), eq(watchlist.videoId, videoId))
    );
  }
}

export const storage = new DatabaseStorage();
