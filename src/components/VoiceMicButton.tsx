'use client';

import { Mic } from 'lucide-react';
import { useSpeechRecognition } from '@/lib/useSpeechRecognition';

interface Props {
  onTranscript: (text: string) => void;
  lang: string;
  className?: string;
}

export default function VoiceMicButton({ onTranscript, lang, className = '' }: Props) {
  const { listen, listening, supported } = useSpeechRecognition(lang);

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={() => listen(onTranscript)}
      aria-label={listening ? 'Listening...' : 'Voice input'}
      className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl border transition-all ${
        listening
          ? 'bg-red-50 border-red-300 text-red-500 animate-pulse'
          : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-500'
      } ${className}`}
    >
      <Mic className="w-4 h-4" />
    </button>
  );
}
