import passport from "passport";
import { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth } from "./auth";
import { insertVideoSchema, insertEpisodeSchema, categories, videos, episodes, videoSources, subtitles } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

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

  app.patch("/api/videos/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const id = Number(req.params.id);
    const video = await storage.updateVideo(id, req.body);
    if (!video) return res.status(404).json({ message: "Video not found" });
    res.json(video);
  });

  app.delete("/api/videos/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const id = Number(req.params.id);
    await storage.deleteVideo(id);
    res.sendStatus(200);
  });

  // === Episodes ===
  app.get(api.episodes.list.path, async (req, res) => {
    const episodes = await storage.getEpisodes(Number(req.params.videoId));
    res.json(episodes);
  });

  app.get(api.episodes.get.path, async (req, res) => {
    const episode = await storage.getEpisode(Number(req.params.id));
    if (!episode) return res.status(404).json({ message: "Episode not found" });
    
    // Fetch sources and subtitles
    const sources = await db.select().from(videoSources).where(eq(videoSources.episodeId, episode.id));
    const subs = await db.select().from(subtitles).where(eq(subtitles.episodeId, episode.id));
    
    res.json({ ...episode, sources, subtitles: subs });
  });

  // === Categories ===
  app.get(api.categories.list.path, async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  // === Watchlist ===
  app.get(api.watchlist.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const user = req.user as any;
    const items = await storage.getWatchlist(user.id);
    res.json(items);
  });

  app.post(api.watchlist.add.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const user = req.user as any;
    const item = await storage.addToWatchlist(user.id, req.body.videoId);
    res.status(201).json(item);
  });

  app.delete(api.watchlist.remove.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const user = req.user as any;
    await storage.removeFromWatchlist(user.id, Number(req.params.videoId));
    res.sendStatus(200);
  });

  // === History ===
  app.get(api.history.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const user = req.user as any;
    const history = await storage.getWatchHistory(user.id);
    res.json(history);
  });

  app.post(api.history.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const user = req.user as any;
    const history = await storage.updateWatchHistory({
      ...req.body,
      userId: user.id
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
      await db.insert(videos).values([
        {
          title: "Blossoms in Adversity",
          description: "Hu Yitian and Zhang Jingyi turn the table. A down-and-out girl becomes the richest person.",
          posterUrl: "https://m.ykimg.com/058400006843FF361409CB111BDBD094?x-oss-process=image/resize,w_385/interlace,1/quality,Q_80",
          bannerUrl: "http://liangcang-material.alicdn.com/prod/upload/4b7015edb77445ee8e98573b9315286b.webp.png",
          rating: 9.5,
          year: 2024,
          country: "China",
          categoryId: dramaCat.id,
          isFeatured: true,
          isVip: true
        },
        {
          title: "The Seven Relics of ill Omen",
          description: "A mysterious journey through ancient relics.",
          posterUrl: "https://m.ykimg.com/058400006843FF361409CB111BDBD094?x-oss-process=image/resize,w_385/interlace,1/quality,Q_80",
          bannerUrl: "https://m.ykimg.com/058400006843FF361409CB111BDBD094?x-oss-process=image/resize,w_1200",
          rating: 9.1,
          year: 2024,
          country: "China",
          categoryId: dramaCat.id,
          isFeatured: false,
          isVip: true
        },
        {
          title: "Love After Eternity",
          description: "A romance that spans lifetimes.",
          posterUrl: "https://m.ykimg.com/05840000695DFEE47B519718FC00D18A?x-oss-process=image/resize,w_385/interlace,1/quality,Q_80",
          bannerUrl: "https://m.ykimg.com/05840000695DFEE47B519718FC00D18A?x-oss-process=image/resize,w_1200",
          rating: 9.3,
          year: 2024,
          country: "China",
          categoryId: dramaCat.id,
          isFeatured: false,
          isVip: true
        }
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

      const [ep1] = await db.insert(episodes).values([
        { videoId: v2.id, title: "Cruelty", episodeNumber: 1, sourceUrl: "https://cffaws.wetvinfo.com/svp_50217/01B608D3B0BBD929B555269C00B4BC237C0A89F33808997C43849CA6A84BA1BD15F9C909DC117110E95DB9B38949863D37FF9D3BF79DA6AF32D91408E982229F647F495C694EC7D7748E84B8AEAB3812254B6348DA64954DBC32C7566F98A7A98CBB3EC53E492A744D49C4CB3F6940B73AE344789482FA2182DCEAFA495A8796A6/gzc_1000207_0bcaweataaabweafcgtf3zusrmoegc6qcnka.f321004.ts.m3u8?ver=4", duration: 1500 },
      ]).returning();

      await db.insert(videoSources).values([
        { episodeId: ep1.id, quality: "1080p", url: "https://cffaws.wetvinfo.com/svp_50217/01B608D3B0BBD929B555269C00B4BC237C0A89F33808997C43849CA6A84BA1BD15F9C909DC117110E95DB9B38949863D37FF9D3BF79DA6AF32D91408E982229F647F495C694EC7D7748E84B8AEAB3812254B6348DA64954DBC32C7566F98A7A98CBB3EC53E492A744D49C4CB3F6940B73AE344789482FA2182DCEAFA495A8796A6/gzc_1000207_0bcaweataaabweafcgtf3zusrmoegc6qcnka.f321004.ts.m3u8?ver=4", type: "hls" },
        { episodeId: ep1.id, quality: "720p", url: "https://cffaws.wetvinfo.com/svp_50217/01B608D3B0BBD929B555269C00B4BC237C0A89F33808997C43849CA6A84BA1BD15F9C909DC117110E95DB9B38949863D37FF9D3BF79DA6AF32D91408E982229F647F495C694EC7D7748E84B8AEAB38122567B64336EAFD160DC2F94EF697AA7CB2E88749B7C24632585EFAFF895AB70C1E4B846D2B065834A7A68BACF1C0CA20F9/gzc_1000207_0bcaweataaabweafcgtf3zusrmoegc6qcnka.f321003.ts.m3u8?ver=4", type: "hls" },
        { episodeId: ep1.id, quality: "480p", url: "https://cffaws.wetvinfo.com/svp_50217/01B608D3B0BBD929B555269C00B4BC237C0A89F33808997C43849CA6A84BA1BD15F9C909DC117110E95DB9B38949863D37FF9D3BF79DA6AF32D91408E982229F647F495C694EC7D7748E84B8AEAB3812253040D48C9B756929B641883009DC4F3CDCAF4CA5CAEB24740DF6DD2D00E46E7232B58AAB8530FB6D9A8C7453F0135896/gzc_1000207_0bcaweataaabweafcgtf3zusrmoegc6qcnka.f321002.ts.m3u8?ver=4", type: "hls" },
        { episodeId: ep1.id, quality: "360p", url: "https://cffaws.wetvinfo.com/svp_50217/01B608D3B0BBD929B555269C00B4BC237C0A89F33808997C43849CA6A84BA1BD15F9C909DC117110E95DB9B38949863D37FF9D3BF79DA6AF32D91408E982229F647F495C694EC7D7748E84B8AEAB381225CFA5FFBDCF1003FB5BDC4BFF407C4D13F5FCB42DAEB322535087A6F76C85FB2806A05C641E3C9AA83861F2A4EE5E75F8/gzc_1000207_0bcaweataaabweafcgtf3zusrmoegc6qcnka.f321001.ts.m3u8?ver=4", type: "hls" },
      ]);

      await db.insert(subtitles).values([
        { episodeId: ep1.id, language: "ID", url: "https://cffaws.wetvinfo.com/svp_50217/gzc_1000207_0bcaweataaabweafcgtf3zusrmoegc6qcnka.f51708000.srt?vkey=01EE006AEC01F022633C886C6E119816F9C862C378705642939F5240A1AD4CB7BE59C4EA6CC113149A08AF36BB4162CAE97CB700E400C35F2B80B25450671472069BEE546DAF141D64568CE0651E8A844147B1C499DFF0E68F9DBB41B32AE98ECA592EC3052D83C4F7C6E8ABA48402B65DC8714828E97BAD9C7BC6F234EAD96D9A", format: "srt" },
        { episodeId: ep1.id, language: "EN", url: "https://cffaws.wetvinfo.com/svp_50217/gzc_1000207_0bcaweataaabweafcgtf3zusrmoegc6qcnka.f51703000.srt?vkey=01EE006AEC01F022633C886C6E119816F9C862C378705642939F5240A1AD4CB7BE59C4EA6CC113149A08AF36BB4162CAE97CB700E400C35F2B80B25450671472069BEE546DAF141D64568CE0651E8A844101DA79E40C099821741EBB8705D354CCC229D1FE7F40EC0A9C889905D9BB0FA284EEA74D05CFDCF1DF60B82EFA4DA671", format: "srt" },
      ]);
    }
  }
}
