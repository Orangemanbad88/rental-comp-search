'use client';

import { useEffect, useState } from 'react';
import { SubjectProperty, RentalCompResult } from '@/types/property';
import { formatCurrency } from '@/lib/utils';

// Florida / Dunedin area city coordinates
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'Dunedin': { lat: 28.0197, lng: -82.7718 },
  'Clearwater': { lat: 27.9659, lng: -82.8001 },
  'Palm Harbor': { lat: 28.0781, lng: -82.7637 },
  'Safety Harbor': { lat: 27.9917, lng: -82.6929 },
  'Oldsmar': { lat: 28.0342, lng: -82.6651 },
  'Tarpon Springs': { lat: 28.1461, lng: -82.7568 },
  'Largo': { lat: 27.9095, lng: -82.7873 },
  'Pinellas Park': { lat: 27.8428, lng: -82.6993 },
  'St Petersburg': { lat: 27.7676, lng: -82.6403 },
  'Tampa': { lat: 27.9506, lng: -82.4572 },
  'Seminole': { lat: 27.8397, lng: -82.7912 },
  'Indian Rocks Beach': { lat: 27.8836, lng: -82.8526 },
};

function findNearestCity(lat: number, lng: number): string {
  let nearest = 'Dunedin';
  let minDist = Infinity;
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    const d = Math.sqrt((lat - coords.lat) ** 2 + (lng - coords.lng) ** 2);
    if (d < minDist) { minDist = d; nearest = city; }
  }
  return nearest;
}

interface SubjectMapContentProps {
  subject: SubjectProperty | null;
  onLocationSelect: (updates: Partial<SubjectProperty>) => void;
  listings?: RentalCompResult[];
}

export default function SubjectMapContent({ subject, onLocationSelect, listings = [] }: SubjectMapContentProps) {
  const [mounted, setMounted] = useState(false);
  const [MapComps, setMapComps] = useState<{
    MapContainer: React.ComponentType<any>;
    TileLayer: React.ComponentType<any>;
    Marker: React.ComponentType<any>;
    Popup: React.ComponentType<any>;
    CircleMarker: React.ComponentType<any>;
    useMapEvents: any;
  } | null>(null);
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(
    subject?.lat && subject?.lng ? [subject.lat, subject.lng] : null
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    Promise.all([import('react-leaflet'), import('leaflet')]).then(([rl, L]) => {
      delete (L.default.Icon.Default.prototype as any)._getIconUrl;
      L.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });
      setMapComps({
        MapContainer: rl.MapContainer,
        TileLayer: rl.TileLayer,
        Marker: rl.Marker,
        Popup: rl.Popup,
        CircleMarker: rl.CircleMarker,
        useMapEvents: rl.useMapEvents,
      });
    });
  }, []);

  if (!mounted || !MapComps) {
    return (
      <div className="h-52 bg-cream-dark dark:bg-[#1E293B] rounded-lg flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-walnut/20 dark:border-gold/20 border-t-burgundy dark:border-t-gold"></div>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMapEvents } = MapComps;

  const centerLat = subject?.lat || 28.0197;
  const centerLng = subject?.lng || -82.7718;

  const mappableListings = listings.filter(l => l.lat !== 0 && l.lng !== 0);

  async function handleMapClick(lat: number, lng: number) {
    setMarkerPos([lat, lng]);
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'User-Agent': 'RentAtlas/1.0' } }
      );
      const data = await res.json();
      const addr = data.address || {};
      onLocationSelect({
        address: [addr.house_number, addr.road].filter(Boolean).join(' ') || '',
        city: findNearestCity(lat, lng),
        zip: addr.postcode || '',
        lat,
        lng,
      });
    } catch {
      onLocationSelect({ city: findNearestCity(lat, lng), lat, lng });
    } finally {
      setLoading(false);
    }
  }

  function handleListingClick(listing: RentalCompResult) {
    const lat = listing.lat;
    const lng = listing.lng;
    if (lat && lng) setMarkerPos([lat, lng]);
    onLocationSelect({
      address: listing.address,
      city: findNearestCity(lat || centerLat, lng || centerLng),
      zip: listing.zip,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      sqft: listing.sqft,
      yearBuilt: listing.yearBuilt,
      propertyType: listing.propertyType,
      photos: listing.photos,
      lat,
      lng,
      furnished: listing.furnished,
      petsAllowed: listing.petsAllowed,
      parkingSpaces: listing.parkingSpaces,
      garageSpaces: listing.garageSpaces,
      hasPool: listing.hasPool,
      hasWasherDryer: listing.hasWasherDryer,
      utilitiesIncluded: listing.utilitiesIncluded,
    });
  }

  function ClickHandler() {
    useMapEvents({
      click: (e: any) => handleMapClick(e.latlng.lat, e.latlng.lng),
    });
    return null;
  }

  return (
    <div className="relative">
      <div className="h-52 rounded-lg overflow-hidden border border-walnut/10 dark:border-gold/10">
        <MapContainer center={[centerLat, centerLng]} zoom={12} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler />

          {markerPos && (
            <Marker position={markerPos}>
              <Popup><span className="text-xs font-semibold">Subject</span></Popup>
            </Marker>
          )}

          {mappableListings.map((listing) => (
            <CircleMarker
              key={listing.id}
              center={[listing.lat, listing.lng]}
              radius={6}
              pathOptions={{
                color: '#10b981',
                fillColor: '#10b981',
                fillOpacity: 0.8,
                weight: 2,
              }}
              eventHandlers={{ click: () => handleListingClick(listing) }}
            >
              <Popup>
                <div className="text-xs min-w-[160px]">
                  <div className="font-semibold">{listing.address}</div>
                  <div className="text-slate-500">{listing.city}</div>
                  <div className="font-bold text-emerald-600 mt-1">{formatCurrency(listing.rentPrice)}/mo</div>
                  <div className="text-slate-500">{listing.bedrooms}bd / {listing.bathrooms}ba / {listing.sqft.toLocaleString()} sf</div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleListingClick(listing); }}
                    className="mt-2 w-full py-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded transition-colors"
                  >
                    Use as Subject
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {loading && (
        <div className="absolute inset-0 bg-cream/50 dark:bg-[#0F172A]/50 rounded-lg flex items-center justify-center backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm text-walnut dark:text-cream/70">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-walnut/20 dark:border-gold/20 border-t-burgundy dark:border-t-gold"></div>
            Locating...
          </div>
        </div>
      )}

      <p className="text-[10px] text-walnut/40 dark:text-cream/30 mt-1.5 text-center">
        Click map or a listing marker to set subject
      </p>
    </div>
  );
}
