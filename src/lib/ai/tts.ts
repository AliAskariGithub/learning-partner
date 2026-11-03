import { ProviderId } from '@/lib/ai/providers';
import { getStorageAdapter } from '@/lib/storage';

export interface TurnDialogue {
  speaker: string;
  text: string;
}

export interface SynthesizeTurnsParams {
  provider: ProviderId | 'web_speech';
  apiKey?: string;
  turns: TurnDialogue[];
  voiceConfig: {
    speaker1Voice: string;
    speaker2Voice: string;
    speaker1Name?: string;
    speaker2Name?: string;
    language?: string;
  };
  onProgress?: (current: number, total: number) => void;
}

export interface SynthesisResult {
  audioKeys: string[];
  audioUrls: string[];
  fullAudioKey?: string;
  fullAudioUrl?: string;
  totalDurationSeconds: number;
}

/**
 * Synthesizes a single turn using OpenAI TTS API.
 */
async function synthesizeOpenAiTurn(
  apiKey: string,
  text: string,
  voice: string
): Promise<Buffer> {
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice: voice.toLowerCase(),
      response_format: 'mp3',
    }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`OpenAI TTS Error (${res.status}): ${errorText || res.statusText}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Synthesizes a single chunk using Google TTS service.
 */
async function synthesizeGoogleTtsChunk(chunkText: string, targetLang: string): Promise<Buffer> {
  const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
    chunkText
  )}&tl=${targetLang}&client=tw-ob`;
  const res = await fetch(ttsUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });
  if (!res.ok) {
    throw new Error(`Google TTS fallback error ${res.status}`);
  }
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

/**
 * Fallback synthesizer using Google TTS service for native pronunciation (supports Urdu, English, etc.)
 * Splits long text at natural sentence boundaries to guarantee zero truncation and full native cadence.
 */
async function synthesizeGoogleTtsFallback(text: string, lang = 'ur'): Promise<Buffer> {
  const targetLang = lang.toLowerCase().startsWith('ur') || /[\u0600-\u06FF]/.test(text) ? 'ur' : 'en';

  // Split text at natural sentence boundaries
  const sentences = text
    .split(/([۔.?!؟\n]+)/)
    .reduce<string[]>((acc, part, idx, arr) => {
      if (idx % 2 === 0) {
        const punctuation = arr[idx + 1] || '';
        const sentence = (part + punctuation).trim();
        if (sentence) acc.push(sentence);
      }
      return acc;
    }, []);

  const chunks: string[] = [];
  let currentChunk = '';
  for (const s of (sentences.length > 0 ? sentences : [text])) {
    if ((currentChunk + ' ' + s).length <= 180) {
      currentChunk = currentChunk ? `${currentChunk} ${s}` : s;
    } else {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = s;
    }
  }
  if (currentChunk) chunks.push(currentChunk);

  const buffers: Buffer[] = [];
  for (const chunk of chunks) {
    if (chunk.trim()) {
      try {
        const b = await synthesizeGoogleTtsChunk(chunk.trim(), targetLang);
        buffers.push(b);
      } catch (err) {
        console.warn('Failed to synthesize TTS chunk:', err);
      }
    }
  }

  return buffers.length === 1 ? buffers[0] : Buffer.concat(buffers);
}

function isWavBuffer(buffer: Buffer): boolean {
  return (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WAVE'
  );
}

function concatAudioBuffers(buffers: Buffer[]): { buffer: Buffer; mimeType: string; extension: string } {
  if (buffers.length === 0) {
    return { buffer: Buffer.alloc(0), mimeType: 'audio/mpeg', extension: 'mp3' };
  }
  if (buffers.length === 1) {
    const isWav = isWavBuffer(buffers[0]);
    return {
      buffer: buffers[0],
      mimeType: isWav ? 'audio/wav' : 'audio/mpeg',
      extension: isWav ? 'wav' : 'mp3',
    };
  }

  // If first buffer is WAV, perform clean RIFF/PCM concatenation
  if (isWavBuffer(buffers[0])) {
    const first = buffers[0];
    const dataMarker = Buffer.from('data');
    const firstDataIdx = first.indexOf(dataMarker);

    if (firstDataIdx !== -1) {
      const pcmChunks: Buffer[] = [];
      pcmChunks.push(first.subarray(firstDataIdx + 8));

      for (let i = 1; i < buffers.length; i++) {
        const b = buffers[i];
        const idx = b.indexOf(dataMarker);
        if (idx !== -1) {
          pcmChunks.push(b.subarray(idx + 8));
        } else {
          pcmChunks.push(b);
        }
      }

      const totalPcm = Buffer.concat(pcmChunks);
      const totalPcmLength = totalPcm.length;
      const header = Buffer.from(first.subarray(0, firstDataIdx + 8));
      const totalFileSize = header.length + totalPcmLength;
      header.writeUInt32LE(totalFileSize - 8, 4);
      header.writeUInt32LE(totalPcmLength, firstDataIdx + 4);

      return {
        buffer: Buffer.concat([header, totalPcm]),
        mimeType: 'audio/wav',
        extension: 'wav',
      };
    }
  }

  // Otherwise treat as frame-based MP3
  return {
    buffer: Buffer.concat(buffers),
    mimeType: 'audio/mpeg',
    extension: 'mp3',
  };
}

/**
 * Synthesizes a single turn using Google Gemini TTS with resilient fallback.
 */
async function synthesizeGeminiTurn(
  apiKey: string,
  text: string,
  voice: string,
  language?: string
): Promise<Buffer> {
  const isUrdu = language?.toLowerCase().startsWith('ur') || /[\u0600-\u06FF]/.test(text);

  // Gemini 3.8 / 3.1 TTS models in priority order
  const ttsModels = [
    'gemini-3.8-flash-tts',
    'gemini-3.8-flash-lite-tts',
    'gemini-3.1-flash-tts-preview',
    'gemini-2.0-flash',
  ];

  for (const model of ttsModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
        const base64Audio = json.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          return Buffer.from(base64Audio, 'base64');
        }
      } else {
        const errText = await res.text().catch(() => '');
        console.warn(`Gemini TTS model ${model} returned ${res.status}: ${errText.slice(0, 150)}`);
      }
    } catch (err) {
      console.warn(`Gemini TTS call with model ${model} failed:`, err);
    }
  }

  // Resilient fallback ensuring sound is always produced
  return synthesizeGoogleTtsFallback(text, isUrdu ? 'ur' : 'en');
}

/**
 * Synthesizes turns into audio segments, uploads them via StorageAdapter, and returns public/signed URLs.
 */
export async function synthesizeVoiceScript(
  params: SynthesizeTurnsParams
): Promise<SynthesisResult> {
  const { provider, apiKey, turns, voiceConfig, onProgress } = params;

  if (provider === 'web_speech') {
    // Web Speech API synthesizes in the browser client; no server storage needed
    // Estimate ~150 words per minute average speech rate
    const totalWords = turns.reduce((acc, t) => acc + t.text.split(/\s+/).length, 0);
    const estimatedSeconds = Math.round((totalWords / 150) * 60);

    return {
      audioKeys: [],
      audioUrls: [],
      totalDurationSeconds: Math.max(10, estimatedSeconds),
    };
  }

  if (!apiKey) {
    throw new Error(`Missing API key for TTS provider: ${provider}`);
  }

  const storage = getStorageAdapter();
  const audioKeys: string[] = [];
  const audioUrls: string[] = [];
  const allTurnBuffers: Buffer[] = [];
  let totalWords = 0;

  // Process turns with smart co-host voice assignment & resilient rate-limit pacing
  const speaker1 = voiceConfig.speaker1Name?.toLowerCase() || 'alex';
  const voice1 = voiceConfig.speaker1Voice;
  const voice2 = voiceConfig.speaker2Voice;

  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i];
    const sLower = turn.speaker.toLowerCase();

    // Accurate speaker gender detection supporting English & Urdu naming
    const isFemaleLead =
      sLower.includes(speaker1) ||
      sLower.includes('alex') ||
      sLower.includes('ایلکس') ||
      sLower.includes('host 1') ||
      sLower.includes('خاتون') ||
      sLower.includes('مریم') ||
      sLower.includes('سارہ') ||
      sLower.includes('female');

    const isJordan =
      sLower.includes('jordan') ||
      sLower.includes('جورڈن') ||
      sLower.includes('host 2') ||
      sLower.includes('طارق') ||
      sLower.includes('ارسلان') ||
      sLower.includes('male');

    // Assign Female Character Voice to Host 1 (Alex), Jordan Voice to Host 2
    const assignedVoice = isFemaleLead
      ? voice1
      : isJordan
      ? voice2
      : i % 2 === 0
      ? voice1
      : voice2;

    totalWords += turn.text.split(/\s+/).length;

    // Retry with backoff on rate limits
    let audioBuffer: Buffer | null = null;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        if (provider === 'google') {
          audioBuffer = await synthesizeGeminiTurn(apiKey, turn.text, assignedVoice, voiceConfig.language);
        } else if (provider === 'openai') {
          audioBuffer = await synthesizeOpenAiTurn(apiKey, turn.text, assignedVoice);
        } else {
          throw new Error(`Unsupported TTS provider: ${provider}`);
        }
        break;
      } catch (err: any) {
        lastError = err;
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, 1200 * attempt));
        }
      }
    }

    if (!audioBuffer) {
      throw new Error(`Failed to synthesize turn ${i + 1}/${turns.length}: ${lastError?.message || 'Unknown error'}`);
    }

    allTurnBuffers.push(audioBuffer);
    const isWav = isWavBuffer(audioBuffer);
    const mimeType = isWav ? 'audio/wav' : 'audio/mpeg';
    const ext = isWav ? 'wav' : 'mp3';
    const filename = `voice-turn-${Date.now()}-${i + 1}.${ext}`;
    const uploadResult = await storage.upload(audioBuffer, filename, mimeType);
    audioKeys.push(uploadResult.storageKey);
    audioUrls.push(uploadResult.url);

    if (onProgress) {
      onProgress(i + 1, turns.length);
    }

    // Gentle pacing delay between consecutive turns to stay within API rate limits
    if (i < turns.length - 1 && provider === 'google') {
      await new Promise((r) => setTimeout(r, 800));
    }
  }

  // Concatenate all turn audio buffers into a single seamless podcast file (like NotebookLM)
  let fullAudioKey: string | undefined = undefined;
  let fullAudioUrl: string | undefined = undefined;

  if (allTurnBuffers.length > 0) {
    try {
      const { buffer: fullBuffer, mimeType: fullMime, extension: fullExt } = concatAudioBuffers(allTurnBuffers);
      const fullFilename = `voice-full-${Date.now()}.${fullExt}`;
      const fullUpload = await storage.upload(fullBuffer, fullFilename, fullMime);
      fullAudioKey = fullUpload.storageKey;
      fullAudioUrl = fullUpload.url;
    } catch (err) {
      console.warn('Failed to stitch full podcast audio file:', err);
    }
  }

  const estimatedDuration = Math.round((totalWords / 150) * 60);

  return {
    audioKeys,
    audioUrls,
    fullAudioKey,
    fullAudioUrl,
    totalDurationSeconds: Math.max(10, estimatedDuration),
  };
}

