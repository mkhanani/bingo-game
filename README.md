# Bingo Night

A simple bingo game you can play in the browser.

## Files

- `index.html` — multiplayer version. Two players join the same room code from separate phones (one Android, one iPhone) and play together in real time.
- `single-player.html` — single-device version with a built-in number caller and win detection, no syncing needed.
- `api/room.js` — serverless function that syncs game state between devices when this is deployed as a real website (see setup below).

## Running it

These are static HTML files with no build step. Open `single-player.html` directly in a browser — it needs nothing else.

`index.html` needs a place to store shared game state (who's called what, whose turn, who won) so two phones see the same room. It works two ways:

**As a Claude.ai artifact** — no setup. Claude provides a storage API automatically.

**As a deployed website (e.g. this repo on Vercel)** — needs a small Redis database connected once:

1. In the Vercel dashboard, open this project → **Storage** tab → **Marketplace Database Providers** → **Upstash for Redis** (or **Upstash for Redis** in the Vercel Marketplace) → create and connect it to this project.
2. Redeploy (Vercel usually does this automatically after connecting a database; if not, trigger a redeploy from the Deployments tab).
3. That's it — no code changes needed. Vercel injects `KV_REST_API_URL` and `KV_REST_API_TOKEN` as environment variables, which `api/room.js` reads automatically.

If this step hasn't been done yet, `index.html` will show a banner on load explaining exactly this, instead of failing silently.

## How the sync works

Each room's state (players, call history, each player's card and marks, whose turn started the round) lives under keys like `room:ABCD:calls`. Both phones poll every ~2.5 seconds and write through the same keys, so calling a number or marking a cell on one phone shows up on the other shortly after. It's last-write-wins — fine for two people playing casually, not built for anything higher-stakes.
