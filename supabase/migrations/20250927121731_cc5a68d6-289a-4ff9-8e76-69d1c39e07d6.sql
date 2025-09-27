-- SEED DATA PRODUCTION - Données réalistes pour démonstration (corrigé)

-- 1. Seed Clients (données entreprises de drainage)
INSERT INTO public.clients (name, email, phone, address, status, service_history, tags, notes) VALUES
('Résidence Bellevue', 'admin@bellevue.ca', '514-555-0101', '1234 Rue Sherbrooke, Montréal, QC H3A 1G1', 'active', '[{"date":"2024-11-15","service":"débouchage","price":250}]', '{"VIP","récurrent"}', 'Client fidèle depuis 2019, intervention préventive recommandée'),
('Copropriété Les Jardins', 'maintenance@jardins.qc.ca', '450-555-0202', '5678 Boul. Saint-Martin, Laval, QC H7M 1Y8', 'active', '[{"date":"2024-12-01","service":"nettoyage","price":180}]', '{"commercial","priorité"}', 'Contrat annuel, inspections trimestrielles'),
('Hôtel Château Frontenac', 'facilities@frontenac.com', '418-555-0303', '1 Rue des Carrières, Québec, QC G1R 4P5', 'active', '[{"date":"2024-10-22","service":"urgence","price":450}]', '{"commercial","24h"}', 'Service urgence 24/7 requis, facturation entreprise'),
('Maison Lambert', 'j.lambert@email.com', '514-555-0404', '987 Avenue Papineau, Montréal, QC H2K 4J5', 'active', '[]', '{"résidentiel"}', 'Nouveau client - première intervention planifiée'),
('École Primaire Saint-Joseph', 'direction@stjoseph.edu', '450-555-0505', '321 Rue de École, Longueuil, QC J4K 2X7', 'active', '[{"date":"2024-09-15","service":"préventif","price":120}]', '{"institutionnel","annuel"}', 'Contrat municipal, maintenance préventive annuelle');

-- 2. Seed Leads (prospects à convertir)  
INSERT INTO public.leads (nom, telephone, email, adresse, service, status, priorite, source, assigned_to, notes) VALUES
('Restaurant Chez Mario', '514-555-0601', 'mario@chezmario.ca', '456 Rue Saint-Denis, Montréal, QC H2X 3L3', 'débouchage-urgence', 'nouveau', 'urgent', 'phone', 'contact@autoscaleai.ca', 'Problème évacuation cuisine - demande intervention immédiate'),
('Centre Commercial Galeries', '450-555-0602', 'maintenance@galeries.com', '789 Boul. des Galeries, Anjou, QC H1M 1W9', 'contrat-annuel', 'contacted', 'normal', 'website', 'contact@autoscaleai.ca', 'Intéressé par contrat maintenance préventive'),
('Résidence Seniors Les Érables', '514-555-0603', 'gestionnaire@erables.ca', '147 Rue des Érables, Montréal, QC H4C 2K9', 'inspection', 'qualified', 'normal', 'referral', 'contact@autoscaleai.ca', 'Référé par Résidence Bellevue - inspection système');

-- 3. Seed Interventions (missions terrain)
INSERT INTO public.interventions (title, client_name, client_phone, address, city, postal_code, service_type, priority, status, description, estimated_duration, estimated_price, actual_price, scheduled_date, scheduled_time, assigned_technician, equipment_needed, notes) VALUES
('Débouchage urgence - Restaurant Mario', 'Restaurant Chez Mario', '514-555-0601', '456 Rue Saint-Denis', 'Montréal', 'H2X 3L3', 'débouchage-urgence', 'urgent', 'planned', 'Évacuation cuisine bloquée, intervention urgence requise', 120, 350.00, NULL, '2025-09-28', '09:00:00', 'Pierre Dubois', '{"équipement haute pression","caméra inspection"}', 'Accès par ruelle arrière'),
('Maintenance préventive - Hôtel Frontenac', 'Hôtel Château Frontenac', '418-555-0303', '1 Rue des Carrières', 'Québec', 'G1R 4P5', 'maintenance-préventive', 'normal', 'in_progress', 'Inspection trimestrielle système drainage principal', 180, 280.00, NULL, '2025-09-27', '14:00:00', 'Marc Tremblay', '{"caméra inspection","équipement nettoyage"}', 'Coordination avec équipe hôtel requise'),
('Installation nouveau système - École', 'École Primaire Saint-Joseph', '450-555-0505', '321 Rue de École', 'Longueuil', 'J4K 2X7', 'installation', 'normal', 'planned', 'Installation système drainage cour école après rénovation', 240, 1200.00, NULL, '2025-09-30', '08:00:00', 'Jean Fortin', '{"matériaux installation","excavatrice"}', 'Coordination avec municipalité nécessaire');

-- 4. Seed VAPI Calls (appels IA)
INSERT INTO public.vapi_calls (call_id, phone_number, customer_name, status, priority, duration, metadata, started_at, ended_at) VALUES
('vapi_call_001', '514-555-0601', 'Restaurant Chez Mario', 'completed', 'urgent', 180, '{"summary":"Urgence drainage cuisine","action":"intervention_planned","satisfaction":4}', '2025-09-27 09:15:00', '2025-09-27 09:18:00'),
('vapi_call_002', '450-555-0602', 'Centre Commercial Galeries', 'completed', 'normal', 420, '{"summary":"Demande de devis maintenance","action":"estimate_sent","satisfaction":5}', '2025-09-26 14:30:00', '2025-09-26 14:37:00'),
('vapi_call_003', '514-555-0799', 'Client Anonyme', 'active', 'normal', 0, '{"summary":"Appel en cours","action":"pending"}', '2025-09-27 12:15:00', NULL);