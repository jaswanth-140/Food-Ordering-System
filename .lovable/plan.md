

# PreBite Prototype Payment System

## Overview
Implement a complete mock checkout and payment flow with 3 payment methods (COD, Card, UPI), order confirmation, and order tracking -- all simulated with no real payment processing.

## What Gets Built

### 1. Database Tables
- **orders** table: `id`, `user_id`, `restaurant_name`, `items` (JSONB), `subtotal`, `delivery_fee`, `tax`, `discount`, `total`, `payment_method` (COD/Card/UPI), `payment_status` (pending/completed), `is_paid`, `delivery_address` (JSONB), `note`, `estimated_delivery`, `created_at`
- **saved_cards** table: `id`, `user_id`, `last4`, `brand`, `expiry_month`, `expiry_year`, `cardholder_name`, `created_at`
- RLS policies allowing authenticated users to manage their own orders and saved cards

### 2. New Pages

**CheckoutPage** (`/checkout`)
- Order summary section (restaurant info, item list, bill breakdown from cart)
- Delivery address card (hardcoded "Home" address for prototype)
- Kitchen note carried over from cart
- 3 payment method selector cards (COD, Card, UPI) with coral border glow on active
- Dynamic payment detail area below based on selection:
  - **COD**: Simple confirmation message
  - **Card**: Saved card list OR new card form with auto-formatting, brand detection, save checkbox
  - **UPI**: Desktop shows QR code (using `qrcode` library), mobile shows app buttons (Google Pay, PhonePe, Paytm, BHIM)
- "Place Order" button with simulated 2-second processing animation
- Success overlay with green checkmark, order summary, and redirect buttons

**OrderTrackingPage** (`/tracking/:orderId`)
- Order status stepper (Confirmed -> Preparing -> Out for Delivery -> Delivered)
- Auto-advances through statuses every few seconds for demo effect
- Order details card (items, payment method, total)
- Estimated delivery time
- Map placeholder area

### 3. Updated Files

- **App.tsx**: Add routes for `/checkout` and `/tracking/:orderId`
- **types/index.ts**: Add `SavedCard` interface, update `Order` type with payment fields
- **CartPage.tsx**: Remove "Razorpay" text, ensure `/checkout` link works
- **RestaurantPage.tsx**: Remove "Razorpay" reference
- **BrowsePage.tsx**: Ensure checkout link works

### 4. Key Implementation Details

- **Card brand detection**: `4xxx=Visa`, `5xxx=Mastercard`, `6xxx=RuPay`, `3xxx=Amex`
- **Card number formatting**: Auto-insert spaces every 4 digits as user types
- **QR code**: Install `qrcode` package, generate UPI deep link format
- **Mobile detection**: `navigator.userAgent` check for showing app buttons vs QR
- **Processing simulation**: `setTimeout(2000)` with coral spinner overlay
- **Success always**: No failure states -- every payment succeeds (demo mode)
- **Currency**: All prices remain in INR (₹)
- **Auth**: Uses existing mock auth context; orders stored with demo user ID

## Technical Details

### New Dependencies
- `qrcode` (for UPI QR code generation)

### File Creation Order
1. Database migration (orders + saved_cards tables with RLS)
2. `src/types/index.ts` -- add SavedCard, update Order
3. `src/pages/CheckoutPage.tsx` -- full checkout with payment methods
4. `src/pages/OrderTrackingPage.tsx` -- order tracking with status stepper
5. `src/App.tsx` -- add new routes
6. Update `CartPage.tsx` and `RestaurantPage.tsx` -- remove Razorpay references

### Component Structure (CheckoutPage)
```text
CheckoutPage
+-- Order Summary (items list + bill)
+-- Delivery Address Card
+-- PaymentMethodSelector (3 glass cards)
|   +-- CODSection
|   +-- CardPaymentSection
|   |   +-- SavedCardList
|   |   +-- NewCardForm (with formatting + validation)
|   +-- UPISection
|       +-- QRCodeDisplay (desktop)
|       +-- UPIAppButtons (mobile)
+-- PlaceOrderButton
+-- ProcessingOverlay (spinner + "Processing payment...")
+-- SuccessOverlay (checkmark + order summary + redirect)
```

