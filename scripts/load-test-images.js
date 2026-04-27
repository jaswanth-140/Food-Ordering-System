import { createClient } from '@supabase/supabase-js';

// Replace with your local or remote URL/anon key from `supabase start` or Supabase dashboard
const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key-here';

const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_DISHES = [
  'Butter Naan',
  'Butter Chicken',
  'Dal Makhani',
  'Chicken 65',
  'Apollo Fish',
  'Masala Dosa',
  'Space Galaxy Rare Burger', // Expected to fail or return weird result
  'Pancakes',
  'Ramen',
  'Mystery Food XYZ'
];

async function runLoadTest(concurrencyCount = 50) {
  console.log(`Starting load test with ${concurrencyCount} concurrent requests...`);
  const promises = [];
  
  for (let i = 0; i < concurrencyCount; i++) {
    // Generate a random subset to batch
    const randomBatch = TEST_DISHES.sort(() => 0.5 - Math.random()).slice(0, 3);
    
    // Notice how we're simulating concurrent users hitting the edge function
    const p = supabase.functions.invoke('fetch-dish-images', {
      body: { dishNames: randomBatch },
    });
    promises.push(p);
  }

  const startTime = Date.now();
  const responses = await Promise.allSettled(promises);
  const duration = Date.now() - startTime;

  let successes = 0;
  let rateLimits = 0;
  let errors = 0;

  responses.forEach(res => {
    if (res.status === 'fulfilled') {
      const data = res.value.data;
      const error = res.value.error;
      
      if (error && error.message.includes('Rate limit')) {
        rateLimits++;
      } else if (error) {
        errors++;
      } else if (data && data.results) {
        successes++;
      }
    } else {
      errors++;
    }
  });

  console.log('\n--- Load Test Results ---');
  console.log(`Time taken: ${duration}ms`);
  console.log(`Success requests: ${successes}`);
  console.log(`Rate limits hit (HTTP 429): ${rateLimits}`);
  console.log(`Other errors: ${errors}`);
  console.log('-------------------------');
}

runLoadTest().catch(console.error);
