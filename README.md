# viralTier.ai 🏆⚡

Transform raw video clips into viral ranking-style short videos (9:16), optimized for YouTube Shorts, TikTok, and Instagram Reels.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Next.js 14 (App Router)  ←→  Convex (DB + Auth + API) │
│          Web Frontend                                    │
└─────────────────────────────────────────────────────────┘
              ↓ (Convex HTTP actions)
┌─────────────────────────────────────────────────────────┐
│  Docker Worker (Node.js)                                 │
│  Express → BullMQ → FFmpeg → Remotion → output.mp4      │
└─────────────────────────────────────────────────────────┘
              ↓ (Redis queue)
┌─────────────────────────────────────────────────────────┐
│  Redis (BullMQ job queue)                               │
└─────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS |
| Backend | **Convex** (DB, Auth, Storage, Real-time, Functions) |
| Video | FFmpeg + Remotion (in Docker) |
| Job queue | BullMQ + Redis (inside Docker) |
| AI | OpenRouter (GPT-4o Vision) |
| State | Zustand (planned) |
| Monorepo | Turborepo |

## Getting Started

### Prerequisites
- Node.js 18+
- Docker Desktop (for Redis + worker)
- [Convex account](https://dashboard.convex.dev)
- [OpenRouter API key](https://openrouter.ai/keys)

### 1. Clone & Install

```bash
git clone <repo>
cd viraltier-ai
npm install
```

### 2. Set up Convex

```bash
npx convex dev
```

This will:
- Create a new Convex deployment
- Output your `NEXT_PUBLIC_CONVEX_URL`
- Watch for schema/function changes

### 3. Configure Environment Variables

```bash
# Root .env (for worker)
cp .env.example .env

# Web app
cp apps/web/.env.local.example apps/web/.env.local
```

Fill in:
- `NEXT_PUBLIC_CONVEX_URL` — from `npx convex dev`
- `OPENROUTER_API_KEY` — from openrouter.ai
- `WORKER_SECRET` — any random string (e.g. `openssl rand -hex 32`)

### 4. Seed Music Library

```bash
cd convex
npx convex run seed:seedMusicTracks
```

### 5. Start Development

```bash
# Terminal 1: Next.js + Convex
npm run dev -w @viraltier/web

# Terminal 2: Docker (Redis + Worker)
docker-compose up
```

Open [http://localhost:3000](http://localhost:3000).

## Workspace Packages

| Package | Description |
|---|---|
| `apps/web` | Next.js 14 frontend |
| `apps/worker` | FFmpeg/BullMQ render worker (Docker) |
| `packages/types` | Shared TypeScript interfaces (`EditingPlan`, etc.) |
| `packages/remotion` | Remotion compositions (video templates) |
| `convex/` | Convex backend (schema, queries, mutations, actions) |

## The EditingPlan

The `EditingPlan` is the central data structure. The AI only ever produces or modifies this JSON — it **never touches video files directly**.

```typescript
{
  template: 'ranking',
  title: 'Ranking Funniest Fails',
  rankingStyle: { type: 'emoji' },    // 🥇 🥈 🥉 #4 #5
  items: [
    { rank: 1, mediaItemId: '...', title: 'Epic Fail 😂', startTime: 2.1, endTime: 5.8 },
    // ...
  ],
  displayOrder: [5, 4, 3, 2, 1],     // Countdown order (5→1)
  audio: { musicVolume: 0.25 },
  effects: { autoZoom: true, transitions: true }
}
```

## Editing Modes

| Mode | AI Calls | Credits |
|---|---|---|
| 🤖 AI | Full automation | ~7/video |
| 🧠 Assisted | User-chosen features | Flexible |
| ✋ Manual | Zero AI | **Free** |

## Credit Costs

| Feature | Cost |
|---|---|
| Best moment detection | 3 per video |
| Title generation | 1 per item |
| Music auto-selection | 1 per project |
| Signup bonus | +50 credits |
| Manual mode + rendering | **Free** |

## Deployment

### Convex (Backend + DB)
```bash
npx convex deploy
```

### Next.js (Frontend)
Deploy `apps/web` to Vercel:
```bash
cd apps/web
npx vercel
```

### Worker (Docker → VPS)
```bash
docker-compose -f docker-compose.yml up -d
```

## Architecture Notes

- **No NestJS** — Convex replaces the REST API with reactive queries, mutations, and actions
- **Direct uploads** — Videos go directly to Convex Storage (not through any server)
- **Real-time renders** — Convex reactive queries auto-update the render progress page without polling
- **Worker isolation** — FFmpeg runs in Docker with access to full CPU; communicates back via HTTP
