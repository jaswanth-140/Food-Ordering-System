// Local food images for restaurant cards
import foodBruschetta from '@/assets/food-bruschetta.jpg';
import foodBurrata from '@/assets/food-burrata.jpg';
import foodCalamari from '@/assets/food-calamari.jpg';
import foodCarbonara from '@/assets/food-carbonara.jpg';
import foodCheesecake from '@/assets/food-cheesecake.jpg';
import foodClassicBurger from '@/assets/food-classic-burger.jpg';
import foodCola from '@/assets/food-cola.jpg';
import foodEmberBurger from '@/assets/food-ember-burger.jpg';
import foodPizza from '@/assets/food-pizza.jpg';
import foodPokeBowl from '@/assets/food-poke-bowl.jpg';
import foodRibeye from '@/assets/food-ribeye.jpg';
import foodRisotto from '@/assets/food-risotto.jpg';
import foodSalad from '@/assets/food-salad.jpg';
import foodSmashBurger from '@/assets/food-smash-burger.jpg';
import foodSushi from '@/assets/food-sushi.jpg';
import foodTruffleFries from '@/assets/food-truffle-fries.jpg';
import foodTunaRoll from '@/assets/food-tuna-roll.jpg';
import foodWagyuSliders from '@/assets/food-wagyu-sliders.jpg';

// Brand-specific images
import brandMcdonalds from '@/assets/brand-mcdonalds.jpg';
import brandStarbucks from '@/assets/brand-starbucks.jpg';
import brandTacobell from '@/assets/brand-tacobell.jpg';
import brandSubway from '@/assets/brand-subway.jpg';
import brandBurgerking from '@/assets/brand-burgerking.jpg';

// Category-specific restaurant images (multiple variants per category)
import restoCoffeeShop from '@/assets/resto-coffee-shop.jpg';
import restoCoffeeShop2 from '@/assets/resto-coffee-shop-2.jpg';
import restoFastFood from '@/assets/resto-fast-food.jpg';
import restoFastFood2 from '@/assets/resto-fast-food-2.jpg';
import restoPizza from '@/assets/resto-pizza.jpg';
import restoPizza2 from '@/assets/resto-pizza-2.jpg';
import restoIndian from '@/assets/resto-indian.jpg';
import restoIndian2 from '@/assets/resto-indian-2.jpg';
import restoIndian3 from '@/assets/resto-indian-3.jpg';
import restoChinese from '@/assets/resto-chinese.jpg';
import restoTiffin from '@/assets/resto-tiffin.jpg';
import restoTiffin2 from '@/assets/resto-tiffin-2.jpg';
import restoBakery from '@/assets/resto-bakery.jpg';
import restoBiryani from '@/assets/resto-biryani.jpg';
import restoBiryani2 from '@/assets/resto-biryani-2.jpg';
import restoBurger from '@/assets/resto-burger.jpg';
import restoBurger2 from '@/assets/resto-burger-2.jpg';
import restoFineDining from '@/assets/resto-fine-dining.jpg';
import restoSushi from '@/assets/resto-sushi.jpg';
import restoIcecream from '@/assets/resto-icecream.jpg';

// Legacy generic exteriors as final fallback
import restoExterior1 from '@/assets/resto-exterior-1.jpg';
import restoExterior2 from '@/assets/resto-exterior-2.jpg';
import restoExterior3 from '@/assets/resto-exterior-3.jpg';
import restoExterior4 from '@/assets/resto-exterior-4.jpg';
import restoExterior5 from '@/assets/resto-exterior-5.jpg';
import restoExterior6 from '@/assets/resto-exterior-6.jpg';
import restoExterior7 from '@/assets/resto-exterior-7.jpg';
import restoExterior8 from '@/assets/resto-exterior-8.jpg';

const foodImages = [
  foodBruschetta, foodBurrata, foodCalamari, foodCarbonara,
  foodCheesecake, foodClassicBurger, foodCola, foodEmberBurger,
  foodPizza, foodPokeBowl, foodRibeye, foodRisotto,
  foodSalad, foodSmashBurger, foodSushi, foodTruffleFries,
  foodTunaRoll, foodWagyuSliders,
];

const fallbackExteriors = [
  restoExterior1, restoExterior2, restoExterior3, restoExterior4,
  restoExterior5, restoExterior6, restoExterior7, restoExterior8,
];

// ── Brand-specific exact matches (checked first) ────────────────────
// Each entry: [keywords, dedicated image]
const brandRules: [string[], string][] = [
  [['mcdonald', 'mcdonalds', "mcdonald's"], brandMcdonalds],
  [['starbucks'], brandStarbucks],
  [['taco bell'], brandTacobell],
  [['subway'], brandSubway],
  [['burger king'], brandBurgerking],
];

// ── Category rules with multiple variants ───────────────────────────
// Each entry: [keywords, array of variant images]
const categoryRules: [string[], string[]][] = [
  [['café coffee day', 'ccd', 'costa coffee', 'blue tokai', 'third wave', 'coffee', 'cafe', 'café'], [restoCoffeeShop, restoCoffeeShop2]],
  [['kfc', 'wendy', 'popeyes', 'fast food'], [restoFastFood, restoFastFood2]],
  [['domino', "domino's", 'pizza hut', 'pizza'], [restoPizza, restoPizza2]],
  [['sushi', 'japanese', 'ramen', 'udon'], [restoSushi]],
  [['chinese', 'manchurian', 'noodle', 'wok', 'dim sum', 'momos'], [restoChinese]],
  [['biryani', 'mughlai', 'kebab', 'kabab', 'tandoor', 'nawab'], [restoBiryani, restoBiryani2]],
  [['tiffin', 'idli', 'dosa', 'south indian', 'udupi', 'darshini', 'sagar'], [restoTiffin, restoTiffin2]],
  [['bakery', 'cake', 'pastry', 'patisserie', 'sweet', 'mithai'], [restoBakery]],
  [['ice cream', 'icecream', 'gelato', 'frozen', 'baskin', 'naturals', 'cream stone'], [restoIcecream]],
  [['burger', 'smash', 'grill house', 'bbq', 'barbeque'], [restoBurger, restoBurger2]],
  [['north indian', 'punjabi', 'dhaba', 'thali', 'curry', 'indian', 'multi-cuisine', 'multi cuisine', 'restaurant'], [restoIndian, restoIndian2, restoIndian3]],
  [['fine dining', 'premium', 'luxury', 'lounge', 'bar & grill'], [restoFineDining]],
];

function hashStr(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getLocalFoodImage(name: string): string {
  return foodImages[hashStr(name) % foodImages.length];
}

/**
 * Returns a restaurant image that matches the restaurant's name and cuisine.
 * Brand-specific names get their own dedicated image.
 * Category matches rotate through multiple variants using name hash.
 */
export function getRestaurantExterior(name: string, cuisines?: string[]): string {
  const haystack = [name, ...(cuisines || [])].join(' ').toLowerCase();

  // 1. Check brand-specific matches first
  for (const [keywords, image] of brandRules) {
    if (keywords.some(kw => haystack.includes(kw))) {
      return image;
    }
  }

  // 2. Check category matches — pick a variant deterministically by name hash
  for (const [keywords, images] of categoryRules) {
    if (keywords.some(kw => haystack.includes(kw))) {
      return images[hashStr(name) % images.length];
    }
  }

  // 3. Fallback: deterministic pick from generic exteriors
  return fallbackExteriors[hashStr(name) % fallbackExteriors.length];
}
