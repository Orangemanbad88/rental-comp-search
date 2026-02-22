'use client';

import dynamic from 'next/dynamic';
import { RentalCompResult, SubjectProperty } from '@/types/property';

interface MapViewProps {
  subject: SubjectProperty;
  comps: RentalCompResult[];
  selectedComps: RentalCompResult[];
  onToggleSelect: (id: string) => void;
}

const MapContent = dynamic(() => import('./MapContent'), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-cream-dark dark:bg-[#1a1a24] rounded-xl flex items-center justify-center border border-walnut/10 dark:border-gold/10">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-walnut/20 dark:border-gold/20 border-t-burgundy dark:border-t-gold mb-2"></div>
        <p className="text-walnut dark:text-cream/60 text-sm">Loading map...</p>
      </div>
    </div>
  ),
});

export function MapView({ subject, comps, selectedComps, onToggleSelect }: MapViewProps) {
  return (
    <div className="card-premium rounded-xl overflow-hidden">
      <div className="wood-grain px-6 py-4 border-b border-walnut-dark/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-gold-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h2 className="font-display text-xl font-semibold text-cream">Location Map</h2>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-burgundy dark:bg-gold rounded-full shadow"></div>
            <span className="text-cream/70">Subject</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
            <span className="text-cream/70">Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
            <span className="text-cream/70">Active</span>
          </div>
        </div>
      </div>
      <div className="p-4 bg-gradient-to-b from-ivory to-cream dark:from-[#1E293B] dark:to-[#1E293B]">
        <MapContent subject={subject} comps={comps} selectedComps={selectedComps} onToggleSelect={onToggleSelect} />
      </div>
    </div>
  );
}
