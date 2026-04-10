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
  available:              { bg: 'bg-emerald-50',  border: 'border-emerald-200', text: 'text-emerald-800', dot: 'bg-emerald-400' },
  unavailable:            { bg: 'bg-gray-50',     border: 'border-gray-200',    text: 'text-gray-400',    dot: 'bg-gray-300' },
  blocked:                { bg: 'bg-gray-100',    border: 'border-gray-200',    text: 'text-gray-500',    dot: 'bg-gray-400',    label: 'Blocked' },
  pending:                { bg: 'bg-amber-50',    border: 'border-amber-200',   text: 'text-amber-800',   dot: 'bg-amber-400',   label: 'Pending' },
  confirmed:              { bg: 'bg-blue-50',     border: 'border-blue-200',    text: 'text-blue-800',    dot: 'bg-blue-500',    label: 'Approved' },
  completed:              { bg: 'bg-purple-50',   border: 'border-purple-300',  text: 'text-purple-800',  dot: 'bg-purple-500',  label: 'Done' },
  paid:                   { bg: 'bg-emerald-50',  border: 'border-emerald-300', text: 'text-emerald-800', dot: 'bg-emerald-500', label: 'Paid' },
  cancellation_requested: { bg: 'bg-orange-50',   border: 'border-orange-300',  text: 'text-orange-800',  dot: 'bg-orange-400',  label: 'Cancel req.' },
};

export default function SlotCell({ slot, onClick, isTeacher = false, timeFormat = '24h' }: Props) {
  const cfg = STATE_CONFIG[slot.state] ?? STATE_CONFIG.unavailable;
  const isClickable = !!onClick && slot.state !== 'unavailable';

  return (
    <div
      className={`
        rounded-lg border px-2 py-1.5 mb-1.5 text-xs leading-tight select-none transition-all
        ${cfg.bg} ${cfg.border} ${cfg.text}
        ${isClickable ? 'cursor-pointer hover:brightness-95 active:scale-95' : 'cursor-default'}
      `}
      onClick={isClickable ? () => onClick!(slot) : undefined}
    >
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
        <span className="font-semibold tabular-nums">{formatTimeDisplay(slot.start_time, timeFormat)}</span>
      </div>

      {isTeacher && slot.student_name && (
        <div className="mt-0.5 ml-3 truncate font-medium">{slot.student_name}</div>
      )}

      {isTeacher && cfg.label && !slot.student_name && (
        <div className="mt-0.5 ml-3 opacity-70">{cfg.label}</div>
      )}

      {isTeacher && slot.booking_type && (
        <div className="mt-0.5 ml-3 opacity-60 text-[10px]">
          {slot.booking_type === 'one_time' ? 'One-time' : 'Recurring'}
        </div>
      )}

      {!isTeacher && slot.state === 'available' && (
        <div className="mt-0.5 ml-3 opacity-70">
          {slot.one_time_slot_id ? 'One-time' : 'Recurring'}
        </div>
      )}

      {!isTeacher && slot.state !== 'available' && slot.state !== 'unavailable' && slot.booking_type && (
        <div className="mt-0.5 ml-3 opacity-70">
          {slot.booking_type === 'one_time' ? 'One-time' : 'Recurring'}
        </div>
      )}
    </div>
  );
}
