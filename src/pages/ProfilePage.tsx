import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import { User, Mail, Phone, LogOut, Award, Loader2, Check, Heart, ShoppingBag, Star, Plus, Home, Briefcase, CreditCard, Clock, Share2, HelpCircle, CalendarDays, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export default function ProfilePage() {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalFavorites, setTotalFavorites] = useState(0);
  const [lastOrderDate, setLastOrderDate] = useState<string | null>(null);
  const [promoEmails, setPromoEmails] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) return;
    // Fetch stats
    supabase.from('orders').select('id, created_at', { count: 'exact', head: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data, count }) => {
        setTotalOrders(count || 0);
        if (data && data.length > 0) {
          const d = new Date(data[0].created_at);
          const now = new Date();
          const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
          setLastOrderDate(diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : `${diff} days ago`);
        }
      });
    supabase.from('favorites').select('id', { count: 'exact', head: true })
      .then(({ count }) => setTotalFavorites(count || 0));
  }, [isAuthenticated]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').update({ name, phone }).eq('id', user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    navigate('/login');
    return null;
  }

  const tier = user.tier || 'bronze';
  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);
  const memberSince = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
            <p className="text-muted-foreground mt-1">Manage your account settings and preferences.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="ghost-button flex items-center gap-2 text-sm">
              <Share2 className="w-4 h-4" /> Share
            </button>
            <button className="ghost-button flex items-center gap-2 text-sm">
              <HelpCircle className="w-4 h-4" /> Support
            </button>
          </div>
        </div>

        {/* Profile Card */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center text-4xl font-bold text-primary-foreground border-4 border-background">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </div>

            {/* Name + Email + Tier */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground">{user.name || 'User'}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {user.email}
                <span className="mx-2">•</span>
                <span className="inline-flex items-center gap-1 text-primary font-semibold">
                  <Award className="w-3.5 h-3.5" /> {tierLabel} Gourmand
                </span>
              </p>
            </div>

            {/* Member Since / Last Order */}
            <div className="flex gap-8 text-center">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Member Since</span>
                <span className="text-sm font-bold text-foreground">{memberSince}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Last Order</span>
                <span className="text-sm font-bold text-foreground">{lastOrderDate || 'Never'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Orders</span>
              <div className="text-3xl font-bold text-foreground">{totalOrders}</div>
            </div>
            <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
          <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Favorites</span>
              <div className="text-3xl font-bold text-foreground">{totalFavorites}</div>
              <span className="text-xs text-muted-foreground">Curated restaurants</span>
            </div>
            <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-pink-400" />
            </div>
          </div>
          <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Points Balance</span>
              <div className="text-3xl font-bold text-primary">{(user.loyaltyPoints || 0).toLocaleString()}</div>
              <span className="text-xs text-muted-foreground">Equal to ₹{((user.loyaltyPoints || 0) / 100 * 83).toFixed(0)} off</span>
            </div>
            <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-400" />
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* My Details */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-foreground">My Details</h3>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="text-primary text-sm font-semibold hover:underline flex items-center gap-1"
                >
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : saved ? <Check className="w-3 h-3" /> : null}
                  {saved ? 'Saved!' : 'Save Changes'}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="glass-input w-full"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={user.email}
                    className="glass-input w-full opacity-60 cursor-not-allowed"
                    disabled
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="glass-input w-full"
                    placeholder="+91 00000 00000"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1.5">Date of Birth</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={e => setDob(e.target.value)}
                    className="glass-input w-full"
                  />
                </div>
              </div>
            </div>

            {/* Saved Addresses */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-foreground">Saved Addresses</h3>
                <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div className="glass-card rounded-xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                    <Home className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground text-sm">Home</span>
                      <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-semibold">Default</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">123 Culinary Ave, Apt 4B, Foodie City</p>
                  </div>
                </div>
                <div className="glass-card rounded-xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold text-foreground text-sm">Work</span>
                    <p className="text-xs text-muted-foreground mt-0.5">456 Business Blvd, Suite 200</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Preferences */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-bold text-foreground mb-5">Preferences</h3>
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-foreground">Promotional Emails</span>
                    <p className="text-xs text-muted-foreground">Receive offers and discounts.</p>
                  </div>
                  <button
                    onClick={() => setPromoEmails(!promoEmails)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${promoEmails ? 'bg-primary' : 'bg-muted'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${promoEmails ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-foreground">SMS Notifications</span>
                    <p className="text-xs text-muted-foreground">Get updates on your delivery status.</p>
                  </div>
                  <button
                    onClick={() => setSmsNotifications(!smsNotifications)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${smsNotifications ? 'bg-primary' : 'bg-muted'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${smsNotifications ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Account Links */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Account</h3>
              <div className="space-y-1">
                <Link to="/orders" className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Order History</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Link>
                <Link to="/favorites" className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">My Favorites</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Link>
                <Link to="/schedule" className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <CalendarDays className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Scheduled Orders</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Link>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full glass-card rounded-2xl p-4 flex items-center justify-center gap-2 text-destructive font-semibold hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Log Out
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
