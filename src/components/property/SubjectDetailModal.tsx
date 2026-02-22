'use client';

import { useState } from 'react';
import Image from 'next/image';
import { SubjectProperty } from '@/types/property';
import { cn } from '@/lib/utils';

interface SubjectDetailModalProps {
  subject: SubjectProperty | null;
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_PHOTOS = ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop'];

export function SubjectDetailModal({ subject, isOpen, onClose }: SubjectDetailModalProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  if (!isOpen || !subject) return null;

  const photos = subject.photos?.length ? subject.photos : DEFAULT_PHOTOS;
  const handleBackdropClick = (e: React.MouseEvent) => { if (e.target === e.currentTarget) onClose(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/70 backdrop-blur-sm" onClick={handleBackdropClick}>
      <div className="bg-cream dark:bg-[#0F172A] rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-walnut/10 dark:border-gold/20">
        <div className="flex items-center justify-between px-6 py-4 border-b border-walnut-dark/50 wood-grain">
          <div className="flex items-center gap-3">
            <div className="bg-gold text-walnut-dark text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md">Subject</div>
            <div>
              <h2 className="font-display text-xl font-bold text-cream">{subject.address}</h2>
              <p className="text-sm text-cream/50">{subject.city}, {subject.state} {subject.zip}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-walnut-dark/50 transition-colors">
            <svg className="w-6 h-6 text-gold-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="relative aspect-[16/9] bg-cream-dark dark:bg-[#1E293B]">
            {imageError ? (
              <div className="absolute inset-0 flex items-center justify-center text-walnut/40 dark:text-cream/30">
                <p>No photo available</p>
              </div>
            ) : (
              <Image src={photos[currentPhotoIndex]} alt={subject.address} fill className="object-cover" onError={() => setImageError(true)} unoptimized />
            )}
          </div>

          <div className="p-6 space-y-6 bg-gradient-to-b from-ivory to-cream dark:from-[#1E293B] dark:to-[#1E293B]">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                [subject.bedrooms, 'Bedrooms'], [subject.bathrooms, 'Bathrooms'],
                [subject.sqft.toLocaleString(), 'Sq Ft'], [subject.yearBuilt, 'Year Built'],
              ].map(([val, label]) => (
                <div key={label as string} className="bg-burgundy/5 dark:bg-gold/5 border border-burgundy/10 dark:border-gold/10 rounded-xl p-4 text-center">
                  <p className="font-display text-2xl font-bold text-charcoal dark:text-cream">{val}</p>
                  <p className="text-sm text-walnut/60 dark:text-cream/40">{label}</p>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-walnut/10 dark:border-gold/10">
              <h3 className="text-sm font-semibold text-charcoal dark:text-cream mb-3">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  [subject.furnished, 'Furnished'], [subject.petsAllowed, 'Pets OK'],
                  [subject.hasWasherDryer, 'W/D'], [subject.hasPool, 'Pool'],
                  [subject.utilitiesIncluded, 'Utils Incl.'],
                  [subject.parkingSpaces > 0, `${subject.parkingSpaces} Parking`],
                  [subject.garageSpaces > 0, `${subject.garageSpaces} Garage`],
                ].map(([has, label]) => (
                  <span key={label as string} className={cn('text-xs px-2.5 py-1 rounded-full border font-medium',
                    has ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30'
                      : 'bg-walnut/5 text-walnut/40 border-walnut/10 dark:bg-cream/5 dark:text-cream/30 dark:border-gold/10')}>
                    {has ? '✓' : '✗'} {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-walnut/10 dark:border-gold/10">
              <div className="flex justify-between">
                <span className="text-walnut/60 dark:text-cream/40">Property Type</span>
                <span className="font-semibold text-charcoal dark:text-cream">{subject.propertyType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-walnut/60 dark:text-cream/40">Location</span>
                <span className="font-semibold text-charcoal dark:text-cream">{subject.city}, {subject.state}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
