import { Link, useLocation } from 'react-router-dom';
import { Search, Calendar, Sparkles, Heart, Package } from 'lucide-react';

const tabs = [
  { path: '/browse', icon: Search, label: 'Browse' },
  { path: '/schedule', icon: Calendar, label: 'Schedule' },
  { path: '/planner', icon: Sparkles, label: 'Planner' },
  { path: '/favorites', icon: Heart, label: 'Favorites' },
  { path: '/orders', icon: Package, label: 'Orders' },
];

export default function MobileBottomNav() {
  const { pathname } = useLocation();

  // Hide on certain pages
  const hiddenPaths = ['/login', '/landing', '/', '/checkout', '/cart'];
  if (hiddenPaths.includes(pathname) || pathname.startsWith('/tracking')) return null;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-glass-border">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map(tab => {
          const isActive = pathname === tab.path;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <tab.icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
