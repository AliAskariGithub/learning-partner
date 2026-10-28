import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    const baseUrl = process.env.NEON_AUTH_BASE_URL;
    if (!baseUrl) {
      return NextResponse.json({ error: 'Auth server configuration is missing.' }, { status: 500 });
    }

    const origin = req.headers.get('origin') || req.headers.get('referer') || 'http://localhost:3000';

    const res = await fetch(`${baseUrl}/email-otp/send-verification-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: origin,
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        type: 'email-verification',
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || 'Failed to send verification code. Please try again.' },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true, message: 'Verification code sent.' });
  } catch (error: any) {
    console.error('Error in send-verification-otp route:', error);
    return NextResponse.json(
      { error: error?.message || 'An unexpected error occurred while sending the code.' },
      { status: 500 }
    );
  }
}

