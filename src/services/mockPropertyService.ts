import { SubjectProperty, RentalCompResult } from '@/types/property';

interface PropertyService {
  searchComps: (subject: SubjectProperty) => Promise<RentalCompResult[]>;
}

let instance: PropertyService | null = null;

export function getPropertyService(): PropertyService {
  if (instance) return instance;

  instance = {
    async searchComps(subject: SubjectProperty): Promise<RentalCompResult[]> {
      const response = await fetch('/api/listings');
      const listings: RentalCompResult[] = await response.json();

      // Apply filtering and scoring client-side for mock data
      const now = new Date();
      const cutoffDate = new Date();
      cutoffDate.setMonth(now.getMonth() - 12);

      return listings
        .filter((property) => {
          if (property.propertyType !== subject.propertyType) return false;
          if (Math.abs(property.bedrooms - subject.bedrooms) > 1) return false;
          if (Math.abs(property.bathrooms - subject.bathrooms) > 1) return false;

          const sqftDiff = Math.abs(property.sqft - subject.sqft) / subject.sqft;
          if (sqftDiff > 0.20) return false;

          return true;
        })
        .map((property) => ({
          ...property,
          similarityScore: calculateScore(property, subject),
        }))
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, 15);
    },
  };

  return instance;
}

function calculateScore(property: RentalCompResult, subject: SubjectProperty): number {
  let score = 0;
  const sqftDiff = Math.abs(property.sqft - subject.sqft) / subject.sqft;
  score += Math.max(0, 25 * (1 - sqftDiff / 0.20));
  score += Math.abs(property.bedrooms - subject.bedrooms) === 0 ? 15 : 7;
  score += Math.abs(property.bathrooms - subject.bathrooms) === 0 ? 10 : 5;
  if (property.furnished === subject.furnished) score += 4;
  if (property.petsAllowed === subject.petsAllowed) score += 4;
  if (property.hasWasherDryer === subject.hasWasherDryer) score += 4;
  if (property.hasPool === subject.hasPool) score += 3;
  score += 10; // recency placeholder
  return Math.round(score);
}
