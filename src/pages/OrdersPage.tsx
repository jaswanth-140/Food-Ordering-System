import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import { Package, ChevronRight, Loader2, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/data/seed';

interface OrderRow {
  id: string;
  order_number: string;
  restaurant_data: any;
  items: any[];
  status: string;
  total: number;
  payment_method: string;
  is_paid: boolean;
  created_at: string;
}

const statusColors: Record<string, string> = {
  confirmed: 'bg-blue-500/20 text-blue-400',
  preparing: 'bg-amber-500/20 text-amber-400',
  out_for_delivery: 'bg-purple-500/20 text-purple-400',
  delivered: 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]',
};

const statusLabels: Record<string, string> = {
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
};

export default function OrdersPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchOrders();
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false }) as { data: OrderRow[] | null };

    if (data) setOrders(data);
    setLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Your Orders</h1>
          <p className="text-muted-foreground mb-6">Login to view your order history.</p>
          <button onClick={() => navigate('/login')} className="coral-button">Login to Continue</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">My Orders</h1>
        <p className="text-muted-foreground mb-8">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">Your order history will appear here after your first order.</p>
            <Link to="/browse" className="coral-button inline-flex">Browse Restaurants</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <Link
                key={order.id}
                to={`/tracking/${order.order_number}`}
                className="glass-card p-5 flex items-center gap-5 hover:border-primary/30 transition-all group block"
              >
                <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                  <Package className="w-7 h-7 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-foreground truncate">
                      {order.restaurant_data?.name || 'Restaurant'}
                    </h3>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[order.status] || ''}`}>
                      {statusLabels[order.status] || order.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    #{order.order_number} • {new Date(order.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''} • {order.payment_method}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-bold text-foreground">{formatPrice(order.total)}</div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors ml-auto" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
