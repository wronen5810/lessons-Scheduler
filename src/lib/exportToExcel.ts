import * as XLSX from 'xlsx';

type ExportData = {
  teacher: { name: string; email: string; phone: string; tutoring_area: string; quote: string };
  students: { student_id: string; name: string; email: string; phone: string; rate: number | string; notes: string; is_active: boolean; created_at: string }[];
  groups: { name: string; rate: number | string; member_count: number }[];
  groupMembers: { group_name: string; student_id: string; student_name: string; student_email: string }[];
  lessons: { date: string; start_time: string; end_time: string; type: string; student_or_group: string; student_id: string; email: string; status: string; created_at: string }[];
  billing: { student_id: string; student_name: string; student_email: string; rate: number | null; completed_lessons: number; balance: number | null }[];
  notes: { student_id: string; student_email: string; note: string; created_at: string }[];
  homework: { student_id: string; student_email: string; due_date: string; notes: string; created_at: string }[];
  grades: { student_id: string; student_email: string; test_date: string; grade: string; comments: string; created_at: string }[];
  resources: { student_id: string; student_email: string; description: string; url: string; created_at: string }[];
};

function makeSheet<T extends Record<string, unknown>>(rows: T[], headers: [keyof T, string][]): XLSX.WorkSheet {
  const headerRow = headers.map(([, label]) => label);
  const dataRows = rows.map((row) => headers.map(([key]) => row[key] ?? ''));
  return XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);
}

export function exportToExcel(data: ExportData): void {
  const wb = XLSX.utils.book_new();

  // 1. Teacher
  const teacherSheet = XLSX.utils.aoa_to_sheet([
    ['Field', 'Value'],
    ['Name', data.teacher.name],
    ['Email', data.teacher.email],
    ['Phone', data.teacher.phone],
    ['Tutoring Area', data.teacher.tutoring_area],
    ['Quote', data.teacher.quote],
  ]);
  XLSX.utils.book_append_sheet(wb, teacherSheet, 'Teacher');

  // 2. Students
  XLSX.utils.book_append_sheet(
    wb,
    makeSheet(data.students as Record<string, unknown>[], [
      ['student_id', 'Student ID'],
      ['name', 'Name'],
      ['email', 'Email'],
      ['phone', 'Phone'],
      ['rate', 'Rate (₪)'],
      ['notes', 'Notes'],
      ['is_active', 'Active'],
      ['created_at', 'Created At'],
    ]),
    'Students'
  );

  // 3. Groups
  XLSX.utils.book_append_sheet(
    wb,
    makeSheet(data.groups as Record<string, unknown>[], [
      ['name', 'Group Name'],
      ['rate', 'Rate (₪)'],
      ['member_count', 'Members'],
    ]),
    'Groups'
  );

  // 4. Group Members
  XLSX.utils.book_append_sheet(
    wb,
    makeSheet(data.groupMembers as Record<string, unknown>[], [
      ['group_name', 'Group'],
      ['student_id', 'Student ID'],
      ['student_name', 'Student Name'],
      ['student_email', 'Student Email'],
    ]),
    'Group Members'
  );

  // 5. Lessons
  XLSX.utils.book_append_sheet(
    wb,
    makeSheet(data.lessons as Record<string, unknown>[], [
      ['date', 'Date'],
      ['start_time', 'Start'],
      ['end_time', 'End'],
      ['type', 'Type'],
      ['student_or_group', 'Student / Group'],
      ['student_id', 'Student ID'],
      ['email', 'Email'],
      ['status', 'Status'],
      ['created_at', 'Created At'],
    ]),
    'Lessons'
  );

  // 6. Billing
  XLSX.utils.book_append_sheet(
    wb,
    makeSheet(data.billing as Record<string, unknown>[], [
      ['student_id', 'Student ID'],
      ['student_name', 'Student Name'],
      ['student_email', 'Email'],
      ['rate', 'Rate (₪)'],
      ['completed_lessons', 'Completed Lessons'],
      ['balance', 'Balance (₪)'],
    ]),
    'Billing'
  );

  // 7. Notes
  XLSX.utils.book_append_sheet(
    wb,
    makeSheet(data.notes as Record<string, unknown>[], [
      ['student_id', 'Student ID'],
      ['student_email', 'Student Email'],
      ['note', 'Note'],
      ['created_at', 'Created At'],
    ]),
    'Notes'
  );

  // 8. Homework
  XLSX.utils.book_append_sheet(
    wb,
    makeSheet(data.homework as Record<string, unknown>[], [
      ['student_id', 'Student ID'],
      ['student_email', 'Student Email'],
      ['due_date', 'Due Date'],
      ['notes', 'Assignment'],
      ['created_at', 'Created At'],
    ]),
    'Homework'
  );

  // 9. Grades
  XLSX.utils.book_append_sheet(
    wb,
    makeSheet(data.grades as Record<string, unknown>[], [
      ['student_id', 'Student ID'],
      ['student_email', 'Student Email'],
      ['test_date', 'Test Date'],
      ['grade', 'Grade'],
      ['comments', 'Comments'],
      ['created_at', 'Created At'],
    ]),
    'Grades'
  );

  // 10. Resources
  XLSX.utils.book_append_sheet(
    wb,
    makeSheet(data.resources as Record<string, unknown>[], [
      ['student_id', 'Student ID'],
      ['student_email', 'Student Email'],
      ['description', 'Description'],
      ['url', 'URL'],
      ['created_at', 'Created At'],
    ]),
    'Resources'
  );

  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `saderot-export-${date}.xlsx`);
}
