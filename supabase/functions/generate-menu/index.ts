const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type MenuItem = {
  name: string;
  description: string;
  price: number;
  category: string;
  isVeg: boolean;
  isBestseller: boolean;
};

function normalizeMenuItem(item: Partial<MenuItem>): MenuItem | null {
  if (!item.name || typeof item.name !== "string") return null;
  const p = Number(item.price);
  return {
    name: item.name.trim(),
    description: (item.description || "").toString().trim().slice(0, 160),
    price: Number.isFinite(p) && p > 0 ? Math.round(p) : 0,
    category: (item.category || "Mains").toString().trim() || "Mains",
    isVeg: Boolean(item.isVeg),
    isBestseller: Boolean(item.isBestseller),
  };
}

function extractToolMenuItems(aiResult: any): MenuItem[] {
  const toolCall = aiResult?.choices?.[0]?.message?.tool_calls?.[0];
  const rawArgs = toolCall?.function?.arguments;
  if (!rawArgs) return [];
  try {
    const parsed = JSON.parse(rawArgs) as { menu_items?: Partial<MenuItem>[] };
    return (parsed.menu_items || [])
      .map((item) => normalizeMenuItem(item))
      .filter((item): item is MenuItem => Boolean(item));
  } catch {
    return [];
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { restaurantName, lat, lng, city, cuisines, priceLevel } = await req.json();

    if (!restaurantName) {
      return new Response(JSON.stringify({ error: "restaurantName is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cityName = city || "Hyderabad";
    const cuisineStr = cuisines?.length ? cuisines.join(", ") : "";
    const price = priceLevel || "$$";

    const prompt = `You are a food delivery menu database. Your job is to recall the ACTUAL, REAL menu of the restaurant "${restaurantName}" located in ${cityName}, India.

CRITICAL RULES:
1. Only return dishes that are ACTUALLY served at this specific restaurant. You know this from Zomato, Swiggy, Google Maps, and other food delivery platforms.
2. Use REAL prices in Indian Rupees (INR) as listed on food delivery platforms.
3. Do NOT invent or hallucinate dishes. If you are not confident about a dish being on this restaurant's real menu, do NOT include it.
4. For chain restaurants (McDonald's, KFC, Subway, Domino's, Pizza Hut, etc.), return their well-known India menu items with real Indian prices.
5. For local restaurants, only return items you are confident are on their actual menu.
6. If you genuinely don't know this restaurant's menu, return an empty array - do NOT make up items.
${cuisineStr ? `7. This restaurant serves: ${cuisineStr}` : ""}
8. Price level indicator: ${price}

Return 15-30 real menu items if you know them. Include accurate categories like "Recommended", "Starters", "Main Course", "Biryani", "Breads", "Rice", "Desserts", "Beverages", etc.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a restaurant menu database with knowledge from Zomato, Swiggy, and Google Maps. Only return real menu items you are confident about." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "store_menu_items",
              description: "Store the real menu items recalled from the restaurant's actual menu.",
              parameters: {
                type: "object",
                properties: {
                  menu_items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Exact dish name as listed on the restaurant's menu" },
                        description: { type: "string", description: "Brief description of the dish" },
                        price: { type: "number", description: "Price in INR as listed on food delivery platforms" },
                        category: { type: "string", description: "Menu category like Recommended, Starters, Main Course, etc." },
                        isVeg: { type: "boolean", description: "Whether the dish is vegetarian" },
                        isBestseller: { type: "boolean", description: "Whether this is marked as bestseller on delivery platforms" },
                      },
                      required: ["name", "description", "price", "category", "isVeg", "isBestseller"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["menu_items"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "store_menu_items" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits required." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: "Failed to retrieve menu" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await aiResponse.json();
    const items = extractToolMenuItems(aiResult);

    if (items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Menu not available for this restaurant", source: "unknown_restaurant" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Extracted ${items.length} real menu items for "${restaurantName}"`);

    return new Response(
      JSON.stringify({
        menu: items,
        sourceType: "real_menu_recall",
        placeName: restaurantName,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-menu error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
