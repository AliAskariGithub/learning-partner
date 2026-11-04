import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get('title') || 'Learning Partner';
    const description =
      searchParams.get('desc') ||
      'AI study workspace strictly grounded in your sources with verifiable citations.';
    const badge = searchParams.get('badge') || 'Grounded Study Workspace';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: '#0c0c0e',
            backgroundImage:
              'radial-gradient(circle at 25px 25px, #1c1c22 2%, transparent 0%), radial-gradient(circle at 75px 75px, #181820 2%, transparent 0%)',
            backgroundSize: '100px 100px',
            padding: '60px 80px',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Top Row: Logo & Badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  backgroundColor: '#6366f1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '24px',
                  fontWeight: 900,
                  boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
                }}
              >
                LP
              </div>
              <span style={{ fontSize: '28px', fontWeight: 800, color: '#f4f4f5', letterSpacing: '-0.5px' }}>
                Learning Partner
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 18px',
                borderRadius: '999px',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                color: '#a5b4fc',
                fontSize: '15px',
                fontWeight: 600,
              }}
            >
              {badge}
            </div>
          </div>

          {/* Center: Title & Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '980px' }}>
            <h1
              style={{
                fontSize: '56px',
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1.15,
                letterSpacing: '-1.5px',
                margin: 0,
              }}
            >
              {title}
            </h1>
            <p
              style={{
                fontSize: '24px',
                color: '#a1a1aa',
                lineHeight: 1.45,
                margin: 0,
              }}
            >
              {description}
            </p>
          </div>

          {/* Bottom Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid #27272a',
              paddingTop: '28px',
            }}
          >
            <div style={{ display: 'flex', gap: '30px', color: '#71717a', fontSize: '16px' }}>
              <span>Verifiable Citations [1]</span>
              <span>•</span>
              <span>3 Study Modes</span>
              <span>•</span>
              <span>7 Studio Synthesizers</span>
              <span>•</span>
              <span>Zero Software Fees</span>
            </div>
            <div style={{ color: '#a5b4fc', fontSize: '16px', fontWeight: 600 }}>
              learningpartner.internal
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (err: any) {
    return new Response(`Failed to generate OG image: ${err.message}`, { status: 500 });
  }
}

