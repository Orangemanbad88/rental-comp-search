import { NextResponse } from 'next/server';
import propertiesData from '@/data/properties.json';
import { RentalProperty } from '@/types/property';

const properties = propertiesData as RentalProperty[];

export async function GET() {
  const listings = properties.map((property) => ({
    ...property,
    distanceMiles: 0,
    rentPerSqft: property.sqft > 0 ? Math.round((property.rentPrice / property.sqft) * 100) / 100 : 0,
    selected: false,
    similarityScore: 0,
  }));

  return NextResponse.json(listings);
}
