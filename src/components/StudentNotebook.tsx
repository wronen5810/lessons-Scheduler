'use client';

import { useEffect, useState } from 'react';

type Scope = 'individual' | 'group';

interface HomeworkEntry {
  id: string;
  due_date: string | null;
  notes: string;
  created_at: string;
  scope?: Scope;
  group_name?: string;
}

interface NoteEntry {
  id: string;
  note: string;
  created_at: string;
  scope?: Scope;
  group_name?: string;
}

interface ResourceEntry {
  id: string;
  description: string;
  url: string;
  created_at: string;
  scope?: Scope;
  group_name?: string;
}

interface GradeEntry {
  id: string;
  test_date: string;
  grade: string;
  comments: string | null;
  created_at: string;
}

type Tab = 'homework' | 'notes' | 'resources' | 'grades';

interface Props {
  teacherId: string;
  email: string;
}

function formatDate(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function StudentNotebook({ teacherId, email }: Props) {
  const [tab, setTab] = useState<Tab>('homework');
  const [homework, setHomework] = useState<HomeworkEntry[]>([]);
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [resources, setResources] = useState<ResourceEntry[]>([]);
  const [grades, setGrades] = useState<GradeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, string>>({});

  // Add form state
  const [addingHomework, setAddingHomework] = useState(false);
  const [newHwDueDate, setNewHwDueDate] = useState('');
  const [newHwNotes, setNewHwNotes] = useState('');

  const [addingNote, setAddingNote] = useState(false);
  const [newNote, setNewNote] = useState('');

  const [addingResource, setAddingResource] = useState(false);
  const [newResDesc, setNewResDesc] = useState('');
  const [newResUrl, setNewResUrl] = useState('');

  const [addingGrade, setAddingGrade] = useState(false);
  const [newGradeDate, setNewGradeDate] = useState('');
  const [newGradeValue, setNewGradeValue] = useState('');
  const [newGradeComments, setNewGradeComments] = useState('');

  const [saving, setSaving] = useState(false);

  const baseParams = `email=${encodeURIComponent(email)}&teacherId=${encodeURIComponent(teacherId)}`;

  async function loadAll() {
    setLoading(true);
    const [hw, nt, rs, gr] = await Promise.all([
      fetch(`/api/notebook?type=homework&${baseParams}`).then((r) => r.ok ? r.json() : []),
      fetch(`/api/notebook?type=notes&${baseParams}`).then((r) => r.ok ? r.json() : []),
      fetch(`/api/notebook?type=resources&${baseParams}`).then((r) => r.ok ? r.json() : []),
      fetch(`/api/notebook?type=grades&${baseParams}`).then((r) => r.ok ? r.json() : []),
    ]);
    setHomework(hw);
    setNotes(nt);
    setResources(rs);
    setGrades(gr);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, [email, teacherId]);

  // --- Homework CRUD ---
  async function addHomework() {
    if (!newHwNotes.trim()) return;
    setSaving(true);
    await fetch(`/api/notebook?${baseParams}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'homework', due_date: newHwDueDate || null, notes: newHwNotes.trim() }),
    });
    setNewHwDueDate('');
    setNewHwNotes('');
    setAddingHomework(false);
    setSaving(false);
    const res = await fetch(`/api/notebook?type=homework&${baseParams}`);
    if (res.ok) setHomework(await res.json());
  }

  async function saveHomework(id: string) {
    setSaving(true);
    await fetch(`/api/notebook/${id}?${baseParams}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'homework', due_date: editData.due_date || null, notes: editData.notes }),
    });
    setEditId(null);
    setSaving(false);
    const res = await fetch(`/api/notebook?type=homework&${baseParams}`);
    if (res.ok) setHomework(await res.json());
  }

  async function deleteHomework(id: string) {
    await fetch(`/api/notebook/${id}?type=homework&${baseParams}`, { method: 'DELETE' });
    setHomework((prev) => prev.filter((h) => h.id !== id));
  }

  // --- Notes CRUD ---
  async function addNote() {
    if (!newNote.trim()) return;
    setSaving(true);
    await fetch(`/api/notebook?${baseParams}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'notes', note: newNote.trim() }),
    });
    setNewNote('');
    setAddingNote(false);
    setSaving(false);
    const res = await fetch(`/api/notebook?type=notes&${baseParams}`);
    if (res.ok) setNotes(await res.json());
  }

  async function saveNote(id: string) {
    setSaving(true);
    await fetch(`/api/notebook/${id}?${baseParams}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'notes', note: editData.note }),
    });
    setEditId(null);
    setSaving(false);
    const res = await fetch(`/api/notebook?type=notes&${baseParams}`);
    if (res.ok) setNotes(await res.json());
  }

  async function deleteNote(id: string) {
    await fetch(`/api/notebook/${id}?type=notes&${baseParams}`, { method: 'DELETE' });
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  // --- Resources CRUD ---
  async function addResource() {
    if (!newResDesc.trim() || !newResUrl.trim()) return;
    setSaving(true);
    await fetch(`/api/notebook?${baseParams}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'resources', description: newResDesc.trim(), url: newResUrl.trim() }),
    });
    setNewResDesc('');
    setNewResUrl('');
    setAddingResource(false);
    setSaving(false);
    const res = await fetch(`/api/notebook?type=resources&${baseParams}`);
    if (res.ok) setResources(await res.json());
  }

  async function saveResource(id: string) {
    setSaving(true);
    await fetch(`/api/notebook/${id}?${baseParams}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'resources', description: editData.description, url: editData.url }),
    });
    setEditId(null);
    setSaving(false);
    const res = await fetch(`/api/notebook?type=resources&${baseParams}`);
    if (res.ok) setResources(await res.json());
  }

  async function deleteResource(id: string) {
    await fetch(`/api/notebook/${id}?type=resources&${baseParams}`, { method: 'DELETE' });
    setResources((prev) => prev.filter((r) => r.id !== id));
  }

  // --- Grades CRUD ---
  async function addGrade() {
    if (!newGradeDate || !newGradeValue.trim()) return;
    setSaving(true);
    await fetch(`/api/notebook?${baseParams}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'grades', test_date: newGradeDate, grade: newGradeValue.trim(), comments: newGradeComments.trim() || null }),
    });
    setNewGradeDate('');
    setNewGradeValue('');
    setNewGradeComments('');
    setAddingGrade(false);
    setSaving(false);
    const res = await fetch(`/api/notebook?type=grades&${baseParams}`);
    if (res.ok) setGrades(await res.json());
  }

  async function saveGrade(id: string) {
    setSaving(true);
    await fetch(`/api/notebook/${id}?${baseParams}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'grades', test_date: editData.test_date, grade: editData.grade, comments: editData.comments || null }),
    });
    setEditId(null);
    setSaving(false);
    const res = await fetch(`/api/notebook?type=grades&${baseParams}`);
    if (res.ok) setGrades(await res.json());
  }

  async function deleteGrade(id: string) {
    await fetch(`/api/notebook/${id}?type=grades&${baseParams}`, { method: 'DELETE' });
    setGrades((prev) => prev.filter((g) => g.id !== id));
  }

  function startEdit(id: string, data: Record<string, string>) {
    setEditId(id);
    setEditData(data);
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'homework', label: 'Tasks' },
    { key: 'notes', label: 'Notes' },
    { key: 'resources', label: 'Resources' },
    { key: 'grades', label: 'Grades' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-gray-200">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-6">Loading...</p>
        ) : (
          <>
            {/* ── HOMEWORK TAB ── */}
            {tab === 'homework' && (
              <div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 border-b border-gray-100">
                      <th className="text-left py-2 pr-4 font-medium w-36">Due Date</th>
                      <th className="text-left py-2 font-medium">Notes</th>
                      <th className="w-20" />
                    </tr>
                  </thead>
                  <tbody>
                    {homework.length === 0 && !addingHomework ? (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-gray-400 text-sm">No tasks yet.</td>
                      </tr>
                    ) : (
                      homework.map((hw) =>
                        editId === hw.id ? (
                          <tr key={hw.id} className="border-b border-gray-50">
                            <td className="py-2 pr-4">
                              <input
                                type="date"
                                value={editData.due_date ?? ''}
                                onChange={(e) => setEditData({ ...editData, due_date: e.target.value })}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="py-2">
                              <input
                                type="text"
                                value={editData.notes ?? ''}
                                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="py-2 pl-3 flex gap-2 justify-end">
                              <button onClick={() => saveHomework(hw.id)} disabled={saving}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium">Save</button>
                              <button onClick={() => setEditId(null)}
                                className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                            </td>
                          </tr>
                        ) : (
                          <tr key={hw.id} className="border-b border-gray-50 group">
                            <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">
                              {hw.due_date ? formatDate(hw.due_date) : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="py-2.5 text-gray-800">
                              {hw.scope === 'group' && (
                                <span className="inline-block mr-2 px-1.5 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded">
                                  Group: {hw.group_name}
                                </span>
                              )}
                              {hw.notes}
                            </td>
                            <td className="py-2.5 pl-3">
                              {hw.scope !== 'group' && (
                                <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => startEdit(hw.id, { due_date: hw.due_date ?? '', notes: hw.notes })}
                                    className="text-xs text-blue-500 hover:text-blue-700">Edit</button>
                                  <button onClick={() => deleteHomework(hw.id)}
                                    className="text-xs text-red-400 hover:text-red-600">Delete</button>
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      )
                    )}

                    {/* Add row */}
                    {addingHomework && (
                      <tr className="border-b border-blue-100 bg-blue-50/30">
                        <td className="py-2 pr-4">
                          <input
                            type="date"
                            value={newHwDueDate}
                            onChange={(e) => setNewHwDueDate(e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-2">
                          <input
                            type="text"
                            value={newHwNotes}
                            onChange={(e) => setNewHwNotes(e.target.value)}
                            placeholder="Task description..."
                            autoFocus
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-2 pl-3">
                          <div className="flex gap-2 justify-end">
                            <button onClick={addHomework} disabled={saving || !newHwNotes.trim()}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50">Add</button>
                            <button onClick={() => { setAddingHomework(false); setNewHwDueDate(''); setNewHwNotes(''); }}
                              className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {!addingHomework && (
                  <button onClick={() => setAddingHomework(true)}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                    + Add task
                  </button>
                )}
              </div>
            )}

            {/* ── NOTES TAB ── */}
            {tab === 'notes' && (
              <div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 border-b border-gray-100">
                      <th className="text-left py-2 pr-4 font-medium w-36">Date</th>
                      <th className="text-left py-2 font-medium">Notes</th>
                      <th className="w-20" />
                    </tr>
                  </thead>
                  <tbody>
                    {notes.length === 0 && !addingNote ? (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-gray-400 text-sm">No notes yet.</td>
                      </tr>
                    ) : (
                      notes.map((n) =>
                        editId === n.id ? (
                          <tr key={n.id} className="border-b border-gray-50">
                            <td className="py-2 pr-4 text-gray-400 text-xs whitespace-nowrap">
                              {formatDate(n.created_at)}
                            </td>
                            <td className="py-2">
                              <input
                                type="text"
                                value={editData.note ?? ''}
                                onChange={(e) => setEditData({ ...editData, note: e.target.value })}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="py-2 pl-3">
                              <div className="flex gap-2 justify-end">
                                <button onClick={() => saveNote(n.id)} disabled={saving}
                                  className="text-xs text-blue-600 hover:text-blue-800 font-medium">Save</button>
                                <button onClick={() => setEditId(null)}
                                  className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          <tr key={n.id} className="border-b border-gray-50 group">
                            <td className="py-2.5 pr-4 text-gray-400 text-xs whitespace-nowrap">
                              {formatDate(n.created_at)}
                            </td>
                            <td className="py-2.5 text-gray-800">
                              {n.scope === 'group' && (
                                <span className="inline-block mr-2 px-1.5 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded">
                                  Group: {n.group_name}
                                </span>
                              )}
                              {n.note}
                            </td>
                            <td className="py-2.5 pl-3">
                              {n.scope !== 'group' && (
                                <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => startEdit(n.id, { note: n.note })}
                                    className="text-xs text-blue-500 hover:text-blue-700">Edit</button>
                                  <button onClick={() => deleteNote(n.id)}
                                    className="text-xs text-red-400 hover:text-red-600">Delete</button>
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      )
                    )}

                    {addingNote && (
                      <tr className="border-b border-blue-100 bg-blue-50/30">
                        <td className="py-2 pr-4 text-gray-400 text-xs whitespace-nowrap">Today</td>
                        <td className="py-2">
                          <input
                            type="text"
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Write a note..."
                            autoFocus
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-2 pl-3">
                          <div className="flex gap-2 justify-end">
                            <button onClick={addNote} disabled={saving || !newNote.trim()}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50">Add</button>
                            <button onClick={() => { setAddingNote(false); setNewNote(''); }}
                              className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {!addingNote && (
                  <button onClick={() => setAddingNote(true)}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                    + Add note
                  </button>
                )}
              </div>
            )}

            {/* ── RESOURCES TAB ── */}
            {tab === 'resources' && (
              <div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 border-b border-gray-100">
                      <th className="text-left py-2 pr-3 font-medium w-8">#</th>
                      <th className="text-left py-2 pr-4 font-medium">Description</th>
                      <th className="text-left py-2 font-medium">URL</th>
                      <th className="w-20" />
                    </tr>
                  </thead>
                  <tbody>
                    {resources.length === 0 && !addingResource ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-gray-400 text-sm">No resources yet.</td>
                      </tr>
                    ) : (
                      resources.map((r, idx) =>
                        editId === r.id ? (
                          <tr key={r.id} className="border-b border-gray-50">
                            <td className="py-2 pr-3 text-gray-400 text-xs">{idx + 1}</td>
                            <td className="py-2 pr-4">
                              <input
                                type="text"
                                value={editData.description ?? ''}
                                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="py-2">
                              <input
                                type="url"
                                value={editData.url ?? ''}
                                onChange={(e) => setEditData({ ...editData, url: e.target.value })}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="py-2 pl-3">
                              <div className="flex gap-2 justify-end">
                                <button onClick={() => saveResource(r.id)} disabled={saving}
                                  className="text-xs text-blue-600 hover:text-blue-800 font-medium">Save</button>
                                <button onClick={() => setEditId(null)}
                                  className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          <tr key={r.id} className="border-b border-gray-50 group">
                            <td className="py-2.5 pr-3 text-gray-400 text-xs">{idx + 1}</td>
                            <td className="py-2.5 pr-4 text-gray-800">
                              {r.scope === 'group' && (
                                <span className="inline-block mr-2 px-1.5 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded">
                                  Group: {r.group_name}
                                </span>
                              )}
                              {r.description}
                            </td>
                            <td className="py-2.5">
                              <a
                                href={r.url.startsWith('http') ? r.url : `https://${r.url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline truncate block max-w-[220px]"
                              >
                                {r.url}
                              </a>
                            </td>
                            <td className="py-2.5 pl-3">
                              {r.scope !== 'group' && (
                                <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => startEdit(r.id, { description: r.description, url: r.url })}
                                    className="text-xs text-blue-500 hover:text-blue-700">Edit</button>
                                  <button onClick={() => deleteResource(r.id)}
                                    className="text-xs text-red-400 hover:text-red-600">Delete</button>
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      )
                    )}

                    {addingResource && (
                      <tr className="border-b border-blue-100 bg-blue-50/30">
                        <td className="py-2 pr-3 text-gray-400 text-xs">{resources.length + 1}</td>
                        <td className="py-2 pr-4">
                          <input
                            type="text"
                            value={newResDesc}
                            onChange={(e) => setNewResDesc(e.target.value)}
                            placeholder="Description..."
                            autoFocus
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-2">
                          <input
                            type="url"
                            value={newResUrl}
                            onChange={(e) => setNewResUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-2 pl-3">
                          <div className="flex gap-2 justify-end">
                            <button onClick={addResource} disabled={saving || !newResDesc.trim() || !newResUrl.trim()}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50">Add</button>
                            <button onClick={() => { setAddingResource(false); setNewResDesc(''); setNewResUrl(''); }}
                              className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {!addingResource && (
                  <button onClick={() => setAddingResource(true)}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                    + Add resource
                  </button>
                )}
              </div>
            )}

            {/* ── GRADES TAB ── */}
            {tab === 'grades' && (
              <div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 border-b border-gray-100">
                      <th className="text-left py-2 pr-4 font-medium w-36">Test Date</th>
                      <th className="text-left py-2 pr-4 font-medium w-24">Grade</th>
                      <th className="text-left py-2 font-medium">Comments</th>
                      <th className="w-20" />
                    </tr>
                  </thead>
                  <tbody>
                    {grades.length === 0 && !addingGrade ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-gray-400 text-sm">No grades yet.</td>
                      </tr>
                    ) : (
                      grades.map((g) =>
                        editId === g.id ? (
                          <tr key={g.id} className="border-b border-gray-50">
                            <td className="py-2 pr-4">
                              <input
                                type="date"
                                value={editData.test_date ?? ''}
                                onChange={(e) => setEditData({ ...editData, test_date: e.target.value })}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="py-2 pr-4">
                              <input
                                type="text"
                                value={editData.grade ?? ''}
                                onChange={(e) => setEditData({ ...editData, grade: e.target.value })}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="py-2">
                              <input
                                type="text"
                                value={editData.comments ?? ''}
                                onChange={(e) => setEditData({ ...editData, comments: e.target.value })}
                                placeholder="Comments..."
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="py-2 pl-3">
                              <div className="flex gap-2 justify-end">
                                <button onClick={() => saveGrade(g.id)} disabled={saving}
                                  className="text-xs text-blue-600 hover:text-blue-800 font-medium">Save</button>
                                <button onClick={() => setEditId(null)}
                                  className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          <tr key={g.id} className="border-b border-gray-50 group">
                            <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">{formatDate(g.test_date)}</td>
                            <td className="py-2.5 pr-4 font-semibold text-gray-800">{g.grade}</td>
                            <td className="py-2.5 text-gray-600">{g.comments ?? <span className="text-gray-300">—</span>}</td>
                            <td className="py-2.5 pl-3">
                              <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => startEdit(g.id, { test_date: g.test_date, grade: g.grade, comments: g.comments ?? '' })}
                                  className="text-xs text-blue-500 hover:text-blue-700">Edit</button>
                                <button onClick={() => deleteGrade(g.id)}
                                  className="text-xs text-red-400 hover:text-red-600">Delete</button>
                              </div>
                            </td>
                          </tr>
                        )
                      )
                    )}

                    {addingGrade && (
                      <tr className="border-b border-blue-100 bg-blue-50/30">
                        <td className="py-2 pr-4">
                          <input
                            type="date"
                            value={newGradeDate}
                            onChange={(e) => setNewGradeDate(e.target.value)}
                            autoFocus
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-2 pr-4">
                          <input
                            type="text"
                            value={newGradeValue}
                            onChange={(e) => setNewGradeValue(e.target.value)}
                            placeholder="e.g. 95"
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-2">
                          <input
                            type="text"
                            value={newGradeComments}
                            onChange={(e) => setNewGradeComments(e.target.value)}
                            placeholder="Comments (optional)..."
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-2 pl-3">
                          <div className="flex gap-2 justify-end">
                            <button onClick={addGrade} disabled={saving || !newGradeDate || !newGradeValue.trim()}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50">Add</button>
                            <button onClick={() => { setAddingGrade(false); setNewGradeDate(''); setNewGradeValue(''); setNewGradeComments(''); }}
                              className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {!addingGrade && (
                  <button onClick={() => setAddingGrade(true)}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                    + Add grade
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
