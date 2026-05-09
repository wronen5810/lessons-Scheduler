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

interface CreateSlotParams {
  slot_type: 'one_time' | 'recurring';
  date?: string;
  day_of_week?: number;
  start_time: string;
  duration_minutes: number;
  title?: string | null;
  max_participants: number;
}

type AssistantResponse =
  | { type: 'navigate'; path: string; message: string }
  | { type: 'help'; title: string; steps: HelpStep[] }
  | { type: 'action'; action: 'create_slot'; message: string; params: CreateSlotParams };

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

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_NAMES_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

function ButtonMock({ label, color }: ButtonVisual) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium mx-1 shadow-sm ${BUTTON_STYLES[color]}`}>
      {label}
    </span>
  );
}

function SlotConfirmCard({
  params, onConfirm, onCancel, loading, isRTL,
}: {
  params: CreateSlotParams;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
  isRTL: boolean;
}) {
  const dayNames = isRTL ? DAY_NAMES_HE : DAY_NAMES;
  const isRecurring = params.slot_type === 'recurring';
  const slotLabel = isRecurring
    ? `${isRTL ? 'כל יום' : 'Every'} ${dayNames[params.day_of_week ?? 0]}`
    : params.date ?? '';

  return (
    <div className="space-y-2.5">
      <p className="text-sm font-semibold text-gray-900">
        {isRTL ? 'אישור יצירת חלון' : 'Confirm new slot'}
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700">
        <span className="text-gray-400">{isRTL ? 'סוג' : 'Type'}</span>
        <span className="font-medium">{isRecurring ? (isRTL ? 'שבועי קבוע' : 'Weekly recurring') : (isRTL ? 'חד פעמי' : 'One-time')}</span>
        <span className="text-gray-400">{isRTL ? (isRecurring ? 'יום' : 'תאריך') : (isRecurring ? 'Day' : 'Date')}</span>
        <span className="font-medium">{slotLabel}</span>
        <span className="text-gray-400">{isRTL ? 'שעה' : 'Time'}</span>
        <span className="font-medium">{params.start_time}</span>
        <span className="text-gray-400">{isRTL ? 'משך' : 'Duration'}</span>
        <span className="font-medium">{params.duration_minutes} {isRTL ? 'דק׳' : 'min'}</span>
        {params.max_participants > 1 && (
          <>
            <span className="text-gray-400">{isRTL ? 'מקס׳ תלמידים' : 'Max students'}</span>
            <span className="font-medium">{params.max_participants}</span>
          </>
        )}
        {params.title && (
          <>
            <span className="text-gray-400">{isRTL ? 'כותרת' : 'Title'}</span>
            <span className="font-medium">{params.title}</span>
          </>
        )}
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? (isRTL ? 'יוצר...' : 'Creating...') : (isRTL ? 'אישור ✓' : 'Create ✓')}
        </button>
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 py-1.5 rounded-lg border border-gray-300 text-gray-600 text-xs hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {isRTL ? 'ביטול' : 'Cancel'}
        </button>
      </div>
    </div>
  );
}

export default function AssistantBar() {
  const { isRTL } = useLanguage();
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AssistantResponse | null>(null);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionDone, setActionDone] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

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
    setActionDone('');
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

  async function handleCreateSlot() {
    if (response?.type !== 'action' || response.action !== 'create_slot') return;
    const { params } = response;
    setActionLoading(true);
    setError('');

    try {
      let res: Response;
      if (params.slot_type === 'recurring') {
        res = await fetch('/api/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            day_of_week: params.day_of_week,
            start_time: params.start_time,
            duration_minutes: params.duration_minutes,
            title: params.title ?? null,
            max_participants: params.max_participants,
          }),
        });
      } else {
        res = await fetch('/api/teacher/one-time-slots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            specific_date: params.date,
            start_time: params.start_time,
            duration_minutes: params.duration_minutes,
            title: params.title ?? null,
            max_participants: params.max_participants,
          }),
        });
      }

      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setError(d?.error || (isRTL ? 'שגיאה ביצירת החלון' : 'Failed to create slot'));
      } else {
        setActionDone(isRTL ? '✓ החלון נוצר בהצלחה' : '✓ Slot created successfully');
        setResponse(null);
        setTimeout(() => setActionDone(''), 4000);
      }
    } catch {
      setError(isRTL ? 'שגיאת רשת' : 'Network error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  }

  function dismiss() {
    setResponse(null);
    setError('');
    setActionDone('');
    inputRef.current?.focus();
  }

  const placeholder = isRTL
    ? '...שאל או בקש — "הוסף חלון ביום שני ב-15:00", "איך לאשר שיעור"'
    : 'Ask or command — "add a slot Monday at 3pm", "how to approve a lesson"...';

  return (
    <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-2.5">
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

      {error && (
        <div className="mt-2 max-w-3xl mx-auto">
          <p className="text-xs text-red-600 px-1">{error}</p>
        </div>
      )}

      {actionDone && (
        <div className="mt-2 max-w-3xl mx-auto">
          <p className="text-xs text-emerald-600 font-medium px-1">{actionDone}</p>
        </div>
      )}

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

          {response.type === 'action' && response.action === 'create_slot' && (
            <div className="pe-6">
              <SlotConfirmCard
                params={response.params}
                onConfirm={handleCreateSlot}
                onCancel={dismiss}
                loading={actionLoading}
                isRTL={isRTL}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
