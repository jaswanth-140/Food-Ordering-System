import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, ChevronDown, Loader2, MapPin, Star } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import CuisineCategoryBar from '@/components/browse/CuisineCategoryBar';
import { useCart } from '@/context/CartContext';
import { useLocationContext } from '@/context/LocationContext';
import { curatedDishes } from '@/data/curatedDishes';
import { formatPrice, restaurants as seedRestaurants } from '@/data/seed';
import type { MenuItem } from '@/types';
import { getRestaurantExterior } from '@/utils/photos';

interface LiveRestaurant {
  id: string;
  name: string;
  cuisine: string[];
  rating: number;
  reviewCount: number;
  deliveryTime: string;
  deliveryFee: number;
  distanceKm: number;
  distanceLabel: string;
  imageUrl: string;
  priceLevel: string;
  badge?: string;
  address: string;
}

interface LiveCategory {
  id: string;
  label: string;
  emoji: string;
  count: number;
}

interface FeaturedMenuEntry {
  item: MenuItem;
  restaurant: LiveRestaurant;
}

const DEFAULT_CATEGORIES: LiveCategory[] = [
  { id: 'all', label: 'All', emoji: '', count: 0 },
  { id: 'indian', label: 'Indian', emoji: '', count: 0 },
  { id: 'regional', label: 'Regional', emoji: '', count: 0 },
  { id: 'burger', label: 'Burger', emoji: '', count: 0 },
  { id: 'chicken', label: 'Chicken', emoji: '', count: 0 },
  { id: 'chinese', label: 'Chinese', emoji: '', count: 0 },
  { id: 'pizza', label: 'Pizza', emoji: '', count: 0 },
  { id: 'sandwich', label: 'Sandwich', emoji: '', count: 0 },
  { id: 'breakfast', label: 'Breakfast', emoji: '', count: 0 },
  { id: 'meals', label: 'Meals', emoji: '', count: 0 },
  { id: 'kebab', label: 'Kebab', emoji: '', count: 0 },
  { id: 'ice cream', label: 'Ice cream', emoji: '', count: 0 },
];

const STATIC_DISH_RESTAURANT: LiveRestaurant = {
  id: 'curated-dishes',
  name: 'Popular Dishes',
  cuisine: ['Popular'],
  rating: 4.5,
  reviewCount: 500,
  deliveryTime: '20-30 min',
  deliveryFee: 0,
  distanceKm: 0,
  distanceLabel: 'nearby',
  imageUrl: '',
  priceLevel: '$$',
  address: 'Bandlaguda, Hyderabad',
};

function normalizeSearchText(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, ' ');
}

function includesSearch(value: string, query: string): boolean {
  return normalizeSearchText(value).includes(query);
}

const USE_SEED_DATA = true; // Toggle this to false when lovable cloud backend is fixed

export default function BrowsePage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchParams] = useSearchParams();
  const { addItem, totalItems, subtotal } = useCart();
  const { location, isLocationReady, clearLocation } = useLocationContext();
  const [restaurants, setRestaurants] = useState<LiveRestaurant[]>([]);
  const [categories, setCategories] = useState<LiveCategory[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCitywide, setIsCitywide] = useState(false);

  useEffect(() => {
    if (!isLocationReady || !location) return;

    const controller = new AbortController();

    const fetchRestaurants = async () => {
      setLoading(true);
      setError(null);

      if (USE_SEED_DATA) {
        const mappedSeedRestaurants = seedRestaurants.map((r) => ({
          id: r.id,
          name: r.name,
          cuisine: r.cuisine,
          address: 'Popular Area, Local City',
          lat: location.lat,
          lng: location.lng,
          distanceKm: r.distance,
          distanceLabel: `${r.distance} km`,
          deliveryTime: r.deliveryTime,
          imageUrl: r.imageUrl,
          rating: r.rating,
          reviewCount: r.reviewCount,
          deliveryFee: r.deliveryFee,
          priceLevel: r.priceLevel,
          badge: r.badge,
        }));
        setRestaurants(mappedSeedRestaurants);
        setIsCitywide(true);
        setLoading(false);
        return;
      }

      try {
        const params = new URLSearchParams({
          lat: String(location.lat),
          lng: String(location.lng),
          radius: '10000',
        });

        if (activeCategory !== 'all') {
          params.set('cuisine', activeCategory);
        }

        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nearby-restaurants?${params}`,
          {
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            signal: controller.signal,
          }
        );

        if (!res.ok) throw new Error(`Nearby restaurants failed: ${res.status}`);
        const result = await res.json();
        setRestaurants(result.restaurants || []);
        setIsCitywide(result.isCitywide || false);
        if (!controller.signal.aborted) setLoading(false);
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          console.error('Failed to fetch restaurants:', fetchError);
          setError('Could not load restaurants. Please try again.');
          setLoading(false);
        }
      } 
    };

    fetchRestaurants();

    return () => controller.abort();
  }, [activeCategory, isLocationReady, location?.lat, location?.lng]);

  useEffect(() => {
    if (!isLocationReady || !location) return;

    const cacheKey = 'cuisine_categories';
    const cacheTtl = 10 * 60 * 1000;

    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { categories: cachedCategories, ts } = JSON.parse(cached);
        if (Array.isArray(cachedCategories) && cachedCategories.length > 1 && Date.now() - ts < cacheTtl) {
          setCategories(cachedCategories);
        }
      }
    } catch {
      // Keep default categories if the browser cache is unavailable.
    }

    const controller = new AbortController();

    const fetchCategories = async () => {
      try {
        const params = new URLSearchParams({
          lat: String(location.lat),
          lng: String(location.lng),
        });

        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cuisine-categories?${params}`,
          {
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            signal: controller.signal,
          }
        );

        if (!res.ok) return;

        const result = await res.json();
        if (result.categories?.length > 1) {
          const incoming = result.categories as LiveCategory[];
          const withAll = incoming.some((cat) => cat.id === 'all')
            ? incoming
            : [{ id: 'all', label: 'All', emoji: '', count: 0 }, ...incoming];

          setCategories(withAll);

          try {
            localStorage.setItem(cacheKey, JSON.stringify({ categories: withAll, ts: Date.now() }));
          } catch {
            // Ignore storage failures.
          }
        }
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          console.error('Failed to fetch categories:', fetchError);
        }
      }
    };

    fetchCategories();

    return () => controller.abort();
  }, [isLocationReady, location?.lat, location?.lng]);

  const locationLabel = location?.address
    ? `${location.address}${location.city ? `, ${location.city}` : ''}`
    : 'Set your location';

  const searchQuery = normalizeSearchText(searchParams.get('q') || '');

  const featuredItems = useMemo<FeaturedMenuEntry[]>(() => {
    const sourceRestaurants = restaurants.length > 0 ? restaurants : [STATIC_DISH_RESTAURANT];

    return curatedDishes
      .filter((dish) => {
        if (!searchQuery) return true;

        return includesSearch(
          `${dish.name} ${dish.category} ${dish.description}`,
          searchQuery
        );
      })
      .map((dish, index) => {
        const restaurant = sourceRestaurants[index % sourceRestaurants.length];

        return {
          restaurant,
          item: {
            ...dish,
            id: `${restaurant.id}-${dish.id}`,
            restaurantId: restaurant.id,
          },
        };
      });
  }, [restaurants, searchQuery]);

  const visibleRestaurants = useMemo(() => {
    if (!searchQuery) return restaurants;

    return restaurants.filter((restaurant) =>
      includesSearch(
        `${restaurant.name} ${restaurant.cuisine.join(' ')} ${restaurant.address}`,
        searchQuery
      )
    );
  }, [restaurants, searchQuery]);

  const hasSearchResults = featuredItems.length > 0 || visibleRestaurants.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground mb-4">
          What are you craving today?
        </h1>

        <button
          onClick={clearLocation}
          className="flex items-center gap-2 glass-card px-4 py-2 mb-8 text-sm"
        >
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">Delivering to</span>
          <span className="font-semibold text-foreground truncate max-w-[200px]">{locationLabel}</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>

        <CuisineCategoryBar
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        {searchQuery && (
          <div className="mb-8">
            <p className="text-sm text-muted-foreground">
              Showing results for <span className="font-semibold text-foreground">"{searchParams.get('q')}"</span>
            </p>
          </div>
        )}

        {featuredItems.length > 0 && (
          <section className="mb-12">
            <div className="mb-8 max-w-4xl">
              <p className="text-[11px] uppercase tracking-[0.35em] text-primary/80 mb-3">
                Curated For You
              </p>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[0.95] text-[#f5d8cb] tracking-tight">
                {searchQuery ? 'Matching Dishes' : 'Most Ordered Dishes Near You'}
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {featuredItems.map(({ item, restaurant }) => (
                <Link
                  key={item.id}
                  to={restaurant.id === STATIC_DISH_RESTAURANT.id ? '/browse' : `/restaurant/${restaurant.id}`}
                  state={{ restaurant }}
                  className="group w-full min-w-0 h-[262px] overflow-hidden rounded-[20px] border border-[#5a4036] bg-[#2a1710] shadow-[0_18px_40px_rgba(0,0,0,0.2)] flex flex-col"
                >
                  <div className="relative h-[180px] overflow-hidden bg-[radial-gradient(circle_at_top,#4b362e_0%,#21120d_68%)]">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover scale-[1.08] transition-transform duration-300 group-hover:scale-[1.14]"
                      loading="lazy"
                      onError={(event) => {
                        const image = event.currentTarget;
                        if (image.dataset.fallbackApplied) return;
                        image.dataset.fallbackApplied = 'true';
                        image.src = '/dishes/chicken-biryani.jpg';
                      }}
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#f8b633] px-2 py-1 text-[10px] font-bold text-[#2a1710]">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        {restaurant.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5 flex-1 flex flex-col justify-between">
                    <h3 className="font-bold text-[0.9rem] text-[#f7e0d6] truncate leading-tight mb-2">
                      {item.name}
                    </h3>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-primary font-extrabold text-[1.55rem] leading-none">
                        {formatPrice(item.price)}
                      </span>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          addItem(item);
                        }}
                        className="w-9 h-9 rounded-full bg-primary text-primary-foreground text-[1.45rem] leading-none flex items-center justify-center shadow-[0_10px_20px_rgba(255,90,31,0.28)] hover:scale-105 transition-transform"
                        aria-label={`Add ${item.name}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="ml-3 text-muted-foreground">Finding restaurants near you...</span>
          </div>
        )}

        {searchQuery && !loading && !hasSearchResults && (
          <div className="glass-card p-8 text-center mb-8">
            <p className="text-lg font-semibold text-foreground mb-2">No matches found</p>
            <p className="text-muted-foreground">Try searching for biryani, dosa, burger, pizza, coffee, or chicken.</p>
          </div>
        )}

        {error && !loading && restaurants.length === 0 && !searchQuery && (
          <div className="glass-card p-8 text-center mb-8">
            <p className="text-muted-foreground">Live restaurants are temporarily unavailable. Showing popular dishes above.</p>
          </div>
        )}

        {!loading && !error && restaurants.length === 0 && isLocationReady && featuredItems.length === 0 && !searchQuery && (
          <div className="glass-card p-8 text-center">
            <p className="text-lg font-semibold text-foreground mb-2">No restaurants found nearby</p>
            <p className="text-muted-foreground">Try increasing the search radius or changing your location.</p>
          </div>
        )}

        {!loading && visibleRestaurants.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">
                {isCitywide
                  ? `${visibleRestaurants.length} popular restaurants in your city`
                  : `${visibleRestaurants.length} restaurants near you`}
              </h2>
              {isCitywide && (
                <p className="text-sm text-muted-foreground mt-1">
                  No restaurants found nearby - showing the most popular ones in your city
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {visibleRestaurants.map((restaurant) => (
                <Link
                  key={restaurant.id}
                  to={`/restaurant/${restaurant.id}`}
                  state={{ restaurant }}
                  className="glass-card-hover overflow-hidden group"
                >
                  <div className="relative h-48 overflow-hidden bg-secondary">
                    <img
                      src={getRestaurantExterior(restaurant.name, restaurant.cuisine)}
                      alt={restaurant.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(event) => {
                        (event.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute top-3 right-3 glass-card px-2.5 py-1 flex items-center gap-1 text-xs font-semibold">
                      <Star className="w-3 h-3 text-accent fill-accent" />
                      {restaurant.rating} ({restaurant.reviewCount >= 1000 ? `${(restaurant.reviewCount / 1000).toFixed(1)}k` : restaurant.reviewCount})
                    </div>
                    <div className="absolute bottom-3 left-3 glass-card px-2.5 py-1 text-xs font-medium">
                      {restaurant.deliveryTime}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-foreground truncate">{restaurant.name}</h3>
                      {restaurant.badge && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/20 text-primary flex-shrink-0 ml-2">
                          {restaurant.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {restaurant.cuisine.join(' - ')} - {restaurant.distanceLabel}
                    </p>
                    {restaurant.deliveryFee === 0 && (
                      <span className="inline-block mt-1.5 text-xs font-semibold text-success bg-success/20 px-2 py-0.5 rounded-full">
                        Free Delivery
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>

      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
          <div className="max-w-lg mx-auto rounded-[24px] border border-[#5a4036] bg-[#2a1710] p-4 flex items-center justify-between shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-sm flex items-center justify-center">
                {totalItems}
              </span>
              <div>
                <span className="text-xs text-[#a8897d] uppercase tracking-wider">Total</span>
                <p className="font-bold text-[#f7e0d6]">{formatPrice(subtotal)}</p>
              </div>
            </div>
            <Link to="/checkout" className="coral-button flex items-center gap-2 text-sm py-2.5 px-5">
              Checkout <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
