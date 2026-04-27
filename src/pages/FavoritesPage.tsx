import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import { Heart, Plus, Loader2, MoreVertical, ArrowRight, Zap, Image as ImageIcon } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/data/seed';
import DynamicDishImage from '@/components/ui/DynamicDishImage';

interface FavoriteRow {
  id: string;
  item_type: string;
  item_data: any;
  collection_name: string;
  created_at: string;
}

// Collection card colors matching reference
const collectionColors: Record<string, string> = {
  'Quick Saves': 'from-primary to-primary/80',
  'Date Night': 'from-amber-800 to-amber-900',
  'Late Night': 'from-stone-700 to-stone-800',
  'Healthy': 'from-emerald-800 to-emerald-900',
  'Office Party': 'from-teal-800 to-teal-900',
  'Dessert Heaven': 'from-pink-800 to-pink-900',
};

const filterChips = ['All Items', 'Top Rated', 'Under ₹500', 'Spicy', 'Vegan', 'Sushi'];

export default function FavoritesPage() {
  const { user, isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoriteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'collections' | 'all'>('collections');
  const [activeFilter, setActiveFilter] = useState('All Items');
  const [sortBy, setSortBy] = useState('Recently Added');
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchFavorites();
  }, [isAuthenticated]);

  const fetchFavorites = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('favorites')
      .select('*')
      .order('created_at', { ascending: false }) as { data: FavoriteRow[] | null };

    if (data) {
      setFavorites(data);
      const cols = [...new Set(data.map(f => f.collection_name))];
      setCollections(cols);
    }
    setLoading(false);
  };

  const removeFavorite = async (id: string) => {
    await supabase.from('favorites').delete().eq('id', id);
    setFavorites(prev => prev.filter(f => f.id !== id));
  };

  const getCollectionItems = (col: string) => favorites.filter(f => f.collection_name === col);
  const getCollectionImages = (col: string) => {
    return getCollectionItems(col)
      .filter(f => f.item_data?.imageUrl)
      .slice(0, 4)
      .map(f => f.item_data.imageUrl);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Save your favorites</h1>
          <p className="text-muted-foreground mb-6">Login to start saving dishes and restaurants you love.</p>
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
            <h1 className="text-3xl font-bold text-foreground">My Favorites</h1>
            <p className="text-muted-foreground mt-1">Curate your culinary journey with personalized collections.</p>
          </div>
          <button
            onClick={() => setShowNewCollection(true)}
            className="coral-button flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" /> New Collection
          </button>
        </div>

        {/* Tabs + Sort */}
        <div className="flex items-center justify-between mt-6 mb-6 border-b border-glass-border">
          <div className="flex">
            <button
              onClick={() => setActiveTab('collections')}
              className={`px-4 pb-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'collections'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Collections
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 pb-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'all'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              All Saved Items
            </button>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground pb-3">
            <span>Sort by:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-transparent text-foreground font-medium cursor-pointer outline-none"
            >
              <option value="Recently Added">Recently Added</option>
              <option value="Price">Price</option>
              <option value="Name">Name</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : activeTab === 'collections' ? (
          /* Collections Grid - Masonry-like layout */
          <div>
            {collections.length === 0 ? (
              <div className="text-center py-20">
                <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-bold text-foreground mb-2">No collections yet</h2>
                <p className="text-muted-foreground mb-6">Save dishes to collections while browsing restaurants.</p>
                <button onClick={() => navigate('/browse')} className="coral-button">Browse Restaurants</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {collections.map((col, idx) => {
                  const items = getCollectionItems(col);
                  const images = getCollectionImages(col);
                  const isQuickSaves = col.toLowerCase().includes('quick') || idx === 0;
                  const gradient = collectionColors[col] || 'from-secondary to-secondary/80';

                  return (
                    <div
                      key={col}
                      className={`rounded-2xl overflow-hidden cursor-pointer group transition-all duration-200 hover:scale-[1.02] ${
                        isQuickSaves && idx === 0 ? 'row-span-2' : ''
                      }`}
                    >
                      {isQuickSaves && idx === 0 ? (
                        /* Large featured card */
                        <div className={`bg-gradient-to-br ${gradient} h-full min-h-[320px] p-6 flex flex-col justify-between relative`}>
                          <div>
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                              <Zap className="w-5 h-5 text-primary-foreground" />
                            </div>
                            <h3 className="text-xl font-bold text-primary-foreground">{col}</h3>
                            <p className="text-sm text-primary-foreground/70 mt-1">Unsorted items you love</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex -space-x-2">
                                {images.slice(0, 3).map((img, i) => (
                                  <div key={i} className="w-8 h-8 rounded-full border-2 border-primary overflow-hidden">
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                  </div>
                                ))}
                              </div>
                              {items.length > 3 && (
                                <span className="text-xs bg-primary/30 text-primary-foreground px-2 py-0.5 rounded-full">
                                  +{items.length - 3}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-primary-foreground/80">
                              <span className="text-sm">{items.length} Items</span>
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Grid card with images */
                        <div className="glass-card h-full">
                          <div className="grid grid-cols-2 gap-0.5 rounded-t-2xl overflow-hidden h-40">
                            {images.length > 0 ? (
                              images.slice(0, 4).map((img, i) => (
                                <div key={i} className="bg-secondary overflow-hidden">
                                  <img src={img} alt="" className="w-full h-full object-cover" />
                                </div>
                              ))
                            ) : (
                              <div className="col-span-2 bg-secondary flex items-center justify-center h-full">
                                <ImageIcon className="w-8 h-8 text-muted-foreground" />
                              </div>
                            )}
                            {images.length > 0 && images.length < 4 && Array.from({ length: 4 - images.length }).map((_, i) => (
                              <div key={`empty-${i}`} className="bg-secondary flex items-center justify-center">
                                <ImageIcon className="w-5 h-5 text-muted-foreground/40" />
                              </div>
                            ))}
                          </div>
                          <div className="p-4 flex items-center justify-between">
                            <div>
                              <h3 className="font-bold text-foreground text-sm">{col}</h3>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {items.length} items • Private
                              </p>
                            </div>
                            <button className="text-muted-foreground hover:text-foreground">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* All Saved Items view */
          <div>
            {/* Filter chips */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {filterChips.map(chip => (
                <button
                  key={chip}
                  onClick={() => setActiveFilter(chip)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                    activeFilter === chip
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-glass-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>

            {favorites.length === 0 ? (
              <div className="text-center py-20">
                <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-bold text-foreground mb-2">No favorites yet</h2>
                <p className="text-muted-foreground mb-6">Browse restaurants and tap the heart icon to save dishes you love.</p>
                <button onClick={() => navigate('/browse')} className="coral-button">Browse Restaurants</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {favorites.map(fav => {
                  const item = fav.item_data;
                  return (
                    <div key={fav.id} className="glass-card rounded-2xl overflow-hidden group">
                      {item.imageUrl && (
                        <div className="relative h-44">
                          <DynamicDishImage dishName={item.name} initialUrl={item.imageUrl} className="w-full h-full object-cover" />
                          <button
                            onClick={() => removeFavorite(fav.id)}
                            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-primary hover:bg-black/70 transition-colors"
                          >
                            <Heart className="w-4 h-4 fill-primary" />
                          </button>
                          <span className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-md backdrop-blur-sm">
                            {fav.collection_name}
                          </span>
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-foreground text-sm truncate">{item.name}</h3>
                          {item.price && <span className="text-primary font-bold">{formatPrice(item.price)}</span>}
                        </div>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-1">{item.restaurantName || 'Restaurant'} • 20-30 min</p>
                        )}
                        {fav.item_type === 'dish' && (
                          <button
                            onClick={() => addItem({
                              id: item.id || fav.id,
                              restaurantId: item.restaurantId || '',
                              name: item.name,
                              description: item.description || '',
                              price: item.price || 0,
                              category: item.category || '',
                              imageUrl: item.imageUrl || '',
                              isVeg: item.isVeg || false,
                              allergens: item.allergens || [],
                            })}
                            className="mt-3 w-full border border-glass-border text-foreground rounded-full py-2 text-sm font-medium hover:bg-glass transition-colors"
                          >
                            Order Again
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Recently Saved section (shown when on collections tab) */}
        {activeTab === 'collections' && favorites.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Recently Saved</h2>
              <button
                onClick={() => setActiveTab('all')}
                className="text-primary text-sm font-medium flex items-center gap-1 hover:underline"
              >
                View All Items <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Filter chips */}
            <div className="flex gap-2 mb-5 overflow-x-auto pb-2">
              {filterChips.map(chip => (
                <button
                  key={chip}
                  onClick={() => setActiveFilter(chip)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                    activeFilter === chip
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-glass-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {favorites.slice(0, 4).map(fav => {
                const item = fav.item_data;
                return (
                  <div key={fav.id} className="glass-card rounded-2xl overflow-hidden group">
                    {item.imageUrl && (
                      <div className="relative h-44">
                        <DynamicDishImage dishName={item.name} initialUrl={item.imageUrl} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeFavorite(fav.id)}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-primary hover:bg-black/70 transition-colors"
                        >
                          <Heart className="w-4 h-4 fill-primary" />
                        </button>
                        <span className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-md backdrop-blur-sm">
                          {fav.collection_name}
                        </span>
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-foreground text-sm truncate">{item.name}</h3>
                        {item.price && <span className="text-primary font-bold">{formatPrice(item.price)}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{item.restaurantName || 'Restaurant'} • 20-30 min</p>
                      {fav.item_type === 'dish' && (
                        <button
                          onClick={() => addItem({
                            id: item.id || fav.id,
                            restaurantId: item.restaurantId || '',
                            name: item.name,
                            description: item.description || '',
                            price: item.price || 0,
                            category: item.category || '',
                            imageUrl: item.imageUrl || '',
                            isVeg: item.isVeg || false,
                            allergens: item.allergens || [],
                          })}
                          className="mt-3 w-full border border-glass-border text-foreground rounded-full py-2 text-sm font-medium hover:bg-glass transition-colors"
                        >
                          Order Again
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <footer className="mt-16 text-center text-sm text-muted-foreground py-6 border-t border-glass-border">
          © {new Date().getFullYear()} PreBite. All your cravings in one place.
        </footer>
      </main>

      {/* New Collection Modal */}
      {showNewCollection && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-8 w-full max-w-md border border-glass-border">
            <h3 className="text-xl font-bold text-foreground mb-4">New Collection</h3>
            <input
              value={newCollectionName}
              onChange={e => setNewCollectionName(e.target.value)}
              className="glass-input w-full mb-4"
              placeholder="e.g. Date Night Ideas"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setShowNewCollection(false)} className="ghost-button flex-1 text-sm">Cancel</button>
              <button
                onClick={() => { setShowNewCollection(false); setNewCollectionName(''); }}
                className="coral-button flex-1 text-sm"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
