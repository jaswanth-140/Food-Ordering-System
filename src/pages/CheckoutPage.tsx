import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Banknote, CreditCard, Smartphone, MapPin, Check, Loader2, ChevronRight } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/data/seed';
import { useIsMobile } from '@/hooks/use-mobile';
import type { SavedCard } from '@/types';
import QRCode from 'qrcode';

type PaymentMethod = 'COD' | 'Card' | 'UPI';

function detectCardBrand(number: string): SavedCard['brand'] {
  if (number.startsWith('4')) return 'Visa';
  if (number.startsWith('5')) return 'Mastercard';
  if (number.startsWith('6')) return 'RuPay';
  if (number.startsWith('3')) return 'Amex';
  return 'Visa';
}

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const isMobile = useIsMobile();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [restaurantName, setRestaurantName] = useState('');

  // Card state
  const [savedCards, setSavedCards] = useState<any[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showNewCard, setShowNewCard] = useState(true);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [saveCard, setSaveCard] = useState(true);
  const [cardError, setCardError] = useState('');

  // UPI state
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [upiWaiting, setUpiWaiting] = useState(false);

  const deliveryFee = 59;
  const tax = +(subtotal * 0.05).toFixed(0);
  const discount = 0;
  const grandTotal = subtotal + deliveryFee + tax - discount;

  // Load saved cards from DB
  useEffect(() => {
    if (!isAuthenticated) return;
    supabase.from('saved_cards').select('*').then(({ data }) => {
      if (data && data.length > 0) {
        setSavedCards(data);
        setSelectedCardId(data[0].id);
        setShowNewCard(false);
      }
    });
  }, [isAuthenticated]);

  // Generate QR code
  useEffect(() => {
    if (paymentMethod === 'UPI') {
      const upiLink = `upi://pay?pa=prebite@paytm&pn=PreBite&am=${grandTotal}&cu=INR&tn=OrderPreBite`;
      QRCode.toDataURL(upiLink, { width: 256, margin: 2 }).then(setQrDataUrl);
    }
  }, [paymentMethod, grandTotal]);

  const validateCard = useCallback(() => {
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length !== 16) return 'Card number must be 16 digits';
    const [mm, yy] = cardExpiry.split('/');
    if (!mm || !yy || +mm < 1 || +mm > 12) return 'Invalid expiry date';
    if (cardCvv.length !== 3) return 'CVV must be 3 digits';
    if (!cardName.trim()) return 'Cardholder name is required';
    return '';
  }, [cardNumber, cardExpiry, cardCvv, cardName]);

  const placeOrder = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (paymentMethod === 'Card' && showNewCard) {
      const err = validateCard();
      if (err) { setCardError(err); return; }
    }

    setProcessing(true);
    const delay = paymentMethod === 'COD' ? 500 : paymentMethod === 'UPI' ? 3000 : 2000;
    if (paymentMethod === 'UPI') setUpiWaiting(true);
    await new Promise(r => setTimeout(r, delay));
    if (paymentMethod === 'UPI') setUpiWaiting(false);

    // Save card if needed
    if (paymentMethod === 'Card' && showNewCard && saveCard) {
      const digits = cardNumber.replace(/\D/g, '');
      await (supabase.from('saved_cards') as any).insert({
        last4: digits.slice(-4),
        brand: detectCardBrand(digits),
        expiry_month: cardExpiry.split('/')[0],
        expiry_year: cardExpiry.split('/')[1],
        cardholder_name: cardName,
      });
    }

    // Get restaurant metadata (with coordinates) from localStorage
    let restMeta: any = {};
    try {
      const stored = localStorage.getItem('prebite_current_restaurant');
      if (stored) restMeta = JSON.parse(stored);
    } catch { /* ignore */ }

    const displayName = restMeta?.name || items[0]?.menuItem?.restaurantId || 'Restaurant';

    const newOrderNumber = `PB${Date.now().toString(36).toUpperCase()}`;

    // Build delivery address from user's actual location
    const userLoc = JSON.parse(localStorage.getItem('prebite_location') || '{}');
    const deliveryAddress = {
      label: 'Home',
      street: userLoc?.address || '123 MG Road',
      city: userLoc?.city || 'Unknown',
      lat: userLoc?.lat || null,
      lng: userLoc?.lng || null,
    };

    // Save order to DB
    await (supabase.from('orders') as any).insert({
      user_id: user?.id,
      order_number: newOrderNumber,
      restaurant_data: {
        name: displayName,
        lat: restMeta?.lat || null,
        lng: restMeta?.lng || null,
      },
      items: items.map(ci => ({
        menuItem: ci.menuItem,
        quantity: ci.quantity,
        customization: ci.customization,
      })),
      status: 'confirmed',
      subtotal,
      delivery_fee: deliveryFee,
      tax,
      discount,
      total: grandTotal,
      payment_method: paymentMethod,
      payment_status: paymentMethod === 'COD' ? 'pending' : 'completed',
      is_paid: paymentMethod !== 'COD',
      delivery_address: deliveryAddress,
      estimated_delivery: '30-40 min',
    });

    // Also save to localStorage for tracking page (backward compat)
    localStorage.setItem(`prebite_order_${newOrderNumber}`, JSON.stringify({
      id: newOrderNumber,
      userId: user?.id || '',
      restaurant_data: { name: displayName, lat: restMeta?.lat, lng: restMeta?.lng },
      items,
      status: 'confirmed',
      subtotal,
      deliveryFee,
      tax,
      discount,
      total: grandTotal,
      paymentMethod,
      paymentStatus: paymentMethod === 'COD' ? 'pending' : 'completed',
      isPaid: paymentMethod !== 'COD',
      delivery_address: deliveryAddress,
      estimatedDelivery: '30-40 min',
      createdAt: new Date(),
    }));

    setOrderNumber(newOrderNumber);
    setRestaurantName(displayName);
    setProcessing(false);
    setSuccess(true);
    clearCart();
  };

  if (items.length === 0 && !success) {
    navigate('/cart');
    return null;
  }

  if (processing) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-lg font-semibold text-foreground">
          {upiWaiting ? 'Waiting for payment confirmation...' : 'Processing payment...'}
        </p>
        <p className="text-sm text-muted-foreground">Please don't close this window</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 rounded-full bg-[hsl(var(--success))]/20 flex items-center justify-center mb-6 animate-bounce">
          <Check className="w-10 h-10 text-[hsl(var(--success))]" />
        </div>
        <h1 className="text-3xl font-extrabold text-foreground mb-2">Order Placed Successfully! 🎉</h1>
        <p className="text-muted-foreground mb-8">Your order #{orderNumber} has been confirmed</p>

        <div className="glass-card p-6 w-full max-w-md mb-8">
          <h3 className="font-bold text-foreground mb-3">{restaurantName}</h3>
          <div className="border-t border-glass-border pt-3 flex justify-between font-bold text-foreground">
            <span>Total</span>
            <span>{formatPrice(grandTotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span>Payment</span>
            <span className="text-foreground">{paymentMethod === 'COD' ? 'Cash on Delivery' : paymentMethod}</span>
          </div>
        </div>

        <div className="flex gap-4 w-full max-w-md">
          <button onClick={() => navigate(`/tracking/${orderNumber}`)} className="coral-button flex-1 text-center flex items-center justify-center gap-2">
            Track Order <ChevronRight className="w-4 h-4" />
          </button>
          <Link to="/browse" className="ghost-button flex-1 text-center">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const upiApps = [
    { name: 'Google Pay', icon: '💳' },
    { name: 'PhonePe', icon: '📱' },
    { name: 'Paytm', icon: '💰' },
    { name: 'BHIM', icon: '🏦' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/cart" className="w-10 h-10 glass-card flex items-center justify-center rounded-xl hover:bg-glass-border-hover transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">Checkout</h1>
            <p className="text-sm text-muted-foreground">{items.length} item{items.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            {/* Delivery Address */}
            <div className="glass-card p-5">
              <h3 className="font-bold text-foreground flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-primary" /> Delivering to
              </h3>
              <p className="text-sm font-semibold text-foreground">Home</p>
              <p className="text-xs text-muted-foreground">123 MG Road, Koramangala, Bangalore 560034</p>
            </div>

            {/* Payment Method */}
            <div>
              <h3 className="font-bold text-foreground mb-4">Payment Method</h3>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { key: 'COD' as const, icon: Banknote, label: 'Cash on Delivery', sub: 'Pay when delivered' },
                  { key: 'Card' as const, icon: CreditCard, label: 'Credit/Debit Card', sub: 'Instant payment' },
                  { key: 'UPI' as const, icon: Smartphone, label: 'UPI', sub: 'Pay with UPI app' },
                ] as const).map(pm => (
                  <button
                    key={pm.key}
                    onClick={() => { setPaymentMethod(pm.key); setCardError(''); }}
                    className={`glass-card p-4 text-left transition-all duration-200 ${
                      paymentMethod === pm.key ? 'border-primary shadow-[0_0_20px_-5px_hsl(var(--primary)/0.4)]' : 'hover:border-glass-border-hover'
                    }`}
                  >
                    <pm.icon className={`w-6 h-6 mb-2 ${paymentMethod === pm.key ? 'text-primary' : 'text-muted-foreground'}`} />
                    <p className="text-sm font-semibold text-foreground">{pm.label}</p>
                    <p className="text-xs text-muted-foreground">{pm.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Details */}
            <div className="glass-card p-5">
              {paymentMethod === 'COD' && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[hsl(var(--success))]/20 flex items-center justify-center flex-shrink-0">
                    <Banknote className="w-5 h-5 text-[hsl(var(--success))]" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">💵 Cash on Delivery Selected</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Pay {formatPrice(grandTotal)} to the delivery agent when your order arrives.
                    </p>
                  </div>
                </div>
              )}

              {paymentMethod === 'Card' && (
                <div>
                  {savedCards.length > 0 && !showNewCard ? (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-foreground mb-3">Saved Cards</p>
                      {savedCards.map((card: any) => (
                        <button
                          key={card.id}
                          onClick={() => setSelectedCardId(card.id)}
                          className={`w-full glass-card p-4 flex items-center gap-4 transition-all ${selectedCardId === card.id ? 'border-primary' : ''}`}
                        >
                          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-lg font-bold text-foreground flex-shrink-0">
                            {card.brand?.[0] || 'C'}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-semibold text-foreground">{card.brand} •••• {card.last4}</p>
                            <p className="text-xs text-muted-foreground">Expires {card.expiry_month}/{card.expiry_year}</p>
                          </div>
                        </button>
                      ))}
                      <button onClick={() => setShowNewCard(true)} className="text-sm text-primary font-semibold hover:underline">+ Add New Card</button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-foreground">Add Card</p>
                        {savedCards.length > 0 && (
                          <button onClick={() => setShowNewCard(false)} className="text-xs text-primary hover:underline">Use saved card</button>
                        )}
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block mb-1.5">Card Number</label>
                        <div className="relative">
                          <input type="text" placeholder="1234 5678 9012 3456" value={formatCardNumber(cardNumber)} onChange={e => setCardNumber(e.target.value.replace(/\D/g, ''))} className="glass-input w-full pr-14" maxLength={19} />
                          {cardNumber.length > 0 && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded">{detectCardBrand(cardNumber)}</span>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block mb-1.5">Expiry</label>
                          <input type="text" placeholder="MM/YY" value={formatExpiry(cardExpiry)} onChange={e => setCardExpiry(e.target.value.replace(/\D/g, ''))} className="glass-input w-full" maxLength={5} />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block mb-1.5">CVV</label>
                          <input type="password" placeholder="•••" value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3))} className="glass-input w-full" maxLength={3} />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block mb-1.5">Name</label>
                        <input type="text" placeholder="Cardholder name" value={cardName} onChange={e => setCardName(e.target.value)} className="glass-input w-full" />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={saveCard} onChange={e => setSaveCard(e.target.checked)} className="w-4 h-4 rounded accent-primary" />
                        <span className="text-sm text-muted-foreground">Save card for future orders</span>
                      </label>
                      {cardError && <p className="text-sm text-destructive">{cardError}</p>}
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === 'UPI' && (
                <div>
                  {!isMobile ? (
                    <div className="text-center">
                      <p className="font-semibold text-foreground mb-4">Scan QR Code to Pay</p>
                      {qrDataUrl && <img src={qrDataUrl} alt="UPI QR" className="mx-auto rounded-xl mb-4" />}
                      <p className="text-xs text-muted-foreground">Open any UPI app and scan this QR code</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-semibold text-foreground mb-4">Pay with UPI App</p>
                      <div className="grid grid-cols-2 gap-3">
                        {upiApps.map(app => (
                          <button key={app.name} className="glass-card p-4 text-center hover:border-primary/30 transition-all">
                            <span className="text-2xl mb-2 block">{app.icon}</span>
                            <span className="text-sm text-foreground font-medium">{app.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 glass-card p-5">
              <h3 className="font-bold text-foreground mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm mb-4">
                {items.map(ci => (
                  <div key={ci.menuItem.id} className="flex justify-between">
                    <span className="text-muted-foreground">{ci.quantity}x {ci.menuItem.name}</span>
                    <span className="text-foreground">{formatPrice(ci.menuItem.price * ci.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-glass-border pt-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span className="text-foreground">{formatPrice(subtotal)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Delivery</span><span className="text-foreground">{formatPrice(deliveryFee)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Tax</span><span className="text-foreground">{formatPrice(tax)}</span></div>
              </div>
              <div className="border-t border-glass-border mt-3 pt-3 flex justify-between font-bold text-lg text-foreground">
                <span>Total</span><span className="text-primary">{formatPrice(grandTotal)}</span>
              </div>
              <button onClick={placeOrder} className="coral-button w-full mt-6 text-lg py-4">
                Place Order • {formatPrice(grandTotal)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
