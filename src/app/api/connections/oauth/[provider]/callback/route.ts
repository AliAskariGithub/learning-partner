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

  const hostHeader = req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host || 'localhost:3000';
  const protoHeader = req.headers.get('x-forwarded-proto');

  const isLocalOrLan =
    hostHeader.includes('localhost') ||
    hostHeader.includes('127.0.0.1') ||
    hostHeader.startsWith('192.168.') ||
    hostHeader.startsWith('10.') ||
    hostHeader.startsWith('172.') ||
    hostHeader.includes(':');

  const isDev = process.env.NODE_ENV !== 'production';
  const proto = protoHeader || (isDev || isLocalOrLan ? 'http' : req.nextUrl.protocol.replace(':', ''));
  let appBase = (process.env.NEXT_PUBLIC_APP_URL || `${proto}://${hostHeader}`).replace(/\/+$/, '');
  let redirectTarget = `${appBase}/app`;

  // Read stored OAuth state cookie
  const cookieStore = await cookies();
  const rawCookie = cookieStore.get('lp_oauth_state')?.value;

  // Clean up state cookie immediately
  cookieStore.delete('lp_oauth_state');

  const buildRedirectUrl = (target: string, paramName: string, paramValue: string) => {
    const separator = target.includes('?') ? '&' : '?';
    return `${target}${separator}${paramName}=${encodeURIComponent(paramValue)}`;
  };

  if (errorParam) {
    console.error(`OAuth provider returned error: ${errorParam} - ${errorDesc}`);
    return NextResponse.redirect(
      buildRedirectUrl(redirectTarget, 'connection_error', errorDesc || errorParam)
    );
  }

  if (!rawCookie) {
    return NextResponse.redirect(
      buildRedirectUrl(redirectTarget, 'connection_error', 'OAuth session expired or state missing. Please try again.')
    );
  }

  let parsedCookie: { state: string; codeVerifier: string; provider: string; userId: string; returnUrl?: string; appBase?: string };
  try {
    parsedCookie = JSON.parse(rawCookie);
    if (parsedCookie.appBase) {
      appBase = parsedCookie.appBase.replace(/\/+$/, '');
    }
    if (parsedCookie.returnUrl) {
      if (parsedCookie.returnUrl.startsWith('http')) {
        redirectTarget = parsedCookie.returnUrl;
      } else {
        redirectTarget = `${appBase}${parsedCookie.returnUrl.startsWith('/') ? '' : '/'}${parsedCookie.returnUrl}`;
      }
    }
  } catch {
    return NextResponse.redirect(
      buildRedirectUrl(redirectTarget, 'connection_error', 'Corrupted OAuth state cookie.')
    );
  }

  // Validate state: standard OAuth requires state to match. For OpenRouter PKCE, validate if present.
  if (state) {
    if (!validateStateToken(parsedCookie.state, state)) {
      return NextResponse.redirect(
        buildRedirectUrl(redirectTarget, 'connection_error', 'Invalid OAuth state. Potential CSRF detected.')
      );
    }
  } else if (parsedCookie.provider !== 'openrouter') {
    return NextResponse.redirect(
      buildRedirectUrl(redirectTarget, 'connection_error', 'Missing OAuth state token.')
    );
  }

  if (!code) {
    return NextResponse.redirect(
      buildRedirectUrl(redirectTarget, 'connection_error', 'Missing authorization code.')
    );
  }

  const providerImpl = getConnectionProvider(parsedCookie.provider);
  if (!providerImpl || !providerImpl.handleCallback) {
    return NextResponse.redirect(
      buildRedirectUrl(redirectTarget, 'connection_error', `Unsupported provider ${parsedCookie.provider}`)
    );
  }

  const redirectUri = `${appBase}/api/connections/oauth/${parsedCookie.provider}/callback`;

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
      buildRedirectUrl(redirectTarget, 'connected', parsedCookie.provider)
    );
  } catch (err: any) {
    console.error('OAuth callback handling failed:', err);
    return NextResponse.redirect(
      buildRedirectUrl(redirectTarget, 'connection_error', err.message || 'OAuth token exchange failed.')
    );
  }
}

