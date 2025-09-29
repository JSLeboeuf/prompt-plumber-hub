// Placeholder CRM client service
export function calculateClientScore(_client: any): number {
  return 0;
}

// Placeholder services for CRM components
export const statsService = {
  getStats: async () => ({ 
    totalClients: 0, 
    newThisWeek: 0, 
    averageScore: 0,
    activeClients: 0,
    todayInterventions: 0,
    totalInterventions: 0,
    todaySMS: 0,
    totalSMS: 0,
    monthRevenue: 0,
    totalRevenue: 0,
    averageResponseTime: 0,
    customerSatisfaction: 0,
    p1Alerts: 0,
    p2Alerts: 0
  })
};

export const alertService = {
  getAlerts: async () => [],
  getActiveAlerts: async () => [],
  acknowledgeAlert: async (_id: string, _data?: any) => ({}),
  resolveAlert: async (_id: string, _data?: any) => ({})
};

export const interventionService = {
  getInterventions: async () => [],
  getTodayInterventions: async () => []
};

export const smsService = {
  getSMSHistory: async () => [],
  getSMSMessages: async (_options?: any) => []
};

export const realtimeService = {
  subscribe: (_callback: any) => ({ unsubscribe: () => {} }),
  subscribeToAlerts: (_callback: any) => ({ unsubscribe: () => {} }),
  subscribeToSMS: (_callback: any) => ({ unsubscribe: () => {} }),
  subscribeToInterventions: (_callback: any) => ({ unsubscribe: () => {} }),
  unsubscribe: (_subscription?: any) => {}
};

export const clientService = {
  getClients: async (_options?: any) => [],
  createClient: async (_data: any) => ({}),
  updateClient: async (_id: string, _data: any) => ({}),
  getClientHistory: async (_clientId: string, _options?: any) => ({ interventions: [], sms: [] })
};