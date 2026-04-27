import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-Memory LRU Cache for the isolated Deno runtime instance
const DISH_CACHE = new Map<string, { url: string; expiresAt: number; status: string }>();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

// Simple IP-based in-memory rate limiting
const RATE_LIMITS = new Map<string, { count: number; expiresAt: number }>();
const RATE_LIMIT_WINDOW_MS = 1000 * 60; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30; // Max 30 batched requests per minute per IP

const PEXELS_KEY = Deno.env.get('PEXELS_API_KEY');
const PIXABAY_KEY = Deno.env.get('PIXABAY_API_KEY');

const QUERY_HINTS: Record<string, string> = {
  'chicken 65': 'chicken 65 indian fried chicken',
  'apollo fish': 'apollo fish indian fried fish',
  'masala dosa': 'masala dosa south indian',
  'plain dosa': 'plain dosa south indian',
  'vada': 'medu vada south indian',
  'medu vada': 'medu vada south indian',
  'idli': 'idli south indian breakfast',
  'paneer butter masala': 'paneer butter masala indian curry',
  'paneer tikka': 'paneer tikka indian grilled',
  'puri bhaji': 'puri bhaji indian breakfast',
  'poori bhaji': 'poori bhaji indian breakfast',
  'veg pulav': 'veg pulao indian rice',
  'veg pulao': 'veg pulao indian rice',
  'tea': 'masala chai tea cup',
};

const PIXABAY_BANNED_TAGS = ['egg', 'eggs', 'breakfast egg', 'pattern'];
const GENERIC_TOKENS = new Set(['food', 'dish', 'style', 'classic', 'special', 'authentic', 'recipe']);
const STRICT_REFRESH_TOKENS = ['dosa', 'idli', 'idly', 'vada', 'wada', 'bonda', 'paneer', 'tea', 'coffee', 'manchurian', 'biryani', 'pulao', 'pulav', 'puri', 'poori'];

function normalize(value: string) {
  return (value || '').toLowerCase().trim().replace(/[^a-z0-9 ]/g, '').replace(/ +/g, ' ');
}

function shouldRefreshFromApi(normalizedDishName: string): boolean {
  return STRICT_REFRESH_TOKENS.some((token) => normalizedDishName.includes(token));
}

function normalizeToken(token: string): string {
  if (token === 'pulav' || token === 'pilaf' || token === 'pilau') return 'pulao';
  if (token === 'puri') return 'poori';
  if (token === 'idly') return 'idli';
  if (token === 'wada') return 'vada';
  return token;
}

function tokenize(text: string): Set<string> {
  return new Set(
    normalize(text)
      .split(' ')
      .map(normalizeToken)
      .filter((token) => token.length > 2 && !GENERIC_TOKENS.has(token))
  );
}

function hasRequiredSignal(queryTokens: Set<string>, candidateTokens: Set<string>): boolean {
  if (queryTokens.has('dosa')) return candidateTokens.has('dosa');
  if (queryTokens.has('idli')) return candidateTokens.has('idli');
  if (queryTokens.has('vada') || queryTokens.has('bonda')) return candidateTokens.has('vada') || candidateTokens.has('bonda');
  if (queryTokens.has('manchurian')) return candidateTokens.has('manchurian');
  if (queryTokens.has('paneer')) return candidateTokens.has('paneer');
  if (queryTokens.has('tea') || queryTokens.has('chai')) return candidateTokens.has('tea') || candidateTokens.has('chai');
  if (queryTokens.has('coffee')) return candidateTokens.has('coffee') || candidateTokens.has('latte') || candidateTokens.has('espresso') || candidateTokens.has('cappuccino');
  if (queryTokens.has('biryani') || queryTokens.has('pulao')) {
    return candidateTokens.has('biryani') || candidateTokens.has('pulao') || candidateTokens.has('rice');
  }
  return true;
}

function scoreCandidate(query: string, resultText: string): number {
  const queryTokens = tokenize(query);
  const candidateTokens = tokenize(resultText);

  if (queryTokens.size === 0 || candidateTokens.size === 0) return 0;
  if (!hasRequiredSignal(queryTokens, candidateTokens)) return 0;

  let score = 0;
  for (const token of queryTokens) {
    if (candidateTokens.has(token)) score += 2;
  }

  // Small bonus for explicit food context
  if (candidateTokens.has('food') || candidateTokens.has('dish') || candidateTokens.has('meal')) score += 1;
  return score;
}

function selectBestCandidate<T>(query: string, candidates: T[], textGetter: (candidate: T) => string): T | null {
  let best: T | null = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    const score = scoreCandidate(query, textGetter(candidate));
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  // Require a minimum confidence score to avoid obvious mismatches.
  return bestScore >= 2 ? best : null;
}

async function searchPexels(query: string) {
  if (!PEXELS_KEY) return null;
  const url = new URL('https://api.pexels.com/v1/search');
  const hinted = QUERY_HINTS[normalize(query)] || query;
  url.searchParams.set('query', `${hinted} food`);
  url.searchParams.set('per_page', '8');

  try {
    const res = await fetch(url.toString(), { headers: { Authorization: PEXELS_KEY } });
    if (!res.ok) return null;
    const data = await res.json();
    const photos = Array.isArray(data?.photos) ? data.photos : [];
    const photo = selectBestCandidate(
      query,
      photos,
      (candidate: any) => `${candidate?.alt || ''} ${(candidate?.url || '')}`
    );
    if (!photo?.src?.large2x) return null;

    return {
      imageUrl: photo.src.large2x,
      source: 'pexels',
      status: 'approved'
    };
  } catch {
    return null;
  }
}

async function searchPixabay(query: string) {
  if (!PIXABAY_KEY) return null;
  const url = new URL('https://pixabay.com/api/');
  url.searchParams.set('key', PIXABAY_KEY);
  const hinted = QUERY_HINTS[normalize(query)] || query;
  url.searchParams.set('q', `${hinted} food`);
  url.searchParams.set('image_type', 'photo');
  url.searchParams.set('per_page', '8');
  url.searchParams.set('safesearch', 'true');

  try {
    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const data = await res.json();
    
    const hits = (data?.hits || []).filter((candidate: any) => {
      const tags = (candidate?.tags || '').toLowerCase();
      if (PIXABAY_BANNED_TAGS.some(b => tags.includes(b))) return false;
      return true;
    });

    const hit = selectBestCandidate(
      query,
      hits,
      (candidate: any) => `${candidate?.tags || ''} ${(candidate?.type || '')}`
    );
    if (!hit?.largeImageURL) return null;

    return {
      imageUrl: hit.largeImageURL,
      source: 'pixabay',
      status: 'approved'
    };
  } catch {
    return null;
  }
}

async function fetchExternalImage(dishName: string) {
  let result = await searchPexels(dishName);
  if (!result) {
    result = await searchPixabay(dishName);
  }
  return result;
}

serve(async (req) => {
  // CORS Response
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    
    // Rate Limiting Check
    const now = Date.now();
    const rl = RATE_LIMITS.get(clientIp);
    if (rl && rl.expiresAt > now) {
      if (rl.count >= MAX_REQUESTS_PER_WINDOW) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      rl.count++;
    } else {
      RATE_LIMITS.set(clientIp, { count: 1, expiresAt: now + RATE_LIMIT_WINDOW_MS });
    }

    const { dishNames } = await req.json();
    if (!Array.isArray(dishNames)) {
      throw new Error('dishNames array is required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Used to bypass UI RLS limits when writing to override table
    );

    const results: Record<string, { url: string; status: string; fallbackType?: string }> = {};
    const missingFromCache: string[] = [];
    const normalizedToRaw: Record<string, string> = {};

    // 1. Check local Deno Memory Cache
    for (const name of dishNames) {
      const norm = normalize(name);
      normalizedToRaw[norm] = name;
      
      const mem = DISH_CACHE.get(norm);
      if (mem && mem.expiresAt > now && !shouldRefreshFromApi(norm)) {
        results[name] = { url: mem.url, status: mem.status };
      } else {
        missingFromCache.push(norm);
      }
    }

    // 2. Check Database Override Table for remaining items
    if (missingFromCache.length > 0) {
      const { data: dbData } = await supabaseClient
        .from('dish_images_override')
        .select('normalized_dish_name, image_url, status')
        .in('normalized_dish_name', missingFromCache);

      if (dbData) {
        for (const row of dbData) {
          const rawName = normalizedToRaw[row.normalized_dish_name];
          const shouldUseDbRow = row.status === 'approved' && !shouldRefreshFromApi(row.normalized_dish_name);
          if (shouldUseDbRow) {
            results[rawName] = { url: row.image_url, status: row.status };
            DISH_CACHE.set(row.normalized_dish_name, { url: row.image_url, status: row.status, expiresAt: now + CACHE_TTL_MS });

            // Remove from missing
            const idx = missingFromCache.indexOf(row.normalized_dish_name);
            if (idx !== -1) missingFromCache.splice(idx, 1);
          }
        }
      }
    }

    // 3. Fetch from External APIs for the final missing ones
    if (missingFromCache.length > 0 && (PEXELS_KEY || PIXABAY_KEY)) {
      const inserts = [];
      
      // Batch promises but limit concurrency implicitly
      const fetchPromises = missingFromCache.map(async (normName) => {
        const rawName = normalizedToRaw[normName];
        const apiResult = await fetchExternalImage(rawName);
        
        if (apiResult) {
          results[rawName] = { url: apiResult.imageUrl, status: apiResult.status };
          DISH_CACHE.set(normName, { url: apiResult.imageUrl, status: apiResult.status, expiresAt: now + CACHE_TTL_MS });
          
          inserts.push({
            dish_name: rawName,
            normalized_dish_name: normName,
            image_url: apiResult.imageUrl,
            source: apiResult.source,
            status: apiResult.status
          });
        } else {
          // Both APIs failed, fallback flag
          results[rawName] = { url: '', status: 'failed', fallbackType: 'generic' };
          // Do not cache failures permanently, maybe 10 mins
          DISH_CACHE.set(normName, { url: '', status: 'failed', expiresAt: now + (1000 * 60 * 10) });
        }
      });
      
      await Promise.all(fetchPromises);

      // Async write to DB, we don't need to await it necessarily, but we will to ensure consistency
      if (inserts.length > 0) {
        await supabaseClient.from('dish_images_override').upsert(inserts, { onConflict: 'normalized_dish_name' });
      }
    }

    // Handle missing items without any external API keys
    for (const norm of missingFromCache) {
      const rawName = normalizedToRaw[norm];
      if (!results[rawName]) {
        results[rawName] = { url: '', status: 'failed', fallbackType: 'generic' };
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
