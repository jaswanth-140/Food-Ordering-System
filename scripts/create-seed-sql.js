const fs = require('fs');

const file = fs.readFileSync('src/data/dishImageMap.ts', 'utf8');
const lines = file.split('\n');
const inserts = [];

for (const line of lines) {
  const match = line.match(/^  "([^"]+)": "([^"]+)",/);
  if (match) {
    const dishName = match[1];
    const url = match[2];
    const normalized = dishName.toLowerCase().trim().replace(/[^a-z0-9 ]/g, '').replace(/ +/g, ' ');
    inserts.push(`  ('${dishName.replace(/'/g, "''")}', '${normalized.replace(/'/g, "''")}', '${url}', 'static', 'approved')`);
  }
}

if (inserts.length > 0) {
  const sql = '\n\n-- Pre-fill with static data\nINSERT INTO public.dish_images_override (dish_name, normalized_dish_name, image_url, source, status) VALUES\n' + inserts.join(',\n') + '\nON CONFLICT (normalized_dish_name) DO NOTHING;\n';
  fs.appendFileSync('supabase/migrations/20260414131611_create_dish_images_override.sql', sql);
  console.log('Appended ' + inserts.length + ' rows to migration');
}
