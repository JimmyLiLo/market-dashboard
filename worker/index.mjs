// Cloudflare Worker：網頁每次打開或重新整理時呼叫 /market，即時抓最新數字。
// 部署方式見 README.md。結果快取 60 秒，避免短時間內重複打到資料來源。
import {fetchAll} from '../lib/sources.mjs';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') return new Response(null, {headers: CORS});
    const url = new URL(request.url);
    if (url.pathname !== '/market') return new Response('Not found', {status: 404, headers: CORS});

    const cache = caches.default;
    const key = new Request(`${url.origin}/market`);
    const hit = await cache.match(key);
    if (hit) return new Response(hit.body, {headers: {...Object.fromEntries(hit.headers), ...CORS}});

    const data = await fetchAll();
    const res = new Response(JSON.stringify(data), {
      headers: {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=60', ...CORS},
    });
    ctx.waitUntil(cache.put(key, res.clone()));
    return res;
  },
};
