// Placeholder supabase services
export const supabaseServices = {
  initialized: false,
  getRecentCalls: async (_limit?: number) => [] as any[],
  getLeads: async (_options?: any) => [] as any[],
  getSMSLogs: async (_limit?: number) => [] as any[],
  subscribeToSMSLogs: (_callback: any) => ({ unsubscribe: () => {} }),
  unsubscribeFromTable: (_subscription: any) => {},
  getDashboardMetrics: async () => ({}),
  subscribeToNewCalls: (_callback: any) => ({ unsubscribe: () => {} })
};