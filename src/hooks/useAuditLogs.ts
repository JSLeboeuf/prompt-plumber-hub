export const useAuditLogs = () => ({
  logs: [],
  loading: false,
  error: null,
  exportLogs: () => Promise.resolve()
})