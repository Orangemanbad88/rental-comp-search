'use client';

import { useState, useEffect } from 'react';
import {
  AdjustmentProfile,
  RentalAdjustmentValues,
  RENTAL_ADJUSTMENT_PRESETS,
  DEFAULT_RENTAL_ADJUSTMENTS,
} from '@/types/settings';
import {
  getAdjustmentProfiles,
  saveAdjustmentProfile,
  deleteAdjustmentProfile,
  getActiveProfileId,
  setActiveProfileId,
} from '@/lib/storage';

const FIELD_META: { key: keyof RentalAdjustmentValues; label: string; unit: string; step: number }[] = [
  { key: 'bedroom', label: 'Bedroom', unit: '$/mo per bed', step: 25 },
  { key: 'bathroom', label: 'Bathroom', unit: '$/mo per bath', step: 25 },
  { key: 'sqft', label: 'Square Footage', unit: '$/sqft/mo', step: 0.05 },
  { key: 'furnished', label: 'Furnished', unit: '$/mo', step: 25 },
  { key: 'parking', label: 'Parking', unit: '$/mo per space', step: 25 },
  { key: 'pool', label: 'Pool', unit: '$/mo', step: 25 },
  { key: 'washerDryer', label: 'Washer/Dryer', unit: '$/mo', step: 25 },
  { key: 'pets', label: 'Pet-Friendly', unit: '$/mo', step: 10 },
];

export const AdjustmentsTab = () => {
  const [profiles, setProfiles] = useState<AdjustmentProfile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [values, setValues] = useState<RentalAdjustmentValues>(DEFAULT_RENTAL_ADJUSTMENTS);
  const [newProfileName, setNewProfileName] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const custom = getAdjustmentProfiles();
    setProfiles(custom);
    setActiveId(getActiveProfileId());
  }, []);

  useEffect(() => {
    if (!activeId) {
      setValues(DEFAULT_RENTAL_ADJUSTMENTS);
      return;
    }
    const preset = RENTAL_ADJUSTMENT_PRESETS.find(p => p.id === activeId);
    if (preset) {
      setValues(preset.values);
      return;
    }
    const custom = profiles.find(p => p.id === activeId);
    if (custom) {
      setValues(custom.values);
    }
  }, [activeId, profiles]);

  const handleProfileChange = (id: string) => {
    const newId = id === '' ? null : id;
    setActiveId(newId);
    setActiveProfileId(newId);
    setSaved(false);
  };

  const handleValueChange = (key: keyof RentalAdjustmentValues, raw: string) => {
    const num = parseFloat(raw) || 0;
    setValues(prev => ({ ...prev, [key]: num }));
    setSaved(false);
  };

  const handleSaveAsNew = () => {
    if (!newProfileName.trim()) return;
    const profile: AdjustmentProfile = {
      id: crypto.randomUUID(),
      name: newProfileName.trim(),
      isPreset: false,
      values,
    };
    saveAdjustmentProfile(profile);
    setProfiles(getAdjustmentProfiles());
    setActiveId(profile.id);
    setActiveProfileId(profile.id);
    setNewProfileName('');
    setSaved(true);
  };

  const handleUpdateProfile = () => {
    if (!activeId) return;
    const existing = profiles.find(p => p.id === activeId);
    if (!existing || existing.isPreset) return;
    saveAdjustmentProfile({ ...existing, values });
    setProfiles(getAdjustmentProfiles());
    setSaved(true);
  };

  const handleDeleteProfile = () => {
    if (!activeId) return;
    deleteAdjustmentProfile(activeId);
    setProfiles(getAdjustmentProfiles());
    setActiveId(null);
    setActiveProfileId(null);
  };

  const isCustomProfile = activeId ? profiles.some(p => p.id === activeId && !p.isPreset) : false;

  return (
    <div className="space-y-6">
      {/* Profile Selector */}
      <div>
        <label className="block text-sm font-medium text-charcoal dark:text-cream mb-2">
          Market Profile
        </label>
        <select
          value={activeId ?? ''}
          onChange={e => handleProfileChange(e.target.value)}
          className="input-premium w-full px-3 py-2.5 rounded-lg text-sm text-charcoal dark:text-cream"
        >
          <option value="">Default (Shore Market)</option>
          <optgroup label="Presets">
            {RENTAL_ADJUSTMENT_PRESETS.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </optgroup>
          {profiles.length > 0 && (
            <optgroup label="Custom Profiles">
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      {/* Adjustment Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FIELD_META.map(field => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-charcoal dark:text-cream mb-1">
              {field.label}
            </label>
            <div className="relative">
              <input
                type="number"
                value={values[field.key]}
                onChange={e => handleValueChange(field.key, e.target.value)}
                step={field.step}
                min={0}
                className="input-premium w-full px-3 py-2.5 pr-24 rounded-lg text-sm text-charcoal dark:text-cream"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-walnut/50 dark:text-cream/30">
                {field.unit}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Save Actions */}
      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-walnut/10 dark:border-gold/10">
        {isCustomProfile && (
          <>
            <button
              onClick={handleUpdateProfile}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-burgundy text-cream hover:bg-burgundy/90 dark:bg-gold dark:text-walnut-dark dark:hover:bg-gold/90 transition-colors"
            >
              Save Changes
            </button>
            <button
              onClick={handleDeleteProfile}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10 transition-colors"
            >
              Delete Profile
            </button>
          </>
        )}
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <input
            type="text"
            value={newProfileName}
            onChange={e => setNewProfileName(e.target.value)}
            placeholder="New profile name..."
            className="input-premium flex-1 px-3 py-2 rounded-lg text-sm text-charcoal dark:text-cream"
          />
          <button
            onClick={handleSaveAsNew}
            disabled={!newProfileName.trim()}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-walnut/20 dark:border-gold/20 text-charcoal dark:text-cream hover:bg-walnut/5 dark:hover:bg-cream/5 transition-colors disabled:opacity-40"
          >
            Save As New
          </button>
        </div>
      </div>

      {saved && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">Profile saved successfully.</p>
      )}
    </div>
  );
};
