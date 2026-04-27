import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import { Calendar, Clock, Plus, Sparkles, Loader2, Trash2, X, CalendarDays, CalendarCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/data/seed';

interface ScheduledRow {
  id: string;
  name: string;
  items_description: string | null;
  restaurant_name: string | null;
  frequency: string;
  scheduled_time: string | null;
  scheduled_days: number[] | null;
  price: number;
  is_active: boolean;
  icon: string | null;
  next_run_at: string | null;
  created_at: string;
}

const frequencyOptions = [
  { value: 'once', label: 'One-time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function getNextDate(schedule: ScheduledRow): Date {
  if (schedule.next_run_at) return new Date(schedule.next_run_at);
  return new Date(schedule.created_at);
}

export default function SchedulePage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<ScheduledRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'recurring'>('upcoming');

  // Form state
  const [formName, setFormName] = useState('');
  const [formRestaurant, setFormRestaurant] = useState('');
  const [formItems, setFormItems] = useState('');
  const [formFrequency, setFormFrequency] = useState('once');
  const [formTime, setFormTime] = useState('12:00');
  const [formPrice, setFormPrice] = useState('');
  const [formIcon, setFormIcon] = useState('🍽️');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchSchedules();
  }, [isAuthenticated]);

  const fetchSchedules = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('scheduled_orders')
      .select('*')
      .order('created_at', { ascending: false }) as { data: ScheduledRow[] | null };
    if (data) setSchedules(data);
    setLoading(false);
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('scheduled_orders').update({ is_active: !current }).eq('id', id);
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, is_active: !current } : s));
  };

  const deleteSchedule = async (id: string) => {
    await supabase.from('scheduled_orders').delete().eq('id', id);
    setSchedules(prev => prev.filter(s => s.id !== id));
  };

  const createSchedule = async () => {
    if (!formName.trim()) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    setSaving(true);
    const { data, error } = await (supabase.from('scheduled_orders') as any).insert({
      user_id: session.user.id,
      name: formName,
      restaurant_name: formRestaurant || null,
      items_description: formItems || null,
      frequency: formFrequency,
      scheduled_time: formTime,
      price: parseFloat(formPrice) || 0,
      icon: formIcon,
      is_active: true,
    }).select() as { data: ScheduledRow[] | null; error: any };

    if (data?.[0]) {
      setSchedules(prev => [data[0], ...prev]);
      setShowForm(false);
      setFormName(''); setFormRestaurant(''); setFormItems('');
      setFormFrequency('once'); setFormTime('12:00'); setFormPrice(''); setFormIcon('🍽️');
    }
    setSaving(false);
  };

  const upcomingSchedules = schedules.filter(s => s.is_active);
  const recurringSchedules = schedules.filter(s => s.frequency !== 'once');

  // Monthly overview
  const totalUpcoming = upcomingSchedules.length;
  const totalEstimated = schedules.reduce((sum, s) => sum + s.price, 0);

  // Group upcoming by week
  const thisWeek = upcomingSchedules.slice(0, 3);
  const nextWeek = upcomingSchedules.slice(3, 5);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Schedule Orders</h1>
          <p className="text-muted-foreground mb-6">Login to schedule recurring deliveries.</p>
          <button onClick={() => navigate('/login')} className="coral-button">Login to Continue</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Schedule</h1>
            <p className="text-muted-foreground mt-1">Manage your upcoming deliveries and recurring meal plans.</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Tabs */}
            <div className="flex bg-secondary rounded-full p-1">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeTab === 'upcoming' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setActiveTab('recurring')}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeTab === 'recurring' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Recurring
              </button>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="coral-button flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" /> Schedule New Order
            </button>
          </div>
        </div>

        {/* AI Suggestion Banner */}
        {schedules.length > 0 && (
          <div className="mt-6 glass-card rounded-2xl p-5 flex items-center gap-4 border border-primary/20">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground text-sm">AI Suggestion</h3>
              <p className="text-sm text-muted-foreground">
                It looks like you order <span className="text-primary font-medium">{schedules[0]?.name}</span> frequently. Want to make it automatic?
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button className="text-sm text-muted-foreground hover:text-foreground">Dismiss</button>
              <button className="bg-secondary text-foreground rounded-full px-5 py-2.5 text-sm font-medium hover:bg-secondary/80 transition-colors">
                Set Recurring
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="mt-8 flex gap-8">
            {/* Left: Timeline */}
            <div className="flex-1">
              {schedules.length === 0 ? (
                <div className="text-center py-20">
                  <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-foreground mb-2">No scheduled orders</h2>
                  <p className="text-muted-foreground mb-6">Create recurring orders for your favorite meals.</p>
                </div>
              ) : (
                <>
                  {/* This Week */}
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <CalendarDays className="w-5 h-5 text-muted-foreground" />
                      <h2 className="text-lg font-bold text-foreground">This Week</h2>
                    </div>
                    <div className="space-y-4">
                      {(activeTab === 'upcoming' ? thisWeek : recurringSchedules).map(schedule => {
                        const date = getNextDate(schedule);
                        return (
                          <div key={schedule.id} className="glass-card rounded-2xl p-5 flex items-center gap-5">
                            {/* Date column */}
                            <div className="text-center flex-shrink-0 w-16">
                              <span className="text-xs text-primary font-semibold">{monthNames[date.getMonth()]}</span>
                              <div className="text-3xl font-bold text-foreground">{date.getDate()}</div>
                              <span className="text-xs text-muted-foreground">{dayNames[date.getDay()]}</span>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                {schedule.scheduled_time && (
                                  <span className="flex items-center gap-1 bg-teal-500/20 text-teal-400 text-xs px-2.5 py-1 rounded-full">
                                    <Clock className="w-3 h-3" /> {schedule.scheduled_time}
                                  </span>
                                )}
                                <span className={`text-xs px-2.5 py-1 rounded-full ${
                                  schedule.frequency === 'once'
                                    ? 'bg-secondary text-muted-foreground'
                                    : 'bg-purple-500/20 text-purple-400'
                                }`}>
                                  {schedule.frequency === 'once' ? 'One-time' : `🔄 ${schedule.frequency.charAt(0).toUpperCase() + schedule.frequency.slice(1)}`}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                                  {schedule.icon || '🍽️'}
                                </div>
                                <div>
                                  <h3 className="font-bold text-foreground">{schedule.name}</h3>
                                  {schedule.items_description && (
                                    <p className="text-xs text-muted-foreground mt-0.5">{schedule.items_description}</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Price + Edit */}
                            <div className="text-right flex-shrink-0">
                              {schedule.price > 0 && (
                                <div className="text-lg font-bold text-foreground">{formatPrice(schedule.price)}</div>
                              )}
                              <button className="text-primary text-sm font-medium hover:underline mt-1">Edit Order</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Next Week */}
                  {nextWeek.length > 0 && activeTab === 'upcoming' && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <CalendarCheck className="w-5 h-5 text-muted-foreground" />
                        <h2 className="text-lg font-bold text-foreground">Next Week</h2>
                      </div>
                      <div className="space-y-4">
                        {nextWeek.map(schedule => {
                          const date = getNextDate(schedule);
                          return (
                            <div key={schedule.id} className="glass-card rounded-2xl p-5 flex items-center gap-5">
                              <div className="text-center flex-shrink-0 w-16">
                                <span className="text-xs text-primary font-semibold">{monthNames[date.getMonth()]}</span>
                                <div className="text-3xl font-bold text-foreground">{date.getDate()}</div>
                                <span className="text-xs text-muted-foreground">{dayNames[date.getDay()]}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                  {schedule.scheduled_time && (
                                    <span className="flex items-center gap-1 bg-teal-500/20 text-teal-400 text-xs px-2.5 py-1 rounded-full">
                                      <Clock className="w-3 h-3" /> {schedule.scheduled_time}
                                    </span>
                                  )}
                                  <span className={`text-xs px-2.5 py-1 rounded-full ${
                                    schedule.frequency === 'monthly' ? 'bg-purple-500/20 text-purple-400' : 'bg-secondary text-muted-foreground'
                                  }`}>
                                    {schedule.frequency === 'once' ? 'One-time' : `🔄 ${schedule.frequency.charAt(0).toUpperCase() + schedule.frequency.slice(1)}`}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                                    {schedule.icon || '🍽️'}
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-foreground">{schedule.name}</h3>
                                    {schedule.items_description && (
                                      <p className="text-xs text-muted-foreground mt-0.5">{schedule.items_description}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                {schedule.price > 0 && (
                                  <div className="text-lg font-bold text-foreground">{formatPrice(schedule.price)}</div>
                                )}
                                <button className="text-primary text-sm font-medium hover:underline mt-1">Edit Order</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right Sidebar: Quick Rules + Monthly Overview */}
            <div className="hidden lg:block w-80 flex-shrink-0 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-foreground">Quick Rules</h3>
                  <button className="text-primary text-sm font-medium hover:underline">View All</button>
                </div>
                <div className="space-y-4">
                  {recurringSchedules.slice(0, 3).map(rule => (
                    <div key={rule.id} className="glass-card rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-secondary rounded-xl flex items-center justify-center text-lg">
                            {rule.icon || '🍽️'}
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground text-sm">{rule.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {rule.frequency === 'weekly' ? `Every ${dayNames[rule.scheduled_days?.[0] || 5]}` : rule.frequency} • {rule.scheduled_time || '12:00'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleActive(rule.id, rule.is_active)}
                          className={`w-11 h-6 rounded-full transition-colors relative ${
                            rule.is_active ? 'bg-primary' : 'bg-muted'
                          }`}
                        >
                          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                            rule.is_active ? 'left-[22px]' : 'left-0.5'
                          }`} />
                        </button>
                      </div>
                      {rule.restaurant_name && (
                        <div className="flex items-center gap-2 mt-2 mb-3">
                          <div className="w-6 h-6 bg-secondary rounded-lg flex items-center justify-center text-xs">
                            {rule.icon || '🍽️'}
                          </div>
                          <span className="text-xs text-muted-foreground">{rule.restaurant_name}</span>
                        </div>
                      )}
                      <button className="w-full border border-glass-border text-foreground rounded-xl py-2 text-sm font-medium hover:bg-glass transition-colors">
                        Edit Schedule
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly Overview */}
              <div>
                <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-4">Monthly Overview</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-card rounded-2xl p-4 text-center">
                    <div className="text-2xl font-bold text-primary">{totalUpcoming}</div>
                    <p className="text-xs text-muted-foreground mt-1">Upcoming Orders</p>
                  </div>
                  <div className="glass-card rounded-2xl p-4 text-center">
                    <div className="text-2xl font-bold text-foreground">{formatPrice(totalEstimated)}</div>
                    <p className="text-xs text-muted-foreground mt-1">Est. Total</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <footer className="mt-16 text-center text-sm text-muted-foreground py-6 border-t border-glass-border">
          © {new Date().getFullYear()} PreBite. Crafted for food lovers.
        </footer>
      </main>

      {/* New Schedule Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-8 w-full max-w-lg border border-glass-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Schedule New Order</h3>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block mb-1.5">Name</label>
                <input value={formName} onChange={e => setFormName(e.target.value)} className="glass-input w-full" placeholder="e.g. Weekly Cheat Meal" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block mb-1.5">Restaurant</label>
                <input value={formRestaurant} onChange={e => setFormRestaurant(e.target.value)} className="glass-input w-full" placeholder="e.g. Burger King" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block mb-1.5">Items</label>
                <input value={formItems} onChange={e => setFormItems(e.target.value)} className="glass-input w-full" placeholder="e.g. 2x Whopper, 1x Fries" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block mb-1.5">Estimated Price (₹)</label>
                <input type="number" value={formPrice} onChange={e => setFormPrice(e.target.value)} className="glass-input w-full" placeholder="499" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block mb-1.5">Frequency</label>
                <select value={formFrequency} onChange={e => setFormFrequency(e.target.value)} className="glass-input w-full">
                  {frequencyOptions.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block mb-1.5">Time</label>
                <input type="time" value={formTime} onChange={e => setFormTime(e.target.value)} className="glass-input w-full" />
              </div>
            </div>
            <div className="flex items-center gap-2 mb-6">
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Icon</label>
              {['🍽️', '🍔', '🍕', '☕', '🍣', '🥗'].map(icon => (
                <button
                  key={icon}
                  onClick={() => setFormIcon(icon)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${formIcon === icon ? 'bg-primary/20 border border-primary' : 'bg-glass'}`}
                >
                  {icon}
                </button>
              ))}
            </div>
            <button onClick={createSchedule} disabled={saving || !formName.trim()} className="coral-button w-full flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Schedule
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
