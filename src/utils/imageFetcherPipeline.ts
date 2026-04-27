import { supabase } from '@/integrations/supabase/client';

export interface ImageResolveResult {
  url: string;
  status: string;
  fallbackType?: string;
  isError?: boolean;
}

// Holds ongoing promises by normalized dish name
const inFlightRequests = new Map<string, Promise<ImageResolveResult>>();

// Batching queue
let batchQueue: string[] = [];
let batchTimeoutId: ReturnType<typeof setTimeout> | null = null;
const BATCH_DELAY_MS = 50; // Wait 50ms to collect mounting components

// Resolvers for the batch queue
const batchResolvers = new Map<string, { resolve: (res: ImageResolveResult) => void; reject: (err: any) => void }[]>();

function flushBatch() {
  if (batchQueue.length === 0) return;

  const currentBatch = [...new Set(batchQueue)];
  const currentResolvers = new Map(batchResolvers);
  
  batchQueue = [];
  batchResolvers.clear();
  batchTimeoutId = null;

  // Fire Edge Function
  supabase.functions.invoke('fetch-dish-images', {
    body: { dishNames: currentBatch }
  })
    .then(({ data, error }) => {
      if (error) throw error;
      
      const results = data?.results || {};
      
      // Resolve all promises
      for (const dishName of currentBatch) {
        const res = results[dishName] || { url: '', status: 'failed', isError: true };
        const handlers = currentResolvers.get(dishName);
        if (handlers) {
          handlers.forEach(h => h.resolve(res));
        }
        // Clear from in-flight
        inFlightRequests.delete(dishName.toLowerCase().trim());
      }
    })
    .catch(err => {
      console.error('Failed to batch fetch dish images:', err);
      // Reject all promises
      for (const dishName of currentBatch) {
        const handlers = currentResolvers.get(dishName);
        if (handlers) {
          handlers.forEach(h => h.resolve({ url: '', status: 'failed', isError: true, fallbackType: 'network_error' }));
        }
        inFlightRequests.delete(dishName.toLowerCase().trim());
      }
    });
}

export function fetchDishImageBatched(dishName: string): Promise<ImageResolveResult> {
  if (!dishName) return Promise.resolve({ url: '', status: 'failed' });
  
  const normKey = dishName.toLowerCase().trim();

  // Deduplication: If already in flight, return the same promise
  if (inFlightRequests.has(normKey)) {
    return inFlightRequests.get(normKey)!;
  }

  // Otherwise, create a new promise and add to queue
  const promise = new Promise<ImageResolveResult>((resolve, reject) => {
    if (!batchResolvers.has(dishName)) {
      batchResolvers.set(dishName, []);
    }
    batchResolvers.get(dishName)!.push({ resolve, reject });
    batchQueue.push(dishName);

    if (!batchTimeoutId) {
      batchTimeoutId = setTimeout(flushBatch, BATCH_DELAY_MS);
    }
  });

  inFlightRequests.set(normKey, promise);
  return promise;
}
