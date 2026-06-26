'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet markers in Next.js
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface LocationPickerMapProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center[0] !== 0 && center[1] !== 0) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

function LocationMarker({ lat, lng, onChange }: LocationPickerMapProps) {
  const [position, setPosition] = useState<L.LatLng>(new L.LatLng(lat, lng));

  // Sync state if props change from outside
  useEffect(() => {
    setPosition(new L.LatLng(lat, lng));
  }, [lat, lng]);

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={icon} />
  );
}

export default function LocationPickerMap({ lat, lng, onChange }: LocationPickerMapProps) {
  // Use a slight delay to ensure window is ready and container has dimensions
  const [ready, setReady] = useState(false);
  
  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) return <div className="h-64 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl flex items-center justify-center text-slate-400">Loading map...</div>;

  return (
    <div className="h-64 sm:h-80 w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative z-0">
      <MapContainer 
        center={[lat, lng]} 
        zoom={15} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%' }}
      >
        <ChangeView center={[lat, lng]} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker lat={lat} lng={lng} onChange={onChange} />
      </MapContainer>
      <div className="absolute bottom-2 left-0 right-0 text-center z-[400] pointer-events-none">
        <span className="bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 text-xs px-3 py-1.5 rounded-full shadow-md backdrop-blur-sm pointer-events-auto">
          Tap anywhere on the map to place the pin
        </span>
      </div>
    </div>
  );
}
