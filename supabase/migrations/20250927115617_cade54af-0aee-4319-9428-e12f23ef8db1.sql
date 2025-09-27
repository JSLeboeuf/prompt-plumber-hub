-- Assign admin role to confirmed user
INSERT INTO public.user_roles (user_id, email, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'contact@autoscaleai.ca' LIMIT 1),
  'contact@autoscaleai.ca',
  'admin'::app_role
)
ON CONFLICT (user_id, role) DO NOTHING;