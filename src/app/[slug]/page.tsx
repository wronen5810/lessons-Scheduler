import { notFound } from 'next/navigation';
import { createServiceSupabase } from '@/lib/supabase-server';
import { toSlug } from '@/lib/slug';
import JoinForm from '@/components/JoinForm';
import { Suspense } from 'react';

export default async function TeacherSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const supabase = createServiceSupabase();
  const { data: teachers } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('role', 'teacher');

  if (!teachers || teachers.length === 0) notFound();

  const match = teachers.find((t) => toSlug(t.display_name ?? '') === slug);

  if (!match) notFound();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <Suspense fallback={<p className="text-center text-gray-400 text-sm">Loading...</p>}>
          <JoinForm teacherId={match.id} />
        </Suspense>
      </div>
    </div>
  );
}
