# RichaShared Experiences – A Personal Blog by Richard Sterling Jackson

A narrative‑driven technical journal built to explore ideas, thoughts,experiments, and shared experiences. There always lives a story behind the work. Shared Experiences blends engineering, creativity and design into a single space, my space, my voice.

This project represents my approach to building software: intentional, elegant, and personal.

---

## What's new (2026-02-10)

- Added Markdown/MDX support for posts (write rich content with components).
- Image upload support (configurable storage provider such as S3 / Cloudflare R2).
- Drafts, scheduled publishing, and post status (draft/published/scheduled).
- Full-text search powered by Postgres tsvector and serverless search API.
- Tags, series, and category improvements with pagination and archive pages.
- RSS feed and sitemap generation for better SEO and syndication.
- Admin UX improvements: autosave, preview, and activity log.
- Additional environment variables to support uploads and search (see "Environment" below).

---

## Features

- Dynamic Category System  
  Curated themes like Plans in Motion, Words and Charms, and Tools and Systems synced across Sidebar, Admin, and Category views.

- Admin Panel  
  Create, edit, and manage posts with versioning, featured flags, tag support, drafts, scheduled publish times, and category tagging. Autosave and preview while editing.

- Post Routing  
  Clean URLs for posts (`/posts/:slug`) and categories (`/category/:slug`) using React Router.

- Modular Architecture  
  Components, pages, and styles organized for clarity and scalability.

- Image uploads with optional CDN/public storage

- Typography & Styling  
  Elegant fonts (Playfair + Inter), soft UI, and emotionally resonant layout.

- Privacy-Conscious Design  
  No exposed emails, no broken links — every detail is intentional.

---

## Tech Stack

Frontend
- React + Vite Fast, modern development environment
- TypeScript Type‑safe components, forms, and API interactions
- Zod + React Hook Form Schema‑driven validation and ergonomic form handling
- Tailwind CSS + ShadCN UI Utility‑first styling with accessible, composable components
- React Router Declarative routing for posts, categories, and admin views
- Slugify Logic Clean, predictable URLs for posts

Backend
- Neon Postgres — Serverless, scalable Postgres database
- Vercel Serverless Functions — API routes for full CRUD operations
- @neondatabase/serverless — Lightweight SQL client for serverless environments
- UUID — Unique ID generation for posts
- Versioning & Timestamps — Automatic version increments and audit-friendly metadata
- Real Database Persistence — No localStorage; all posts stored in Postgres
- Postgres full-text search (tsvector) for quick search results

Deployment
- Vercel — Hosting, serverless execution, environment variables
- Neon — Cloud Postgres with pooling, SSL, and zero‑config scaling

Data Flow
Admin Panel → API Routes → Neon Postgres → API → Frontend
- The admin panel sends JSON to /api/posts
- Serverless functions validate, map, and persist data
- Neon stores posts with timestamps and versioning
- The frontend fetches live data from the API
- Slugs ensure clean, stable URLs

---

## Security & Admin Authentication

### Token-Based Access Control (Runtime Entry)

The Admin Panel uses **runtime token entry** for maximum security:

**How it works:**
1. User navigates to `/admin` and sees a login gate
2. User enters the admin token (stored in server `ADMIN_TOKEN` env var)
3. Token is stored in `sessionStorage` after entry
4. For each request (POST, PUT, DELETE), token is sent in `Authorization: Bearer <token>` header
5. Server validates token against `ADMIN_TOKEN` environment variable

**Why this approach?**
- Token is **never embedded in source code or build bundles** — not visible to dev tools observers or source inspection
- Token is **only stored in sessionStorage** after user enters it — requires someone to have the password in the first place
- Even if someone opens dev tools, they won't see a pre-configured token, only what they (the user) entered
- Works seamlessly with Vercel's stateless serverless architecture
- Session expires on browser close (sessionStorage cleared)

### Local Development

1. **Edit `.env`** (created from `.env.example`):
   ```
   ADMIN_TOKEN=bluesky7
   ```

2. **Run the dev server**:
   ```bash
   npm run dev
   ```

3. **Access `/admin`**:
   - Vite serves the app at `http://localhost:8080/admin`
   - Enter the token from `.env` at the login gate
   - Admin panel loads, token stored in sessionStorage

### Production (Vercel)

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables

2. **Add one secret:**
   - **Name:** `ADMIN_TOKEN`  
     **Value:** (your memorable password, e.g., `bluesky7`, `SecurePass123!`)  
     **Environments:** Production, Preview (or all)

3. **Redeploy**  
   Vercel will use this secret for your serverless functions.

4. **Users access `/admin`:**
   - Enter the `ADMIN_TOKEN` value you set in Vercel
   - Token stays in their sessionStorage for the session

### Token Best Practices

- **Length:** Any length; focus on strength (memorable but not guessable)
- **Rotation:** Change tokens periodically or when someone leaves the project
- **Storage:** Keep in Vercel secrets, `.env` locally, never in code/bundles
- **Sharing:** If sharing access, use separate tokens per collaborator
- **Audit:** Log token usage in your serverless functions if needed

### Security Layers

| Layer | What | Where Checked |
|-------|------|---------------|
| **Runtime entry** | Token entered at login, not pre-configured | `src/pages/Admin.tsx` login gate |
| **SessionStorage** | Token stored client-side only after entry | Browser sessionStorage (auto-cleared on close) |
| **HTTPS** | Encryption in transit | Vercel (automatic) |
| **Token validation** | `ADMIN_TOKEN` == header `Authorization` | `api/_helpers/auth.ts` |
| **Request origin** | CORS (optional, recommended) | Vercel serverless |
| **Database auth** | Neon connection string with SSL | `api/posts/db.ts` |

---

👈 [Back to Portfolio Overview](../README.md)

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

---

## Folder Structure

```bash
api/
  posts/
    db.ts        # Neon connection
    index.ts     # GET all, POST create
    id.ts        # GET one, PUT update, DELETE remove

src/
  components/    # Reusable UI components
  pages/         # Route-based views
  data/          # Types and category definitions
  lib/           # Post store and helpers
  styles/        # Global Tailwind + design system
```

---

Author
Richard Sterling Jackson Full-stack engineer, Scada & Controls engineer, and narrative designer. Building elegant, emotionally resonant technical solutions.

---

👈 [Back to Portfolio Overview](../README.md)