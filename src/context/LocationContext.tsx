import { createContext, useContext, ReactNode } from 'react';
import { useLocation as useLocationHook, type UserLocation } from '@/hooks/useLocation';

interface LocationContextType {
  location: UserLocation | null;
  requestLocation: () => void;
  setManualLocation: (lat: number, lng: number, displayName?: string) => Promise<void>;
  clearLocation: () => void;
  isLocationReady: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const { location, requestLocation, setManualLocation, clearLocation } = useLocationHook();

  const isLocationReady = !!location && (location.status === 'granted' || location.status === 'manual');

  return (
    <LocationContext.Provider value={{ location, requestLocation, setManualLocation, clearLocation, isLocationReady }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocationContext must be used within LocationProvider');
  return ctx;
}
