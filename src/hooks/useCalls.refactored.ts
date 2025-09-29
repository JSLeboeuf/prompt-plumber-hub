import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import { QueryMeta } from "@/types/utils.types";
import type { Call, LiveCall } from "@/shared/types";

interface UseCallsParams {
  status?: string;
  priority?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export function useCalls(params: UseCallsParams = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  const queryKey = ["/api/calls", params.toString()];
  const searchSuffix = searchParams.toString();

  return useQuery<Call[]>({
    queryKey,
    enabled: true, // Always enabled for now
    placeholderData: [],
    meta: {} as QueryMeta, // Empty object instead of undefined
    queryFn: async () => {
      const endpoint = searchSuffix ? `/api/calls?${searchSuffix}` : `/api/calls`;
      const response = await apiRequest("GET", endpoint);
      return response.data || [];
    },
  });
}

export function useLiveCalls() {
  return useQuery<LiveCall[]>({
    queryKey: ["/api/calls/live"],
    enabled: true,
    placeholderData: [],
    refetchInterval: 5000,
    meta: {} as QueryMeta,
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/calls/live");
      return response.data || [];
    },
  });
}

export function useCallDetails(callId?: string) {
  return useQuery<Call>({
    queryKey: ["/api/calls", callId],
    enabled: Boolean(callId),
    meta: {} as QueryMeta,
    queryFn: async () => {
      if (!callId) throw new Error("Call ID is required");
      const response = await apiRequest("GET", `/api/calls/${callId}`);
      return response.data;
    },
  });
}