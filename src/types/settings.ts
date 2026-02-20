export interface MlsProviderConfig {
  provider: MlsProvider;
  credentials: Record<string, string>;
  fieldMapping?: Record<string, string>;
  lastTested?: string;
  testStatus?: 'success' | 'error' | 'untested';
}

export type MlsProvider =
  | 'simplyrets'
  | 'bridgeinteractive'
  | 'sparkapi'
  | 'crmls'
  | 'custom';

export interface MlsProviderMeta {
  id: MlsProvider;
  name: string;
  description: string;
  credentialFields: CredentialField[];
  docsUrl: string;
}

export interface CredentialField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'url';
  placeholder: string;
  required: boolean;
}

export const MLS_PROVIDERS: MlsProviderMeta[] = [
  {
    id: 'simplyrets',
    name: 'SimplyRETS',
    description: 'Simple MLS API with wide coverage',
    credentialFields: [
      { key: 'username', label: 'API Username', type: 'text', placeholder: 'simplyrets', required: true },
      { key: 'password', label: 'API Password', type: 'password', placeholder: 'simplyrets', required: true },
    ],
    docsUrl: 'https://docs.simplyrets.com',
  },
  {
    id: 'bridgeinteractive',
    name: 'Bridge Interactive',
    description: 'RESO Web API compliant data platform',
    credentialFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Your Bridge API key', required: true },
      { key: 'serverUrl', label: 'Server URL', type: 'url', placeholder: 'https://api.bridgedataoutput.com', required: true },
    ],
    docsUrl: 'https://bridgedataoutput.com/docs',
  },
  {
    id: 'sparkapi',
    name: 'Spark API',
    description: 'FBS Spark API for Flexmls',
    credentialFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Your Spark API key', required: true },
      { key: 'apiSecret', label: 'API Secret', type: 'password', placeholder: 'Your Spark API secret', required: true },
    ],
    docsUrl: 'https://sparkplatform.com/docs',
  },
  {
    id: 'crmls',
    name: 'CRMLS',
    description: 'California Regional MLS',
    credentialFields: [
      { key: 'loginUrl', label: 'RETS Login URL', type: 'url', placeholder: 'https://rets.crmls.org/...', required: true },
      { key: 'username', label: 'Username', type: 'text', placeholder: 'Your CRMLS username', required: true },
      { key: 'password', label: 'Password', type: 'password', placeholder: 'Your CRMLS password', required: true },
    ],
    docsUrl: 'https://crmls.org',
  },
  {
    id: 'custom',
    name: 'Custom / Other MLS',
    description: 'Configure any RETS or Web API endpoint',
    credentialFields: [
      { key: 'baseUrl', label: 'Base URL', type: 'url', placeholder: 'https://api.yourmls.com', required: true },
      { key: 'apiKey', label: 'API Key / Token', type: 'password', placeholder: 'Your API key or bearer token', required: true },
    ],
    docsUrl: '',
  },
];

export interface AdjustmentProfile {
  id: string;
  name: string;
  isPreset: boolean;
  values: RentalAdjustmentValues;
}

export interface RentalAdjustmentValues {
  bedroom: number;
  bathroom: number;
  sqft: number;
  furnished: number;
  parking: number;
  pool: number;
  washerDryer: number;
  pets: number;
}

export interface SearchPreferences {
  defaultRadius: 0.5 | 1 | 2 | 5;
  defaultTimeframe: 3 | 6 | 12;
  defaultBedVariance: number;
  defaultBathVariance: number;
  defaultSqftVariance: number;
}

export const DEFAULT_RENTAL_ADJUSTMENTS: RentalAdjustmentValues = {
  bedroom: 150,
  bathroom: 75,
  sqft: 0.50,
  furnished: 200,
  parking: 75,
  pool: 100,
  washerDryer: 75,
  pets: 50,
};

export const RENTAL_ADJUSTMENT_PRESETS: AdjustmentProfile[] = [
  {
    id: 'shore-nj',
    name: 'Shore Market (Cape May, NJ)',
    isPreset: true,
    values: { bedroom: 150, bathroom: 75, sqft: 0.50, furnished: 200, parking: 75, pool: 100, washerDryer: 75, pets: 50 },
  },
  {
    id: 'suburban-mid',
    name: 'Suburban (Mid-Atlantic)',
    isPreset: true,
    values: { bedroom: 125, bathroom: 60, sqft: 0.40, furnished: 175, parking: 50, pool: 75, washerDryer: 60, pets: 40 },
  },
  {
    id: 'urban-northeast',
    name: 'Urban (Northeast)',
    isPreset: true,
    values: { bedroom: 250, bathroom: 125, sqft: 0.75, furnished: 300, parking: 150, pool: 150, washerDryer: 100, pets: 75 },
  },
  {
    id: 'rural',
    name: 'Rural / Low-Cost Market',
    isPreset: true,
    values: { bedroom: 75, bathroom: 40, sqft: 0.25, furnished: 100, parking: 25, pool: 50, washerDryer: 40, pets: 25 },
  },
];

export const DEFAULT_SEARCH_PREFERENCES: SearchPreferences = {
  defaultRadius: 2,
  defaultTimeframe: 12,
  defaultBedVariance: 1,
  defaultBathVariance: 1,
  defaultSqftVariance: 20,
};
