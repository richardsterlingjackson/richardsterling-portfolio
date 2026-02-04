# RichaShared Experiences – A Personal Blog by Richard Sterling Jackson

A narrative‑driven technical journal built to explore ideas, thoughts,experiments, and shared experiences. There always lives a story behind the work. Shared Experiences blends engineering, creativity and design into a single space, my space, my voice.

This project represents my approach to building software: intentional, elegant, and personal.

---

## Features

- Dynamic Category System  
  Curated themes like Plans in Motion, Words and Charms, and Tools and Systems — synced across Sidebar, Admin, and Category views.

- Admin Panel  
  Create, edit, and manage posts with versioning, featured flags, and category tagging.

- Post Routing  
  Clean URLs for posts (`/posts/:slug`) and categories (`/category/:slug`) using React Router.

- Modular Architecture  
  Components, pages, and styles organized for clarity and scalability.

- Typography & Styling  
  Elegant fonts (Playfair + Inter), soft UI, and emotionally resonant layout.

- Privacy-Conscious Design  
  No exposed emails, no broken links — every detail is intentional.

---

## Tech Stack

Frontend
- React + Vite — Fast, modern development environment
- TypeScript — Type‑safe components, forms, and API interactions
- Zod + React Hook Form — Schema‑driven validation and ergonomic form handling
- Tailwind CSS + ShadCN UI — Utility‑first styling with accessible, composable components
- React Router — Declarative routing for posts, categories, and admin views
- Slugify Logic — Clean, predictable URLs for posts

Backend
- Neon Postgres — Serverless, scalable Postgres database
- Vercel Serverless Functions — API routes for full CRUD operations
- @neondatabase/serverless — Lightweight SQL client for serverless environments
- UUID — Unique ID generation for posts
- Versioning & Timestamps — Automatic version increments and audit-friendly metadata
- Real Database Persistence — No localStorage; all posts stored in Postgres

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