-- Migration v2: Seed categories and keywords from SommaireDepense.csv

-- Clear existing data (FK order: keywords -> categories)
DELETE FROM keywords;
UPDATE transactions SET category_id = NULL;
DELETE FROM categories;

-- ==========================================
-- Parent categories (Regroupement level)
-- ==========================================
INSERT INTO categories (id, name, type, sort_order) VALUES (1, 'Revenus', 'income', 1);
INSERT INTO categories (id, name, type, sort_order) VALUES (2, 'Dépenses récurrentes', 'expense', 2);
INSERT INTO categories (id, name, type, sort_order) VALUES (3, 'Dépenses ponctuelles', 'expense', 3);
INSERT INTO categories (id, name, type, sort_order) VALUES (4, 'Maison', 'expense', 4);
INSERT INTO categories (id, name, type, sort_order) VALUES (5, 'Placements', 'transfer', 5);
INSERT INTO categories (id, name, type, sort_order) VALUES (6, 'Autres', 'expense', 6);

-- ==========================================
-- Child categories
-- ==========================================

-- Revenus children
INSERT INTO categories (id, name, parent_id, type, color, sort_order) VALUES (10, 'Paie', 1, 'income', '#22c55e', 1);
INSERT INTO categories (id, name, parent_id, type, color, sort_order) VALUES (11, 'Autres revenus', 1, 'income', '#4ade80', 2);

-- Dépenses récurrentes children
INSERT INTO categories (id, name, parent_id, type, color, sort_order) VALUES (20, 'Loyer', 2, 'expense', '#ef4444', 1);
INSERT INTO categories (id, name, parent_id, type, color, sort_order) VALUES (21, 'Électricité', 2, 'expense', '#f59e0b', 2);
INSERT INTO categories (id, name, parent_id, type, color, sort_order) VALUES (22, 'Épicerie', 2, 'expense', '#10b981', 3);
INSERT INTO categories (id, name, parent_id, type, color, sort_order) VALUES (23, 'Dons', 2, 'expense', '#ec4899', 4);
INSERT INTO categories (id, name, parent_id, type, color, sort_order) VALUES (24, 'Restaurant', 2, 'expense', '#f97316', 5);
INSERT INTO categories (id, name, parent_id, type, color, sort_order) VALUES (25, 'Frais bancaires', 2, 'expense', '#6b7280', 6);
INSERT INTO categories (id, name, parent_id, type, color, sort_order) VALUES (26, 'Jeux, Films & Livres', 2, 'expense', '#8b5cf6', 7);
INSERT INTO categories (id, name, parent_id, type, color, sort_order) VALUES (27, 'Abonnements Musique', 2, 'expense', '#06b6d4', 8);
INSERT INTO categories (id, name, parent_id, type, color, sort_order) VALUES (28, 'Transport en commun', 2, 'expense', '#3b82f6', 9);
INSERT INTO categories (id, name, parent_id, type, color, sort_order) VALUES (29, 'Internet & Télécom', 2, 'expense', '#6366f1', 10);
INSERT INTO categories (id, name, parent_id, type, color, sort_order) VALUES (30, 'Animaux', 2, 'expense', '#a855f7', 11);
INSERT INTO categories (id, name, parent_id, type, color, sort_order) VALUES (31, 'Assurances', 2, 'expense', '#14b8a6', 12);
INSERT INTO categories (id, name, parent_id, type, color, sort_order) VALUES (32, 'Pharmacie', 2, 'expense', '#f43f5e', 13);
INSERT INTO categories (id, name, parent_id, type, color, sort_order) VALUES (33, 'Taxes municipales', 2, 'expense', '#78716c', 14);

-- Dépenses ponctuelles children
INSERT INTO categories (id, name, parent_id, type, color, sort_order) VALUES (40, 'Voiture', 3, 'expense', '#64748b', 1);
INSERT INTO categories (id, name, parent_id, type, color, sort_order) VALUES (41, 'Amazon', 3, 'expense', '#f59e0b', 2);
INSERT INTO categories (id, name, parent_id, type, color, sort_order) VALUES (42, 'Électroniques', 3, 'expense', '#3b82f6', 3);
INSERT INTO categories (id, name, parent_id, type, color, sort_order) VALUES (43, 'Alcool', 3, 'expense', '#7c3aed', 4);
INSERT INTO categories (id, name, parent_id, type, color, sort_order) VALUES (44, 'Cadeaux', 3, 'expense', '#ec4899', 5);
INSERT INTO categories (id, name, parent_id, type, color, sort_order) VALUES (45, 'Vêtements', 3, 'expense', '#d946ef', 6);
INSERT INTO categories (id, name, parent_id, type, color, sort_order) VALUES (46, 'CPA', 3, 'expense', '#0ea5e9', 7);
INSERT INTO categories (id, name, parent_id, type, color, sort_order) VALUES (47, 'Voyage', 3, 'expense', '#f97316', 8);
INSERT INTO categories (id, name, parent_id, type, color, sort_order) VALUES (48, 'Sports & Plein air', 3, 'expense', '#22c55e', 9);
INSERT INTO categories (id, name, parent_id, type, color, sort_order) VALUES (49, 'Spectacles & sorties', 3, 'expense', '#e11d48', 10);

-- Maison children
INSERT INTO categories (id, name, parent_id, type, color, sort_order) VALUES (50, 'Hypothèque', 4, 'expense', '#dc2626', 1);
INSERT INTO categories (id, name, parent_id, type, color, sort_order) VALUES (51, 'Achats maison', 4, 'expense', '#ea580c', 2);
INSERT INTO categories (id, name, parent_id, type, color, sort_order) VALUES (52, 'Entretien maison', 4, 'expense', '#ca8a04', 3);
INSERT INTO categories (id, name, parent_id, type, color, sort_order) VALUES (53, 'Électroménagers & Meubles', 4, 'expense', '#0d9488', 4);
INSERT INTO categories (id, name, parent_id, type, color, sort_order) VALUES (54, 'Outils', 4, 'expense', '#b45309', 5);

-- Placements children
INSERT INTO categories (id, name, parent_id, type, color, sort_order) VALUES (60, 'Placements', 5, 'transfer', '#2563eb', 1);
INSERT INTO categories (id, name, parent_id, type, color, sort_order) VALUES (61, 'Transferts', 5, 'transfer', '#7c3aed', 2);

-- Autres children
INSERT INTO categories (id, name, parent_id, type, color, sort_order) VALUES (70, 'Impôts', 6, 'expense', '#dc2626', 1);
INSERT INTO categories (id, name, parent_id, type, color, sort_order) VALUES (71, 'Paiement CC', 6, 'transfer', '#6b7280', 2);
INSERT INTO categories (id, name, parent_id, type, color, sort_order) VALUES (72, 'Retrait cash', 6, 'expense', '#57534e', 3);
INSERT INTO categories (id, name, parent_id, type, color, sort_order) VALUES (73, 'Projets', 6, 'expense', '#0ea5e9', 4);

-- ==========================================
-- Keywords
-- ==========================================

-- Paie (10)
INSERT INTO keywords (keyword, category_id) VALUES ('PAY/PAY', 10);

-- Électricité (21)
INSERT INTO keywords (keyword, category_id) VALUES ('HYDRO-QUEBEC', 21);

-- Épicerie (22)
INSERT INTO keywords (keyword, category_id) VALUES ('METRO', 22);
INSERT INTO keywords (keyword, category_id) VALUES ('IGA', 22);
INSERT INTO keywords (keyword, category_id) VALUES ('MAXI', 22);
INSERT INTO keywords (keyword, category_id) VALUES ('SUPER C', 22);
INSERT INTO keywords (keyword, category_id) VALUES ('BOUCHERIE LAFLECHE', 22);
INSERT INTO keywords (keyword, category_id) VALUES ('BOULANGERIE JARRY', 22);
INSERT INTO keywords (keyword, category_id) VALUES ('DOLLARAMA', 22);
INSERT INTO keywords (keyword, category_id) VALUES ('WALMART', 22);

-- Dons (23)
INSERT INTO keywords (keyword, category_id) VALUES ('OXFAM', 23);
INSERT INTO keywords (keyword, category_id) VALUES ('CENTRAIDE', 23);
INSERT INTO keywords (keyword, category_id) VALUES ('FPA', 23);

-- Restaurant (24)
INSERT INTO keywords (keyword, category_id) VALUES ('SUBWAY', 24);
INSERT INTO keywords (keyword, category_id) VALUES ('MCDONALD', 24);
INSERT INTO keywords (keyword, category_id) VALUES ('A&W', 24);
INSERT INTO keywords (keyword, category_id) VALUES ('DD/DOORDASH', 24);
INSERT INTO keywords (keyword, category_id) VALUES ('DOORDASH', 24);
INSERT INTO keywords (keyword, category_id) VALUES ('SUSHI', 24);
INSERT INTO keywords (keyword, category_id) VALUES ('DOMINOS', 24);
INSERT INTO keywords (keyword, category_id) VALUES ('BELLE PROVINCE', 24);

-- Frais bancaires (25)
INSERT INTO keywords (keyword, category_id) VALUES ('PROGRAMME PERFORMANCE', 25);

-- Jeux, Films & Livres (26)
INSERT INTO keywords (keyword, category_id) VALUES ('STEAMGAMES', 26);
INSERT INTO keywords (keyword, category_id) VALUES ('PLAYSTATION', 26);
INSERT INTO keywords (keyword, category_id) VALUES ('PRIMEVIDEO', 26);
INSERT INTO keywords (keyword, category_id) VALUES ('NINTENDO', 26);
INSERT INTO keywords (keyword, category_id) VALUES ('RENAUD-BRAY', 26);
INSERT INTO keywords (keyword, category_id) VALUES ('CINEMA DU PARC', 26);
INSERT INTO keywords (keyword, category_id) VALUES ('LEGO', 26);

-- Abonnements Musique (27)
INSERT INTO keywords (keyword, category_id) VALUES ('SPOTIFY', 27);

-- Transport en commun (28)
INSERT INTO keywords (keyword, category_id) VALUES ('STM', 28);
INSERT INTO keywords (keyword, category_id) VALUES ('GARE MONT-SAINT', 28);
INSERT INTO keywords (keyword, category_id) VALUES ('GARE SAINT-HUBERT', 28);
INSERT INTO keywords (keyword, category_id) VALUES ('GARE CENTRALE', 28);
INSERT INTO keywords (keyword, category_id) VALUES ('REM', 28);

-- Internet & Télécom (29)
INSERT INTO keywords (keyword, category_id) VALUES ('VIDEOTRON', 29);
INSERT INTO keywords (keyword, category_id) VALUES ('ORICOM', 29);

-- Animaux (30)
INSERT INTO keywords (keyword, category_id) VALUES ('MONDOU', 30);

-- Assurances (31)
INSERT INTO keywords (keyword, category_id) VALUES ('BELAIR', 31);
INSERT INTO keywords (keyword, category_id) VALUES ('PRYSM', 31);
INSERT INTO keywords (keyword, category_id) VALUES ('INS/ASS', 31);

-- Pharmacie (32)
INSERT INTO keywords (keyword, category_id) VALUES ('JEAN COUTU', 32);
INSERT INTO keywords (keyword, category_id) VALUES ('FAMILIPRIX', 32);
INSERT INTO keywords (keyword, category_id) VALUES ('PHARMAPRIX', 32);

-- Taxes municipales (33)
INSERT INTO keywords (keyword, category_id) VALUES ('M-ST-HILAIRE TX', 33);
INSERT INTO keywords (keyword, category_id) VALUES ('CSS PATRIOT', 33);

-- Voiture (40)
INSERT INTO keywords (keyword, category_id) VALUES ('SHELL', 40);
INSERT INTO keywords (keyword, category_id) VALUES ('ESSO', 40);
INSERT INTO keywords (keyword, category_id) VALUES ('ULTRAMAR', 40);
INSERT INTO keywords (keyword, category_id) VALUES ('PETRO-CANADA', 40);
INSERT INTO keywords (keyword, category_id) VALUES ('SAAQ', 40);
INSERT INTO keywords (keyword, category_id) VALUES ('CREVIER', 40);

-- Amazon (41)
INSERT INTO keywords (keyword, category_id) VALUES ('AMAZON', 41);
INSERT INTO keywords (keyword, category_id) VALUES ('AMZN', 41);

-- Électroniques (42)
INSERT INTO keywords (keyword, category_id) VALUES ('MICROSOFT', 42);
INSERT INTO keywords (keyword, category_id) VALUES ('ADDISON ELECTRONIQUE', 42);

-- Alcool (43)
INSERT INTO keywords (keyword, category_id) VALUES ('SAQ', 43);
INSERT INTO keywords (keyword, category_id) VALUES ('SQDC', 43);

-- Cadeaux (44)
INSERT INTO keywords (keyword, category_id) VALUES ('DANS UN JARDIN', 44);

-- Vêtements (45)
INSERT INTO keywords (keyword, category_id) VALUES ('UNIQLO', 45);
INSERT INTO keywords (keyword, category_id) VALUES ('WINNERS', 45);
INSERT INTO keywords (keyword, category_id) VALUES ('SIMONS', 45);

-- CPA (46)
INSERT INTO keywords (keyword, category_id) VALUES ('ORDRE DES COMPTABL', 46);

-- Voyage (47)
INSERT INTO keywords (keyword, category_id) VALUES ('NORWEGIAN CRUISE', 47);
INSERT INTO keywords (keyword, category_id) VALUES ('AEROPORTS DE MONTREAL', 47);
INSERT INTO keywords (keyword, category_id) VALUES ('HILTON', 47);

-- Sports & Plein air (48)
INSERT INTO keywords (keyword, category_id) VALUES ('BLOC SHOP', 48);
INSERT INTO keywords (keyword, category_id) VALUES ('SEPAQ', 48);
INSERT INTO keywords (keyword, category_id) VALUES ('LA CORDEE', 48);
INSERT INTO keywords (keyword, category_id) VALUES ('MOUNTAIN EQUIPMENT', 48);
INSERT INTO keywords (keyword, category_id) VALUES ('PHYSIOACTIF', 48);
INSERT INTO keywords (keyword, category_id) VALUES ('DECATHLON', 48);

-- Spectacles & sorties (49)
INSERT INTO keywords (keyword, category_id) VALUES ('TICKETMASTER', 49);
INSERT INTO keywords (keyword, category_id) VALUES ('CLUB SODA', 49);
INSERT INTO keywords (keyword, category_id) VALUES ('LEPOINTDEVENTE', 49);

-- Hypothèque (50)
INSERT INTO keywords (keyword, category_id) VALUES ('MTG/HYP', 50);

-- Achats maison (51)
INSERT INTO keywords (keyword, category_id) VALUES ('CANADIAN TIRE', 51);
INSERT INTO keywords (keyword, category_id) VALUES ('CANAC', 51);
INSERT INTO keywords (keyword, category_id) VALUES ('RONA', 51);

-- Entretien maison (52)
INSERT INTO keywords (keyword, category_id) VALUES ('IKEA', 52);

-- Électroménagers & Meubles (53)
INSERT INTO keywords (keyword, category_id) VALUES ('TANGUAY', 53);
INSERT INTO keywords (keyword, category_id) VALUES ('BOUCLAIR', 53);

-- Outils (54)
INSERT INTO keywords (keyword, category_id) VALUES ('BMR', 54);
INSERT INTO keywords (keyword, category_id) VALUES ('HOME DEPOT', 54);
INSERT INTO keywords (keyword, category_id) VALUES ('PRINCESS AUTO', 54);

-- Placements (60)
INSERT INTO keywords (keyword, category_id) VALUES ('DYNAMIC FUND', 60);
INSERT INTO keywords (keyword, category_id) VALUES ('FIDELITY', 60);
INSERT INTO keywords (keyword, category_id) VALUES ('AGF', 60);

-- Transferts (61)
INSERT INTO keywords (keyword, category_id) VALUES ('WS INVESTMENTS', 61);
INSERT INTO keywords (keyword, category_id) VALUES ('PEAK INVESTMENT', 61);

-- Impôts (70)
INSERT INTO keywords (keyword, category_id) VALUES ('GOUV. QUEBEC', 70);

-- Projets (73)
INSERT INTO keywords (keyword, category_id) VALUES ('CLAUDE.AI', 73);
INSERT INTO keywords (keyword, category_id) VALUES ('NAME-CHEAP', 73);
