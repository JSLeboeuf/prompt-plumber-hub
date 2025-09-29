/**
 * Database types aligned with actual Supabase schema
 * These types match the real database structure
 */

export interface DatabaseAlert {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: "critical" | "high" | "medium" | "low";
  timestamp: string;
  priority?: string;
  client_name?: string;
  client_phone?: string;
  minutes_since_created?: number;
  status?: string;
  acknowledged?: boolean;
  acknowledged_at?: string | null;
  acknowledged_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  metadata?: Record<string, unknown>;
}

export interface DatabaseIntervention {
  id: string;
  title: string;
  description: string | null;
  client_name: string;
  client_phone: string | null;
  client_id: string | null;
  address: string;
  city: string | null;
  postal_code: string | null;
  service_type: string;
  priority: string;
  status: string;
  assigned_technician: string | null;
  scheduled_date: string;
  scheduled_time: string | null;
  estimated_duration: number | null;
  estimated_price: number | null;
  actual_price: number | null;
  notes: string | null;
  completion_notes: string | null;
  equipment_needed: string[] | null;
  photos: string[] | null;
  customer_signature: string | null;
  created_at: string;
  updated_at: string;
  invoice_sent_at: string | null;
  paid_at: string | null;
  metadata: Record<string, unknown> | null;
}

export interface DatabaseSMSMessage {
  id: string;
  customer_name: string;
  customer_phone: string;
  message: string;
  service_type: string;
  priority: string;
  sent_at: string;
  created_at: string;
  updated_at: string;
  recipients: Record<string, unknown>;
}

export interface DatabaseGdprRequest {
  id: string;
  email: string;
  request_type: string;
  status: string;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  processed_at: string | null;
  processed_by: string | null;
  user_id: string | null;
  justification: string | null;
  response: string | null;
  requested_data: string[] | null;
  metadata: Record<string, unknown>;
}

// UI-specific interfaces (what components expect)
export interface UIAlert extends DatabaseAlert {
  // Additional UI-only properties can go here
}

export interface UIIntervention {
  id: string;
  service_type: string;
  created_at: string;
  status?: string;
  description?: string;
  // Map from database fields for backward compatibility
  problem_description?: string;
}

export interface UISMSMessage {
  id: string;
  message: string;
  sent_at: string;
  status?: string;
  direction?: "inbound" | "outbound";
}

export interface UIGdprRequest {
  id: string;
  type: string; // Maps to request_type
  email: string;
  status: string;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  processed_at: string | null;
  processed_by: string | null;
  user_id: string | null;
  justification: string | null;
  response: string | null;
  requested_data: string[] | null;
  metadata: Record<string, unknown>;
}