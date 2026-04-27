import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Bell, ShoppingBag, MapPin, X } from 'lucide-react';
import PreBiteLogo from '@/components/PreBiteLogo';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useLocationContext } from '@/context/LocationContext';

const navLinks = [
  { path: '/browse', label: 'Browse' },
  { path: '/schedule', label: 'Schedule' },
  { path: '/planner', label: 'Meal Planner' },
  { path: '/favorites', label: 'Favorites' },
  { path: '/orders', label: 'Orders' },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const { totalItems } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { location: userLoc, clearLocation, isLocationReady } = useLocationContext();

  const locationLabel = userLoc?.address
    ? `${userLoc.address}${userLoc.city ? `, ${userLoc.city}` : ''}`
    : 'Set location';

  useEffect(() => {
    setSearchTerm(searchParams.get('q') || '');
  }, [searchParams]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchTerm.trim();
    navigate(query ? `/browse?q=${encodeURIComponent(query)}` : '/browse');
  };

  const clearSearch = () => {
    setSearchTerm('');
    if (location.pathname === '/browse' && searchParams.get('q')) {
      navigate('/browse');
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-glass-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
          {/* Logo + Location */}
          <div className="flex items-center gap-3">
            <Link to="/browse" className="flex items-center gap-0">
              <PreBiteLogo size={28} />
              <span className="text-lg font-bold text-foreground">
                Pre<span className="text-primary">Bite</span>
              </span>
            </Link>

            {isLocationReady && (
              <button
                onClick={clearLocation}
                className="hidden sm:flex items-center gap-1.5 text-xs glass-card px-3 py-1.5 max-w-[200px]"
              >
                <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
                <span className="truncate text-foreground">{locationLabel}</span>
              </button>
            )}
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search for biryani, dosa, burgers..."
                className="glass-input w-full pl-10 pr-10 py-2 text-sm rounded-full"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>

          {/* Nav Links (desktop) */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 text-sm font-medium transition-colors relative ${
                  location.pathname === link.path
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {link.label}
                {location.pathname === link.path && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
            </button>

            {isAuthenticated && (
              <Link to="/profile" className="w-8 h-8 rounded-full bg-secondary overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-primary/50 to-accent/50" />
              </Link>
            )}

            <Link
              to="/cart"
              className="relative p-2 bg-primary rounded-xl text-primary-foreground hover:brightness-110 transition-all"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground text-xs font-bold rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
