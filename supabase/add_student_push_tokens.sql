-- Add student_email and student_teacher_id columns to push_tokens
-- to support push notifications for students (who have no Supabase auth user_id)
ALTER TABLE push_tokens
  ADD COLUMN IF NOT EXISTS student_email text,
  ADD COLUMN IF NOT EXISTS student_teacher_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RPC to also match student-email-based tokens
CREATE OR REPLACE FUNCTION get_push_tokens_by_emails(emails text[])
RETURNS TABLE (student_email text, push_token text)
LANGUAGE sql SECURITY DEFINER AS $$
  -- Teacher/auth-user tokens (existing)
  SELECT lower(u.email) AS student_email, pt.token AS push_token
  FROM push_tokens pt
  JOIN auth.users u ON pt.user_id = u.id
  WHERE pt.user_id IS NOT NULL
    AND lower(u.email) = ANY (SELECT lower(e) FROM unnest(emails) AS e(e))
  UNION ALL
  -- Student tokens stored by email (new)
  SELECT lower(pt.student_email) AS student_email, pt.token AS push_token
  FROM push_tokens pt
  WHERE pt.student_email IS NOT NULL
    AND lower(pt.student_email) = ANY (SELECT lower(e) FROM unnest(emails) AS e(e))
$$;
