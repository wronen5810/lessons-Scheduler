import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';
import { randomUUID } from 'crypto';

const BUCKET = 'notebook-files';
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

async function resolveIdentity(
  request: NextRequest,
): Promise<{ teacherId: string; studentEmail: string } | NextResponse> {
  const url = new URL(request.url);
  const auth = await requireTeacher();
  if (!auth.error) {
    const email = url.searchParams.get('email');
    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });
    return { teacherId: auth.user.id, studentEmail: email.toLowerCase() };
  }
  const email = url.searchParams.get('email');
  const teacherId = url.searchParams.get('teacherId');
  if (!email || !teacherId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return { teacherId, studentEmail: email.toLowerCase() };
}

// GET /api/notebook/files?email=...&teacherId=...
export async function GET(request: NextRequest) {
  const identity = await resolveIdentity(request);
  if (identity instanceof NextResponse) return identity;

  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from('notebook_files')
    .select('id, file_name, file_size, file_type, url, created_at')
    .eq('teacher_id', identity.teacherId)
    .ilike('student_email', identity.studentEmail)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/notebook/files?email=...&teacherId=...  (multipart/form-data, field "file")
export async function POST(request: NextRequest) {
  const identity = await resolveIdentity(request);
  if (identity instanceof NextResponse) return identity;

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File must be under 5 MB' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: 'File type not allowed. Accepted: PDF, Word, Excel, CSV, TXT, or images (JPG, PNG, GIF, WebP).' },
      { status: 400 },
    );
  }

  const supabase = createServiceSupabase();
  await supabase.storage.createBucket(BUCKET, { public: true }).catch(() => {});

  const fileId = randomUUID();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const sanitizedEmail = identity.studentEmail.replace(/[@.]/g, '_');
  const storagePath = `${identity.teacherId}/${sanitizedEmail}/${fileId}_${safeName}`;

  const bytes = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, bytes, { contentType: file.type });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  const { data, error } = await supabase
    .from('notebook_files')
    .insert({
      teacher_id: identity.teacherId,
      student_email: identity.studentEmail,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      storage_path: storagePath,
      url: publicUrl,
    })
    .select('id, file_name, file_size, file_type, url, created_at')
    .single();

  if (error) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
