import { useEffect } from 'react';
import { Locate, Plus, Minus } from 'lucide-react';
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

/** Auto-fit map bounds to show the full route using useMap */
function FitBounds({ restaurantPos, deliveryPos }: { restaurantPos: [number, number]; deliveryPos: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    try {
      const corner1: [number, number] = [
        Math.min(restaurantPos[0], deliveryPos[0]) - 0.01,
        Math.min(restaurantPos[1], deliveryPos[1]) - 0.01,
      ];
      const corner2: [number, number] = [
        Math.max(restaurantPos[0], deliveryPos[0]) + 0.01,
        Math.max(restaurantPos[1], deliveryPos[1]) + 0.01,
      ];
      map.fitBounds([corner1, corner2], { padding: [50, 50], maxZoom: 15 });
    } catch (e) {
      console.warn('FitBounds failed:', e);
    }
  }, [map, restaurantPos, deliveryPos]);
  return null;
}

function MapControls() {
  const map = useMap();
  return (
    <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
      <button onClick={() => map.locate({ setView: true })} className="w-10 h-10 rounded-xl bg-secondary/80 backdrop-blur-md border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors">
        <Locate className="w-4 h-4" />
      </button>
      <button onClick={() => map.zoomIn()} className="w-10 h-10 rounded-xl bg-secondary/80 backdrop-blur-md border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors">
        <Plus className="w-4 h-4" />
      </button>
      <button onClick={() => map.zoomOut()} className="w-10 h-10 rounded-xl bg-secondary/80 backdrop-blur-md border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors">
        <Minus className="w-4 h-4" />
      </button>
    </div>
  );
}

interface TrackingMapProps {
  restaurantPos: [number, number];
  deliveryPos: [number, number];
  routePoints: [number, number][];
  driverPos: [number, number];
}

export default function TrackingMap({ restaurantPos, deliveryPos, routePoints, driverPos }: TrackingMapProps) {
  const center: [number, number] = [
    (restaurantPos[0] + deliveryPos[0]) / 2,
    (restaurantPos[1] + deliveryPos[1]) / 2,
  ];

  return (
    <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        <FitBounds restaurantPos={restaurantPos} deliveryPos={deliveryPos} />
        <MapControls />
        <Polyline
          positions={routePoints}
          pathOptions={{ color: 'hsl(14, 100%, 56%)', weight: 4, dashArray: '12, 8', opacity: 0.9 }}
        />
        <CircleMarker center={restaurantPos} radius={7} pathOptions={{ color: 'hsl(14, 100%, 56%)', fillColor: 'hsl(14, 100%, 56%)', fillOpacity: 1, weight: 2 }} />
        <CircleMarker center={driverPos} radius={9} pathOptions={{ color: 'hsl(14, 100%, 56%)', fillColor: 'hsl(14, 100%, 70%)', fillOpacity: 1, weight: 3 }} />
        <CircleMarker center={deliveryPos} radius={7} pathOptions={{ color: 'hsl(0, 0%, 100%)', fillColor: 'hsl(0, 0%, 100%)', fillOpacity: 0.9, weight: 2 }} />
      </MapContainer>
    </div>
  );
}
