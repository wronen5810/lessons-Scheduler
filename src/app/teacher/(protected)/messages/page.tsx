'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Student {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
}

interface Group {
  id: string;
  name: string;
  members?: { student_id: string; student_name: string; student_email: string }[];
}

interface SendResult {
  recipients: number;
  result: {
    email?: { sent: number; failed: Array<{ name: string; email: string }> };
    whatsapp?: { links: Array<{ name: string; phone: string; url: string }>; noPhone: Array<{ name: string; email: string }> };
    notification?: { sent: number; noToken: Array<{ name: string; email: string }> };
  };
}

export default function MessagesPage() {
  const { t, isRTL } = useLanguage();
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const [message, setMessage] = useState('');
  const [channels, setChannels] = useState({ email: true, whatsapp: false, notification: false });

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);
  const [sendError, setSendError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/teacher/students').then((r) => r.ok ? r.json() : []),
      fetch('/api/teacher/groups').then((r) => r.ok ? r.json() : []),
    ]).then(([s, g]) => {
      setStudents(s.filter((st: Student) => st.is_active));
      setGroups(g);
      setLoading(false);
    });
  }, []);

  function toggleStudent(id: string) {
    setSelectedStudentIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  function toggleGroup(id: string) {
    setSelectedGroupIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  const q = search.toLowerCase();
  const filteredStudents = students.filter((s) => !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
  const filteredGroups = groups.filter((g) => !q || g.name.toLowerCase().includes(q));
  const totalSelected = selectedStudentIds.size + selectedGroupIds.size;

  function selectAll() {
    setSelectedStudentIds(new Set(filteredStudents.map((s) => s.id)));
    setSelectedGroupIds(new Set(filteredGroups.map((g) => g.id)));
  }

  async function handleSend() {
    setSendError('');
    setResult(null);
    if (!message.trim()) { setSendError(t('messages.enterFirst')); return; }
    if (totalSelected === 0) { setSendError(t('messages.selectRecipient')); return; }
    if (!channels.email && !channels.whatsapp && !channels.notification) { setSendError(t('messages.selectChannel')); return; }
    setSending(true);
    const res = await fetch('/api/teacher/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentIds: [...selectedStudentIds], groupIds: [...selectedGroupIds], message: message.trim(), channels }),
    });
    const data = await res.json();
    if (!res.ok) { setSendError(data.error || t('messages.failedSend')); } else { setResult(data); }
    setSending(false);
  }

  const channelConfig: { key: keyof typeof channels; label: string; icon: string }[] = [
    { key: 'email',        label: 'Email',                    icon: '✉️' },
    { key: 'whatsapp',     label: 'WhatsApp',                 icon: '💬' },
    { key: 'notification', label: t('messages.notification'), icon: '🔔' },
  ];

  return (
    <div className="min-h-screen bg-slate-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
        <h1 className="text-lg font-bold text-gray-900">{t('messages.title')}</h1>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* ── Recipients ── (shown second on mobile, first on desktop) */}
        <div className="space-y-4 order-2 lg:order-1">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-3 pt-2 pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-gray-700 flex-shrink-0">{t('messages.recipients')}</h2>
                <input
                  type="text"
                  placeholder={t('messages.search')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 min-w-0 border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {totalSelected > 0 && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                    {totalSelected}
                  </span>
                )}
                <button onClick={selectAll} className="text-xs text-blue-600 hover:text-blue-800 flex-shrink-0">{t('messages.selectAll')}</button>
                <button onClick={() => { setSelectedStudentIds(new Set()); setSelectedGroupIds(new Set()); }} className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0">{t('messages.clear')}</button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[200px] lg:max-h-[420px] divide-y divide-gray-50">
              {loading ? (
                <div className="px-5 py-8 text-center text-sm text-gray-400">{t('common.loading')}</div>
              ) : (
                <>
                  {filteredGroups.length > 0 && (
                    <div>
                      <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-slate-50">{t('common.groups')}</p>
                      {filteredGroups.map((g) => {
                        const count = g.members?.length ?? 0;
                        return (
                          <label key={g.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer">
                            <input type="checkbox" checked={selectedGroupIds.has(g.id)} onChange={() => toggleGroup(g.id)} className="rounded border-gray-300 text-blue-600 flex-shrink-0" />
                            <span className="text-xs font-medium text-gray-800 truncate">{g.name}</span>
                            <span className="text-xs text-gray-400 flex-shrink-0">{count} {t('common.members').toLowerCase()}</span>
                            <span className="ms-auto text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-medium flex-shrink-0">{t('messages.group')}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {filteredStudents.length > 0 && (
                    <div>
                      <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-slate-50">{t('common.students')}</p>
                      {filteredStudents.map((s) => (
                        <label key={s.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer">
                          <input type="checkbox" checked={selectedStudentIds.has(s.id)} onChange={() => toggleStudent(s.id)} className="rounded border-gray-300 text-blue-600 flex-shrink-0" />
                          <span className="text-xs font-medium text-gray-800 truncate">{s.name}</span>
                          <span className="text-xs text-gray-400 truncate">{s.email}</span>
                          {!s.phone && channels.whatsapp && (
                            <span className="ms-auto text-xs text-amber-500 flex-shrink-0">{t('messages.noPhone')}</span>
                          )}
                        </label>
                      ))}
                    </div>
                  )}

                  {filteredStudents.length === 0 && filteredGroups.length === 0 && (
                    <div className="px-5 py-8 text-center text-sm text-gray-400">{t('common.noResults')}</div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Compose + send ── (shown first on mobile) */}
        <div className="space-y-4 order-1 lg:order-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">{t('messages.compose')}</h2>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('messages.placeholder')}
              rows={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />

            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">{t('messages.channel')}</p>
              <div className="flex flex-wrap gap-2">
                {channelConfig.map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => setChannels((c) => ({ ...c, [key]: !c[key] }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      channels[key] ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <span>{icon}</span>{label}
                  </button>
                ))}
              </div>
              {channels.whatsapp && <p className="text-xs text-amber-600 mt-2">{t('messages.whatsappNote')}</p>}
            </div>

            {sendError && <p className="text-sm text-red-600">{sendError}</p>}

            <button
              onClick={handleSend}
              disabled={sending || totalSelected === 0 || !message.trim()}
              className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {sending ? t('common.sending') : `${t('messages.sendTo')} ${totalSelected}`}
            </button>
          </div>

          {result && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
              <h2 className="text-sm font-semibold text-gray-700">
                {t('messages.sentTo')} {result.recipients}
              </h2>

              {result.result.email && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email</p>
                  <p className="text-sm text-green-700">
                    ✓ {result.result.email.sent} {t('common.send').toLowerCase()}
                    {result.result.email.failed.length > 0 && (
                      <span className="text-red-500 ms-2">
                        · {result.result.email.failed.length} failed ({result.result.email.failed.map((f) => f.name).join(', ')})
                      </span>
                    )}
                  </p>
                </div>
              )}

              {result.result.notification && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t('messages.notification')}</p>
                  <p className="text-sm text-green-700">✓ {result.result.notification.sent} {t('common.send').toLowerCase()}</p>
                  {result.result.notification.noToken.length > 0 && (
                    <p className="text-xs text-amber-600 mt-0.5">
                      No device token: {result.result.notification.noToken.map((n) => n.name).join(', ')}
                    </p>
                  )}
                </div>
              )}

              {result.result.whatsapp && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">WhatsApp</p>
                  {result.result.whatsapp.links.length > 0 ? (
                    <div className="space-y-2">
                      {result.result.whatsapp.links.map((l) => (
                        <a key={l.phone} href={l.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center justify-between px-3 py-2 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 transition-colors">
                          <div>
                            <span className="text-sm font-medium text-gray-800">{l.name}</span>
                            <span className="text-xs text-gray-400 ms-2">{l.phone}</span>
                          </div>
                          <span className="text-xs text-green-700 font-medium">Open →</span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">{t('messages.noPhoneNumbers')}</p>
                  )}
                  {result.result.whatsapp.noPhone.length > 0 && (
                    <p className="text-xs text-amber-600 mt-2">
                      {t('messages.noPhone')}: {result.result.whatsapp.noPhone.map((n) => n.name).join(', ')}
                    </p>
                  )}
                </div>
              )}

              <button onClick={() => { setResult(null); setMessage(''); }}
                className="w-full border border-gray-200 text-gray-600 rounded-xl py-2 text-sm hover:bg-gray-50 transition-colors">
                {t('messages.sendAnother')}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
