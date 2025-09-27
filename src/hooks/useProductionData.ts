export const useProductionData = () => ({
  clients: [],
  calls: [],
  interventions: [],
  loading: false,
  error: null
})

export const useAnalyticsData = () => ({
  data: null,
  loading: false,
  error: null
})

export const useClientsData = () => ({
  data: [],
  loading: false,
  error: null
})

export const useEmergencyCalls = () => ({
  data: [],
  calls: [],
  loading: false,
  error: null,
  fetchCalls: () => Promise.resolve(),
  createCall: () => Promise.resolve(),
  updateCall: () => Promise.resolve()
})

export const useClients = () => ({
  data: [],
  clients: [],
  loading: false,
  error: null,
  fetchClients: () => Promise.resolve()
})

export interface EmergencyCall {
  id: string
  type: string
  status: string
  created_at: string
}

export interface Client {
  id: string
  name: string
  email: string
  phone: string
  status: string
}