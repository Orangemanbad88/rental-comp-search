'use client';

import { useState } from 'react';
import { RentalCompResult, SubjectProperty } from '@/types/property';
import { exportToPDF, exportToExcel } from '@/lib/export';
import { cn } from '@/lib/utils';

interface ExportButtonsProps {
  subject: SubjectProperty;
  comps: RentalCompResult[];
  adjustments?: {
    [compId: string]: {
      bedroom: number; bathroom: number; sqft: number; condition: number;
      furnished: number; parking: number; pool: number; washerDryer: number; pets: number; other: number;
    };
  };
  indicatedRent?: number;
}

export function ExportButtons({ subject, comps, adjustments, indicatedRent }: ExportButtonsProps) {
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);

  const handleExportPDF = async () => {
    setExporting('pdf');
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      exportToPDF({ subject, comps, adjustments, indicatedRent });
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExporting(null);
    }
  };

  const handleExportExcel = async () => {
    setExporting('excel');
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      exportToExcel({ subject, comps, adjustments, indicatedRent });
    } catch (error) {
      console.error('Excel export failed:', error);
      alert('Failed to export Excel. Please try again.');
    } finally {
      setExporting(null);
    }
  };

  if (comps.length === 0) return null;

  const buttonBase = "inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={handleExportPDF} disabled={exporting !== null}
        className={cn(buttonBase, "bg-walnut-dark/50 border border-gold/20 text-gold-light hover:bg-walnut-dark/70 hover:border-gold/40")}>
        {exporting === 'pdf' ? (
          <><span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-gold/30 border-t-gold"></span><span>Exporting...</span></>
        ) : (
          <><svg className="h-4 w-4 text-burgundy-light" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4z"/></svg><span>PDF</span></>
        )}
      </button>
      <button onClick={handleExportExcel} disabled={exporting !== null}
        className={cn(buttonBase, "bg-walnut-dark/50 border border-gold/20 text-gold-light hover:bg-walnut-dark/70 hover:border-gold/40")}>
        {exporting === 'excel' ? (
          <><span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-gold/30 border-t-gold"></span><span>Exporting...</span></>
        ) : (
          <><svg className="h-4 w-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM8 13h2l1 2.5 1-2.5h2l-2 4 2 4h-2l-1-2.5-1 2.5H8l2-4-2-4z"/></svg><span>Excel</span></>
        )}
      </button>
    </div>
  );
}
