'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { UserPlus, CalendarPlus, Users2, MessageSquare, X, ArrowLeft, UserPlus2, Settings, CreditCard } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { translate } from '@/lib/i18n';
import VoiceMicButton from '@/components/VoiceMicButton';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Student {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
}

interface Group {
  id: string;
  name: string;
  members: { student_id: string; student_name: string }[];
}

type WizardId = 'student' | 'slot' | 'group' | 'message';

interface Props {
  onRefresh?: () => void;
  onOpenSettings?: () => void;
}

// ─── Shared Modal Shell ───────────────────────────────────────────────────────

function WizardShell({
  title,
  step,
  total,
  onBack,
  onClose,
  children,
}: {
  title: string;
  step: number;
  total: number;
  onBack?: () => void;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { lang, isRTL } = useLanguage();
  const stepLabel = translate(lang, 'wizard.stepOf', { step: String(step), total: String(total) });

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-sm">
        <div className="flex items-center gap-3 px-5 pt-5 pb-3">
          {onBack && (
            <button onClick={onBack} className="text-gray-400 hover:text-gray-600 -ml-1 flex-shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 font-medium">{stepLabel}</p>
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="mx-5 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${(step / total) * 100}%` }}
          />
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Shared Action Buttons ────────────────────────────────────────────────────

function WizardActions({
  onNext,
  onSkip,
  nextLabel,
  disabled = false,
  loading = false,
}: {
  onNext: () => void;
  onSkip?: () => void;
  nextLabel?: string;
  disabled?: boolean;
  loading?: boolean;
}) {
  const { t } = useLanguage();
  const label = nextLabel ?? t('common.next');

  return (
    <div className="flex gap-3 mt-5">
      <button
        onClick={() => onNext()}
        disabled={disabled || loading}
        className="flex-1 bg-blue-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? t('common.loading') : label}
      </button>
      {onSkip && (
        <button onClick={() => onSkip()} className="px-4 text-sm text-gray-400 hover:text-gray-600">
          {t('common.skip')}
        </button>
      )}
    </div>
  );
}

// ─── Checkbox Icon ────────────────────────────────────────────────────────────

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <div
      className={`w-4 h-4 rounded flex-shrink-0 border-2 transition-all ${
        checked ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
      }`}
    >
      {checked && (
        <svg viewBox="0 0 10 10" fill="none" className="w-full h-full">
          <path d="M2 5l2 2 4-4" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

// ─── Success Screen ───────────────────────────────────────────────────────────

function SuccessScreen({ message, onClose }: { message: string; onClose: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="text-center py-2">
      <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
        <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p className="text-base font-semibold text-gray-900">{message}</p>
      <button
        onClick={onClose}
        className="mt-5 w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        {t('common.done')}
      </button>
    </div>
  );
}

// ─── Add Student Wizard ───────────────────────────────────────────────────────

function AddStudentWizard({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  type Step = 'name' | 'email' | 'phone' | 'done';

  const { t, lang } = useLanguage();
  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const stepNum = step === 'name' ? 1 : step === 'email' ? 2 : 3;
  const title = t('wizard.addStudent');

  async function save() {
    setLoading(true);
    setError('');
    const res = await fetch('/api/teacher/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), email: email.trim() || null, phone: phone.trim() || null }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || 'Failed to add student');
      return;
    }
    onDone();
    setStep('done');
  }

  if (step === 'done') {
    return (
      <WizardShell title={title} step={3} total={3} onClose={onClose}>
        <SuccessScreen message={translate(lang, 'wizard.addedSuccess', { name })} onClose={onClose} />
      </WizardShell>
    );
  }

  return (
    <WizardShell
      title={title}
      step={stepNum}
      total={3}
      onBack={step !== 'name' ? () => setStep(step === 'email' ? 'name' : 'email') : undefined}
      onClose={onClose}
    >
      {step === 'name' && (
        <>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('wizard.studentName')}</label>
          <div className="flex items-center gap-2">
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('students.fullName')}
              className="flex-1 border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && name.trim() && setStep('email')}
            />
            <VoiceMicButton lang={lang === 'he' ? 'he-IL' : 'en-US'} onTranscript={(text) => setName(text)} />
          </div>
          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
          <WizardActions onNext={() => setStep('email')} disabled={!name.trim()} />
        </>
      )}

      {step === 'email' && (
        <>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('wizard.emailOptional')}</label>
          <div className="flex items-center gap-2">
            <input
              autoFocus
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@example.com"
              className="flex-1 border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && setStep('phone')}
            />
            <VoiceMicButton lang={lang === 'he' ? 'he-IL' : 'en-US'} onTranscript={(text) => setEmail(text)} />
          </div>
          <WizardActions onNext={() => setStep('phone')} onSkip={() => setStep('phone')} />
        </>
      )}

      {step === 'phone' && (
        <>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('wizard.phoneOptional')}</label>
          <div className="flex items-center gap-2">
            <input
              autoFocus
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+972 50 000 0000"
              className="flex-1 border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && save()}
            />
            <VoiceMicButton lang={lang === 'he' ? 'he-IL' : 'en-US'} onTranscript={(text) => setPhone(text)} />
          </div>
          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
          <WizardActions onNext={save} onSkip={save} nextLabel={t('common.save')} loading={loading} />
        </>
      )}
    </WizardShell>
  );
}

// ─── Add Slot Wizard ──────────────────────────────────────────────────────────

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: String(i).padStart(2, '0'),
}));
const MINUTE_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => ({
  value: m,
  label: String(m).padStart(2, '0'),
}));

export function AddSlotWizard({ onClose, onDone, initialDate }: { onClose: () => void; onDone: () => void; initialDate?: string }) {
  type SlotType = 'one-time' | 'weekly';
  type Step = 'type' | 'when' | 'time' | 'enddate' | 'assign' | 'pickStudent' | 'done';

  const { t, lang } = useLanguage();
  const today = new Date().toISOString().slice(0, 10);

  // When a specific date is provided, skip type+when and go straight to time
  const [step, setStep] = useState<Step>(initialDate ? 'time' : 'type');
  const [slotType, setSlotType] = useState<SlotType>('one-time');
  const [date, setDate] = useState(initialDate ?? today);
  const [dayOfWeek, setDayOfWeek] = useState(new Date().getDay());
  const [hour, setHour] = useState(16);
  const [minute, setMinute] = useState(0);
  const [duration, setDuration] = useState(45);
  const [endDate, setEndDate] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [createdSlot, setCreatedSlot] = useState<{ id: string; start_time: string; specific_date?: string } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [prepaid, setPrepaid] = useState(false);

  // Inline new-student form (inside pickStudent step)
  const [showNewStudent, setShowNewStudent] = useState(false);
  const newStudentNameRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (showNewStudent) newStudentNameRef.current?.focus();
  }, [showNewStudent]);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [addingStudent, setAddingStudent] = useState(false);
  const [addStudentError, setAddStudentError] = useState('');

  async function createAndSelectStudent() {
    if (!newName.trim()) return;
    setAddingStudent(true);
    setAddStudentError('');
    const res = await fetch('/api/teacher/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), email: newEmail.trim() || null, phone: newPhone.trim() || null }),
    });
    setAddingStudent(false);
    if (!res.ok) {
      const d = await res.json();
      setAddStudentError(d.error || 'Failed to add student');
      return;
    }
    const created: Student = await res.json();
    setStudents((prev) => [...prev, created]);
    setSelectedStudent(created);
    setShowNewStudent(false);
    setNewName(''); setNewEmail(''); setNewPhone('');
    await assignStudent(created);
  }

  const isWeekly = slotType === 'weekly';
  // When initialDate provided: time(1)→assign(2) = 2 steps
  const totalSteps = initialDate ? 2 : (isWeekly ? 4 : 3);
  const title = t('wizard.addSlot');

  // Day names via translation
  const dayNames = [
    t('days.sunday'), t('days.monday'), t('days.tuesday'),
    t('days.wednesday'), t('days.thursday'), t('days.friday'), t('days.saturday'),
  ];

  function getStepNum(): number {
    if (initialDate) {
      // Compressed flow: time(1), assign/pickStudent(2)
      const map: Partial<Record<Step, number>> = {
        time: 1, assign: 2, pickStudent: 2,
      };
      return map[step] ?? 1;
    }
    const map: Partial<Record<Step, number>> = {
      type: 1, when: 2, time: 3,
      enddate: 4, assign: isWeekly ? 4 : 3, pickStudent: isWeekly ? 4 : 3,
    };
    return map[step] ?? 1;
  }

  function prevStep() {
    const prev: Partial<Record<Step, Step>> = {
      when: 'type',
      time: initialDate ? undefined : 'when',
      enddate: 'time',
      assign: isWeekly ? 'enddate' : 'time',
      pickStudent: 'assign',
    } as Partial<Record<Step, Step>>;
    const p = prev[step];
    if (p) setStep(p);
  }

  async function createSlot(): Promise<boolean> {
    setLoading(true);
    setError('');
    const startTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

    const res = await fetch(isWeekly ? '/api/templates' : '/api/teacher/one-time-slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        isWeekly
          ? { day_of_week: dayOfWeek, start_time: startTime, duration_minutes: duration, end_date: endDate || null }
          : { specific_date: date, start_time: startTime, duration_minutes: duration }
      ),
    });

    setLoading(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || 'Failed to create slot');
      return false;
    }
    const data = await res.json();
    setCreatedSlot({ id: data.id, start_time: startTime, specific_date: date });
    return true;
  }

  async function goToAssign() {
    if (!createdSlot) {
      const ok = await createSlot();
      if (!ok) return;
    }
    const res = await fetch('/api/teacher/students');
    const data = await res.json();
    if (Array.isArray(data)) setStudents(data.filter((s: Student) => s.is_active));
    setStep('assign');
  }

  async function assignStudent(studentOverride?: Student) {
    const student = studentOverride ?? selectedStudent;
    if (!createdSlot || !student) return;
    setLoading(true);
    setError('');
    const startTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    const res = await fetch('/api/teacher/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_type: isWeekly ? 'recurring' : 'one_time',
        ...(isWeekly ? { template_id: createdSlot.id } : { one_time_slot_id: createdSlot.id }),
        date: isWeekly ? date : createdSlot.specific_date,
        end_date: endDate || null,
        start_time: startTime,
        student_id: student.id,
        student_name: student.name,
        student_email: student.email,
        prepaid,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || 'Failed to assign student');
      return;
    }
    onDone();
    setStep('done');
  }

  function saveAndLeaveOpen() {
    onDone();
    setStep('done');
  }

  if (step === 'done') {
    const msg = selectedStudent
      ? translate(lang, 'wizard.slotCreatedAssigned', { name: selectedStudent.name })
      : t('wizard.slotCreated');
    return (
      <WizardShell title={title} step={totalSteps} total={totalSteps} onClose={onClose}>
        <SuccessScreen message={msg} onClose={onClose} />
      </WizardShell>
    );
  }

  return (
    <WizardShell
      title={title}
      step={getStepNum()}
      total={totalSteps}
      onBack={step !== 'type' ? prevStep : undefined}
      onClose={onClose}
    >
      {step === 'type' && (
        <>
          <p className="text-sm font-medium text-gray-700 mb-4">{t('wizard.whatTypeSlot')}</p>
          <div className="grid grid-cols-2 gap-3">
            {(['one-time', 'weekly'] as const).map((tp) => (
              <button
                key={tp}
                onClick={() => { setSlotType(tp); setStep('when'); }}
                className="rounded-xl border-2 border-gray-200 py-5 text-sm font-semibold text-gray-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-all"
              >
                {tp === 'one-time' ? t('wizard.oneTime') : t('wizard.weekly')}
                <p className="text-xs font-normal mt-1 text-gray-400">
                  {tp === 'one-time' ? t('wizard.singleDate') : t('wizard.repeating')}
                </p>
              </button>
            ))}
          </div>
        </>
      )}

      {step === 'when' && !isWeekly && (
        <>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('wizard.date')}</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <WizardActions onNext={() => setStep('time')} disabled={!date} />
        </>
      )}

      {step === 'when' && isWeekly && (
        <>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('wizard.dayOfWeek')}</label>
          <select
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {dayNames.map((d, i) => (
              <option key={i} value={i}>{d}</option>
            ))}
          </select>
          <WizardActions onNext={() => setStep('time')} />
        </>
      )}

      {step === 'time' && (
        <>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('wizard.startTime')}</label>
          <div className="flex items-center gap-2">
            <select
              value={hour}
              onChange={(e) => setHour(Number(e.target.value))}
              className="flex-1 border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {HOUR_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <span className="text-gray-400 font-bold text-lg">:</span>
            <select
              value={minute}
              onChange={(e) => setMinute(Number(e.target.value))}
              className="w-24 border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {MINUTE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <label className="block text-sm font-medium text-gray-700 mt-4 mb-2">{t('wizard.durationMin')}</label>
          <input
            type="number"
            min={15}
            max={180}
            step={5}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
          <WizardActions
            onNext={() => isWeekly ? setStep('enddate') : goToAssign()}
            loading={loading}
          />
        </>
      )}

      {step === 'enddate' && (
        <>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('wizard.endDateOptional')}</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
          <WizardActions onNext={goToAssign} onSkip={goToAssign} loading={loading} />
        </>
      )}

      {step === 'assign' && (
        <>
          <p className="text-sm font-medium text-gray-700 mb-4">{t('wizard.assignSlot')}</p>
          <div className="space-y-3">
            <button
              onClick={() => setStep('pickStudent')}
              className="w-full border-2 border-blue-200 rounded-xl py-3.5 text-sm font-medium text-blue-700 hover:border-blue-400 hover:bg-blue-50 transition-all"
            >
              {t('wizard.yesAssignStudent')}
            </button>
            <button
              onClick={saveAndLeaveOpen}
              className="w-full border-2 border-gray-200 rounded-xl py-3.5 text-sm font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              {t('wizard.leaveOpen')}
            </button>
          </div>
          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
        </>
      )}

      {step === 'pickStudent' && (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-700">{t('wizard.selectStudent')}</p>
            {!showNewStudent && (
              <button
                onClick={() => setShowNewStudent(true)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
              >
                <UserPlus2 className="w-3.5 h-3.5" />
                {t('wizard.newStudentLabel')}
              </button>
            )}
          </div>

          {showNewStudent ? (
            <div className="border border-blue-200 rounded-xl p-3 space-y-2 bg-blue-50 mb-3">
              <p className="text-xs font-medium text-blue-800">{t('wizard.addNewStudentHeader')}</p>
              <input
                ref={newStudentNameRef}
                type="text"
                placeholder="Full name *"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="tel"
                placeholder="Phone (optional)"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {addStudentError && <p className="text-xs text-red-600">{addStudentError}</p>}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={createAndSelectStudent}
                  disabled={addingStudent || !newName.trim()}
                  className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {addingStudent ? t('common.loading') : t('wizard.addAndSelect')}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowNewStudent(false); setNewName(''); setNewEmail(''); setNewPhone(''); setAddStudentError(''); }}
                  className="flex-1 py-2 rounded-xl border border-gray-300 text-gray-600 text-sm hover:bg-gray-50"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-52 overflow-y-auto -mx-1 px-1 mb-1">
              {students.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No students yet — add one above.</p>
              ) : (
                students.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStudent(s)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2 ${
                      selectedStudent?.id === s.id
                        ? 'bg-blue-50 border-2 border-blue-400 text-blue-800 font-medium'
                        : 'border border-gray-100 hover:border-blue-200 hover:bg-blue-50'
                    }`}
                  >
                    <CheckBox checked={selectedStudent?.id === s.id} />
                    <span className="flex-1">{s.name}</span>
                    {s.email && <span className="text-xs text-gray-400 truncate max-w-[120px]">{s.email}</span>}
                  </button>
                ))
              )}
            </div>
          )}

          {selectedStudent && !showNewStudent && (
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none mt-3">
              <input
                type="checkbox"
                checked={prepaid}
                onChange={(e) => setPrepaid(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 accent-blue-600"
              />
              <span>Prepaid <span className="text-gray-400 font-normal text-xs">(student already paid)</span></span>
            </label>
          )}
          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
          <WizardActions
            onNext={assignStudent}
            nextLabel={t('wizard.assign')}
            disabled={!selectedStudent || showNewStudent}
            loading={loading}
          />
        </>
      )}
    </WizardShell>
  );
}

// ─── Add Group Wizard ─────────────────────────────────────────────────────────

function AddGroupWizard({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  type Step = 'name' | 'members' | 'done';

  const { t, lang } = useLanguage();
  const [step, setStep] = useState<Step>('name');
  const [groupName, setGroupName] = useState('');
  const [groupId, setGroupId] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const title = t('wizard.addGroup');

  async function createGroup() {
    setLoading(true);
    setError('');
    const res = await fetch('/api/teacher/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: groupName.trim() }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || 'Failed to create group');
      return;
    }
    const data = await res.json();
    setGroupId(data.id);
    const sr = await fetch('/api/teacher/students');
    const sd = await sr.json();
    if (Array.isArray(sd)) setStudents(sd.filter((s: Student) => s.is_active));
    setStep('members');
  }

  async function saveMembers() {
    if (selectedIds.size === 0) { onDone(); setStep('done'); return; }
    setLoading(true);
    setError('');
    await Promise.allSettled(
      Array.from(selectedIds).map((id) =>
        fetch(`/api/teacher/groups/${groupId}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student_id: id }),
        })
      )
    );
    setLoading(false);
    onDone();
    setStep('done');
  }

  function toggleStudent(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  if (step === 'done') {
    return (
      <WizardShell title={title} step={2} total={2} onClose={onClose}>
        <SuccessScreen message={translate(lang, 'wizard.groupCreated', { name: groupName })} onClose={onClose} />
      </WizardShell>
    );
  }

  const membersNextLabel = selectedIds.size > 0
    ? translate(lang, selectedIds.size === 1 ? 'wizard.addMembersSingular' : 'wizard.addMembersPlural', { count: String(selectedIds.size) })
    : t('common.skip');

  return (
    <WizardShell
      title={title}
      step={step === 'name' ? 1 : 2}
      total={2}
      onBack={step === 'members' ? () => setStep('name') : undefined}
      onClose={onClose}
    >
      {step === 'name' && (
        <>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('wizard.groupNameLabel')}</label>
          <div className="flex items-center gap-2">
            <input
              autoFocus
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder={t('wizard.groupNamePlaceholder')}
              className="flex-1 border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && groupName.trim() && createGroup()}
            />
            <VoiceMicButton lang={lang === 'he' ? 'he-IL' : 'en-US'} onTranscript={(text) => setGroupName(text)} />
          </div>
          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
          <WizardActions onNext={createGroup} disabled={!groupName.trim()} loading={loading} />
        </>
      )}

      {step === 'members' && (
        <>
          <p className="text-sm font-medium text-gray-700 mb-3">{t('wizard.addStudentsOptional')}</p>
          {students.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">{t('wizard.noStudentsYet')}</p>
          ) : (
            <div className="space-y-1.5 max-h-52 overflow-y-auto -mx-1 px-1">
              {students.map((s) => (
                <button
                  key={s.id}
                  onClick={() => toggleStudent(s.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all ${
                    selectedIds.has(s.id)
                      ? 'bg-blue-50 border-2 border-blue-400 text-blue-800 font-medium'
                      : 'border border-gray-100 hover:border-blue-200'
                  }`}
                >
                  <CheckBox checked={selectedIds.has(s.id)} />
                  {s.name}
                </button>
              ))}
            </div>
          )}
          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
          <WizardActions
            onNext={saveMembers}
            onSkip={students.length > 0 ? () => { onDone(); setStep('done'); } : undefined}
            nextLabel={membersNextLabel}
            loading={loading}
          />
        </>
      )}
    </WizardShell>
  );
}

// ─── Send Message Wizard ──────────────────────────────────────────────────────

function SendMessageWizard({ onClose }: { onClose: () => void }) {
  type Step = 'message' | 'recipients' | 'method' | 'done';

  const { t, lang } = useLanguage();
  const [step, setStep] = useState<Step>('message');
  const [message, setMessage] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [channels, setChannels] = useState({ email: true, notification: false, whatsapp: false });
  const [waResult, setWaResult] = useState<{ sent: number; failed: { name: string }[]; noPhone: { name: string; email: string }[] } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const title = t('wizard.sendMessage');

  async function goToRecipients() {
    setLoading(true);
    const [sr, gr] = await Promise.all([
      fetch('/api/teacher/students').then((r) => r.json()),
      fetch('/api/teacher/groups').then((r) => r.json()),
    ]);
    if (Array.isArray(sr)) setStudents(sr.filter((s: Student) => s.is_active));
    if (Array.isArray(gr)) setGroups(gr);
    setLoading(false);
    setStep('recipients');
  }

  function toggleStudentId(id: string) {
    setSelectedStudentIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleGroupId(id: string) {
    setSelectedGroupIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleChannel(key: keyof typeof channels) {
    setChannels((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function sendMessage() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/teacher/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          studentIds: Array.from(selectedStudentIds),
          groupIds: Array.from(selectedGroupIds),
          channels,
        }),
      });
      setLoading(false);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError((d as { error?: string }).error || `Error ${res.status}`);
        return;
      }
      const data = await res.json();
      if (channels.whatsapp) {
        setWaResult(data?.result?.whatsapp ?? { sent: 0, failed: [], noPhone: [] });
      }
      setStep('done');
    } catch (err) {
      setLoading(false);
      setError(lang === 'he' ? 'שגיאת רשת, נסה שוב' : 'Network error, please try again');
      console.error('Send message error:', err);
    }
  }

  const hasRecipients = selectedStudentIds.size > 0 || selectedGroupIds.size > 0;
  const hasChannels = Object.values(channels).some(Boolean);

  if (step === 'done') {
    return (
      <WizardShell title={title} step={3} total={3} onClose={onClose}>
        {channels.whatsapp && waResult ? (
          <div className="py-1 text-center">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${waResult.sent > 0 ? 'bg-green-100' : 'bg-amber-100'}`}>
              <svg className={`w-7 h-7 ${waResult.sent > 0 ? 'text-green-600' : 'text-amber-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={waResult.sent > 0 ? 'M5 13l4 4L19 7' : 'M12 9v4m0 4h.01'} />
              </svg>
            </div>
            <p className="text-base font-semibold text-gray-900">
              {waResult.sent > 0
                ? (lang === 'he' ? `נשלח ל-${waResult.sent} נמענים` : `Sent to ${waResult.sent} recipient${waResult.sent !== 1 ? 's' : ''}`)
                : (lang === 'he' ? 'לא נשלחו הודעות' : 'No messages sent')}
            </p>
            {waResult.failed.length > 0 && (
              <p className="text-xs text-red-500 mt-2">
                {lang === 'he'
                  ? `נכשל: ${waResult.failed.map(f => f.name).join(', ')}`
                  : `Failed: ${waResult.failed.map(f => f.name).join(', ')}`}
              </p>
            )}
            {waResult.noPhone.length > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                {lang === 'he'
                  ? `ללא טלפון: ${waResult.noPhone.map(p => p.name).join(', ')}`
                  : `No phone: ${waResult.noPhone.map(p => p.name).join(', ')}`}
              </p>
            )}
            <button onClick={onClose} className="mt-5 w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-blue-700 transition-colors">
              {t('common.done')}
            </button>
          </div>
        ) : (
          <SuccessScreen message={t('wizard.messageSent')} onClose={onClose} />
        )}
      </WizardShell>
    );
  }

  const channelOptions = [
    { key: 'email' as const,        label: t('common.email'),       desc: t('wizard.emailDesc') },
    { key: 'notification' as const, label: t('wizard.pushNotif'),   desc: t('wizard.pushNotifDesc') },
    { key: 'whatsapp' as const,     label: t('wizard.whatsapp'),    desc: t('wizard.whatsappDesc') },
  ];

  return (
    <WizardShell
      title={title}
      step={step === 'message' ? 1 : step === 'recipients' ? 2 : 3}
      total={3}
      onBack={
        step === 'recipients' ? () => setStep('message') :
        step === 'method'     ? () => setStep('recipients') :
        undefined
      }
      onClose={onClose}
    >
      {step === 'message' && (
        <>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">{t('wizard.messageLabel')}</label>
            <VoiceMicButton
              lang={lang === 'he' ? 'he-IL' : 'en-US'}
              onTranscript={(text) => setMessage((prev) => prev ? prev + ' ' + text : text)}
            />
          </div>
          <textarea
            autoFocus
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('wizard.messagePlaceholder')}
            rows={4}
            className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <WizardActions
            onNext={goToRecipients}
            disabled={!message.trim()}
            loading={loading}
          />
        </>
      )}

      {step === 'recipients' && (
        <>
          <p className="text-sm font-medium text-gray-700 mb-3">{t('wizard.selectRecipients')}</p>
          {groups.length === 0 && students.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">{t('wizard.noStudentsYet')}</p>
          ) : (
            <div className="max-h-56 overflow-y-auto space-y-3 -mx-1 px-1">
              {groups.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-1.5 px-1">{t('common.groups')}</p>
                  <div className="space-y-1.5">
                    {groups.map((g) => (
                      <button key={g.id} onClick={() => toggleGroupId(g.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all ${
                          selectedGroupIds.has(g.id) ? 'bg-blue-50 border-2 border-blue-400 text-blue-800 font-medium' : 'border border-gray-100 hover:border-blue-200'
                        }`}>
                        <CheckBox checked={selectedGroupIds.has(g.id)} />
                        <span className="flex-1">{g.name}</span>
                        <span className="text-xs text-gray-400">
                          {translate(lang, 'wizard.studentsCountLabel', { count: String(g.members.length) })}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {students.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-1.5 px-1">{t('common.students')}</p>
                  <div className="space-y-1.5">
                    {students.map((s) => (
                      <button key={s.id} onClick={() => toggleStudentId(s.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all ${
                          selectedStudentIds.has(s.id) ? 'bg-blue-50 border-2 border-blue-400 text-blue-800 font-medium' : 'border border-gray-100 hover:border-blue-200'
                        }`}>
                        <CheckBox checked={selectedStudentIds.has(s.id)} />
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <WizardActions onNext={() => setStep('method')} disabled={!hasRecipients} />
        </>
      )}

      {step === 'method' && (
        <>
          <p className="text-sm font-medium text-gray-700 mb-3">{t('wizard.sendVia')}</p>
          <div className="space-y-2">
            {channelOptions.map(({ key, label, desc }) => (
              <button key={key} onClick={() => toggleChannel(key)}
                className={`w-full text-left px-3 py-3 rounded-xl text-sm flex items-center gap-3 transition-all ${
                  channels[key] ? 'bg-blue-50 border-2 border-blue-400 text-blue-800' : 'border border-gray-200 hover:border-blue-200'
                }`}>
                <CheckBox checked={channels[key]} />
                <div>
                  <p className="font-medium">{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
              </button>
            ))}
          </div>
          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
          <WizardActions
            onNext={sendMessage}
            nextLabel={t('common.send')}
            disabled={!hasChannels}
            loading={loading}
          />
        </>
      )}
    </WizardShell>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function QuickActionsWizard({ onRefresh, onOpenSettings }: Props) {
  const { t, isRTL } = useLanguage();
  const [active, setActive] = useState<WizardId | null>(null);

  type ActionItem = {
    id: string;
    label: string;
    desc: string;
    iconBg: string;
    icon: React.ReactNode;
    wizardId?: WizardId;
    href?: string;
    onAction?: () => void;
  };

  const actions: ActionItem[] = [
    { id: 'student', wizardId: 'student', label: t('wizard.addStudent'),  desc: t('wizard.addStudentDesc'),  iconBg: 'bg-violet-50 text-violet-600',  icon: <UserPlus className="w-6 h-6" /> },
    { id: 'slot',    wizardId: 'slot',    label: t('wizard.addSlot'),      desc: t('wizard.addSlotDesc'),     iconBg: 'bg-blue-50 text-blue-600',      icon: <CalendarPlus className="w-6 h-6" /> },
    { id: 'group',   wizardId: 'group',   label: t('wizard.addGroup'),     desc: t('wizard.addGroupDesc'),    iconBg: 'bg-emerald-50 text-emerald-600', icon: <Users2 className="w-6 h-6" /> },
    { id: 'message', wizardId: 'message', label: t('wizard.sendMessage'),  desc: t('wizard.sendMessageDesc'), iconBg: 'bg-amber-50 text-amber-600',    icon: <MessageSquare className="w-6 h-6" /> },
    { id: 'settings', label: isRTL ? 'הגדרות ופרופיל' : 'Settings & Profile', desc: isRTL ? 'עדכן הגדרות ופרופיל' : 'Update settings & profile', iconBg: 'bg-slate-50 text-slate-600', icon: <Settings className="w-6 h-6" />, onAction: () => onOpenSettings?.() },
    { id: 'billing',  href: '/teacher/billing', label: isRTL ? 'בדוק מצב חיובים' : 'Check Billing Status', desc: isRTL ? 'צפה בחיובים ותשלומים' : 'View billing & payments', iconBg: 'bg-green-50 text-green-600', icon: <CreditCard className="w-6 h-6" /> },
  ];

  function close() { setActive(null); }
  function done()  { setActive(null); onRefresh?.(); }

  const btnCls = "bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all p-3 text-left";

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        {actions.map((a) => {
          const inner = (
            <>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${a.iconBg}`}>
                {a.icon}
              </div>
              <p className="text-sm font-semibold text-gray-900">{a.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{a.desc}</p>
            </>
          );
          if (a.href) {
            return <Link key={a.id} href={a.href} className={btnCls + ' block'}>{inner}</Link>;
          }
          return (
            <button key={a.id}
              onClick={() => a.onAction ? a.onAction() : setActive(a.wizardId!)}
              className={btnCls}
            >
              {inner}
            </button>
          );
        })}
      </div>

      {active === 'student' && <AddStudentWizard onClose={close} onDone={done} />}
      {active === 'slot'    && <AddSlotWizard    onClose={close} onDone={done} />}
      {active === 'group'   && <AddGroupWizard   onClose={close} onDone={done} />}
      {active === 'message' && <SendMessageWizard onClose={close} />}
    </>
  );
}
