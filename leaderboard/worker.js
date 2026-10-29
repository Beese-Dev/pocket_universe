/**
 * Pocket Universe daily leaderboard — a Cloudflare Worker with a KV namespace.
 *
 * GET  /?day=YYYYMMDD&pid=…    -> top 50 scores for that day: [{name, score, life, alive, disc, me}]
 * POST / {day,name,pid,score,…} -> records a score (one entry per player id per day; a higher score replaces a lower one)
 *
 * Deploy (once):
 *   1. npm i -g wrangler && wrangler login
 *   2. wrangler kv namespace create SCORES      (paste the id into wrangler.toml)
 *   3. wrangler deploy
 * Then put the worker's URL into LEADERBOARD_URL in the game.
 */
const ORIGINS = ['https://beese-dev.github.io'];               // who may submit scores
const MAX_SCORE = 200000;                                       // sanity cap: 1 Gyr × 8 planets × ~2 stars is well under this
const headers = o => ({ 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': o, 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Cache-Control': 'no-store' });

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    const allow = ORIGINS.includes(origin) || origin === '' ? (origin || '*') : null;
    if (req.method === 'OPTIONS') return new Response(null, { headers: headers(allow || ORIGINS[0]) });
    if (!allow) return new Response('{"error":"origin"}', { status: 403, headers: headers(ORIGINS[0]) });
    const url = new URL(req.url);
    if (req.method === 'GET') {
      const day = (url.searchParams.get('day') || '').replace(/\D/g, '').slice(0, 8);
      if (day.length !== 8) return new Response('[]', { headers: headers(allow) });
      const pid = (url.searchParams.get('pid') || '').replace(/[^0-9a-f]/g, '').slice(0, 32);
      const list = JSON.parse((await env.SCORES.get('day:' + day)) || '[]');
      const out = list.slice(0, 50).map(({ pid: p, ...e }) => ({ ...e, me: !!pid && p === pid }));
      return new Response(JSON.stringify(out), { headers: headers(allow) });
    }
    if (req.method === 'POST') {
      let body; try { body = await req.json(); } catch { return new Response('{"error":"json"}', { status: 400, headers: headers(allow) }); }
      const day = String(body.day || '').replace(/\D/g, '').slice(0, 8);
      const name = String(body.name || 'Anonymous').replace(/[^\w .'-]/g, '').trim().slice(0, 16) || 'Anonymous';
      const pid = String(body.pid || '').replace(/[^0-9a-f]/g, '').slice(0, 32) || ('name:' + name.toLowerCase());
      const score = Math.round(Number(body.score));
      if (day.length !== 8 || !(score >= 0) || score > MAX_SCORE) return new Response('{"error":"bad"}', { status: 400, headers: headers(allow) });
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      if (day !== today) return new Response('{"error":"closed"}', { status: 400, headers: headers(allow) });
      const key = 'day:' + day;
      const list = JSON.parse((await env.SCORES.get(key)) || '[]');
      const entry = { pid, name, score, life: Math.round(Number(body.life) || 0), alive: Number(body.alive) | 0, disc: Number(body.disc) | 0, t: Date.now() };
      const i = list.findIndex(e => e.pid === pid);
      if (i >= 0) { if (list[i].score <= score) list[i] = entry; else list[i].name = name; } else list.push(entry);
      list.sort((a, b) => b.score - a.score);
      await env.SCORES.put(key, JSON.stringify(list.slice(0, 200)), { expirationTtl: 60 * 60 * 24 * 60 });
      return new Response(JSON.stringify({ ok: true, rank: list.findIndex(e => e.pid === pid) + 1 }), { headers: headers(allow) });
    }
    return new Response('{"error":"method"}', { status: 405, headers: headers(allow) });
  }
};
