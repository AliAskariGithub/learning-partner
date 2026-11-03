import { Citation } from '@/db/schema';

export type StreamingPhase =
  | 'Reading your sources'
  | 'Finding relevant passages'
  | 'Thinking'
  | 'Writing response'
  | 'Generating quiz questions'
  | 'Analyzing image'
  | 'Updating notebook memory';

export type StreamingEvent =
  | {
      type: 'status';
      phase: StreamingPhase | string;
      detail?: string;
      timestamp?: number;
    }
  | {
      type: 'reasoning_summary';
      text: string;
    }
  | {
      type: 'text_delta';
      delta: string;
    }
  | {
      type: 'citations';
      citations: Citation[];
    }
  | {
      type: 'memory_updated';
      summary: string;
      itemsCount: number;
    }
  | {
      type: 'usage';
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    }
  | {
      type: 'quiz_data';
      quiz: any;
    }
  | {
      type: 'error';
      error: string;
      code?: string;
    }
  | {
      type: 'done';
      conversationId: string;
      title?: string;
    };

/**
 * Format a typed streaming event as a valid Server-Sent Events (SSE) data frame.
 */
export function formatSSE(event: StreamingEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * Parses incoming raw SSE chunks, emitting full events and returning unparsed partial buffer.
 */
export function parseSSEBuffer(
  buffer: string,
  onEvent: (event: StreamingEvent) => void
): string {
  let remaining = buffer;
  let boundaryIndex: number;

  while ((boundaryIndex = remaining.indexOf('\n\n')) !== -1) {
    const rawMessage = remaining.slice(0, boundaryIndex).trim();
    remaining = remaining.slice(boundaryIndex + 2);

    if (!rawMessage || rawMessage.startsWith(':')) {
      continue; // Skip comments/keep-alives
    }

    const lines = rawMessage.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data:')) {
        const jsonStr = trimmed.slice(5).trim();
        if (jsonStr === '[DONE]') {
          continue;
        }
        try {
          const parsed = JSON.parse(jsonStr) as StreamingEvent;
          onEvent(parsed);
        } catch {
          // ignore malformed frame
        }
      }
    }
  }

  return remaining;
}

