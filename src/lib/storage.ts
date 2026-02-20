import {
  MlsProviderConfig,
  AdjustmentProfile,
  RentalAdjustmentValues,
  SearchPreferences,
  DEFAULT_RENTAL_ADJUSTMENTS,
  DEFAULT_SEARCH_PREFERENCES,
} from '@/types/settings';

const INTEGRATION_KEY = 'rentAtlas_integration';
const PROFILES_KEY = 'rentAtlas_adjustmentProfiles';
const ACTIVE_PROFILE_KEY = 'rentAtlas_activeProfileId';
const PREFERENCES_KEY = 'rentAtlas_searchPreferences';

// --- Integration Config ---

export const getIntegrationConfig = (): MlsProviderConfig | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(INTEGRATION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveIntegrationConfig = (config: MlsProviderConfig): void => {
  localStorage.setItem(INTEGRATION_KEY, JSON.stringify(config));
};

export const clearIntegrationConfig = (): void => {
  localStorage.removeItem(INTEGRATION_KEY);
};

// --- Adjustment Profiles ---

export const getAdjustmentProfiles = (): AdjustmentProfile[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveAdjustmentProfile = (profile: AdjustmentProfile): void => {
  const profiles = getAdjustmentProfiles();
  const idx = profiles.findIndex(p => p.id === profile.id);
  if (idx >= 0) {
    profiles[idx] = profile;
  } else {
    profiles.push(profile);
  }
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
};

export const deleteAdjustmentProfile = (id: string): void => {
  const profiles = getAdjustmentProfiles().filter(p => p.id !== id);
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  if (getActiveProfileId() === id) {
    localStorage.removeItem(ACTIVE_PROFILE_KEY);
  }
};

export const getActiveProfileId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_PROFILE_KEY);
};

export const setActiveProfileId = (id: string | null): void => {
  if (id) {
    localStorage.setItem(ACTIVE_PROFILE_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_PROFILE_KEY);
  }
};

export const getActiveAdjustmentValues = (): RentalAdjustmentValues => {
  if (typeof window === 'undefined') return DEFAULT_RENTAL_ADJUSTMENTS;
  const profileId = getActiveProfileId();
  if (!profileId) return DEFAULT_RENTAL_ADJUSTMENTS;

  const profiles = getAdjustmentProfiles();
  const profile = profiles.find(p => p.id === profileId);
  return profile?.values ?? DEFAULT_RENTAL_ADJUSTMENTS;
};

// --- Search Preferences ---

export const getSearchPreferences = (): SearchPreferences => {
  if (typeof window === 'undefined') return DEFAULT_SEARCH_PREFERENCES;
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_SEARCH_PREFERENCES;
  } catch {
    return DEFAULT_SEARCH_PREFERENCES;
  }
};

export const saveSearchPreferences = (prefs: SearchPreferences): void => {
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
};
