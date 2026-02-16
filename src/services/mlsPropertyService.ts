import { SubjectProperty, RentalCompResult } from '@/types/property';

interface PropertyService {
  searchComps: (subject: SubjectProperty) => Promise<RentalCompResult[]>;
}

let instance: PropertyService | null = null;

export function getMLSPropertyService(): PropertyService {
  if (instance) return instance;

  instance = {
    async searchComps(subject: SubjectProperty): Promise<RentalCompResult[]> {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, includeActive: true }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Search failed');
      }

      return response.json();
    },
  };

  return instance;
}
