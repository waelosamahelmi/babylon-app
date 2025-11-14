-- Migration: Populate menu from WooCommerce CSV export
-- This migration will:
-- 1. Clear existing categories and menu items
-- 2. Create new categories from CSV
-- 3. Insert all menu items from CSV

-- Start transaction
BEGIN;

-- Delete existing data (in correct order due to foreign key constraints)
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM menu_items;
DELETE FROM categories;

-- Reset sequences
ALTER SEQUENCE categories_id_seq RESTART WITH 1;
ALTER SEQUENCE menu_items_id_seq RESTART WITH 1;

-- Insert Categories (in Finnish and English)
INSERT INTO categories (name, name_en, display_order, is_active) VALUES
('Pizzat', 'Pizzas', 1, true),
('Rullat', 'Wraps', 2, true),
('Pittat', 'Pitas', 3, true),
('Kebab', 'Kebab', 4, true),
('Kana Fele', 'Chicken Fillet', 5, true),
('Kana Doner', 'Chicken Doner', 6, true),
('Falafel', 'Falafel', 7, true),
('Sisäänleivotut Kebab', 'Baked Kebab', 8, true),
('Sallatti', 'Salads', 9, true),
('Fingerfoodit', 'Finger Foods', 10, true),
('Gyrosannokset', 'Gyros', 11, true),
('Burger', 'Burgers', 12, true),
('Juomat', 'Drinks', 13, true),
('Baklava', 'Baklava', 14, true);

-- Get category IDs for reference
DO $$
DECLARE
    cat_pizzat_id INT;
    cat_rullat_id INT;
    cat_pittat_id INT;
    cat_kebab_id INT;
    cat_kana_fele_id INT;
    cat_kana_doner_id INT;
    cat_falafel_id INT;
    cat_sisaanleivotut_id INT;
    cat_sallatti_id INT;
    cat_fingerfoodit_id INT;
    cat_gyros_id INT;
    cat_burger_id INT;
    cat_juomat_id INT;
    cat_baklava_id INT;
BEGIN
    -- Get category IDs
    SELECT id INTO cat_pizzat_id FROM categories WHERE name = 'Pizzat';
    SELECT id INTO cat_rullat_id FROM categories WHERE name = 'Rullat';
    SELECT id INTO cat_pittat_id FROM categories WHERE name = 'Pittat';
    SELECT id INTO cat_kebab_id FROM categories WHERE name = 'Kebab';
    SELECT id INTO cat_kana_fele_id FROM categories WHERE name = 'Kana Fele';
    SELECT id INTO cat_kana_doner_id FROM categories WHERE name = 'Kana Doner';
    SELECT id INTO cat_falafel_id FROM categories WHERE name = 'Falafel';
    SELECT id INTO cat_sisaanleivotut_id FROM categories WHERE name = 'Sisäänleivotut Kebab';
    SELECT id INTO cat_sallatti_id FROM categories WHERE name = 'Sallatti';
    SELECT id INTO cat_fingerfoodit_id FROM categories WHERE name = 'Fingerfoodit';
    SELECT id INTO cat_gyros_id FROM categories WHERE name = 'Gyrosannokset';
    SELECT id INTO cat_burger_id FROM categories WHERE name = 'Burger';
    SELECT id INTO cat_juomat_id FROM categories WHERE name = 'Juomat';
    SELECT id INTO cat_baklava_id FROM categories WHERE name = 'Baklava';

    -- Insert Pizzas (Pizzat)
    INSERT INTO menu_items (category_id, name, name_en, description, description_en, price, image_url, is_available, display_order) VALUES
    (cat_pizzat_id, 'Margherita', 'Margherita', 'Kirsikkatomaatti - Mozzarella Juusto', 'Cherry Tomato - Mozzarella Cheese', 9.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/05/5e2ac72f-8742-4681-bf79-aadc0e5b7174.webp', true, 1),
    (cat_pizzat_id, 'Bolognese', 'Bolognese', 'Jauhelihaasiko', 'Ground Beef', 9.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/c8830ac4-df4f-470e-9786-8165ee25bd60.webp', true, 2),
    (cat_pizzat_id, 'Hawaii', 'Hawaii', 'Kinkkusuikale - Ananas', 'Ham - Pineapple', 10.00, 'https://ravintolababylon.fi/wp-content/uploads/2024/05/65a32cc2-44f7-43cf-9a0e-9741238eebe4.webp', true, 3),
    (cat_pizzat_id, 'Opera', 'Opera', 'Kinkkusuikale - Tonnikala', 'Ham - Tuna', 10.00, 'https://ravintolababylon.fi/wp-content/uploads/2024/05/9c2301e0-ed98-48f7-aecb-af5d608f85b6.webp', true, 4),
    (cat_pizzat_id, 'Opera Special', 'Opera Special', 'Kinkkusuikale - Tonnikala - Salami', 'Ham - Tuna - Salami', 11.00, 'https://ravintolababylon.fi/wp-content/uploads/2024/05/008fab51-b265-4d3a-beda-617ca0dcf4e3.webp', true, 5),
    (cat_pizzat_id, 'Americano', 'Americano', 'Kinkkusuikale - Ananas - Aurajuusto', 'Ham - Pineapple - Blue Cheese', 11.00, 'https://ravintolababylon.fi/wp-content/uploads/2024/05/f4bd819b-4734-4749-bee5-f1a00445f060.webp', true, 6),
    (cat_pizzat_id, 'Vegetariana', 'Vegetariana', 'Tuoreherkkusieni - Sipuli - Oliivi - Tomaatti', 'Fresh Mushrooms - Onion - Olives - Tomato', 11.00, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/3cbc9d60-8a38-4084-a239-52529c0139a9.webp', true, 7),
    (cat_pizzat_id, 'Mexicana', 'Mexicana', 'Salami - Ananas - Kebabliha - Jalapeno', 'Salami - Pineapple - Kebab Meat - Jalapeno', 12.00, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/e5399773-0208-4e36-b0cb-653a54b2a089.webp', true, 8),
    (cat_pizzat_id, 'Paradiso', 'Paradiso', 'Kinkkusuikale - Tuoreherkkusieni - Sipuli - Kebabliha - Katkarapu', 'Ham - Mushrooms - Onion - Kebab - Shrimp', 13.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/78e516e7-dfed-4ec0-b4c2-06df6bad8ec6.webp', true, 9),
    (cat_pizzat_id, 'Frutti di Mare', 'Frutti di Mare', 'Tonnikala - Simpukka - Katkarapu', 'Tuna - Clam - Shrimp', 11.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/05/6db8b4d2-5c09-407a-bc7c-749340ee9317.webp', true, 10),
    (cat_pizzat_id, 'Dillinger', 'Dillinger', 'Kinkkusuikale - Salami - Jauheliha - Sipuli', 'Ham - Salami - Ground Beef - Onion', 12.00, 'https://ravintolababylon.fi/wp-content/uploads/2024/05/fba1dc2e-1697-4aff-bb8f-4e300e37b824.webp', true, 11),
    (cat_pizzat_id, 'Francisco', 'Francisco', 'Kinkkusuikale - Pepperonimakkara - Pekoni - Ananas', 'Ham - Pepperoni - Bacon - Pineapple', 12.00, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/bba50549-999c-4185-8a3d-e270668aa3e3.webp', true, 12),
    (cat_pizzat_id, 'Tropicana', 'Tropicana', 'Salami - Katkarapu - Jauheliha - Pekoni', 'Salami - Shrimp - Ground Beef - Bacon', 12.00, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/212.webp', true, 13),
    (cat_pizzat_id, 'Quattro Stagioni', 'Quattro Stagioni', 'Kinkkusuikale - Tonnikala - Katkarapu - Herkkusieni', 'Ham - Tuna - Shrimp - Mushrooms', 12.00, 'https://ravintolababylon.fi/wp-content/uploads/2024/05/70fa3694-62b7-4d8b-8bf1-e59fd12a0802.webp', true, 14),
    (cat_pizzat_id, 'BBQ', 'BBQ', 'Pekoni - Kana - Sipuli - Mozzarella - BBQ-kastike', 'Bacon - Chicken - Onion - Mozzarella - BBQ Sauce', 13.00, 'https://ravintolababylon.fi/wp-content/uploads/2024/05/171dfab9-2ba2-4b93-b41e-d11193b5218e.webp', true, 15),
    (cat_pizzat_id, 'Mami Pizza', 'Mami Pizza', 'Kebab - Sipuli - Majoneesi - Ranskalaiset', 'Kebab - Onion - Mayo - French Fries', 12.00, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/22121.webp', true, 16),
    (cat_pizzat_id, 'Riveria', 'Riveria', 'Kebab - Arla Juustokutio (fetajuusto) - Jalapeno - Tomaatti', 'Kebab - Feta Cheese - Jalapeno - Tomato', 12.00, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/e4ae2f20-57dd-4717-82a8-f3665ada7632.webp', true, 17),
    (cat_pizzat_id, 'Smetana Pizza', 'Smetana Pizza', 'Kebab - Sipuli - Tomaatti - Vihreä Pepperoni - Smetana', 'Kebab - Onion - Tomato - Green Pepper - Sour Cream', 12.00, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/ae449207-b216-4900-9992-52f524cbd7a4.webp', true, 18),
    (cat_pizzat_id, 'Kebab Special Pizza', 'Kebab Special Pizza', 'Kebab - Tomaatti - Sipuli - Majoneesi - TuoriPaprika', 'Kebab - Tomato - Onion - Mayo - Fresh Pepper', 12.00, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/6e6e28fc-1666-4f36-9d96-10567f80019c.webp', true, 19),
    (cat_pizzat_id, 'Venäjä', 'Russia', 'Kinkkusuikale - Salami - Kebab - Pekoni - Sipuli', 'Ham - Salami - Kebab - Bacon - Onion', 12.00, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/7632083d-190b-4745-8bc1-838623acb7b2-e1718872480185.webp', true, 20),
    (cat_pizzat_id, 'Romeo', 'Romeo', 'Salami - Tonnikala - Ananas - Katkarapu - Tuore Herkkusieni', 'Salami - Tuna - Pineapple - Shrimp - Fresh Mushrooms', 12.00, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/fe7c3aef-7e40-459c-af77-4a5a2f43ed63.webp', true, 21),
    (cat_pizzat_id, 'Suomen Pizza', 'Finland Pizza', 'Kana - Kebab - Sipuli - Pepperonimakkara - Aurajuusto', 'Chicken - Kebab - Onion - Pepperoni - Blue Cheese', 12.00, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/4eeee8d2-f45e-4e81-9165-cf1dc1c1a17a-e1718872598716.webp', true, 22),
    (cat_pizzat_id, 'Talon Pizza', 'House Pizza', 'Kebab - Kinkkusuikale - Salami - Pepperonimakkara - Pekoni', 'Kebab - Ham - Salami - Pepperoni - Bacon', 13.00, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/cc3ec71c-b0b8-476c-88e7-6cb6c5f10f7c-1.webp', true, 23),
    (cat_pizzat_id, 'Lahden Erikois', 'Lahti Special', 'Kebab - Kinkkusuikale - Salami - Ananas - Juusto cheddar', 'Kebab - Ham - Salami - Pineapple - Cheddar', 12.00, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/2fae177b-0412-454b-9bbf-b4bb680267ce.webp', true, 24),
    (cat_pizzat_id, 'Finlandia', 'Finlandia', 'Kebab - Kinkkusuikale - Pekoni - Salami', 'Kebab - Ham - Bacon - Salami', 12.00, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/cc3ec71c-b0b8-476c-88e7-6cb6c5f10f7c-1.webp', true, 25),
    (cat_pizzat_id, 'Leonardo', 'Leonardo', 'Kebab - Salami - Naudanliha - Jalapeno - Sipuli - Tomaatti', 'Kebab - Salami - Beef - Jalapeno - Onion - Tomato', 13.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/a4ad7ed1-5526-40b4-af14-b657bea91411.webp', true, 26),
    (cat_pizzat_id, 'Mirabella', 'Mirabella', 'Kebab - Jalapeno - Sipuli - Aurajuusto - Salaatti - Talon majoneesi', 'Kebab - Jalapeno - Onion - Blue Cheese - Salad - House Mayo', 13.00, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/26101885-76d3-4fda-ae4b-89e720e1d07a.webp', true, 27),
    (cat_pizzat_id, 'Julia', 'Julia', 'Kinkkusuikale - Ananas - Aura - Katkarapu', 'Ham - Pineapple - Blue Cheese - Shrimp', 13.00, 'https://ravintolababylon.fi/wp-content/uploads/2024/05/fb76ac43-25fe-4cd3-b6c6-6e4098818f4c.webp', true, 28),
    (cat_pizzat_id, 'Babylon Pizza', 'Babylon Pizza', 'Kebab - Salami - Sipuli - Pekoni - Pepperoinimakkara - Jalapeno', 'Kebab - Salami - Onion - Bacon - Pepperoni - Jalapeno', 13.00, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/c72c75c6-bf3d-4c5a-a8b4-8861ec9346c2.webp', true, 29),
    (cat_pizzat_id, 'Apashi', 'Apashi', 'Jauheliha - Kana - Jalapeno - Tacokastika', 'Ground Beef - Chicken - Jalapeno - Taco Sauce', 12.00, 'https://ravintolababylon.fi/wp-content/uploads/2024/05/90fe0c3c-10d0-4195-a925-3bad947f5a13.webp', true, 30),
    (cat_pizzat_id, 'Italiana', 'Italiana', 'Pepproimimakkara - Ananas - Kebabliha - Jalapeno', 'Pepperoni - Pineapple - Kebab - Jalapeno', 12.00, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/537b4979-7ded-4fcf-9831-8aba55aa9333.webp', true, 31),
    (cat_pizzat_id, 'Your Choice', 'Your Choice', 'Valitse täytteet', 'Choose your toppings', 0.00, 'https://ravintolababylon.fi/wp-content/uploads/2024/05/f42a2107-e00c-48a8-ba48-82ab1b90b3ff.webp', true, 32);

    -- Insert Wraps (Rullat)
    INSERT INTO menu_items (category_id, name, name_en, description, description_en, price, image_url, is_available, display_order) VALUES
    (cat_rullat_id, 'Kebab Rulla', 'Kebab Wrap', 'Kebabliha - Salaatti - Talon kastiketta', 'Kebab Meat - Salad - House Sauce', 10.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/077adf87-f675-4d27-9093-3dc66d39c799.webp', true, 1),
    (cat_rullat_id, 'Kana Rulla', 'Chicken Wrap', 'Kanafilee - Salaatti - Currykastike', 'Chicken Fillet - Salad - Curry Sauce', 11.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/54aff6ed-b563-45c2-9616-406510ba58b3.webp', true, 2),
    (cat_rullat_id, 'Kana Doner Rulla', 'Chicken Doner Wrap', 'Kanakebab - Salaatti - Kababkastiketta', 'Chicken Kebab - Salad - Kebab Sauce', 11.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/3c8174be-8bac-40d6-b9d9-8c1d83cc4f1f.webp', true, 3),
    (cat_rullat_id, 'Tonnikala Rulla', 'Tuna Wrap', 'Tonnikala - Salaatti - Suolakurkku', 'Tuna - Salad - Pickles', 12.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/28341321-caae-4087-929c-38f24a57a604.webp', true, 4),
    (cat_rullat_id, 'Falafel Rulla', 'Falafel Wrap', 'Falafel - Salaatti - Suolakurkku - Valkosipulimajoneesi', 'Falafel - Salad - Pickles - Garlic Mayo', 11.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/b654b4b2-ff9d-4c02-9033-bf61859a1818.webp', true, 5),
    (cat_rullat_id, 'Tempura Rulla', 'Tempura Wrap', 'Katkarapu Tempura - Salaatti - Kurkku - Tomaatti', 'Shrimp Tempura - Salad - Cucumber - Tomato', 15.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/2fe69bdd-128e-4ea2-86b3-8a3af00f7f3c.webp', true, 6),
    (cat_rullat_id, 'Special Kana Rulla', 'Special Chicken Wrap', 'Kanakebab - Ranskalaiset - Salaatti - Talon majoneesi', 'Chicken Kebab - Fries - Salad - House Mayo', 15.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/5d415e0e-1df6-40c9-b022-44715265cf31.webp', true, 7),
    (cat_rullat_id, 'Special Kebab Rulla', 'Special Kebab Wrap', 'Kebab - Ranskalaiset - Salaatti - Talon majoneesi', 'Kebab - Fries - Salad - House Mayo', 15.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/1b121f8e-f53a-44ec-ba49-c2ef08409a85.webp', true, 8),
    (cat_rullat_id, 'Paahdettu Rulla Kebab', 'Toasted Kebab Wrap', 'Kebab - Juusto - Aurajuusto - Salaatti - Talon majoneesi', 'Kebab - Cheese - Blue Cheese - Salad - House Mayo', 15.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/827c6787-163c-45d3-be8b-aa5a99c00a69.webp', true, 9),
    (cat_rullat_id, 'Exotik Rulla Kebab', 'Exotic Kebab Wrap', 'Cheddarjuusto - Ananas - Tuore paprika - Kebab - Salaatti - Talon majoneesi', 'Cheddar - Pineapple - Fresh Pepper - Kebab - Salad - House Mayo', 15.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/dac8f05c-eab9-43df-a1c8-368e36b55ba9.webp', true, 10);

    -- Insert Pitas (Pittat)
    INSERT INTO menu_items (category_id, name, name_en, description, description_en, price, image_url, is_available, display_order) VALUES
    (cat_pittat_id, 'Pita Kebab', 'Kebab Pita', 'Kebab - Salaatti - Talon kastike', 'Kebab - Salad - House Sauce', 10.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/cb98c330-5fce-440a-a6da-fed8d9d69009.webp', true, 1),
    (cat_pittat_id, 'Pita Kana', 'Chicken Pita', 'Kana - Salaatti - Talon kastike', 'Chicken - Salad - House Sauce', 11.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/5bd29bc6-ade2-4dff-ba8d-0674efeb8443.webp', true, 2),
    (cat_pittat_id, 'Pita Kana Doner', 'Chicken Doner Pita', 'Kanakebab - Salaatti - Talon kastike', 'Chicken Kebab - Salad - House Sauce', 11.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/22a63280-ab48-4375-b56f-3f9ab9654a50.webp', true, 3),
    (cat_pittat_id, 'Pita Falafel', 'Falafel Pita', 'Falafel - Salaatti - Valkosipulimajoneesi', 'Falafel - Salad - Garlic Mayo', 10.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/8efdfcea-e81b-44a4-889a-f2eab475e630.webp', true, 4),
    (cat_pittat_id, 'Pita Tonnikala', 'Tuna Pita', 'Tonnikala - Salaatti - Talon kastike', 'Tuna - Salad - House Sauce', 12.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/13388237-4a76-44bc-a87d-895735545dda.webp', true, 5),
    (cat_pittat_id, 'Pita Tempura', 'Tempura Pita', 'Katkarapu Tempura - Salaatti - Talon kastike', 'Shrimp Tempura - Salad - House Sauce', 13.00, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/6c0ef832-ec9a-4814-9f49-6abf0fda6d84.webp', true, 6);

    -- Insert Kebab Dishes
    INSERT INTO menu_items (category_id, name, name_en, description, description_en, price, image_url, is_available, display_order) VALUES
    (cat_kebab_id, 'Kebab - Ranskalaiset', 'Kebab with Fries', 'Valita ranskalaiset / riisi / lohko tai kermaperuna', 'Choose fries / rice / wedges or cream potatoes', 10.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/d3d18b9d-edf1-485f-9967-d4eafad3c33d.webp', true, 1),
    (cat_kebab_id, 'Pelkä Kebab', 'Kebab Only', 'Kebabliha - Salaatti', 'Kebab Meat - Salad', 9.00, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/ac6efa1e-ae6c-4387-a1a6-d3d1c28eafd5.webp', true, 2),
    (cat_kebab_id, 'Iskander Kebab', 'Iskander Kebab', 'Kebab - Leipä - Joghurtti - Tomaattikastike', 'Kebab - Bread - Yogurt - Tomato Sauce', 12.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/f2de6f13-8099-4a99-b941-fc15bf028812.webp', true, 3),
    (cat_kebab_id, 'Babylon Special Kebab', 'Babylon Special Kebab', 'Ranska ja Riisi ja Kebab', 'Fries and Rice and Kebab', 13.00, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/968ceb0d-042e-49c6-8fde-f05751a683a8.webp', true, 4),
    (cat_kebab_id, 'Hot Kebab', 'Hot Kebab', 'Ranska ja Riisi ja Hotkastike', 'Fries and Rice and Hot Sauce', 13.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/52f5abdd-d868-46e5-872a-cc994160f2b5.webp', true, 5),
    (cat_kebab_id, 'Talon Kebab', 'House Kebab', 'Valkosipuliperuna ja Riisi ja Voikastike', 'Garlic Potatoes and Rice and Butter Sauce', 13.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/0421ae56-00ff-491d-b132-039caf0f533c.webp', true, 6);

    -- Insert Chicken Fillet
    INSERT INTO menu_items (category_id, name, name_en, description, description_en, price, image_url, is_available, display_order) VALUES
    (cat_kana_fele_id, 'Kana Fele - Ranskalaiset', 'Chicken Fillet with Fries', 'Valita ranskalaiset / riisi / lohko / kermaperuna tai iskander', 'Choose fries / rice / wedges / cream potatoes or iskander', 11.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/2cacf453-3c4c-4047-abc8-d5183c67b494.webp', true, 1);

    -- Insert Chicken Doner
    INSERT INTO menu_items (category_id, name, name_en, description, description_en, price, image_url, is_available, display_order) VALUES
    (cat_kana_doner_id, 'Kana Doner - Ranskalaiset', 'Chicken Doner with Fries', 'Valita ranskalaiset / riisi / lohko / kermaperuna tai iskander', 'Choose fries / rice / wedges / cream potatoes or iskander', 12.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/a54a4c2c-7da7-4ec6-a8b8-358f97a74266.webp', true, 1);

    -- Insert Falafel
    INSERT INTO menu_items (category_id, name, name_en, description, description_en, price, image_url, is_available, display_order) VALUES
    (cat_falafel_id, 'Falafel - Ranskalaiset', 'Falafel with Fries', 'Valita ranskalaiset / riisi / lohko / kermaperuna tai iskander', 'Choose fries / rice / wedges / cream potatoes or iskander', 11.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/719c4efe-3ff7-4fac-8c1f-031f636e4359.webp', true, 1);

    -- Insert Baked Kebab (Sisäänleivotut Kebab)
    INSERT INTO menu_items (category_id, name, name_en, description, description_en, price, image_url, is_available, display_order) VALUES
    (cat_sisaanleivotut_id, 'Sisäänleivotut Kebab', 'Baked Kebab', 'Tomaatti - Sipuli - Paprika - Kebabliha - Aurajuusto - Juusto', 'Tomato - Onion - Pepper - Kebab - Blue Cheese - Cheese', 13.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/3c818604-6f5e-43a8-9000-c04a9bd268c4.webp', true, 1),
    (cat_sisaanleivotut_id, 'Sisäänleivotut Taste Ful', 'Baked Taste Ful', 'Kebabliha - Riisi - Tomaatti - Sipuli - Arla Juustokutio (fetajuusto) - Valkosipuli', 'Kebab - Rice - Tomato - Onion - Feta Cheese - Garlic', 13.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/13d41513-1349-4e62-a2bf-901183a301db.webp', true, 2),
    (cat_sisaanleivotut_id, 'Sisäänleivotut Valkosipuliperunoilla', 'Baked with Garlic Potatoes', 'Kebabliha - Valkosipuliperunat - Tomaatti - Aurajuusto - Kasika', 'Kebab - Garlic Potatoes - Tomato - Blue Cheese - Sauce', 13.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/1a5fa2fb-1de4-4405-830c-057fa8a700d6.webp', true, 3);

    -- Insert Salads (Sallatti)
    INSERT INTO menu_items (category_id, name, name_en, description, description_en, price, image_url, is_available, display_order) VALUES
    (cat_sallatti_id, 'Kebab Salaatti', 'Kebab Salad', 'Jäävuorisalaatti - Tomaatti - Kurkku - Olvi - Arla Juustokutio (fetajuusto) - Leipä', 'Iceberg - Tomato - Cucumber - Olive - Feta - Bread', 12.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/Kebab.jpg', true, 1),
    (cat_sallatti_id, 'Kana Salatti', 'Chicken Salad', 'Jäävuorisalaatti - Tomaatti - Kurkku - Olvi - Ananas - Paprika - Leipä', 'Iceberg - Tomato - Cucumber - Olive - Pineapple - Pepper - Bread', 12.50, 'https://ravintolababylon.fi/wp-content/uploads/2025/03/Kana.jpg', true, 2),
    (cat_sallatti_id, 'Tonikala Salaatti', 'Tuna Salad', 'Jäävuorisalaatti - Tomaatti - Kurkku - Olvi - Paprika - Sipuli - Leipä', 'Iceberg - Tomato - Cucumber - Olive - Pepper - Onion - Bread', 12.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/Tonnikala.jpg', true, 3),
    (cat_sallatti_id, 'Katkarapu Salaatti', 'Shrimp Salad', 'Jäävuorisalaatti - Tomaatti - Kurkku - Olvi - Paprika - Sipuli - Leipä', 'Iceberg - Tomato - Cucumber - Olive - Pepper - Onion - Bread', 12.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/Katkaraput.jpg', true, 4),
    (cat_sallatti_id, 'Feta salaatti', 'Feta Salad', 'Jäävuorisalaatti - Tomaatti - Kurkku - Olvi - Arla Juustokutio (fetajuusto) - Leipä', 'Iceberg - Tomato - Cucumber - Olive - Feta - Bread', 12.50, 'https://ravintolababylon.fi/wp-content/uploads/2025/03/feta.jpg', true, 5),
    (cat_sallatti_id, 'Kana kori salaatti', 'Chicken Basket Salad', 'Kana kori - Jäävuorisalaatti - Tomaatti - Kurkku - Olvi - Paprika - Leipä', 'Chicken Basket - Iceberg - Tomato - Cucumber - Olive - Pepper - Bread', 12.50, 'https://ravintolababylon.fi/wp-content/uploads/2025/03/kana-kori.jpg', true, 6),
    (cat_sallatti_id, 'Kana Döner salaatti', 'Chicken Doner Salad', 'Kana döner - Jäävuorisalaatti - Tomaatti - Kurkku - Olvi - Paprika - Sipuli - Leipä', 'Chicken Doner - Iceberg - Tomato - Cucumber - Olive - Pepper - Onion - Bread', 12.50, 'https://ravintolababylon.fi/wp-content/uploads/2025/03/kana-doner.jpg', true, 7),
    (cat_sallatti_id, 'Kana Filee salaatti', 'Chicken Fillet Salad', 'Kana filee - Jäävuorisalaatti - Tomaatti - Kurkku - Olvi - Paprika - Sipuli - Leipä', 'Chicken Fillet - Iceberg - Tomato - Cucumber - Olive - Pepper - Onion - Bread', 12.50, 'https://ravintolababylon.fi/wp-content/uploads/2025/03/kana-filee.jpg', true, 8),
    (cat_sallatti_id, 'Mozzarella salaatti', 'Mozzarella Salad', 'Jäävuorisalaatti - Tomaatti - Kurkku - Olvi - Mozzarella - Leipä', 'Iceberg - Tomato - Cucumber - Olive - Mozzarella - Bread', 12.50, 'https://ravintolababylon.fi/wp-content/uploads/2025/03/mozzarella.jpg', true, 9);

    -- Insert Finger Foods
    INSERT INTO menu_items (category_id, name, name_en, description, description_en, price, image_url, is_available, display_order) VALUES
    (cat_fingerfoodit_id, 'Kanakori', 'Chicken Basket', '4KPL Paneroitu Kanafilee - Ranskalaiset - Curry dippi', '4pc Breaded Chicken Fillet - Fries - Curry Dip', 12.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/4552901e-acdc-439c-bac0-0b6f89f5a927.webp', true, 1),
    (cat_fingerfoodit_id, 'Babylon Mix', 'Babylon Mix', 'Ranskalaiset - Friteerattuja Kanafileitä - Mozzarellatikkuja - Paneroituja Sipulirenkaita - Kurkkua - Talondippikastike', 'Fries - Fried Chicken - Mozzarella Sticks - Onion Rings - Cucumber - House Dip', 13.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/eed5183b-9e2b-47fb-9119-0879fd3bc11b.webp', true, 2),
    (cat_fingerfoodit_id, 'Bataattiranskalaiset Tai Ranskalaiset', 'Sweet Potato or Regular Fries', 'Bataattiranskalaiset tai ranskalaiset', 'Sweet potato or regular fries', 5.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/2.webp', true, 3),
    (cat_fingerfoodit_id, 'Sipuli Ringat', 'Onion Rings', 'Friteerattuja sipulirenkaita', 'Fried onion rings', 4.00, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/4a2c617a-7c62-4f46-8575-4216c9c1ae59.webp', true, 4),
    (cat_fingerfoodit_id, 'Kevatrullat', 'Spring Rolls', 'Friteerattuja kevätrullia', 'Fried spring rolls', 6.00, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/ad92a7bf-ddc4-412d-a811-adc92a6d90fe.webp', true, 5),
    (cat_fingerfoodit_id, 'Tampura', 'Tempura', 'Katkarapu tempura', 'Shrimp tempura', 6.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/bc7b211c-a865-432f-9196-c2a13ba5f500.webp', true, 6);

    -- Insert Gyros
    INSERT INTO menu_items (category_id, name, name_en, description, description_en, price, image_url, is_available, display_order) VALUES
    (cat_gyros_id, 'Gyros Kana', 'Chicken Gyros', 'Ranskalaiset - kasvikset tomaatti - kurkku - tuore leipä - tzatziki - Sipuli', 'Fries - Vegetables Tomato - Cucumber - Fresh Bread - Tzatziki - Onion', 11.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/ea65159d-ac24-4898-9665-69a36e037a0b.webp', true, 1),
    (cat_gyros_id, 'Gyros Kana Döner Kebab', 'Chicken Doner Gyros', 'Ranskalaiset - kasvikset tomaatti - kurkku - tuore leipä - tzatziki - Sipuli', 'Fries - Vegetables Tomato - Cucumber - Fresh Bread - Tzatziki - Onion', 12.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/d7890762-56f6-49a2-b22a-82dd4d4de329.webp', true, 2),
    (cat_gyros_id, 'Gyros Kebab', 'Kebab Gyros', 'Ranskalaiset - Kasvikset Tomaatti - Kurkku - Tuore Leipä - Tzatziki - sipuli', 'Fries - Vegetables Tomato - Cucumber - Fresh Bread - Tzatziki - Onion', 11.00, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/ed3e4372-a8b8-4e99-a1d6-ebac0de006fd.webp', true, 3),
    (cat_gyros_id, 'Gyros Falafel', 'Falafel Gyros', 'Ranskalaiset - Kasvikset Tomaatti - Kurkku - Tuore Leipä - Tzatziki - Sipuli', 'Fries - Vegetables Tomato - Cucumber - Fresh Bread - Tzatziki - Onion', 11.00, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/c3348339-36b7-4f2e-863f-c6bebc55f674.webp', true, 4);

    -- Insert Burgers
    INSERT INTO menu_items (category_id, name, name_en, description, description_en, price, image_url, is_available, display_order) VALUES
    (cat_burger_id, 'Tavallinen Hampurilainen', 'Regular Burger', '180g naudanliha - salaatti - tomaatti - suolakurkkua - grillattu sipuli', '180g beef - lettuce - tomato - pickles - grilled onion', 7.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/69407138-fccd-4524-a2b8-6438c5515c24.webp', true, 1),
    (cat_burger_id, 'Juustohampurilainen', 'Cheese Burger', '180g naudanliha - salaatti - tomaatti - suolakurkkua - Juusto cheddar - grillattu sipuli', '180g beef - lettuce - tomato - pickles - Cheddar - grilled onion', 8.00, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/45bb6353-9203-464e-b733-8f85335da356.webp', true, 2),
    (cat_burger_id, 'BBQ Hampurilainen', 'BBQ Burger', '180g naudanliha - salaatti - tomaatti - suolakurkkua - Juusto cheddar - BBQ - 2kpl sipuli Ringat - pekoni - grillattu sipuli', '180g beef - lettuce - tomato - pickles - Cheddar - BBQ - 2pc onion rings - bacon - grilled onion', 9.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/32.webp', true, 3),
    (cat_burger_id, 'Magnumhampurilainen', 'Magnum Burger', '2kpl 180g naudanliha - salaatti - tomaatti - 2kpl Juusto cheddar - grillattu sipuli', '2pc 180g beef - lettuce - tomato - 2pc Cheddar - grilled onion', 10.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/6eb4aae2-dd62-4154-aa02-fe62405f9bfa.webp', true, 4),
    (cat_burger_id, 'Kanahampurilainen', 'Chicken Burger', 'Krispy chicken - grillattu ananas - carry sauce - Juusto cheddar - grillattu sipuli', 'Crispy chicken - grilled pineapple - curry sauce - Cheddar - grilled onion', 7.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/b7212541-99a1-44c7-b250-241a95f94a16.webp', true, 5),
    (cat_burger_id, 'Kebab Hampurilainen', 'Kebab Burger', 'Kebab - salaatti - tomaatti - sipuli - majoneesi', 'Kebab - lettuce - tomato - onion - mayo', 7.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/61acb02e-ff36-4194-b569-1b0fefba9013.webp', true, 6),
    (cat_burger_id, 'Kana Döner Hampurilainen', 'Chicken Doner Burger', 'Kana döner - salaatti - tomaatti - sipuli - majoneesi', 'Chicken doner - lettuce - tomato - onion - mayo', 7.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/01372ce1-1d94-489a-822a-3212a6948244.webp', true, 7);

    -- Insert Drinks
    INSERT INTO menu_items (category_id, name, name_en, description, description_en, price, image_url, is_available, display_order) VALUES
    (cat_juomat_id, 'Coca-Cola 0.33L', 'Coca-Cola 0.33L', 'Coca-Cola 0.33L', 'Coca-Cola 0.33L', 2.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/Cocacola.jpg', true, 1),
    (cat_juomat_id, 'Coca Cola Zero 0.33L', 'Coca Cola Zero 0.33L', 'Coca Cola Zero 0.33L', 'Coca Cola Zero 0.33L', 2.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/Cocacola2.jpg', true, 2),
    (cat_juomat_id, 'Jaffa 0.33L', 'Jaffa 0.33L', 'Jaffa 0.33L', 'Jaffa 0.33L', 2.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/b654b4b2-ff9d-4c02-9033-bf61859a1818-2.jpg', true, 3),
    (cat_juomat_id, 'Sprite 0.33L', 'Sprite 0.33L', 'Sprite 0.33L', 'Sprite 0.33L', 2.50, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/SPR.jpg', true, 4),
    (cat_juomat_id, 'Coca Cola Zero 1.5L', 'Coca Cola Zero 1.5L', 'Coca Cola Zero 1.5L', 'Coca Cola Zero 1.5L', 6.00, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/CocacolaB2.jpg', true, 5),
    (cat_juomat_id, 'Coca Cola 1.5L', 'Coca Cola 1.5L', 'Coca Cola 1.5L', 'Coca Cola 1.5L', 6.00, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/CocacolaB1.jpg', true, 6),
    (cat_juomat_id, 'Jaffa 1.5L', 'Jaffa 1.5L', 'Jaffa 1.5L', 'Jaffa 1.5L', 6.00, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/b654b4b2-ff9d-4c02-9033-bf61859a1818-1.jpg', true, 7),
    (cat_juomat_id, 'Redbull 0.250 L', 'Redbull 0.250 L', 'Redbull 0.250 L', 'Redbull 0.250 L', 3.00, 'https://ravintolababylon.fi/wp-content/uploads/2024/06/312321.jpg', true, 8);

    -- Insert Baklava
    INSERT INTO menu_items (category_id, name, name_en, description, description_en, price, image_url, is_available, display_order) VALUES
    (cat_baklava_id, 'MIX Pistaasi simpukka baklava', 'MIX Pistachio Shell Baklava', 'Vehnäjauhoja, suolaa, kananmunan keltuaista, sitruunan mehu, sitruuna-happoa, sokeria, vettä, pistaasipähkinöitä, voita, paistoöljyä', 'Wheat flour, salt, egg yolk, lemon juice, citric acid, sugar, water, pistachios, butter, cooking oil', 7.50, 'https://ravintolababylon.fi/wp-content/uploads/2025/02/678b92081071bf3f91aae4c4.avif', true, 1),
    (cat_baklava_id, 'MIX Pistaasi normaali baklava', 'MIX Pistachio Regular Baklava', 'Vehnäjauhoja, suolaa, kananmunan keltuaista, sitruunan mehu, sitruuna-happoa, sokeria, vettä, pistaasipähkinöitä, voita, paistoöljyä', 'Wheat flour, salt, egg yolk, lemon juice, citric acid, sugar, water, pistachios, butter, cooking oil', 7.50, 'https://ravintolababylon.fi/wp-content/uploads/2025/02/678b922a1071bf3f91aae4c6.avif', true, 2),
    (cat_baklava_id, 'Pistaasi porkkana slice baklava 2kpl', 'Pistachio Carrot Slice Baklava 2pcs', 'Vehnäjauhoja, suolaa, kananmunan keltuaista, sitruunan mehu, sitruuna-happoa, sokeria, vettä, pistaasipähkinöitä, voita, paistoöljyä', 'Wheat flour, salt, egg yolk, lemon juice, citric acid, sugar, water, pistachios, butter, cooking oil', 7.50, 'https://ravintolababylon.fi/wp-content/uploads/2025/02/678b9fd42e7be8646181735e.avif', true, 3),
    (cat_baklava_id, 'MIX Pistaasi burma baklava', 'MIX Pistachio Burma Baklava', 'Sisältää hasselpähkinä-saksanpähkinää. Vehnäjauhoja, suolaa, kananmunan keltuaista, sitruunan mehu, sitruuna-happoa, sokeria, vettä, pistaasipähkinöitä, voita, paistoöljyä', 'Contains hazelnuts-walnuts. Wheat flour, salt, egg yolk, lemon juice, citric acid, sugar, water, pistachios, butter, cooking oil', 7.50, 'https://ravintolababylon.fi/wp-content/uploads/2025/02/678b92662e7be864618172fb.avif', true, 4),
    (cat_baklava_id, 'MIX Pistaasi kylmä baklava', 'MIX Pistachio Cold Baklava', 'Vehnäjauhoja, suolaa, kananmunan keltuaista, sitruunan mehu, sokeria, vettä, pistaasipähkinöitä, voita, paistoöljyä, kermaa, kaakaojauhetta', 'Wheat flour, salt, egg yolk, lemon juice, sugar, water, pistachios, butter, cooking oil, cream, cocoa powder', 7.50, 'https://ravintolababylon.fi/wp-content/uploads/2025/02/678ba03e1071bf3f91aae536.avif', true, 5);

END $$;

COMMIT;
