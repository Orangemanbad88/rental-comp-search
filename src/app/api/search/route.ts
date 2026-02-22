import { NextRequest, NextResponse } from 'next/server';
import { retsSearch } from '@/lib/rets-client';
import { SubjectProperty, RentalCompResult, PropertyType, ListingStatus, LeaseTermType } from '@/types/property';

/**
 * Cape May County MLS (Paragon RETS) — Rental Search
 *
 * Uses Paragon system field names (StandardNames=0).
 * Class RE_1 = Residential (includes rentals in many MLSes).
 * If your MLS has a dedicated rental class (RL_2, etc.), update RENTAL_CLASS.
 */

// Cape May MLS system field names (NOT standard names)
const FIELDS = {
  listingId: 'L_ListingID',
  address: 'L_Address',
  city: 'L_City',
  zip: 'L_Zip',
  bedrooms: 'L_Keyword1',
  bathsFull: 'L_Keyword2',
  bathsTotal: 'LM_Dec_13',
  sqft: 'L_SquareFeet',
  yearBuilt: 'LM_Char10_1',
  type: 'L_Type_',
  askingPrice: 'L_AskingPrice',
  soldPrice: 'L_SoldPrice',
  statusDate: 'L_StatusDate',
  statusCat: 'L_StatusCatID',
  status: 'L_Status',
  lat: 'LMD_MP_Latitude',
  lng: 'LMD_MP_Longitude',
  photoCount: 'L_PictureCount',
};

const SELECT_FIELDS = [
  FIELDS.listingId, FIELDS.address, FIELDS.city, FIELDS.zip,
  FIELDS.bedrooms, FIELDS.bathsFull, FIELDS.bathsTotal, FIELDS.sqft,
  FIELDS.yearBuilt, FIELDS.type, FIELDS.askingPrice, FIELDS.soldPrice,
  FIELDS.statusDate, FIELDS.statusCat, FIELDS.status,
  FIELDS.lat, FIELDS.lng, FIELDS.photoCount,
];

// RE_1 = Residential class (account not authorized for RN_6 rental class)
// To switch to rentals, request RN_6 access from your MLS board
const RENTAL_SEARCH_TYPE = 'Property';
const RENTAL_CLASS = 'RE_1';

// Cape May County city lookup values
const CITY_LOOKUP: Record<string, string> = {
  'sea isle city': 'SeaIsleC',
  'avalon': 'Avalon',
  'stone harbor': 'StoneHar',
  'cape may': 'CapeMay',
  'cape may court house': 'CMCrtHse',
  'cape may point': 'CapeMyPt',
  'wildwood': 'Wildwood',
  'wildwood crest': 'WildwCrs',
  'north wildwood': 'NWildwood',
  'ocean city': 'OceanCty',
  'upper township': 'UpperTwp',
  'middle township': 'MiddleTp',
  'lower township': 'LowerTwp',
  'dennis township': 'DennisTp',
  'woodbine': 'Woodbine',
  'west cape may': 'WCapeMay',
  'west wildwood': 'WWldwood',
};

// City center coords for fallback when MLS doesn't return lat/lng
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'Sea Isle City': { lat: 39.1534, lng: -74.6929 },
  'Avalon': { lat: 39.1012, lng: -74.7177 },
  'Avalon Manor': { lat: 39.1012, lng: -74.7177 },
  'Stone Harbor': { lat: 39.0526, lng: -74.7608 },
  'Cape May': { lat: 38.9351, lng: -74.9060 },
  'Cape May Court House': { lat: 39.0826, lng: -74.8238 },
  'Cape May Point': { lat: 38.9376, lng: -74.9658 },
  'Wildwood': { lat: 38.9918, lng: -74.8148 },
  'Wildwood Crest': { lat: 38.9748, lng: -74.8238 },
  'North Wildwood': { lat: 39.0026, lng: -74.7988 },
  'West Wildwood': { lat: 38.9928, lng: -74.8268 },
  'Ocean City': { lat: 39.2776, lng: -74.5746 },
  'Ocean View': { lat: 39.1980, lng: -74.7120 },
  'Upper Township': { lat: 39.2048, lng: -74.7238 },
  'Middle Township': { lat: 39.0426, lng: -74.8438 },
  'Lower Township': { lat: 38.9626, lng: -74.8838 },
  'Dennis Township': { lat: 39.1926, lng: -74.8238 },
  'Woodbine': { lat: 39.2416, lng: -74.8128 },
  'West Cape May': { lat: 38.9398, lng: -74.9380 },
  'North Cape May': { lat: 38.9780, lng: -74.9420 },
  'Villas': { lat: 38.9580, lng: -74.9380 },
  'Erma': { lat: 38.9780, lng: -74.9020 },
  'Rio Grande': { lat: 39.0126, lng: -74.8768 },
  'Seaville': { lat: 39.1880, lng: -74.7320 },
  'Cold Spring': { lat: 38.9580, lng: -74.8980 },
  'Strathmere': { lat: 39.1880, lng: -74.6580 },
  'Green Creek': { lat: 39.0430, lng: -74.8980 },
  'Marmora': { lat: 39.2580, lng: -74.6580 },
  'Corbin City': { lat: 39.3080, lng: -74.7280 },
  'Townbank': { lat: 38.9620, lng: -74.8680 },
  'Whitesboro': { lat: 39.0280, lng: -74.8480 },
  'Pleasantville': { lat: 39.3890, lng: -74.5240 },
};

const STATUS_ACTIVE = '1';
const STATUS_SOLD = '2';

function lookupCity(city: string): string | null {
  const lower = city.toLowerCase().trim();
  return CITY_LOOKUP[lower] || null;
}

function buildDMQL2Query(subject: SubjectProperty, includeActive: boolean): string {
  const conditions: string[] = [];

  // City filter
  const cityLookup = lookupCity(subject.city);
  if (cityLookup) {
    conditions.push(`(${FIELDS.city}=|${cityLookup})`);
  } else {
    // Search all Cape May cities
    const allCities = Object.values(CITY_LOOKUP).join(',');
    conditions.push(`(${FIELDS.city}=|${allCities})`);
  }

  // Status filter
  if (includeActive) {
    conditions.push(`(${FIELDS.statusCat}=|${STATUS_ACTIVE},${STATUS_SOLD})`);
  } else {
    conditions.push(`(${FIELDS.statusCat}=|${STATUS_SOLD})`);
  }

  // Bedrooms: subject ± 1
  if (subject.bedrooms > 0) {
    const minBeds = Math.max(1, subject.bedrooms - 1);
    const maxBeds = subject.bedrooms + 1;
    conditions.push(`(${FIELDS.bedrooms}=${minBeds}-${maxBeds})`);
  }

  // Bathrooms: subject ± 1
  if (subject.bathrooms > 0) {
    const minBaths = Math.max(1, Math.floor(subject.bathrooms - 1));
    const maxBaths = Math.ceil(subject.bathrooms + 1);
    conditions.push(`(${FIELDS.bathsFull}=${minBaths}-${maxBaths})`);
  }

  // Sqft: ± 25%
  if (subject.sqft > 0) {
    const minSqft = Math.round(subject.sqft * 0.75);
    const maxSqft = Math.round(subject.sqft * 1.25);
    conditions.push(`(${FIELDS.sqft}=${minSqft}-${maxSqft})`);
  }

  // Date: last 12 months
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 1);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  conditions.push(`(${FIELDS.statusDate}=${cutoffStr}+)`);

  return conditions.join(',');
}

function mapRETSRecord(record: Record<string, string>, subject: SubjectProperty): RentalCompResult | null {
  const listingId = record[FIELDS.listingId] || '';
  const address = record[FIELDS.address] || '';
  const city = record[FIELDS.city] || '';
  const state = 'NJ';
  const zip = record[FIELDS.zip] || '';
  const bedrooms = Number(record[FIELDS.bedrooms]) || 0;
  const bathsFull = Number(record[FIELDS.bathsFull]) || 0;
  const bathrooms = Number(record[FIELDS.bathsTotal]) || bathsFull;
  const sqft = Number(record[FIELDS.sqft]) || 0;
  const yearBuilt = Number(record[FIELDS.yearBuilt]) || 0;
  const photoCount = Math.min(Number(record[FIELDS.photoCount]) || 0, 10);

  // Price: use sold price if available, else asking price
  // For rental context, this represents the monthly rent or list price
  const rentPrice = Number(record[FIELDS.soldPrice]) || Number(record[FIELDS.askingPrice]) || 0;
  const listDate = record[FIELDS.statusDate] || '';

  // Status mapping
  const statusCat = record[FIELDS.statusCat] || '';
  let status: ListingStatus = 'Active';
  if (statusCat === STATUS_SOLD) status = 'Leased';
  else if (statusCat === '3') status = 'Pending';

  // Skip records with missing critical data
  if (!listingId || !rentPrice || !sqft) return null;

  const rawType = record[FIELDS.type] || '';
  const propertyType = mapPropertyType(rawType);

  // Generate photo URLs
  const photos: string[] = [];
  for (let i = 0; i < Math.max(photoCount, 1); i++) {
    photos.push(`/api/photos/${listingId}?idx=${i}`);
  }

  // Lat/Lng with city center fallback
  let lat = Number(record[FIELDS.lat]) || 0;
  let lng = Number(record[FIELDS.lng]) || 0;
  if (lat === 0 && lng === 0) {
    const cityCenter = CITY_COORDS[city];
    if (cityCenter) {
      lat = cityCenter.lat + (Math.random() - 0.5) * 0.006;
      lng = cityCenter.lng + (Math.random() - 0.5) * 0.006;
    }
  }

  // Distance
  let distanceMiles = 0;
  if (subject.lat && subject.lng && lat && lng) {
    distanceMiles = calculateDistance(subject.lat, subject.lng, lat, lng);
  }

  const rentPerSqft = sqft > 0 ? Math.round((rentPrice / sqft) * 100) / 100 : 0;
  const similarityScore = calculateSimilarityScore(
    { bedrooms, bathrooms, sqft, listDate, distanceMiles },
    subject
  );

  return {
    id: listingId,
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
    leaseDate: record[FIELDS.statusDate] || '',
    status,
    daysOnMarket: 0,
    lat,
    lng,
    photos,
    leaseTerm: '12 Months' as LeaseTermType,
    furnished: false,
    petsAllowed: false,
    parkingSpaces: 0,
    garageSpaces: 0,
    hasPool: false,
    hasWasherDryer: false,
    utilitiesIncluded: false,
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
  property: { bedrooms: number; bathrooms: number; sqft: number; listDate: string; distanceMiles: number },
  subject: SubjectProperty
): number {
  let score = 0;

  // Sqft similarity (25 points max)
  if (subject.sqft > 0 && property.sqft > 0) {
    const sqftDiffPercent = Math.abs(property.sqft - subject.sqft) / subject.sqft;
    score += Math.max(0, 25 * (1 - sqftDiffPercent / 0.25));
  }

  // Distance (20 points max)
  if (property.distanceMiles > 0) {
    score += Math.max(0, 20 * (1 - property.distanceMiles / 5));
  } else {
    score += 15;
  }

  // Bedroom match (15 points max)
  const bedDiff = Math.abs(property.bedrooms - subject.bedrooms);
  score += bedDiff === 0 ? 15 : bedDiff === 1 ? 7 : 0;

  // Bathroom match (10 points max)
  const bathDiff = Math.abs(property.bathrooms - subject.bathrooms);
  score += bathDiff === 0 ? 10 : bathDiff <= 1 ? 5 : 0;

  // Recency (10 points max)
  if (property.listDate) {
    const daysSince = Math.floor((Date.now() - new Date(property.listDate).getTime()) / (1000 * 60 * 60 * 24));
    score += Math.max(0, 10 * (1 - daysSince / 365));
  }

  return Math.round(score);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const subject: SubjectProperty = body.subject || body;
    const includeActive: boolean = body.includeActive ?? true;

    // City, bedrooms, sqft are optional — query builder skips filters for zero values
    // This allows address-only searches where details aren't filled in

    const query = buildDMQL2Query(subject, includeActive);

    const records = await retsSearch(
      RENTAL_SEARCH_TYPE,
      RENTAL_CLASS,
      query,
      SELECT_FIELDS,
      200,
    );

    const results: RentalCompResult[] = records
      .map(record => mapRETSRecord(record, subject))
      .filter((r): r is RentalCompResult => r !== null)
      .filter(r => {
        if (!subject.lat || !subject.lng) return true;
        return r.distanceMiles <= 10;
      })
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 25);

    return NextResponse.json(results);
  } catch (error) {
    console.error('[API] Search error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `RETS search failed: ${message}` }, { status: 502 });
  }
}
