export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  loyaltyPoints: number;
  tier: 'bronze' | 'silver' | 'gold';
  isAdmin: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string[];
  rating: number;
  reviewCount: number;
  deliveryTime: string;
  deliveryFee: number;
  minOrder: number;
  imageUrl: string;
  badge?: 'Free Delivery' | 'Best Seller' | 'New' | 'Premium Partner';
  priceLevel: '$' | '$$' | '$$$';
  distance: number;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  isVeg: boolean;
  allergens: string[];
  isBestseller?: boolean;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  customization?: string;
}

export interface SavedCard {
  id: string;
  userId: string;
  last4: string;
  brand: 'Visa' | 'Mastercard' | 'RuPay' | 'Amex';
  expiryMonth: string;
  expiryYear: string;
  cardholderName: string;
}

export interface Order {
  id: string;
  userId: string;
  restaurant: Restaurant;
  items: CartItem[];
  status: 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered';
  total: number;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  paymentMethod: 'COD' | 'Card' | 'UPI';
  paymentStatus: 'pending' | 'completed';
  isPaid: boolean;
  address: Address;
  note?: string;
  estimatedDelivery: string;
  createdAt: Date;
}

export interface Address {
  id: string;
  label: 'Home' | 'Work' | 'Other';
  street: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
}

export interface FavoriteCollection {
  id: string;
  name: string;
  items: FavoriteItem[];
  isPublic: boolean;
  updatedAt: Date;
}

export interface FavoriteItem {
  id: string;
  type: 'dish' | 'restaurant';
  item: MenuItem | Restaurant;
  collectionId: string;
  savedCustomization?: string;
  savedAt: Date;
}

export interface ScheduledOrder {
  id: string;
  templateOrder: Partial<Order>;
  recurrenceRule: {
    frequency: 'once' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
    days?: number[];
    endDate?: Date;
    endAfterCount?: number;
  };
  nextRunAt: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface MealPlanSlot {
  id: string;
  weekStartDate: string;
  dayOfWeek: number;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  menuItem?: MenuItem;
  isScheduled: boolean;
}

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
