'use client';

import dynamic from 'next/dynamic';
import { SubjectProperty, RentalCompResult } from '@/types/property';

interface SubjectMapProps {
  subject: SubjectProperty | null;
  onLocationSelect: (updates: Partial<SubjectProperty>) => void;
  listings?: RentalCompResult[];
}

const SubjectMapContent = dynamic(() => import('./SubjectMapContent'), {
  ssr: false,
  loading: () => (
    <div className="h-52 bg-cream-dark dark:bg-[#111118] rounded-lg flex items-center justify-center border border-walnut/10 dark:border-gold/10">
      <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-walnut/20 dark:border-gold/20 border-t-burgundy dark:border-t-gold"></div>
    </div>
  ),
});

export function SubjectMap({ subject, onLocationSelect, listings = [] }: SubjectMapProps) {
  return (
    <SubjectMapContent
      subject={subject}
      onLocationSelect={onLocationSelect}
      listings={listings}
    />
  );
}
