'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

interface ButtonVisual {
  label: string;
  color: 'blue' | 'green' | 'red' | 'purple' | 'emerald' | 'orange' | 'gray' | 'ghost';
}

interface HelpStep {
  text: string;
  button?: ButtonVisual;
}

type AssistantResponse =
  | { type: 'navigate'; path: string; message: string }
  | { type: 'help'; title: string; steps: HelpStep[] };

const BUTTON_STYLES: Record<ButtonVisual['color'], string> = {
  blue:    'bg-blue-600 text-white',
  green:   'bg-green-600 text-white',
  red:     'bg-red-600 text-white',
  purple:  'bg-purple-600 text-white',
  emerald: 'bg-emerald-600 text-white',
  orange:  'bg-orange-500 text-white',
  gray:    'bg-white border border-gray-300 text-gray-700',
  ghost:   'bg-white border border-gray-200 text-gray-500',
};

function ButtonMock({ label, color }: ButtonVisual) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium mx-1 shadow-sm ${BUTTON_STYLES[color]}`}>
      {label}
    </span>
  );
}

export default function AssistantBar() {
  const { t, isRTL } = useLanguage();
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AssistantResponse | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-redirect for navigate type
  useEffect(() => {
    if (response?.type === 'navigate') {
      const timer = setTimeout(() => {
        router.push(response.path);
        setResponse(null);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [response, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || loading) return;
    setLoading(true);
    setResponse(null);
    setError('');
    try {
      const res = await fetch('/api/teacher/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const d = await res.json().catch(() => null);
      if (!res.ok) {
        setError(d?.error || `Error ${res.status} — please try again.`);
        return;
      }
      setResponse(d);
      setQuestion('');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function dismiss() {
    setResponse(null);
    setError('');
    inputRef.current?.focus();
  }

  const placeholder = isRTL
    ? '...שאל כל שאלה — איך להוסיף חלון, לסמן שיעור כהושלם'
    : 'Ask anything — how to add a slot, mark a lesson completed...';

  return (
    <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-2.5">
      {/* Input row */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 max-w-3xl mx-auto">
        <span className="text-base flex-shrink-0" aria-hidden>💬</span>
        <input
          ref={inputRef}
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={placeholder}
          dir={isRTL ? 'rtl' : 'ltr'}
          className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder:text-gray-400"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="flex-shrink-0 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors"
        >
          {loading ? (
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              {isRTL ? 'שואל...' : 'Asking...'}
            </span>
          ) : (isRTL ? 'שאל ←' : 'Ask →')}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="mt-2 max-w-3xl mx-auto">
          <p className="text-xs text-red-600 px-1">{error}</p>
        </div>
      )}

      {/* Response panel */}
      {response && (
        <div className="mt-2 max-w-3xl mx-auto bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm relative" dir={isRTL ? 'rtl' : 'ltr'}>
          <button
            onClick={dismiss}
            className="absolute top-2.5 end-3 text-gray-400 hover:text-gray-600 text-lg leading-none"
            aria-label="Dismiss"
          >
            &times;
          </button>

          {response.type === 'navigate' && (
            <div className="flex items-center gap-2 text-blue-800 pe-6">
              <svg className="w-4 h-4 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span className="font-medium">{response.message}</span>
            </div>
          )}

          {response.type === 'help' && (
            <>
              <p className="font-semibold text-gray-900 mb-2.5 pe-6">{response.title}</p>
              <ol className="space-y-2">
                {response.steps.map((step, i) => (
                  <li key={i} className="flex gap-2.5 items-start">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-gray-700 leading-snug">
                      {step.text}
                      {step.button && <ButtonMock label={step.button.label} color={step.button.color} />}
                    </span>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      )}
    </div>
  );
}
