'use client';

import type { ComputedSlot } from '@/lib/types';
import { formatTimeDisplay } from '@/lib/dates';

interface Props {
  slot: ComputedSlot;
  onClick?: (slot: ComputedSlot) => void;
  isTeacher?: boolean;
  timeFormat?: '24h' | '12h';
}

const STATE_CONFIG: Record<string, { bg: string; border: string; text: string; dot: string; label?: string }> = {
  available:              { bg: 'bg-slate-50',    border: 'border-slate-200',   text: 'text-slate-600',   dot: 'bg-slate-400' },
  unavailable:            { bg: 'bg-gray-50',     border: 'border-gray-200',    text: 'text-gray-400',    dot: 'bg-gray-300' },
  blocked:                { bg: 'bg-gray-200',    border: 'border-gray-300',    text: 'text-gray-600',    dot: 'bg-gray-500',    label: 'Blocked' },
  pending:                { bg: 'bg-amber-50',    border: 'border-amber-200',   text: 'text-amber-700',   dot: 'bg-amber-400',   label: 'Pending' },
  confirmed:              { bg: 'bg-indigo-50',   border: 'border-indigo-200',  text: 'text-indigo-700',  dot: 'bg-indigo-500',  label: 'Approved' },
  completed:              { bg: 'bg-violet-50',   border: 'border-violet-200',  text: 'text-violet-700',  dot: 'bg-violet-500',  label: 'Done' },
  paid:                   { bg: 'bg-emerald-50',  border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Paid' },
  cancellation_requested: { bg: 'bg-rose-50',     border: 'border-rose-200',    text: 'text-rose-600',    dot: 'bg-rose-400',    label: 'Cancel req.' },
};

export default function SlotCell({ slot, onClick, isTeacher = false, timeFormat = '24h' }: Props) {
  const cfg = STATE_CONFIG[slot.state] ?? STATE_CONFIG.unavailable;
  const isClickable = !!onClick && slot.state !== 'unavailable';

  return (
    <div
      className={`
        rounded-lg border px-1 py-1 sm:px-2 sm:py-1.5 mb-1 sm:mb-1.5 leading-tight select-none transition-all
        ${cfg.bg} ${cfg.border} ${cfg.text}
        ${isClickable ? 'cursor-pointer hover:brightness-95 active:scale-95' : 'cursor-default'}
      `}
      onClick={isClickable ? () => onClick!(slot) : undefined}
    >
      <div className="flex items-center gap-1">
        <span className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
        <span className="font-semibold tabular-nums text-[10px] sm:text-xs">{formatTimeDisplay(slot.start_time, timeFormat)}</span>
      </div>

      {/* Title */}
      {slot.title && (
        <div className="mt-0.5 ml-2 sm:ml-3 truncate font-medium text-[9px] sm:text-[11px]">{slot.title}</div>
      )}

      {/* Teacher: multi-participant count */}
      {isTeacher && (slot.max_participants ?? 1) > 1 && (
        <div className="mt-0.5 ml-2 sm:ml-3 text-[9px] sm:text-[10px] opacity-75">
          {slot.participant_count ?? 0}/{slot.max_participants}
        </div>
      )}

      {/* Teacher: student name (single-participant only) */}
      {isTeacher && slot.student_name && (slot.max_participants ?? 1) <= 1 && (
        <div className="mt-0.5 ml-2 sm:ml-3 truncate font-medium text-[9px] sm:text-xs">{slot.student_name}</div>
      )}

      {/* Teacher: state label (no student, single-participant) */}
      {isTeacher && cfg.label && !slot.student_name && (slot.max_participants ?? 1) <= 1 && (
        <div className="mt-0.5 ml-2 sm:ml-3 opacity-70 text-[9px] sm:text-xs">{cfg.label}</div>
      )}

      {/* Teacher: booking type (single-participant only) */}
      {isTeacher && slot.booking_type && (slot.max_participants ?? 1) <= 1 && (
        <div className="mt-0.5 ml-2 sm:ml-3 opacity-60 text-[9px] sm:text-[10px]">
          {slot.booking_type === 'one_time' ? '1×' : '↺'}
        </div>
      )}

      {/* Student: available slot info */}
      {!isTeacher && slot.state === 'available' && (
        <div className="mt-0.5 ml-2 sm:ml-3 opacity-70 text-[9px] sm:text-[10px]">
          {(slot.max_participants ?? 1) > 1
            ? `${(slot.max_participants ?? 1) - (slot.participant_count ?? 0)} spot${(slot.max_participants ?? 1) - (slot.participant_count ?? 0) !== 1 ? 's' : ''} left`
            : (slot.one_time_slot_id ? '1×' : '↺')}
        </div>
      )}

      {/* Student: booked state info */}
      {!isTeacher && slot.state !== 'available' && slot.state !== 'unavailable' && slot.booking_type && (
        <div className="mt-0.5 ml-2 sm:ml-3 opacity-70 text-[9px] sm:text-[10px]">
          {slot.booking_type === 'one_time' ? '1×' : '↺'}
        </div>
      )}
    </div>
  );
}
