/**
 * Model Type Definitions
 * Business entity types for the application
 */

// ============================================
// User & Authentication Types
// ============================================

export interface User {
  id: string;
  email: string;
  phone?: string;
  fullName?: string;
  avatarUrl?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  metadata?: UserMetadata;
}

export type UserRole = 'admin' | 'agent' | 'client';

export interface UserMetadata {
  lastLogin?: string;
  loginCount?: number;
  preferences?: UserPreferences;
  settings?: UserSettings;
  [key: string]: unknown;
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  timezone?: string;
  notifications?: NotificationSettings;
}

export interface UserSettings {
  twoFactorEnabled?: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  marketingConsent?: boolean;
}

export interface NotificationSettings {
  email?: boolean;
  sms?: boolean;
  push?: boolean;
  inApp?: boolean;
  frequency?: 'instant' | 'daily' | 'weekly';
}

export interface AuthSession {
  user: User;
  token: string;
  refreshToken?: string;
  expiresAt: number;
  issuedAt: number;
}

// ============================================
// Client Types
// ============================================

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  notes?: string;
  tags?: string[];
  status: ClientStatus;
  source?: ClientSource;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  lastContactedAt?: string;
  metadata?: ClientMetadata;
}

export type ClientStatus = 'active' | 'inactive' | 'prospect' | 'archived';
export type ClientSource = 'website' | 'referral' | 'cold_call' | 'advertisement' | 'other';

export interface ClientMetadata {
  customFields?: Record<string, unknown>;
  preferences?: Record<string, unknown>;
  history?: ClientHistory[];
  value?: number;
  score?: number;
}

export interface ClientHistory {
  action: string;
  timestamp: string;
  userId: string;
  details?: string;
}

// ============================================
// Call Types
// ============================================

export interface Call {
  id: string;
  phoneNumber: string;
  direction: 'inbound' | 'outbound';
  status: CallStatus;
  duration?: number;
  startTime: string;
  endTime?: string;
  recordingUrl?: string;
  transcription?: string;
  clientId?: string;
  agentId?: string;
  assistantId?: string;
  cost?: number;
  tags?: string[];
  notes?: string;
  sentiment?: CallSentiment;
  metadata?: CallMetadata;
}

export type CallStatus =
  | 'queued'
  | 'ringing'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'busy'
  | 'no_answer'
  | 'cancelled';

export type CallSentiment = 'positive' | 'neutral' | 'negative';

export interface CallMetadata {
  queueTime?: number;
  holdTime?: number;
  transferCount?: number;
  dispositionCode?: string;
  campaignId?: string;
  recordingId?: string;
  [key: string]: unknown;
}

// ============================================
// Intervention Types
// ============================================

export interface Intervention {
  id: string;
  clientId: string;
  type: InterventionType;
  status: InterventionStatus;
  priority: InterventionPriority;
  title: string;
  description: string;
  scheduledAt: string;
  completedAt?: string;
  duration?: number;
  assignedTo?: string;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  cost?: number;
  notes?: string;
  attachments?: Attachment[];
  checklist?: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
  metadata?: InterventionMetadata;
}

export type InterventionType =
  | 'urgence'
  | 'entretien'
  | 'installation'
  | 'reparation'
  | 'inspection'
  | 'consultation';

export type InterventionStatus =
  | 'planned'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rescheduled';

export type InterventionPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface InterventionMetadata {
  estimatedDuration?: number;
  actualDuration?: number;
  travelTime?: number;
  materials?: Material[];
  signature?: string;
  feedback?: InterventionFeedback;
  [key: string]: unknown;
}

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
}

export interface Material {
  id: string;
  name: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
}

export interface InterventionFeedback {
  rating?: number;
  comment?: string;
  submittedAt?: string;
}

// ============================================
// Analytics Types
// ============================================

export interface DashboardMetrics {
  totalCalls: number;
  totalClients: number;
  activeInterventions: number;
  conversionRate: number;
  averageCallDuration: number;
  customerSatisfaction: number;
  revenue: {
    current: number;
    previous: number;
    growth: number;
  };
  performance: {
    callsHandled: number;
    callsResolved: number;
    avgResponseTime: number;
    avgResolutionTime: number;
  };
}

export interface AnalyticsDataPoint {
  date: string;
  value: number;
  label?: string;
  metadata?: Record<string, unknown>;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    borderWidth?: number;
  }>;
}

// ============================================
// Support Types
// ============================================

export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category?: string;
  clientId?: string;
  assignedTo?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  messages?: TicketMessage[];
  attachments?: Attachment[];
  tags?: string[];
}

export type TicketStatus =
  | 'open'
  | 'pending'
  | 'in_progress'
  | 'resolved'
  | 'closed'
  | 'cancelled';

export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

export interface TicketMessage {
  id: string;
  ticketId: string;
  userId: string;
  message: string;
  isInternal?: boolean;
  createdAt: string;
  attachments?: Attachment[];
}

// ============================================
// Common Types
// ============================================

export interface Attachment {
  id: string;
  filename: string;
  mimetype: string;
  size: number;
  url: string;
  uploadedAt: string;
  uploadedBy?: string;
}

export interface ServiceHistory {
  id: string;
  serviceType: string;
  date: string;
  description: string;
  cost?: number;
  technician?: string;
  rating?: number;
  notes?: string;
}

export interface Address {
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  formatted?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface TimeRange {
  start: string | Date;
  end: string | Date;
}

export interface DateFilter {
  from?: string | Date;
  to?: string | Date;
  preset?: 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'custom';
}

// ============================================
// Type Guards
// ============================================

export function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'email' in obj &&
    'role' in obj
  );
}

export function isClient(obj: unknown): obj is Client {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    'email' in obj &&
    'phone' in obj
  );
}

export function isCall(obj: unknown): obj is Call {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'phoneNumber' in obj &&
    'direction' in obj &&
    'status' in obj
  );
}

export function isIntervention(obj: unknown): obj is Intervention {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'clientId' in obj &&
    'type' in obj &&
    'status' in obj
  );
}