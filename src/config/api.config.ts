export const config = {
  timeout: 30000,
  vapi: {
    baseUrl: 'https://api.vapi.ai',
    publicKey: 'key',
    privateKey: 'key',
    assistantId: 'assistant-id'
  },
  maps: {
    apiKey: 'key'
  }
}

export const createApiClient = () => ({
  get: (_endpoint: string, _options?: Record<string, unknown>) => Promise.resolve({ data: {}, error: null }),
  post: (_endpoint: string, _data?: Record<string, unknown>) => Promise.resolve({ data: {}, error: null }),
  put: (_endpoint: string, _data?: Record<string, unknown>) => Promise.resolve({ data: {}, error: null }),
  delete: (_endpoint: string) => Promise.resolve({ data: {}, error: null })
})

export const webhookUtils = {
  trigger: () => Promise.resolve({}),
  triggerN8nWebhook: (_webhook: string, _data: Record<string, unknown>) => Promise.resolve({})
}

export const apiClient = createApiClient()

export const API_CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 30000,
  vapi: {
    baseUrl: 'https://api.vapi.ai',
    publicKey: 'key',
    privateKey: 'key',
    assistantId: 'assistant-id'
  },
  maps: {
    apiKey: 'key',
    baseUrl: 'https://maps.googleapis.com/maps/api'
  }
}