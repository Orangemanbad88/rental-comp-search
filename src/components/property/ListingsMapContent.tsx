'use client';

import { useEffect, useState } from 'react';
import { RentalCompResult } from '@/types/property';
import { formatCurrency } from '@/lib/utils';

interface ListingsMapContentProps {
  listings: RentalCompResult[];
  onListingClick: (listing: RentalCompResult) => void;
}

export default function ListingsMapContent({ listings, onListingClick }: ListingsMapContentProps) {
  const [mounted, setMounted] = useState(false);
  const [MapComponents, setMapComponents] = useState<{
    MapContainer: React.ComponentType<any>;
    TileLayer: React.ComponentType<any>;
    CircleMarker: React.ComponentType<any>;
    Popup: React.ComponentType<any>;
    useMap: () => any;
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
        MapContainer: reactLeaflet.MapContainer,
        TileLayer: reactLeaflet.TileLayer,
        CircleMarker: reactLeaflet.CircleMarker,
        Popup: reactLeaflet.Popup,
        useMap: reactLeaflet.useMap,
      });
    });
  }, []);

  if (!mounted || !MapComponents) {
    return (
      <div className="h-full bg-slate-100 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600 mb-2"></div>
          <p className="text-slate-500 text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  const { MapContainer, TileLayer, CircleMarker, Popup, useMap } = MapComponents;

  const validListings = listings.filter(l => l.lat && l.lng);
  const centerLat = validListings.length > 0
    ? validListings.reduce((sum, l) => sum + l.lat, 0) / validListings.length
    : 28.0197;
  const centerLng = validListings.length > 0
    ? validListings.reduce((sum, l) => sum + l.lng, 0) / validListings.length
    : -82.7718;

  const FitBounds = ({ points }: { points: RentalCompResult[] }) => {
    const map = useMap();
    useEffect(() => {
      if (points.length > 0) {
        const bounds = points
          .filter(p => p.lat && p.lng)
          .map(p => [p.lat, p.lng] as [number, number]);
        if (bounds.length > 0) {
          map.fitBounds(bounds, { padding: [30, 30] });
        }
      }
    }, [map, points]);
    return null;
  };

  return (
    <div className="h-full rounded-xl overflow-hidden border border-slate-200">
      <MapContainer center={[centerLat, centerLng]} zoom={12} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={validListings} />
        {validListings.map((listing) => {
          const statusColor = listing.status === 'Leased' ? '#cbd5e1' : '#2dd4bf';
          const borderColor = listing.status === 'Leased' ? '#94a3b8' : '#0d9488';
          return (
            <CircleMarker
              key={listing.id}
              center={[listing.lat, listing.lng]}
              radius={7}
              pathOptions={{
                color: borderColor,
                fillColor: statusColor,
                fillOpacity: 0.7,
                weight: 1.5,
              }}
            >
              <Popup>
                <div className="text-sm p-1 min-w-[220px]">
                  <div className="font-semibold text-slate-900">{listing.address}</div>
                  <div className="text-slate-500 text-xs">{listing.city}, {listing.state} {listing.zip} · {listing.status}</div>
                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Rent</span>
                      <span className="font-bold text-slate-900">{formatCurrency(listing.rentPrice)}/mo</span>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-slate-500">Details</span>
                      <span className="text-slate-700">{listing.bedrooms}bd / {listing.bathrooms}ba · {listing.sqft.toLocaleString()} sf</span>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-slate-500">Year Built</span>
                      <span className="text-slate-700">{listing.yearBuilt}</span>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-slate-500">Lease Term</span>
                      <span className="text-slate-700">{listing.leaseTerm}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onListingClick(listing);
                    }}
                    className="mt-3 w-full py-1.5 text-xs font-semibold rounded-lg transition-colors bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200"
                  >
                    Use as Subject
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
