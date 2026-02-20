'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import {
  MlsProvider,
  MlsProviderConfig,
  MLS_PROVIDERS,
} from '@/types/settings';
import { getIntegrationConfig, saveIntegrationConfig, clearIntegrationConfig } from '@/lib/storage';

export default function IntegrationsPage() {
  const [selectedProvider, setSelectedProvider] = useState<MlsProvider | ''>('');
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const config = getIntegrationConfig();
    if (config) {
      setSelectedProvider(config.provider);
      setCredentials(config.credentials);
    }
  }, []);

  const providerMeta = MLS_PROVIDERS.find(p => p.id === selectedProvider);

  const handleProviderChange = (id: string) => {
    setSelectedProvider(id as MlsProvider | '');
    setCredentials({});
    setTestResult(null);
    setSaved(false);
  };

  const handleCredentialChange = (key: string, value: string) => {
    setCredentials(prev => ({ ...prev, [key]: value }));
    setTestResult(null);
    setSaved(false);
  };

  const handleTestConnection = async () => {
    if (!selectedProvider || !providerMeta) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: selectedProvider, credentials }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch {
      setTestResult({ success: false, message: 'Network error — could not reach test endpoint' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    if (!selectedProvider) return;
    const config: MlsProviderConfig = {
      provider: selectedProvider,
      credentials,
      lastTested: testResult?.success ? new Date().toISOString() : undefined,
      testStatus: testResult ? (testResult.success ? 'success' : 'error') : 'untested',
    };
    saveIntegrationConfig(config);
    setSaved(true);
  };

  const handleDisconnect = () => {
    clearIntegrationConfig();
    setSelectedProvider('');
    setCredentials({});
    setTestResult(null);
    setSaved(false);
  };

  const allRequiredFilled = providerMeta?.credentialFields
    .filter(f => f.required)
    .every(f => credentials[f.key]?.trim()) ?? false;

  return (
    <div className="min-h-screen bg-cream dark:bg-[#0a0a0f]">
      <Header />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-charcoal dark:text-cream">Integrations</h1>
          <p className="text-sm text-walnut/60 dark:text-cream/40 mt-1">
            Connect your MLS provider to pull live rental listing data
          </p>
        </div>

        <div className="card-premium rounded-xl overflow-hidden">
          <div className="p-6 border-b border-walnut/10 dark:border-gold/10">
            <label className="block text-sm font-medium text-charcoal dark:text-cream mb-2">
              MLS Provider
            </label>
            <select
              value={selectedProvider}
              onChange={e => handleProviderChange(e.target.value)}
              className="input-premium w-full px-3 py-2.5 rounded-lg text-sm text-charcoal dark:text-cream"
            >
              <option value="">Select a provider...</option>
              {MLS_PROVIDERS.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {providerMeta && (
              <p className="text-xs text-walnut/50 dark:text-cream/30 mt-2">
                {providerMeta.description}
                {providerMeta.docsUrl && (
                  <>
                    {' — '}
                    <a
                      href={providerMeta.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-burgundy dark:text-gold underline hover:no-underline"
                    >
                      View docs
                    </a>
                  </>
                )}
              </p>
            )}
          </div>

          {providerMeta && (
            <div className="p-6 space-y-4">
              <h3 className="text-sm font-semibold text-charcoal dark:text-cream uppercase tracking-wider">
                Credentials
              </h3>
              {providerMeta.credentialFields.map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-charcoal dark:text-cream mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type={field.type}
                    value={credentials[field.key] ?? ''}
                    onChange={e => handleCredentialChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="input-premium w-full px-3 py-2.5 rounded-lg text-sm text-charcoal dark:text-cream"
                  />
                </div>
              ))}

              <div className="mt-6 p-4 rounded-lg bg-walnut/5 dark:bg-cream/5 border border-walnut/10 dark:border-gold/10">
                <h4 className="text-xs font-semibold text-walnut dark:text-gold-light/70 uppercase tracking-wider mb-2">
                  Field Mapping
                </h4>
                <div className="grid grid-cols-2 gap-y-1 text-xs">
                  {[
                    ['Address', 'address / UnparsedAddress'],
                    ['Rent Price', 'listPrice / ListPrice'],
                    ['Bedrooms', 'bedrooms / BedroomsTotal'],
                    ['Bathrooms', 'bathsFull / BathroomsTotalInteger'],
                    ['Sq Ft', 'area / LivingArea'],
                    ['Year Built', 'yearBuilt / YearBuilt'],
                    ['Furnished', 'furnished / Furnished'],
                    ['Pets', 'petsAllowed / PetsAllowed'],
                  ].map(([local, remote]) => (
                    <div key={local} className="contents">
                      <span className="text-charcoal dark:text-cream font-medium">{local}</span>
                      <span className="text-walnut/50 dark:text-cream/30">{remote}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-walnut/10 dark:border-gold/10">
                <button
                  onClick={handleTestConnection}
                  disabled={!allRequiredFilled || testing}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-burgundy text-cream hover:bg-burgundy/90 dark:bg-gold dark:text-walnut-dark dark:hover:bg-gold/90 transition-colors disabled:opacity-40"
                >
                  {testing ? 'Testing...' : 'Test Connection'}
                </button>
                <button
                  onClick={handleSave}
                  disabled={!allRequiredFilled}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-walnut/20 dark:border-gold/20 text-charcoal dark:text-cream hover:bg-walnut/5 dark:hover:bg-cream/5 transition-colors disabled:opacity-40"
                >
                  Save Configuration
                </button>
                {getIntegrationConfig() && (
                  <button
                    onClick={handleDisconnect}
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10 transition-colors"
                  >
                    Disconnect
                  </button>
                )}
              </div>

              {testResult && (
                <div className={`text-sm px-4 py-3 rounded-lg ${
                  testResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20'
                }`}>
                  {testResult.message}
                </div>
              )}
              {saved && !testResult && (
                <p className="text-sm text-emerald-600 dark:text-emerald-400">Configuration saved.</p>
              )}
            </div>
          )}

          {!providerMeta && (
            <div className="p-12 text-center">
              <svg className="w-12 h-12 mx-auto mb-4 text-walnut/20 dark:text-cream/10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <p className="text-walnut/60 dark:text-cream/40">
                Select a provider above to configure your MLS connection
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
