/**
 * COMPOSANTS LAZY SIMPLIFIÉS - Version optimisée sans conflits de types
 */

import React, { Suspense, lazy } from 'react';
import ErrorBoundary from '@/components/error/ErrorBoundary';

// Fallbacks optimisés
const ChartLoader = () => (
  <div className="h-64 bg-muted rounded-lg flex items-center justify-center animate-pulse">
    <div className="text-center space-y-2">
      <div className="h-6 w-32 bg-muted-foreground/20 rounded mx-auto"></div>
      <div className="h-4 w-24 bg-muted-foreground/10 rounded mx-auto"></div>
    </div>
  </div>
);

const PageLoader = () => (
  <div className="space-y-6 animate-pulse p-6">
    <div className="h-8 w-48 bg-muted rounded"></div>
    <div className="grid gap-6 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-32 bg-muted rounded-lg"></div>
      ))}
    </div>
    <div className="h-96 bg-muted rounded-lg"></div>
  </div>
);

// Wrapper avec gestion d'erreur
function LazyWrapper({ 
  children, 
  fallback = <div>Chargement...</div> 
}: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

// Composants lazy optimisés
export const LazyAnalytics = lazy(() => import('@/pages/Analytics'));
export const LazyDashboard = lazy(() => import('@/pages/Dashboard'));
export const LazyCRM = lazy(() => import('@/pages/CRM'));
export const LazyCallsChart = lazy(() => import('@/features/analytics/CallsChart'));
export const LazyRevenueChart = lazy(() => import('@/features/analytics/RevenueChart'));
export const LazyConversionFunnel = lazy(() => import('@/features/analytics/ConversionFunnel'));

// Composants wrappés avec fallbacks
export const Analytics = (props: any) => (
  <LazyWrapper fallback={<PageLoader />}>
    <LazyAnalytics {...props} />
  </LazyWrapper>
);

export const Dashboard = (props: any) => (
  <LazyWrapper fallback={<PageLoader />}>
    <LazyDashboard {...props} />
  </LazyWrapper>
);

export const CRM = (props: any) => (
  <LazyWrapper fallback={<PageLoader />}>
    <LazyCRM {...props} />
  </LazyWrapper>
);

export const CallsChart = (props: any) => (
  <LazyWrapper fallback={<ChartLoader />}>
    <LazyCallsChart {...props} />
  </LazyWrapper>
);

export const RevenueChart = (props: any) => (
  <LazyWrapper fallback={<ChartLoader />}>
    <LazyRevenueChart {...props} />
  </LazyWrapper>
);

export const ConversionFunnel = (props: any) => (
  <LazyWrapper fallback={<ChartLoader />}>
    <LazyConversionFunnel {...props} />
  </LazyWrapper>
);

// Hook de préchargement simple
export function usePreload() {
  React.useEffect(() => {
    // Précharger les composants critiques après 1 seconde
    const timer = setTimeout(() => {
      import('@/pages/Dashboard');
      import('@/pages/CRM');
    }, 1000);

    return () => clearTimeout(timer);
  }, []);
}

export default {
  Analytics,
  Dashboard,
  CRM,
  CallsChart,
  RevenueChart,
  ConversionFunnel,
  usePreload
};