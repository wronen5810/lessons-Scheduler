'use client';

import { useRef, useState, useEffect } from 'react';

export interface UseSpeechRecognitionReturn {
  listen: (onResult: (transcript: string) => void, onError?: (code: string) => void) => void;
  stop: () => void;
  listening: boolean;
  supported: boolean;
}

export function useSpeechRecognition(lang: string): UseSpeechRecognitionReturn {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
      setSupported(!!SR);
    }
  }, []);

  function stop() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }

  function listen(onResult: (transcript: string) => void, onError?: (code: string) => void): void {
    if (typeof window === 'undefined') return;
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) return;

    // Explicitly request mic permission first — this triggers the browser prompt on Android
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        // Permission granted — release the stream and start recognition
        stream.getTracks().forEach((t) => t.stop());
        startRecognition(SR, onResult, onError);
      })
      .catch((err) => {
        console.error('[SpeechRecognition] mic permission denied:', err);
        onError?.('not-allowed');
      });
  }

  function startRecognition(
    SR: typeof SpeechRecognition,
    onResult: (transcript: string) => void,
    onError?: (code: string) => void,
  ): void {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = new SR();
    recognitionRef.current = recognition;

    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = true;

    let gotResult = false;

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[event.results.length - 1]?.[0]?.transcript ?? '';
      if (transcript.trim()) {
        gotResult = true;
        recognition.stop();
        onResult(transcript.trim());
      }
    };

    recognition.onerror = (ev: SpeechRecognitionErrorEvent) => {
      console.error('[SpeechRecognition] error:', ev.error);
      setListening(false);
      recognitionRef.current = null;
      if (!gotResult) onError?.(ev.error);
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
    } catch (e) {
      console.error('[SpeechRecognition] start error:', e);
      setListening(false);
      recognitionRef.current = null;
      onError?.('start-failed');
    }
  }

  return { listen, stop, listening, supported };
}
