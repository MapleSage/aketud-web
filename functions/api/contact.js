// POST /api/contact — contact + newsletter form handler.
//
// Delivery, in priority order (whichever the Pages project is configured for):
//
//  1. Cloudflare Email Routing "send_email" binding — bind as SEND_EMAIL in the
//     Pages project (Settings → Functions → Bindings). CONTACT_TO must be a
//     *verified* destination address in Email Routing, and CONTACT_FROM must be
//     an address on a domain whose zone has Email Routing enabled.
//
//  2. Generic SMTP-over-HTTP bridge — set MAIL_ENDPOINT (a URL that accepts
//     POST {from,to,replyTo,subject,text}) and optional MAIL_TOKEN (sent as
//     Authorization: Bearer). Use this for a Cloudflare/-adjacent SMTP relay
//     that exposes an HTTP send API.
//
// Env vars: CONTACT_TO (required), CONTACT_FROM (default no-reply@aketud.com),
//           MAIL_ENDPOINT, MAIL_TOKEN.

const FIELDS = ['name', 'email', 'system', 'message', 'list'];

function esc(s = '') {
  return String(s).replace(/[\r\n]+/g, ' ').slice(0, 2000);
}

async function readForm(request) {
  const ct = request.headers.get('content-type') || '';
  if (ct.includes('application/json')) return request.json();
  const fd = await request.formData();
  return Object.fromEntries(fd.entries());
}

function buildMime({ from, to, replyTo, subject, text }) {
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    replyTo ? `Reply-To: ${replyTo}` : null,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    '',
    text,
  ].filter((l) => l !== null);
  return lines.join('\r\n');
}

export async function onRequestPost(context) {
  const { request, env } = context;
  let data;
  try {
    data = await readForm(request);
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  // Honeypot — a real user never fills "company_website".
  if (data.company_website) {
    return Response.redirect(new URL('/contact/?sent=1', request.url), 303);
  }

  const name = esc(data.name);
  const email = esc(data.email);
  const isNewsletter = data.list === 'newsletter';

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json({ ok: false, error: 'A valid email is required.' }, 422);
  }
  if (!isNewsletter && !name) {
    return json({ ok: false, error: 'Name is required.' }, 422);
  }

  const to = env.CONTACT_TO || 'info@aketud.com';
  const from = env.CONTACT_FROM || 'no-reply@aketud.com';
  const subject = isNewsletter
    ? `Newsletter signup — ${email}`
    : `Contact form — ${name}${data.system ? ` (${esc(data.system)})` : ''}`;
  const text = FIELDS.filter((f) => data[f])
    .map((f) => `${f}: ${esc(data[f])}`)
    .concat(`\nsent: ${new Date().toISOString()}`)
    .join('\n');

  try {
    await send(env, { from, to, replyTo: email, subject, text });
  } catch (err) {
    return json({ ok: false, error: 'Could not send right now. Email us directly at ' + to + '.' }, 502);
  }

  // Browsers posting a plain <form> get a redirect; fetch() callers get JSON.
  const wantsJson = (request.headers.get('accept') || '').includes('application/json');
  if (wantsJson) return json({ ok: true });
  return Response.redirect(new URL(isNewsletter ? '/insights/?sub=1' : '/contact/?sent=1', request.url), 303);
}

async function send(env, msg) {
  if (env.SEND_EMAIL && typeof env.SEND_EMAIL.send === 'function') {
    const { EmailMessage } = await import('cloudflare:email');
    await env.SEND_EMAIL.send(new EmailMessage(msg.from, msg.to, buildMime(msg)));
    return;
  }
  if (env.MAIL_ENDPOINT) {
    const res = await fetch(env.MAIL_ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(env.MAIL_TOKEN ? { authorization: `Bearer ${env.MAIL_TOKEN}` } : {}),
      },
      body: JSON.stringify(msg),
    });
    if (!res.ok) throw new Error(`mail endpoint ${res.status}`);
    return;
  }
  throw new Error('no mail transport configured');
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export async function onRequestGet() {
  return new Response('Method not allowed', { status: 405 });
}
