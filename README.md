# Chess Ladder MVP

Mobile-first coaching leaderboard for live chess classes with two roles:

- **Admin**: add students, run 1-tap score actions, manage settings
- **Parent**: read-only view by student name or code

## Stack

- Next.js 16 App Router
- TypeScript + Tailwind CSS
- Supabase JS v2 (DB + Realtime)
- SWR for caching and realtime invalidation

## Setup

1. Copy `.env.local.example` to `.env.local`
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. (Optional) Set `NEXT_PUBLIC_ADMIN_PIN` for simple V1 admin gating
4. Run SQL from `supabase/schema.sql` in Supabase SQL editor
5. Install and run:

```bash
npm install
npm run dev
```

## Routes

- `/` start screen
- `/dashboard` admin home + quick add
- `/students` students list
- `/students/[id]` profile + quick actions + draw flow
- `/leaderboard` weekly/monthly/all-time rankings
- `/parent` read-only lookup
- `/settings` resets, CSV export, admin list

## Vercel Deployment Checklist

- Add env vars in Vercel Project Settings
- Confirm Supabase URL/anon key are production keys
- Ensure `supabase/schema.sql` is applied on production DB
- Deploy with `npm run build`
- Verify realtime updates on two devices
