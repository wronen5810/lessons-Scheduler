import { redirect, notFound } from 'next/navigation';
import { createServiceSupabase } from '@/lib/supabase-server';

function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export default async function TeacherSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const normalized = slug.toLowerCase().replace(/[^a-z0-9]/g, '');

  const supabase = createServiceSupabase();
  const { data: teachers } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('role', 'teacher')
    .eq('is_active', true);

  if (!teachers) notFound();

  const match = teachers!.find((t) => nameToSlug(t.display_name ?? '') === normalized);
  if (!match) notFound();

  redirect(`/t/${match.id}`);
}
