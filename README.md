# BuildVerdict

> This project is a work in progress and is not ready for production use.

BuildVerdict is a forum for adventurous Dota 2 builds. It's not about
finding the most efficient item purchase. It's a place for weird, risky
builds that are worth arguing about, not builds that just win matches.

<img width="2215" height="1239" alt="main_menu" src="https://github.com/user-attachments/assets/9988ac56-f760-4ec7-b797-608ec1a8b254" />

You open a random hero with a random build, look at the items and the 3D
model, and give a verdict: like, situational, or dislike. Then you move
on. Anyone can vote without an account. You need an account to comment or
publish your own builds.

<img width="1851" height="1118" alt="random_build" src="https://github.com/user-attachments/assets/5f5877a3-1a02-457f-94fc-88c2176267ed" />

## What's inside

- A home screen with a random hero and build, an interactive 3D model,
  and three verdict options.
- A feed of every published build, with a role filter and search.

<img width="1973" height="1240" alt="builds" src="https://github.com/user-attachments/assets/4e113a61-5d25-4dbd-bcd8-8400a939ca18" />

- Publishing your own build: a title, a hero, and a set of items. No
  descriptions or ratings. The idea has to speak for itself.
- One shared comment thread under each build.
- An author profile with an avatar and a list of their builds.
- Accounts with email verification, password reset, and bot protection.
- Moderation tools built into the feed: hide a comment, mute an author
  for a while. No separate admin panel.
- One dark theme, no light mode.

## Tech stack

The project is a monorepo with two apps.

**Backend**: NestJS (TypeScript), PostgreSQL through Prisma, Redis for
sessions and tokens, JWT authentication, email delivery, and Cloudflare
Turnstile for bot protection on forms.

**Frontend**: React with server components (vinext on top of Vite),
interactive 3D graphics with three.js, animations with GSAP. Deployed to
Cloudflare Workers.

Local development infrastructure runs through Docker Compose.

## Running it locally

You need Node.js 22.13 or newer, npm, and Docker (for the database,
Redis, and a test mailbox).

1. Install dependencies from the repository root:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env`. The default values work fine for local
   development, so you don't have to change anything.

   ```bash
   cp .env.example .env
   ```

3. Start everything with one command:

   ```bash
   npm run dev
   ```

   This brings up PostgreSQL, Redis, and mailpit through Docker Compose,
   applies the database migrations, and starts both apps. The backend
   runs at `http://localhost:4000`. The frontend prints its own address
   when it starts.

Emails sent during development don't go to a real inbox. You can read
them in the mailpit UI at `http://localhost:8025`. Cloudflare Turnstile
is disabled by default in `.env.example`, so you don't need to set it up
for local development.

To stop the infrastructure:

```bash
npm run db:down
```
