'use client';

import { useState } from 'react';
import { RentalCompResult } from '@/types/property';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

interface CompResultsTableProps {
  results: RentalCompResult[];
  onToggleSelect: (id: string) => void;
  onPropertyClick?: (property: RentalCompResult) => void;
}

type SortKey = 'similarityScore' | 'rentPrice' | 'leaseDate' | 'distanceMiles' | 'sqft' | 'rentPerSqft';
type SortDirection = 'asc' | 'desc';

function SimilarityBadge({ score }: { score: number }) {
  const percentage = Math.min(100, Math.max(0, score));
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-walnut/10 dark:bg-gold/10 rounded-full overflow-hidden w-12">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            percentage >= 80 && 'bg-gradient-to-r from-emerald-600 to-emerald-500',
            percentage >= 60 && percentage < 80 && 'bg-gradient-to-r from-gold to-gold-light',
            percentage < 60 && 'bg-walnut/40 dark:bg-cream/30'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={cn(
        'text-xs font-bold tabular-nums',
        percentage >= 80 && 'text-emerald-600 dark:text-emerald-400',
        percentage >= 60 && percentage < 80 && 'text-gold dark:text-gold-light',
        percentage < 60 && 'text-walnut/60 dark:text-cream/50'
      )}>
        {score}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    'Leased': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30',
    'Active': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30',
    'Pending': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30',
  };
  return (
    <span className={cn('text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border', colors[status as keyof typeof colors] || colors['Active'])}>
      {status}
    </span>
  );
}

const INITIAL_SHOW = 10;

export function CompResultsTable({ results, onToggleSelect, onPropertyClick }: CompResultsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('similarityScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showAll, setShowAll] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection(key === 'similarityScore' ? 'desc' : 'asc');
    }
  };

  const sortedResults = [...results].sort((a, b) => {
    let aVal: number | string = a[sortKey];
    let bVal: number | string = b[sortKey];
    if (sortKey === 'leaseDate') {
      aVal = new Date(a.leaseDate || a.listDate).getTime();
      bVal = new Date(b.leaseDate || b.listDate).getTime();
    }
    if (sortDirection === 'asc') return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
  });

  const SortHeader = ({ label, sortKeyName, className }: { label: string; sortKeyName: SortKey; className?: string }) => (
    <th
      className={cn('px-3 py-3 text-left text-xs font-semibold text-walnut dark:text-gold-light/70 uppercase tracking-wider cursor-pointer hover:text-burgundy dark:hover:text-gold select-none whitespace-nowrap transition-colors', className)}
      onClick={() => handleSort(sortKeyName)}
    >
      <div className="flex items-center gap-1">
        {label}
        <span className={cn('transition-colors', sortKey === sortKeyName ? 'text-burgundy dark:text-gold' : 'text-walnut/30 dark:text-cream/20')}>
          {sortKey === sortKeyName ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      </div>
    </th>
  );

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-burgundy/5 dark:bg-gold/10 flex items-center justify-center border border-burgundy/20 dark:border-gold/20">
          <svg className="w-8 h-8 text-burgundy/50 dark:text-gold/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h3 className="font-display text-lg font-medium text-charcoal dark:text-cream mb-1">No Rental Comps Found</h3>
        <p className="text-walnut dark:text-cream/60">Try adjusting your search criteria or expanding the radius.</p>
      </div>
    );
  }

  const visibleResults = showAll ? sortedResults : sortedResults.slice(0, INITIAL_SHOW);
  const hasMore = sortedResults.length > INITIAL_SHOW;

  return (
    <div>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-walnut/10 dark:border-gold/10">
              <th className="px-3 py-3 w-10"><span className="sr-only">Select</span></th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-walnut dark:text-gold-light/70 uppercase tracking-wider">Property</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-walnut dark:text-gold-light/70 uppercase tracking-wider">Status</th>
              <SortHeader label="Date" sortKeyName="leaseDate" />
              <SortHeader label="Rent" sortKeyName="rentPrice" />
              <th className="px-3 py-3 text-left text-xs font-semibold text-walnut dark:text-gold-light/70 uppercase tracking-wider">Bed/Bath</th>
              <SortHeader label="Sq Ft" sortKeyName="sqft" />
              <SortHeader label="$/SF" sortKeyName="rentPerSqft" />
              <SortHeader label="Dist" sortKeyName="distanceMiles" />
              <SortHeader label="Match" sortKeyName="similarityScore" className="w-28" />
              <th className="px-3 py-3 w-10"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-walnut/5 dark:divide-gold/5">
            {visibleResults.map((comp) => (
              <tr
                key={comp.id}
                onClick={() => onPropertyClick?.(comp)}
                className={cn('transition-all cursor-pointer', comp.selected ? 'bg-burgundy/5 dark:bg-gold/10' : 'hover:bg-walnut/5 dark:hover:bg-cream/5')}
              >
                <td className="px-3 py-3">
                  <button onClick={(e) => { e.stopPropagation(); onToggleSelect(comp.id); }}
                    className={cn('w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                      comp.selected ? 'bg-burgundy dark:bg-gold border-burgundy dark:border-gold' : 'border-walnut/30 dark:border-gold/30 hover:border-burgundy dark:hover:border-gold')}>
                    {comp.selected && (
                      <svg className="w-3 h-3 text-cream" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                </td>
                <td className="px-3 py-3">
                  <div className="text-sm font-medium text-charcoal dark:text-cream">{comp.address}</div>
                  <div className="text-xs text-walnut/70 dark:text-cream/50">{comp.city}, {comp.state} {comp.zip}</div>
                </td>
                <td className="px-3 py-3"><StatusBadge status={comp.status} /></td>
                <td className="px-3 py-3 text-sm text-walnut dark:text-cream/70 whitespace-nowrap">
                  {formatDate(comp.leaseDate || comp.listDate)}
                </td>
                <td className="px-3 py-3 text-sm font-semibold text-charcoal dark:text-cream whitespace-nowrap">
                  {formatCurrency(comp.rentPrice)}<span className="text-xs text-walnut/50 dark:text-cream/30">/mo</span>
                </td>
                <td className="px-3 py-3 text-sm text-walnut dark:text-cream/70 whitespace-nowrap">{comp.bedrooms} / {comp.bathrooms}</td>
                <td className="px-3 py-3 text-sm text-walnut dark:text-cream/70 whitespace-nowrap">{comp.sqft.toLocaleString()}</td>
                <td className="px-3 py-3 text-sm text-walnut dark:text-cream/70 whitespace-nowrap">${comp.rentPerSqft}</td>
                <td className="px-3 py-3 text-sm text-walnut dark:text-cream/70 whitespace-nowrap">{comp.distanceMiles.toFixed(2)} mi</td>
                <td className="px-3 py-3"><SimilarityBadge score={comp.similarityScore} /></td>
                <td className="px-3 py-3">
                  {onPropertyClick && (
                    <button onClick={(e) => { e.stopPropagation(); onPropertyClick(comp); }}
                      className="p-1.5 rounded-lg text-walnut/50 dark:text-cream/30 hover:text-burgundy dark:hover:text-gold hover:bg-burgundy/5 dark:hover:bg-gold/10 transition-colors"
                      title="View details">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {visibleResults.map((comp) => (
          <div
            key={comp.id}
            onClick={() => onPropertyClick?.(comp)}
            className={cn('card-premium rounded-xl p-4 transition-all cursor-pointer', comp.selected && 'ring-2 ring-burgundy dark:ring-gold')}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-3">
                <button onClick={(e) => { e.stopPropagation(); onToggleSelect(comp.id); }}
                  className={cn('w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 transition-all flex-shrink-0',
                    comp.selected ? 'bg-burgundy dark:bg-gold border-burgundy dark:border-gold' : 'border-walnut/30 dark:border-gold/30')}>
                  {comp.selected && (
                    <svg className="w-3 h-3 text-cream" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <div>
                  <div className="font-medium text-charcoal dark:text-cream">{comp.address}</div>
                  <div className="text-sm text-walnut/70 dark:text-cream/50">{comp.city}, {comp.state}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-display font-bold text-charcoal dark:text-cream">{formatCurrency(comp.rentPrice)}<span className="text-xs font-normal text-walnut/50">/mo</span></div>
                <StatusBadge status={comp.status} />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-sm border-t border-walnut/10 dark:border-gold/10 pt-3">
              <div>
                <div className="text-walnut/60 dark:text-cream/40 text-xs">Bed/Bath</div>
                <div className="font-medium text-charcoal dark:text-cream">{comp.bedrooms}/{comp.bathrooms}</div>
              </div>
              <div>
                <div className="text-walnut/60 dark:text-cream/40 text-xs">Sq Ft</div>
                <div className="font-medium text-charcoal dark:text-cream">{comp.sqft.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-walnut/60 dark:text-cream/40 text-xs">$/SF</div>
                <div className="font-medium text-charcoal dark:text-cream">${comp.rentPerSqft}</div>
              </div>
              <div>
                <div className="text-walnut/60 dark:text-cream/40 text-xs">Dist</div>
                <div className="font-medium text-charcoal dark:text-cream">{comp.distanceMiles.toFixed(1)} mi</div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-walnut/10 dark:border-gold/10">
              <div className="flex items-center gap-2">
                <span className="text-xs text-walnut/60 dark:text-cream/40">Match</span>
                <SimilarityBadge score={comp.similarityScore} />
              </div>
              {onPropertyClick && (
                <button onClick={(e) => { e.stopPropagation(); onPropertyClick(comp); }}
                  className="text-xs font-medium text-burgundy dark:text-gold hover:text-burgundy-dark dark:hover:text-gold-light">
                  View Details
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* See More / See Less */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-burgundy dark:text-gold hover:bg-burgundy/5 dark:hover:bg-gold/10 transition-colors border border-walnut/15 dark:border-gold/20"
          >
            {showAll ? (
              <>
                Show Less
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
              </>
            ) : (
              <>
                See All {sortedResults.length} Properties
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
