-- Seed/Sync homepage collections (Full Set of 6)
-- This will ensure all 6 specified collections are present and active

INSERT INTO homepage_collections (name, link, image, status)
VALUES 
('Mens Wear', 'shop.php?gender=Men', 'assets/images/collections/mens_wear.webp', 'active'),
('Womens Wear', 'shop.php?gender=Women', 'assets/images/collections/womens_wear.webp', 'active'),
('Sneakers', 'shop.php?category=Sneakers', 'assets/images/collections/sneakers.webp', 'active'),
('Accessories', 'shop.php?category=Accessories', 'assets/images/collections/accessories.webp', 'active'),
('Pattu Saree', 'shop.php?category=Pattu Saree', 'assets/images/collections/pattu_saree.webp', 'active'),
('Silver Jewels', 'shop.php?category=Silver Jewels', 'assets/images/collections/silver_jewels.webp', 'active')
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    link = VALUES(link),
    status = 'active';
