-- RPC used by the teacher messaging feature:
-- looks up push tokens for a list of student emails (via auth.users join)
CREATE OR REPLACE FUNCTION get_push_tokens_by_emails(emails text[])
RETURNS TABLE (student_email text, push_token text)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT lower(u.email) AS student_email, pt.token AS push_token
  FROM push_tokens pt
  JOIN auth.users u ON pt.user_id = u.id
  WHERE lower(u.email) = ANY (SELECT lower(e) FROM unnest(emails) AS e(e))
$$;
