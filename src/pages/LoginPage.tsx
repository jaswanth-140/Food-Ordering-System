import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, UtensilsCrossed, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import PreBiteLogo from '@/components/PreBiteLogo';
import heroBurger from '@/assets/hero-burger.jpg';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, signup, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/browse';

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (isSignUp) {
      const result = await signup(email, password, name);
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setError(result.error || 'Signup failed');
      }
    } else {
      const result = await login(email, password);
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setError(result.error || 'Login failed');
      }
    }
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left: Auth Form */}
      <div className="flex flex-col justify-center w-full lg:w-[45%] px-8 sm:px-16 lg:px-20">
        {/* Logo */}
        <div className="flex items-center mb-16">
          <PreBiteLogo size={36} />
          <span className="text-2xl font-bold text-foreground">
            Pre<span className="text-primary">Bite</span>
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-5xl font-extrabold text-foreground leading-tight mb-3">
          {isSignUp ? 'Create\naccount.' : 'Welcome\nback.'}
        </h1>
        <p className="text-muted-foreground mb-10">
          {isSignUp ? 'Sign up to start ordering delicious food.' : 'Please enter your details to sign in.'}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-destructive/20 border border-destructive/30 rounded-xl text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 max-w-sm">
          {isSignUp && (
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="glass-input w-full"
              required
            />
          )}

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="glass-input w-full"
            required
          />

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="glass-input w-full pr-12"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {!isSignUp && (
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-glass-border bg-glass accent-primary"
                />
                <span className="text-sm text-muted-foreground">Remember me</span>
              </label>
            </div>
          )}

          <button type="submit" disabled={submitting} className="coral-button w-full text-lg py-4 flex items-center justify-center gap-2">
            {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
            {isSignUp ? 'Sign Up' : 'Login'}
          </button>
        </form>

        {/* Toggle */}
        <p className="mt-8 text-sm text-muted-foreground max-w-sm text-center">
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
            className="text-primary font-semibold hover:underline"
          >
            {isSignUp ? 'Login' : 'Sign up'}
          </button>
        </p>
      </div>

      {/* Right: Hero Image */}
      <div className="hidden lg:block relative w-[55%] overflow-hidden">
        <img
          src={heroBurger}
          alt="Delicious gourmet burger"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-background/30 to-background" />

        {/* Floating stat pills */}
        <div className="absolute right-8 top-1/2 space-y-3">
          <div className="glass-card px-5 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">50k+</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Restaurants</p>
            </div>
          </div>
        </div>

        {/* Testimonial */}
        <div className="absolute bottom-8 left-8 right-8">
          <div className="glass-card p-6">
            <div className="flex gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-sm text-foreground/90 italic leading-relaxed">
              "The best delivery service I've ever used. The food arrived hot and the premium packaging was completely intact."
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent" />
              <div>
                <p className="text-sm font-semibold text-foreground">Sarah Jenkins</p>
                <p className="text-xs text-primary">Food Critic</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
