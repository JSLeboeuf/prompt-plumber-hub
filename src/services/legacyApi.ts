// Placeholder legacy API
export const legacyApi = {
  initialized: false,
  getRecentCalls: async (_filters?: any) => [],
  getLeads: async (_options?: any) => [],
  getSMSLogs: async (_options?: any) => [],
  subscribeToSMSLogs: (_callback: any) => ({ unsubscribe: () => {} }),
  unsubscribeFromTable: (_subscription: any) => {},
  getDashboardMetrics: async () => ({}),
  subscribeToNewCalls: (_callback: any) => ({ unsubscribe: () => {} }),
  testConnection: async () => true
};

export default legacyApi;