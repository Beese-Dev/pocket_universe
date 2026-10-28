# Daily leaderboard service

The game keeps daily scores on the player's device until this tiny service is deployed. It is a Cloudflare Worker (free tier is plenty) with one KV namespace.

1. Install and sign in: `npm i -g wrangler` then `wrangler login`.
2. In this folder: `wrangler kv namespace create SCORES` and paste the printed `id` into `wrangler.toml`.
3. `wrangler deploy`. Wrangler prints the worker URL, e.g. `https://pocket-universe-leaderboard.<you>.workers.dev`.
4. Put that URL into `LEADERBOARD_URL` near the top of the daily-challenge section of the game (`pocket-universe.html`, rebuilt into `index.html`).

Scores are kept per UTC day for 60 days, best score per name, top 200 stored, top 50 served. Submissions are accepted only for the current day and only from the game's origin.
