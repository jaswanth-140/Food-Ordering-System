import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import { ChevronLeft, ChevronRight, Plus, Sparkles, X, ShoppingCart, Sun, CloudSun, Moon, Loader2, Trash2, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/data/seed';

interface MealSlotRow {
  id: string;
  week_start: string;
  day_of_week: number;
  meal_type: string;
  meal_data: any;
  is_scheduled: boolean;
}

const daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const dietaryGoals = ['Balanced', 'High Protein', 'Low Carb', 'Keto', 'Vegan'];

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function formatWeekLabel(weekStart: string): string {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(start)} - ${fmt(end)}, ${start.getFullYear()}`;
}

export default function MealPlannerPage() {
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [slots, setSlots] = useState<MealSlotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [showAddModal, setShowAddModal] = useState<{ day: number; meal: string } | null>(null);
  const [showAIPlanConfig, setShowAIPlanConfig] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Add modal form
  const [mealName, setMealName] = useState('');
  const [mealPrice, setMealPrice] = useState('');
  const [mealCalories, setMealCalories] = useState('');
  const [saving, setSaving] = useState(false);

  // AI Plan Config
  const [weeklyBudget, setWeeklyBudget] = useState(120);
  const [selectedDiet, setSelectedDiet] = useState('Balanced');
  const [cuisinePrefs, setCuisinePrefs] = useState<string[]>(['Italian', 'Japanese']);

  const weekStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return getWeekStart(d);
  }, [weekOffset]);

  const todayIndex = useMemo(() => {
    const today = new Date().getDay();
    return today === 0 ? 6 : today - 1;
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchSlots();
  }, [isAuthenticated, weekStart]);

  const fetchSlots = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('meal_plan_slots')
      .select('*')
      .eq('week_start', weekStart) as { data: MealSlotRow[] | null };
    if (data) setSlots(data);
    setLoading(false);
  };

  const addMealSlot = async () => {
    if (!showAddModal || !mealName.trim()) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    setSaving(true);
    const mealData = {
      name: mealName,
      price: parseFloat(mealPrice) || 0,
      calories: parseInt(mealCalories) || 0,
    };

    const { data } = await (supabase.from('meal_plan_slots') as any).insert({
      user_id: session.user.id,
      week_start: weekStart,
      day_of_week: showAddModal.day,
      meal_type: showAddModal.meal,
      meal_data: mealData,
      is_scheduled: true,
    }).select() as { data: MealSlotRow[] | null };

    if (data?.[0]) {
      setSlots(prev => [...prev, data[0]]);
    }
    setShowAddModal(null);
    setMealName(''); setMealPrice(''); setMealCalories('');
    setSaving(false);
  };

  const removeSlot = async (id: string) => {
    await supabase.from('meal_plan_slots').delete().eq('id', id);
    setSlots(prev => prev.filter(s => s.id !== id));
  };

  const clearWeek = async () => {
    const ids = slots.map(s => s.id);
    if (ids.length === 0) return;
    await supabase.from('meal_plan_slots').delete().in('id', ids);
    setSlots([]);
  };

  const removeCuisine = (c: string) => setCuisinePrefs(prev => prev.filter(p => p !== c));

  const generateAIPlan = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    setGenerating(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-meal-plan`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            budget: weeklyBudget,
            diet: selectedDiet,
            cuisines: cuisinePrefs,
          }),
        }
      );
      const data = await res.json();
      if (data.meals?.length > 0) {
        // Clear existing slots for this week
        const existingIds = slots.map(s => s.id);
        if (existingIds.length > 0) {
          await supabase.from('meal_plan_slots').delete().in('id', existingIds);
        }
        // Insert new slots
        const inserts = data.meals.map((m: any) => ({
          user_id: session.user.id,
          week_start: weekStart,
          day_of_week: m.day,
          meal_type: m.mealType,
          meal_data: { name: m.name, price: m.price, calories: m.calories },
          is_scheduled: true,
        }));
        const { data: inserted } = await (supabase.from('meal_plan_slots') as any).insert(inserts).select();
        if (inserted) setSlots(inserted);
        setShowAIPlanConfig(false);
      }
    } catch (e) {
      console.error('AI meal plan error:', e);
    }
    setGenerating(false);
  };

  const mealTypes = [
    { key: 'breakfast', label: 'Breakfast', time: '8:00 AM', icon: <Sun className="w-5 h-5 text-amber-400" /> },
    { key: 'lunch', label: 'Lunch', time: '1:00 PM', icon: <CloudSun className="w-5 h-5 text-amber-300" /> },
    { key: 'dinner', label: 'Dinner', time: '7:30 PM', icon: <Moon className="w-5 h-5 text-blue-300" /> },
  ];

  const totalCost = slots.reduce((sum, s) => sum + (s.meal_data?.price || 0), 0);
  const totalCals = slots.filter(s => s.meal_data?.calories).length > 0
    ? Math.round(slots.reduce((sum, s) => sum + (s.meal_data?.calories || 0), 0) / Math.max(slots.filter(s => s.meal_data?.calories).length, 1))
    : 0;

  // Nutrition balance mock
  const proteinPct = 40;
  const carbsPct = 35;
  const fatsPct = 25;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Meal Planner</h1>
          <p className="text-muted-foreground mb-6">Login to plan your weekly meals.</p>
          <button onClick={() => navigate('/login')} className="coral-button">Login to Continue</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Meal Planner</h1>
            <div className="flex items-center gap-3 mt-2 text-muted-foreground">
              <button onClick={() => setWeekOffset(w => w - 1)} className="hover:text-foreground"><ChevronLeft className="w-4 h-4" /></button>
              <span className="font-medium">{formatWeekLabel(weekStart)}</span>
              <button onClick={() => setWeekOffset(w => w + 1)} className="hover:text-foreground"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={clearWeek}
              className="ghost-button text-sm"
            >
              Clear Week
            </button>
            <button
              onClick={() => setShowAIPlanConfig(true)}
              className="coral-button flex items-center gap-2 text-sm"
            >
              <Sparkles className="w-4 h-4" /> AI Plan My Week
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex gap-6">
            {/* Calendar Grid */}
            <div className="flex-1 overflow-x-auto">
              {/* Day Headers */}
              <div className="grid grid-cols-[70px_repeat(7,1fr)] gap-1 mb-1 min-w-[800px]">
                <div className="text-xs text-muted-foreground uppercase tracking-wider py-2 text-center">Time</div>
                {daysOfWeek.map((day, i) => {
                  const isToday = i === todayIndex && weekOffset === 0;
                  const date = new Date(weekStart);
                  date.setDate(date.getDate() + i);
                  return (
                    <div key={day} className={`text-center py-3 rounded-t-xl ${isToday ? 'border-t-2 border-primary bg-primary/5' : ''}`}>
                      <div className={`text-xs font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>{day}</div>
                      <div className={`text-2xl font-bold ${isToday ? 'text-primary' : 'text-foreground'}`}>{date.getDate()}</div>
                      {isToday && <div className="text-[10px] text-primary font-semibold mt-0.5">TODAY</div>}
                    </div>
                  );
                })}
              </div>

              {/* Meal Rows */}
              {mealTypes.map(({ key, label, time, icon }) => (
                <div key={key} className="grid grid-cols-[70px_repeat(7,1fr)] gap-1 mb-1 min-w-[800px]">
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                    {icon}
                    <span className="text-xs text-muted-foreground mt-1">{label}</span>
                    <span className="text-[10px] text-muted-foreground/70">{time}</span>
                  </div>
                  {daysOfWeek.map((_, dayIdx) => {
                    const slot = slots.find(s => s.day_of_week === dayIdx && s.meal_type === key);
                    return (
                      <div
                        key={dayIdx}
                        className={`rounded-xl min-h-[130px] ${
                          slot
                            ? 'glass-card p-3 flex flex-col relative group'
                            : 'border border-dashed border-glass-border flex items-center justify-center cursor-pointer hover:border-primary/40 transition-colors'
                        }`}
                        onClick={() => !slot && setShowAddModal({ day: dayIdx, meal: key })}
                      >
                        {slot ? (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); removeSlot(slot.id); }}
                              className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full bg-destructive/80 flex items-center justify-center transition-opacity"
                            >
                              <X className="w-3 h-3 text-white" />
                            </button>
                            {slot.is_scheduled && (
                              <span className="inline-flex self-start bg-primary/20 text-primary text-[10px] font-semibold px-2 py-0.5 rounded-full mb-1.5">
                                SCHEDULED
                              </span>
                            )}
                            <h4 className="text-xs font-bold text-foreground leading-tight">{slot.meal_data?.name}</h4>
                            <div className="flex items-center justify-between mt-auto pt-2">
                              {slot.meal_data?.calories > 0 && (
                                <span className="text-[10px] text-muted-foreground">{slot.meal_data.calories} kcal</span>
                              )}
                              {slot.meal_data?.price > 0 && (
                                <span className="text-xs font-bold text-primary">{formatPrice(slot.meal_data.price)}</span>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="text-center text-muted-foreground/50 hover:text-primary/60 transition-colors">
                            <Plus className="w-5 h-5 mx-auto mb-1" />
                            <span className="text-[10px]">Add Meal</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Right Sidebar: AI Config Panel */}
            {showAIPlanConfig && (
              <div className="hidden lg:block w-72 flex-shrink-0">
                <div className="glass-card rounded-2xl p-5 border border-glass-border sticky top-24">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <h3 className="font-bold text-foreground">AI Plan Config</h3>
                    </div>
                    <button onClick={() => setShowAIPlanConfig(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Weekly Budget */}
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">Weekly Budget</span>
                      <span className="text-sm font-bold text-primary">{formatPrice(weeklyBudget * 83)}</span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={300}
                      value={weeklyBudget}
                      onChange={e => setWeeklyBudget(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>₹4,150</span>
                      <span>₹24,900</span>
                    </div>
                  </div>

                  {/* Dietary Goals */}
                  <div className="mb-5">
                    <h4 className="text-sm font-medium text-foreground mb-2">Dietary Goals</h4>
                    <div className="flex flex-wrap gap-2">
                      {dietaryGoals.map(goal => (
                        <button
                          key={goal}
                          onClick={() => setSelectedDiet(goal)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                            selectedDiet === goal
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {goal}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cuisine Preferences */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-foreground mb-2">Preferences</h4>
                    <div className="flex flex-wrap gap-2">
                      {cuisinePrefs.map(c => (
                        <span key={c} className="flex items-center gap-1 bg-secondary text-foreground text-xs px-3 py-1.5 rounded-full">
                          {c}
                          <button onClick={() => removeCuisine(c)} className="text-muted-foreground hover:text-foreground ml-0.5">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      <button className="text-xs text-muted-foreground border border-dashed border-glass-border px-3 py-1.5 rounded-full hover:text-foreground hover:border-glass-border-hover transition-colors">
                        + Add
                      </button>
                    </div>
                  </div>

                  <button onClick={generateAIPlan} disabled={generating} className="coral-button w-full text-sm flex items-center justify-center gap-2">
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {generating ? 'Generating...' : 'Generate Plan'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom Stats Bar */}
        <div className="mt-8 glass-card rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Est. Weekly Spend</span>
              <div className="text-2xl font-bold text-foreground">{formatPrice(totalCost)}</div>
            </div>
            {totalCals > 0 && (
              <div>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg Calories</span>
                <div className="text-2xl font-bold text-foreground">{totalCals} <span className="text-sm font-normal text-muted-foreground">kcal/day</span></div>
              </div>
            )}
            {/* Nutrition Balance */}
            <div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Nutrition Balance</span>
              <div className="flex items-center gap-0 mt-1.5 w-48 h-3 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${proteinPct}%` }} />
                <div className="h-full bg-amber-500" style={{ width: `${carbsPct}%` }} />
                <div className="h-full bg-rose-500" style={{ width: `${fatsPct}%` }} />
              </div>
              <div className="flex gap-3 mt-1">
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Protein {proteinPct}%
                </span>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Carbs {carbsPct}%
                </span>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Fats {fatsPct}%
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              slots.forEach(s => {
                if (s.meal_data?.name) {
                  addItem({
                    id: s.id,
                    restaurantId: '',
                    name: s.meal_data.name,
                    description: '',
                    price: s.meal_data.price || 0,
                    category: s.meal_type,
                    imageUrl: '',
                    isVeg: false,
                    allergens: [],
                  });
                }
              });
            }}
            className="coral-button flex items-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            Order All Scheduled
          </button>
        </div>
      </main>

      {/* Add Meal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-8 w-full max-w-md border border-glass-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Add Meal</h3>
              <button onClick={() => setShowAddModal(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {daysOfWeek[showAddModal.day]} • {showAddModal.meal.charAt(0).toUpperCase() + showAddModal.meal.slice(1)}
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block mb-1.5">Meal Name</label>
                <input value={mealName} onChange={e => setMealName(e.target.value)} className="glass-input w-full" placeholder="e.g. Avocado Toast" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block mb-1.5">Price (₹)</label>
                  <input type="number" value={mealPrice} onChange={e => setMealPrice(e.target.value)} className="glass-input w-full" placeholder="199" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block mb-1.5">Calories</label>
                  <input type="number" value={mealCalories} onChange={e => setMealCalories(e.target.value)} className="glass-input w-full" placeholder="350" />
                </div>
              </div>
              <button onClick={addMealSlot} disabled={saving || !mealName.trim()} className="coral-button w-full flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Add Meal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Plan Modal (for mobile) */}
      {showAIPlanConfig && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-8 w-full max-w-md border border-glass-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">AI Plan My Week</h3>
                <p className="text-sm text-muted-foreground">Customize your auto-generated meal plan</p>
              </div>
            </div>
            <button onClick={() => setShowAIPlanConfig(false)} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>

            <div className="mt-6 mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Weekly Budget</span>
                <span className="text-sm font-bold text-primary">{formatPrice(weeklyBudget * 83)}</span>
              </div>
              <input type="range" min={50} max={300} value={weeklyBudget} onChange={e => setWeeklyBudget(Number(e.target.value))} className="w-full accent-primary" />
            </div>

            <div className="mb-5">
              <h4 className="text-sm font-medium text-foreground mb-2">Dietary Goals</h4>
              <div className="flex flex-wrap gap-2">
                {dietaryGoals.map(goal => (
                  <button
                    key={goal}
                    onClick={() => setSelectedDiet(goal)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      selectedDiet === goal ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-medium text-foreground mb-2">Cuisine Preferences</h4>
              <div className="flex flex-wrap gap-2">
                {cuisinePrefs.map(c => (
                  <span key={c} className="flex items-center gap-1 bg-secondary text-foreground text-xs px-3 py-1.5 rounded-full">
                    {c}
                    <button onClick={() => removeCuisine(c)} className="ml-0.5"><X className="w-3 h-3" /></button>
                  </span>
                ))}
                <button className="text-xs text-muted-foreground border border-dashed border-glass-border px-3 py-1.5 rounded-full">+ Add more</button>
              </div>
            </div>

            <button onClick={generateAIPlan} disabled={generating} className="coral-button w-full text-sm flex items-center justify-center gap-2">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {generating ? 'Generating...' : 'Generate Plan'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
