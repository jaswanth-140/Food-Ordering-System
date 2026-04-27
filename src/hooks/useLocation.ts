import { useState, useCallback } from 'react';

export interface UserLocation {
  lat: number;
  lng: number;
  address: string;
  city: string;
  country: string;
  status: 'idle' | 'requesting' | 'granted' | 'denied' | 'manual';
  savedAt?: number;
}

const STORAGE_KEY = 'prebite_location';
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

function loadSaved(): UserLocation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserLocation;
    if (parsed.savedAt && Date.now() - parsed.savedAt < MAX_AGE_MS) {
      return { ...parsed, status: 'granted' };
    }
  } catch { /* ignore */ }
  return null;
}

async function reverseGeocode(lat: number, lng: number) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
    { headers: { 'Accept-Language': 'en', 'User-Agent': 'PreBite/1.0' } }
  );
  const data = await res.json();
  return data.address || {};
}

export async function searchAddress(query: string) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`,
    { headers: { 'Accept-Language': 'en', 'User-Agent': 'PreBite/1.0' } }
  );
  return res.json();
}

export function useLocation() {
  const [location, setLocation] = useState<UserLocation | null>(loadSaved);

  const requestLocation = useCallback(() => {
    setLocation(prev => ({ lat: 0, lng: 0, address: '', city: '', country: '', ...prev, status: 'requesting' }));

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const geo = await reverseGeocode(lat, lng);
        const newLoc: UserLocation = {
          lat,
          lng,
          address: geo.suburb || geo.neighbourhood || geo.county || geo.city || '',
          city: geo.city || geo.town || geo.village || geo.state || '',
          country: geo.country || '',
          status: 'granted',
          savedAt: Date.now(),
        };
        setLocation(newLoc);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newLoc));
      },
      () => {
        setLocation(prev => ({ lat: 0, lng: 0, address: '', city: '', country: '', ...prev, status: 'denied' }));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const setManualLocation = useCallback(async (lat: number, lng: number, displayName?: string) => {
    const geo = await reverseGeocode(lat, lng);
    const newLoc: UserLocation = {
      lat,
      lng,
      address: displayName || geo.suburb || geo.neighbourhood || geo.city || '',
      city: geo.city || geo.town || geo.village || '',
      country: geo.country || '',
      status: 'manual',
      savedAt: Date.now(),
    };
    setLocation(newLoc);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newLoc));
  }, []);

  const clearLocation = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setLocation(null);
  }, []);

  return { location, requestLocation, setManualLocation, clearLocation };
}
