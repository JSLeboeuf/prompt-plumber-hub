export const useUltraFastDashboard = () => ({
  stats: {
    totalClients: 0,
    totalCalls: 0,
    totalInterventions: 0,
    activeClients: 0
  },
  metrics: {
    totalCalls: 100,
    activeCalls: 10,
    activeClients: 50,
    successRate: 95
  },
  recentCalls: [
    {id: '1', priority: 'high', customer_name: 'Test Client', created_at: new Date().toISOString(), status: 'active'}
  ],
  urgentCalls: [
    {id: '2', status: 'pending', customer_name: 'Urgent Client', created_at: new Date().toISOString()}
  ],
  loading: false,
  error: null
})