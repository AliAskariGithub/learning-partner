import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const lang = searchParams.get('lang') || 'en';
  const host = searchParams.get('host') || '1';
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

