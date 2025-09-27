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
  get: (_: string, __?: any) => Promise.resolve({ data: {}, error: null }),
  post: (_: string, __?: any) => Promise.resolve({ data: {}, error: null }),
  put: (_: string, __?: any) => Promise.resolve({ data: {}, error: null }),
  delete: (_: string) => Promise.resolve({ data: {}, error: null })
})

export const webhookUtils = {
  trigger: () => Promise.resolve({}),
  triggerN8nWebhook: (_: string, __: any) => Promise.resolve({})
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