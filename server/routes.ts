import passport from "passport";
import { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth } from "./auth";
import { insertVideoSchema, insertEpisodeSchema, categories, videos, episodes } from "@shared/schema";
import { db } from "./db";

import { hashPassword } from "./auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth (Passport)
  setupAuth(app);

  // === Auth ===
  app.post(api.auth.register.path, async (req, res) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword
      });
      
      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: "Login failed after registration" });
        return res.status(201).json(user);
      });
    } catch (err) {
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post(api.auth.login.path, passport.authenticate("local"), (req, res) => {
    res.json(req.user);
  });

  app.post(api.auth.logout.path, (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get(api.auth.me.path, (req, res) => {
    res.json(req.user || null);
  });

  // === Videos ===
  app.get(api.videos.list.path, async (req, res) => {
    const { category, search, featured } = req.query;
    const videos = await storage.getVideos(
      category as string,
      search as string,
      featured === 'true'
    );
    res.json(videos);
  });

  app.get(api.videos.get.path, async (req, res) => {
    const video = await storage.getVideo(Number(req.params.id));
    if (!video) return res.status(404).json({ message: "Video not found" });
    
    // Fetch relations
    const episodes = await storage.getEpisodes(video.id);
    const categoryId = video.categoryId;
    // We need to fetch category manually or implement a getCategoryById if not joined
    // For now, let's assume we can fetch all categories and find it, or add getCategory method
    // Optimally: storage.getVideo should return relations.
    // Let's keep it simple: return video + episodes.
    
    // Quick fix: fetch category name (optional for MVP)
    const category = (await storage.getCategories()).find(c => c.id === video.categoryId) || null;

    res.json({ ...video, category, episodes });
  });

  app.post(api.videos.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const video = await storage.createVideo(req.body);
    res.status(201).json(video);
  });

  // === Episodes ===
  app.get(api.episodes.list.path, async (req, res) => {
    const episodes = await storage.getEpisodes(Number(req.params.videoId));
    res.json(episodes);
  });

  app.get(api.episodes.get.path, async (req, res) => {
    const episode = await storage.getEpisode(Number(req.params.id));
    if (!episode) return res.status(404).json({ message: "Episode not found" });
    res.json({ ...episode, sources: [], subtitles: [] });
  });

  // === Categories ===
  app.get(api.categories.list.path, async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  // === Watchlist ===
  app.get(api.watchlist.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const items = await storage.getWatchlist(req.user!.id);
    res.json(items);
  });

  app.post(api.watchlist.add.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const item = await storage.addToWatchlist(req.user!.id, req.body.videoId);
    res.status(201).json(item);
  });

  app.delete(api.watchlist.remove.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    await storage.removeFromWatchlist(req.user!.id, Number(req.params.videoId));
    res.sendStatus(200);
  });

  // === History ===
  app.get(api.history.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const history = await storage.getWatchHistory(req.user!.id);
    res.json(history);
  });

  app.post(api.history.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const history = await storage.updateWatchHistory({
      ...req.body,
      userId: req.user!.id
    });
    res.json(history);
  });
  
  // Seed Data Endpoint (Auto-run on start typically, but exposed here for testing)
  await seedData();

  return httpServer;
}

async function seedData() {
  const cats = await storage.getCategories();
  if (cats.length === 0) {
    console.log("Seeding data...");
    // 1. Categories
    const categoriesList = [
      { name: "Drama", slug: "drama" },
      { name: "Movie", slug: "movie" },
      { name: "Anime", slug: "anime" },
      { name: "Variety", slug: "variety" },
      { name: "Documentary", slug: "documentary" }
    ];
    
    // Use db directly for seeding
    const insertedCats = await db.insert(categories).values(categoriesList).returning();
    
    // 2. Videos (Mock Data)
    const dramaCat = insertedCats.find((c: any) => c.slug === "drama");
    const animeCat = insertedCats.find((c: any) => c.slug === "anime");
    
    if (dramaCat) {
      const [v1] = await db.insert(videos).values({
        title: "The Long Ballad",
        description: "A historical drama about a princess seeking revenge.",
        posterUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&q=80",
        bannerUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&q=80",
        rating: 9.2,
        year: 2023,
        country: "China",
        categoryId: dramaCat.id,
        isFeatured: true,
        isVip: true
      }).returning();
      
      // Episodes
      await db.insert(episodes).values([
        { videoId: v1.id, title: "Episode 1", episodeNumber: 1, sourceUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", duration: 2400 },
        { videoId: v1.id, title: "Episode 2", episodeNumber: 2, sourceUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", duration: 2400 },
      ]);
    }
    
    if (animeCat) {
       const [v2] = await db.insert(videos).values({
        title: "Demon Slayer",
        description: "A young boy fights demons to save his sister.",
        posterUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&q=80",
        bannerUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&q=80",
        rating: 9.8,
        year: 2022,
        country: "Japan",
        categoryId: animeCat.id,
        isFeatured: true,
        isVip: false
      }).returning();

      await db.insert(episodes).values([
        { videoId: v2.id, title: "Cruelty", episodeNumber: 1, sourceUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", duration: 1500 },
      ]);
    }
  }
}
