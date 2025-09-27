-- Support data avec catégories correctes

-- Seed Support Tickets avec les bonnes catégories 
INSERT INTO public.support_tickets (client_name, client_email, client_phone, subject, description, category, priority, status, assigned_to, ticket_number) VALUES
('Jean Lambert', 'j.lambert@email.com', '514-555-0404', 'Demande de devis inspection', 'Bonjour, je souhaiterais obtenir un devis pour une inspection préventive de mon système de drainage résidentiel.', 'general', 'normal', 'open', 'contact@autoscaleai.ca', 'SUP-2025-000001'),
('Mario Rossi', 'mario@chezmario.ca', '514-555-0601', 'Suivi intervention urgence', 'Suite à intervention hier, aimerais programmer une maintenance préventive pour éviter de futurs problèmes.', 'general', 'normal', 'in_progress', 'contact@autoscaleai.ca', 'SUP-2025-000002'),
('Administration Galeries', 'maintenance@galeries.com', '450-555-0602', 'Modification contrat annuel', 'Nous souhaitons ajouter deux inspections supplémentaires à notre contrat de maintenance annuel.', 'general', 'low', 'resolved', 'contact@autoscaleai.ca', 'SUP-2025-000003');

-- Seed FAQ Items
INSERT INTO public.faq_items (question, answer, category, is_published, view_count, helpful_count, created_by) VALUES
('Combien coûte un débouchage urgence ?', 'Nos tarifs pour un débouchage urgence varient entre 150$ et 400$ selon la complexité. Devis gratuit par téléphone.', 'tarification', true, 45, 38, (SELECT id FROM auth.users WHERE email = 'contact@autoscaleai.ca')),
('Quels sont vos délais intervention ?', 'Interventions urgence : 2-4h. Interventions planifiées : 24-48h. Service 24/7 disponible pour clients prioritaires.', 'service', true, 67, 54, (SELECT id FROM auth.users WHERE email = 'contact@autoscaleai.ca')),
('Couvrez-vous toute la région de Montréal ?', 'Oui, nous desservons le Grand Montréal, Laval, Longueuil et la Rive-Sud. Frais de déplacement appliqués selon la distance.', 'zones-service', true, 32, 28, (SELECT id FROM auth.users WHERE email = 'contact@autoscaleai.ca')),
('Offrez-vous des contrats de maintenance ?', 'Oui, nos contrats annuels incluent 2-4 inspections préventives avec tarifs préférentiels pour les interventions.', 'contrats', true, 23, 19, (SELECT id FROM auth.users WHERE email = 'contact@autoscaleai.ca'));