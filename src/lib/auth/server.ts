import {
  createAuthServer,
  extractNeonAuthCookies,
  resolveNeonAuthLogging,
  validateCookieConfig,
} from '@neondatabase/auth/server';
import { createNeonAuth, type NeonAuth } from '@neondatabase/auth/next/server';
import { cookies, headers } from 'next/headers';

function createSafeNeonAuth(config: Parameters<typeof createNeonAuth>[0]): NeonAuth {
  const baseAuth = createNeonAuth(config);
  const { baseUrl, cookies: cookiesConfig } = config;
  validateCookieConfig(cookiesConfig);
  const log = resolveNeonAuthLogging(config);

  const safeServer = createAuthServer({
    baseUrl,
    context: async () => {
      const headerStore = await headers();
      return {
        getCookies() {
          return extractNeonAuthCookies(headerStore);
        },
        async setCookie(name: string, value: string, options: any) {
          try {
            const cookieStore = await cookies();
            cookieStore.set(name, value, options);
          } catch {
            // Next.js React Server Components (RSC) throw:
            // "Cookies can only be modified in a Server Action or Route Handler."
            // Catching this prevents the entire page from crashing during SSR.
          }
        },
        getHeader(name: string) {
          return headerStore.get(name) ?? null;
        },
        getOrigin() {
          return headerStore.get('origin') || headerStore.get('referer')?.split('/').slice(0, 3).join('/') || '';
        },
        getFramework() {
          return 'nextjs' as const;
        },
      };
    },
    cookieSecret: cookiesConfig.secret,
    sessionDataTtl: cookiesConfig.sessionDataTtl,
    domain: cookiesConfig.domain,
    sameSite: cookiesConfig.sameSite,
    log,
  }) as NeonAuth;

  safeServer.handler = baseAuth.handler;
  safeServer.middleware = baseAuth.middleware;

  return safeServer;
}

export const auth = createSafeNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
  },
});
