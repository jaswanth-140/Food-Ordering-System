import type { Restaurant, MenuItem, User } from '@/types';

import heroBurger from '@/assets/hero-burger.jpg';
import foodSushi from '@/assets/food-sushi.jpg';
import foodPizza from '@/assets/food-pizza.jpg';
import foodTunaRoll from '@/assets/food-tuna-roll.jpg';
import foodSmashBurger from '@/assets/food-smash-burger.jpg';
import foodTruffleFries from '@/assets/food-truffle-fries.jpg';
import foodPokeBowl from '@/assets/food-poke-bowl.jpg';
import foodClassicBurger from '@/assets/food-classic-burger.jpg';
import foodCarbonara from '@/assets/food-carbonara.jpg';
import foodRibeye from '@/assets/food-ribeye.jpg';
import foodEmberBurger from '@/assets/food-ember-burger.jpg';
import foodBruschetta from '@/assets/food-bruschetta.jpg';
import foodCalamari from '@/assets/food-calamari.jpg';
import foodCheesecake from '@/assets/food-cheesecake.jpg';
import foodSalad from '@/assets/food-salad.jpg';
import foodCola from '@/assets/food-cola.jpg';
import foodWagyuSliders from '@/assets/food-wagyu-sliders.jpg';
import foodRisotto from '@/assets/food-risotto.jpg';
import foodBurrata from '@/assets/food-burrata.jpg';
import restaurantHero from '@/assets/restaurant-hero.jpg';

export { restaurantHero };

export const CURRENCY_SYMBOL = '₹';

export function formatPrice(price: number): string {
  return `₹${price.toFixed(0)}`;
}

export const demoUser: User = {
  id: 'u1',
  name: 'Alex Johnson',
  email: 'alex.johnson@example.com',
  phone: '+91 98765 43210',
  loyaltyPoints: 1250,
  tier: 'gold',
  isAdmin: false,
};

export const adminUser: User = {
  id: 'u2',
  name: 'James Williams',
  email: 'james.w@prebite.com',
  phone: '+91 98765 43211',
  loyaltyPoints: 0,
  tier: 'gold',
  isAdmin: true,
};

export const restaurants: Restaurant[] = [
  {
    id: 'r1',
    name: 'The Burger Joint',
    cuisine: ['American', 'Burgers'],
    rating: 4.8,
    reviewCount: 1200,
    deliveryTime: '25-35 min',
    deliveryFee: 0,
    minOrder: 200,
    imageUrl: heroBurger,
    badge: 'Free Delivery',
    priceLevel: '$$',
    distance: 1.2,
  },
  {
    id: 'r2',
    name: 'Sushi Master',
    cuisine: ['Japanese', 'Sushi'],
    rating: 4.9,
    reviewCount: 850,
    deliveryTime: '40-50 min',
    deliveryFee: 49,
    minOrder: 300,
    imageUrl: foodSushi,
    badge: 'Best Seller',
    priceLevel: '$$$',
    distance: 2.4,
  },
  {
    id: 'r3',
    name: 'Bella Italia',
    cuisine: ['Italian', 'Pizza'],
    rating: 4.5,
    reviewCount: 2100,
    deliveryTime: '15-25 min',
    deliveryFee: 39,
    minOrder: 250,
    imageUrl: foodPizza,
    priceLevel: '$$',
    distance: 0.8,
  },
  {
    id: 'r4',
    name: 'Green Earth',
    cuisine: ['Vegan', 'Healthy'],
    rating: 4.6,
    reviewCount: 620,
    deliveryTime: '30-40 min',
    deliveryFee: 29,
    minOrder: 200,
    imageUrl: foodPokeBowl,
    badge: 'New',
    priceLevel: '$$',
    distance: 1.8,
  },
  {
    id: 'r5',
    name: 'The Ember Grill House',
    cuisine: ['Steakhouse', 'Modern European', 'Craft Cocktails'],
    rating: 4.9,
    reviewCount: 2100,
    deliveryTime: '35-45 min',
    deliveryFee: 0,
    minOrder: 400,
    imageUrl: restaurantHero,
    badge: 'Premium Partner',
    priceLevel: '$$$',
    distance: 1.5,
  },
  { id: 'r6', name: 'Spicy Wok', cuisine: ["Chinese","Asian"], rating: 4.7, reviewCount: 1476, deliveryTime: '25-45 min', deliveryFee: 20, minOrder: 150, imageUrl: foodCarbonara, priceLevel: '$', distance: 3.4 },
  { id: 'r7', name: 'Taco Fiesta', cuisine: ["Mexican","Tacos"], rating: 4.1, reviewCount: 357, deliveryTime: '25-45 min', deliveryFee: 20, minOrder: 150, imageUrl: foodTunaRoll, priceLevel: '$', distance: 4.5 },
  { id: 'r8', name: 'The Vegan Bowl', cuisine: ["Vegan","Healthy"], rating: 4.3, reviewCount: 129, deliveryTime: '25-45 min', deliveryFee: 20, minOrder: 150, imageUrl: foodPokeBowl, priceLevel: '$', distance: 1.5 },
  { id: 'r9', name: 'Ocean Catch Seafood', cuisine: ["Seafood"], rating: 4.1, reviewCount: 1210, deliveryTime: '25-45 min', deliveryFee: 20, minOrder: 150, imageUrl: foodCalamari, priceLevel: '$', distance: 2.8 },
  { id: 'r10', name: 'Noodle Bar', cuisine: ["Asian","Noodles"], rating: 4.0, reviewCount: 907, deliveryTime: '25-45 min', deliveryFee: 20, minOrder: 150, imageUrl: foodRisotto, priceLevel: '$', distance: 3.2 },
  { id: 'r11', name: 'Mamma Mia Pizzeria', cuisine: ["Italian","Pizza"], rating: 4.9, reviewCount: 1264, deliveryTime: '25-45 min', deliveryFee: 40, minOrder: 150, imageUrl: foodPizza, priceLevel: '$', distance: 3.4 },
  { id: 'r12', name: 'Urban Bites', cuisine: ["American","Fast Food"], rating: 5.0, reviewCount: 1400, deliveryTime: '25-45 min', deliveryFee: 0, minOrder: 150, imageUrl: heroBurger, priceLevel: '$', distance: 4.0 },
  { id: 'r13', name: 'The Green Salad', cuisine: ["Healthy","Salads"], rating: 4.0, reviewCount: 611, deliveryTime: '25-45 min', deliveryFee: 20, minOrder: 150, imageUrl: foodSalad, priceLevel: '$', distance: 2.9 },
  { id: 'r14', name: 'Street Food Corner', cuisine: ["Street Food","Indian"], rating: 4.9, reviewCount: 137, deliveryTime: '25-45 min', deliveryFee: 10, minOrder: 150, imageUrl: foodSmashBurger, priceLevel: '$', distance: 1.2 },
  { id: 'r15', name: 'Bistro 42', cuisine: ["European","Italian"], rating: 4.1, reviewCount: 1444, deliveryTime: '25-45 min', deliveryFee: 20, minOrder: 150, imageUrl: restaurantHero, priceLevel: '$', distance: 2.3 },
  { id: 'r16', name: 'Golden Dragon', cuisine: ["Chinese","Dim Sum"], rating: 4.6, reviewCount: 102, deliveryTime: '25-45 min', deliveryFee: 40, minOrder: 150, imageUrl: foodTunaRoll, priceLevel: '$', distance: 3.6 },
  { id: 'r17', name: 'El Camino', cuisine: ["Mexican","Burritos"], rating: 4.4, reviewCount: 928, deliveryTime: '25-45 min', deliveryFee: 10, minOrder: 150, imageUrl: foodPokeBowl, priceLevel: '$', distance: 4.6 },
  { id: 'r18', name: 'Healthy Haven', cuisine: ["Healthy","Vegan"], rating: 4.2, reviewCount: 1270, deliveryTime: '25-45 min', deliveryFee: 40, minOrder: 150, imageUrl: foodSalad, priceLevel: '$', distance: 4.8 },
  { id: 'r19', name: 'Morning Cafe', cuisine: ["Cafe","Breakfast"], rating: 4.9, reviewCount: 1712, deliveryTime: '25-45 min', deliveryFee: 10, minOrder: 150, imageUrl: foodBruschetta, priceLevel: '$', distance: 4.9 },
  { id: 'r20', name: 'Dessert Dreams', cuisine: ["Desserts","Gelato"], rating: 4.3, reviewCount: 1324, deliveryTime: '25-45 min', deliveryFee: 0, minOrder: 150, imageUrl: foodCheesecake, priceLevel: '$', distance: 4.2 }
];

export const menuItems: MenuItem[] = [
  // Browse page items
  {
    id: 'm1', restaurantId: 'r1', name: 'Spicy Tuna Roll',
    description: 'Fresh tuna, spicy mayo, cucumber topped with sesame seeds.',
    price: 249, category: 'Popular', imageUrl: foodTunaRoll,
    isVeg: false, allergens: ['fish', 'soy'], isBestseller: true,
  },
  {
    id: 'm2', restaurantId: 'r1', name: 'Double Smash Burger',
    description: 'Two smashed patties, american cheese, house sauce.',
    price: 349, category: 'Popular', imageUrl: foodSmashBurger,
    isVeg: false, allergens: ['dairy', 'gluten'], isBestseller: true,
  },
  {
    id: 'm3', restaurantId: 'r1', name: 'Truffle Parm Fries',
    description: 'Crispy fries tossed in truffle oil and parmesan cheese.',
    price: 199, category: 'Sides', imageUrl: foodTruffleFries,
    isVeg: true, allergens: ['dairy', 'gluten'],
  },
  {
    id: 'm4', restaurantId: 'r2', name: 'Salmon Poke Bowl',
    description: 'Sushi grade salmon, avocado, edamame, rice base.',
    price: 449, category: 'Popular', imageUrl: foodPokeBowl,
    isVeg: false, allergens: ['fish', 'soy'],
  },
  {
    id: 'm5', restaurantId: 'r1', name: 'Classic Cheeseburger',
    description: '1/4lb beef patty, cheddar, lettuce, tomato, onion.',
    price: 299, category: 'Burgers', imageUrl: foodClassicBurger,
    isVeg: false, allergens: ['dairy', 'gluten'],
  },
  {
    id: 'm6', restaurantId: 'r3', name: 'Creamy Carbonara',
    description: 'Authentic Italian spaghetti, pancetta, egg yolk, pecorino.',
    price: 399, category: 'Pasta', imageUrl: foodCarbonara,
    isVeg: false, allergens: ['dairy', 'gluten', 'eggs'],
  },

  // The Ember Grill House items
  {
    id: 'em1', restaurantId: 'r5', name: 'Prime Ribeye (12oz)',
    description: 'Grass-fed prime cut, served with roasted garlic butter and rosemary sprigs. Includes one side.',
    price: 999, category: 'Popular', imageUrl: foodRibeye,
    isVeg: false, allergens: ['dairy'], isBestseller: true,
  },
  {
    id: 'em2', restaurantId: 'r5', name: 'The Ember Burger',
    description: 'Double wagyu patty, smoked gouda, caramelized onions, house truffle mayo on brioche.',
    price: 449, category: 'Popular', imageUrl: foodEmberBurger,
    isVeg: false, allergens: ['dairy', 'gluten'],
  },
  {
    id: 'em3', restaurantId: 'r5', name: 'Rustic Bruschetta',
    description: 'Toasted sourdough, heirloom tomatoes, balsamic glaze, fresh basil.',
    price: 299, category: 'Starters', imageUrl: foodBruschetta,
    isVeg: true, allergens: ['gluten'],
  },
  {
    id: 'em4', restaurantId: 'r5', name: 'Crispy Calamari',
    description: 'Flash-fried squid rings, spicy marinara dipping sauce, lemon wedge.',
    price: 399, category: 'Starters', imageUrl: foodCalamari,
    isVeg: false, allergens: ['gluten', 'shellfish'],
  },
  {
    id: 'em5', restaurantId: 'r5', name: 'Wagyu Beef Slider Trio',
    description: 'Brioche bun, aged cheddar, truffle aioli, caramelized onions.',
    price: 799, category: 'Gourmet Burgers', imageUrl: foodWagyuSliders,
    isVeg: false, allergens: ['dairy', 'gluten'],
  },
  {
    id: 'em6', restaurantId: 'r5', name: 'Truffle Mushroom Risotto',
    description: 'Arborio rice, wild mushrooms, parmesan crisp, white truffle oil.',
    price: 599, category: 'Signature Steaks', imageUrl: foodRisotto,
    isVeg: true, allergens: ['dairy'],
  },
  {
    id: 'em7', restaurantId: 'r5', name: 'Artisan Burrata Salad',
    description: 'Heirloom tomatoes, fresh basil, balsamic glaze, extra virgin olive oil.',
    price: 449, category: 'Sides', imageUrl: foodBurrata,
    isVeg: true, allergens: ['dairy'],
  },
  {
    id: 'em8', restaurantId: 'r5', name: 'Truffle Fries',
    description: 'Hand-cut fries, truffle oil, parmesan, fresh herbs.',
    price: 249, category: 'Sides', imageUrl: foodTruffleFries,
    isVeg: true, allergens: ['dairy'],
  },
  {
    id: 'em9', restaurantId: 'r5', name: 'NY Cheesecake',
    description: 'Classic New York style cheesecake with berry compote.',
    price: 249, category: 'Drinks', imageUrl: foodCheesecake,
    isVeg: true, allergens: ['dairy', 'gluten', 'eggs'],
  },
  {
    id: 'em10', restaurantId: 'r5', name: 'Craft Cola',
    description: 'House-made artisan cola with natural spices.',
    price: 99, category: 'Drinks', imageUrl: foodCola,
    isVeg: true, allergens: [],
  },
  {
    id: 'em11', restaurantId: 'r5', name: 'Garden Side Salad',
    description: 'Mixed greens, cherry tomatoes, cucumber, house vinaigrette.',
    price: 179, category: 'Sides', imageUrl: foodSalad,
    isVeg: true, allergens: [],
  },
  { id: 'mr6_1', restaurantId: 'r6', name: 'Special Spicy Wok Dish', description: 'A delicious signature dish.', price: 449, category: 'Popular', imageUrl: foodCarbonara, isVeg: false, allergens: [], isBestseller: true },
  { id: 'mr6_2', restaurantId: 'r6', name: 'Classic Chinese', description: 'Traditional recipe.', price: 170, category: 'Mains', imageUrl: foodTunaRoll, isVeg: false, allergens: [], isBestseller: false },
  { id: 'mr6_3', restaurantId: 'r6', name: 'Side Salad', description: 'Fresh greens.', price: 99, category: 'Sides', imageUrl: foodSalad, isVeg: true, allergens: [], isBestseller: false },
  { id: 'mr7_1', restaurantId: 'r7', name: 'Special Taco Fiesta Dish', description: 'A delicious signature dish.', price: 338, category: 'Popular', imageUrl: foodTunaRoll, isVeg: false, allergens: [], isBestseller: true },
  { id: 'mr7_2', restaurantId: 'r7', name: 'Classic Mexican', description: 'Traditional recipe.', price: 348, category: 'Mains', imageUrl: foodPokeBowl, isVeg: false, allergens: [], isBestseller: false },
  { id: 'mr7_3', restaurantId: 'r7', name: 'Side Salad', description: 'Fresh greens.', price: 99, category: 'Sides', imageUrl: foodSalad, isVeg: true, allergens: [], isBestseller: false },
  { id: 'mr8_1', restaurantId: 'r8', name: 'Special The Vegan Bowl Dish', description: 'A delicious signature dish.', price: 344, category: 'Popular', imageUrl: foodPokeBowl, isVeg: false, allergens: [], isBestseller: true },
  { id: 'mr8_2', restaurantId: 'r8', name: 'Classic Vegan', description: 'Traditional recipe.', price: 285, category: 'Mains', imageUrl: foodCalamari, isVeg: false, allergens: [], isBestseller: false },
  { id: 'mr8_3', restaurantId: 'r8', name: 'Side Salad', description: 'Fresh greens.', price: 99, category: 'Sides', imageUrl: foodSalad, isVeg: true, allergens: [], isBestseller: false },
  { id: 'mr9_1', restaurantId: 'r9', name: 'Special Ocean Catch Seafood Dish', description: 'A delicious signature dish.', price: 401, category: 'Popular', imageUrl: foodCalamari, isVeg: false, allergens: [], isBestseller: true },
  { id: 'mr9_2', restaurantId: 'r9', name: 'Classic Seafood', description: 'Traditional recipe.', price: 204, category: 'Mains', imageUrl: foodRisotto, isVeg: false, allergens: [], isBestseller: false },
  { id: 'mr9_3', restaurantId: 'r9', name: 'Side Salad', description: 'Fresh greens.', price: 99, category: 'Sides', imageUrl: foodSalad, isVeg: true, allergens: [], isBestseller: false },
  { id: 'mr10_1', restaurantId: 'r10', name: 'Special Noodle Bar Dish', description: 'A delicious signature dish.', price: 339, category: 'Popular', imageUrl: foodRisotto, isVeg: false, allergens: [], isBestseller: true },
  { id: 'mr10_2', restaurantId: 'r10', name: 'Classic Asian', description: 'Traditional recipe.', price: 176, category: 'Mains', imageUrl: foodPizza, isVeg: false, allergens: [], isBestseller: false },
  { id: 'mr10_3', restaurantId: 'r10', name: 'Side Salad', description: 'Fresh greens.', price: 99, category: 'Sides', imageUrl: foodSalad, isVeg: true, allergens: [], isBestseller: false },
  { id: 'mr11_1', restaurantId: 'r11', name: 'Special Mamma Mia Pizzeria Dish', description: 'A delicious signature dish.', price: 448, category: 'Popular', imageUrl: foodPizza, isVeg: false, allergens: [], isBestseller: true },
  { id: 'mr11_2', restaurantId: 'r11', name: 'Classic Italian', description: 'Traditional recipe.', price: 287, category: 'Mains', imageUrl: heroBurger, isVeg: false, allergens: [], isBestseller: false },
  { id: 'mr11_3', restaurantId: 'r11', name: 'Side Salad', description: 'Fresh greens.', price: 99, category: 'Sides', imageUrl: foodSalad, isVeg: true, allergens: [], isBestseller: false },
  { id: 'mr12_1', restaurantId: 'r12', name: 'Special Urban Bites Dish', description: 'A delicious signature dish.', price: 391, category: 'Popular', imageUrl: heroBurger, isVeg: false, allergens: [], isBestseller: true },
  { id: 'mr12_2', restaurantId: 'r12', name: 'Classic American', description: 'Traditional recipe.', price: 276, category: 'Mains', imageUrl: foodSalad, isVeg: false, allergens: [], isBestseller: false },
  { id: 'mr12_3', restaurantId: 'r12', name: 'Side Salad', description: 'Fresh greens.', price: 99, category: 'Sides', imageUrl: foodSalad, isVeg: true, allergens: [], isBestseller: false },
  { id: 'mr13_1', restaurantId: 'r13', name: 'Special The Green Salad Dish', description: 'A delicious signature dish.', price: 365, category: 'Popular', imageUrl: foodSalad, isVeg: false, allergens: [], isBestseller: true },
  { id: 'mr13_2', restaurantId: 'r13', name: 'Classic Healthy', description: 'Traditional recipe.', price: 225, category: 'Mains', imageUrl: foodSmashBurger, isVeg: false, allergens: [], isBestseller: false },
  { id: 'mr13_3', restaurantId: 'r13', name: 'Side Salad', description: 'Fresh greens.', price: 99, category: 'Sides', imageUrl: foodSalad, isVeg: true, allergens: [], isBestseller: false },
  { id: 'mr14_1', restaurantId: 'r14', name: 'Special Street Food Corner Dish', description: 'A delicious signature dish.', price: 385, category: 'Popular', imageUrl: foodSmashBurger, isVeg: false, allergens: [], isBestseller: true },
  { id: 'mr14_2', restaurantId: 'r14', name: 'Classic Street Food', description: 'Traditional recipe.', price: 298, category: 'Mains', imageUrl: restaurantHero, isVeg: false, allergens: [], isBestseller: false },
  { id: 'mr14_3', restaurantId: 'r14', name: 'Side Salad', description: 'Fresh greens.', price: 99, category: 'Sides', imageUrl: foodSalad, isVeg: true, allergens: [], isBestseller: false },
  { id: 'mr15_1', restaurantId: 'r15', name: 'Special Bistro 42 Dish', description: 'A delicious signature dish.', price: 496, category: 'Popular', imageUrl: restaurantHero, isVeg: false, allergens: [], isBestseller: true },
  { id: 'mr15_2', restaurantId: 'r15', name: 'Classic European', description: 'Traditional recipe.', price: 316, category: 'Mains', imageUrl: foodTunaRoll, isVeg: false, allergens: [], isBestseller: false },
  { id: 'mr15_3', restaurantId: 'r15', name: 'Side Salad', description: 'Fresh greens.', price: 99, category: 'Sides', imageUrl: foodSalad, isVeg: true, allergens: [], isBestseller: false },
  { id: 'mr16_1', restaurantId: 'r16', name: 'Special Golden Dragon Dish', description: 'A delicious signature dish.', price: 234, category: 'Popular', imageUrl: foodTunaRoll, isVeg: false, allergens: [], isBestseller: true },
  { id: 'mr16_2', restaurantId: 'r16', name: 'Classic Chinese', description: 'Traditional recipe.', price: 164, category: 'Mains', imageUrl: foodPokeBowl, isVeg: false, allergens: [], isBestseller: false },
  { id: 'mr16_3', restaurantId: 'r16', name: 'Side Salad', description: 'Fresh greens.', price: 99, category: 'Sides', imageUrl: foodSalad, isVeg: true, allergens: [], isBestseller: false },
  { id: 'mr17_1', restaurantId: 'r17', name: 'Special El Camino Dish', description: 'A delicious signature dish.', price: 454, category: 'Popular', imageUrl: foodPokeBowl, isVeg: false, allergens: [], isBestseller: true },
  { id: 'mr17_2', restaurantId: 'r17', name: 'Classic Mexican', description: 'Traditional recipe.', price: 152, category: 'Mains', imageUrl: foodSalad, isVeg: false, allergens: [], isBestseller: false },
  { id: 'mr17_3', restaurantId: 'r17', name: 'Side Salad', description: 'Fresh greens.', price: 99, category: 'Sides', imageUrl: foodSalad, isVeg: true, allergens: [], isBestseller: false },
  { id: 'mr18_1', restaurantId: 'r18', name: 'Special Healthy Haven Dish', description: 'A delicious signature dish.', price: 247, category: 'Popular', imageUrl: foodSalad, isVeg: false, allergens: [], isBestseller: true },
  { id: 'mr18_2', restaurantId: 'r18', name: 'Classic Healthy', description: 'Traditional recipe.', price: 216, category: 'Mains', imageUrl: foodBruschetta, isVeg: false, allergens: [], isBestseller: false },
  { id: 'mr18_3', restaurantId: 'r18', name: 'Side Salad', description: 'Fresh greens.', price: 99, category: 'Sides', imageUrl: foodSalad, isVeg: true, allergens: [], isBestseller: false },
  { id: 'mr19_1', restaurantId: 'r19', name: 'Special Morning Cafe Dish', description: 'A delicious signature dish.', price: 494, category: 'Popular', imageUrl: foodBruschetta, isVeg: false, allergens: [], isBestseller: true },
  { id: 'mr19_2', restaurantId: 'r19', name: 'Classic Cafe', description: 'Traditional recipe.', price: 264, category: 'Mains', imageUrl: foodCheesecake, isVeg: false, allergens: [], isBestseller: false },
  { id: 'mr19_3', restaurantId: 'r19', name: 'Side Salad', description: 'Fresh greens.', price: 99, category: 'Sides', imageUrl: foodSalad, isVeg: true, allergens: [], isBestseller: false },
  { id: 'mr20_1', restaurantId: 'r20', name: 'Special Dessert Dreams Dish', description: 'A delicious signature dish.', price: 407, category: 'Popular', imageUrl: foodCheesecake, isVeg: false, allergens: [], isBestseller: true },
  { id: 'mr20_2', restaurantId: 'r20', name: 'Classic Desserts', description: 'Traditional recipe.', price: 191, category: 'Mains', imageUrl: foodCarbonara, isVeg: false, allergens: [], isBestseller: false },
  { id: 'mr20_3', restaurantId: 'r20', name: 'Side Salad', description: 'Fresh greens.', price: 99, category: 'Sides', imageUrl: foodSalad, isVeg: true, allergens: [], isBestseller: false }
];

export const categories = [
  { id: 'all', label: 'All', emoji: '' },
  { id: 'burgers', label: 'Burgers', emoji: '🍔' },
  { id: 'sushi', label: 'Sushi', emoji: '🍣' },
  { id: 'vegan', label: 'Vegan', emoji: '🥗' },
  { id: 'pizza', label: 'Pizza', emoji: '🍕' },
  { id: 'dessert', label: 'Dessert', emoji: '🍰' },
  { id: 'asian', label: 'Asian', emoji: '🍜' },
];

export const restaurantMenuCategories: Record<string, string[]> = {
  r5: ['Popular', 'Starters', 'Signature Steaks', 'Gourmet Burgers', 'Sides', 'Drinks'],
  r1: ['Popular', 'Burgers', 'Sides'],
  r2: ['Popular', 'Sushi Rolls', 'Bowls'],
  r3: ['Popular', 'Pizza', 'Pasta'],
  r4: ['Popular', 'Bowls', 'Salads'],
  r6: ['Popular', 'Mains', 'Sides'],
  r7: ['Popular', 'Mains', 'Sides'],
  r8: ['Popular', 'Mains', 'Sides'],
  r9: ['Popular', 'Mains', 'Sides'],
  r10: ['Popular', 'Mains', 'Sides'],
  r11: ['Popular', 'Mains', 'Sides'],
  r12: ['Popular', 'Mains', 'Sides'],
  r13: ['Popular', 'Mains', 'Sides'],
  r14: ['Popular', 'Mains', 'Sides'],
  r15: ['Popular', 'Mains', 'Sides'],
  r16: ['Popular', 'Mains', 'Sides'],
  r17: ['Popular', 'Mains', 'Sides'],
  r18: ['Popular', 'Mains', 'Sides'],
  r19: ['Popular', 'Mains', 'Sides'],
  r20: ['Popular', 'Mains', 'Sides'],

};
