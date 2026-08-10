-- Clear existing data (Careful: This is for development)
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM products;
DELETE FROM categories;
SET FOREIGN_KEY_CHECKS = 1;

-- Insert Categories
INSERT INTO categories (id, name, type) VALUES
(1, 'Ethereal Silks', 'Clothing'),
(2, 'Classic Tailoring', 'Clothing'),
(3, 'Heritage Gold', 'Jewellery'),
(4, 'Diamond Atelier', 'Jewellery'),
(5, 'Modern Essentials', 'Clothing');

-- Insert 20 Sample Products
INSERT INTO products (category_id, name, description, price, stock_quantity, image_url, type, gender) VALUES
-- Clothing (10 Items)
(1, 'Midnight Silk Saree', 'Exquisite hand-woven midnight blue silk saree with gold zari borders.', 12500.00, 5, 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=800', 'Clothing', 'Women'),
(1, 'Rose Petal Leheriya', 'Traditional Leheriya saree in a soft rose pink hue.', 8900.00, 10, 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800', 'Clothing', 'Women'),
(2, 'Obsidian Tuxedo', 'Precision-cut slim fit tuxedo in obsidian black wool blend.', 24999.00, 3, 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800', 'Clothing', 'Men'),
(5, 'Ivory Linen Blouse', 'Breathable pure linen blouse with oversized silhouette.', 2499.00, 15, 'https://images.unsplash.com/photo-1551163943-3f6a855d1153?auto=format&fit=crop&w=800', 'Clothing', 'Women'),
(2, 'Azure Summer Suit', 'Lightweight azure blue suit perfect for summer weddings.', 18500.00, 4, 'https://images.unsplash.com/photo-1593032465175-481ac7f401a0?auto=format&fit=crop&w=800', 'Clothing', 'Men'),
(5, 'Cashmere Neutral Knit', 'Ultra-soft cashmere sweater in a versatile sand tone.', 5600.00, 8, 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800', 'Clothing', 'Unisex'),
(1, 'Emerald Velvet Gown', 'Stunning emerald green velvet floor-length evening gown.', 14200.00, 2, 'https://images.unsplash.com/photo-1518049362265-d5b2a6467637?auto=format&fit=crop&w=800', 'Clothing', 'Women'),
(2, 'Charcoal Herringbone Coat', 'Classic herringbone pattern wool coat for the modern gentleman.', 9800.00, 6, 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800', 'Clothing', 'Men'),
(5, 'Saffron Cotton Kurta', 'Premium cotton kurta with intricate thread work on neck.', 3200.00, 12, 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800', 'Clothing', 'Men'),
(1, 'Pearl White Anarkali', 'Dreamy pearl white georgette anarkali with silver embroidery.', 7500.00, 7, 'https://images.unsplash.com/photo-1567113463300-102550d24943?auto=format&fit=crop&w=800', 'Clothing', 'Women'),

-- Jewellery (10 Items)
(3, 'Temple Heritage Necklace', 'Authentic temple jewellery necklace with 22k gold plating.', 45000.00, 2, 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800', 'Jewellery', 'Women'),
(4, 'Solitaire Diamond Ring', '1.5 Carat brilliance-cut diamond set in platinum.', 125000.00, 1, 'https://images.unsplash.com/photo-1605100803337-cc1795c6c8ce?auto=format&fit=crop&w=800', 'Jewellery', 'Women'),
(3, 'Antique Gold Jhumkas', 'Traditional antique finish gold jhumkas with ruby accents.', 18000.00, 5, 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800', 'Jewellery', 'Women'),
(4, 'Sapphire Drop Earrings', 'Royal blue sapphire earrings surrounded by micro-diamonds.', 32000.00, 3, 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800', 'Jewellery', 'Women'),
(3, 'Handcrafted Bangle Set', 'Set of 4 handcrafted bangles with floral motifs.', 12000.00, 8, 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=800', 'Jewellery', 'Women'),
(4, 'Infinity Diamond Bracelet', 'Modern infinity design bracelet encrusted with fine diamonds.', 58000.00, 2, 'https://images.unsplash.com/photo-1573408302355-4e0b7cb39699?auto=format&fit=crop&w=800', 'Jewellery', 'Women'),
(3, 'Champagne Pearl Choker', 'Lustrous champagne pearls with a vintage gold clasp.', 9500.00, 4, 'https://images.unsplash.com/photo-1599643446519-56ad30b007ce?auto=format&fit=crop&w=800', 'Jewellery', 'Women'),
(4, 'Emerald Halo Ring', 'Majestic emerald ring featuring a double halo of diamonds.', 85000.00, 1, 'https://images.unsplash.com/photo-1603561591411-0e7320b9795d?auto=format&fit=crop&w=800', 'Jewellery', 'Women'),
(3, 'Oxidized Silver Anklets', 'Bohemian style oxidized silver anklets with tiny bells.', 1500.00, 20, 'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?auto=format&fit=crop&w=800', 'Jewellery', 'Women'),
(4, 'Minimalist Diamond Studs', 'Understated but elegant round-cut diamond studs.', 22000.00, 6, 'https://images.unsplash.com/photo-1598560912005-59765abc33ee?auto=format&fit=crop&w=800', 'Jewellery', 'Women');
