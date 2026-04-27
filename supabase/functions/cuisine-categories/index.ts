const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EMOJIS: Record<string, string> = { burger:"🍔",pizza:"🍕",sushi:"🍣",indian:"🍛",chinese:"🥡",italian:"🍝",mexican:"🌮",thai:"🍜",vegan:"🥗",cafe:"☕",seafood:"🦞",korean:"🍱",kebab:"🥙",japanese:"🍣",american:"🍔",french:"🥐",bakery:"🥐",asian:"🍜",vegetarian:"🥗",steak:"🥩",chicken:"🍗" };

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const lat = url.searchParams.get("lat");
    const lng = url.searchParams.get("lng");
    if (!lat || !lng) return new Response(JSON.stringify({ error: "lat and lng required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const q = `[out:json][timeout:15];node["amenity"~"restaurant|cafe|fast_food"]["cuisine"](around:5000,${lat},${lng});out tags;`;
    const response = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: `data=${encodeURIComponent(q)}`, headers: { "Content-Type": "application/x-www-form-urlencoded" } });
    if (!response.ok) return new Response(JSON.stringify({ categories: [{ id: "all", label: "All", emoji: "🍽️", count: 0 }] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const data = await response.json();
    const counts: Record<string, number> = {};
    for (const el of data.elements) { const c = (el.tags as Record<string, string>)?.cuisine; if (!c) continue; for (const s of c.split(/[;,]/)) { const k = s.trim().toLowerCase().replace(/ /g, "_"); if (k) counts[k] = (counts[k] || 0) + 1; } }

    const categories = [{ id: "all", label: "All", emoji: "🍽️", count: data.elements.length }, ...Object.entries(counts).sort(([,a],[,b]) => b - a).slice(0, 14).map(([k, c]) => ({ id: k, label: k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, " "), emoji: EMOJIS[k] || "🍽️", count: c }))];
    return new Response(JSON.stringify({ categories }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (_e) {
    return new Response(JSON.stringify({ categories: [{ id: "all", label: "All", emoji: "🍽️", count: 0 }] }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
