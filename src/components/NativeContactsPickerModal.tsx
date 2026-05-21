'use client';

import { useEffect, useState } from 'react';
import { Contacts } from '@capacitor-community/contacts';
import { X, Search } from 'lucide-react';

interface ContactRow {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface Props {
  lang: string;
  isRTL: boolean;
  onSelect: (rows: ContactRow[]) => void;
  onClose: () => void;
}

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <div className={`w-4 h-4 rounded flex-shrink-0 border-2 transition-all ${checked ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
      {checked && (
        <svg viewBox="0 0 10 10" fill="none" className="w-full h-full">
          <path d="M2 5l2 2 4-4" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

export default function NativeContactsPickerModal({ lang, isRTL, onSelect, onClose }: Props) {
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      try {
        const perm = await Contacts.requestPermissions();
        if (perm.contacts !== 'granted' && perm.contacts !== 'limited') {
          setError(lang === 'he' ? 'לא ניתנה הרשאה לאנשי קשר' : 'Contacts permission denied');
          setLoading(false);
          return;
        }
        const { contacts: raw } = await Contacts.getContacts({
          projection: { name: true, emails: true, phones: true },
        });
        const rows: ContactRow[] = raw
          .map((c) => ({
            id: c.contactId,
            name: c.name?.display?.trim() ?? [c.name?.given, c.name?.family].filter(Boolean).join(' ').trim() ?? '',
            email: c.emails?.[0]?.address?.trim() ?? '',
            phone: c.phones?.[0]?.number?.trim() ?? '',
          }))
          .filter((r) => r.name || r.email || r.phone)
          .sort((a, b) => a.name.localeCompare(b.name));
        setContacts(rows);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError((lang === 'he' ? 'שגיאה: ' : 'Error: ') + msg);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [lang]);

  const filtered = query.trim()
    ? contacts.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.email.toLowerCase().includes(query.toLowerCase()) ||
        c.phone.includes(query)
      )
    : contacts;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleConfirm() {
    const rows = contacts.filter((c) => selected.has(c.id));
    onSelect(rows);
  }

  const title = lang === 'he' ? 'בחר אנשי קשר' : 'Select contacts';
  const searchPlaceholder = lang === 'he' ? 'חיפוש...' : 'Search...';
  const addLabel = lang === 'he' ? `הוסף (${selected.size})` : `Add (${selected.size})`;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-sm flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full ps-9 pe-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Contact list */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-8">
              {lang === 'he' ? 'טוען...' : 'Loading...'}
            </p>
          ) : error ? (
            <p className="text-sm text-red-500 text-center py-8">{error}</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              {lang === 'he' ? 'לא נמצאו אנשי קשר' : 'No contacts found'}
            </p>
          ) : (
            <div className="space-y-1">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => toggle(c.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-start transition-colors ${
                    selected.has(c.id) ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <CheckBox checked={selected.has(c.id)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{c.name || '—'}</p>
                    <p className="text-xs text-gray-400 truncate">{c.email || c.phone}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={handleConfirm}
            disabled={selected.size === 0}
            className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            {selected.size === 0
              ? (lang === 'he' ? 'בחר אנשי קשר' : 'Select contacts')
              : addLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
