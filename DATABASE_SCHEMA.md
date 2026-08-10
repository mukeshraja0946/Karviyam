# Karviyam Database Schema & Entity Relationships

The database is built on MySQL 8.x and mapped using Spring Data JPA entities with foreign key constraints, indexes, and automated timestamps.

## Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS ||--o{ ORDERS : places
    USERS ||--o{ WISHLIST : saves
    USERS ||--o1 CART : owns
    USERS }|--|{ ROLES : assigned
    USERS ||--o{ ADDRESSES : manages
    USERS ||--o{ NOTIFICATIONS : receives
    CATEGORIES ||--o{ PRODUCTS : contains
    PRODUCTS ||--o{ PRODUCT_IMAGES : gallery
    PRODUCTS ||--o{ REVIEWS : reviewed
    CART ||--o{ CART_ITEMS : includes
    PRODUCTS ||--o{ CART_ITEMS : in
    ORDERS ||--o{ ORDER_ITEMS : contains
    ORDERS ||--o1 PAYMENTS : paid_by
    PRODUCTS ||--o{ ORDER_ITEMS : ordered
```

## Table Specifications (15 Normalized Tables)

### 1. `users`
- `id` (BIGINT, PK, AUTO_INCREMENT)
- `full_name` (VARCHAR, NOT NULL)
- `email` (VARCHAR, UNIQUE, NOT NULL)
- `password` (VARCHAR, BCrypt Encrypted)
- `phone` (VARCHAR)
- `address` (TEXT)
- `google_id` (VARCHAR)
- `created_at`, `updated_at` (TIMESTAMP)

### 2. `roles` & `user_roles`
- `roles`: `id` (BIGINT, PK), `name` (VARCHAR - `ROLE_USER`, `ROLE_ADMIN`, `ROLE_MANAGER`)
- `user_roles`: `user_id` (FK -> `users.id`), `role_id` (FK -> `roles.id`)

### 3. `products`
- `id` (BIGINT, PK, AUTO_INCREMENT)
- `category_id` (BIGINT, FK -> `categories.id`)
- `name` (VARCHAR, NOT NULL)
- `sku` (VARCHAR)
- `description` (TEXT)
- `price` (DECIMAL 10,2, NOT NULL)
- `old_price` (DECIMAL 10,2)
- `cost_price` (DECIMAL 10,2)
- `stock_quantity` (INT)
- `image_url` (VARCHAR)
- `type` (VARCHAR - Clothing / Jewellery / Footwear)
- `gender` (VARCHAR - Men / Women / Unisex / Kids)
- `brand` (VARCHAR)
- `rating` (DECIMAL 3,2)
- `is_featured` (BOOLEAN)
- `fabric`, `fit`, `size`, `color` (VARCHAR)

### 4. `categories`
- `id` (BIGINT, PK, AUTO_INCREMENT)
- `name` (VARCHAR, NOT NULL)
- `type` (VARCHAR)
- `description` (TEXT)
- `image_url` (VARCHAR)

### 5. `product_images`
- `id` (BIGINT, PK, AUTO_INCREMENT)
- `product_id` (BIGINT, FK -> `products.id`)
- `image_url` (VARCHAR, NOT NULL)
- `sort_order` (INT)

### 6. `cart` & `cart_items`
- `cart`: `id` (BIGINT, PK), `user_id` (BIGINT, FK -> `users.id`)
- `cart_items`: `id` (BIGINT, PK), `cart_id` (FK -> `cart.id`), `product_id` (FK -> `products.id`), `quantity` (INT), `selected_size`, `selected_color`

### 7. `wishlist`
- `id` (BIGINT, PK, AUTO_INCREMENT)
- `user_id` (BIGINT, FK -> `users.id`)
- `product_id` (BIGINT, FK -> `products.id`)
- `created_at` (TIMESTAMP)

### 8. `orders` & `order_items`
- `orders`: `id` (BIGINT, PK), `user_id` (FK -> `users.id`), `total_amount`, `discount_amount`, `shipping_cost`, `status`, `full_name`, `email`, `phone`, `address`, `city`, `pincode`, `tracking_number`, `created_at`
- `order_items`: `id` (BIGINT, PK), `order_id` (FK -> `orders.id`), `product_id` (FK -> `products.id`), `quantity`, `price_at_time`, `selected_size`, `selected_color`

### 9. `payments`
- `id` (BIGINT, PK, AUTO_INCREMENT)
- `order_id` (BIGINT, FK -> `orders.id`)
- `transaction_id` (VARCHAR, NOT NULL)
- `payment_method` (VARCHAR - `COD`, `RAZORPAY`, `STRIPE`)
- `amount` (DECIMAL 10,2)
- `payment_status` (VARCHAR - `Pending`, `Completed`, `Failed`)
- `created_at` (TIMESTAMP)

### 10. `addresses`
- `id` (BIGINT, PK, AUTO_INCREMENT)
- `user_id` (BIGINT, FK -> `users.id`)
- `full_name`, `phone`, `street_address`, `city`, `state`, `pincode`, `country`
- `is_default` (BOOLEAN)

### 11. `coupons`
- `id` (BIGINT, PK, AUTO_INCREMENT)
- `code` (VARCHAR, UNIQUE)
- `discount_type` (`PERCENTAGE` / `FIXED`)
- `discount_value` (DECIMAL 10,2)
- `min_order_amount` (DECIMAL 10,2)
- `active` (BOOLEAN)

### 12. `reviews`
- `id` (BIGINT, PK, AUTO_INCREMENT)
- `product_id` (BIGINT, FK -> `products.id`)
- `user_id` (BIGINT, FK -> `users.id`)
- `rating` (INT 1-5)
- `comment` (TEXT)
- `status` (`Approved`, `Pending`, `Rejected`)
- `created_at` (TIMESTAMP)

### 13. `notifications`
- `id` (BIGINT, PK, AUTO_INCREMENT)
- `user_id` (BIGINT, FK -> `users.id`)
- `message` (TEXT)
- `is_read` (BOOLEAN)
- `created_at` (TIMESTAMP)

### 14. `home_banners`
- `id` (BIGINT, PK, AUTO_INCREMENT)
- `title` (VARCHAR)
- `subtitle` (VARCHAR)
- `image_url` (VARCHAR)
- `button_text`, `button_link` (VARCHAR)
- `is_active` (BOOLEAN)
- `sort_order` (INT)

### 15. `contact_messages`
- `id` (BIGINT, PK, AUTO_INCREMENT)
- `name` (VARCHAR, NOT NULL)
- `email` (VARCHAR, NOT NULL)
- `subject` (VARCHAR)
- `message` (TEXT, NOT NULL)
- `is_read` (BOOLEAN)
- `created_at` (TIMESTAMP)
