export interface EmergencyCall {
  id: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled' | string;
  priority: 'P1' | 'P2' | 'P3' | 'normal' | string;
  duration?: number;
  created_at: string;
  call_id?: string;
  customer_name?: string;
  phone_number?: string;
  metadata?: any;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'lead' | string;
}

export const useEmergencyCalls = (): {
  calls: EmergencyCall[];
  loading: boolean;
  error: string | null;
  fetchCalls: () => Promise<void>;
  createCall: (payload?: any) => Promise<void>;
  updateCall: (id: string, updates?: any) => Promise<void>;
} => {
  return {
    calls: [],
    loading: false,
    error: null,
    fetchCalls: async () => {},
    createCall: async () => {},
    updateCall: async () => {}
  };
};

export const useClients = (): {
  clients: Client[];
  loading: boolean;
  error: string | null;
  fetchClients: () => Promise<void>;
} => {
  return {
    clients: [],
    loading: false,
    error: null,
    fetchClients: async () => {}
  };
};

export const useProductionData = () => ({
  clients: [] as Client[],
  calls: [] as EmergencyCall[],
  interventions: [] as any[],
  loading: false,
  error: null
});

export const useAnalyticsData = () => ({
  data: null as any,
  loading: false,
  error: null
});

export const useClientsData = () => ({
  data: [] as Client[],
  loading: false,
  error: null
});