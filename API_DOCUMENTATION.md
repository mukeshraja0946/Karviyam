# Karviyam REST API Documentation

The Karviyam E-Commerce platform exposes enterprise RESTful APIs following JSON response conventions.

## Base URL
`http://localhost:8080/api`

## Authentication Header
Protected endpoints require an Authorization Header:
`Authorization: Bearer <JWT_TOKEN>`

---

## 1. Authentication Endpoints (`/api/auth`)

### POST `/api/auth/register`
Register a new customer account.
- **Request Body**:
  ```json
  {
    "fullName": "Mukesh Kumar",
    "email": "customer@example.com",
    "password": "Password123",
    "phone": "+91 9876543210",
    "address": "123 Street, City"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Registration successful!",
    "data": {
      "id": 2,
      "fullName": "Mukesh Kumar",
      "email": "customer@example.com",
      "roles": ["ROLE_USER"]
    }
  }
  ```

### POST `/api/auth/login`
Authenticate user credentials and obtain JWT token.
- **Request Body**:
  ```json
  {
    "email": "admin@karviyam.com",
    "password": "admin123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "type": "Bearer",
    "id": 1,
    "email": "admin@karviyam.com",
    "fullName": "Administrator",
    "roles": ["ROLE_ADMIN"]
  }
  ```

### POST `/api/auth/forgot-password`
Initiate password reset email request.

### POST `/api/auth/reset-password`
Complete password reset using token and new password.

---

## 2. User & Address Management (`/api/users`)

### GET `/api/users/profile`
Fetch current authenticated user profile details.

### PUT `/api/users/profile`
Update user full name, phone number, and primary address.

### GET `/api/users/addresses`
Fetch user saved shipping address book.

### POST `/api/users/addresses`
Add new shipping address.

### DELETE `/api/users/addresses/{id}`
Delete a saved address by ID.

---

## 3. Product Catalog Endpoints (`/api/products`)

### GET `/api/products`
Query products with pagination, search, category, gender, and price range filtering.
- **Query Parameters**:
  - `keyword`: Search in product title, description, or brand.
  - `categoryId`: Filter by category ID.
  - `gender`: Filter by `Men`, `Women`, `Kids`, or `Unisex`.
  - `minPrice` / `maxPrice`: Filter by price range.
  - `page` (default 0), `size` (default 12).
  - `sortBy` (`price`, `rating`, `id`), `sortDir` (`asc`, `desc`).

### GET `/api/products/{id}`
Fetch detailed view of a product by ID.

### GET `/api/products/featured`
Fetch featured items for home section.

### GET `/api/categories`
Fetch all product categories.

---

## 4. Shopping Cart Endpoints (`/api/cart`)

### GET `/api/cart`
Get user active shopping bag items and total.

### POST `/api/cart/add`
Add item to shopping bag with selected size & color variants.

### PUT `/api/cart/update/{itemId}?quantity={qty}`
Update item quantity in bag.

### DELETE `/api/cart/remove/{itemId}`
Remove single item from bag.

### DELETE `/api/cart/clear`
Clear all items in cart.

---

## 5. Order & Checkout Endpoints (`/api/orders`)

### POST `/api/orders/checkout`
Place a new order.

### GET `/api/orders/my-orders`
Fetch order history for authenticated user.

### GET `/api/orders/{id}`
Fetch single order tracking details.

### PUT `/api/orders/{id}/cancel`
Cancel pending order.

### GET `/api/orders/{id}/invoice`
Download/view HTML invoice for completed order.

---

## 6. Payment Integration APIs (`/api/payments`)

### POST `/api/payments/razorpay/create-order?orderId={id}`
Create Razorpay payment transaction token.

### POST `/api/payments/razorpay/verify`
Verify Razorpay HMAC signature and complete order payment.

### POST `/api/payments/stripe/create-intent?orderId={id}`
Create Stripe Payment Intent client secret.

---

## 7. Customer Reviews & Support (`/api/reviews`, `/api/contact`, `/api/banners`)

### POST `/api/reviews`
Submit product rating and review.

### GET `/api/reviews/product/{productId}`
Get approved reviews for a specific product.

### POST `/api/contact`
Submit customer contact message inquiry.

### GET `/api/banners`
Fetch active homepage hero sliders.

---

## 8. Admin Control Center (`/api/admin`)
Requires `ROLE_ADMIN` or `ROLE_MANAGER`.

- `GET /api/admin/dashboard/stats`: Returns total sales revenue, order counts, customer counts.
- `GET /api/admin/orders`: List all orders across all customers.
- `PUT /api/admin/orders/{id}/status?status=Shipped`: Update order fulfillment status.
- `GET /api/admin/products`: Fetch all products for admin data table.
- `POST /api/admin/products`: Add new product to catalog.
- `PUT /api/admin/products/{id}`: Edit product details.
- `DELETE /api/admin/products/{id}`: Delete product.
- `GET /api/admin/coupons`: List promotional discount coupons.
- `POST /api/admin/coupons`: Create new promotional discount code.
- `DELETE /api/admin/coupons/{id}`: Delete coupon.
- `GET /api/admin/users`: List registered user accounts.
- `GET /api/admin/reviews`: List customer reviews pending moderation.
- `PUT /api/admin/reviews/{id}/status?status=Approved`: Moderate customer review.
