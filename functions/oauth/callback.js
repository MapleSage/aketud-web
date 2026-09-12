// GitHub OAuth — step 2. Exchange the code for a token and hand it back to the
// CMS window via postMessage, in the shape Decap/Sveltia expect.
export async function onRequestGet({ request, env }) {
  const clientId = env.GITHUB_CLIENT_ID;
  const clientSecret = env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return new Response('GitHub OAuth env vars not set', { status: 500 });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookie = (request.headers.get('Cookie') || '').match(/oauth_state=([^;]+)/);
  if (!code || !state || !cookie || cookie[1] !== state) {
    return new Response('Bad OAuth state', { status: 400 });
  }

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: `${url.origin}/oauth/callback`,
    }),
  });
  const data = await tokenRes.json();

  const status = data.access_token ? 'success' : 'error';
  const payload = data.access_token
    ? {
        token: data.access_token,
        provider: 'github',
        // present when the GitHub App expires user tokens (8h); Sveltia refreshes
        ...(data.refresh_token && {
          refreshToken: data.refresh_token,
          expiresIn: data.expires_in,
        }),
      }
    : { error: data.error_description || data.error || 'No token returned' };
  const message = `authorization:github:${status}:${JSON.stringify(payload)}`;

  const html = `<!doctype html><meta charset="utf-8"><body><script>
(function () {
  function send(e) {
    if (!window.opener) return;
    window.opener.postMessage(${JSON.stringify(message)}, e.origin);
  }
  window.addEventListener('message', send, false);
  window.opener && window.opener.postMessage('authorizing:github', '*');
})();
</script>Authentication complete. You can close this window.</body>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Set-Cookie': 'oauth_state=; Path=/oauth; Max-Age=0',
    },
  });
}
