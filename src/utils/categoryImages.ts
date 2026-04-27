import catAll from '@/assets/cat-all.png';
import catIndian from '@/assets/cat-indian.png';
import catBurger from '@/assets/cat-burger.png';
import catChicken from '@/assets/cat-chicken.png';
import catChinese from '@/assets/cat-chinese.png';
import catPizza from '@/assets/cat-pizza.png';
import catSandwich from '@/assets/cat-sandwich.png';
import catBreakfast from '@/assets/cat-breakfast.png';
import catMeals from '@/assets/cat-meals.png';
import catKebab from '@/assets/cat-kebab.png';
import catIcecream from '@/assets/cat-icecream.png';
import catCoffee from '@/assets/cat-coffee.png';
import catTea from '@/assets/cat-tea.png';
import catFastfood from '@/assets/cat-fastfood.png';
import catBiryani from '@/assets/cat-biryani.png';
import catTiffin from '@/assets/cat-tiffin.png';
import catSushi from '@/assets/cat-sushi.png';
import catDosa from '@/assets/cat-dosa.png';
import catCake from '@/assets/cat-cake.png';
import catPasta from '@/assets/cat-pasta.png';

const categoryImageMap: Record<string, string> = {
  all: catAll,
  indian: catIndian,
  burger: catBurger,
  chicken: catChicken,
  chinese: catChinese,
  pizza: catPizza,
  sandwich: catSandwich,
  breakfast: catBreakfast,
  meals: catMeals,
  kebab: catKebab,
  'ice cream': catIcecream,
  icecream: catIcecream,
  coffee: catCoffee,
  'coffee shop': catCoffee,
  tea: catTea,
  'fast food': catFastfood,
  fastfood: catFastfood,
  biryani: catBiryani,
  tiffin: catTiffin,
  sushi: catSushi,
  japanese: catSushi,
  dosa: catDosa,
  'south indian': catDosa,
  regional: catTiffin,
  cake: catCake,
  bakery: catCake,
  dessert: catCake,
  pasta: catPasta,
  italian: catPasta,
};

function normalizeCategoryKey(categoryId: string): string {
  return categoryId
    .toLowerCase()
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

export function getCategoryImage(categoryId: string): string {
  const rawKey = categoryId.toLowerCase().trim();
  const normalizedKey = normalizeCategoryKey(categoryId);

  return categoryImageMap[rawKey] || categoryImageMap[normalizedKey] || catAll;
}
