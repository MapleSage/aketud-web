// GitHub OAuth — step 1. Redirect the CMS popup to GitHub's consent screen.
// Decap/Sveltia call this as `${base_url}/${auth_endpoint}`.
export async function onRequestGet({ request, env }) {
  const clientId = env.GITHUB_CLIENT_ID;
  if (!clientId) return new Response('GITHUB_CLIENT_ID not set', { status: 500 });

  const url = new URL(request.url);
  const provider = url.searchParams.get('provider') || 'github';
  if (provider !== 'github') return new Response('Unsupported provider', { status: 400 });

  const state = crypto.randomUUID();
  const scope = url.searchParams.get('scope') || 'repo,user';
  const redirectUri = `${url.origin}/oauth/callback`;

  const authorize = new URL('https://github.com/login/oauth/authorize');
  authorize.searchParams.set('client_id', clientId);
  authorize.searchParams.set('redirect_uri', redirectUri);
  authorize.searchParams.set('scope', scope);
  authorize.searchParams.set('state', state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: authorize.toString(),
      'Set-Cookie': `oauth_state=${state}; Path=/oauth; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    },
  });
}
