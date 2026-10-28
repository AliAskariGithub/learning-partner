import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    const cleanOtp = String(otp || '').trim();
    if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      return NextResponse.json(
        { error: 'Please enter a valid 6-digit numeric verification code.' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEON_AUTH_BASE_URL;
    if (!baseUrl) {
      return NextResponse.json({ error: 'Auth server configuration is missing.' }, { status: 500 });
    }

    const origin = req.headers.get('origin') || req.headers.get('referer') || 'http://localhost:3000';
    const cookieHeader = req.headers.get('cookie') || '';

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Call Neon Auth's verify-email endpoint
    const res = await fetch(`${baseUrl}/email-otp/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: origin,
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        email: normalizedEmail,
        otp: cleanOtp,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg =
        data.code === 'INVALID_OTP'
          ? 'Invalid or expired 6-digit code. Please check your email or request a new one.'
          : data.message || 'Verification failed. Please try again.';
      return NextResponse.json({ error: errorMsg }, { status: res.status });
    }

    // 2. Direct database update to guarantee neon_auth.user.emailVerified is true
    try {
      if (process.env.DATABASE_URL) {
        const sql = neon(process.env.DATABASE_URL);
        await sql.query(
          `UPDATE neon_auth.user SET "emailVerified" = true, "updatedAt" = NOW() WHERE LOWER(email) = LOWER($1)`,
          [normalizedEmail]
        );
      }
    } catch (dbErr) {
      console.warn('Database direct update warning (non-fatal):', dbErr);
    }

    // 3. Create response and pass along any set-cookie headers from Neon Auth
    const response = NextResponse.json({
      success: true,
      message: 'Email verified successfully.',
      user: data.user,
    });

    const setCookieHeaders = res.headers.getSetCookie?.() || [];
    for (const cookieStr of setCookieHeaders) {
      response.headers.append('set-cookie', cookieStr);
    }

    return response;
  } catch (error: any) {
    console.error('Error in verify-otp route:', error);
    return NextResponse.json(
      { error: error?.message || 'An unexpected error occurred during verification.' },
      { status: 500 }
    );
  }
}

