// Re-exports the shared context hook so all components inside
// TeacherProtectedLayout share one cached /api/teacher/settings fetch.
export { useTeacherSettingsCtx as useTeacherSettings } from '@/contexts/TeacherSettingsContext';
