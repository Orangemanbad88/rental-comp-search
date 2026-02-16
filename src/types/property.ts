export type PropertyType = 'Single Family' | 'Condo' | 'Townhouse' | 'Duplex' | 'Triplex' | 'Fourplex' | 'Apartment';

export type LeaseTermType = 'Month-to-Month' | '6 Months' | '12 Months' | '24 Months' | 'Other';

export type ListingStatus = 'Active' | 'Leased' | 'Pending';

export interface RentalProperty {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  yearBuilt: number;
  propertyType: PropertyType;
  /** Monthly rent amount */
  rentPrice: number;
  /** Lease start or listing date */
  listDate: string;
  /** Lease execution / close date (if leased) */
  leaseDate: string;
  status: ListingStatus;
  daysOnMarket: number;
  lat: number;
  lng: number;
  photos: string[];
  // Rental-specific amenities
  leaseTerm: LeaseTermType;
  furnished: boolean;
  petsAllowed: boolean;
  parkingSpaces: number;
  garageSpaces: number;
  hasPool: boolean;
  hasWasherDryer: boolean;
  utilitiesIncluded: boolean;
}

export interface SubjectProperty {
  address: string;
  city: string;
  state: string;
  zip: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  yearBuilt: number;
  propertyType: PropertyType;
  lat?: number;
  lng?: number;
  photos?: string[];
  // Rental-specific
  furnished: boolean;
  petsAllowed: boolean;
  parkingSpaces: number;
  garageSpaces: number;
  hasPool: boolean;
  hasWasherDryer: boolean;
  utilitiesIncluded: boolean;
}

export interface SearchCriteria {
  radiusMiles: 0.5 | 1 | 2 | 5;
  /** How many months back to search for leased/listed rentals */
  dateRangeMonths: 3 | 6 | 12;
  bedVariance: number;
  bathVariance: number;
  sqftVariancePercent: number;
  propertyTypeMatch: boolean;
  /** Include only leased (closed) rentals, or also active listings */
  includeActive: boolean;
}

export interface RentalCompResult extends RentalProperty {
  distanceMiles: number;
  /** Rent per square foot per month */
  rentPerSqft: number;
  selected: boolean;
  adjustedRent?: number;
  similarityScore: number;
}
