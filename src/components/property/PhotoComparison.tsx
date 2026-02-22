'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { RentalCompResult, SubjectProperty } from '@/types/property';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface PhotoComparisonProps {
  subject: SubjectProperty;
  selectedComps: RentalCompResult[];
  activeCompId?: string | null;
  onActiveCompChange?: (id: string) => void;
}

function PhotoPanel({
  title,
  photos,
  details,
  price,
  label,
  labelClass,
}: {
  title: string;
  photos: string[];
  details: string;
  price?: string;
  label: string;
  labelClass: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setCurrentIndex(0);
    setImageError(false);
  }, [photos]);

  const goNext = () => { setCurrentIndex((prev) => (prev + 1) % photos.length); setImageError(false); };
  const goPrev = () => { setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length); setImageError(false); };

  return (
    <div className="flex-1 min-w-0">
      <div className={cn('px-4 py-2 text-xs font-bold uppercase tracking-wider text-center', labelClass)}>
        {label}
      </div>

      <div className="relative aspect-[4/3] bg-cream-dark dark:bg-[#1E293B]">
        {photos.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-walnut/40 dark:text-cream/30">
              <svg className="mx-auto h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mt-1 text-xs">No photo</p>
            </div>
          </div>
        ) : imageError ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-walnut/40 dark:text-cream/30">
              <svg className="mx-auto h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mt-1 text-xs">No photo</p>
            </div>
          </div>
        ) : (
          <Image
            src={photos[currentIndex]}
            alt={title}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            unoptimized
          />
        )}

        {photos.length > 1 && !imageError && (
          <>
            <button onClick={goPrev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-charcoal/60 hover:bg-charcoal/80 text-cream rounded-full p-2.5 transition-colors backdrop-blur-sm">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={goNext} className="absolute right-2 top-1/2 -translate-y-1/2 bg-charcoal/60 hover:bg-charcoal/80 text-cream rounded-full p-2.5 transition-colors backdrop-blur-sm">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </>
        )}

        {photos.length > 1 && (
          <div className="absolute top-2 right-2 bg-charcoal/60 backdrop-blur-sm text-cream text-[10px] font-medium px-1.5 py-0.5 rounded">
            {currentIndex + 1} / {photos.length}
          </div>
        )}
      </div>

      {photos.length > 1 && (
        <div className="flex gap-1.5 p-2 overflow-x-auto bg-cream-dark dark:bg-[#0F172A]">
          {photos.map((photo, idx) => (
            <button
              key={idx}
              onClick={() => { setCurrentIndex(idx); setImageError(false); }}
              className={cn(
                'relative flex-shrink-0 w-12 h-9 rounded overflow-hidden transition-all',
                idx === currentIndex ? 'ring-2 ring-gold opacity-100' : 'opacity-50 hover:opacity-80'
              )}
            >
              <Image src={photo} alt={`Thumb ${idx + 1}`} fill className="object-cover" unoptimized />
            </button>
          ))}
        </div>
      )}

      <div className="p-4 bg-ivory dark:bg-[#1E293B]">
        <h4 className="font-semibold text-charcoal dark:text-cream text-sm truncate">{title}</h4>
        <p className="text-xs text-walnut/60 dark:text-cream/40 mt-0.5">{details}</p>
        {price && <p className="text-sm font-bold text-burgundy dark:text-gold mt-1.5">{price}</p>}
      </div>
    </div>
  );
}

export function PhotoComparison({ subject, selectedComps, activeCompId, onActiveCompChange }: PhotoComparisonProps) {
  if (selectedComps.length === 0) return null;

  const activeComp = selectedComps.find(c => c.id === activeCompId) || selectedComps[0];

  const subjectPhotos = subject.photos?.length ? subject.photos : [];
  const compPhotos = activeComp.photos?.length ? activeComp.photos : [];

  return (
    <div className="card-premium rounded-xl overflow-hidden">
      <div className="wood-grain px-6 py-4 border-b border-walnut-dark/50">
        <div className="flex items-center gap-3 mb-3">
          <svg className="w-5 h-5 text-gold-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h2 className="font-display text-xl font-semibold text-cream">Side-by-Side Comparison</h2>
        </div>

        {selectedComps.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {selectedComps.map((comp) => (
              <button
                key={comp.id}
                onClick={() => onActiveCompChange?.(comp.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                  comp.id === activeComp.id
                    ? 'bg-burgundy dark:bg-gold text-cream dark:text-charcoal shadow-md'
                    : 'bg-walnut/5 dark:bg-gold/5 text-walnut dark:text-cream/60 hover:bg-walnut/10 dark:hover:bg-gold/10'
                )}
              >
                {comp.address.split(',')[0]}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row bg-gradient-to-b from-ivory to-cream dark:from-[#1E293B] dark:to-[#1E293B]">
        <PhotoPanel
          key="subject"
          title={subject.address || 'Subject Property'}
          photos={subjectPhotos}
          details={`${subject.bedrooms}bd · ${subject.bathrooms}ba · ${subject.sqft.toLocaleString()} sf`}
          label="Subject"
          labelClass="bg-burgundy dark:bg-gold text-cream dark:text-charcoal"
        />
        <div className="w-px bg-walnut/10 dark:bg-gold/10 hidden sm:block" />
        <div className="h-px bg-walnut/10 dark:bg-gold/10 sm:hidden" />
        <PhotoPanel
          key={activeComp.id}
          title={activeComp.address}
          photos={compPhotos}
          details={`${activeComp.bedrooms}bd · ${activeComp.bathrooms}ba · ${activeComp.sqft.toLocaleString()} sf`}
          price={`${formatCurrency(activeComp.rentPrice)}/mo`}
          label="Comparable"
          labelClass="bg-walnut/10 dark:bg-gold/10 text-walnut dark:text-cream/70"
        />
      </div>
    </div>
  );
}
