'use client';

import { useState, useEffect } from 'react';
import { SearchPreferences, DEFAULT_SEARCH_PREFERENCES } from '@/types/settings';
import { getSearchPreferences, saveSearchPreferences } from '@/lib/storage';

export const PreferencesTab = () => {
  const [prefs, setPrefs] = useState<SearchPreferences>(DEFAULT_SEARCH_PREFERENCES);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPrefs(getSearchPreferences());
  }, []);

  const handleChange = <K extends keyof SearchPreferences>(key: K, value: SearchPreferences[K]) => {
    setPrefs(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    saveSearchPreferences(prefs);
    setSaved(true);
  };

  const handleReset = () => {
    setPrefs(DEFAULT_SEARCH_PREFERENCES);
    saveSearchPreferences(DEFAULT_SEARCH_PREFERENCES);
    setSaved(true);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-charcoal dark:text-cream mb-1">
            Default Search Radius
          </label>
          <select
            value={prefs.defaultRadius}
            onChange={e => handleChange('defaultRadius', parseFloat(e.target.value) as SearchPreferences['defaultRadius'])}
            className="input-premium w-full px-3 py-2.5 rounded-lg text-sm text-charcoal dark:text-cream"
          >
            <option value={0.5}>0.5 miles</option>
            <option value={1}>1 mile</option>
            <option value={2}>2 miles</option>
            <option value={5}>5 miles</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-charcoal dark:text-cream mb-1">
            Default Timeframe
          </label>
          <select
            value={prefs.defaultTimeframe}
            onChange={e => handleChange('defaultTimeframe', parseInt(e.target.value) as SearchPreferences['defaultTimeframe'])}
            className="input-premium w-full px-3 py-2.5 rounded-lg text-sm text-charcoal dark:text-cream"
          >
            <option value={3}>3 months</option>
            <option value={6}>6 months</option>
            <option value={12}>12 months</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-charcoal dark:text-cream mb-1">
            Bedroom Variance
          </label>
          <input
            type="number"
            value={prefs.defaultBedVariance}
            onChange={e => handleChange('defaultBedVariance', parseInt(e.target.value) || 0)}
            min={0}
            max={5}
            className="input-premium w-full px-3 py-2.5 rounded-lg text-sm text-charcoal dark:text-cream"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-charcoal dark:text-cream mb-1">
            Bathroom Variance
          </label>
          <input
            type="number"
            value={prefs.defaultBathVariance}
            onChange={e => handleChange('defaultBathVariance', parseInt(e.target.value) || 0)}
            min={0}
            max={5}
            className="input-premium w-full px-3 py-2.5 rounded-lg text-sm text-charcoal dark:text-cream"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-charcoal dark:text-cream mb-1">
            Sq Ft Variance (%)
          </label>
          <input
            type="number"
            value={prefs.defaultSqftVariance}
            onChange={e => handleChange('defaultSqftVariance', parseInt(e.target.value) || 0)}
            min={0}
            max={100}
            step={5}
            className="input-premium w-full px-3 py-2.5 rounded-lg text-sm text-charcoal dark:text-cream"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-walnut/10 dark:border-gold/10">
        <button
          onClick={handleSave}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-burgundy text-cream hover:bg-burgundy/90 dark:bg-gold dark:text-walnut-dark dark:hover:bg-gold/90 transition-colors"
        >
          Save Preferences
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-walnut/20 dark:border-gold/20 text-charcoal dark:text-cream hover:bg-walnut/5 dark:hover:bg-cream/5 transition-colors"
        >
          Reset to Defaults
        </button>
        {saved && (
          <span className="text-sm text-emerald-600 dark:text-emerald-400">Saved.</span>
        )}
      </div>
    </div>
  );
};
