import { NextRequest, NextResponse } from 'next/server';
import { retsSearch } from '@/lib/rets-client';
import { SubjectProperty, RentalCompResult, PropertyType, ListingStatus, LeaseTermType } from '@/types/property';

/**
 * Build a DMQL2 query for rental comp search
 *
 * Paragon MLS rental fields (common system names):
 * - StandardStatus: Active, Closed (Leased), Pending
 * - City: city name
 * - BedroomsTotal: bedroom count
 * - BathroomsTotalInteger: bathroom count
 * - LivingArea: square footage
 * - ListPrice: monthly rent amount (for rentals)
 * - ClosePrice: final lease amount (if leased)
 * - ListDate: date listed
 * - CloseDate: lease execution date
 * - PropertyType: Residential Lease, etc.
 *
 * NOTE: Your MLS may use a different resource/class for rentals.
 * Common options: Property/RL_2, Property/RE_2, or RentalListing/RL_1
 * Check your MLS metadata to confirm. Update RENTAL_SEARCH_TYPE and
 * RENTAL_CLASS constants below.
 */

// Configure these for your specific MLS
const RENTAL_SEARCH_TYPE = 'Property';
const RENTAL_CLASS = 'RL_2'; // Rental class — check your MLS metadata

function buildDMQL2Query(subject: SubjectProperty, includeActive: boolean): string {
  const conditions: string[] = [];

  // Status filter — leased rentals, optionally include active
  if (includeActive) {
    conditions.push('(StandardStatus=|Active,Closed,Pending)');
  } else {
    conditions.push('(StandardStatus=|Closed)');
  }

  // City match
  if (subject.city) {
    conditions.push(`(City=|${subject.city})`);
  }

  // Bedrooms: subject ± 1
  const minBeds = Math.max(0, subject.bedrooms - 1);
  const maxBeds = subject.bedrooms + 1;
  conditions.push(`(BedroomsTotal=${minBeds}-${maxBeds})`);

  // Bathrooms: subject ± 1
  const minBaths = Math.max(1, subject.bathrooms - 1);
  const maxBaths = subject.bathrooms + 1;
  conditions.push(`(BathroomsTotalInteger=${minBaths}-${maxBaths})`);

  // Living area: subject ± 20%
  const minSqft = Math.round(subject.sqft * 0.80);
  const maxSqft = Math.round(subject.sqft * 1.20);
  conditions.push(`(LivingArea=${minSqft}-${maxSqft})`);

  // Date: last 12 months (list date or close date)
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 1);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  conditions.push(`(ListDate=${cutoffStr}+)`);

  // Property type mapping for rentals
  const typeMap: Record<string, string> = {
    'Single Family': 'Residential Lease',
    'Condo': 'Condominium Lease',
    'Townhouse': 'Townhouse Lease',
    'Duplex': 'Multi-Family',
    'Triplex': 'Multi-Family',
    'Fourplex': 'Multi-Family',
    'Apartment': 'Residential Lease',
  };
  if (subject.propertyType && typeMap[subject.propertyType]) {
    conditions.push(`(PropertyType=|${typeMap[subject.propertyType]})`);
  }

  return conditions.join(',');
}

/**
 * Map RETS record to RentalCompResult
 */
function mapRETSRecord(record: Record<string, string>, subject: SubjectProperty): RentalCompResult | null {
  const id = record['ListingKey'] || record['ListingId'] || record['sysid'] || '';
  const address = record['UnparsedAddress'] || record['StreetAddress'] ||
    [record['StreetNumber'], record['StreetName'], record['StreetSuffix']].filter(Boolean).join(' ') || '';
  const city = record['City'] || '';
  const state = record['StateOrProvince'] || subject.state || 'FL';
  const zip = record['PostalCode'] || '';
  const bedrooms = parseInt(record['BedroomsTotal'] || '0', 10);
  const bathrooms = parseInt(record['BathroomsTotalInteger'] || record['BathroomsFull'] || '0', 10);
  const sqft = parseInt(record['LivingArea'] || record['BuildingAreaTotal'] || '0', 10);
  const yearBuilt = parseInt(record['YearBuilt'] || '0', 10);
  const daysOnMarket = parseInt(record['DaysOnMarket'] || record['CumulativeDaysOnMarket'] || '0', 10);
  const lat = parseFloat(record['Latitude'] || '0');
  const lng = parseFloat(record['Longitude'] || '0');

  // Rent price: use ClosePrice (actual lease amount) if available, else ListPrice
  const rentPrice = parseFloat(record['ClosePrice'] || record['ListPrice'] || '0');
  const listDate = record['ListDate'] || '';
  const leaseDate = record['CloseDate'] || '';

  // Status mapping
  const rawStatus = (record['StandardStatus'] || record['Status'] || 'Active').toLowerCase();
  let status: ListingStatus = 'Active';
  if (rawStatus.includes('closed') || rawStatus.includes('leased')) status = 'Leased';
  else if (rawStatus.includes('pending')) status = 'Pending';

  // Skip records with missing critical data
  if (!id || !rentPrice || !sqft) return null;

  const rawType = record['PropertyType'] || record['PropertySubType'] || '';
  const propertyType = mapPropertyType(rawType);

  // Amenity fields — try common MLS field names
  const furnished = parseBool(record['Furnished'] || record['FurnishedYN'] || '');
  const petsAllowed = parseBool(record['PetsAllowed'] || record['PetsAllowedYN'] || '');
  const parkingSpaces = parseInt(record['ParkingTotal'] || record['ParkingSpaces'] || '0', 10);
  const garageSpaces = parseInt(record['GarageSpaces'] || '0', 10);
  const hasPool = parseBool(record['PoolPrivateYN'] || record['PoolFeatures'] || '');
  const hasWasherDryer = parseBool(record['LaundryFeatures'] || '') ||
    (record['Appliances'] || '').toLowerCase().includes('washer');
  const utilitiesIncluded = parseBool(record['UtilitiesIncluded'] || '') ||
    (record['RentIncludes'] || '').toLowerCase().includes('utilit');

  // Lease term
  const rawLeaseTerm = record['LeaseTerm'] || record['TermsOfLease'] || '';
  const leaseTerm = mapLeaseTerm(rawLeaseTerm);

  // Distance
  let distanceMiles = 0;
  if (subject.lat && subject.lng && lat && lng) {
    distanceMiles = calculateDistance(subject.lat, subject.lng, lat, lng);
  }

  const rentPerSqft = sqft > 0 ? Math.round((rentPrice / sqft) * 100) / 100 : 0;
  const similarityScore = calculateSimilarityScore(
    { bedrooms, bathrooms, sqft, listDate, leaseDate, furnished, petsAllowed, hasWasherDryer, hasPool, parkingSpaces, garageSpaces },
    subject,
    distanceMiles
  );

  return {
    id,
    address,
    city,
    state,
    zip,
    bedrooms,
    bathrooms,
    sqft,
    yearBuilt,
    propertyType,
    rentPrice,
    listDate,
    leaseDate,
    status,
    daysOnMarket,
    lat,
    lng,
    photos: [`/api/photos/${id}`],
    leaseTerm,
    furnished,
    petsAllowed,
    parkingSpaces,
    garageSpaces,
    hasPool,
    hasWasherDryer,
    utilitiesIncluded,
    distanceMiles,
    rentPerSqft,
    selected: false,
    similarityScore,
  };
}

function mapPropertyType(mlsType: string): PropertyType {
  const t = mlsType.toLowerCase();
  if (t.includes('condo')) return 'Condo';
  if (t.includes('town')) return 'Townhouse';
  if (t.includes('duplex')) return 'Duplex';
  if (t.includes('triplex')) return 'Triplex';
  if (t.includes('fourplex') || t.includes('quadplex')) return 'Fourplex';
  if (t.includes('apartment') || t.includes('apt')) return 'Apartment';
  return 'Single Family';
}

function mapLeaseTerm(raw: string): LeaseTermType {
  const t = raw.toLowerCase();
  if (t.includes('month-to-month') || t.includes('mtm')) return 'Month-to-Month';
  if (t.includes('6') || t.includes('six')) return '6 Months';
  if (t.includes('24') || t.includes('two year') || t.includes('2 year')) return '24 Months';
  if (t.includes('12') || t.includes('annual') || t.includes('year') || t.includes('1 year')) return '12 Months';
  return '12 Months'; // default
}

function parseBool(value: string): boolean {
  const v = value.toLowerCase().trim();
  return v === 'yes' || v === 'true' || v === '1' || v === 'y';
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

function calculateSimilarityScore(
  property: {
    bedrooms: number; bathrooms: number; sqft: number;
    listDate: string; leaseDate: string;
    furnished: boolean; petsAllowed: boolean; hasWasherDryer: boolean;
    hasPool: boolean; parkingSpaces: number; garageSpaces: number;
  },
  subject: SubjectProperty,
  distanceMiles: number
): number {
  let score = 0;

  // Sqft similarity (25 points max)
  const sqftDiffPercent = Math.abs(property.sqft - subject.sqft) / subject.sqft;
  score += Math.max(0, 25 * (1 - sqftDiffPercent / 0.20));

  // Distance (20 points max)
  score += Math.max(0, 20 * (1 - distanceMiles / 5));

  // Bedroom match (15 points max)
  const bedDiff = Math.abs(property.bedrooms - subject.bedrooms);
  score += bedDiff === 0 ? 15 : bedDiff === 1 ? 7 : 0;

  // Bathroom match (10 points max)
  const bathDiff = Math.abs(property.bathrooms - subject.bathrooms);
  score += bathDiff === 0 ? 10 : bathDiff <= 1 ? 5 : 0;

  // Recency (10 points max)
  const relevantDate = property.leaseDate || property.listDate;
  if (relevantDate) {
    const daysSince = Math.floor((Date.now() - new Date(relevantDate).getTime()) / (1000 * 60 * 60 * 24));
    score += Math.max(0, 10 * (1 - daysSince / 365));
  }

  // Amenity match (20 points max)
  if (property.furnished === subject.furnished) score += 4;
  if (property.petsAllowed === subject.petsAllowed) score += 4;
  if (property.hasWasherDryer === subject.hasWasherDryer) score += 4;
  if (property.hasPool === subject.hasPool) score += 3;
  if (property.parkingSpaces >= subject.parkingSpaces) score += 3;
  if (property.garageSpaces >= subject.garageSpaces) score += 2;

  return Math.round(score);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const subject: SubjectProperty = body.subject || body;
    const includeActive: boolean = body.includeActive ?? true;

    if (!subject.city || !subject.bedrooms || !subject.sqft) {
      return NextResponse.json(
        { error: 'Missing required fields: city, bedrooms, sqft' },
        { status: 400 }
      );
    }

    const query = buildDMQL2Query(subject, includeActive);
    console.log('[API] Rental DMQL2 query:', query);

    const records = await retsSearch({
      searchType: RENTAL_SEARCH_TYPE,
      class: RENTAL_CLASS,
      query,
      limit: 200,
    });

    const results: RentalCompResult[] = records
      .map(record => mapRETSRecord(record, subject))
      .filter((r): r is RentalCompResult => r !== null)
      .filter(r => {
        if (!subject.lat || !subject.lng) return true;
        return r.distanceMiles <= 5;
      })
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 25);

    console.log(`[API] Returning ${results.length} rental comps`);

    return NextResponse.json(results);
  } catch (error) {
    console.error('[API] Rental comp search error:', error);

    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message.includes('credentials') ? 500 : 502;

    return NextResponse.json(
      { error: `RETS search failed: ${message}` },
      { status }
    );
  }
}
