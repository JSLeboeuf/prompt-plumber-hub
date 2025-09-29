/**
 * COMPOSANTS LAZY SIMPLIFIÉS - Version optimisée sans conflits de types
 */

import React, { Suspense, lazy } from 'react';
import ErrorBoundary from '@/components/error/ErrorBoundary';

// Types pour les props des composants
interface PageProps {
  [key: string]: unknown;
}

interface ChartProps {
  data?: unknown[];
  title?: string;
  [key: string]: unknown;
}

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
export const Analytics = (props: PageProps) => (
  <LazyWrapper fallback={<PageLoader />}>
    <LazyAnalytics {...props} />
  </LazyWrapper>
);

export const Dashboard = (props: PageProps) => (
  <LazyWrapper fallback={<PageLoader />}>
    <LazyDashboard {...props} />
  </LazyWrapper>
);

export const CRM = (props: PageProps) => (
  <LazyWrapper fallback={<PageLoader />}>
    <LazyCRM {...props} />
  </LazyWrapper>
);

export const CallsChart = (props: ChartProps) => (
  <LazyWrapper fallback={<ChartLoader />}>
    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
    <LazyCallsChart {...(props as any)} />
  </LazyWrapper>
);

export const RevenueChart = (props: ChartProps) => (
  <LazyWrapper fallback={<ChartLoader />}>
    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
    <LazyRevenueChart {...(props as any)} />
  </LazyWrapper>
);

export const ConversionFunnel = (props: ChartProps) => (
  <LazyWrapper fallback={<ChartLoader />}>
    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
    <LazyConversionFunnel {...(props as any)} />
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