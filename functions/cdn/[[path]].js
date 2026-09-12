// Serve media from the R2 bucket bound as MEDIA at /cdn/*
// e.g. /cdn/blog/<slug>/<file>.jpg  ->  R2 key "blog/<slug>/<file>.jpg"
const IMMUTABLE = 'public, max-age=31536000, immutable';

export async function onRequestGet(context) {
  const { params, env, request, waitUntil } = context;
  const key = Array.isArray(params.path) ? params.path.join('/') : params.path;
  if (!key || key.includes('..')) return new Response('Bad path', { status: 400 });

  const cache = caches.default;
  const hit = await cache.match(request);
  if (hit) return hit;

  const obj = await env.MEDIA.get(key);
  if (!obj) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  headers.set('cache-control', IMMUTABLE);
  if (!headers.has('content-type')) headers.set('content-type', guessType(key));

  const res = new Response(obj.body, { headers });
  waitUntil(cache.put(request, res.clone()));
  return res;
}

export async function onRequestHead(context) {
  const res = await onRequestGet(context);
  return new Response(null, { status: res.status, headers: res.headers });
}

function guessType(k) {
  const e = k.split('.').pop().toLowerCase();
  return {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
    avif: 'image/avif', gif: 'image/gif', svg: 'image/svg+xml',
    mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
  }[e] || 'application/octet-stream';
}
