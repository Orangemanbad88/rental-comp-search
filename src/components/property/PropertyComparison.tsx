'use client';

import { useRef, useEffect } from 'react';
import Image from 'next/image';
import { RentalCompResult, SubjectProperty } from '@/types/property';
import { formatCurrency, cn } from '@/lib/utils';

interface PropertyComparisonProps {
  subject: SubjectProperty;
  comp: RentalCompResult;
  onClose: () => void;
  onToggleSelect: (id: string) => void;
}

export const PropertyComparison = ({ subject, comp, onClose, onToggleSelect }: PropertyComparisonProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [comp.id]);

  const subjectPhoto = subject.photos?.[0];
  const compPhoto = comp.photos?.[0];

  const scoreBg = comp.similarityScore >= 80
    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/30'
    : comp.similarityScore >= 60
      ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/30'
      : 'bg-walnut/5 dark:bg-cream/5 border-walnut/10 dark:border-gold/10';

  const scoreColor = comp.similarityScore >= 80
    ? 'text-emerald-600 dark:text-emerald-400'
    : comp.similarityScore >= 60
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-walnut dark:text-cream/60';

  return (
    <div ref={containerRef} className="card-premium rounded-xl overflow-hidden">
      {/* Header */}
      <div className="wood-grain px-6 py-4 border-b border-walnut-dark/50 flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-cream flex items-center gap-3">
          <svg className="w-5 h-5 text-gold-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Subject vs Comparable
        </h2>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-walnut-dark/50 transition-colors">
          <svg className="w-5 h-5 text-gold-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-6 bg-gradient-to-b from-ivory to-cream dark:from-[#1E293B] dark:to-[#1E293B] space-y-6">
        {/* Two-column property cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Subject Card */}
          <div className="rounded-xl border border-burgundy/20 dark:border-gold/20 overflow-hidden">
            <div className="relative aspect-[16/10] bg-cream-dark dark:bg-[#1E293B]">
              {subjectPhoto ? (
                <Image src={subjectPhoto} alt={subject.address} fill className="object-cover" unoptimized />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-walnut/30 dark:text-cream/20">
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
              )}
              <div className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-burgundy dark:bg-gold text-cream dark:text-charcoal text-xs font-semibold uppercase tracking-wider">
                Subject
              </div>
            </div>
            <div className="p-4 bg-cream dark:bg-[#0F172A]">
              <h3 className="font-display font-semibold text-charcoal dark:text-cream truncate">{subject.address}</h3>
              <p className="text-sm text-walnut/60 dark:text-cream/40">{subject.city}, {subject.state} {subject.zip}</p>
              <div className="grid grid-cols-4 gap-3 mt-3">
                <StatBox label="Beds" value={String(subject.bedrooms)} />
                <StatBox label="Baths" value={String(subject.bathrooms)} />
                <StatBox label="Sqft" value={subject.sqft.toLocaleString()} />
                <StatBox label="Year" value={String(subject.yearBuilt)} />
              </div>
            </div>
          </div>

          {/* Comp Card */}
          <div className="rounded-xl border border-walnut/10 dark:border-gold/10 overflow-hidden">
            <div className="relative aspect-[16/10] bg-cream-dark dark:bg-[#1E293B]">
              {compPhoto ? (
                <Image src={compPhoto} alt={comp.address} fill className="object-cover" unoptimized />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-walnut/30 dark:text-cream/20">
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
              )}
              <div className={cn('absolute top-3 left-3 px-3 py-1 rounded-lg border text-xs font-bold', scoreBg, scoreColor)}>
                {comp.similarityScore} Match
              </div>
            </div>
            <div className="p-4 bg-cream dark:bg-[#0F172A]">
              <h3 className="font-display font-semibold text-charcoal dark:text-cream truncate">{comp.address}</h3>
              <p className="text-sm text-walnut/60 dark:text-cream/40">{comp.city}, {comp.state} {comp.zip}</p>
              <div className="grid grid-cols-4 gap-3 mt-3">
                <StatBox label="Beds" value={String(comp.bedrooms)} />
                <StatBox label="Baths" value={String(comp.bathrooms)} />
                <StatBox label="Sqft" value={comp.sqft.toLocaleString()} />
                <StatBox label="Year" value={String(comp.yearBuilt)} />
              </div>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="rounded-xl border border-walnut/10 dark:border-gold/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-walnut/5 dark:bg-gold/5">
                <th className="text-left px-4 py-2.5 text-walnut/60 dark:text-cream/40 font-medium w-1/4">Metric</th>
                <th className="text-right px-4 py-2.5 text-burgundy dark:text-gold font-semibold w-1/4">Subject</th>
                <th className="text-right px-4 py-2.5 text-charcoal dark:text-cream font-semibold w-1/4">Comp</th>
                <th className="text-right px-4 py-2.5 text-walnut/60 dark:text-cream/40 font-medium w-1/4">Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-walnut/5 dark:divide-gold/5">
              <CompRow label="Address" subjectVal={subject.address} compVal={comp.address} />
              <CompRow label="Rent" subjectVal="—" compVal={`${formatCurrency(comp.rentPrice)}/mo`} />
              <CompRow label="Bedrooms" subjectVal={String(subject.bedrooms)} compVal={String(comp.bedrooms)} diff={comp.bedrooms - subject.bedrooms} />
              <CompRow label="Bathrooms" subjectVal={String(subject.bathrooms)} compVal={String(comp.bathrooms)} diff={comp.bathrooms - subject.bathrooms} />
              <CompRow label="Sq Ft" subjectVal={subject.sqft.toLocaleString()} compVal={comp.sqft.toLocaleString()} diff={comp.sqft - subject.sqft} format="number" />
              <CompRow label="$/Sq Ft" subjectVal="—" compVal={`$${comp.rentPerSqft}/mo`} />
              <CompRow label="Year Built" subjectVal={String(subject.yearBuilt)} compVal={String(comp.yearBuilt)} diff={comp.yearBuilt - subject.yearBuilt} suffix=" yrs" />
              <CompRow label="Type" subjectVal={subject.propertyType} compVal={comp.propertyType} />
              <CompRow label="Status" subjectVal="—" compVal={comp.status} />
              <CompRow label="Lease Term" subjectVal="—" compVal={comp.leaseTerm} />
              <CompRow label="Distance" subjectVal="—" compVal={`${comp.distanceMiles.toFixed(2)} mi`} />
              <CompRow label="DOM" subjectVal="—" compVal={String(comp.daysOnMarket)} />
            </tbody>
          </table>
        </div>

        {/* Amenities Comparison */}
        <div className="rounded-xl border border-walnut/10 dark:border-gold/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-walnut/5 dark:bg-gold/5">
                <th className="text-left px-4 py-2.5 text-walnut/60 dark:text-cream/40 font-medium">Amenity</th>
                <th className="text-center px-4 py-2.5 text-burgundy dark:text-gold font-semibold">Subject</th>
                <th className="text-center px-4 py-2.5 text-charcoal dark:text-cream font-semibold">Comp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-walnut/5 dark:divide-gold/5">
              <AmenityRow label="Furnished" subjectHas={subject.furnished} compHas={comp.furnished} />
              <AmenityRow label="Pets Allowed" subjectHas={subject.petsAllowed} compHas={comp.petsAllowed} />
              <AmenityRow label="Washer/Dryer" subjectHas={subject.hasWasherDryer} compHas={comp.hasWasherDryer} />
              <AmenityRow label="Pool" subjectHas={subject.hasPool} compHas={comp.hasPool} />
              <AmenityRow label="Utils Included" subjectHas={subject.utilitiesIncluded} compHas={comp.utilitiesIncluded} />
              <tr className="hover:bg-walnut/3 dark:hover:bg-gold/3">
                <td className="px-4 py-2 text-walnut/60 dark:text-cream/40">Parking</td>
                <td className="px-4 py-2 text-center font-medium text-burgundy/80 dark:text-gold/80">{subject.parkingSpaces ?? 0}</td>
                <td className="px-4 py-2 text-center font-medium text-charcoal dark:text-cream">{comp.parkingSpaces}</td>
              </tr>
              <tr className="hover:bg-walnut/3 dark:hover:bg-gold/3">
                <td className="px-4 py-2 text-walnut/60 dark:text-cream/40">Garage</td>
                <td className="px-4 py-2 text-center font-medium text-burgundy/80 dark:text-gold/80">{subject.garageSpaces ?? 0}</td>
                <td className="px-4 py-2 text-center font-medium text-charcoal dark:text-cream">{comp.garageSpaces}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Action Button */}
        <button
          onClick={() => onToggleSelect(comp.id)}
          className={cn(
            'w-full py-3 rounded-xl font-semibold transition-all duration-200',
            comp.selected
              ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 dark:border-red-800/30'
              : 'bg-gradient-to-r from-burgundy to-burgundy-dark text-cream hover:from-burgundy-dark hover:to-burgundy shadow-lg shadow-burgundy/20 dark:from-gold dark:to-gold-muted dark:text-charcoal dark:shadow-gold/20'
          )}
        >
          {comp.selected ? 'Remove from Selection' : 'Add to Selection'}
        </button>
      </div>
    </div>
  );
};

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-2 rounded-lg bg-walnut/5 dark:bg-gold/5">
      <p className="text-[10px] text-walnut/50 dark:text-cream/30 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-charcoal dark:text-cream">{value}</p>
    </div>
  );
}

function CompRow({ label, subjectVal, compVal, diff, format, suffix = '' }: {
  label: string;
  subjectVal: string;
  compVal: string;
  diff?: number;
  format?: 'number';
  suffix?: string;
}) {
  const diffDisplay = diff !== undefined && diff !== 0
    ? `${diff > 0 ? '+' : ''}${format === 'number' ? diff.toLocaleString() : diff}${suffix}`
    : diff === 0 ? '—' : '';

  const diffColor = diff !== undefined && diff !== 0
    ? 'text-charcoal dark:text-cream'
    : 'text-walnut/30 dark:text-cream/20';

  return (
    <tr className="hover:bg-walnut/3 dark:hover:bg-gold/3">
      <td className="px-4 py-2 text-walnut/60 dark:text-cream/40">{label}</td>
      <td className="px-4 py-2 text-right font-medium text-burgundy/80 dark:text-gold/80">{subjectVal}</td>
      <td className="px-4 py-2 text-right font-medium text-charcoal dark:text-cream">{compVal}</td>
      <td className={cn('px-4 py-2 text-right font-medium text-xs', diffColor)}>{diffDisplay}</td>
    </tr>
  );
}

function AmenityRow({ label, subjectHas, compHas }: { label: string; subjectHas?: boolean; compHas: boolean }) {
  const check = (val?: boolean) => val
    ? <span className="text-emerald-600 dark:text-emerald-400">Yes</span>
    : <span className="text-walnut/40 dark:text-cream/30">No</span>;

  return (
    <tr className="hover:bg-walnut/3 dark:hover:bg-gold/3">
      <td className="px-4 py-2 text-walnut/60 dark:text-cream/40">{label}</td>
      <td className="px-4 py-2 text-center font-medium">{check(subjectHas)}</td>
      <td className="px-4 py-2 text-center font-medium">{check(compHas)}</td>
    </tr>
  );
}
