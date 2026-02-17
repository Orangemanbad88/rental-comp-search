'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { SubjectPropertyForm, emptySubject } from '@/components/search/SubjectPropertyForm';
import { SubjectMap } from '@/components/search/SubjectMap';
import { CompResultsTable } from '@/components/property/CompResultsTable';
import { AdjustmentGrid, CompAdjustments } from '@/components/property/AdjustmentGrid';
import { PhotoComparison } from '@/components/property/PhotoComparison';
import { MapView } from '@/components/property/MapView';

import { PropertyDetailModal } from '@/components/property/PropertyDetailModal';
import { SubjectDetailModal } from '@/components/property/SubjectDetailModal';
import { ExportButtons } from '@/components/ui/ExportButtons';
import { ThemeToggle } from '@/components/ThemeProvider';
import { SubjectProperty, SearchCriteria, RentalCompResult } from '@/types/property';
import { getMLSPropertyService } from '@/services/mlsPropertyService';

const propertyService = getMLSPropertyService();

export default function Home() {
  const [results, setResults] = useState<RentalCompResult[]>([]);
  const [allListings, setAllListings] = useState<RentalCompResult[]>([]);
  const [filterText, setFilterText] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [formSubject, setFormSubject] = useState<SubjectProperty>(emptySubject);
  const [subject, setSubject] = useState<SubjectProperty | null>(null);
  const [adjustments, setAdjustments] = useState<CompAdjustments>({});
  const [indicatedRent, setIndicatedRent] = useState<number>(0);
  const [selectedProperty, setSelectedProperty] = useState<RentalCompResult | null>(null);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [initialSubject, setInitialSubject] = useState<SubjectProperty | null>(null);
  const [activeCompId, setActiveCompId] = useState<string | null>(null);
  const comparisonRef = useRef<HTMLDivElement>(null);

  const defaultCriteria: SearchCriteria = {
    radiusMiles: 5, dateRangeMonths: 12, bedVariance: 1, bathVariance: 1,
    sqftVariancePercent: 20, propertyTypeMatch: true, includeActive: true,
  };

  useEffect(() => {
    fetch('/api/listings')
      .then(res => res.json())
      .then((data: RentalCompResult[]) => {
        setAllListings(data);
        setIsLoadingListings(false);
      })
      .catch(err => {
        console.error('Failed to load listings:', err);
        setIsLoadingListings(false);
      });

    // No auto-search — wait for user to set a subject
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Map click → update form + auto-search
  const handleMapLocationSelect = (updates: Partial<SubjectProperty>) => {
    const updated = { ...formSubject, ...updates };
    setFormSubject(updated);
    setInitialSubject(updated);
    handleSearch(updated, defaultCriteria);
  };

  const filteredListings = allListings.filter(listing => {
    if (!filterText.trim()) return true;
    const q = filterText.toLowerCase();
    return listing.address.toLowerCase().includes(q) || listing.city.toLowerCase().includes(q) || listing.zip.toLowerCase().includes(q);
  });

  const handleSearch = async (subjectProperty: SubjectProperty, _criteria: SearchCriteria) => {
    setIsSearching(true);
    try {
      const comps = await propertyService.searchComps(subjectProperty);
      setResults(comps);
      setSubject(subjectProperty);
      setInitialSubject(subjectProperty);
      setHasSearched(true);
      setAdjustments({});
      setIndicatedRent(0);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };


  const handleToggleSelect = (id: string) => {
    if (hasSearched) {
      const comp = results.find(c => c.id === id);
      const wasSelected = comp?.selected;
      setResults(results.map(c => c.id === id ? { ...c, selected: !c.selected } : c));
      if (!wasSelected) {
        setActiveCompId(id);
      } else if (activeCompId === id) {
        setActiveCompId(null);
      }
    } else {
      setAllListings(allListings.map(comp => comp.id === id ? { ...comp, selected: !comp.selected } : comp));
    }
    if (selectedProperty && selectedProperty.id === id) {
      setSelectedProperty(prev => prev ? { ...prev, selected: !prev.selected } : null);
    }
  };

  const handleAdjustmentsChange = useCallback((newAdjustments: CompAdjustments, newIndicatedRent: number) => {
    setAdjustments(newAdjustments);
    setIndicatedRent(newIndicatedRent);
  }, []);

  const handlePropertyClick = (property: RentalCompResult) => {
    setSelectedProperty(property);
    if (hasSearched) {
      setTimeout(() => comparisonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  };

  const handleListingClick = (listing: RentalCompResult) => {
    const subjectFromListing: SubjectProperty = {
      address: listing.address,
      city: listing.city,
      state: listing.state,
      zip: listing.zip,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      sqft: listing.sqft,
      yearBuilt: listing.yearBuilt,
      propertyType: listing.propertyType,
      lat: listing.lat,
      lng: listing.lng,
      photos: listing.photos,
      furnished: listing.furnished,
      petsAllowed: listing.petsAllowed,
      parkingSpaces: listing.parkingSpaces,
      garageSpaces: listing.garageSpaces,
      hasPool: listing.hasPool,
      hasWasherDryer: listing.hasWasherDryer,
      utilitiesIncluded: listing.utilitiesIncluded,
    };
    setInitialSubject(subjectFromListing);
    handleSearch(subjectFromListing, {
      radiusMiles: 5,
      dateRangeMonths: 12,
      bedVariance: 1,
      bathVariance: 1,
      sqftVariancePercent: 20,
      propertyTypeMatch: true,
      includeActive: true,
    });
  };

  const selectedComps = results.filter(r => r.selected);

  return (
    <div className="min-h-screen bg-cream dark:bg-[#0a0a0f]">
      {/* Header */}
      <header className="sticky top-0 z-40 wood-grain border-b border-walnut-dark/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold to-gold-muted flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-walnut-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div>
                <h1 className="font-display text-xl font-semibold text-cream tracking-wide">RentAtlas</h1>
                <p className="text-xs text-gold-light/80 hidden sm:block tracking-wider uppercase">Rental Comparable Intelligence</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {subject && selectedComps.length > 0 && (
                <>
                  <div className="text-right mr-2 px-4 py-1.5 rounded-lg bg-walnut-dark/50 border border-gold/20">
                    <p className="hidden sm:block text-[10px] text-gold-light/70 uppercase tracking-wider">Market Rent</p>
                    <p className="text-sm sm:text-lg font-display font-semibold text-gold-light">
                      ${indicatedRent.toLocaleString()}<span className="text-xs font-normal text-gold-light/50">/mo</span>
                    </p>
                  </div>
                  <ExportButtons subject={subject} comps={selectedComps} adjustments={adjustments} indicatedRent={indicatedRent} />
                </>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar - Subject Property Form (on top on mobile) */}
          <div className="order-1 lg:order-none lg:col-span-4 xl:col-span-3 lg:self-start">
            <div className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] flex flex-col">
              <div className="card-premium rounded-xl overflow-hidden flex flex-col lg:min-h-0">
                {/* Header — matches top nav */}
                <div className="wood-grain px-6 py-3 flex-shrink-0">
                  <h2 className="font-display text-lg font-semibold text-cream flex items-center gap-3 relative z-10">
                    <svg className="w-5 h-5 text-gold-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Subject Property
                  </h2>
                </div>
                {/* Map — fixed height, no scroll */}
                <div className="p-4 pb-2 bg-gradient-to-b from-cream to-cream-dark dark:from-[#111118] dark:to-[#0a0a0f] flex-shrink-0">
                  <SubjectMap
                    subject={formSubject}
                    onLocationSelect={handleMapLocationSelect}
                    listings={hasSearched ? results : allListings}
                  />
                </div>
                {/* Scrollable form area */}
                <div className="px-6 pb-6 lg:overflow-y-auto lg:min-h-0 bg-gradient-to-b from-cream-dark to-cream-dark dark:from-[#0a0a0f] dark:to-[#0a0a0f]">
                  <SubjectPropertyForm onSearch={handleSearch} isSearching={isSearching} initialSubject={initialSubject ?? undefined} />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="order-2 lg:order-none lg:col-span-8 xl:col-span-9 space-y-8">
            {/* Map View — desktop only */}
            <div className="hidden lg:block">
              <MapView
                subject={subject ?? formSubject}
                comps={hasSearched ? results : allListings}
                selectedComps={selectedComps}
                onToggleSelect={handleToggleSelect}
              />
            </div>

            {/* Results */}
            <div className="card-premium rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-walnut/10 dark:border-gold/10 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-cream to-ivory dark:from-[#111118] dark:to-[#1a1a24]">
                <h2 className="font-display text-xl font-semibold text-charcoal dark:text-cream flex items-center gap-3 shrink-0">
                  <svg className="w-5 h-5 text-burgundy dark:text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {hasSearched ? 'Rental Comparables' : 'Rental Listings'}
                </h2>
                <div className="flex items-center gap-3">
                  {!hasSearched && (
                    <input type="text" className="input-premium px-3 py-2 rounded-lg text-sm text-charcoal dark:text-cream placeholder-walnut/50 dark:placeholder-cream/30 w-full sm:w-64"
                      placeholder="Filter by address, city, or zip..." value={filterText} onChange={(e) => setFilterText(e.target.value)} />
                  )}
                  {hasSearched && results.length > 0 && (
                    <span className="text-sm text-walnut dark:text-gold-light/70 bg-walnut/5 dark:bg-gold/10 px-3 py-1 rounded-full">
                      {selectedComps.length} of {results.length} selected
                    </span>
                  )}
                </div>
              </div>
              <div className="p-6 bg-gradient-to-b from-ivory to-cream dark:from-[#111118] dark:to-[#1a1a24]">
                {!hasSearched && isLoadingListings ? (
                  <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-20 h-20 mb-6">
                      <div className="w-16 h-16 border-4 border-burgundy/20 dark:border-gold/20 border-t-burgundy dark:border-t-gold rounded-full animate-spin"></div>
                    </div>
                    <h3 className="font-display text-2xl font-semibold text-charcoal dark:text-cream mb-2">Loading Rentals...</h3>
                    <p className="text-walnut dark:text-cream/60">Fetching rental listing data</p>
                  </div>
                ) : !hasSearched ? (
                  <CompResultsTable results={filteredListings} onToggleSelect={handleToggleSelect} onPropertyClick={handlePropertyClick} />
                ) : isSearching ? (
                  <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-20 h-20 mb-6">
                      <div className="w-16 h-16 border-4 border-burgundy/20 dark:border-gold/20 border-t-burgundy dark:border-t-gold rounded-full animate-spin"></div>
                    </div>
                    <h3 className="font-display text-2xl font-semibold text-charcoal dark:text-cream mb-2">Searching Rentals...</h3>
                    <p className="text-walnut dark:text-cream/60">Finding comparable rentals in your area</p>
                  </div>
                ) : (
                  <CompResultsTable results={results} onToggleSelect={handleToggleSelect} onPropertyClick={handlePropertyClick} />
                )}
              </div>
            </div>

            {/* Side-by-Side Comparison — inline when a comp is selected */}
            {subject && selectedComps.length > 0 && (
              <PhotoComparison
                subject={subject}
                selectedComps={selectedComps}
                activeCompId={activeCompId}
                onActiveCompChange={setActiveCompId}
              />
            )}

            {subject && selectedComps.length > 0 && (
              <AdjustmentGrid selectedComps={selectedComps} subject={subject} onAdjustmentsChange={handleAdjustmentsChange} />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-walnut/10 dark:border-gold/10 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold/80 to-gold-muted/80 flex items-center justify-center">
                <svg className="w-4 h-4 text-walnut-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <span className="font-display text-sm text-walnut dark:text-cream/60">RentAtlas</span>
            </div>
            <p className="text-xs text-walnut/60 dark:text-cream/40">Rental Comparable Intelligence</p>
          </div>
        </div>
      </footer>

      {/* Property Detail Modal — only for pre-search listing clicks */}
      <PropertyDetailModal property={selectedProperty} subject={subject} isOpen={!hasSearched && selectedProperty !== null}
        onClose={() => setSelectedProperty(null)} onToggleSelect={handleToggleSelect} />
      <SubjectDetailModal subject={subject} isOpen={isSubjectModalOpen} onClose={() => setIsSubjectModalOpen(false)} />
    </div>
  );
}
