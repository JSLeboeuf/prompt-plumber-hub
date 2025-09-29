/**
 * OPTIMISATION BUNDLE & BUILD - Configuration avancée
 */

import React from 'react';
import { prodLogger } from '@/lib/productionLogger';

// Configuration pour l'optimisation du bundle Vite
export const bundleOptimizations = {
  // Composants à lazy loader par priorité
  lazyComponents: {
    critical: ['Dashboard', 'CRM'], // Précharger immédiatement
    important: ['Analytics', 'CallsChart'], // Précharger au hover
    optional: ['ConversionFunnel', 'RevenueChart'] // Charger à la demande
  },
  
  // Seuils de performance
  performanceThresholds: {
    maxBundleSize: '500kb', // Alerte si bundle > 500kb
    maxChunkSize: '200kb',  // Split si chunk > 200kb
    maxComponents: 10       // Lazy loading automatique si > 10 composants
  },
  
  // Cache strategies par type de données
  cacheStrategies: {
    realtime: {
      staleTime: 30000,     // 30 secondes
      gcTime: 2 * 60 * 1000  // 2 minutes
    },
    analytics: {
      staleTime: 5 * 60 * 1000,  // 5 minutes
      gcTime: 15 * 60 * 1000     // 15 minutes
    },
    static: {
      staleTime: 30 * 60 * 1000, // 30 minutes
      gcTime: 60 * 60 * 1000     // 1 heure
    }
  }
};

// Helper pour optimiser les imports dynamiques
export function createOptimizedImport(
  modulePath: string,
  preloadCondition?: () => boolean
) {
  return () => {
    // Précharger si condition remplie
    if (preloadCondition && preloadCondition()) {
      const modulePromise = import(modulePath);
      return modulePromise;
    }
    
    // Import différé standard
    return import(modulePath);
  };
}

// Métriques de performance pour le monitoring
export class BundleMetrics {
  private static metrics = new Map<string, number>();
  
  static recordChunkLoad(chunkName: string, loadTime: number) {
    this.metrics.set(`chunk_${chunkName}`, loadTime);
    
    // Alerter si charge lente
    if (loadTime > 2000) {
      prodLogger.warn(`Chunk '${chunkName}' loaded slowly`, { loadTime, chunkName });
    }
  }
  
  static recordComponentRender(componentName: string, renderTime: number) {
    this.metrics.set(`render_${componentName}`, renderTime);
    
    // Alerter si render lent
    if (renderTime > 100) {
      prodLogger.warn(`Component '${componentName}' rendered slowly`, { renderTime, componentName });
    }
  }
  
  static getMetrics() {
    return Object.fromEntries(this.metrics);
  }
  
  static clearMetrics() {
    this.metrics.clear();
  }
}

// Optimisation de la mémoire React
export function createMemoizedComponent<T extends Record<string, unknown>>(
  component: React.ComponentType<T>,
  propsAreEqual?: (prevProps: T, nextProps: T) => boolean
) {
  return React.memo(component, propsAreEqual || ((prev, next) => {
    // Comparaison par défaut optimisée
    const prevKeys = Object.keys(prev);
    const nextKeys = Object.keys(next);
    
    if (prevKeys.length !== nextKeys.length) return false;
    
    return prevKeys.every(key => {
      const prevVal = prev[key];
      const nextVal = next[key];
      
      // Comparaison peu profonde optimisée
      if (prevVal === nextVal) return true;
      if (typeof prevVal !== typeof nextVal) return false;
      if (Array.isArray(prevVal) && Array.isArray(nextVal)) {
        return prevVal.length === nextVal.length && 
               prevVal.every((item, index) => item === nextVal[index]);
      }
      
      return false;
    });
  }));
}

// Export par défaut
export default {
  bundleOptimizations,
  createOptimizedImport,
  BundleMetrics,
  createMemoizedComponent
};