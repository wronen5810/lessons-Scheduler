'use client';

import type { ComputedSlot } from '@/lib/types';

interface Props {
  slot: ComputedSlot;
  onClick?: (slot: ComputedSlot) => void;
  isTeacher?: boolean;
}

const STATE_STYLES: Record<string, string> = {
  available: 'bg-green-50 border-green-300 text-green-800 hover:bg-green-100 cursor-pointer',
  unavailable: 'bg-gray-100 border-gray-200 text-gray-400 cursor-default',
  blocked: 'bg-gray-100 border-gray-200 text-gray-500 cursor-pointer hover:bg-gray-200',
  pending: 'bg-amber-50 border-amber-300 text-amber-800 cursor-pointer hover:bg-amber-100',
  confirmed: '',
};

function confirmedStyle(bookingType?: string) {
  return bookingType === 'one_time'
    ? 'bg-purple-50 border-purple-300 text-purple-800 cursor-pointer hover:bg-purple-100'
    : 'bg-blue-50 border-blue-300 text-blue-800 cursor-pointer hover:bg-blue-100';
}

export default function SlotCell({ slot, onClick, isTeacher = false }: Props) {
  const style =
    slot.state === 'confirmed'
      ? confirmedStyle(slot.booking_type)
      : STATE_STYLES[slot.state] ?? STATE_STYLES.unavailable;

  const handleClick = () => {
    if (onClick) onClick(slot);
  };

  return (
    <div
      className={`rounded-lg border px-3 py-2 text-xs mb-1.5 transition-colors select-none ${style}`}
      onClick={handleClick}
    >
      <div className="font-semibold">
        {slot.start_time} &ndash; {slot.end_time}
      </div>

      {isTeacher && slot.state !== 'available' && slot.state !== 'blocked' && slot.student_name && (
        <div className="mt-0.5 truncate">{slot.student_name}</div>
      )}

      {isTeacher && slot.state === 'blocked' && (
        <div className="mt-0.5 text-gray-400">Blocked</div>
      )}

      {isTeacher && slot.state === 'pending' && (
        <div className="mt-0.5 text-amber-600 font-medium">Pending</div>
      )}
    </div>
  );
}
