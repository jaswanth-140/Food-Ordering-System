import catBiryani from '@/assets/cat-biryani.png';
import catBreakfast from '@/assets/cat-breakfast.png';
import catBurger from '@/assets/cat-burger.png';
import catCake from '@/assets/cat-cake.png';
import catChicken from '@/assets/cat-chicken.png';
import catChinese from '@/assets/cat-chinese.png';
import catCoffee from '@/assets/cat-coffee.png';
import catDosa from '@/assets/cat-dosa.png';
import catFastfood from '@/assets/cat-fastfood.png';
import catIcecream from '@/assets/cat-icecream.png';
import catIndian from '@/assets/cat-indian.png';
import catKebab from '@/assets/cat-kebab.png';
import catMeals from '@/assets/cat-meals.png';
import catPasta from '@/assets/cat-pasta.png';
import catPizza from '@/assets/cat-pizza.png';
import catSandwich from '@/assets/cat-sandwich.png';
import catSushi from '@/assets/cat-sushi.png';
import catTea from '@/assets/cat-tea.png';
import catTiffin from '@/assets/cat-tiffin.png';
import dishGulabJamun from '@/assets/dish-gulab-jamun.svg';
import dishPaneerTikka from '@/assets/dish-paneer-tikka.svg';
import foodCola from '@/assets/food-cola.jpg';
import foodPokeBowl from '@/assets/food-poke-bowl.jpg';
import foodSalad from '@/assets/food-salad.jpg';
import foodTruffleFries from '@/assets/food-truffle-fries.jpg';
import { dishImageMap } from '@/data/dishImageMap';

type MenuImageInput = {
  name: string;
  category?: string;
  isVeg?: boolean;
  imageUrl?: string;
};

// ── Keyword rules (most specific first → generic last) ──────────────
// Each entry: [keywords to match, fallback image asset]
const keywordRules: Array<[string[], string]> = [
  // --- Specific dishes first ---
  [['hyderabadi chicken biryani', 'chicken dum biryani', 'chicken biryani'], '/dishes/chicken-biryani.jpg'],
  [['mutton dum biryani', 'mutton biryani'], '/dishes/mutton-biryani.jpg'],
  [['paneer biryani', 'veg dum biryani', 'veg biryani', 'egg biryani', 'pulao', 'pulav', 'pilaf', 'pilau'], '/dishes/veg-biryani.jpg'],
  [['biryani', 'mandi'], catBiryani],
  [['masala dosa', 'plain dosa', 'butter masala dosa', 'ghee roast dosa', 'paper dosa', 'dosa', 'uttapam', 'uttappa'], '/dishes/masala-dosa.png'],
  [['idli', 'idly', 'ghee roast idly'], '/dishes/idli.jpg'],
  [['medu vada', 'medu wada', 'vada', 'bonda'], '/dishes/medu-vada.jpg'],
  [['rose gulab jamun', 'gulab jamun', 'jamun'], dishGulabJamun],
  [['paneer tikka', 'tandoori paneer', 'paneer kebab'], dishPaneerTikka],

  // --- Breads (MUST come before meals/thali to prevent naan→thali mismatch) ---
  [['butter naan', 'garlic naan', 'plain naan', 'cheese naan', 'naan', 'roti', 'chapati', 'rumali roti', 'laccha paratha', 'kulcha', 'kulche'], catTiffin],

  // --- Indian curries & dals ---
  [['dal makhani', 'dal tadka', 'dal fry', 'yellow dal', 'toor dal', 'dal', 'rajma', 'chole', 'chana masala', 'kadhi', 'sambar'], catIndian],
  [['paneer butter masala'], '/dishes/paneer-butter-masala.jpg'],
  [['palak paneer', 'shahi paneer', 'paneer masala', 'matar paneer', 'paneer'], catIndian],
  [['butter chicken', 'chicken curry', 'kadai chicken', 'chicken masala'], catChicken],

  // --- Tandoori / grilled items ---
  [['tandoori chicken', 'chicken tandoori', 'tandoori', 'tikka', 'seekh kebab', 'reshmi kebab', 'kebab', 'kabab', 'fish fingers'], catKebab],

  // --- Snacks & breakfast ---
  [['samosa', 'kachori', 'golgappe', 'mirchi bajji', 'pakora', 'bhajia', 'bajji'], catBreakfast],
  [['poori', 'puri', 'poori bhaji', 'puri bhaji', 'chole poori', 'chole puri', 'parotta', 'paratha', 'pongal', 'upma', 'poha', 'tiffin'], catTiffin],

  // --- Fast food ---
  [['burger', 'vada pav'], catBurger],
  [['sandwich', 'sub', 'shawarma', 'roll', 'hot dog', 'wrap'], catSandwich],
  [['fries', 'french fries'], foodTruffleFries],
  [['pizza'], catPizza],
  [['pasta', 'macaroni', 'spaghetti', 'penne'], catPasta],

  // --- Chinese / Asian ---
  [['chicken fried rice'], '/dishes/chicken-fried-rice.jpg'],
  [['chicken manchurian', 'manchurian'], '/dishes/chicken-manchurian.png'],
  [['chilli chicken', 'chicken lollipop', 'chicken lollipops', 'chicken 65'], '/dishes/chicken-65.jpg'],
  [['fried rice', 'noodles', 'maggi', 'hakka', 'schezwan', 'gobi manchurian', 'spring roll', 'momos'], catChinese],

  // --- Beverages ---
  [['coffee', 'cold coffee', 'cappuccino', 'latte', 'espresso'], catCoffee],
  [['tea', 'chai', 'masala tea', 'green tea'], catTea],
  [['juice', 'lassi', 'cold drink', 'lemonade', 'nimbu pani', 'buttermilk', 'chaas'], foodCola],

  // --- Desserts & sweets ---
  [['cake', 'cupcake', 'pastry', 'brownie', 'muffin', 'cookies', 'croissant', 'waffle', 'sweets', 'chocolate', 'rasgulla', 'rasmalai', 'jalebi', 'ladoo', 'barfi', 'halwa'], catCake],
  [['ice cream', 'sundae', 'milkshake', 'kulfi', 'falooda'], catIcecream],

  // --- Salads & healthy ---
  [['salad', 'muesli', 'dahi bhalle', 'raita'], foodSalad],
  [['bowl', 'poke bowl', 'grain bowl'], foodPokeBowl],

  // --- Generic catch-alls (order matters — chicken/wings should be after specific chicken dishes) ---
  [['sushi'], catSushi],
  [['fast food'], catFastfood],
  [['wings', 'nihari', 'haleem', 'omelette', 'prawns', 'fish', 'mutton', 'chicken 65', 'chicken'], catChicken],
  [['thali', 'veg meal', 'khichdi', 'curd rice', 'sambar rice', 'dal kachori', 'meals'], catMeals],
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Token-aware matching: checks if all words of the key appear in the haystack
 * in sequence. This handles cases like "chicken dum biryani" matching key
 * "chicken biryani" (where strict substring fails because of the middle word).
 */
function tokenMatch(haystack: string, key: string): boolean {
  // First try exact substring (fastest)
  if (haystack.includes(key)) return true;

  // Then try token-order match: all key words must appear in order in the haystack
  const keyWords = key.split(' ');
  if (keyWords.length < 2) return false;

  let searchFrom = 0;
  for (const word of keyWords) {
    const idx = haystack.indexOf(word, searchFrom);
    if (idx === -1) return false;
    searchFrom = idx + word.length;
  }
  return true;
}

export function resolveDownloadedDishImage(name: string, category = ''): string | null {
  const dishKey = normalize(name);
  const categoryKey = normalize(category);

  // 1. Exact match on dish name
  if (dishImageMap[dishKey] && !dishImageMap[dishKey].startsWith('/assets/')) return dishImageMap[dishKey];

  // 2. Exact match on category
  if (categoryKey && dishImageMap[categoryKey] && !dishImageMap[categoryKey].startsWith('/assets/')) return dishImageMap[categoryKey];

  // 3. Token-aware fuzzy match (longest key first for best specificity)
  const haystack = `${dishKey} ${categoryKey}`.trim();
  const sortedKeys = Object.keys(dishImageMap).sort((a, b) => b.length - a.length);
  const matchedKey = sortedKeys.find((key) => tokenMatch(haystack, key));
  if (!matchedKey) return null;
  const matchedUrl = dishImageMap[matchedKey];
  return matchedUrl.startsWith('/assets/') ? null : matchedUrl;
}

export function getMenuItemImage(name: string, category = '', isVeg = false): string {
  // Layer 1: Keyword-based deterministic mapping (most reliable)
  const haystack = normalize(`${name} ${category}`);

  for (const [keywords, image] of keywordRules) {
    if (keywords.some((keyword) => tokenMatch(haystack, keyword))) {
      return image;
    }
  }

  // Layer 2: Check downloaded/static map if deterministic rules did not hit
  const downloaded = resolveDownloadedDishImage(name, category);
  if (downloaded) return downloaded;

  // Layer 3: Broad category heuristics
  if (haystack.includes('dessert')) return dishGulabJamun;
  if (haystack.includes('beverage') || haystack.includes('drink')) return catCoffee;
  if (haystack.includes('bread') || haystack.includes('rice') || haystack.includes('main')) {
    return isVeg ? catMeals : catChicken;
  }

  // Layer 4: Ultimate fallback by veg/non-veg
  return isVeg ? catMeals : catChicken;
}

export function withMenuItemImage<T extends MenuImageInput>(item: T): T {
  // If item already has a valid HTTP URL, keep it
  if (item.imageUrl && /^https?:\/\//i.test(item.imageUrl)) return item;

  return {
    ...item,
    imageUrl: getMenuItemImage(item.name, item.category, item.isVeg),
  };
}
