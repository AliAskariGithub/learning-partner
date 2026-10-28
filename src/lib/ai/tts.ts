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
  };
  onProgress?: (current: number, total: number) => void;
}

export interface SynthesisResult {
  audioKeys: string[];
  audioUrls: string[];
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
 * Synthesizes a single turn using Google Gemini TTS.
 */
async function synthesizeGeminiTurn(
  apiKey: string,
  text: string,
  voice: string
): Promise<Buffer> {
  // Use Gemini 3.8 Flash TTS via interactions endpoint
  const url = `https://generativelanguage.googleapis.com/v1beta/interactions?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gemini-3.8-flash-tts',
      input: text,
      speech_config: {
        voice_config: {
          prebuilt_voice_config: {
            voice_name: voice,
          },
        },
      },
    }),
  });

  if (!res.ok) {
    // Fallback: check if standard generateContent with audio modality works
    const errorText = await res.text().catch(() => '');
    throw new Error(`Google Gemini TTS Error (${res.status}): ${errorText || res.statusText}`);
  }

  const json = await res.json();
  // Extract audio bytes from response output
  let base64Audio = '';
  if (json.outputs?.[0]?.data) {
    base64Audio = json.outputs[0].data;
  } else if (json.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
    base64Audio = json.candidates[0].content.parts[0].inlineData.data;
  }

  if (!base64Audio) {
    throw new Error('Google Gemini returned empty audio response.');
  }

  return Buffer.from(base64Audio, 'base64');
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
  let totalWords = 0;

  // Process turns with small batch concurrency (max 3 at once) with retries
  const speaker1 = voiceConfig.speaker1Name?.toLowerCase() || 'alex';
  const voice1 = voiceConfig.speaker1Voice;
  const voice2 = voiceConfig.speaker2Voice;

  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i];
    const isSpeaker1 = turn.speaker.toLowerCase().includes(speaker1) || turn.speaker.toLowerCase().includes('host 1');
    const assignedVoice = isSpeaker1 ? voice1 : voice2;
    totalWords += turn.text.split(/\s+/).length;

    // Retry once on network blip
    let audioBuffer: Buffer | null = null;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        if (provider === 'google') {
          audioBuffer = await synthesizeGeminiTurn(apiKey, turn.text, assignedVoice);
        } else if (provider === 'openai') {
          audioBuffer = await synthesizeOpenAiTurn(apiKey, turn.text, assignedVoice);
        } else {
          throw new Error(`Unsupported TTS provider: ${provider}`);
        }
        break;
      } catch (err: any) {
        lastError = err;
        if (attempt === 1) {
          await new Promise((r) => setTimeout(r, 600));
        }
      }
    }

    if (!audioBuffer) {
      throw new Error(`Failed to synthesize turn ${i + 1}/${turns.length}: ${lastError?.message || 'Unknown error'}`);
    }

    const filename = `voice-turn-${Date.now()}-${i + 1}.mp3`;
    const uploadResult = await storage.upload(audioBuffer, filename, 'audio/mpeg');
    audioKeys.push(uploadResult.storageKey);
    audioUrls.push(uploadResult.url);

    if (onProgress) {
      onProgress(i + 1, turns.length);
    }
  }

  const estimatedDuration = Math.round((totalWords / 150) * 60);

  return {
    audioKeys,
    audioUrls,
    totalDurationSeconds: Math.max(10, estimatedDuration),
  };
}

