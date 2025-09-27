// Minimal API config
export const config = {
  timeout: 30000
}

export const createApiClient = () => ({
  get: () => Promise.resolve({}),
  post: () => Promise.resolve({}),
  put: () => Promise.resolve({}),
  delete: () => Promise.resolve({})
})