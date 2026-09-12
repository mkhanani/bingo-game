// Vercel serverless function: a tiny key-value proxy in front of a Redis
// database, used so bingo-night.html can sync game state between devices.
//
// Requires a Redis database connected to this Vercel project (Storage ->
// Marketplace Database Providers -> Upstash for Redis, then redeploy).
// Vercel injects KV_REST_API_URL / KV_REST_API_TOKEN automatically once
// that's connected (falls back to UPSTASH_REDIS_REST_URL / _TOKEN, the
// names used by the standalone Upstash integration).
//
// GET  /api/room?key=room:ABCD:calls        -> { value: "<string or null>" }
// POST /api/room  { key, value }            -> { ok: true }
//
// The credentials never reach the browser: this file only runs on the
// server, and the client talks to it, never to Redis directly.

const KEY_PATTERN = /^room:[A-Za-z0-9_-]{1,40}:[A-Za-z0-9_.:-]{1,80}$/;
const MAX_VALUE_LENGTH = 20000;

function getCredentials(){
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return { url, token };
}

export default async function handler(req, res) {
  const { url, token } = getCredentials();

  if (!url || !token) {
    res.status(501).json({ error: 'not_configured' });
    return;
  }

  try {
    if (req.method === 'GET') {
      const key = req.query.key;
      if (!key || Array.isArray(key) || !KEY_PATTERN.test(key)) {
        res.status(400).json({ error: 'bad_key' });
        return;
      }
      const upstream = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!upstream.ok) {
        res.status(502).json({ error: 'upstream_failed' });
        return;
      }
      const data = await upstream.json();
      res.status(200).json({ value: data.result ?? null });
      return;
    }

    if (req.method === 'POST') {
      const body = req.body || {};

      if (body.action === 'claim') {
        const { key, ttlSeconds } = body;
        if (!key || typeof key !== 'string' || !KEY_PATTERN.test(key)) {
          res.status(400).json({ error: 'bad_key' });
          return;
        }
        const ttl = Math.max(1, Math.min(60, Number(ttlSeconds) || 10));
        // Atomic SET key 1 NX EX ttl — only one caller ever gets claimed: true
        // for a given lock key, which is exactly what lets two devices race
        // to call the same number without double-calling.
        const upstream = await fetch(url, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(['SET', key, '1', 'NX', 'EX', String(ttl)])
        });
        if (!upstream.ok) {
          res.status(502).json({ error: 'upstream_failed' });
          return;
        }
        const data = await upstream.json();
        res.status(200).json({ claimed: data.result === 'OK' });
        return;
      }

      const { key, value } = body;
      if (!key || typeof key !== 'string' || !KEY_PATTERN.test(key)) {
        res.status(400).json({ error: 'bad_key' });
        return;
      }
      if (typeof value !== 'string' || value.length > MAX_VALUE_LENGTH) {
        res.status(400).json({ error: 'bad_value' });
        return;
      }
      const upstream = await fetch(`${url}/set/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: value
      });
      if (!upstream.ok) {
        res.status(502).json({ error: 'upstream_failed' });
        return;
      }
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: 'method_not_allowed' });
  } catch (e) {
    res.status(500).json({ error: 'server_error' });
  }
}
