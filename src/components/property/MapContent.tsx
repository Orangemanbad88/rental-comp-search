'use client';

import { useEffect, useState } from 'react';
import { RentalCompResult, SubjectProperty } from '@/types/property';
import { formatCurrency } from '@/lib/utils';

interface MapContentProps {
  subject: SubjectProperty;
  comps: RentalCompResult[];
  selectedComps: RentalCompResult[];
  onToggleSelect: (id: string) => void;
}

export default function MapContent({ subject, comps, selectedComps, onToggleSelect }: MapContentProps) {
  const [mounted, setMounted] = useState(false);
  const [MapComponents, setMapComponents] = useState<{
    MapContainer: React.ComponentType<any>;
    TileLayer: React.ComponentType<any>;
    Marker: React.ComponentType<any>;
    Popup: React.ComponentType<any>;
    CircleMarker: React.ComponentType<any>;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
    Promise.all([import('react-leaflet'), import('leaflet')]).then(([reactLeaflet, L]) => {
      delete (L.default.Icon.Default.prototype as any)._getIconUrl;
      L.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });
      setMapComponents({
        MapContainer: reactLeaflet.MapContainer, TileLayer: reactLeaflet.TileLayer,
        Marker: reactLeaflet.Marker, Popup: reactLeaflet.Popup, CircleMarker: reactLeaflet.CircleMarker,
      });
    });
  }, []);

  if (!mounted || !MapComponents) {
    return (
      <div className="h-64 bg-slate-100 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600 mb-2"></div>
          <p className="text-slate-500 text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, CircleMarker } = MapComponents;
  const subjectLat = subject.lat || 39.08;
  const subjectLng = subject.lng || -74.80;
  const selectedIds = new Set(selectedComps.map(c => c.id));

  // Filter out comps with no valid coordinates
  const mappableComps = comps.filter(c => c.lat !== 0 && c.lng !== 0);

  return (
    <div className="h-80 rounded-xl overflow-hidden border border-walnut/10 dark:border-gold/10">
      <MapContainer center={[subjectLat, subjectLng]} zoom={11} className="h-full w-full">
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {subjectLat !== 0 && subjectLng !== 0 && (
          <Marker position={[subjectLat, subjectLng]}>
            <Popup>
              <div className="text-sm p-1">
                <div className="font-bold text-blue-600 text-xs uppercase tracking-wide mb-1">Subject Property</div>
                <div className="font-semibold text-slate-900">{subject.address || 'Subject Property'}</div>
                <div className="text-slate-500 text-xs mt-1">{subject.bedrooms} bed · {subject.bathrooms} bath · {subject.sqft.toLocaleString()} sqft</div>
              </div>
            </Popup>
          </Marker>
        )}
        {mappableComps.map((comp) => {
          const isSelected = selectedIds.has(comp.id);
          const statusColor = comp.status === 'Leased' ? (isSelected ? '#10b981' : '#6b7280') : (isSelected ? '#3b82f6' : '#94a3b8');
          return (
            <CircleMarker key={comp.id} center={[comp.lat, comp.lng]} radius={isSelected ? 10 : 7}
              pathOptions={{ color: statusColor, fillColor: statusColor, fillOpacity: 0.9, weight: 2 }}
              eventHandlers={{ click: () => onToggleSelect(comp.id) }}>
              <Popup>
                <div className="text-sm p-1 min-w-[200px]">
                  <div className="font-semibold text-slate-900">{comp.address}</div>
                  <div className="text-slate-500 text-xs">{comp.city}, {comp.state} · {comp.status}</div>
                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Price</span>
                      <span className="font-bold text-slate-900">{formatCurrency(comp.rentPrice)}</span>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-slate-500">Details</span>
                      <span className="text-slate-700">{comp.bedrooms}bd / {comp.bathrooms}ba · {comp.sqft.toLocaleString()} sf</span>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-slate-500">Distance</span>
                      <span className="text-slate-700">{comp.distanceMiles.toFixed(2)} mi</span>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); onToggleSelect(comp.id); }}
                    className={`mt-3 w-full py-1.5 text-xs font-semibold rounded-lg transition-colors ${isSelected ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>
                    {isSelected ? 'Remove Selection' : 'Select Comp'}
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
