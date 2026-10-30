'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '@/components/ui/toast';

interface UseSpeechToTextOptions {
  onTranscript?: (text: string, isFinal: boolean) => void;
  lang?: string;
}

export function useSpeechToText(options?: UseSpeechToTextOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setIsSupported(Boolean(SpeechRecognition));
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignored if already stopped
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(
    (onResult?: (text: string, isFinal: boolean) => void, lang?: string) => {
      if (typeof window === 'undefined') return;

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        toast({
          title: 'Speech Recognition Unavailable',
          description:
            'Voice input is not supported in this browser. Please use Google Chrome, Safari, or Microsoft Edge.',
          variant: 'warning',
        });
        return;
      }

      // If already listening, toggle off
      if (isListening) {
        stopListening();
        return;
      }

      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = lang || options?.lang || 'en-US';

        let accumulatedFinal = '';

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              accumulatedFinal += (accumulatedFinal ? ' ' : '') + transcript.trim();
            } else {
              interimTranscript += transcript;
            }
          }

          const combined = (
            accumulatedFinal + (interimTranscript ? (accumulatedFinal ? ' ' : '') + interimTranscript : '')
          ).trim();

          if (combined) {
            const callback = onResult || options?.onTranscript;
            callback?.(combined, Boolean(event.results[event.results.length - 1]?.isFinal));
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition event error:', event.error);
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            toast({
              title: 'Microphone Permission Needed',
              description:
                'Microphone access was denied. Please allow microphone permissions in your browser settings to use voice input.',
              variant: 'error',
            });
          } else if (event.error === 'network') {
            toast({
              title: 'Network Issue',
              description: 'Speech recognition service encountered a network error. Please try again.',
              variant: 'warning',
            });
          }
          stopListening();
        };

        recognition.onend = () => {
          setIsListening(false);
          recognitionRef.current = null;
        };

        recognition.start();
      } catch (err: any) {
        console.error('Failed to start speech recognition:', err);
        setIsListening(false);
        recognitionRef.current = null;
      }
    },
    [isListening, options, stopListening, toast]
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
    toggleListening: startListening,
  };
}

