export interface SlotTemplate {
  id: string;
  day_of_week: number;
  start_time: string;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  title: string | null;
  max_participants: number;
}

export interface OneTimeSlot {
  id: string;
  specific_date: string;
  start_time: string;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  title: string | null;
  max_participants: number;
}

export interface ParticipantInfo {
  booking_id: string;
  booking_type: 'recurring' | 'one_time';
  student_name: string;
  student_email: string;
  status: string;
  cancel_token: string;
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
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'cancellation_requested' | 'completed' | 'paid';
  booked_by: 'teacher' | 'student';
  lesson_date: string;
  series_id: string | null;
  started_date: string; // kept for backward compat
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
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'cancellation_requested';
  booked_by: 'teacher' | 'student';
  cancel_token: string;
  reminder_sent: boolean;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  cancelled_by: 'teacher' | 'student' | null;
  created_at: string;
}

export type SlotState = 'available' | 'blocked' | 'pending' | 'confirmed' | 'completed' | 'paid' | 'unavailable' | 'cancellation_requested';

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
  booking_status?: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'cancellation_requested' | 'completed' | 'paid';
  student_name?: string;
  student_email?: string;
  cancel_token?: string;
  cancellation_reason?: string;
  group_id?: string;
  group_name?: string;
  group_member_count?: number;
  title?: string | null;
  max_participants?: number;
  participant_count?: number;
  participants?: ParticipantInfo[];
}

export interface StudentGroup {
  id: string;
  teacher_id: string;
  name: string;
  rate: number | null;
  created_at: string;
  members?: GroupMember[];
}

export interface GroupMember {
  id: string;
  group_id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  added_at: string;
}
