import { NextResponse } from 'next/server';
import propertiesData from '@/data/properties.json';
import { RentalProperty } from '@/types/property';
import { retsSearch, hasRetsConfig } from '@/lib/rets-client';

const properties = propertiesData as RentalProperty[];

// Cape May MLS system field names
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

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'Sea Isle City': { lat: 39.1534, lng: -74.6929 },
  'Avalon': { lat: 39.1012, lng: -74.7177 },
  'Stone Harbor': { lat: 39.0526, lng: -74.7608 },
  'Cape May': { lat: 38.9351, lng: -74.9060 },
  'Cape May Court House': { lat: 39.0826, lng: -74.8238 },
  'Wildwood': { lat: 38.9918, lng: -74.8148 },
  'Ocean City': { lat: 39.2776, lng: -74.5746 },
};

export async function GET() {
  const isMLS = process.env.NEXT_PUBLIC_DATA_SOURCE === 'mls' && hasRetsConfig();

  if (!isMLS) {
    // Mock mode — return local JSON data
    const listings = properties.map((property) => ({
      ...property,
      distanceMiles: 0,
      rentPerSqft: property.sqft > 0 ? Math.round((property.rentPrice / property.sqft) * 100) / 100 : 0,
      selected: false,
      similarityScore: 0,
    }));
    return NextResponse.json(listings);
  }

  // MLS mode — fetch recent active listings from RETS
  try {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 6);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    // Fetch active listings across all Cape May cities
    const query = `(${FIELDS.statusCat}=|1),(${FIELDS.statusDate}=${cutoffStr}+)`;
    console.log('[Listings] RETS query:', query);

    const records = await retsSearch('Property', 'RE_1', query, SELECT_FIELDS, 100);

    const listings = records
      .map((record) => {
        const listingId = record[FIELDS.listingId] || '';
        const sqft = Number(record[FIELDS.sqft]) || 0;
        const rentPrice = Number(record[FIELDS.askingPrice]) || 0;
        const photoCount = Math.min(Number(record[FIELDS.photoCount]) || 0, 10);
        const bathsFull = Number(record[FIELDS.bathsFull]) || 0;
        const city = record[FIELDS.city] || '';

        if (!listingId || !rentPrice) return null;

        // Photos
        const photos: string[] = [];
        for (let i = 0; i < Math.max(photoCount, 1); i++) {
          photos.push(`/api/photos/${listingId}?idx=${i}`);
        }

        // Lat/lng
        let lat = Number(record[FIELDS.lat]) || 0;
        let lng = Number(record[FIELDS.lng]) || 0;
        if (lat === 0 && lng === 0) {
          const cityCenter = CITY_COORDS[city];
          if (cityCenter) {
            lat = cityCenter.lat + (Math.random() - 0.5) * 0.006;
            lng = cityCenter.lng + (Math.random() - 0.5) * 0.006;
          }
        }

        return {
          id: listingId,
          address: record[FIELDS.address] || '',
          city,
          state: 'NJ',
          zip: record[FIELDS.zip] || '',
          bedrooms: Number(record[FIELDS.bedrooms]) || 0,
          bathrooms: Number(record[FIELDS.bathsTotal]) || bathsFull,
          sqft,
          yearBuilt: Number(record[FIELDS.yearBuilt]) || 0,
          propertyType: 'Single Family' as const,
          rentPrice,
          listDate: record[FIELDS.statusDate] || '',
          leaseDate: '',
          status: 'Active' as const,
          daysOnMarket: 0,
          lat,
          lng,
          photos,
          leaseTerm: '12 Months' as const,
          furnished: false,
          petsAllowed: false,
          parkingSpaces: 0,
          garageSpaces: 0,
          hasPool: false,
          hasWasherDryer: false,
          utilitiesIncluded: false,
          distanceMiles: 0,
          rentPerSqft: sqft > 0 ? Math.round((rentPrice / sqft) * 100) / 100 : 0,
          selected: false,
          similarityScore: 0,
        };
      })
      .filter(Boolean);

    console.log(`[Listings] Returning ${listings.length} MLS listings`);
    return NextResponse.json(listings);
  } catch (error) {
    console.error('[Listings] MLS fetch failed, falling back to mock:', error);
    // Fallback to mock data
    const listings = properties.map((property) => ({
      ...property,
      distanceMiles: 0,
      rentPerSqft: property.sqft > 0 ? Math.round((property.rentPrice / property.sqft) * 100) / 100 : 0,
      selected: false,
      similarityScore: 0,
    }));
    return NextResponse.json(listings);
  }
}
