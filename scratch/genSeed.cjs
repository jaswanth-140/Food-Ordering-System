const fs = require('fs');
let code = fs.readFileSync('src/data/seed.ts', 'utf8');

const extraRests = [];
const extraMenus = [];
const extraCats = '\n';

const names = [
  'Spicy Wok', 'Taco Fiesta', 'The Vegan Bowl', 'Ocean Catch Seafood', 'Noodle Bar',
  'Mamma Mia Pizzeria', 'Urban Bites', 'The Green Salad', 'Street Food Corner', 'Bistro 42',
  'Golden Dragon', 'El Camino', 'Healthy Haven', 'Morning Cafe', 'Dessert Dreams'
];
const cuisines = [
  ['Chinese', 'Asian'], ['Mexican', 'Tacos'], ['Vegan', 'Healthy'], ['Seafood'], ['Asian', 'Noodles'],
  ['Italian', 'Pizza'], ['American', 'Fast Food'], ['Healthy', 'Salads'], ['Street Food', 'Indian'], ['European', 'Italian'],
  ['Chinese', 'Dim Sum'], ['Mexican', 'Burritos'], ['Healthy', 'Vegan'], ['Cafe', 'Breakfast'], ['Desserts', 'Gelato']
];

const images = [
  'foodCarbonara', 'foodTunaRoll', 'foodPokeBowl', 'foodCalamari', 'foodRisotto',
  'foodPizza', 'heroBurger', 'foodSalad', 'foodSmashBurger', 'restaurantHero',
  'foodTunaRoll', 'foodPokeBowl', 'foodSalad', 'foodBruschetta', 'foodCheesecake'
];

let catMapStr = '\n';

for (let i = 0; i < 15; i++) {
  const rId = 'r' + (i + 6);
  extraRests.push(`  { id: '${rId}', name: '${names[i]}', cuisine: ${JSON.stringify(cuisines[i])}, rating: ${(4.0 + Math.random()).toFixed(1)}, reviewCount: ${Math.floor(Math.random() * 2000)}, deliveryTime: '25-45 min', deliveryFee: ${(Math.floor(Math.random()*5)*10)}, minOrder: 150, imageUrl: ${images[i]}, priceLevel: '$$', distance: ${(1 + Math.random()*4).toFixed(1)} }`);
  
  catMapStr += `  ${rId}: ['Popular', 'Mains', 'Sides'],\n`;

  extraMenus.push(`  { id: 'm${rId}_1', restaurantId: '${rId}', name: 'Special ${names[i]} Dish', description: 'A delicious signature dish.', price: ${(200 + Math.floor(Math.random()*300))}, category: 'Popular', imageUrl: ${images[i]}, isVeg: false, allergens: [], isBestseller: true }`);
  extraMenus.push(`  { id: 'm${rId}_2', restaurantId: '${rId}', name: 'Classic ${cuisines[i][0]}', description: 'Traditional recipe.', price: ${(150 + Math.floor(Math.random()*200))}, category: 'Mains', imageUrl: ${images[(i+1)%15]}, isVeg: false, allergens: [], isBestseller: false }`);
  extraMenus.push(`  { id: 'm${rId}_3', restaurantId: '${rId}', name: 'Side Salad', description: 'Fresh greens.', price: 99, category: 'Sides', imageUrl: foodSalad, isVeg: true, allergens: [], isBestseller: false }`);
}

code = code.replace('];\n\nexport const menuItems', ',\n' + extraRests.join(',\n') + '\n];\n\nexport const menuItems');
code = code.replace('];\n\nexport const categories', ',\n' + extraMenus.join(',\n') + '\n];\n\nexport const categories');
code = code.replace("r4: ['Popular', 'Bowls', 'Salads'],", "r4: ['Popular', 'Bowls', 'Salads']," + catMapStr);

fs.writeFileSync('src/data/seed.ts', code);
