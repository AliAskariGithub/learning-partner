import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getCredentialsForRequest } from '@/lib/connections/resolver';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const lang = searchParams.get('lang') || 'en';
  const host = searchParams.get('host') || '1';
  const voice = searchParams.get('voice') || (host === '2' ? 'Puck' : 'Aoede');
  const isUrdu = lang.toLowerCase().startsWith('ur');

  let defaultText = '';
  if (isUrdu) {
    defaultText =
      host === '2'
        ? 'وعلیکم السلام! میں زینب ہوں، اور ہم مل کر آپ کے مواد کا تفصیلی جائزہ لیں گے۔'
        : 'السلام علیکم! میں طارق ہوں، آپ کے آڈیو اوورویو کا پہلا میزبان۔';
  } else {
    defaultText =
      host === '2'
        ? "Hi there! I'm Jordan, ready to explore your sources in depth."
        : "Hello! I'm Alex, and welcome to your audio overview.";
  }

  const text = (searchParams.get('text') || defaultText).slice(0, 350);

  // Try high-fidelity Google Gemini TTS if session & key exist
  try {
    const session = await getSession();
    if (session?.user?.id) {
      const creds = await getCredentialsForRequest(session.user.id, 'gemini-3.8-flash');
      if (creds?.apiKey) {
        const ttsModels = [
          'gemini-2.0-flash',
          'gemini-2.5-flash',
          'gemini-3.8-flash',
          'gemini-3.7-flash',
        ];
        for (const m of ttsModels) {
          try {
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${creds.apiKey}`;
            const res = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text }] }],
                generationConfig: {
                  responseModalities: ['AUDIO'],
                  speechConfig: {
                    voiceConfig: {
                      prebuiltVoiceConfig: {
                        voiceName: voice,
                      },
                    },
                  },
                },
              }),
            });
            if (res.ok) {
              const json = await res.json();
              const base64Data = json.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
              if (base64Data) {
                const buf = Buffer.from(base64Data, 'base64');
                return new Response(buf, {
                  status: 200,
                  headers: {
                    'Content-Type': 'audio/wav',
                    'Cache-Control': 'public, max-age=86400, s-maxage=86400',
                  },
                });
              }
            }
          } catch {
            // Try next model or fallback
          }
        }
      }
    }
  } catch {
    // Fallback to translate_tts
  }

  const targetLang = isUrdu ? 'ur' : 'en';
  const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
    text
  )}&tl=${targetLang}&client=tw-ob`;

  try {
    const res = await fetch(ttsUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) {
      throw new Error(`Upstream TTS returned status ${res.status}`);
    }

    const audioBytes = await res.arrayBuffer();

    return new Response(audioBytes, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch (err: any) {
    console.error('Error fetching preview TTS:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Failed to synthesize preview audio' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

