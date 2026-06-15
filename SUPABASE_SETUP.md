# The Bubble Supabase Setup

This project uses Supabase for the MVP multiplayer layer only: anonymous visitors, active presence, public posts, one poll, and one simple fan battle.

## 1. Create The Tables

1. Open your Supabase project.
2. Go to **SQL Editor**.
3. Run this file:

```text
supabase/migrations/001_the_bubble_mvp.sql
```

The migration creates:

- `bubbles`
- `visitors`
- `posts`
- `polls`
- `poll_votes`
- `fan_battles`
- `fan_battle_entries`
- the `submit_fan_battle_entry(...)` RPC for atomic tap counting
- RLS policies for the anonymous MVP
- Realtime publication entries for visitors, posts, poll votes, and fan battles
- seed data for the `demo` Bubble

## 2. Environment Variables

Create `.env.local` from `.env.local.example`:

```bash
cp .env.local.example .env.local
```

Fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
```

Use the public anon key only. Do not put a service-role key into this app.

## 3. Local Test

```bash
npm install
npm run dev -- --hostname 0.0.0.0 --port 3001
```

Open two different browser sessions, for example normal and private browsing:

```text
http://localhost:3001/demo
```

Expected test flow:

1. Both sessions tap `Jetzt Bubble betreten`.
2. Both choose `Anonym weiter`.
3. Both appear under `Wer ist gerade hier?` within a few seconds.
4. Session A posts a short message.
5. Session B sees the post without reloading.
6. Session A votes in `Wer gewinnt heute?`.
7. Session B sees the updated percentages.
8. Session B votes once; a second vote is rejected by the unique database constraint.
9. Both run the Fan Battle; shared team taps update after each 10-second round.
10. A guest opens the avatar sheet and creates a voluntary profile; the same visitor row is updated.

## 4. Vercel Deploy

1. Push the Next.js project to GitHub.
2. Import it in Vercel.
3. Add the same environment variables in Vercel Project Settings:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

4. Deploy.

## Security Notes For This Anonymous MVP

This MVP intentionally has no email, password, or Supabase Auth user. The browser stores a local `session_id` and visitor id. RLS verifies that rows belong to an active Bubble and that posts/votes/battle entries reference valid visitors.

Because there is no authenticated identity, RLS cannot cryptographically prove that a browser owns a visitor row. This is acceptable for the current QR-code pilot, but before public scale you should add one of:

- Supabase anonymous auth users
- signed visitor tokens issued by a trusted server route
- stricter rate limits and abuse controls

Never expose service-role keys in the browser.
