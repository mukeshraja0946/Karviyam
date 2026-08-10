# Karviyam React Native Android Mobile Application 📱

A standalone, production-ready React Native (Expo) mobile application for the **Karviyam eCommerce Platform**.

## 🚀 Features

- **Mobile First Design**: Custom tailored mobile UI optimized for Android phones, tablets, and safe areas.
- **5 Bottom Navigation Tabs**: Home, Categories, Wishlist, Cart, Account.
- **Full eCommerce Workflow**:
  - Hero Drop Banner Sliders & Category Pills
  - Product Catalog with Grid/List View switcher & Filter Drawer
  - Product Details with Size Selector, Image Gallery, Description & User Reviews
  - Instant Search & Recent Search Suggestions
  - Cart Management with Promo Code & Total Breakdown
  - Checkout & Address Selection
  - Order Tracking Timeline Stepper (Pending -> Processing -> Shipped -> Out for Delivery -> Delivered)
  - Customer Support & HQ Info Form
- **Zero Backend / Web Changes**: Consumes the exact same Spring Boot REST APIs (`/api/*`) and MySQL database.

---

## 🛠️ How to Run on Android

1. **Navigate to the mobile directory**:
   ```bash
   cd mobile
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start the Expo Development Server**:
   ```bash
   npx expo start
   ```

4. **Launch on Android**:
   - Press `a` in the terminal to open in connected **Android Emulator** or physical Android device via **Expo Go app**.
   - Make sure your Spring Boot backend server is running on `http://localhost:8080` (the mobile app connects via `http://10.0.2.2:8080/api` for Android Emulator).
