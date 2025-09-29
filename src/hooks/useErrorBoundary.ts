import type { AppError } from '@/lib/errors/AppError';

// Hook for functional components error handling
export const useErrorBoundary = () => {
  const throwError = (error: Error | AppError) => {
    throw error;
  };

  return { throwError };
};