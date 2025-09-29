// Placeholder CRM client service
export function calculateClientScore(_client: any): number {
  return 0;
}

// Placeholder services for CRM components
export const statsService = {
  getStats: async (_filters?: any) => ({ 
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
  getAlerts: async (_filters?: any) => [] as any[],
  getActiveAlerts: async (_filters?: any) => [] as any[],
  acknowledgeAlert: async (_id: string, _data?: any) => ({}),
  resolveAlert: async (_id: string, _data?: any) => ({})
};

export const interventionService = {
  getInterventions: async (_filters?: any) => [] as any[],
  getTodayInterventions: async (_filters?: any) => [] as any[]
};

export const smsService = {
  getSMSHistory: async (_options?: any) => [] as any[],
  getSMSMessages: async (_options?: any) => [] as any[]
};

export const realtimeService = {
  subscribe: (_callback: (payload: any) => void) => ({ unsubscribe: () => {} }),
  subscribeToAlerts: (_callback: (payload: any) => void) => ({ unsubscribe: () => {} }),
  subscribeToSMS: (_callback: (payload: any) => void) => ({ unsubscribe: () => {} }),
  subscribeToInterventions: (_callback: (payload: any) => void) => ({ unsubscribe: () => {} }),
  unsubscribe: (_subscription?: any) => {}
};

export const clientService = {
  getClients: async (_options?: any) => [] as any[],
  createClient: async (_data: any) => ({}),
  updateClient: async (_id: string, _data: any) => ({}),
  getClientHistory: async (_clientId: string, _options?: any) => ({ 
    interventions: [] as any[], 
    sms: [] as any[] 
  })
};