import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Star, Heart, Share2, Clock, Truck, Plus, Flame, Loader2 } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import DynamicDishImage from '@/components/ui/DynamicDishImage';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useLocationContext } from '@/context/LocationContext';
import { supabase } from '@/integrations/supabase/client';
import { restaurants as seedRestaurants, menuItems as seedMenuItems, restaurantMenuCategories, formatPrice } from '@/data/seed';
import { getRestaurantExterior } from '@/utils/photos';
import { withMenuItemImage } from '@/utils/menuItemImages';
import type { MenuItem } from '@/types';
import { toast } from '@/hooks/use-toast';

function getCachedMenu(restaurantId: string): MenuItem[] | null {
  try {
    const cached = localStorage.getItem(`menu_${restaurantId}`);
    if (!cached) return null;
    const { items, ts } = JSON.parse(cached);
    // Cache for 30 mins (real menu source can change)
    if (Date.now() - ts > 1800000) return null;
    return items.map((item: MenuItem) => withMenuItemImage(item));
  } catch { return null; }
}

function setCachedMenu(restaurantId: string, items: MenuItem[]) {
  try {
    localStorage.setItem(`menu_${restaurantId}`, JSON.stringify({ items, ts: Date.now() }));
  } catch { /* ignore */ }
}

export default function RestaurantPage() {
  const { id } = useParams<{ id: string }>();
  const routeState = useLocation().state as { restaurant?: any } | null;
  const { items: cartItems, addItem, subtotal } = useCart();
  const { isAuthenticated } = useAuth();
  const { location } = useLocationContext();
  const [realMenuItems, setRealMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // Load user's favorites for this restaurant
  useEffect(() => {
    if (!isAuthenticated) return;
    supabase.from('favorites').select('item_data').then(({ data }) => {
      if (data) {
        const ids = new Set(data.map((f: any) => f.item_data?.id).filter(Boolean));
        setFavoriteIds(ids as Set<string>);
      }
    });
  }, [isAuthenticated]);

  const toggleFavorite = useCallback(async (item: MenuItem) => {
    if (!isAuthenticated) return;
    if (favoriteIds.has(item.id)) {
      // Remove - find and delete
      const { data } = await supabase.from('favorites').select('id, item_data').then(({ data }) => {
        const match = data?.find((f: any) => f.item_data?.id === item.id);
        return { data: match };
      });
      if (data) {
        await supabase.from('favorites').delete().eq('id', data.id);
      }
      setFavoriteIds(prev => { const n = new Set(prev); n.delete(item.id); return n; });
      toast({ title: 'Removed from favorites' });
    } else {
      await (supabase.from('favorites') as any).insert({
        item_type: 'dish',
        item_data: item,
        collection_name: 'Quick Saves',
      });
      setFavoriteIds(prev => new Set(prev).add(item.id));
      toast({ title: 'Added to favorites ❤️' });
    }
  }, [isAuthenticated, favoriteIds]);

  const seedRestaurant = seedRestaurants.find(r => r.id === id);

  const restaurant = useMemo(() => {
    if (seedRestaurant) return seedRestaurant;
    if (routeState?.restaurant) {
      const r = routeState.restaurant;
      const restObj = {
        id: r.id,
        name: r.name,
        cuisine: r.cuisine || [],
        rating: r.rating || 4.0,
        reviewCount: r.reviewCount || 0,
        deliveryTime: r.deliveryTime || '30-45 min',
        deliveryFee: r.deliveryFee ?? 49,
        minOrder: 200,
        imageUrl: r.imageUrl || getRestaurantExterior(r.name, r.cuisine),
        badge: r.badge,
        priceLevel: r.priceLevel || '$$',
        distance: r.distanceKm || 0,
        lat: r.lat || null,
        lng: r.lng || null,
      };
      // Persist restaurant metadata for checkout/tracking
      try {
        localStorage.setItem('prebite_current_restaurant', JSON.stringify({
          id: restObj.id, name: restObj.name, lat: restObj.lat, lng: restObj.lng,
          deliveryFee: restObj.deliveryFee, deliveryTime: restObj.deliveryTime,
        }));
      } catch { /* ignore */ }
      return restObj;
    }
    return seedRestaurants[4];
  }, [id, seedRestaurant, routeState]);

  // Fetch official menu for non-seed restaurants
  useEffect(() => {
    if (seedRestaurant) return;
    if (!location?.lat || !location?.lng) return;

    const cached = getCachedMenu(restaurant.id);
    if (cached) {
      setRealMenuItems(cached);
      return;
    }

    const fetchMenu = async () => {
      setMenuLoading(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-menu`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              restaurantName: restaurant.name,
              lat: location.lat,
              lng: location.lng,
              city: location.city || '',
              cuisines: restaurant.cuisine,
              priceLevel: restaurant.priceLevel,
            }),
          }
        );

        const data = await res.json();

        if (!res.ok) {
          setRealMenuItems([]);
          toast({
            title: 'Real menu unavailable',
            description: data?.error || 'Could not fetch the official menu for this restaurant.',
          });
          return;
        }

        if (Array.isArray(data.menu)) {
          const items: MenuItem[] = data.menu.map((m: any, i: number) => withMenuItemImage({
            id: `${restaurant.id}-real-${i}`,
            restaurantId: restaurant.id,
            name: m.name,
            description: m.description || '',
            price: m.price || 0,
            category: m.category || 'Mains',
            imageUrl: '',
            isVeg: m.isVeg ?? false,
            allergens: [],
            isBestseller: m.isBestseller ?? false,
          }));
          setRealMenuItems(items);
          setCachedMenu(restaurant.id, items);
        }
      } catch (e) {
        console.error('Failed to fetch official menu:', e);
        setRealMenuItems([]);
      } finally {
        setMenuLoading(false);
      }
    };

    fetchMenu();
  }, [restaurant.id, restaurant.name, seedRestaurant, location?.lat, location?.lng, routeState?.restaurant?.fsqPlaceId]);

  const items = useMemo(() => {
    if (seedRestaurant) {
      return seedMenuItems.filter(m => m.restaurantId === seedRestaurant.id);
    }
    return realMenuItems;
  }, [seedRestaurant, realMenuItems]);

  const cats = useMemo(() => {
    if (seedRestaurant && restaurantMenuCategories[seedRestaurant.id]) {
      return restaurantMenuCategories[seedRestaurant.id];
    }
    const uniqueCats = [...new Set(items.map(i => i.category))];
    return uniqueCats.sort((a, b) => (a === 'Popular' ? -1 : b === 'Popular' ? 1 : 0));
  }, [items, seedRestaurant]);

  const [activeTab, setActiveTab] = useState('');

  // Update active tab when cats change
  useEffect(() => {
    if (cats.length > 0 && !cats.includes(activeTab)) {
      setActiveTab(cats[0]);
    }
  }, [cats]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, typeof items> = {};
    cats.forEach(c => {
      groups[c] = items.filter(i => i.category === c);
    });
    return groups;
  }, [items, cats]);

  const serviceFee = 49;
  const tax = +(subtotal * 0.05).toFixed(0);
  const total = subtotal + serviceFee + tax;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <div className="relative h-64 sm:h-72 overflow-hidden">
        <img
          src={restaurant.imageUrl}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-6 max-w-7xl mx-auto">
          <div className="flex items-start justify-between">
            <div>
              {restaurant.badge && (
                <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider bg-primary/90 text-primary-foreground rounded-md mb-2">
                  {restaurant.badge}
                </span>
              )}
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-4 h-4 text-accent fill-accent" />
                <span className="text-sm font-semibold text-foreground">
                  {restaurant.rating} ({restaurant.reviewCount >= 1000 ? `${(restaurant.reviewCount / 1000).toFixed(1)}k+` : restaurant.reviewCount})
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-foreground mb-1">{restaurant.name}</h1>
              <p className="text-sm text-muted-foreground">
                {restaurant.cuisine.join(' • ')} • {restaurant.priceLevel}
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" /> {restaurant.deliveryTime}
                </span>
                <span className="flex items-center gap-1">
                  <Truck className="w-4 h-4" /> {restaurant.deliveryFee === 0 ? 'Free Delivery' : formatPrice(restaurant.deliveryFee)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-10 h-10 glass-card flex items-center justify-center rounded-xl hover:bg-glass-border-hover transition-colors">
                <Heart className="w-5 h-5 text-foreground" />
              </button>
              <button className="w-10 h-10 glass-card flex items-center justify-center rounded-xl hover:bg-glass-border-hover transition-colors">
                <Share2 className="w-5 h-5 text-foreground" />
              </button>
              <button className="coral-button text-sm py-2.5">More Info</button>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Category Tabs */}
      {cats.length > 0 && (
        <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b border-glass-border">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex gap-6 overflow-x-auto py-3">
              {cats.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`text-sm font-medium whitespace-nowrap pb-1 transition-colors border-b-2 ${
                    activeTab === cat
                      ? 'text-primary border-primary'
                      : 'text-muted-foreground border-transparent hover:text-foreground'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Two-Column Layout */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Left: Menu */}
          <div className="flex-1 min-w-0">
            {/* Loading state */}
            {menuLoading && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-muted-foreground text-sm">Loading menu for {restaurant.name}...</p>
              </div>
            )}

            {!menuLoading && items.length === 0 && !seedRestaurant && (
              <div className="glass-card p-8 text-center">
                <p className="text-muted-foreground">Menu not available for this restaurant.</p>
              </div>
            )}

            {!menuLoading && cats.map(cat => {
              const catItems = groupedItems[cat];
              if (!catItems || catItems.length === 0) return null;
              const isPopular = cat === 'Popular';

              return (
                <section key={cat} className="mb-10" id={`cat-${cat}`}>
                  <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    {cat === 'Popular' && <Flame className="w-5 h-5 text-primary" />}
                    {cat === 'Popular' ? 'Popular Items' : cat}
                  </h2>

                  {isPopular ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {catItems.map(item => (
                        <div key={item.id} className="glass-card-hover overflow-hidden">
                          <div className={`relative h-44 overflow-hidden ${seedRestaurant ? '' : 'bg-white/95 p-4'}`}>
                            <DynamicDishImage
                              dishName={item.name}
                              category={item.category}
                              isVeg={item.isVeg}
                              initialUrl={item.imageUrl}
                              className={`w-full h-full ${seedRestaurant ? 'object-cover' : 'object-contain'}`}
                            />
                            {item.isBestseller && (
                              <span className="absolute top-3 right-3 bg-secondary text-foreground text-xs font-semibold px-2.5 py-1 rounded-md">
                                Bestseller
                              </span>
                            )}
                          </div>
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center text-[8px] ${item.isVeg ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'}`}>●</span>
                                <h3 className="font-bold text-foreground">{item.name}</h3>
                              </div>
                              <span className="text-primary font-bold">{formatPrice(item.price)}</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => addItem(item)}
                                className="flex-1 ghost-button text-sm py-2 flex items-center justify-center gap-1 hover:border-primary hover:text-primary"
                              >
                                Add to Order <Plus className="w-4 h-4" />
                              </button>
                              {isAuthenticated && (
                                <button
                                  onClick={() => toggleFavorite(item)}
                                  className="w-9 h-9 rounded-full border border-glass-border-hover flex items-center justify-center hover:bg-primary/10 transition-colors flex-shrink-0"
                                >
                                  <Heart className={`w-4 h-4 ${favoriteIds.has(item.id) ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {catItems.map(item => (
                        <div key={item.id} className="glass-card-hover flex items-center gap-4 p-4">
                          <div className={`w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 ${seedRestaurant ? '' : 'bg-white/95 p-1.5'}`}>
                            <DynamicDishImage
                              dishName={item.name}
                              category={item.category}
                              isVeg={item.isVeg}
                              initialUrl={item.imageUrl}
                              className={`w-full h-full ${seedRestaurant ? 'object-cover' : 'object-contain'}`}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center text-[7px] ${item.isVeg ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'}`}>●</span>
                              <h3 className="font-semibold text-foreground text-sm">{item.name}</h3>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                            <span className="text-primary font-bold text-sm">{formatPrice(item.price)}</span>
                          </div>
                          <button
                            onClick={() => addItem(item)}
                            className="w-9 h-9 rounded-full border border-glass-border-hover flex items-center justify-center text-primary hover:bg-primary/10 transition-colors flex-shrink-0"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}

            {/* People Also Order */}
            {!menuLoading && items.length > 0 && (
              <section className="mb-10">
                <h2 className="text-lg font-bold text-foreground mb-4">People Also Order</h2>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {items.filter(i => i.category === 'Drinks' || i.category === 'Sides' || i.category === 'Desserts').slice(0, 3).map(item => (
                    <div key={item.id} className="flex-shrink-0 w-36">
                      <div className={`w-36 h-24 rounded-xl overflow-hidden mb-2 ${seedRestaurant ? '' : 'bg-white/95 p-2'}`}>
                        <DynamicDishImage
                          dishName={item.name}
                          category={item.category}
                          isVeg={item.isVeg}
                          initialUrl={item.imageUrl}
                          className={`w-full h-full ${seedRestaurant ? 'object-cover' : 'object-contain'}`}
                        />
                      </div>
                      <h4 className="text-sm font-semibold text-foreground truncate">{item.name}</h4>
                      <p className="text-xs text-primary font-bold">{formatPrice(item.price)}</p>
                      <button
                        onClick={() => addItem(item)}
                        className="w-full mt-1 ghost-button text-xs py-1.5"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right: Sticky Order Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-36">
              <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-foreground text-lg">Your Order</h3>
                  <span className="text-xs text-muted-foreground px-2 py-1 border border-glass-border rounded-md">Takeout</span>
                </div>

                {cartItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Your order is empty. Add items from the menu!
                  </p>
                ) : (
                  <>
                    <div className="space-y-3 mb-5">
                      {cartItems.map(ci => (
                        <div key={ci.menuItem.id} className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded bg-primary/20 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                            {ci.quantity}x
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{ci.menuItem.name}</p>
                            {ci.customization && (
                              <p className="text-xs text-muted-foreground">{ci.customization}</p>
                            )}
                            <button className="text-xs text-primary hover:underline">Edit</button>
                          </div>
                          <span className="text-sm font-medium text-foreground flex-shrink-0">
                            {formatPrice(ci.menuItem.price * ci.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-glass-border pt-4 space-y-2 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span className="text-foreground">{formatPrice(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Service Fee</span>
                        <span className="text-foreground">{formatPrice(serviceFee)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>GST</span>
                        <span className="text-foreground">{formatPrice(tax)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-foreground pt-2 border-t border-glass-border">
                        <span>Total</span>
                        <span className="text-primary">{formatPrice(total)}</span>
                      </div>
                    </div>

                    <Link
                      to="/checkout"
                      className="coral-button w-full mt-5 text-center block text-sm py-3"
                    >
                      Checkout {formatPrice(total)}
                    </Link>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Secure mock checkout • No real charges
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
