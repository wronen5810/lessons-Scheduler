'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTeacherSettings } from '@/lib/useTeacherSettings';
import TeacherSettingsModal from '@/components/TeacherSettingsModal';

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
  const f = settings.features;
  const [showSettings, setShowSettings] = useState(false);

  const cards: FeatureCard[] = [
    {
      label: 'Schedule',
      description: 'View and manage your calendar',
      href: '/teacher/schedule',
      icon: '📅',
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    },
    {
      label: 'Students',
      description: 'Manage your students',
      href: '/teacher/students',
      icon: '👥',
      color: 'bg-violet-50 border-violet-200 hover:bg-violet-100',
    },
    ...(f.billing ? [{
      label: 'Billing',
      description: 'Track payments and subscriptions',
      href: '/teacher/billing',
      icon: '💰',
      color: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
    }] : []),
    ...(f.messages ? [{
      label: 'Messages',
      description: 'Communicate with your students',
      href: '/teacher/messages',
      icon: '💬',
      color: 'bg-amber-50 border-amber-200 hover:bg-amber-100',
    }] : []),
    {
      label: 'Settings',
      description: 'Customize your preferences',
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h1>
        <p className="text-sm text-gray-500 mb-8">What would you like to do today?</p>

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
    </>
  );
}
