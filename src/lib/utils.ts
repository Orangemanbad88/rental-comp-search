import { RentalProperty, SubjectProperty, SearchCriteria, RentalCompResult } from '@/types/property';

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Filter rental comps with custom criteria
 */
export function filterComps(
  properties: RentalProperty[],
  subject: SubjectProperty,
  criteria: SearchCriteria
): RentalCompResult[] {
  const now = new Date();
  const cutoffDate = new Date();
  cutoffDate.setMonth(now.getMonth() - criteria.dateRangeMonths);

  return properties
    .filter((property) => {
      // Status filter
      if (!criteria.includeActive && property.status === 'Active') return false;

      // Date range filter - use leaseDate if leased, listDate if active
      const relevantDate = property.leaseDate || property.listDate;
      if (relevantDate) {
        const date = new Date(relevantDate);
        if (date < cutoffDate) return false;
      }

      // Property type match
      if (criteria.propertyTypeMatch && property.propertyType !== subject.propertyType) {
        return false;
      }

      // Bedroom variance
      if (Math.abs(property.bedrooms - subject.bedrooms) > criteria.bedVariance) {
        return false;
      }

      // Bathroom variance
      if (Math.abs(property.bathrooms - subject.bathrooms) > criteria.bathVariance) {
        return false;
      }

      // Square footage variance
      const sqftDiff = Math.abs(property.sqft - subject.sqft) / subject.sqft;
      if (sqftDiff > criteria.sqftVariancePercent / 100) {
        return false;
      }

      // Distance filter
      if (subject.lat && subject.lng) {
        const distance = calculateDistance(subject.lat, subject.lng, property.lat, property.lng);
        if (distance > criteria.radiusMiles) return false;
      }

      return true;
    })
    .map((property) => ({
      ...property,
      distanceMiles: subject.lat && subject.lng
        ? calculateDistance(subject.lat, subject.lng, property.lat, property.lng)
        : 0,
      rentPerSqft: property.sqft > 0 ? Math.round((property.rentPrice / property.sqft) * 100) / 100 : 0,
      selected: false,
      similarityScore: 0,
    }));
}

/**
 * Search for comparable rentals with similarity scoring
 *
 * MUST MATCH:
 * - Property type (exact)
 * - Beds (+/- 1)
 * - Baths (+/- 1)
 *
 * FILTERS:
 * - Sqft: within 20%
 * - Date: last 12 months
 * - Distance: within 2 miles
 *
 * Returns top 15 sorted by similarity score
 */
export function searchComps(
  properties: RentalProperty[],
  subject: SubjectProperty
): RentalCompResult[] {
  const now = new Date();
  const cutoffDate = new Date();
  cutoffDate.setMonth(now.getMonth() - 12);

  const results = properties
    .filter((property) => {
      if (property.propertyType !== subject.propertyType) return false;
      if (Math.abs(property.bedrooms - subject.bedrooms) > 1) return false;
      if (Math.abs(property.bathrooms - subject.bathrooms) > 1) return false;

      const relevantDate = property.leaseDate || property.listDate;
      if (relevantDate) {
        const date = new Date(relevantDate);
        if (date < cutoffDate) return false;
      }

      const sqftDiff = Math.abs(property.sqft - subject.sqft) / subject.sqft;
      if (sqftDiff > 0.20) return false;

      if (subject.lat && subject.lng) {
        const distance = calculateDistance(subject.lat, subject.lng, property.lat, property.lng);
        if (distance > 2) return false;
      }

      return true;
    })
    .map((property) => {
      const distanceMiles = subject.lat && subject.lng
        ? calculateDistance(subject.lat, subject.lng, property.lat, property.lng)
        : 0;

      const similarityScore = calculateSimilarityScore(property, subject, distanceMiles);

      return {
        ...property,
        distanceMiles,
        rentPerSqft: property.sqft > 0 ? Math.round((property.rentPrice / property.sqft) * 100) / 100 : 0,
        selected: false,
        similarityScore,
      };
    })
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, 15);

  return results;
}

/**
 * Calculate rental similarity score (0-100)
 *
 * Scoring weights (tuned for rental market):
 * - Sqft difference: 25 points (closer = higher)
 * - Distance: 20 points (closer = higher)
 * - Bed match: 15 points (exact = 15, +/-1 = 7)
 * - Bath match: 10 points (exact = 10, +/-1 = 5)
 * - Recency: 10 points (more recent = higher, rentals move faster)
 * - Amenity match: 20 points (furnished, pets, W/D, pool, parking, garage)
 */
function calculateSimilarityScore(
  property: RentalProperty,
  subject: SubjectProperty,
  distanceMiles: number
): number {
  let score = 0;

  // Sqft similarity (25 points max)
  const sqftDiffPercent = Math.abs(property.sqft - subject.sqft) / subject.sqft;
  score += Math.max(0, 25 * (1 - sqftDiffPercent / 0.20));

  // Distance similarity (20 points max)
  score += Math.max(0, 20 * (1 - distanceMiles / 2));

  // Bedroom match (15 points max)
  const bedDiff = Math.abs(property.bedrooms - subject.bedrooms);
  if (bedDiff === 0) score += 15;
  else if (bedDiff === 1) score += 7;

  // Bathroom match (10 points max)
  const bathDiff = Math.abs(property.bathrooms - subject.bathrooms);
  if (bathDiff === 0) score += 10;
  else if (bathDiff <= 1) score += 5;

  // Recency (10 points max) — rental market moves faster, recency matters more
  const relevantDate = property.leaseDate || property.listDate;
  if (relevantDate) {
    const date = new Date(relevantDate);
    const daysSince = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    score += Math.max(0, 10 * (1 - daysSince / 365));
  }

  // Amenity match (20 points max)
  let amenityScore = 0;
  const amenityChecks = [
    { match: property.furnished === subject.furnished, weight: 4 },
    { match: property.petsAllowed === subject.petsAllowed, weight: 4 },
    { match: property.hasWasherDryer === subject.hasWasherDryer, weight: 4 },
    { match: property.hasPool === subject.hasPool, weight: 3 },
    { match: property.parkingSpaces >= subject.parkingSpaces, weight: 3 },
    { match: property.garageSpaces >= subject.garageSpaces, weight: 2 },
  ];
  for (const check of amenityChecks) {
    if (check.match) amenityScore += check.weight;
  }
  score += amenityScore;

  return Math.round(score);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatRent(amount: number): string {
  return `${formatCurrency(amount)}/mo`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
