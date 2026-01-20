import { z } from 'zod';
import { 
  insertUserSchema, 
  insertVideoSchema, 
  insertEpisodeSchema, 
  insertWatchHistorySchema,
  insertWatchlistSchema,
  users, 
  videos, 
  episodes, 
  categories, 
  watchHistory, 
  watchlist 
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/register',
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/login',
      input: z.object({ username: z.string(), password: z.string() }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout',
      responses: {
        200: z.void(),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/user',
      responses: {
        200: z.custom<typeof users.$inferSelect | null>(),
      },
    },
  },
  videos: {
    list: {
      method: 'GET' as const,
      path: '/api/videos',
      input: z.object({
        category: z.string().optional(),
        search: z.string().optional(),
        featured: z.boolean().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof videos.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/videos/:id',
      responses: {
        200: z.custom<typeof videos.$inferSelect & { category: typeof categories.$inferSelect | null, episodes: typeof episodes.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/videos',
      input: insertVideoSchema,
      responses: {
        201: z.custom<typeof videos.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  episodes: {
    get: {
      method: 'GET' as const,
      path: '/api/episodes/:id',
      responses: {
        200: z.custom<typeof episodes.$inferSelect & { sources: any[], subtitles: any[] }>(),
        404: errorSchemas.notFound,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/videos/:videoId/episodes',
      responses: {
        200: z.array(z.custom<typeof episodes.$inferSelect>()),
      },
    },
  },
  categories: {
    list: {
      method: 'GET' as const,
      path: '/api/categories',
      responses: {
        200: z.array(z.custom<typeof categories.$inferSelect>()),
      },
    },
  },
  watchlist: {
    list: {
      method: 'GET' as const,
      path: '/api/watchlist',
      responses: {
        200: z.array(z.custom<typeof watchlist.$inferSelect & { video: typeof videos.$inferSelect }>()),
      },
    },
    add: {
      method: 'POST' as const,
      path: '/api/watchlist',
      input: z.object({ videoId: z.number() }),
      responses: {
        201: z.custom<typeof watchlist.$inferSelect>(),
      },
    },
    remove: {
      method: 'DELETE' as const,
      path: '/api/watchlist/:videoId',
      responses: {
        200: z.void(),
      },
    },
  },
  history: {
    update: {
      method: 'POST' as const,
      path: '/api/history',
      input: insertWatchHistorySchema,
      responses: {
        200: z.custom<typeof watchHistory.$inferSelect>(),
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/history',
      responses: {
        200: z.array(z.custom<typeof watchHistory.$inferSelect & { video: typeof videos.$inferSelect, episode: typeof episodes.$inferSelect }>()),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
