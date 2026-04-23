'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import { useTeacherSettings } from '@/lib/useTeacherSettings';
import { useLanguage } from '@/contexts/LanguageContext';
import { translate } from '@/lib/i18n';
import TeacherSettingsModal from '@/components/TeacherSettingsModal';
import ShareLinkModal from '@/components/ShareLinkModal';

interface FeatureCard {
  label: string;
  description: string;
  href?: string;
  onClick?: () => void;
  icon: string;
  color: string;
}

export default function TeacherDashboard() {
  const { settings, loading, save: saveSettings } = useTeacherSettings();
  const { t, lang } = useLanguage();
  const f = settings.features;
  const [showSettings, setShowSettings] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [teacherId, setTeacherId] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [nextLesson, setNextLesson] = useState<{ formatted: string } | null>(null);

  useEffect(() => {
    createBrowserSupabase().auth.getUser().then(({ data }) => {
      if (data.user) setTeacherId(data.user.id);
    });
    fetch('/api/teacher/me/subscription').then(r => r.json()).then(data => {
      if (data.teacher?.name) setTeacherName(data.teacher.name);
    }).catch(() => {});
    fetch('/api/teacher/next-lesson').then(r => r.json()).then(data => {
      if (data.date) setNextLesson(data);
    }).catch(() => {});
  }, []);

  const cards: FeatureCard[] = [
    {
      label: t('teacher.schedule'),
      description: t('teacher.scheduleDesc'),
      href: '/teacher/schedule',
      icon: '📅',
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    },
    {
      label: t('common.students'),
      description: t('teacher.studentsDesc'),
      href: '/teacher/students',
      icon: '👥',
      color: 'bg-violet-50 border-violet-200 hover:bg-violet-100',
    },
    ...(f.billing ? [{
      label: t('teacher.billing'),
      description: t('teacher.billingDesc'),
      href: '/teacher/billing',
      icon: '💰',
      color: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
    }] : []),
    ...(f.messages ? [{
      label: t('teacher.messages'),
      description: t('teacher.messagesDesc'),
      href: '/teacher/messages',
      icon: '💬',
      color: 'bg-amber-50 border-amber-200 hover:bg-amber-100',
    }] : []),
    {
      label: t('common.share'),
      description: t('teacher.shareDesc'),
      onClick: () => setShowShare(true),
      icon: '🔗',
      color: 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100',
    },
    {
      label: t('common.settings'),
      description: t('teacher.settingsDesc'),
      onClick: () => setShowSettings(true),
      icon: '⚙️',
      color: 'bg-gray-50 border-gray-200 hover:bg-gray-100',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('teacher.welcomeBack')}</h1>
        {nextLesson ? (
          <p className="text-sm text-blue-600 font-medium mb-1">
            🕐 {translate(lang, 'teacher.nextLesson', { time: nextLesson.formatted })}
          </p>
        ) : null}
        <p className="text-sm text-gray-500 mb-8">{t('teacher.whatToDoToday')}</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {cards.map((card) => {
            const cls = `group flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all ${card.color} shadow-sm hover:shadow-md`;
            const inner = (
              <>
                <span className="text-4xl">{card.icon}</span>
                <div className="text-center">
                  <div className="font-semibold text-gray-900 text-sm">{card.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5 leading-snug">{card.description}</div>
                </div>
              </>
            );
            return card.href ? (
              <Link key={card.label} href={card.href} className={cls}>{inner}</Link>
            ) : (
              <button key={card.label} onClick={card.onClick} className={cls}>{inner}</button>
            );
          })}
        </div>
      </main>

      {showSettings && (
        <TeacherSettingsModal settings={settings} onSave={saveSettings} onClose={() => setShowSettings(false)} />
      )}

      {showShare && teacherId && (
        <ShareLinkModal teacherId={teacherId} teacherName={teacherName} onClose={() => setShowShare(false)} />
      )}
    </>
  );
}
