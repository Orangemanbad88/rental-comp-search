'use client';

import { useState, useEffect } from 'react';
import { SubjectProperty, SearchCriteria, PropertyType, RentalCompResult } from '@/types/property';
import { Button } from '@/components/ui/Button';

interface SubjectPropertyFormProps {
  onSearch: (subject: SubjectProperty, criteria: SearchCriteria) => void;
  isSearching?: boolean;
  initialSubject?: SubjectProperty;
  listings?: RentalCompResult[];
}

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'Sea Isle City': { lat: 39.1534, lng: -74.6929 },
  'Avalon': { lat: 39.1012, lng: -74.7177 },
  'Stone Harbor': { lat: 39.0526, lng: -74.7608 },
  'Cape May': { lat: 38.9351, lng: -74.9060 },
  'Cape May Court House': { lat: 39.0826, lng: -74.8238 },
  'Cape May Point': { lat: 38.9376, lng: -74.9658 },
  'Wildwood': { lat: 38.9918, lng: -74.8148 },
  'Wildwood Crest': { lat: 38.9748, lng: -74.8238 },
  'North Wildwood': { lat: 39.0026, lng: -74.7988 },
  'Ocean City': { lat: 39.2776, lng: -74.5746 },
  'Upper Township': { lat: 39.2048, lng: -74.7238 },
  'Middle Township': { lat: 39.0426, lng: -74.8438 },
  'Lower Township': { lat: 38.9626, lng: -74.8838 },
  'Dennis Township': { lat: 39.1926, lng: -74.8238 },
  'Woodbine': { lat: 39.2416, lng: -74.8128 },
  'West Cape May': { lat: 38.9398, lng: -74.9380 },
  'West Wildwood': { lat: 38.9928, lng: -74.8268 },
};

function normalizeAddr(s: string): string {
  return s.toLowerCase().trim()
    .replace(/\bstreet\b/g, 'st')
    .replace(/\bavenue\b/g, 'ave')
    .replace(/\bdrive\b/g, 'dr')
    .replace(/\broad\b/g, 'rd')
    .replace(/\bboulevard\b/g, 'blvd')
    .replace(/\blane\b/g, 'ln')
    .replace(/\bcourt\b/g, 'ct')
    .replace(/\bplace\b/g, 'pl')
    .replace(/[.,#]/g, '')
    .replace(/\s+/g, ' ');
}

function findNearestCity(lat: number, lng: number): string {
  let nearest = 'Sea Isle City';
  let minDist = Infinity;
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    const d = Math.sqrt((lat - coords.lat) ** 2 + (lng - coords.lng) ** 2);
    if (d < minDist) { minDist = d; nearest = city; }
  }
  return nearest;
}

export const emptySubject: SubjectProperty = {
  address: '',
  city: '',
  state: 'NJ',
  zip: '',
  bedrooms: 0,
  bathrooms: 0,
  sqft: 0,
  yearBuilt: 0,
  propertyType: 'Single Family',
  lat: 39.1534,
  lng: -74.6929,
  photos: [],
  furnished: false,
  petsAllowed: false,
  parkingSpaces: 0,
  garageSpaces: 0,
  hasPool: false,
  hasWasherDryer: false,
  utilitiesIncluded: false,
};

export const defaultSubject: SubjectProperty = {
  address: '200 Beach Ave',
  city: 'Cape May',
  state: 'NJ',
  zip: '08204',
  bedrooms: 3,
  bathrooms: 2,
  sqft: 1700,
  yearBuilt: 2000,
  propertyType: 'Single Family',
  lat: 38.9351,
  lng: -74.9060,
  photos: [],
  furnished: false,
  petsAllowed: true,
  parkingSpaces: 2,
  garageSpaces: 1,
  hasPool: false,
  hasWasherDryer: true,
  utilitiesIncluded: false,
};

const defaultCriteria: SearchCriteria = {
  radiusMiles: 5,
  dateRangeMonths: 12,
  bedVariance: 1,
  bathVariance: 1,
  sqftVariancePercent: 20,
  propertyTypeMatch: true,
  includeActive: true,
};

export function SubjectPropertyForm({ onSearch, isSearching = false, initialSubject, listings = [] }: SubjectPropertyFormProps) {
  const [subject, setSubject] = useState<SubjectProperty>(emptySubject);
  const [criteria, setCriteria] = useState<SearchCriteria>(defaultCriteria);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    if (initialSubject) {
      setSubject(initialSubject);
    }
  }, [initialSubject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let searchSubject = { ...subject };

    // Parse address — might contain "street, city"
    let searchStreet = subject.address.trim();
    let searchCity = subject.city;
    if (searchStreet.includes(',')) {
      const parts = searchStreet.split(',').map(s => s.trim());
      searchStreet = parts[0];
      if (!searchCity && parts[1]) searchCity = parts[1];
    }

    // Try to find matching listing by address
    if (searchStreet && listings.length > 0) {
      const normalized = normalizeAddr(searchStreet);
      const match = listings.find(l => {
        const listingAddr = normalizeAddr(l.address);
        const streetMatch = listingAddr === normalized || listingAddr.includes(normalized) || normalized.includes(listingAddr);
        if (!searchCity) return streetMatch;
        return streetMatch && l.city.toLowerCase().includes(searchCity.toLowerCase());
      });

      if (match) {
        searchSubject = {
          address: match.address,
          city: match.city,
          state: match.state,
          zip: match.zip,
          bedrooms: match.bedrooms,
          bathrooms: match.bathrooms,
          sqft: match.sqft,
          yearBuilt: match.yearBuilt,
          propertyType: match.propertyType,
          lat: match.lat,
          lng: match.lng,
          photos: match.photos,
          furnished: match.furnished,
          petsAllowed: match.petsAllowed,
          parkingSpaces: match.parkingSpaces,
          garageSpaces: match.garageSpaces,
          hasPool: match.hasPool,
          hasWasherDryer: match.hasWasherDryer,
          utilitiesIncluded: match.utilitiesIncluded,
        };
        setSubject(searchSubject);
        setDetailsOpen(true);
        onSearch(searchSubject, criteria);
        return;
      }
    }

    // Forward geocode fallback if no listing match found
    if (subject.address && subject.lat === emptySubject.lat && subject.lng === emptySubject.lng) {
      try {
        const query = [subject.address, subject.city || 'Cape May County', subject.state || 'NJ'].filter(Boolean).join(', ');
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`,
          { headers: { 'User-Agent': 'RentAtlas/1.0' } }
        );
        const data = await res.json();
        if (data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          const addr = data[0].address || {};
          searchSubject = {
            ...searchSubject,
            lat,
            lng,
            city: subject.city || findNearestCity(lat, lng),
            zip: subject.zip || addr.postcode || '',
          };
          setSubject(searchSubject);
        }
      } catch {
        // proceed with defaults
      }
    }

    onSearch(searchSubject, criteria);
  };

  const inputClass = "input-premium w-full px-3 py-2.5 rounded-lg text-sm text-charcoal dark:text-cream placeholder-walnut/50 dark:placeholder-cream/30";
  const labelClass = "block text-xs font-semibold text-walnut dark:text-gold-light/70 uppercase tracking-wider mb-1.5";
  const sectionClass = "space-y-4";
  const checkboxLabelClass = "flex items-center gap-3 cursor-pointer group";
  const checkboxClass = "w-4 h-4 text-burgundy dark:text-gold bg-ivory dark:bg-charcoal border-walnut/30 dark:border-gold/30 rounded focus:ring-burgundy dark:focus:ring-gold focus:ring-2 transition-colors";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Address — always visible */}
      <div>
        <label className={labelClass}>Address</label>
        <input
          type="text"
          className={inputClass}
          value={subject.address}
          onChange={(e) => setSubject({ ...subject, address: e.target.value })}
          placeholder="123 Main Street, Cape May"
        />
      </div>

      {/* Property Details — collapsible, closed by default */}
      <div className={sectionClass}>
        <button
          type="button"
          onClick={() => setDetailsOpen(!detailsOpen)}
          className="w-full text-xs font-semibold text-burgundy dark:text-gold uppercase tracking-wider flex items-center justify-between gap-2 py-1"
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Property Details
          </span>
          <svg className={`w-4 h-4 transition-transform ${detailsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {detailsOpen && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>City</label>
                <input
                  type="text"
                  className={inputClass}
                  value={subject.city}
                  onChange={(e) => setSubject({ ...subject, city: e.target.value })}
                  placeholder="Cape May"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>State</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={subject.state}
                    onChange={(e) => setSubject({ ...subject, state: e.target.value })}
                    placeholder="NJ"
                    maxLength={2}
                  />
                </div>
                <div>
                  <label className={labelClass}>ZIP</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={subject.zip}
                    onChange={(e) => setSubject({ ...subject, zip: e.target.value })}
                    placeholder="08204"
                    maxLength={5}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>Property Type</label>
              <select
                className={inputClass}
                value={subject.propertyType}
                onChange={(e) => setSubject({ ...subject, propertyType: e.target.value as PropertyType })}
              >
                <option value="Single Family">Single Family</option>
                <option value="Condo">Condo</option>
                <option value="Townhouse">Townhouse</option>
                <option value="Duplex">Duplex</option>
                <option value="Triplex">Triplex</option>
                <option value="Fourplex">Fourplex</option>
                <option value="Apartment">Apartment</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Beds</label>
                <input type="number" className={inputClass} value={subject.bedrooms}
                  onChange={(e) => setSubject({ ...subject, bedrooms: parseInt(e.target.value) || 0 })}
                  min={0} max={10} />
              </div>
              <div>
                <label className={labelClass}>Baths</label>
                <input type="number" className={inputClass} value={subject.bathrooms}
                  onChange={(e) => setSubject({ ...subject, bathrooms: parseFloat(e.target.value) || 0 })}
                  min={0} max={10} step={0.5} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Sq Ft</label>
                <input type="number" className={inputClass} value={subject.sqft}
                  onChange={(e) => setSubject({ ...subject, sqft: parseInt(e.target.value) || 0 })}
                  min={0} />
              </div>
              <div>
                <label className={labelClass}>Year Built</label>
                <input type="number" className={inputClass} value={subject.yearBuilt}
                  onChange={(e) => setSubject({ ...subject, yearBuilt: parseInt(e.target.value) || 0 })}
                  min={1800} max={2030} />
              </div>
            </div>

            {/* Amenities */}
            <div className="divider-brass"></div>

            <p className="text-xs font-semibold text-burgundy dark:text-gold uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Amenities
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Parking</label>
                <input type="number" className={inputClass} value={subject.parkingSpaces}
                  onChange={(e) => setSubject({ ...subject, parkingSpaces: parseInt(e.target.value) || 0 })}
                  min={0} max={10} />
              </div>
              <div>
                <label className={labelClass}>Garage</label>
                <input type="number" className={inputClass} value={subject.garageSpaces}
                  onChange={(e) => setSubject({ ...subject, garageSpaces: parseInt(e.target.value) || 0 })}
                  min={0} max={5} />
              </div>
            </div>

            <div className="space-y-2.5">
              <label className={checkboxLabelClass}>
                <input type="checkbox" className={checkboxClass} checked={subject.furnished}
                  onChange={(e) => setSubject({ ...subject, furnished: e.target.checked })} />
                <span className="text-sm text-walnut dark:text-cream/70 group-hover:text-charcoal dark:group-hover:text-cream transition-colors">Furnished</span>
              </label>
              <label className={checkboxLabelClass}>
                <input type="checkbox" className={checkboxClass} checked={subject.petsAllowed}
                  onChange={(e) => setSubject({ ...subject, petsAllowed: e.target.checked })} />
                <span className="text-sm text-walnut dark:text-cream/70 group-hover:text-charcoal dark:group-hover:text-cream transition-colors">Pets Allowed</span>
              </label>
              <label className={checkboxLabelClass}>
                <input type="checkbox" className={checkboxClass} checked={subject.hasWasherDryer}
                  onChange={(e) => setSubject({ ...subject, hasWasherDryer: e.target.checked })} />
                <span className="text-sm text-walnut dark:text-cream/70 group-hover:text-charcoal dark:group-hover:text-cream transition-colors">Washer/Dryer</span>
              </label>
              <label className={checkboxLabelClass}>
                <input type="checkbox" className={checkboxClass} checked={subject.hasPool}
                  onChange={(e) => setSubject({ ...subject, hasPool: e.target.checked })} />
                <span className="text-sm text-walnut dark:text-cream/70 group-hover:text-charcoal dark:group-hover:text-cream transition-colors">Pool</span>
              </label>
              <label className={checkboxLabelClass}>
                <input type="checkbox" className={checkboxClass} checked={subject.utilitiesIncluded}
                  onChange={(e) => setSubject({ ...subject, utilitiesIncluded: e.target.checked })} />
                <span className="text-sm text-walnut dark:text-cream/70 group-hover:text-charcoal dark:group-hover:text-cream transition-colors">Utilities Included</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Brass Divider */}
      <div className="divider-brass"></div>

      {/* Search Criteria — collapsible */}
      <div className={sectionClass}>
        <button
          type="button"
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="w-full text-xs font-semibold text-burgundy dark:text-gold uppercase tracking-wider flex items-center justify-between gap-2 py-1"
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Search Filters
          </span>
          <svg className={`w-4 h-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {filtersOpen && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Radius</label>
                <select className={inputClass} value={criteria.radiusMiles}
                  onChange={(e) => setCriteria({ ...criteria, radiusMiles: parseFloat(e.target.value) as 0.5 | 1 | 2 | 5 })}>
                  <option value={0.5}>0.5 mi</option>
                  <option value={1}>1 mi</option>
                  <option value={2}>2 mi</option>
                  <option value={5}>5 mi</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Timeframe</label>
                <select className={inputClass} value={criteria.dateRangeMonths}
                  onChange={(e) => setCriteria({ ...criteria, dateRangeMonths: parseInt(e.target.value) as 3 | 6 | 12 })}>
                  <option value={3}>3 months</option>
                  <option value={6}>6 months</option>
                  <option value={12}>12 months</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Bed +/-</label>
                <select className={inputClass} value={criteria.bedVariance}
                  onChange={(e) => setCriteria({ ...criteria, bedVariance: parseInt(e.target.value) })}>
                  <option value={0}>Exact</option>
                  <option value={1}>+/- 1</option>
                  <option value={2}>+/- 2</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Bath +/-</label>
                <select className={inputClass} value={criteria.bathVariance}
                  onChange={(e) => setCriteria({ ...criteria, bathVariance: parseInt(e.target.value) })}>
                  <option value={0}>Exact</option>
                  <option value={1}>+/- 1</option>
                  <option value={2}>+/- 2</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Sq Ft Range</label>
              <select className={inputClass} value={criteria.sqftVariancePercent}
                onChange={(e) => setCriteria({ ...criteria, sqftVariancePercent: parseInt(e.target.value) })}>
                <option value={10}>+/- 10%</option>
                <option value={20}>+/- 20%</option>
                <option value={30}>+/- 30%</option>
              </select>
            </div>

            <label className={checkboxLabelClass}>
              <input type="checkbox" className={checkboxClass} checked={criteria.propertyTypeMatch}
                onChange={(e) => setCriteria({ ...criteria, propertyTypeMatch: e.target.checked })} />
              <span className="text-sm text-walnut dark:text-cream/70 group-hover:text-charcoal dark:group-hover:text-cream transition-colors">Match property type</span>
            </label>

            <label className={checkboxLabelClass}>
              <input type="checkbox" className={checkboxClass} checked={criteria.includeActive}
                onChange={(e) => setCriteria({ ...criteria, includeActive: e.target.checked })} />
              <span className="text-sm text-walnut dark:text-cream/70 group-hover:text-charcoal dark:group-hover:text-cream transition-colors">Include active listings</span>
            </label>
          </div>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSearching}>
        {isSearching ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Searching Rentals...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search Rental Comps
          </span>
        )}
      </Button>
    </form>
  );
}
