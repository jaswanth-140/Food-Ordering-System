import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Minus, Plus, Trash2, Star, Receipt, MapPin, Info } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { useCart } from '@/context/CartContext';
import { restaurants, formatPrice } from '@/data/seed';

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();
  const [promoCode, setPromoCode] = useState('');
  const [note, setNote] = useState('');

  const restaurant = items.length > 0
    ? restaurants.find(r => r.id === items[0].menuItem.restaurantId)
    : null;

  const deliveryFee = 59;
  const taxRate = 0.05;
  const tax = +(subtotal * taxRate).toFixed(0);
  const discount = 0;
  const grandTotal = subtotal + deliveryFee + tax - discount;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-glass flex items-center justify-center">
            <Receipt className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8">Browse restaurants and add some delicious items!</p>
          <Link to="/browse" className="coral-button inline-flex items-center gap-2">
            Browse Restaurants <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground mb-1">Your Cart</h1>
            {restaurant && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Receipt className="w-4 h-4 text-primary" />
                Ordering from <span className="font-semibold text-foreground">{restaurant.name}</span>
                <span className="mx-1">•</span>
                <Star className="w-3.5 h-3.5 text-accent fill-accent" />
                {restaurant.rating} ({restaurant.reviewCount >= 1000 ? `${(restaurant.reviewCount / 1000).toFixed(1)}k` : restaurant.reviewCount})
              </p>
            )}
          </div>
          <Link to="/browse" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider font-medium">
            <ArrowLeft className="w-4 h-4" /> Continue Shopping
          </Link>
        </div>

        <div className="flex gap-8">
          {/* Left: Cart Items */}
          <div className="flex-1 space-y-4">
            {items.map(ci => (
              <div key={ci.menuItem.id} className="glass-card p-5 flex gap-5">
                <img
                  src={ci.menuItem.imageUrl}
                  alt={ci.menuItem.name}
                  className="w-28 h-28 rounded-xl object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <h3 className="font-bold text-foreground text-lg">{ci.menuItem.name}</h3>
                      <p className="text-sm text-muted-foreground">{ci.menuItem.description}</p>
                    </div>
                    <span className="text-lg font-bold text-foreground flex-shrink-0 ml-4">
                      {formatPrice(ci.menuItem.price * ci.quantity)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-0">
                      <button
                        onClick={() => updateQuantity(ci.menuItem.id, ci.quantity - 1)}
                        className="w-9 h-9 rounded-l-xl bg-secondary flex items-center justify-center text-foreground hover:bg-glass-border-hover transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <div className="w-10 h-9 bg-secondary flex items-center justify-center text-sm font-semibold text-foreground border-x border-glass-border">
                        {ci.quantity}
                      </div>
                      <button
                        onClick={() => updateQuantity(ci.menuItem.id, ci.quantity + 1)}
                        className="w-9 h-9 rounded-r-xl bg-secondary flex items-center justify-center text-foreground hover:bg-glass-border-hover transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(ci.menuItem.id)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Kitchen Note */}
            <div className="glass-card p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <input
                type="text"
                placeholder="Add a note for the kitchen (allergies, extra napkins, etc.)"
                value={note}
                onChange={e => setNote(e.target.value)}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
            </div>
          </div>

          {/* Right: Bill Details */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-24">
              <div className="glass-card p-5">
                <h3 className="font-bold text-foreground text-lg mb-5 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-primary" />
                  Bill Details
                </h3>

                {/* Delivery Address */}
                <div className="glass-card p-4 mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Delivering to</span>
                    <button className="text-xs text-primary font-semibold uppercase tracking-wider hover:underline">Change</button>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Home</p>
                      <p className="text-xs text-muted-foreground">123 MG Road, Koramangala, Bangalore</p>
                    </div>
                  </div>
                  <div className="mt-3 h-16 rounded-xl bg-secondary/50 overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-secondary to-muted opacity-60" />
                  </div>
                </div>

                {/* Promo Code */}
                <div className="mb-5">
                  <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Promo Code</span>
                  <div className="flex mt-2">
                    <input
                      type="text"
                      placeholder="Enter code"
                      value={promoCode}
                      onChange={e => setPromoCode(e.target.value)}
                      className="glass-input flex-1 rounded-r-none text-sm py-2.5"
                    />
                    <button className="px-4 py-2.5 bg-secondary text-muted-foreground text-xs font-semibold uppercase tracking-wider rounded-r-xl border border-l-0 border-glass-border hover:text-foreground transition-colors">
                      Apply
                    </button>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      Delivery Fee <Info className="w-3 h-3" />
                    </span>
                    <span className="text-foreground">{formatPrice(deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GST & Charges</span>
                    <span className="text-foreground">{formatPrice(tax)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-success">Discount</span>
                      <span className="text-success">-{formatPrice(discount)}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-glass-border mt-4 pt-4">
                  <div className="flex justify-between items-baseline">
                    <span className="uppercase text-xs tracking-wider font-semibold text-muted-foreground">Grand Total</span>
                    <div className="text-right">
                      <span className="text-2xl font-extrabold text-foreground">{formatPrice(grandTotal)}</span>
                      <p className="text-xs text-muted-foreground">Includes all taxes</p>
                    </div>
                  </div>
                </div>

                <Link
                  to="/checkout"
                  className="coral-button w-full mt-5 text-center flex items-center justify-center gap-2 text-sm py-3.5"
                >
                  Proceed to Checkout <ArrowRight className="w-4 h-4" />
                </Link>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Secure mock checkout • No real charges
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Checkout Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-glass-border p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Grand Total</span>
              <p className="text-xl font-extrabold text-foreground">{formatPrice(grandTotal)}</p>
            </div>
            <span className="text-xs text-muted-foreground">Incl. ₹{deliveryFee} delivery + ₹{tax} tax</span>
          </div>
          <Link
            to="/checkout"
            className="coral-button w-full text-center flex items-center justify-center gap-2 text-sm py-3.5"
          >
            Proceed to Checkout <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
