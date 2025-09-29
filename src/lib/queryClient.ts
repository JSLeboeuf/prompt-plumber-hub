import { QueryClient } from "@tanstack/react-query";
import { logger } from "@/lib/logger";

const DEFAULT_BASE_URL = "http://localhost:8080";

function resolveBaseUrl(): string {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> })?.env;
  const processEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  return (
    env?.VITE_API_BASE_URL ||
    env?.NEXT_PUBLIC_API_BASE_URL ||
    processEnv?.VITE_API_BASE_URL ||
    processEnv?.NEXT_PUBLIC_API_BASE_URL ||
    DEFAULT_BASE_URL
  );
}

export const API_BASE_URL = resolveBaseUrl();

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache pendant 5 minutes par défaut
      staleTime: 5 * 60 * 1000,
      // Garde en cache pendant 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry intelligent
      retry: (failureCount, error) => {
        // Ne pas retry les erreurs 4xx
        if (error instanceof Error && error.message.includes('4')) return false;
        return failureCount < 3;
      },
      // Refetch uniquement si stale
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
      // Background updates pour les données critiques
      refetchInterval: (query) => {
        // Refetch automatique pour les données temps réel
        if (query.queryKey.includes('calls') || query.queryKey.includes('alerts')) {
          return 30000; // 30 secondes
        }
        // Données moins critiques
        if (query.queryKey.includes('analytics') || query.queryKey.includes('stats')) {
          return 5 * 60 * 1000; // 5 minutes
        }
        return false; // Pas de refetch automatique par défaut
      }
    },
    mutations: {
      // Retry pour les mutations importantes
      retry: 1,
      // Invalidation optimiste
      onSuccess: () => {
        // Les invalidations spécifiques sont gérées par mutation
      }
    }
  }
});

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export async function apiRequest(
  method: HttpMethod,
  endpoint: string,
  body?: unknown,
  init?: RequestInit
): Promise<Response> {
  const url = endpoint.startsWith("http") ? endpoint : API_BASE_URL + endpoint;

  try {
    const fetchOptions: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      credentials: init?.credentials ?? "include",
      ...init,
    };

    if (body !== undefined) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const errorBody = await response.text();
      logger.warn("API request failed", { url, status: response.status, error: errorBody });
      throw new Error("API " + response.status + " " + response.statusText);
    }

    return response;
  } catch (error) {
    logger.error("API request error", error as Error);
    throw error;
  }
}
