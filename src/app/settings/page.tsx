'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { AdjustmentsTab } from '@/components/settings/AdjustmentsTab';
import { PreferencesTab } from '@/components/settings/PreferencesTab';

type Tab = 'adjustments' | 'preferences';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('adjustments');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'adjustments', label: 'Adjustments' },
    { id: 'preferences', label: 'Preferences' },
  ];

  return (
    <div className="min-h-screen bg-cream dark:bg-[#0a0a0f]">
      <Header />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-charcoal dark:text-cream">Settings</h1>
          <p className="text-sm text-walnut/60 dark:text-cream/40 mt-1">
            Configure rental adjustment values and search defaults
          </p>
        </div>

        <div className="flex gap-1 mb-6 border-b border-walnut/10 dark:border-gold/10">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-burgundy dark:border-gold text-burgundy dark:text-gold'
                  : 'border-transparent text-walnut/60 dark:text-cream/40 hover:text-charcoal dark:hover:text-cream'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="card-premium rounded-xl p-6">
          {activeTab === 'adjustments' && <AdjustmentsTab />}
          {activeTab === 'preferences' && <PreferencesTab />}
        </div>
      </main>
    </div>
  );
}
