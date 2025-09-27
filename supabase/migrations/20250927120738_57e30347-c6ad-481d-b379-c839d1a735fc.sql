-- Reset password for test user to a known value
-- Note: This should only be done in development/testing environments
UPDATE auth.users 
SET encrypted_password = crypt('Test1234!', gen_salt('bf'))
WHERE email = 'contact@autoscaleai.ca';