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

export const queryClient = new QueryClient();

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
