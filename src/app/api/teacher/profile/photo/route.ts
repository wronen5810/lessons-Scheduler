import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

const BUCKET = 'teacher-photos';

export async function POST(request: NextRequest) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const formData = await request.formData();
  const file = formData.get('photo') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const maxBytes = 5 * 1024 * 1024; // 5 MB
  if (file.size > maxBytes) return NextResponse.json({ error: 'Photo must be under 5 MB' }, { status: 400 });

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.type)) return NextResponse.json({ error: 'Only JPEG, PNG, WebP or GIF allowed' }, { status: 400 });

  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${auth.user.id}/photo.${ext}`;
  const bytes = await file.arrayBuffer();

  const supabase = createServiceSupabase();

  // Ensure bucket exists (no-op if already created)
  await supabase.storage.createBucket(BUCKET, { public: true }).catch(() => {});

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: true });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);

  // Append cache-bust so browsers pick up the new image immediately
  const photoUrl = `${publicUrl}?t=${Date.now()}`;

  const { error: dbError } = await supabase
    .from('profiles')
    .update({ photo_url: photoUrl })
    .eq('id', auth.user.id);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({ photo_url: photoUrl });
}
