/**
 * UTILITAIRES D'OPTIMISATION
 * Remplacements des patterns problématiques identifiés dans le cleanup
 */

// Remplacement pour les types any problématiques
export type SafeCallback<T = unknown> = (data: T) => void;
export type SafeAsyncCallback<T = unknown> = (data: T) => Promise<void>;

// Helper pour les conversions de type sécurisées
export function safeTypeConversion<T>(value: unknown, fallback: T): T {
  try {
    return (value as T) || fallback;
  } catch {
    return fallback;
  }
}

// Helper pour les arrays avec types inconnus
export function ensureArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

// Helper pour les objets avec propriétés optionnelles
export function safeObjectAccess<T>(obj: unknown, key: string): T | undefined {
  if (obj && typeof obj === 'object' && key in obj) {
    return (obj as Record<string, T>)[key];
  }
  return undefined;
}

// Helper pour les métriques avec valeurs par défaut
export function safeMetric(value: unknown, defaultValue: number = 0): number {
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return !isNaN(parsed) ? parsed : defaultValue;
  }
  return defaultValue;
}

// Pattern pour les erreurs sans variables inutilisées
export function handleSafeError(error: unknown, context: string): string {
  const message = error instanceof Error ? error.message : 'Erreur inconnue';
  // Ne pas utiliser console.log en production
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[${context}]`, message);
  }
  return message;
}

// Debounce optimisé sans any
export function debounceCallback<Args extends unknown[]>(
  callback: (...args: Args) => void | Promise<void>,
  delay: number
) {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback(...args), delay);
  };
}

// Cache simple pour éviter les re-calculs
class SimpleCache<T> {
  private cache = new Map<string, { data: T; timestamp: number }>();
  private ttl: number;

  constructor(ttlMs: number = 300000) { // 5 minutes par défaut
    this.ttl = ttlMs;
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.data;
  }

  set(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }
}

export const metricsCache = new SimpleCache<number>(60000); // 1 minute pour les métriques
export const dataCache = new SimpleCache<unknown[]>(300000); // 5 minutes pour les données

// Helper pour la gestion mémoire
export function optimizeMemoryUsage() {
  // Nettoyer les caches si nécessaire
  if (typeof window !== 'undefined' && 'performance' in window) {
    const memory = (performance as unknown as { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
    if (memory && memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8) {
      metricsCache.clear();
      dataCache.clear();
      
      // Forcer le garbage collection si disponible
      if ('gc' in window) {
        (window as unknown as { gc: () => void }).gc();
      }
    }
  }
}

// Optimisation des re-renders React
export function createStableKey(...values: (string | number | boolean | undefined | null)[]): string {
  return values.filter(v => v != null).join('|');
}

// Pattern pour éviter les any dans les handlers d'événements
export type SafeEventHandler<T = Event> = (event: T) => void;
export type SafeAsyncEventHandler<T = Event> = (event: T) => Promise<void>;

// Export par défaut pour l'utilisation simple
export default {
  safeTypeConversion,
  ensureArray,
  safeObjectAccess,
  safeMetric,
  handleSafeError,
  debounceCallback,
  optimizeMemoryUsage,
  createStableKey
};