'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { RentalCompResult } from '@/types/property';

interface ListingsMapViewProps {
  listings: RentalCompResult[];
  onListingClick: (listing: RentalCompResult) => void;
}

const ListingsMapContent = dynamic(() => import('./ListingsMapContent'), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-cream-dark dark:bg-[#1E293B] rounded-xl flex items-center justify-center border border-walnut/10 dark:border-gold/10">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-walnut/20 dark:border-gold/20 border-t-burgundy dark:border-t-gold mb-2"></div>
        <p className="text-walnut dark:text-cream/60 text-sm">Loading listings map...</p>
      </div>
    </div>
  ),
});

export function ListingsMapView({ listings, onListingClick }: ListingsMapViewProps) {
  const [expanded, setExpanded] = useState(false);

  const handleListingClick = (listing: RentalCompResult) => {
    setExpanded(false);
    onListingClick(listing);
  };

  if (expanded) {
    return (
      <>
        {/* Compact card stays in sidebar (collapsed placeholder) */}
        <CompactCard onExpand={() => setExpanded(true)} />
        {/* Fullscreen overlay */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setExpanded(false)} />
          <div className="relative w-full max-w-6xl h-[80vh] card-premium rounded-xl overflow-hidden flex flex-col">
            <div className="wood-grain px-6 py-4 border-b border-walnut-dark/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gold-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <h2 className="font-display text-xl font-semibold text-cream">Listings Map</h2>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-teal-400 rounded-full border border-teal-600"></div>
                  <span className="text-cream/70">Active</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-slate-300 rounded-full border border-slate-400"></div>
                  <span className="text-cream/70">Leased</span>
                </div>
                <span className="text-cream/50">Click marker to use as subject</span>
                <button
                  onClick={() => setExpanded(false)}
                  className="ml-2 p-1.5 rounded-lg hover:bg-walnut-dark/50 transition-colors text-cream/70"
                  title="Close"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 p-4 bg-gradient-to-b from-ivory to-cream dark:from-[#1E293B] dark:to-[#1E293B]">
              <ListingsMapContent listings={listings} onListingClick={handleListingClick} />
            </div>
          </div>
        </div>
      </>
    );
  }

  return <CompactCard onExpand={() => setExpanded(true)} listings={listings} onListingClick={handleListingClick} />;
}

function CompactCard({ onExpand, listings, onListingClick }: {
  onExpand: () => void;
  listings?: RentalCompResult[];
  onListingClick?: (listing: RentalCompResult) => void;
}) {
  return (
    <div className="card-premium rounded-xl overflow-hidden">
      <div className="wood-grain px-4 py-3 border-b border-walnut-dark/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gold-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <h2 className="font-display text-sm font-semibold text-cream">Listings Map</h2>
        </div>
        <button
          onClick={onExpand}
          className="p-1.5 rounded-lg hover:bg-walnut-dark/50 transition-colors text-cream/70"
          title="Enlarge map"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
          </svg>
        </button>
      </div>
      {listings && onListingClick && (
        <div className="h-[250px] bg-gradient-to-b from-ivory to-cream dark:from-[#1E293B] dark:to-[#1E293B]">
          <ListingsMapContent listings={listings} onListingClick={onListingClick} />
        </div>
      )}
    </div>
  );
}
