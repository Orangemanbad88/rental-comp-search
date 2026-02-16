'use client';

import { useState } from 'react';
import Image from 'next/image';
import { RentalCompResult, SubjectProperty } from '@/types/property';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

interface PropertyDetailModalProps {
  property: RentalCompResult | null;
  subject: SubjectProperty | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleSelect: (id: string) => void;
}

export function PropertyDetailModal({ property, subject, isOpen, onClose, onToggleSelect }: PropertyDetailModalProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  if (!isOpen || !property) return null;

  const photos = property.photos?.length ? property.photos : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop'];

  const handleBackdropClick = (e: React.MouseEvent) => { if (e.target === e.currentTarget) onClose(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/70 backdrop-blur-sm" onClick={handleBackdropClick}>
      <div className="bg-cream dark:bg-[#0F172A] rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-walnut/10 dark:border-gold/20">
        <div className="flex items-center justify-between px-6 py-4 border-b border-walnut/10 dark:border-gold/10 bg-gradient-to-r from-cream to-ivory dark:from-[#1E293B] dark:to-[#1E293B]">
          <div>
            <h2 className="font-display text-xl font-bold text-charcoal dark:text-cream">{property.address}</h2>
            <p className="text-sm text-walnut/60 dark:text-cream/40">{property.city}, {property.state} {property.zip}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-walnut/10 dark:hover:bg-gold/10 transition-colors">
            <svg className="w-6 h-6 text-walnut dark:text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Photo */}
          <div className="relative aspect-[16/9] bg-cream-dark dark:bg-[#1E293B]">
            {imageError ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-walnut/40 dark:text-cream/30">
                  <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2">No photo available</p>
                </div>
              </div>
            ) : (
              <Image src={photos[currentPhotoIndex]} alt={property.address} fill className="object-cover" onError={() => setImageError(true)} unoptimized />
            )}
          </div>

          <div className="p-6 space-y-6 bg-gradient-to-b from-ivory to-cream dark:from-[#1E293B] dark:to-[#1E293B]">
            {/* Side-by-Side Comparison */}
            {subject && (
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
                    <CompRow label="Address" subjectVal={subject.address} compVal={property.address} />
                    <CompRow
                      label="Rent"
                      subjectVal="—"
                      compVal={`${formatCurrency(property.rentPrice)}/mo`}
                    />
                    <CompRow
                      label="Bedrooms"
                      subjectVal={String(subject.bedrooms)}
                      compVal={String(property.bedrooms)}
                      diff={property.bedrooms - subject.bedrooms}
                    />
                    <CompRow
                      label="Bathrooms"
                      subjectVal={String(subject.bathrooms)}
                      compVal={String(property.bathrooms)}
                      diff={property.bathrooms - subject.bathrooms}
                    />
                    <CompRow
                      label="Sq Ft"
                      subjectVal={subject.sqft.toLocaleString()}
                      compVal={property.sqft.toLocaleString()}
                      diff={property.sqft - subject.sqft}
                      format="number"
                    />
                    <CompRow
                      label="$/Sq Ft"
                      subjectVal="—"
                      compVal={`$${property.rentPerSqft}/mo`}
                    />
                    <CompRow
                      label="Year Built"
                      subjectVal={String(subject.yearBuilt)}
                      compVal={String(property.yearBuilt)}
                      diff={property.yearBuilt - subject.yearBuilt}
                      suffix=" yrs"
                    />
                    <CompRow
                      label="Type"
                      subjectVal={subject.propertyType}
                      compVal={property.propertyType}
                    />
                    <CompRow
                      label="Status"
                      subjectVal="—"
                      compVal={property.status}
                    />
                    <CompRow
                      label="Lease Term"
                      subjectVal="—"
                      compVal={property.leaseTerm}
                    />
                    <CompRow
                      label="Distance"
                      subjectVal="—"
                      compVal={`${property.distanceMiles.toFixed(2)} mi`}
                    />
                    <CompRow
                      label="DOM"
                      subjectVal="—"
                      compVal={String(property.daysOnMarket)}
                    />
                  </tbody>
                </table>
              </div>
            )}

            {/* Amenities Comparison */}
            {subject && (
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
                    <AmenityRow label="Furnished" subjectHas={subject.furnished} compHas={property.furnished} />
                    <AmenityRow label="Pets Allowed" subjectHas={subject.petsAllowed} compHas={property.petsAllowed} />
                    <AmenityRow label="Washer/Dryer" subjectHas={subject.hasWasherDryer} compHas={property.hasWasherDryer} />
                    <AmenityRow label="Pool" subjectHas={subject.hasPool} compHas={property.hasPool} />
                    <AmenityRow label="Utils Included" subjectHas={subject.utilitiesIncluded} compHas={property.utilitiesIncluded} />
                    <tr className="hover:bg-walnut/3 dark:hover:bg-gold/3">
                      <td className="px-4 py-2 text-walnut/60 dark:text-cream/40">Parking</td>
                      <td className="px-4 py-2 text-center font-medium text-burgundy/80 dark:text-gold/80">{subject.parkingSpaces ?? 0}</td>
                      <td className="px-4 py-2 text-center font-medium text-charcoal dark:text-cream">{property.parkingSpaces}</td>
                    </tr>
                    <tr className="hover:bg-walnut/3 dark:hover:bg-gold/3">
                      <td className="px-4 py-2 text-walnut/60 dark:text-cream/40">Garage</td>
                      <td className="px-4 py-2 text-center font-medium text-burgundy/80 dark:text-gold/80">{subject.garageSpaces ?? 0}</td>
                      <td className="px-4 py-2 text-center font-medium text-charcoal dark:text-cream">{property.garageSpaces}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Match Score + Status */}
            <div className="flex items-center justify-between">
              <div className={cn('px-3 py-1.5 rounded-lg text-sm font-semibold border',
                property.status === 'Leased' && 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30',
                property.status === 'Active' && 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30',
                property.status === 'Pending' && 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30',
              )}>
                {property.status}
              </div>
              <div className={cn('px-4 py-2 rounded-xl text-center border',
                property.similarityScore >= 80 && 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/30',
                property.similarityScore >= 60 && property.similarityScore < 80 && 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/30',
                property.similarityScore < 60 && 'bg-walnut/5 dark:bg-cream/5 border-walnut/10 dark:border-gold/10'
              )}>
                <p className="text-xs text-walnut/60 dark:text-cream/40">Match</p>
                <p className={cn('text-2xl font-bold',
                  property.similarityScore >= 80 && 'text-emerald-600 dark:text-emerald-400',
                  property.similarityScore >= 60 && property.similarityScore < 80 && 'text-amber-600 dark:text-amber-400',
                  property.similarityScore < 60 && 'text-walnut dark:text-cream/60'
                )}>{property.similarityScore}</p>
              </div>
            </div>

            {/* Action */}
            <button onClick={() => onToggleSelect(property.id)}
              className={cn('w-full py-3 rounded-xl font-semibold transition-all duration-200',
                property.selected
                  ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 dark:border-red-800/30'
                  : 'bg-gradient-to-r from-burgundy to-burgundy-dark text-cream hover:from-burgundy-dark hover:to-burgundy shadow-lg shadow-burgundy/20 dark:from-gold dark:to-gold-muted dark:text-charcoal dark:shadow-gold/20')}>
              {property.selected ? 'Remove from Selection' : 'Add to Selection'}
            </button>
          </div>
        </div>
      </div>
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
