-- ================================================
-- PHASE 1B: CORRECTION DES PROBLÈMES DE SÉCURITÉ CRITIQUES
-- ================================================

-- ================================================
-- ACTIVATION RLS SUR TOUTES LES NOUVELLES TABLES
-- ================================================

ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planning ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gdpr_requests ENABLE ROW LEVEL SECURITY;

-- ================================================
-- RLS POLICIES POUR INTERVENTIONS
-- ================================================

-- Les utilisateurs authentifiés peuvent voir toutes les interventions
CREATE POLICY "Authenticated read access" 
ON public.interventions
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

-- Seuls admin/manager peuvent modifier les interventions
CREATE POLICY "Admin/Manager can manage interventions"
ON public.interventions
FOR ALL
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- Les techniciens peuvent voir et modifier leurs interventions assignées
CREATE POLICY "Technicians can access assigned interventions"
ON public.interventions
FOR ALL
USING (
  auth.role() = 'authenticated'::text AND 
  (assigned_technician = auth.email() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
);

-- Service role a accès complet
CREATE POLICY "Service role full access"
ON public.interventions
FOR ALL
USING (auth.role() = 'service_role'::text);

-- ================================================
-- RLS POLICIES POUR SUPPORT_TICKETS
-- ================================================

-- Les utilisateurs authentifiés peuvent voir tous les tickets
CREATE POLICY "Authenticated read access"
ON public.support_tickets
FOR SELECT
USING (auth.role() = 'authenticated'::text);

-- Les agents peuvent gérer les tickets qui leur sont assignés
CREATE POLICY "Agents can manage assigned tickets"
ON public.support_tickets
FOR ALL
USING (
  auth.role() = 'authenticated'::text AND
  (assigned_to = auth.email() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
);

-- Les clients peuvent créer des tickets et voir leurs propres tickets
CREATE POLICY "Clients can create and view own tickets"
ON public.support_tickets
FOR SELECT
USING (client_email = auth.email() OR auth.role() = 'authenticated'::text);

CREATE POLICY "Clients can create tickets"
ON public.support_tickets
FOR INSERT
WITH CHECK (client_email = auth.email() OR auth.role() = 'authenticated'::text);

-- Service role a accès complet
CREATE POLICY "Service role full access"
ON public.support_tickets
FOR ALL
USING (auth.role() = 'service_role'::text);

-- ================================================
-- RLS POLICIES POUR AUDIT_LOGS
-- ================================================

-- Seuls les admins peuvent lire les audit logs
CREATE POLICY "Admin read access"
ON public.audit_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Service role peut créer et lire
CREATE POLICY "Service role full access"
ON public.audit_logs
FOR ALL
USING (auth.role() = 'service_role'::text);

-- ================================================
-- RLS POLICIES POUR USER_ROLES
-- ================================================

-- Les utilisateurs peuvent voir leur propre rôle
CREATE POLICY "Users can view own role"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Seuls les admins peuvent gérer les rôles
CREATE POLICY "Admin can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Service role a accès complet
CREATE POLICY "Service role full access"
ON public.user_roles
FOR ALL
USING (auth.role() = 'service_role'::text);

-- ================================================
-- RLS POLICIES POUR FAQ_ITEMS
-- ================================================

-- Tous peuvent lire les FAQ publiées
CREATE POLICY "Public read published FAQ"
ON public.faq_items
FOR SELECT
USING (is_published = true);

-- Les authentifiés peuvent voir toutes les FAQ
CREATE POLICY "Authenticated read all FAQ"
ON public.faq_items
FOR SELECT
USING (auth.role() = 'authenticated'::text);

-- Seuls admin/manager peuvent gérer les FAQ
CREATE POLICY "Admin/Manager can manage FAQ"
ON public.faq_items
FOR ALL
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- Service role a accès complet
CREATE POLICY "Service role full access"
ON public.faq_items
FOR ALL
USING (auth.role() = 'service_role'::text);

-- ================================================
-- RLS POLICIES POUR PLANNING
-- ================================================

-- Les utilisateurs authentifiés peuvent voir le planning
CREATE POLICY "Authenticated read access"
ON public.planning
FOR SELECT
USING (auth.role() = 'authenticated'::text);

-- Les techniciens peuvent voir et modifier leur planning
CREATE POLICY "Technicians can manage own planning"
ON public.planning
FOR ALL
USING (
  auth.role() = 'authenticated'::text AND
  (technician_id = auth.uid()::text OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
);

-- Service role a accès complet
CREATE POLICY "Service role full access"
ON public.planning
FOR ALL
USING (auth.role() = 'service_role'::text);

-- ================================================
-- RLS POLICIES POUR GDPR_REQUESTS
-- ================================================

-- Les utilisateurs peuvent voir leurs propres demandes GDPR
CREATE POLICY "Users can view own GDPR requests"
ON public.gdpr_requests
FOR SELECT
USING (user_id = auth.uid() OR email = auth.email() OR public.has_role(auth.uid(), 'admin'));

-- Les utilisateurs peuvent créer leurs propres demandes GDPR
CREATE POLICY "Users can create own GDPR requests"
ON public.gdpr_requests
FOR INSERT
WITH CHECK (user_id = auth.uid() OR email = auth.email());

-- Seuls les admins peuvent traiter les demandes GDPR
CREATE POLICY "Admin can process GDPR requests"
ON public.gdpr_requests
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Service role a accès complet
CREATE POLICY "Service role full access"
ON public.gdpr_requests
FOR ALL
USING (auth.role() = 'service_role'::text);

-- ================================================
-- CORRECTION DES FONCTIONS SEARCH_PATH
-- ================================================

-- Recréer la fonction has_role avec search_path correct (déjà fait dans migration précédente)
-- Recréer la fonction log_audit_action avec search_path correct
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
SET search_path = public
AS $$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
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

-- ================================================
-- REALTIME POUR LES NOUVELLES TABLES
-- ================================================

-- Ajouter les tables au supabase_realtime pour les mises à jour temps réel
ALTER PUBLICATION supabase_realtime ADD TABLE public.interventions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.faq_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.planning;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gdpr_requests;

-- Configuration REPLICA IDENTITY pour captures complètes lors des updates
ALTER TABLE public.interventions REPLICA IDENTITY FULL;
ALTER TABLE public.support_tickets REPLICA IDENTITY FULL;
ALTER TABLE public.user_roles REPLICA IDENTITY FULL;
ALTER TABLE public.faq_items REPLICA IDENTITY FULL;
ALTER TABLE public.planning REPLICA IDENTITY FULL;
ALTER TABLE public.gdpr_requests REPLICA IDENTITY FULL;