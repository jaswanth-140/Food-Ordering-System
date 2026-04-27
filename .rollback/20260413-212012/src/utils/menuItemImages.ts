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
import catKebab from '@/assets/cat-kebab.png';
import catMeals from '@/assets/cat-meals.png';
import catPasta from '@/assets/cat-pasta.png';
import catPizza from '@/assets/cat-pizza.png';
import catSandwich from '@/assets/cat-sandwich.png';
import catSushi from '@/assets/cat-sushi.png';
import catTea from '@/assets/cat-tea.png';
import catTiffin from '@/assets/cat-tiffin.png';
import dishBiryani from '@/assets/dish-biryani.svg';
import dishDosa from '@/assets/dish-dosa.svg';
import dishGulabJamun from '@/assets/dish-gulab-jamun.svg';
import dishIdli from '@/assets/dish-idli.svg';
import dishPaneerTikka from '@/assets/dish-paneer-tikka.svg';
import dishVada from '@/assets/dish-vada.svg';
import foodCola from '@/assets/food-cola.jpg';
import foodPokeBowl from '@/assets/food-poke-bowl.jpg';
import foodSalad from '@/assets/food-salad.jpg';
import foodTruffleFries from '@/assets/food-truffle-fries.jpg';

type MenuImageInput = {
  name: string;
  category?: string;
  isVeg?: boolean;
  imageUrl?: string;
};

const keywordRules: Array<[string[], string]> = [
  [['hyderabadi chicken biryani', 'chicken dum biryani', 'mutton dum biryani', 'paneer biryani', 'veg dum biryani', 'chicken biryani', 'biryani', 'mandi', 'pulao'], dishBiryani],
  [['masala dosa', 'plain dosa', 'butter masala dosa', 'dosa', 'uttapam', 'uttappa'], dishDosa],
  [['idli', 'idly', 'ghee roast idly'], dishIdli],
  [['medu vada', 'medu wada', 'vada', 'bonda'], dishVada],
  [['rose gulab jamun', 'gulab jamun', 'jamun'], dishGulabJamun],
  [['paneer tikka', 'tandoori paneer', 'paneer kebab'], dishPaneerTikka],
  [['samosa', 'kachori', 'golgappe', 'mirchi bajji'], catBreakfast],
  [['poori', 'poori bhaji', 'chole poori', 'parotta', 'paratha', 'kulcha', 'kulche', 'pongal', 'upma', 'poha', 'tiffin'], catTiffin],
  [['burger', 'vada pav'], catBurger],
  [['sandwich', 'sub', 'shawarma', 'roll', 'hot dog'], catSandwich],
  [['fries'], foodTruffleFries],
  [['coffee', 'cold coffee'], catCoffee],
  [['tea'], catTea],
  [['cake', 'cupcake', 'pastry', 'brownie', 'muffin', 'cookies', 'croissant', 'waffle', 'sweets', 'chocolate'], catCake],
  [['ice cream', 'sundae', 'milkshake'], catIcecream],
  [['pizza'], catPizza],
  [['pasta', 'macaroni'], catPasta],
  [['noodles', 'manchurian', 'fried rice', 'maggi', 'hakka', 'schezwan'], catChinese],
  [['juice', 'lassi', 'cold drink'], foodCola],
  [['kebab', 'kabab', 'fish fingers', 'tikka'], catKebab],
  [['wings', 'nihari', 'haleem', 'butter chicken', 'omelette', 'prawns', 'fish', 'mutton', 'chicken 65', 'chicken'], catChicken],
  [['salad', 'muesli', 'dahi bhalle'], foodSalad],
  [['veg meal', 'thali', 'khichdi', 'curd rice', 'sambar rice', 'dal kachori', 'naan'], catMeals],
  [['sushi'], catSushi],
  [['bowl'], foodPokeBowl],
  [['fast food'], catFastfood],
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

export function getMenuItemImage(name: string, category = '', isVeg = false): string {
  const haystack = normalize(`${name} ${category}`);

  for (const [keywords, image] of keywordRules) {
    if (keywords.some((keyword) => haystack.includes(keyword))) {
      return image;
    }
  }

  if (haystack.includes('dessert')) return dishGulabJamun;
  if (haystack.includes('beverage') || haystack.includes('drink')) return catCoffee;
  if (haystack.includes('bread') || haystack.includes('rice') || haystack.includes('main')) {
    return isVeg ? catMeals : catChicken;
  }

  return isVeg ? catMeals : catChicken;
}

export function withMenuItemImage<T extends MenuImageInput>(item: T): T {
  if (item.imageUrl && /^https?:\/\//i.test(item.imageUrl)) return item;

  return {
    ...item,
    imageUrl: getMenuItemImage(item.name, item.category, item.isVeg),
  };
}
