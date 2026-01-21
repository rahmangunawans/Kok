# Youku-Style Video Streaming Platform

## Overview

A video streaming platform inspired by Youku, built with a modern React frontend and Express backend. The application provides features for browsing video content by category, watching episodes with HLS/MP4 playback, user authentication, watch history tracking, and an admin panel for content management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state caching and synchronization
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Video Playback**: react-player for HLS and MP4 video handling
- **Animations**: Embla Carousel for hero banners with autoplay
- **Form Handling**: React Hook Form with Zod validation via @hookform/resolvers

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Authentication**: Passport.js with local strategy, session-based auth using express-session
- **Password Security**: Scrypt hashing with timing-safe comparison
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple
- **API Design**: RESTful endpoints defined in shared/routes.ts with Zod schemas for type-safe validation

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Definition**: Centralized in shared/schema.ts using drizzle-zod for automatic Zod schema generation
- **Database**: PostgreSQL (requires DATABASE_URL environment variable)

### Build System
- **Development**: Vite with React plugin, HMR via custom server integration
- **Production**: esbuild for server bundling, Vite for client build
- **Path Aliases**: `@/` for client/src, `@shared/` for shared directory

### Key Design Patterns
- **Shared Types**: Schema and route definitions shared between client and server for type safety
- **Storage Interface**: IStorage interface in server/storage.ts abstracts database operations
- **API Contract**: Routes defined with Zod schemas for input validation and response typing

## External Dependencies

### Database
- **PostgreSQL**: Primary database for all application data
- **Environment Variable**: `DATABASE_URL` must be set with connection string
- **Session Storage**: PostgreSQL-backed session store for authentication

### Third-Party UI Libraries
- **Radix UI**: Headless component primitives (dialogs, dropdowns, forms, etc.)
- **shadcn/ui**: Pre-styled component collection built on Radix
- **Lucide React**: Icon library

### Media Handling
- **react-player**: Video playback supporting multiple formats including HLS
- **embla-carousel-react**: Touch-friendly carousel for featured content

### Development Tools
- **Replit Plugins**: vite-plugin-runtime-error-modal, vite-plugin-cartographer, vite-plugin-dev-banner (development only)