export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { createServiceSupabase } from '@/lib/supabase-server';
import { toSlug } from '@/lib/slug';
import JoinForm from '@/components/JoinForm';
import { Suspense } from 'react';

export default async function TeacherSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params;
  // Decode percent-encoded slugs (e.g. Hebrew names encoded by messengers/browsers)
  const slug = (() => { try { return decodeURIComponent(rawSlug); } catch { return rawSlug; } })();

  const supabase = createServiceSupabase();
  const { data: teachers } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('role', 'teacher');

  if (!teachers || teachers.length === 0) notFound();

  const match = teachers.find((t) => toSlug(t.display_name ?? '') === slug);

  if (!match) notFound();

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="text-sm text-gray-400">Loading…</div>
      </div>
    }>
      <JoinForm teacherId={match.id} />
    </Suspense>
  );
}
