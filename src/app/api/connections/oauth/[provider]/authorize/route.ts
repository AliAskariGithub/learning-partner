import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/auth/session';
import { getConnectionProvider } from '@/lib/connections/registry';
import { generatePkcePair } from '@/lib/security/pkce';

/**
 * Direct OAuth Authorization Route Handler
 * Initiates the PKCE flow as a first-class HTTP GET navigation.
 * Setting the httpOnly state cookie directly on the HTTP 302 response
 * completely eliminates mobile browser async popup/redirect blockage.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ provider: string }> }
) {
  const { provider: providerParam } = await context.params;
  const providerId = providerParam as 'chatgpt' | 'openrouter';

  const hostHeader =
    req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host || 'localhost:3000';
  const protoHeader = req.headers.get('x-forwarded-proto');

  const isLocalOrLan =
    hostHeader.includes('localhost') ||
    hostHeader.includes('127.0.0.1') ||
    hostHeader.startsWith('192.168.') ||
    hostHeader.startsWith('10.') ||
    hostHeader.startsWith('172.') ||
    hostHeader.includes(':');

  const isDev = process.env.NODE_ENV !== 'production';
  const proto = protoHeader || (isDev || isLocalOrLan ? 'http' : 'https');
  const appBase = (process.env.NEXT_PUBLIC_APP_URL || `${proto}://${hostHeader}`).replace(/\/+$/, '');

  const searchParams = req.nextUrl.searchParams;
  const returnUrl = searchParams.get('returnUrl') || '/app';

  // Verify user is authenticated
  const session = await getSession();
  if (!session?.user?.id) {
    const loginUrl = `${appBase}/sign-in?returnUrl=${encodeURIComponent(returnUrl)}`;
    return NextResponse.redirect(loginUrl);
  }

  const providerImpl = getConnectionProvider(providerId);
  if (!providerImpl || !providerImpl.getAuthorizationUrl) {
    const separator = returnUrl.includes('?') ? '&' : '?';
    return NextResponse.redirect(
      `${appBase}${returnUrl.startsWith('/') ? '' : '/'}${returnUrl}${separator}connection_error=${encodeURIComponent(
        `OAuth is not supported for provider ${providerId}`
      )}`
    );
  }

  const redirectUri = `${appBase}/api/connections/oauth/${providerId}/callback`;
  const pkce = generatePkcePair();

  const isSecure = process.env.NODE_ENV === 'production' && !isLocalOrLan && !appBase.startsWith('http://');

  const cookieStore = await cookies();
  const oauthStatePayload = JSON.stringify({
    state: pkce.state,
    codeVerifier: pkce.codeVerifier,
    provider: providerId,
    userId: session.user.id,
    returnUrl,
    appBase,
  });

  cookieStore.set('lp_oauth_state', oauthStatePayload, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  try {
    const authUrl = await providerImpl.getAuthorizationUrl({
      state: pkce.state,
      codeChallenge: pkce.codeChallenge,
      redirectUri,
    });
    return NextResponse.redirect(authUrl);
  } catch (err: any) {
    const separator = returnUrl.includes('?') ? '&' : '?';
    return NextResponse.redirect(
      `${appBase}${returnUrl.startsWith('/') ? '' : '/'}${returnUrl}${separator}connection_error=${encodeURIComponent(
        err.message || 'Failed to generate authorization URL.'
      )}`
    );
  }
}

