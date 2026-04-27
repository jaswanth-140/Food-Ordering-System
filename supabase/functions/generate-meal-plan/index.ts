const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface MealSlot {
  day: number; // 0=Mon..6=Sun
  mealType: "breakfast" | "lunch" | "dinner";
  name: string;
  price: number;
  calories: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { budget, diet, cuisines } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const budgetINR = (budget || 120) * 83;
    const dietGoal = diet || "Balanced";
    const cuisineList = cuisines?.length ? cuisines.join(", ") : "Indian, Italian, Japanese";

    const prompt = `Generate a complete weekly meal plan (Monday to Sunday, 3 meals per day: breakfast, lunch, dinner).

Requirements:
- Weekly budget: approximately ₹${budgetINR} INR total
- Dietary goal: ${dietGoal}
- Preferred cuisines: ${cuisineList}
- Each meal should have: name, estimated price in INR, estimated calories
- Make it realistic and varied — don't repeat the same meal
- Include a mix of home-style and restaurant-style meals
- Prices should be realistic Indian food delivery prices (₹50-500 range)`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a nutritionist and meal planning assistant. Generate realistic meal plans with accurate Indian food prices." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "store_meal_plan",
              description: "Store the generated weekly meal plan",
              parameters: {
                type: "object",
                properties: {
                  meals: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        day: { type: "number", description: "Day of week: 0=Monday, 1=Tuesday, ..., 6=Sunday" },
                        mealType: { type: "string", enum: ["breakfast", "lunch", "dinner"] },
                        name: { type: "string", description: "Name of the meal/dish" },
                        price: { type: "number", description: "Estimated price in INR" },
                        calories: { type: "number", description: "Estimated calories" },
                      },
                      required: ["day", "mealType", "name", "price", "calories"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["meals"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "store_meal_plan" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: "Failed to generate meal plan" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await aiResponse.json();
    const toolCall = aiResult?.choices?.[0]?.message?.tool_calls?.[0];
    const rawArgs = toolCall?.function?.arguments;
    
    if (!rawArgs) {
      return new Response(JSON.stringify({ error: "No meal plan generated" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(rawArgs) as { meals: MealSlot[] };
    const meals = (parsed.meals || []).filter(
      (m) => m.name && typeof m.day === "number" && m.mealType
    );

    console.log(`Generated ${meals.length} meal slots`);

    return new Response(JSON.stringify({ meals }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-meal-plan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
