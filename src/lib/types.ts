export interface SlotTemplate {
  id: string;
  day_of_week: number;
  start_time: string;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
}

export interface OneTimeSlot {
  id: string;
  specific_date: string;
  start_time: string;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
}

export interface SlotOverride {
  id: string;
  template_id: string;
  specific_date: string;
  is_blocked: boolean;
  created_at: string;
}

export interface RecurringBooking {
  id: string;
  template_id: string;
  student_name: string;
  student_email: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  booked_by: 'teacher' | 'student';
  started_date: string;
  ended_date: string | null;
  cancel_token: string;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  cancelled_by: 'teacher' | 'student' | null;
  created_at: string;
}

export interface OneTimeBooking {
  id: string;
  template_id: string | null;
  one_time_slot_id: string | null;
  specific_date: string;
  start_time: string;
  student_name: string;
  student_email: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  booked_by: 'teacher' | 'student';
  cancel_token: string;
  reminder_sent: boolean;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  cancelled_by: 'teacher' | 'student' | null;
  created_at: string;
}

export type SlotState = 'available' | 'blocked' | 'pending' | 'confirmed' | 'unavailable';

export interface ComputedSlot {
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  state: SlotState;
  template_id?: string;
  one_time_slot_id?: string;
  override_id?: string;
  booking_type?: 'recurring' | 'one_time';
  booking_id?: string;
  booking_status?: 'pending' | 'approved' | 'rejected' | 'cancelled';
  student_name?: string;
  student_email?: string;
  cancel_token?: string;
}
