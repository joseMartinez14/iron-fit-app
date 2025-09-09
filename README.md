Iron Fit — Admin Dashboard and API
=================================

Iron Fit is a small admin dashboard and JSON API for managing fitness studio operations — clients, class sessions, reservations, and payments. It’s designed for two audiences:

- Studio admins: authenticated via Clerk to manage data in a simple dashboard UI
- Client-facing apps: consume a public, CORS‑enabled `/api/v1/*` for class discovery and reservations


Tech Stack
----------
- Next.js 15 (App Router)
- React 19 + TypeScript
- Tailwind CSS 4
- Clerk for authentication (admin portal)
- Prisma ORM
- bcryptjs for credential hashing


Project Highlights
------------------
- Admin‑only APIs under `/api/protected/**` are enforced by `src/middleware.ts` using Clerk.
- Public client APIs under `/api/v1/**` include CORS so external apps (e.g. Vite on port 5173) can call the endpoints.
- Simple landing page at `/` and a basic “not admin yet” page at `/not-admin` for newly created users.


Key API Routes (public `/api/v1`)
---------------------------------
- `POST /api/v1/auth` — Authenticate a client by `username` and `password`; returns `clientId` on success.
- `GET /api/v1/classes` — List available classes (server filters can be applied via query params; see source).
- `GET /api/v1/classes/[id]` — Class details including capacity, participants, and user status.
- `POST /api/v1/classes/[id]/reservations` — Reserve a spot for the authenticated client.
- `DELETE /api/v1/classes/[id]/reservations/current` — Cancel current user’s reservation for the class.
- `DELETE /api/v1/reservations/[reservation_id]` — Cancel a specific reservation by id.

Admin APIs (protected `/api/protected`)
--------------------------------------
- Clients: create, update, list, and group clients.
- Classes: create, update, and read class sessions.
- Payments: record and fetch payments.

All of the above routes require a signed‑in Clerk user who is present in the `admin` table and is active.


Authentication and Authorization
--------------------------------
- Clerk handles session/auth for the admin dashboard and protected APIs.
- `src/middleware.ts` uses Clerk’s `clerkMiddleware` with a matcher to require auth only for `/api/protected/**`.
- Admin status is validated in `src/app/api/service.ts` via Prisma lookups.
- Non‑admin signed‑in users can be redirected or shown `/not-admin` until an admin enables them.


CORS
----
- CORS is applied by `src/middleware.ts` to all routes except `/api/protected/**`.
- Allowed origins default to `http://localhost:5173` and `http://localhost:3000`. Configure via `CORS_ALLOWED_ORIGINS` or `NEXT_PUBLIC_ALLOWED_ORIGINS` (comma‑separated).
- Preflight `OPTIONS` is handled with `204` and headers; credentials are allowed.


Database
--------
- Prisma models live under `prisma/` and are accessed through `@/lib/prisma`.
- Set `DATABASE_URL` in `.env` to your Postgres/MySQL/SQLite connection string.
- Typical local workflow:
  - `npx prisma generate`
  - `npx prisma migrate dev` (creates/updates your schema)


Local Development
-----------------
1. Install dependencies: `npm install`
2. Set environment variables in `.env` (see below)
3. Run the dev server: `npm run dev`
4. Visit the app at `http://localhost:3000`

Build & Start
-------------
- Production build: `npm run build`
- Start production server: `npm start`


Environment Variables
---------------------
Minimum required for local development:
- `DATABASE_URL` — Prisma database connection
- `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` — Clerk authentication keys
- `CORS_ALLOWED_ORIGINS` — Optional, e.g. `http://localhost:5173,https://yourdomain.com`
- `TZ` — Optional timezone for server logic (default `UTC`)


Scripts
-------
- `npm run dev` — Next.js dev server (Turbopack)
- `npm run build` — Build for production
- `npm start` — Start production server
- `npm run lint` — Lint the project


Code Layout
-----------
- `src/app` — App Router pages and API routes
  - `src/app/api/v1/**` — Public client APIs with CORS
  - `src/app/api/protected/**` — Admin APIs (Clerk‑protected)
  - `src/app/not-admin/page.tsx` — Shown to signed‑in users who are not admins
  - `src/app/page.tsx` — Landing page
- `src/middleware.ts` — Clerk protection + CORS for non‑protected routes
- `src/lib` — Shared utilities (e.g., Prisma client wrapper)
- `src/components` — UI components


What This App Does (Briefly)
----------------------------
- Lets admins manage studio entities: clients, groups, classes, and payments.
- Exposes a minimal `/api/v1` surface for client apps to authenticate, browse classes, reserve, and cancel.
- Enforces admin access on management endpoints while allowing cross‑origin access for public APIs.


Contributing / Next Steps
-------------------------
- Add richer analytics and reports for attendance and payments.
- Implement waitlist mechanics in reservations.
- Expand landing page with real screenshots and docs.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# iron-fit-app
