import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import logger from '@/lib/logger';
import { Call, LiveCall, CallFilters } from "@/shared/types";

const callsFlagValue = ((import.meta as unknown as { env?: Record<string, string | undefined> })?.env?.VITE_ENABLE_CALLS)
  ?? ((globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.VITE_ENABLE_CALLS);

const callsFeatureEnabled = callsFlagValue === 'true';
const callsFeatureDisabledReason = 'La fonctionnalité Appels est désactivée. Activez VITE_ENABLE_CALLS lorsqu\'un backend /api/calls est disponible.';

export function useCalls(filters?: CallFilters) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
  }

  const queryKey = ["/api/calls", params.toString()];
  const searchSuffix = params.toString();

  return useQuery<Call[]>({
    queryKey,
    enabled: callsFeatureEnabled,
    placeholderData: [],
    meta: callsFeatureEnabled ? undefined : { disabledReason: callsFeatureDisabledReason },
    queryFn: async () => {
      const endpoint = searchSuffix ? `/api/calls?${searchSuffix}` : `/api/calls`;
      const response = await apiRequest("GET", endpoint);
      return response.json();
    },
  });
}

export function useActiveCalls() {
  return useQuery<LiveCall[]>({
    queryKey: ["/api/calls/active"],
    enabled: callsFeatureEnabled,
    placeholderData: [],
    refetchInterval: callsFeatureEnabled ? 5000 : false,
    meta: callsFeatureEnabled ? undefined : { disabledReason: callsFeatureDisabledReason },
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/calls/active");
      return response.json();
    },
  });
}

export function useRecentCalls(limit?: number) {
  const queryKey = ["/api/calls/recent", limit?.toString()];

  return useQuery<Call[]>({
    queryKey,
    enabled: callsFeatureEnabled,
    placeholderData: [],
    meta: callsFeatureEnabled ? undefined : { disabledReason: callsFeatureDisabledReason },
    queryFn: async () => {
      const endpoint = limit ? `/api/calls/recent?limit=${limit}` : '/api/calls/recent';
      const response = await apiRequest("GET", endpoint);
      return response.json();
    },
  });
}

export function useCall(id: string) {
  return useQuery<Call>({
    queryKey: ["/api/calls", id],
    enabled: callsFeatureEnabled && !!id,
    meta: callsFeatureEnabled ? undefined : { disabledReason: callsFeatureDisabledReason },
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/calls/${id}`);
      return response.json();
    },
  });
}

export function useUpdateCall() {
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Call> }) => {
      if (!callsFeatureEnabled) {
        logger.warn('Call update skipped because calls feature is disabled', { id });
        return { disabled: true as const, reason: callsFeatureDisabledReason };
      }
      const res = await apiRequest("PUT", `/api/calls/${id}`, updates);
      return res.json();
    },
    onSuccess: (result) => {
      if ((result as { disabled?: boolean })?.disabled) {
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["/api/calls"] });
    },
  });
}

export function useCreateCall() {
  return useMutation({
    mutationFn: async (call: Partial<Call>) => {
      if (!callsFeatureEnabled) {
        logger.warn('Call creation skipped because calls feature is disabled');
        return { disabled: true as const, reason: callsFeatureDisabledReason };
      }
      const res = await apiRequest("POST", "/api/calls", call);
      return res.json();
    },
    onSuccess: (result) => {
      if ((result as { disabled?: boolean })?.disabled) {
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["/api/calls"] });
    },
  });
}
