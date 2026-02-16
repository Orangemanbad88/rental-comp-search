import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { RentalCompResult, SubjectProperty } from '@/types/property';
import { formatCurrency, formatDate } from './utils';

interface ExportData {
  subject: SubjectProperty;
  comps: RentalCompResult[];
  adjustments?: {
    [compId: string]: {
      bedroom: number;
      bathroom: number;
      sqft: number;
      condition: number;
      furnished: number;
      parking: number;
      pool: number;
      washerDryer: number;
      pets: number;
      other: number;
    };
  };
  indicatedRent?: number;
}

/**
 * Export rental comp analysis to PDF
 */
export function exportToPDF(data: ExportData): void {
  const { subject, comps, adjustments, indicatedRent } = data;
  const doc = new jsPDF('landscape');
  const pageWidth = doc.internal.pageSize.getWidth();

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Rental Comparable Analysis', pageWidth / 2, 15, { align: 'center' });

  // Subtitle
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Rent Survey Report — Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 22, { align: 'center' });

  // Subject Property
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Subject Property', 14, 35);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const amenities = [
    subject.furnished ? 'Furnished' : 'Unfurnished',
    subject.petsAllowed ? 'Pets OK' : 'No Pets',
    subject.hasWasherDryer ? 'W/D' : 'No W/D',
    subject.hasPool ? 'Pool' : 'No Pool',
    `${subject.parkingSpaces} Parking`,
    `${subject.garageSpaces} Garage`,
  ].join(' | ');

  const subjectInfo = [
    `Address: ${subject.address}, ${subject.city}, ${subject.state} ${subject.zip}`,
    `Type: ${subject.propertyType} | Beds: ${subject.bedrooms} | Baths: ${subject.bathrooms} | Sq Ft: ${subject.sqft.toLocaleString()} | Year: ${subject.yearBuilt}`,
    `Amenities: ${amenities}`,
  ];
  doc.text(subjectInfo, 14, 42);

  // Comparable Rentals Table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Comparable Rentals', 14, 62);

  const tableData = comps.map((comp, index) => [
    `Comp ${index + 1}`,
    comp.address,
    `${comp.city}, ${comp.state}`,
    comp.status,
    comp.leaseDate ? formatDate(comp.leaseDate) : formatDate(comp.listDate),
    `${formatCurrency(comp.rentPrice)}/mo`,
    `${comp.bedrooms}/${comp.bathrooms}`,
    comp.sqft.toLocaleString(),
    `$${comp.rentPerSqft}/sf`,
    `${comp.distanceMiles.toFixed(2)} mi`,
  ]);

  autoTable(doc, {
    startY: 66,
    head: [['#', 'Address', 'City/State', 'Status', 'Date', 'Rent', 'Bed/Bath', 'Sq Ft', '$/SF/Mo', 'Distance']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [114, 47, 55], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 40 },
      5: { halign: 'right' },
      7: { halign: 'right' },
      8: { halign: 'right' },
    },
  });

  // Adjustments Table
  if (adjustments && Object.keys(adjustments).length > 0) {
    const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 100;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Rent Adjustments', 14, finalY + 15);

    const adjTableData = comps.map((comp, index) => {
      const adj = adjustments[comp.id] || {
        bedroom: 0, bathroom: 0, sqft: 0, condition: 0,
        furnished: 0, parking: 0, pool: 0, washerDryer: 0, pets: 0, other: 0,
      };
      const totalAdj = Object.values(adj).reduce((sum, v) => sum + v, 0);
      const adjustedRent = comp.rentPrice + totalAdj;

      return [
        `Comp ${index + 1}`,
        `${formatCurrency(comp.rentPrice)}/mo`,
        formatAdjValue(adj.bedroom),
        formatAdjValue(adj.bathroom),
        formatAdjValue(adj.sqft),
        formatAdjValue(adj.condition),
        formatAdjValue(adj.furnished + adj.parking + adj.pool + adj.washerDryer + adj.pets),
        formatAdjValue(adj.other),
        formatAdjValue(totalAdj),
        `${formatCurrency(adjustedRent)}/mo`,
      ];
    });

    autoTable(doc, {
      startY: finalY + 19,
      head: [['#', 'Rent', 'Bedroom', 'Bathroom', 'Sq Ft', 'Condition', 'Amenities', 'Other', 'Net Adj.', 'Adjusted Rent']],
      body: adjTableData,
      theme: 'striped',
      headStyles: { fillColor: [114, 47, 55], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' },
        8: { halign: 'right' },
        9: { halign: 'right' },
      },
    });
  }

  // Indicated Market Rent
  if (indicatedRent) {
    const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 150;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Indicated Market Rent: ${formatCurrency(indicatedRent)}/month`, 14, finalY + 15);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Annual Rent: ${formatCurrency(indicatedRent * 12)}`, 14, finalY + 23);
  }

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Generated by RentAtlas — Rental Comparable Analysis Tool', pageWidth / 2, pageHeight - 10, { align: 'center' });

  const filename = `rent-analysis-${subject.address.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.pdf`;
  doc.save(filename);
}

/**
 * Export rental comp analysis to Excel
 */
export function exportToExcel(data: ExportData): void {
  const { subject, comps, adjustments, indicatedRent } = data;

  // Subject Property Sheet
  const subjectData = [
    ['SUBJECT PROPERTY — RENT SURVEY'],
    ['Address', subject.address],
    ['City', subject.city],
    ['State', subject.state],
    ['ZIP', subject.zip],
    ['Property Type', subject.propertyType],
    ['Bedrooms', subject.bedrooms],
    ['Bathrooms', subject.bathrooms],
    ['Sq Ft', subject.sqft],
    ['Year Built', subject.yearBuilt],
    [''],
    ['AMENITIES'],
    ['Furnished', subject.furnished ? 'Yes' : 'No'],
    ['Pets Allowed', subject.petsAllowed ? 'Yes' : 'No'],
    ['Washer/Dryer', subject.hasWasherDryer ? 'Yes' : 'No'],
    ['Pool', subject.hasPool ? 'Yes' : 'No'],
    ['Parking Spaces', subject.parkingSpaces],
    ['Garage Spaces', subject.garageSpaces],
    ['Utilities Included', subject.utilitiesIncluded ? 'Yes' : 'No'],
  ];

  // Comparable Rentals Sheet
  const compHeaders = [
    'Comp #', 'Address', 'City', 'State', 'ZIP', 'Status',
    'List Date', 'Lease Date', 'Monthly Rent', 'Bedrooms', 'Bathrooms',
    'Sq Ft', '$/SF/Mo', 'Year Built', 'Property Type', 'Distance (mi)',
    'Days on Market', 'Lease Term', 'Furnished', 'Pets', 'W/D',
    'Pool', 'Parking', 'Garage', 'Utilities Incl.', 'Similarity Score',
  ];

  const compData = comps.map((comp, index) => [
    index + 1, comp.address, comp.city, comp.state, comp.zip, comp.status,
    comp.listDate, comp.leaseDate, comp.rentPrice, comp.bedrooms, comp.bathrooms,
    comp.sqft, comp.rentPerSqft, comp.yearBuilt, comp.propertyType, comp.distanceMiles,
    comp.daysOnMarket, comp.leaseTerm,
    comp.furnished ? 'Yes' : 'No', comp.petsAllowed ? 'Yes' : 'No',
    comp.hasWasherDryer ? 'Yes' : 'No', comp.hasPool ? 'Yes' : 'No',
    comp.parkingSpaces, comp.garageSpaces,
    comp.utilitiesIncluded ? 'Yes' : 'No', comp.similarityScore,
  ]);

  // Adjustments Sheet
  const adjHeaders = [
    'Comp #', 'Address', 'Monthly Rent',
    'Bedroom Adj', 'Bathroom Adj', 'Sq Ft Adj', 'Condition Adj',
    'Furnished Adj', 'Parking Adj', 'Pool Adj', 'W/D Adj', 'Pets Adj', 'Other Adj',
    'Net Adjustment', 'Adjusted Rent',
  ];

  const adjData = comps.map((comp, index) => {
    const adj = adjustments?.[comp.id] || {
      bedroom: 0, bathroom: 0, sqft: 0, condition: 0,
      furnished: 0, parking: 0, pool: 0, washerDryer: 0, pets: 0, other: 0,
    };
    const totalAdj = Object.values(adj).reduce((sum, v) => sum + v, 0);
    const adjustedRent = comp.rentPrice + totalAdj;

    return [
      index + 1, comp.address, comp.rentPrice,
      adj.bedroom, adj.bathroom, adj.sqft, adj.condition,
      adj.furnished, adj.parking, adj.pool, adj.washerDryer, adj.pets, adj.other,
      totalAdj, adjustedRent,
    ];
  });

  if (indicatedRent) {
    adjData.push([]);
    adjData.push(['', '', '', '', '', '', '', '', '', '', '', '', '',
      'Indicated Market Rent:', indicatedRent]);
    adjData.push(['', '', '', '', '', '', '', '', '', '', '', '', '',
      'Annual Rent:', indicatedRent * 12]);
  }

  const wb = XLSX.utils.book_new();

  const wsSubject = XLSX.utils.aoa_to_sheet(subjectData);
  XLSX.utils.book_append_sheet(wb, wsSubject, 'Subject Property');

  const wsComps = XLSX.utils.aoa_to_sheet([compHeaders, ...compData]);
  XLSX.utils.book_append_sheet(wb, wsComps, 'Comparable Rentals');

  const wsAdj = XLSX.utils.aoa_to_sheet([adjHeaders, ...adjData]);
  XLSX.utils.book_append_sheet(wb, wsAdj, 'Rent Adjustments');

  wsComps['!cols'] = [
    { wch: 8 }, { wch: 30 }, { wch: 15 }, { wch: 8 }, { wch: 10 }, { wch: 10 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 },
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 12 },
    { wch: 12 }, { wch: 15 }, { wch: 10 }, { wch: 8 }, { wch: 8 },
    { wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
  ];

  const filename = `rent-analysis-${subject.address.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.xlsx`;
  XLSX.writeFile(wb, filename);
}

function formatAdjValue(value: number): string {
  if (value === 0) return '-';
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatCurrency(value)}`;
}
