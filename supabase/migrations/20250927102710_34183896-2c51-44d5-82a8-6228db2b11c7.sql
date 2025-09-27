-- ================================================
-- PHASE 1: MIGRATION DES TABLES ESSENTIELLES MANQUANTES (CORRIGÉE)
-- ================================================

-- Séquence pour les numéros de tickets (DOIT ÊTRE CRÉÉE EN PREMIER)
CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 1000;

-- Table interventions pour le module Interventions
CREATE TABLE public.interventions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES public.clients(id),
  client_name TEXT NOT NULL,
  client_phone TEXT,
  address TEXT NOT NULL,
  city TEXT,
  postal_code TEXT,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  estimated_duration INTEGER, -- en minutes
  estimated_price DECIMAL(10,2),
  actual_price DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled', 'invoiced')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  service_type TEXT NOT NULL,
  assigned_technician TEXT,
  notes TEXT,
  equipment_needed TEXT[],
  photos TEXT[], -- URLs des photos
  completion_notes TEXT,
  customer_signature TEXT, -- URL de la signature
  invoice_sent_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Table support_tickets pour le module Support
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number TEXT NOT NULL UNIQUE DEFAULT 'SUP-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(nextval('ticket_number_seq')::TEXT, 6, '0'),
  client_id UUID REFERENCES public.clients(id),
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_email TEXT,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'technical', 'billing', 'urgent', 'feedback')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'pending', 'resolved', 'closed')),
  assigned_to TEXT,
  resolution TEXT,
  satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Table audit_logs pour la conformité et traçabilité
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID, -- peut être null pour les actions système
  user_email TEXT,
  action TEXT NOT NULL, -- CREATE, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT, etc.
  resource_type TEXT NOT NULL, -- clients, interventions, tickets, etc.
  resource_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Table user_roles pour la sécurité RBAC
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'technician', 'agent', 'client');

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  role public.app_role NOT NULL DEFAULT 'client',
  permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE(user_id, role)
);

-- Table faq_items pour le support
CREATE TABLE public.faq_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  order_index INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Table planning pour la gestion des créneaux
CREATE TABLE public.planning (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  technician_id TEXT NOT NULL,
  technician_name TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  intervention_id UUID REFERENCES public.interventions(id),
  break_type TEXT, -- lunch, break, travel, etc.
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table gdpr_requests pour la conformité RGPD
CREATE TABLE public.gdpr_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  email TEXT NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('access', 'portability', 'rectification', 'erasure', 'restriction')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
  requested_data TEXT[],
  justification TEXT,
  response TEXT,
  processed_by UUID,
  processed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ================================================
-- INDEX POUR PERFORMANCES
-- ================================================

-- Index pour interventions
CREATE INDEX idx_interventions_status ON public.interventions(status);
CREATE INDEX idx_interventions_date ON public.interventions(scheduled_date);
CREATE INDEX idx_interventions_client ON public.interventions(client_id);
CREATE INDEX idx_interventions_technician ON public.interventions(assigned_technician);

-- Index pour support_tickets
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON public.support_tickets(priority);
CREATE INDEX idx_support_tickets_client ON public.support_tickets(client_id);
CREATE INDEX idx_support_tickets_assigned ON public.support_tickets(assigned_to);

-- Index pour audit_logs
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs(timestamp);

-- Index pour user_roles
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- Index pour FAQ
CREATE INDEX idx_faq_category ON public.faq_items(category);
CREATE INDEX idx_faq_published ON public.faq_items(is_published);

-- Index pour planning
CREATE INDEX idx_planning_technician_date ON public.planning(technician_id, date);
CREATE INDEX idx_planning_date ON public.planning(date);
CREATE INDEX idx_planning_intervention ON public.planning(intervention_id);

-- Index pour GDPR requests
CREATE INDEX idx_gdpr_requests_user ON public.gdpr_requests(user_id);
CREATE INDEX idx_gdpr_requests_status ON public.gdpr_requests(status);
CREATE INDEX idx_gdpr_requests_type ON public.gdpr_requests(request_type);

-- ================================================
-- TRIGGERS POUR UPDATED_AT
-- ================================================

CREATE TRIGGER update_interventions_updated_at
  BEFORE UPDATE ON public.interventions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faq_items_updated_at
  BEFORE UPDATE ON public.faq_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_planning_updated_at
  BEFORE UPDATE ON public.planning
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gdpr_requests_updated_at
  BEFORE UPDATE ON public.gdpr_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ================================================
-- FONCTIONS DE SÉCURITÉ POUR RBAC
-- ================================================

-- Fonction pour vérifier les rôles (évite la récursion RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- Fonction pour logger les actions d'audit
CREATE OR REPLACE FUNCTION public.log_audit_action(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO public.audit_logs (
    user_ID,
    user_email,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values,
    metadata
  )
  VALUES (
    p_user_id,
    COALESCE((SELECT email FROM auth.users WHERE id = p_user_id), 'system'),
    p_action,
    p_resource_type,
    p_resource_id,
    p_old_values,
    p_new_values,
    p_metadata
  )
  RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$;