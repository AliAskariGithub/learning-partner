import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { connections } from '@/db/schema';
import { getConnectionProvider } from '@/lib/connections/registry';
import { validateStateToken } from '@/lib/security/pkce';
import { encryptApiKey } from '@/lib/crypto';
import { ConnectionMethod } from '@/lib/connections/types';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ provider: string }> }
) {
  const { provider: providerParam } = await context.params;
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const errorParam = searchParams.get('error');
  const errorDesc = searchParams.get('error_description');

  const hostHeader = req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host;
  const proto = req.headers.get('x-forwarded-proto') || req.nextUrl.protocol.replace(':', '');
  const appBase = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${hostHeader}`;
  let redirectTarget = `${appBase.replace(/\/+$/, '')}/app`;

  // Read stored OAuth state cookie
  const cookieStore = await cookies();
  const rawCookie = cookieStore.get('lp_oauth_state')?.value;

  // Clean up state cookie immediately
  cookieStore.delete('lp_oauth_state');

  if (errorParam) {
    console.error(`OAuth provider returned error: ${errorParam} - ${errorDesc}`);
    return NextResponse.redirect(
      `${redirectTarget}?connection_error=${encodeURIComponent(errorDesc || errorParam)}`
    );
  }

  if (!rawCookie) {
    return NextResponse.redirect(
      `${redirectTarget}?connection_error=${encodeURIComponent('OAuth session expired or state missing. Please try again.')}`
    );
  }

  let parsedCookie: { state: string; codeVerifier: string; provider: string; userId: string; returnUrl?: string };
  try {
    parsedCookie = JSON.parse(rawCookie);
    if (parsedCookie.returnUrl) {
      if (parsedCookie.returnUrl.startsWith('http')) {
        redirectTarget = parsedCookie.returnUrl;
      } else {
        redirectTarget = `${appBase.replace(/\/+$/, '')}${parsedCookie.returnUrl.startsWith('/') ? '' : '/'}${parsedCookie.returnUrl}`;
      }
    }
  } catch {
    return NextResponse.redirect(
      `${redirectTarget}?connection_error=${encodeURIComponent('Corrupted OAuth state cookie.')}`
    );
  }

  // Validate state: standard OAuth requires state to match. For OpenRouter PKCE, validate if present.
  if (state) {
    if (!validateStateToken(parsedCookie.state, state)) {
      return NextResponse.redirect(
        `${redirectTarget}?connection_error=${encodeURIComponent('Invalid OAuth state. Potential CSRF detected.')}`
      );
    }
  } else if (parsedCookie.provider !== 'openrouter') {
    return NextResponse.redirect(
      `${redirectTarget}?connection_error=${encodeURIComponent('Missing OAuth state token.')}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${redirectTarget}?connection_error=${encodeURIComponent('Missing authorization code.')}`
    );
  }

  const providerImpl = getConnectionProvider(parsedCookie.provider);
  if (!providerImpl || !providerImpl.handleCallback) {
    return NextResponse.redirect(
      `${redirectTarget}?connection_error=${encodeURIComponent(`Unsupported provider ${parsedCookie.provider}`)}`
    );
  }

  const redirectUri = `${appBase.replace(/\/+$/, '')}/api/connections/oauth/${parsedCookie.provider}/callback`;

  try {
    const callbackResult = await providerImpl.handleCallback({
      code,
      codeVerifier: parsedCookie.codeVerifier,
      redirectUri,
    });

    const encryptedAccess = encryptApiKey(callbackResult.accessToken);
    const encryptedRefresh = callbackResult.refreshToken
      ? encryptApiKey(callbackResult.refreshToken)
      : null;

    const expiresAt = callbackResult.expiresIn
      ? new Date(Date.now() + callbackResult.expiresIn * 1000)
      : null;

    const method: ConnectionMethod =
      parsedCookie.provider === 'chatgpt' ? 'oauth_plan' : 'oauth_key';

    // Insert or update connection
    await db.insert(connections).values({
      userId: parsedCookie.userId,
      provider: parsedCookie.provider as any,
      method,
      callMode: 'server',
      status: callbackResult.status || 'connected',
      encryptedAccessToken: encryptedAccess,
      encryptedRefreshToken: encryptedRefresh,
      accessTokenExpiresAt: expiresAt,
      grantedScopes: callbackResult.grantedScopes || null,
      accountLabel: callbackResult.accountLabel || `${providerImpl.name} Account`,
      lastError: callbackResult.lastError || null,
      autoFallback: parsedCookie.provider === 'chatgpt',
    });

    return NextResponse.redirect(
      `${redirectTarget}?connected=${encodeURIComponent(parsedCookie.provider)}`
    );
  } catch (err: any) {
    console.error('OAuth callback handling failed:', err);
    return NextResponse.redirect(
      `${redirectTarget}?connection_error=${encodeURIComponent(err.message || 'OAuth token exchange failed.')}`
    );
  }
}

