import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp, newPassword } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    const cleanOtp = String(otp || '').trim();
    if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      return NextResponse.json(
        { error: 'Please enter a valid 6-digit verification code.' },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
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

    const res = await fetch(`${baseUrl}/email-otp/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: origin,
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        email: normalizedEmail,
        otp: cleanOtp,
        password: newPassword,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg =
        data.code === 'INVALID_OTP'
          ? 'Invalid or expired 6-digit recovery code. Please check your email or request a new one.'
          : data.message || 'Failed to reset password. Please try again.';
      return NextResponse.json({ error: errorMsg }, { status: res.status });
    }

    const response = NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now sign in with your new password.',
    });

    const setCookieHeaders = res.headers.getSetCookie?.() || [];
    for (const cookieStr of setCookieHeaders) {
      response.headers.append('set-cookie', cookieStr);
    }

    return response;
  } catch (error: any) {
    console.error('Error in reset-password route:', error);
    return NextResponse.json(
      { error: error?.message || 'An unexpected error occurred while resetting your password.' },
      { status: 500 }
    );
  }
}

