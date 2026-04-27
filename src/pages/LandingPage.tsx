import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin, Clock, Star } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import PreBiteLogo from '@/components/PreBiteLogo';
import heroBurger from '@/assets/hero-burger.jpg';
import restaurantHero from '@/assets/restaurant-hero.jpg';
import foodPizza from '@/assets/food-pizza.jpg';
import foodSushi from '@/assets/food-sushi.jpg';
import foodPokeBowl from '@/assets/food-poke-bowl.jpg';

export default function LandingPage() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  // Auto-redirect if already logged in
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/browse', { replace: true });
    }
  }, [loading, isAuthenticated, navigate]);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/browse');
    } else {
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between px-6 sm:px-12 py-5">
        <div className="flex items-center">
          <PreBiteLogo size={36} />
          <span className="text-xl font-extrabold tracking-tight text-foreground">
            Pre<span className="text-primary">Bite</span>
          </span>
        </div>
        <button
          onClick={handleGetStarted}
          className="ghost-button text-sm py-2.5 px-5"
        >
          Sign In
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 sm:px-12 pt-4 pb-24 lg:pt-6 lg:pb-32">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/6 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Left: Copy */}
          <div className="flex-1 text-center lg:text-left">

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-foreground leading-[1.05] mb-6">
              Food you{' '}
              <span className="text-primary">love</span>,
              <br />
              delivered{' '}
              <span className="relative inline-block">
                fast
                <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 12" fill="none">
                  <path d="M2 8C40 3 160 3 198 8" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-lg mx-auto lg:mx-0 mb-10 leading-relaxed">
              Discover restaurants near you, browse their real menus, and order your favorite meals — all in one place.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <button
                onClick={handleGetStarted}
                className="coral-button text-lg py-4 px-10 flex items-center gap-3 shadow-lg shadow-primary/25"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex -space-x-2">
                  {['🍔', '🍕', '🍣'].map((emoji, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-sm">
                      {emoji}
                    </div>
                  ))}
                </div>
                <span>10,000+ restaurants</span>
              </div>
            </div>
          </div>

          {/* Right: Hero image collage */}
          <div className="flex-1 relative w-full max-w-lg lg:max-w-xl">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden">
              <img
                src={heroBurger}
                alt="Delicious burger"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />

              {/* Floating cards */}
              <div className="absolute top-6 left-4 glass-card px-3.5 py-2.5 flex items-center gap-2 animate-[float_3s_ease-in-out_infinite]">
                <Star className="w-4 h-4 text-accent fill-accent" />
                <span className="text-sm font-semibold text-foreground">4.9 Rating</span>
              </div>

              <div className="absolute top-20 right-4 glass-card px-3.5 py-2.5 flex items-center gap-2 animate-[float_3s_ease-in-out_infinite_0.5s]">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">25 min</span>
              </div>

              <div className="absolute bottom-20 left-4 glass-card px-3.5 py-2.5 flex items-center gap-2 animate-[float_3s_ease-in-out_infinite_1s]">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Near you</span>
              </div>
            </div>

            {/* Smaller preview images */}
            <div className="absolute -bottom-6 -right-4 w-24 h-24 rounded-2xl overflow-hidden border-4 border-background shadow-xl">
              <img src={foodPizza} alt="Pizza" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-4 right-20 w-20 h-20 rounded-2xl overflow-hidden border-4 border-background shadow-xl">
              <img src={foodSushi} alt="Sushi" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Features strip */}
      <section className="relative px-6 sm:px-12 py-16 border-t border-glass-border">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            {
              icon: <MapPin className="w-6 h-6" />,
              title: 'Real-time Discovery',
              desc: 'Find restaurants actually near you using live location data.',
            },
            {
              icon: <PreBiteLogo size={24} />,
              title: 'Authentic Menus',
              desc: 'Browse real menus with actual prices — no fake data.',
            },
            {
              icon: <Clock className="w-6 h-6" />,
              title: 'Schedule & Plan',
              desc: 'Schedule recurring orders and plan your weekly meals.',
            },
          ].map((f, i) => (
            <div key={i} className="glass-card p-6 text-center sm:text-left">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 mx-auto sm:mx-0">
                {f.icon}
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative px-6 sm:px-12 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
            Ready to order?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Sign up in seconds and start exploring restaurants around you.
          </p>
          <button
            onClick={handleGetStarted}
            className="coral-button text-lg py-4 px-12 flex items-center gap-3 mx-auto shadow-lg shadow-primary/25"
          >
            Get Started — It's Free
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-glass-border px-6 sm:px-12 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <PreBiteLogo size={16} className="text-primary" />
            <span className="font-semibold text-foreground">PreBite</span>
          </div>
          <span>© {new Date().getFullYear()} PreBite. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
