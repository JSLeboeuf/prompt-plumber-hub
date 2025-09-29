export interface CRMFilters {
  search?: string;
  status?: string[];
  priority?: string[];
  city?: string;
  serviceType?: string;
  technician?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  company_name?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  status?: string;
  priority_level?: string;
  last_contact_date?: string;
  total_interventions?: number;
  total_sms?: number;
  lifetime_value?: number;
}

export interface SMSMessage {
  id: string;
  client_id?: string;
  to?: string;
  message?: string;
  priority?: string;
  status?: string;
  sent_at?: string;
  delivered_at?: string;
  error_message?: string;
  client?: Pick<Client, 'first_name' | 'last_name' | 'phone'>;
}

export interface Intervention {
  id: string;
  client_id?: string;
  technician_id?: string;
  service_type?: string;
  status?: string;
  priority?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  started_at?: string;
  completed_at?: string;
  updated_at?: string;
  client_name?: string;
  final_price?: number;
  duration_minutes?: number;
  technician_notes?: string;
  client?: Pick<Client, 'first_name' | 'last_name' | 'phone' | 'address'>;
  technician?: Pick<Technician, 'first_name' | 'last_name'>;
}

export interface Technician {
  id: string;
  first_name: string;
  last_name: string;
  status?: string;
  phone?: string;
  email?: string;
  available?: boolean;
}

export interface InternalAlert {
  id: string;
  title: string;
  message?: string;
  priority: string;
  status?: string;
  created_at?: string;
  acknowledged_at?: string | null;
  resolved_at?: string | null;
  acknowledged_by?: string | null;
  resolved_by?: string | null;
}

export interface CommunicationHistory {
  id: string;
  client_id: string;
  channel: 'phone' | 'sms' | 'email' | 'chat';
  summary?: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

export interface CRMStats {
  totalClients: number;
  activeClients: number;
  totalInterventions: number;
  todayInterventions: number;
  totalSMS: number;
  todaySMS: number;
  totalRevenue: number;
  monthRevenue: number;
  activeAlerts: number;
  p1Alerts: number;
  p2Alerts: number;
  averageResponseTime: number;
  customerSatisfaction: number;
}
