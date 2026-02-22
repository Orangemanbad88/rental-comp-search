'use client';

import { RentalCompResult, SubjectProperty } from '@/types/property';
import { formatCurrency, cn } from '@/lib/utils';

interface ComparisonChartProps {
  subject: SubjectProperty;
  selectedComps: RentalCompResult[];
}

type MetricKey = 'rentPrice' | 'rentPerSqft' | 'sqft' | 'bedrooms' | 'bathrooms';

interface Metric {
  key: MetricKey;
  label: string;
  format: (value: number) => string;
  subjectKey?: keyof SubjectProperty;
}

const metrics: Metric[] = [
  { key: 'rentPrice', label: 'Monthly Rent', format: (v) => `${formatCurrency(v)}/mo` },
  { key: 'rentPerSqft', label: '$/SF/Mo', format: (v) => `$${v.toFixed(2)}` },
  { key: 'sqft', label: 'Sq Ft', format: (v) => v.toLocaleString(), subjectKey: 'sqft' },
  { key: 'bedrooms', label: 'Beds', format: (v) => v.toString(), subjectKey: 'bedrooms' },
  { key: 'bathrooms', label: 'Baths', format: (v) => v.toString(), subjectKey: 'bathrooms' },
];

const colors = [
  { bg: 'bg-burgundy', text: 'text-burgundy dark:text-burgundy-light' },
  { bg: 'bg-gold', text: 'text-gold dark:text-gold-light' },
  { bg: 'bg-walnut', text: 'text-walnut dark:text-walnut-light' },
  { bg: 'bg-emerald-600', text: 'text-emerald-600 dark:text-emerald-400' },
  { bg: 'bg-amber-600', text: 'text-amber-600 dark:text-amber-400' },
];

export function ComparisonChart({ subject, selectedComps }: ComparisonChartProps) {
  if (selectedComps.length === 0) return null;
  const displayedComps = selectedComps.slice(0, 5);

  const getMaxValue = (key: MetricKey): number => {
    const compValues = displayedComps.map(c => c[key] as number);
    const subjectValue = key === 'rentPrice' || key === 'rentPerSqft' ? 0 : (subject[key as keyof SubjectProperty] as number || 0);
    return Math.max(...compValues, subjectValue);
  };

  const getSubjectValue = (metric: Metric): number | null => {
    if (metric.subjectKey) return subject[metric.subjectKey] as number;
    return null;
  };

  return (
    <div className="card-premium rounded-xl overflow-hidden">
      <div className="wood-grain px-6 py-4 border-b border-walnut-dark/50">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-gold-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h2 className="font-display text-xl font-semibold text-cream">Comparison Chart</h2>
        </div>
      </div>

      <div className="p-6 bg-gradient-to-b from-ivory to-cream dark:from-[#1E293B] dark:to-[#1E293B]">
        <div className="flex flex-wrap gap-4 mb-6 pb-4 border-b border-walnut/10 dark:border-gold/10">
          {displayedComps.map((comp, idx) => (
            <div key={comp.id} className="flex items-center gap-2">
              <div className={cn('w-3 h-3 rounded-full', colors[idx % colors.length].bg)} />
              <span className="text-sm text-walnut dark:text-cream/70 truncate max-w-[150px]">{comp.address.split(',')[0]}</span>
            </div>
          ))}
        </div>

        <div className="space-y-8">
          {metrics.map((metric) => {
            const maxValue = getMaxValue(metric.key);
            const subjectValue = getSubjectValue(metric);
            return (
              <div key={metric.key}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-charcoal dark:text-cream">{metric.label}</h3>
                  {subjectValue !== null && (
                    <span className="text-xs text-walnut/60 dark:text-cream/40 bg-walnut/5 dark:bg-gold/5 px-2 py-1 rounded">
                      Subject: {metric.format(subjectValue)}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {displayedComps.map((comp, idx) => {
                    const value = comp[metric.key] as number;
                    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
                    const color = colors[idx % colors.length];
                    return (
                      <div key={comp.id}>
                        <div className="flex items-center gap-3">
                          <div className="w-24 text-xs text-walnut/70 dark:text-cream/50 truncate">{comp.address.split(' ')[0]}</div>
                          <div className="flex-1 h-8 bg-walnut/5 dark:bg-cream/5 rounded-lg overflow-hidden relative">
                            <div className={cn('h-full rounded-lg transition-all duration-500', color.bg)} style={{ width: `${Math.max(percentage, 2)}%` }} />
                            {subjectValue !== null && metric.key !== 'rentPrice' && metric.key !== 'rentPerSqft' && (
                              <div className="absolute top-0 bottom-0 w-0.5 bg-burgundy dark:bg-gold" style={{ left: `${(subjectValue / maxValue) * 100}%` }} />
                            )}
                          </div>
                          <div className="w-24 text-right">
                            <span className={cn('text-sm font-semibold', color.text)}>{metric.format(value)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="mt-8 pt-6 border-t border-walnut/10 dark:border-gold/10">
          <h3 className="text-sm font-semibold text-charcoal dark:text-cream mb-4">Summary Statistics</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-burgundy/5 dark:bg-gold/5 border border-burgundy/10 dark:border-gold/10 rounded-xl p-4 text-center">
              <p className="text-xs text-walnut/60 dark:text-cream/40 mb-1">Avg Rent</p>
              <p className="font-display text-lg font-bold text-charcoal dark:text-cream">
                {formatCurrency(Math.round(displayedComps.reduce((sum, c) => sum + c.rentPrice, 0) / displayedComps.length))}/mo
              </p>
            </div>
            <div className="bg-burgundy/5 dark:bg-gold/5 border border-burgundy/10 dark:border-gold/10 rounded-xl p-4 text-center">
              <p className="text-xs text-walnut/60 dark:text-cream/40 mb-1">Avg $/SF/Mo</p>
              <p className="font-display text-lg font-bold text-charcoal dark:text-cream">
                ${(displayedComps.reduce((sum, c) => sum + c.rentPerSqft, 0) / displayedComps.length).toFixed(2)}
              </p>
            </div>
            <div className="bg-burgundy/5 dark:bg-gold/5 border border-burgundy/10 dark:border-gold/10 rounded-xl p-4 text-center">
              <p className="text-xs text-walnut/60 dark:text-cream/40 mb-1">Rent Range</p>
              <p className="font-display text-lg font-bold text-charcoal dark:text-cream">
                {formatCurrency(Math.max(...displayedComps.map(c => c.rentPrice)) - Math.min(...displayedComps.map(c => c.rentPrice)))}
              </p>
            </div>
            <div className="bg-burgundy/5 dark:bg-gold/5 border border-burgundy/10 dark:border-gold/10 rounded-xl p-4 text-center">
              <p className="text-xs text-walnut/60 dark:text-cream/40 mb-1">Avg Match</p>
              <p className="font-display text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {Math.round(displayedComps.reduce((sum, c) => sum + c.similarityScore, 0) / displayedComps.length)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
