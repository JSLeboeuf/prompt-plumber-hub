-- Création d'un rôle admin pour l'utilisateur existant
INSERT INTO public.user_roles (user_id, email, role)
VALUES (
  'e310aad4-61b6-4841-ab9f-0be75a716486',
  'test@audit.com', 
  'admin'
) ON CONFLICT (user_id, role) DO NOTHING;

-- Ajout de permissions complètes pour les admins
UPDATE public.user_roles 
SET permissions = ARRAY['*'] 
WHERE role = 'admin';