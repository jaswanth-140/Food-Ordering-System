const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parseCuisine(cuisine: string | undefined): string[] {
  if (!cuisine) return ["Multi-cuisine"];
  return cuisine.split(/[;,]/).map((c: string) => c.trim().replace(/_/g, " ").split(" ").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")).filter(Boolean);
}

function buildAddress(tags: Record<string, string>): string {
  return [tags["addr:housenumber"], tags["addr:street"], tags["addr:suburb"], tags["addr:city"]].filter(Boolean).join(", ") || tags["addr:full"] || "";
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) { hash = ((hash << 5) - hash) + str.charCodeAt(i); hash |= 0; }
  return Math.abs(hash);
}

// Fallback photos if Foursquare fails
const FALLBACK_PHOTOS = [
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&h=400&fit=crop",
];

async function fetchFoursquarePhoto(name: string, lat: number, lng: number, apiKey: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    // Foursquare v3 API - search for place
    const searchUrl = `https://api.foursquare.com/v3/places/search?query=${encodeURIComponent(name)}&ll=${lat},${lng}&radius=1000&limit=1&categories=13065`;
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: apiKey, Accept: "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!searchRes.ok) {
      console.log(`FSQ search failed for "${name}": ${searchRes.status}`);
      return null;
    }

    const searchData = await searchRes.json();
    const place = searchData.results?.[0];
    if (!place?.fsq_id) return null;

    // Fetch photos for this place
    const controller2 = new AbortController();
    const timeout2 = setTimeout(() => controller2.abort(), 3000);
    const photosRes = await fetch(`https://api.foursquare.com/v3/places/${place.fsq_id}/photos?limit=1`, {
      headers: { Authorization: apiKey, Accept: "application/json" },
      signal: controller2.signal,
    });
    clearTimeout(timeout2);

    if (!photosRes.ok) return null;
    const photos = await photosRes.json();
    if (photos.length > 0) {
      return `${photos[0].prefix}600x400${photos[0].suffix}`;
    }
    return null;
  } catch (e) {
    console.log(`FSQ error for "${name}":`, e instanceof Error ? e.message : e);
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const lat = url.searchParams.get("lat");
    const lng = url.searchParams.get("lng");
    const radius = url.searchParams.get("radius") || "10000";
    const cuisine = url.searchParams.get("cuisine");
    if (!lat || !lng) return new Response(JSON.stringify({ error: "lat and lng required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const cf = cuisine && cuisine !== "all" ? `["cuisine"~"${cuisine}",i]` : "";

    async function queryOverpass(r: string) {
      const q = `[out:json][timeout:25];(node["amenity"="restaurant"]${cf}(around:${r},${lat},${lng});node["amenity"="cafe"]${cf}(around:${r},${lat},${lng});node["amenity"="fast_food"]${cf}(around:${r},${lat},${lng}););out body;`;
      const res = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: `data=${encodeURIComponent(q)}`, headers: { "Content-Type": "application/x-www-form-urlencoded" } });
      if (!res.ok) return null;
      return await res.json();
    }

    function mapRestaurants(data: { elements: Record<string, unknown>[] }, isCitywide: boolean) {
      return data.elements.filter((el: Record<string, unknown>) => (el.tags as Record<string, string>)?.name).map((el: Record<string, unknown>) => {
        const tags = el.tags as Record<string, string>;
        const eLat = el.lat as number || 0;
        const eLng = el.lon as number || 0;
        const dist = calculateDistance(Number(lat), Number(lng), eLat, eLng);
        const h = hashCode(tags.name + String(el.id));
        const total = Math.round((dist / 25) * 60) + 12;
        return {
          id: String(el.id), name: tags.name, cuisine: parseCuisine(tags.cuisine), address: buildAddress(tags),
          lat: eLat, lng: eLng, distanceKm: +dist.toFixed(2),
          distanceLabel: dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)} km`,
          deliveryTime: `${Math.max(15, total - 5)}-${total + 10} min`,
          imageUrl: null as string | null, rating: +(3.5 + (h % 15) / 10).toFixed(1), reviewCount: 50 + (h % 950),
          deliveryFee: dist < 1 ? 0 : Math.round(dist * 15 + 20),
          priceLevel: h % 3 === 0 ? "$" : "$$",
          badge: isCitywide ? "Popular in City" : (dist < 0.5 ? "Near You" : (h % 7 === 0 ? "Popular" : undefined)),
        };
      }).sort((a: { reviewCount: number; distanceKm: number }, b: { reviewCount: number; distanceKm: number }) =>
        isCitywide ? b.reviewCount - a.reviewCount : a.distanceKm - b.distanceKm
      );
    }

    // Try nearby first
    let data = await queryOverpass(radius);
    if (!data) return new Response(JSON.stringify({ error: "Overpass error", restaurants: [] }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    let restaurants = mapRestaurants(data, false);
    let isCitywide = false;

    if (restaurants.length === 0) {
      data = await queryOverpass("50000");
      if (data) {
        restaurants = mapRestaurants(data, true).slice(0, 30);
        isCitywide = true;
      }
    }

    // Try Foursquare for real photos, fallback to curated Unsplash
    const fsqKey = Deno.env.get("FOURSQUARE_API_KEY");
    if (fsqKey && restaurants.length > 0) {
      const limit = Math.min(restaurants.length, 8);
      console.log(`Fetching Foursquare photos for ${limit} restaurants...`);
      const photos = await Promise.all(
        restaurants.slice(0, limit).map(r => fetchFoursquarePhoto(r.name, r.lat, r.lng, fsqKey))
      );
      let found = 0;
      photos.forEach((photo, i) => {
        if (photo) { restaurants[i].imageUrl = photo; found++; }
      });
      console.log(`Foursquare: ${found}/${limit} photos found`);
    }

    // Fill any remaining nulls with fallback photos
    restaurants.forEach((r: { name: string; imageUrl: string | null }, i: number) => {
      if (!r.imageUrl) {
        r.imageUrl = FALLBACK_PHOTOS[(hashCode(r.name) + i) % FALLBACK_PHOTOS.length];
      }
    });

    return new Response(JSON.stringify({ restaurants, total: restaurants.length, isCitywide }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("nearby-restaurants error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown", restaurants: [] }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
