import { useState, useEffect, useMemo, lazy, Suspense, Component, ReactNode } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Check, ChefHat, Truck, Package, Phone, MessageCircle, ChevronDown, ChevronUp, Loader2, MapPin, ArrowLeft } from 'lucide-react';
import { formatPrice } from '@/data/seed';
import { supabase } from '@/integrations/supabase/client';
import { useLocationContext } from '@/context/LocationContext';

/** Haversine distance in km */
function haversineKm(a: [number, number], b: [number, number]): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/** Estimate delivery minutes: 12 min prep + driving at ~25 km/h avg city speed */
function estimateDeliveryMinutes(distKm: number): number {
  const PREP_MIN = 12;
  const AVG_SPEED_KMH = 25;
  return Math.round(PREP_MIN + (distKm / AVG_SPEED_KMH) * 60);
}

const STEPS = [
  { key: 'confirmed', label: 'Order Confirmed', icon: Check, time: '' },
  { key: 'preparing', label: 'Prepared by Kitchen', icon: ChefHat, time: '' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, subtitle: '' },
  { key: 'delivered', label: 'Delivered', icon: Package, time: '' },
] as const;

const DRIVER = {
  name: 'James D.',
  rating: 4.9,
  vehicle: 'Black Scooter',
  avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=James',
};

function generateCurvedRoute(start: [number, number], end: [number, number], points = 40): [number, number][] {
  const route: [number, number][] = [];
  const midLat = (start[0] + end[0]) / 2 + (end[1] - start[1]) * 0.15;
  const midLng = (start[1] + end[1]) / 2 - (end[0] - start[0]) * 0.15;
  for (let i = 0; i <= points; i++) {
    const t = i / points;
    const lat = (1 - t) * (1 - t) * start[0] + 2 * (1 - t) * t * midLat + t * t * end[0];
    const lng = (1 - t) * (1 - t) * start[1] + 2 * (1 - t) * t * midLng + t * t * end[1];
    route.push([lat, lng]);
  }
  return route;
}

// Error boundary to catch Leaflet crashes
class MapErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error?.message || 'Unknown error' };
  }
  componentDidCatch(error: Error) {
    console.error('TrackingMap crashed:', error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full bg-secondary/50 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <MapPin className="w-10 h-10 mx-auto mb-2 text-primary/50" />
            <p className="text-sm">Map error: {this.state.error}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function MapFallback() {
  return (
    <div className="h-full w-full bg-secondary/50 flex items-center justify-center">
      <div className="text-center text-muted-foreground">
        <MapPin className="w-10 h-10 mx-auto mb-2 text-primary/50" />
        <p className="text-sm">Live map view</p>
      </div>
    </div>
  );
}

// Lazy-load the map to avoid blocking the page if Leaflet fails
const LazyMap = lazy(() => import('@/components/tracking/TrackingMap'));

interface OrderData {
  id: string;
  order_number: string;
  items: any[];
  total: number;
  created_at: string;
  restaurant_data: any;
  delivery_address: any;
  status: string;
  payment_method: string;
}

function normalizeOrder(raw: any): OrderData {
  return {
    id: raw?.id || '',
    order_number: raw?.order_number || raw?.id || '',
    items: Array.isArray(raw?.items) ? raw.items : [],
    total: Number(raw?.total || 0),
    created_at: raw?.created_at || raw?.createdAt || new Date().toISOString(),
    restaurant_data: raw?.restaurant_data || raw?.restaurant || { name: 'Restaurant' },
    delivery_address: raw?.delivery_address || raw?.address || {},
    status: raw?.status || 'confirmed',
    payment_method: raw?.payment_method || raw?.paymentMethod || 'COD',
  };
}

export default function OrderTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { location: userLocation } = useLocationContext();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [showItems, setShowItems] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      setLoading(true);

      try {
        let resolvedOrder: any = null;

        const { data: orderByNumber } = await supabase
          .from('orders')
          .select('*')
          .eq('order_number', orderId)
          .maybeSingle();

        resolvedOrder = orderByNumber;

        if (!resolvedOrder && /^[0-9a-f-]{36}$/i.test(orderId)) {
          const { data: orderById } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .maybeSingle();

          resolvedOrder = orderById;
        }

        if (resolvedOrder) {
          const normalizedOrder = normalizeOrder(resolvedOrder);
          setOrder(normalizedOrder);
          const stepIdx = STEPS.findIndex(step => step.key === normalizedOrder.status);
          setCurrentStep(stepIdx >= 0 ? stepIdx : 0);
          return;
        }

        const stored = localStorage.getItem(`prebite_order_${orderId}`);
        if (stored) {
          const normalizedOrder = normalizeOrder(JSON.parse(stored));
          setOrder(normalizedOrder);
          const stepIdx = STEPS.findIndex(step => step.key === normalizedOrder.status);
          setCurrentStep(stepIdx >= 0 ? stepIdx : 0);
          return;
        }

        setOrder(null);
      } catch (error) {
        console.error('Failed to load order tracking data:', error);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchOrder();
  }, [orderId]);

  useEffect(() => {
    if (!order || currentStep >= STEPS.length - 1) return;
    const delays = [4000, 6000, 8000];
    const timer = setTimeout(() => {
      setCurrentStep(step => step + 1);
    }, delays[currentStep] ?? 5000);
    return () => clearTimeout(timer);
  }, [currentStep, order]);

  // Extract restaurant position from order data
  const restaurantPos: [number, number] = useMemo(() => {
    const rd = order?.restaurant_data;
    if (rd?.lat && rd?.lng) return [Number(rd.lat), Number(rd.lng)];
    // Fallback: offset from user location
    if (userLocation?.lat && userLocation?.lng) {
      return [userLocation.lat + 0.015, userLocation.lng - 0.01];
    }
    return [28.635, 77.225];
  }, [order, userLocation]);

  // Delivery position = user's location (from order address or live location)
  const deliveryPos: [number, number] = useMemo(() => {
    // Try from order's delivery_address first
    const da = order ? (order as any).delivery_address : null;
    if (da?.lat && da?.lng) return [Number(da.lat), Number(da.lng)];
    // Then live location
    if (userLocation?.lat && userLocation?.lng) return [userLocation.lat, userLocation.lng];
    // Fallback: offset from restaurant
    return [restaurantPos[0] - 0.03, restaurantPos[1] + 0.03];
  }, [order, userLocation, restaurantPos]);

  const distanceKm = useMemo(() => haversineKm(restaurantPos, deliveryPos), [restaurantPos, deliveryPos]);
  const totalEtaMinutes = useMemo(() => {
    const raw = estimateDeliveryMinutes(distanceKm);
    return Math.min(raw, 60);
  }, [distanceKm]);

  // ETA remaining based on current step progress
  const etaMinutes = useMemo(() => {
    const remaining = (STEPS.length - 1 - currentStep) / (STEPS.length - 1);
    return Math.max(0, Math.round(totalEtaMinutes * remaining));
  }, [currentStep, totalEtaMinutes]);

  const stepTimes = useMemo(() => {
    const base = order ? new Date(order.created_at) : new Date();
    const stepInterval = (totalEtaMinutes / (STEPS.length - 1)) * 60000;
    return STEPS.map((_, i) => {
      const t = new Date(base.getTime() + i * stepInterval);
      return t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });
  }, [order, totalEtaMinutes]);

  const routePoints = useMemo(() => generateCurvedRoute(restaurantPos, deliveryPos), [restaurantPos, deliveryPos]);

  const driverPos = useMemo(() => {
    const progress = currentStep / (STEPS.length - 1);
    const idx = Math.floor(progress * (routePoints.length - 1));
    return routePoints[Math.min(idx, routePoints.length - 1)];
  }, [currentStep, routePoints]);

  const etaProgress = ((STEPS.length - 1 - currentStep) / (STEPS.length - 1)) * 100;
  const circumference = 2 * Math.PI * 38;
  const strokeDashoffset = circumference - (etaProgress / 100) * circumference;
  const orderItems = Array.isArray(order?.items) ? order.items : [];

  const getItemCount = () => {
    return orderItems.reduce((sum: number, ci: any) => sum + (ci?.quantity || 1), 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Order not found</h1>
          <p className="text-muted-foreground mb-6">We couldn't find this order.</p>
          <Link to="/browse" className="coral-button inline-flex">Browse Restaurants</Link>
        </div>
      </div>
    );
  }

  const displayOrderId = order.order_number?.slice(0, 8) || order.id?.slice(0, 4);

  return (
    <div className="h-screen w-screen flex flex-col lg:flex-row overflow-hidden bg-background">
      {/* Map section — hidden on mobile initially, shown on desktop left */}
      <div className="hidden lg:block flex-1 relative min-h-0">
        <MapErrorBoundary>
          <Suspense fallback={<MapFallback />}>
            <LazyMap
              restaurantPos={restaurantPos}
              deliveryPos={deliveryPos}
              routePoints={routePoints}
              driverPos={driverPos}
            />
          </Suspense>
        </MapErrorBoundary>
      </div>

      {/* Mobile map — compact strip at top */}
      <div className="lg:hidden h-[200px] relative flex-shrink-0">
        <MapErrorBoundary>
          <Suspense fallback={<MapFallback />}>
            <LazyMap
              restaurantPos={restaurantPos}
              deliveryPos={deliveryPos}
              routePoints={routePoints}
              driverPos={driverPos}
            />
          </Suspense>
        </MapErrorBoundary>
        {/* Back button overlay on mobile */}
        <Link to="/orders" className="absolute top-4 left-4 z-[1000] w-10 h-10 rounded-xl bg-secondary/80 backdrop-blur-md border border-border flex items-center justify-center text-foreground">
          <ArrowLeft className="w-4 h-4" />
        </Link>
      </div>

      {/* Sidebar — always visible, scrollable */}
      <div className="flex-1 lg:flex-none w-full lg:w-[420px] bg-card border-l border-border overflow-y-auto flex flex-col">
        <div className="px-6 pt-6 pb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Live Tracking</p>
            <h1 className="text-2xl font-extrabold text-foreground">Order #{displayOrderId}</h1>
          </div>
          <Link to="/orders" className="text-xs font-medium text-muted-foreground bg-secondary hover:bg-muted px-3 py-1.5 rounded-lg transition-colors">
            Support
          </Link>
        </div>

        <div className="px-6 pb-6 flex items-center gap-5">
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="38" fill="none" stroke="hsl(var(--secondary))" strokeWidth="4" />
              <circle cx="40" cy="40" r="38" fill="none" stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Truck className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-foreground">{etaMinutes}</span>
              <span className="text-lg text-muted-foreground font-medium">min</span>
            </div>
            <p className="text-xs font-bold tracking-wider text-primary uppercase">Estimated Arrival</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {stepTimes[3]} • {currentStep >= 3 ? 'Delivered' : 'On Schedule'}
            </p>
          </div>
        </div>

        <div className="px-6 pb-6">
          {STEPS.map((step, i) => {
            const isCompleted = i < currentStep;
            const isCurrent = i === currentStep;
            const isPending = i > currentStep;
            const StepIcon = step.icon;

            return (
              <div key={step.key} className="flex gap-4 relative">
                {i < STEPS.length - 1 && (
                  <div
                    className="absolute left-[19px] top-10 w-0.5 h-8"
                    style={{ background: isCompleted ? 'hsl(var(--primary))' : 'hsl(var(--secondary))' }}
                  />
                )}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                  isCompleted ? 'bg-primary/20' : isCurrent ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' : 'bg-secondary'
                }`}>
                  {isCompleted ? <Check className="w-4 h-4 text-primary" /> : <StepIcon className={`w-4 h-4 ${isCurrent ? 'text-primary-foreground' : 'text-muted-foreground'}`} />}
                </div>
                <div className="pb-8 pt-2">
                  <p className={`text-sm font-semibold ${isPending ? 'text-muted-foreground' : 'text-foreground'}`}>{step.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {isCurrent && i === 2 ? `${DRIVER.name} is on the way` : isPending ? `Estimated ${stepTimes[i]}` : stepTimes[i]}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {currentStep >= 2 && currentStep < STEPS.length && (
          <div className="mx-6 mb-6 bg-secondary rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img src={DRIVER.avatar} alt={DRIVER.name} className="w-12 h-12 rounded-full bg-muted" />
                <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[hsl(var(--success))] border-2 border-secondary" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground text-sm">{DRIVER.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="text-accent">★ {DRIVER.rating}</span>
                  <span>•</span>
                  <span>{DRIVER.vehicle}</span>
                </div>
              </div>
              <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <MessageCircle className="w-4 h-4" />
              </button>
              <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <Phone className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3">
              <input
                type="text"
                placeholder={`Send a message to ${DRIVER.name.split(' ')[0]}...`}
                className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary/50 transition-colors"
              />
            </div>
          </div>
        )}

        <div className="mx-6 mb-6">
          <button
            onClick={() => setShowItems(!showItems)}
            className="w-full flex items-center justify-between py-3 text-sm font-semibold text-foreground"
          >
            <span>Order Items ({getItemCount()})</span>
            {showItems ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>

          {showItems && (
            <div className="space-y-3 pb-3">
              {orderItems.map((ci: any, idx: number) => {
                const name = ci?.menuItem?.name || ci?.name || 'Item';
                const price = ci?.menuItem?.price || ci?.price || 0;
                const qty = ci?.quantity || 1;

                return (
                  <div key={ci?.menuItem?.id || idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">{qty}x</span>
                      <span className="text-foreground">{name}</span>
                    </div>
                    <span className="text-foreground font-medium">{formatPrice(price * qty)}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="border-t border-dashed border-border pt-3 flex justify-between items-center">
            <span className="text-sm font-semibold text-foreground">Total</span>
            <span className="text-lg font-black text-primary">{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
