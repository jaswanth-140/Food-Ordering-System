import { useState, useEffect } from 'react';
import { useLocation as useRouterLocation } from 'react-router-dom';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { useLocationContext } from '@/context/LocationContext';
import { useAuth } from '@/context/AuthContext';
import { searchAddress } from '@/hooks/useLocation';

export default function LocationPermissionOverlay() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { location, requestLocation, setManualLocation, isLocationReady } = useLocationContext();
  const [showManual, setShowManual] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [visible, setVisible] = useState(true);

  // Only auto-request location AFTER user is authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated && !isLocationReady && (!location || location.status === 'idle')) {
      requestLocation();
    }
  }, [authLoading, isAuthenticated]);

  // Fade out when ready
  useEffect(() => {
    if (isLocationReady) {
      const t = setTimeout(() => setVisible(false), 400);
      return () => clearTimeout(t);
    }
  }, [isLocationReady]);

  const routerLocation = useRouterLocation();

  // Don't show overlay until user is authenticated
  if (authLoading || !isAuthenticated) return null;

  // Don't block the tracking page or orders page
  if (routerLocation.pathname.startsWith('/tracking')) return null;

  if (!visible) return null;

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await searchAddress(query);
      setResults(res);
    } catch { /* ignore */ }
    setSearching(false);
  };

  const handleSelect = async (r: any) => {
    await setManualLocation(parseFloat(r.lat), parseFloat(r.lon), r.display_name?.split(',')[0]);
  };

  const isRequesting = location?.status === 'requesting';
  const isDenied = location?.status === 'denied';

  return (
    <div
      className={`fixed inset-0 z-[100] bg-background flex items-center justify-center transition-opacity duration-400 ${
        isLocationReady ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Animated gradient blob */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="relative z-10 max-w-md w-full px-6 text-center">
        {/* Pulsing location pin */}
        <div className="relative w-20 h-20 mx-auto mb-8">
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
          <div className="absolute inset-2 bg-primary/30 rounded-full animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <MapPin className="w-10 h-10 text-primary" />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-foreground mb-3">Find food near you</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          PreBite uses your location to show real restaurants, accurate delivery times, and menus near you.
        </p>

        {!showManual ? (
          <div className="space-y-3">
            <button
              onClick={requestLocation}
              disabled={isRequesting}
              className="coral-button w-full flex items-center justify-center gap-2"
            >
              {isRequesting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Detecting location...
                </>
              ) : (
                <>
                  <MapPin className="w-5 h-5" />
                  Allow Location Access
                </>
              )}
            </button>

            {isDenied && (
              <p className="text-sm text-destructive">
                Location access denied. Please enter your location manually.
              </p>
            )}

            <button
              onClick={() => setShowManual(true)}
              className="ghost-button w-full"
            >
              Enter location manually
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Search city, area, or address..."
                  className="glass-input w-full pl-10 py-3 text-sm rounded-xl"
                  autoFocus
                />
              </div>
              <button onClick={handleSearch} disabled={searching} className="coral-button px-5">
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
              </button>
            </div>

            {results.length > 0 && (
              <div className="glass-card divide-y divide-glass-border max-h-60 overflow-y-auto text-left">
                {results.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelect(r)}
                    className="w-full px-4 py-3 text-sm text-foreground hover:bg-glass transition-colors flex items-start gap-2"
                  >
                    <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{r.display_name}</span>
                  </button>
                ))}
              </div>
            )}

            <button onClick={() => { setShowManual(false); setResults([]); }} className="text-sm text-muted-foreground hover:text-foreground">
              ← Back to auto-detect
            </button>
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-6">🔒 We never store or share your location</p>
      </div>
    </div>
  );
}
