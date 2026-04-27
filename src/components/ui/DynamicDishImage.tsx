import { useState, useEffect } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { fetchDishImageBatched } from '@/utils/imageFetcherPipeline';
import { resolveDownloadedDishImage, getMenuItemImage } from '@/utils/menuItemImages';

interface DynamicDishImageProps {
  dishName: string;
  category?: string;
  isVeg?: boolean;
  className?: string;
  onResolved?: (url: string) => void;
  // If an initialUrl is passed from parent (e.g., from DB or pre-fetched), use it directly
  initialUrl?: string; 
}

function isTrustedInitialUrl(url?: string): boolean {
  if (!url) return false;
  const normalized = url.trim();
  if (!normalized) return false;

  // Remote URLs can be stale cached API matches, so let the resolver validate again.
  if (/^https?:\/\//i.test(normalized)) return false;
  if (normalized.startsWith('/dishes/')) return true;

  // Do not trust hashed /assets fallbacks (cat/dish placeholders),
  // let the fetch pipeline try to replace them with better matches.
  return false;
}

export default function DynamicDishImage({
  dishName,
  category = '',
  isVeg = false,
  className = '',
  onResolved,
  initialUrl
}: DynamicDishImageProps) {
  const [stage, setStage] = useState<'init' | 'loading' | 'loaded' | 'error'>('init');
  const [resolvedUrl, setResolvedUrl] = useState<string>('');

  useEffect(() => {
    // Stage 1: Check inputs
    if (isTrustedInitialUrl(initialUrl)) {
      setResolvedUrl(initialUrl);
      setStage('loaded');
      return;
    }

    // Stage 2: Check standard local mapped specific images
    const specificLocal = resolveDownloadedDishImage(dishName, category);
    if (specificLocal) {
      setResolvedUrl(specificLocal);
      setStage('loaded');
      if (onResolved) onResolved(specificLocal);
      return;
    }

    // Stage 3: Initiate Fetching Pipeline
    let isMounted = true;
    setStage('loading');

    fetchDishImageBatched(dishName).then((res) => {
      if (!isMounted) return;

      if (res.status === 'approved' && res.url) {
        setResolvedUrl(res.url);
        setStage('loaded');
        if (onResolved) onResolved(res.url);
      } else {
        const fallback = getMenuItemImage(dishName, category, isVeg);
        setResolvedUrl(fallback);
        setStage('loaded');
        if (onResolved) onResolved(fallback);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [dishName, category, initialUrl, isVeg, onResolved]);

  if (stage === 'loading' || stage === 'init') {
    return (
      <div className={`animate-pulse bg-secondary flex items-center justify-center ${className}`}>
        <ImageIcon className="w-6 h-6 text-muted-foreground opacity-30" />
      </div>
    );
  }

  return (
    <img
      src={resolvedUrl}
      alt={dishName}
      className={className}
      onError={(event) => {
        // Fallback if the URL itself is a dead link (e.g., Pexels deleted it)
        const target = event.target as HTMLImageElement;
        const localFallback = getMenuItemImage(dishName, category, isVeg);
        if (target.src !== localFallback) {
          target.src = localFallback;
        }
      }}
    />
  );
}
