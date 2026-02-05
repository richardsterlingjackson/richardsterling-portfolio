# Copilot instructions for this repository

This is a monorepo of independent, standalone projects. Each folder is a self-contained app—pick the project folder you need and run that project's scripts.

Quick architecture notes
- Top-level: many small apps (Angular, React/Vite, Node, Python, C++, Java). See the root `README.md` for the project list.
- React/Vite apps: `creative-blog`, `shared-experiences`, `simple-front-end`, `shared-*` use Vite + Tailwind + ShadCN UI.
- Angular apps: `counter`, `people-directory`, `profile-card`, `user-directory`, `weather-app`, `simple-to-do-list` use Angular CLI (`angular.json`).
- Node backends: `people-directory/backend` (Express + Mongoose). Many frontends expect a local backend or serverless functions.
- Serverless/Vercel: `shared-experiences/api/*` are Vercel serverless functions that call Neon Postgres via `@neondatabase/serverless`.

How to run (concrete examples)
- React/Vite app (example: `shared-experiences`):
  - cd shared-experiences
  - npm install
  - npm run dev
  - Build: `npm run build`, Preview: `npm run preview`
- Angular app (example: `counter`):
  - cd counter
  - npm install
  - npm start   # runs `ng serve`
  - Build: `npm run build`, Test: `npm run test`
- Node backend (example: `people-directory/backend`):
  - cd people-directory/backend
  - npm install
  - set MONGO_URI=<mongo connection string> (Windows CMD) or `export MONGO_URI=...` (bash)
  - node server.js
- Vercel serverless (example: `shared-experiences/api`):
  - These files are real serverless routes; local dev via `npm run dev` in the parent Vite app will proxy to them when configured. They require `DATABASE_URL` env var (Neon). See `api/posts/db.ts`.
- C++ CLI (example: `cpp_user_database`):
  - Use MSYS2 / MINGW64 on Windows
  - pacman -S mingw-w64-x86_64-gcc mingw-w64-x86_64-sqlite3
  - g++ -o app main.cpp Database.cpp User.cpp -lsqlite3
  - ./app

Project-specific conventions & patterns
- Each project is standalone—always check `package.json` and `README.md` inside the folder for exact scripts and notes.
- Vite React apps use `tailwind.config.ts`, `vite.config.ts`, and `@vitejs/plugin-react-swc`.
- Shared-experiences uses serverless API routes under `shared-experiences/api` and expects `DATABASE_URL` in environment when executing DB calls.
- Backend services expect environment variables (e.g. `MONGO_URI` in `people-directory/backend/server.js`).
- Code style: ESLint used in Vite projects (`npm run lint`). Angular projects rely on Angular CLI formatting/configs.
- Data handling: `shared-experiences/api/posts/index.ts` demonstrates slug generation, strict required-field checks, and SQL parameterization via the `sql` helper.

Where to look first
- `README.md` (repo root) — overview and project list.
- `package.json` in each folder — authoritative scripts.
- `angular.json`, `tsconfig.*` — Angular project config.
- `vite.config.ts`, `tailwind.config.ts` — Vite/React config.
- `shared-experiences/api/*` — serverless API examples and DB integration (`db.ts` shows `DATABASE_URL` dependency).
- `people-directory/backend/server.js` and `people-directory/backend/routes` — Express + Mongoose backend example (requires `MONGO_URI`).

Common gotchas for agents
- Do not assume a single root build command; run per-project `npm install` and the local script named in that project's `package.json`.
- If touching serverless code in `shared-experiences/api`, remember to set `DATABASE_URL` locally when running or use Vercel secrets when deploying.
- For Angular work, prefer the Angular CLI scripts (`npm start`, `npm run build`) rather than manually invoking `ng` unless needed.

If anything is unclear or you want more detail for a specific project (examples: `shared-experiences` serverless flow, `people-directory` full-stack flow, or C++ build), tell me which project and I will expand this file with exact file links and extra examples.
