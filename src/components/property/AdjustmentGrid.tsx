'use client';

import { useState, useEffect, useRef } from 'react';
import { RentalCompResult, SubjectProperty } from '@/types/property';
import { formatCurrency, cn } from '@/lib/utils';

interface Adjustment {
  bedroom: number;
  bathroom: number;
  sqft: number;
  condition: number;
  furnished: number;
  parking: number;
  pool: number;
  washerDryer: number;
  pets: number;
  other: number;
}

interface CompAdjustments {
  [compId: string]: Adjustment;
}

interface AdjustmentGridProps {
  selectedComps: RentalCompResult[];
  subject: SubjectProperty;
  onAdjustmentsChange?: (adjustments: CompAdjustments, indicatedRent: number) => void;
}

export type { CompAdjustments, Adjustment };

// Monthly rent adjustment values
const BEDROOM_VALUE = 150;     // $150/mo per bedroom
const BATHROOM_VALUE = 75;     // $75/mo per bathroom
const SQFT_VALUE = 0.50;       // $0.50/sqft/mo
const FURNISHED_VALUE = 200;   // $200/mo for furnished
const PARKING_VALUE = 75;      // $75/mo per parking space
const POOL_VALUE = 100;        // $100/mo for pool
const WASHER_DRYER_VALUE = 75; // $75/mo for W/D
const PETS_VALUE = 50;         // $50/mo for pet-friendly

export function AdjustmentGrid({ selectedComps, subject, onAdjustmentsChange }: AdjustmentGridProps) {
  const [adjustments, setAdjustments] = useState<CompAdjustments>({});
  const [otherInputs, setOtherInputs] = useState<{ [compId: string]: string }>({});

  useEffect(() => {
    setAdjustments((prev) => {
      const newAdj: CompAdjustments = {};
      selectedComps.forEach((comp) => {
        const bedDiff = subject.bedrooms - comp.bedrooms;
        const bathDiff = subject.bathrooms - comp.bathrooms;
        const sqftDiff = subject.sqft - comp.sqft;
        const furnishedDiff = (subject.furnished ? 1 : 0) - (comp.furnished ? 1 : 0);
        const parkingDiff = subject.parkingSpaces - comp.parkingSpaces;
        const poolDiff = (subject.hasPool ? 1 : 0) - (comp.hasPool ? 1 : 0);
        const wdDiff = (subject.hasWasherDryer ? 1 : 0) - (comp.hasWasherDryer ? 1 : 0);
        const petsDiff = (subject.petsAllowed ? 1 : 0) - (comp.petsAllowed ? 1 : 0);

        newAdj[comp.id] = {
          bedroom: bedDiff * BEDROOM_VALUE,
          bathroom: bathDiff * BATHROOM_VALUE,
          sqft: Math.round(sqftDiff * SQFT_VALUE),
          condition: 0,
          furnished: furnishedDiff * FURNISHED_VALUE,
          parking: parkingDiff * PARKING_VALUE,
          pool: poolDiff * POOL_VALUE,
          washerDryer: wdDiff * WASHER_DRYER_VALUE,
          pets: petsDiff * PETS_VALUE,
          other: prev[comp.id]?.other || 0,
        };
      });
      return newAdj;
    });
  }, [selectedComps, subject]);

  const handleOtherChange = (compId: string, value: string) => {
    setOtherInputs({ ...otherInputs, [compId]: value });
    const numValue = parseFloat(value) || 0;
    setAdjustments({
      ...adjustments,
      [compId]: { ...adjustments[compId], other: numValue },
    });
  };

  const getAdjustedRent = (comp: RentalCompResult): number => {
    const adj = adjustments[comp.id];
    if (!adj) return comp.rentPrice;
    return comp.rentPrice + Object.values(adj).reduce((sum, v) => sum + v, 0);
  };

  const getTotalAdjustment = (comp: RentalCompResult): number => {
    const adj = adjustments[comp.id];
    if (!adj) return 0;
    return Object.values(adj).reduce((sum, v) => sum + v, 0);
  };

  const averageAdjustedRent = selectedComps.length > 0
    ? Math.round(selectedComps.reduce((sum, comp) => sum + getAdjustedRent(comp), 0) / selectedComps.length)
    : 0;

  const prevValueRef = useRef<number>(0);

  useEffect(() => {
    if (onAdjustmentsChange && Object.keys(adjustments).length > 0 && prevValueRef.current !== averageAdjustedRent) {
      prevValueRef.current = averageAdjustedRent;
      onAdjustmentsChange(adjustments, averageAdjustedRent);
    }
  }, [adjustments, averageAdjustedRent, onAdjustmentsChange]);

  const formatAdj = (value: number): string => {
    if (value === 0) return '-';
    const sign = value > 0 ? '+' : '';
    return `${sign}$${Math.abs(value)}`;
  };

  const getAdjColor = (value: number): string => {
    if (value > 0) return 'text-emerald-600 dark:text-emerald-400';
    if (value < 0) return 'text-red-600 dark:text-red-400';
    return 'text-walnut/40 dark:text-cream/30';
  };

  if (selectedComps.length === 0) return null;

  const displayedComps = selectedComps.slice(0, 5);
  const hasMore = selectedComps.length > 5;

  return (
    <div className="card-premium rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-walnut/10 dark:border-gold/10 bg-gradient-to-r from-cream to-ivory dark:from-[#1E293B] dark:to-[#1E293B]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-burgundy dark:text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <div>
              <h2 className="font-display text-xl font-semibold text-charcoal dark:text-cream">Rent Adjustments</h2>
              <p className="text-xs text-walnut/60 dark:text-cream/40">Adjust comparable rents to match subject property</p>
            </div>
          </div>
          {hasMore && (
            <span className="text-xs font-medium text-gold bg-gold/10 px-2.5 py-1 rounded-full border border-gold/20">
              Showing 5 of {selectedComps.length}
            </span>
          )}
        </div>
      </div>

      <div className="p-6 bg-gradient-to-b from-ivory to-cream dark:from-[#1E293B] dark:to-[#1E293B]">
        {/* Desktop View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-walnut/10 dark:border-gold/10">
                <th className="text-left py-3 px-2 text-xs font-semibold text-walnut dark:text-gold-light/70 uppercase tracking-wider">Property</th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-walnut dark:text-gold-light/70 uppercase tracking-wider">Rent</th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-walnut dark:text-gold-light/70 uppercase tracking-wider">
                  <div>Bed</div><div className="font-normal normal-case text-walnut/50 dark:text-cream/30">$150/mo</div>
                </th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-walnut dark:text-gold-light/70 uppercase tracking-wider">
                  <div>Bath</div><div className="font-normal normal-case text-walnut/50 dark:text-cream/30">$75/mo</div>
                </th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-walnut dark:text-gold-light/70 uppercase tracking-wider">
                  <div>Sq Ft</div><div className="font-normal normal-case text-walnut/50 dark:text-cream/30">$0.50/sf</div>
                </th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-walnut dark:text-gold-light/70 uppercase tracking-wider">Amenities</th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-walnut dark:text-gold-light/70 uppercase tracking-wider">Other</th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-walnut dark:text-gold-light/70 uppercase tracking-wider">Net Adj.</th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-walnut dark:text-gold-light/70 uppercase tracking-wider">Adjusted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-walnut/5 dark:divide-gold/5">
              {displayedComps.map((comp) => {
                const adj = adjustments[comp.id] || { bedroom: 0, bathroom: 0, sqft: 0, condition: 0, furnished: 0, parking: 0, pool: 0, washerDryer: 0, pets: 0, other: 0 };
                const amenityAdj = adj.furnished + adj.parking + adj.pool + adj.washerDryer + adj.pets;
                const totalAdj = getTotalAdjustment(comp);
                const adjustedRent = getAdjustedRent(comp);

                return (
                  <tr key={comp.id} className="hover:bg-walnut/5 dark:hover:bg-cream/5 transition-colors">
                    <td className="py-3 px-2">
                      <div className="text-sm font-medium text-charcoal dark:text-cream">{comp.address}</div>
                      <div className="text-xs text-walnut/60 dark:text-cream/40">
                        {comp.bedrooms}bd / {comp.bathrooms}ba · {comp.sqft.toLocaleString()} sf
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right text-sm font-semibold text-charcoal dark:text-cream">
                      {formatCurrency(comp.rentPrice)}<span className="text-xs text-walnut/40">/mo</span>
                    </td>
                    <td className={cn('py-3 px-2 text-right text-sm font-medium', getAdjColor(adj.bedroom))}>{formatAdj(adj.bedroom)}</td>
                    <td className={cn('py-3 px-2 text-right text-sm font-medium', getAdjColor(adj.bathroom))}>{formatAdj(adj.bathroom)}</td>
                    <td className={cn('py-3 px-2 text-right text-sm font-medium', getAdjColor(adj.sqft))}>{formatAdj(adj.sqft)}</td>
                    <td className={cn('py-3 px-2 text-right text-sm font-medium', getAdjColor(amenityAdj))}>
                      <div className="group relative">
                        {formatAdj(amenityAdj)}
                        <div className="absolute right-0 top-full mt-1 z-20 hidden group-hover:block bg-charcoal dark:bg-cream text-cream dark:text-charcoal text-xs rounded-lg p-3 shadow-lg whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex justify-between gap-4">
                              <span>Furnished:</span><span className={getAdjColor(adj.furnished)}>{formatAdj(adj.furnished)}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span>Parking:</span><span className={getAdjColor(adj.parking)}>{formatAdj(adj.parking)}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span>Pool:</span><span className={getAdjColor(adj.pool)}>{formatAdj(adj.pool)}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span>W/D:</span><span className={getAdjColor(adj.washerDryer)}>{formatAdj(adj.washerDryer)}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span>Pets:</span><span className={getAdjColor(adj.pets)}>{formatAdj(adj.pets)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <input type="number" value={otherInputs[comp.id] ?? ''} onChange={(e) => handleOtherChange(comp.id, e.target.value)}
                        placeholder="0" className="input-premium w-20 px-2 py-1.5 text-sm text-right rounded-lg" />
                    </td>
                    <td className={cn('py-3 px-2 text-right text-sm font-semibold', getAdjColor(totalAdj))}>{formatAdj(totalAdj)}</td>
                    <td className="py-3 px-2 text-right">
                      <span className="text-sm font-bold text-burgundy dark:text-gold bg-burgundy/5 dark:bg-gold/10 px-2 py-1 rounded-lg">
                        {formatCurrency(adjustedRent)}/mo
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden space-y-4">
          {displayedComps.map((comp) => {
            const adj = adjustments[comp.id] || { bedroom: 0, bathroom: 0, sqft: 0, condition: 0, furnished: 0, parking: 0, pool: 0, washerDryer: 0, pets: 0, other: 0 };
            const totalAdj = getTotalAdjustment(comp);
            const adjustedRent = getAdjustedRent(comp);

            return (
              <div key={comp.id} className="border border-walnut/10 dark:border-gold/10 rounded-xl p-4 bg-ivory dark:bg-[#1E293B]">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-semibold text-charcoal dark:text-cream">{comp.address}</div>
                    <div className="text-xs text-walnut/60 dark:text-cream/40">{comp.bedrooms}bd / {comp.bathrooms}ba · {comp.sqft.toLocaleString()} sf</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-walnut/60 dark:text-cream/40 uppercase tracking-wide">Rent</div>
                    <div className="font-semibold text-charcoal dark:text-cream">{formatCurrency(comp.rentPrice)}/mo</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                  {[
                    ['Bed', adj.bedroom], ['Bath', adj.bathroom], ['Sq Ft', adj.sqft],
                    ['Furn.', adj.furnished], ['Pkg', adj.parking], ['Pool', adj.pool],
                  ].map(([label, val]) => (
                    <div key={label as string} className="flex justify-between bg-walnut/5 dark:bg-cream/5 rounded-lg px-2 py-1.5">
                      <span className="text-walnut/60 dark:text-cream/40">{label}:</span>
                      <span className={cn('font-medium', getAdjColor(val as number))}>{formatAdj(val as number)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm text-walnut/60 dark:text-cream/40">Other:</span>
                  <input type="number" value={otherInputs[comp.id] ?? ''} onChange={(e) => handleOtherChange(comp.id, e.target.value)}
                    placeholder="0" className="input-premium flex-1 px-3 py-1.5 text-sm rounded-lg" />
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-walnut/10 dark:border-gold/10">
                  <div>
                    <span className="text-sm text-walnut/60 dark:text-cream/40">Net: </span>
                    <span className={cn('font-semibold', getAdjColor(totalAdj))}>{formatAdj(totalAdj)}</span>
                  </div>
                  <div className="bg-burgundy/5 dark:bg-gold/10 px-3 py-1.5 rounded-lg border border-burgundy/10 dark:border-gold/20">
                    <span className="text-xs text-burgundy dark:text-gold">Adjusted: </span>
                    <span className="font-bold text-burgundy dark:text-gold">{formatCurrency(adjustedRent)}/mo</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Indicated Market Rent */}
        <div className="mt-8 pt-6 border-t border-walnut/10 dark:border-gold/10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-sm text-walnut dark:text-cream/60">
              Based on {displayedComps.length} adjusted rental comparable{displayedComps.length !== 1 ? 's' : ''}
            </div>
            <div className="leather-texture rounded-xl px-8 py-5 text-center relative overflow-hidden">
              <div className="relative z-10">
                <div className="text-xs font-semibold text-gold-light uppercase tracking-wider mb-1">Indicated Market Rent</div>
                <div className="font-display text-3xl font-bold text-cream">
                  {formatCurrency(averageAdjustedRent)}<span className="text-lg font-normal text-cream/60">/mo</span>
                </div>
                <div className="text-xs text-cream/40 mt-1">
                  Annual: {formatCurrency(averageAdjustedRent * 12)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
