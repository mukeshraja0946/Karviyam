import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ThemeProvider } from './context/ThemeContext';

function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }, [pathname, search]);

  return null;
}

import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import { ProtectedRoute, AdminRoute } from './routes/ProtectedRoute';

import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import WishlistPage from './pages/WishlistPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import UserProfilePage from './pages/UserProfilePage';
import CustomerSettingsPage from './pages/CustomerSettingsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ContactPage from './pages/ContactPage';
import MaintenancePage from './pages/MaintenancePage';
import OffersPage from './pages/OffersPage';

import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminProductsPage from './pages/AdminProductsPage';
import AdminOrdersPage from './pages/AdminOrdersPage';
import AdminCouponsPage from './pages/AdminCouponsPage';
import AdminBannersPage from './pages/AdminBannersPage';
import AdminPromoCardsPage from './pages/AdminPromoCardsPage';
import AdminRightSidebarBannersPage from './pages/AdminRightSidebarBannersPage';
import AdminRightSidebarPromoCardPage from './pages/AdminRightSidebarPromoCardPage';
import AdminOffersPage from './pages/AdminOffersPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminReviewsPage from './pages/AdminReviewsPage';
import AdminCategoriesPage from './pages/AdminCategoriesPage';
import AdminParentCategoriesPage from './pages/AdminParentCategoriesPage';
import AdminBrandsPage from './pages/AdminBrandsPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import AdminCustomersPage from './pages/AdminCustomersPage';
import AdminInventoryPage from './pages/AdminInventoryPage';
import AdminReportsPage from './pages/AdminReportsPage';
import AdminPincodesPage from './pages/AdminPincodesPage';
import AdminAuditLogsPage from './pages/AdminAuditLogsPage';
import AdminHelpSupportPage from './pages/AdminHelpSupportPage';
import SubscriptionCheckoutPage from './pages/SubscriptionCheckoutPage';
import SubscriptionSuccessPage from './pages/SubscriptionSuccessPage';
import AdminSubscriptionsPage from './pages/AdminSubscriptionsPage';
import AdminEmailMarketingPage from './pages/AdminEmailMarketingPage';
import AdminHomepageSectionsPage from './pages/AdminHomepageSectionsPage';
import AdminFindYourPricePage from './pages/AdminFindYourPricePage';
import AdminWhyShopPage from './pages/AdminWhyShopPage';
import AdminBankAccountPage from './pages/AdminBankAccountPage';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <BrowserRouter>
              <ScrollToTop />
              <Toaster position="top-right" />
              <Routes>
                
                {/* Main Customer App Routes */}
                <Route element={<MainLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/maintenance" element={<MaintenancePage />} />
                  <Route path="/maintenance.php" element={<Navigate to="/maintenance" replace />} />
                  <Route path="/shop" element={<ShopPage />} />
                  <Route path="/category/:slug" element={<ShopPage />} />
                  <Route path="/product/:id" element={<ProductDetailPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/order-success" element={<OrderSuccessPage />} />
                  <Route path="/wishlist" element={<WishlistPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/admin/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/offers" element={<OffersPage />} />
                  <Route path="/subscribe/payment" element={<SubscriptionCheckoutPage />} />
                  <Route path="/subscription-success" element={<SubscriptionSuccessPage />} />

                  {/* Protected Customer Routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/profile" element={<UserProfilePage />} />
                    <Route path="/settings" element={<CustomerSettingsPage />} />
                  </Route>
                </Route>

                {/* Protected Admin Control Center Routes */}
                <Route element={<AdminRoute />}>
                  <Route element={<AdminLayout />}>
                    <Route path="/admin" element={<AdminDashboardPage />} />
                    <Route path="/admin/products" element={<AdminProductsPage />} />
                    <Route path="/admin/orders" element={<AdminOrdersPage />} />
                    <Route path="/admin/categories" element={<AdminCategoriesPage />} />
                    <Route path="/admin/parent-categories" element={<AdminParentCategoriesPage />} />
                    <Route path="/admin/brands" element={<AdminBrandsPage />} />
                    <Route path="/admin/inventory" element={<AdminInventoryPage />} />
                    <Route path="/admin/customers" element={<AdminCustomersPage />} />
                    <Route path="/admin/coupons" element={<AdminCouponsPage />} />
                    <Route path="/admin/subscriptions" element={<AdminSubscriptionsPage />} />
                    <Route path="/admin/homepage-sections" element={<AdminHomepageSectionsPage />} />
                    <Route path="/admin/find-your-price" element={<AdminFindYourPricePage />} />
                    <Route path="/admin/why-shop" element={<AdminWhyShopPage />} />
                    <Route path="/admin/email-marketing" element={<AdminEmailMarketingPage />} />
                    <Route path="/admin/mail" element={<AdminEmailMarketingPage />} />
                    <Route path="/admin/banners" element={<AdminBannersPage />} />
                    <Route path="/admin/promo-cards" element={<AdminPromoCardsPage />} />
                    <Route path="/admin/right-sidebar-banners" element={<AdminRightSidebarBannersPage />} />
                    <Route path="/admin/right-sidebar-promo-card" element={<AdminRightSidebarPromoCardPage />} />
                    <Route path="/admin/pincodes" element={<AdminPincodesPage />} />
                    <Route path="/admin/offers" element={<AdminOffersPage />} />
                    <Route path="/admin/users" element={<AdminUsersPage />} />
                    <Route path="/admin/reviews" element={<AdminReviewsPage />} />
                    <Route path="/admin/payments" element={<AdminOrdersPage />} />
                    <Route path="/admin/bank-account" element={<AdminBankAccountPage />} />
                    <Route path="/admin/reports" element={<AdminReportsPage />} />
                    <Route path="/admin/settings" element={<AdminSettingsPage />} />
                    <Route path="/admin/website-settings" element={<AdminSettingsPage />} />
                    <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
                    <Route path="/admin/help-support" element={<AdminHelpSupportPage />} />
                    <Route path="/admin/help_support" element={<AdminHelpSupportPage />} />
                    <Route path="/admin/help" element={<AdminHelpSupportPage />} />
                    <Route path="/admin/support" element={<AdminHelpSupportPage />} />
                    <Route path="/admin/contact-messages" element={<AdminHelpSupportPage />} />
                    <Route path="/admin/admins" element={<AdminUsersPage />} />
                  </Route>
                </Route>

              </Routes>
            </BrowserRouter>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
