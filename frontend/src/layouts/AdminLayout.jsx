import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Box,
  Layers,
  ShoppingBag,
  Users,
  UserCheck,
  Megaphone,
  FileText,
  CreditCard,
  Truck,
  Star,
  BarChart3,
  ShieldCheck,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Search,
  Bell,
  MessageSquare,
  Globe,
  Maximize2,
  Minimize2,
  LogOut,
  Plus,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import ErrorBoundary from '../components/ErrorBoundary';

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState('dashboard');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Admin Dynamic Notifications System
  const defaultAdminNotifs = [
    {
      id: 1,
      title: "New Order Received 🛒",
      description: "Order #ORD-8492 placed by Arun Kumar (₹2,849).",
      time: "5m ago",
      read: false,
      link: "/admin/orders",
      type: "order"
    },
    {
      id: 2,
      title: "Low Stock Warning ⚠️",
      description: "8 products (including 'Test Silk Shirt') reached minimum stock threshold.",
      time: "25m ago",
      read: false,
      link: "/admin/products",
      type: "stock"
    },
    {
      id: 3,
      title: "New Support Submission ✉️",
      description: "Customer Arun Kumar sent a support message regarding Order #ORD123456.",
      time: "1h ago",
      read: false,
      link: "/admin/help-support",
      type: "support"
    }
  ];

  const [adminNotifs, setAdminNotifs] = useState(() => {
    try {
      const saved = localStorage.getItem('karviyam_admin_notifications');
      return saved ? JSON.parse(saved) : defaultAdminNotifs;
    } catch (e) {
      return defaultAdminNotifs;
    }
  });

  const unreadAdminCount = adminNotifs.filter(n => !n.read).length;

  const markAllAdminRead = () => {
    const updated = adminNotifs.map(n => ({ ...n, read: true }));
    setAdminNotifs(updated);
    localStorage.setItem('karviyam_admin_notifications', JSON.stringify(updated));
  };

  const handleAdminNotifClick = (id, link) => {
    const updated = adminNotifs.map(n => n.id === id ? { ...n, read: true } : n);
    setAdminNotifs(updated);
    localStorage.setItem('karviyam_admin_notifications', JSON.stringify(updated));
    setNotificationsOpen(false);
    if (link) navigate(link);
  };

  const clearAllAdminNotifs = () => {
    setAdminNotifs([]);
    localStorage.setItem('karviyam_admin_notifications', JSON.stringify([]));
  };

  // Custom Admin Logo State
  const [customLogo, setCustomLogo] = useState(() => localStorage.getItem('karviyam_logo') || '');

  useEffect(() => {
    const updateLogo = () => {
      setCustomLogo(localStorage.getItem('karviyam_logo') || '');
    };
    window.addEventListener('storage', updateLogo);
    window.addEventListener('karviyam_logo_updated', updateLogo);
    return () => {
      window.removeEventListener('storage', updateLogo);
      window.removeEventListener('karviyam_logo_updated', updateLogo);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  };

  const navSections = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: '/admin',
    },
    {
      id: 'catalog',
      title: 'Product Management',
      icon: Box,
      subItems: [
        { name: 'Products', path: '/admin/products' },
        { name: 'Categories', path: '/admin/categories' },
        { name: 'Brands', path: '/admin/brands' },
        { name: 'Inventory & Stock', path: '/admin/inventory' },
      ],
    },
    {
      id: 'categories',
      title: 'Categories',
      icon: Layers,
      path: '/admin/categories',
    },
    {
      id: 'orders',
      title: 'Orders',
      icon: ShoppingBag,
      subItems: [
        { name: 'All Orders', path: '/admin/orders' },
        { name: 'Pending Orders', path: '/admin/orders?status=pending' },
        { name: 'Shipped Orders', path: '/admin/orders?status=shipped' },
        { name: 'Delivered', path: '/admin/orders?status=delivered' },
      ],
    },
    {
      id: 'customers',
      title: 'Customers',
      icon: Users,
      subItems: [
        { name: 'Customer List', path: '/admin/customers' },
        { name: 'Customer Groups', path: '/admin/customers?tab=groups' },
      ],
    },
    {
      id: 'marketing',
      title: 'Marketing',
      icon: Megaphone,
      subItems: [
        { name: 'Coupons', path: '/admin/coupons' },
        { name: 'Banners', path: '/admin/banners' },
        { name: 'Offers & Discounts', path: '/admin/offers' },
      ],
    },
    {
      id: 'finance',
      title: 'Finance & Payments',
      icon: CreditCard,
      subItems: [
        { name: 'Payment History', path: '/admin/payments' },
        { name: 'Invoices & GST', path: '/admin/orders' },
      ],
    },
    {
      id: 'reviews',
      title: 'Reviews',
      icon: Star,
      path: '/admin/reviews',
    },
    {
      id: 'reports',
      title: 'Reports & Analytics',
      icon: BarChart3,
      path: '/admin/reports',
    },
    {
      id: 'users',
      title: 'User Management',
      icon: ShieldCheck,
      path: '/admin/users',
    },
    {
      id: 'logistics',
      title: 'Deliverable Pincodes',
      icon: Truck,
      path: '/admin/pincodes',
    },
    {
      id: 'help-support',
      title: 'Help & Support',
      icon: MessageSquare,
      path: '/admin/help-support',
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: Settings,
      path: '/admin/settings',
    },
    {
      id: 'audit',
      title: 'Audit & Compliance Logs',
      icon: ShieldCheck,
      path: '/admin/audit-logs',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1F2937] flex flex-col font-sans">
      
      {/* TOP HEADER */}
      <header className="h-16 bg-white border-b border-[#E5E7EB] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        
        {/* Left Section: Logo & Sidebar Toggle */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 text-slate-500 hover:text-[#B71C1C] hover:bg-red-50 rounded-xl transition-colors hidden lg:block"
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-2 text-slate-500 hover:text-[#B71C1C] hover:bg-red-50 rounded-xl transition-colors lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/admin" className="flex items-center gap-2.5">
            {customLogo ? (
              <img src={customLogo} alt="Karviyam Logo" className="h-10 w-auto object-contain max-w-[180px]" />
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#D32F2F] to-[#B71C1C] text-white flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3zm0 4a3 3 0 110 6 3 3 0 010-6zm-4 9.5c0-2 4-3.1 4-3.1s4 1.1 4 3.1V16H8v-0.5z"/>
                  </svg>
                </div>
                <span className="font-display font-black text-xl tracking-tight text-[#B71C1C] hidden sm:inline">
                  KARVIYAM
                </span>
              </div>
            )}

            <span className="text-[10px] font-bold uppercase text-slate-400 border-l border-slate-200 pl-2 hidden sm:inline">
              Enterprise Admin
            </span>
          </Link>
        </div>

        {/* Center: Global Search Bar */}
        <div className="relative flex-1 max-w-md mx-4 hidden md:block">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Global Search (Orders, Products, SKU, Customers)..."
              className="w-full bg-[#F5F5F5] text-xs text-slate-900 placeholder-slate-400 pl-10 pr-4 py-2 rounded-xl border border-transparent focus:border-[#B71C1C] focus:bg-white outline-none transition-all"
            />
          </div>
        </div>

        {/* Right Section: Header Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          <Link
            to="/"
            className="hidden xl:flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#B71C1C] bg-[#F5F5F5] hover:bg-red-50 px-3 py-1.5 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Storefront</span>
          </Link>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-[#F5F5F5] rounded-xl transition-colors hidden sm:block"
            title="Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2 text-slate-500 hover:text-[#B71C1C] hover:bg-red-50 rounded-xl transition-colors relative cursor-pointer"
              title="System Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadAdminCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#B71C1C] rounded-full ring-2 ring-white animate-pulse" />
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] p-4 z-50 animate-in fade-in-80 zoom-in-95 duration-150 text-left">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#B71C1C]" />
                    <h4 className="font-extrabold text-sm text-slate-900">Admin System Alerts</h4>
                    {unreadAdminCount > 0 && (
                      <span className="bg-red-100 text-[#B71C1C] text-[10px] font-black px-2 py-0.5 rounded-full">
                        {unreadAdminCount} New
                      </span>
                    )}
                  </div>
                  {adminNotifs.length > 0 && (
                    <button
                      onClick={markAllAdminRead}
                      className="text-[11px] font-bold text-[#B71C1C] hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {adminNotifs.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                    ✨ All system alerts cleared!
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                    {adminNotifs.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleAdminNotifClick(n.id, n.link)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                          n.read ? 'bg-slate-50/60 border-slate-100 opacity-75' : 'bg-rose-50/40 border-rose-100 shadow-2xs'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-red-100 text-[#B71C1C] flex items-center justify-center shrink-0 text-sm font-bold mt-0.5">
                          {n.type === 'order' ? '🛒' : n.type === 'stock' ? '⚠️' : '✉️'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-bold text-slate-900 truncate">{n.title}</h5>
                            <span className="text-[9.5px] text-slate-400 font-medium shrink-0 ml-2">{n.time}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-snug mt-0.5">{n.description}</p>
                        </div>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-[#B71C1C] shrink-0 mt-2" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {adminNotifs.length > 0 && (
                  <div className="border-t border-slate-100 pt-2.5 mt-2 flex items-center justify-between text-[11px]">
                    <button
                      onClick={clearAllAdminNotifs}
                      className="text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
                    >
                      Clear all
                    </button>
                    <span className="text-slate-400 font-medium">Karviyam Admin Panel</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="h-6 w-[1px] bg-[#E5E7EB]" />

          {/* Admin User Profile Header */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#D32F2F] to-[#B71C1C] text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {user?.fullName ? user.fullName[0].toUpperCase() : 'A'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-900 leading-tight">
                {user?.fullName || 'Administrator'}
              </div>
              <div className="text-[10px] font-semibold text-[#B71C1C]">
                Super Admin
              </div>
            </div>

            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-[#B71C1C] hover:bg-red-50 rounded-lg transition-colors ml-1"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>

      </header>

      {/* BODY WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT COLLAPSIBLE SIDEBAR */}
        <aside
          className={`bg-white border-r border-[#E5E7EB] flex flex-col justify-between p-3 shrink-0 transition-all duration-300 z-20 ${
            sidebarCollapsed ? 'w-16' : 'w-64'
          } ${mobileSidebarOpen ? 'fixed inset-y-0 left-0 w-64 shadow-2xl z-50' : 'hidden lg:flex'}`}
        >
          <nav className="space-y-1 overflow-y-auto">
            {navSections.map((section) => {
              const Icon = section.icon;
              const hasSub = section.subItems && section.subItems.length > 0;
              const isExpanded = expandedMenu === section.id;
              const isActive = section.path ? location.pathname === section.path : false;

              if (!hasSub) {
                return (
                  <Link
                    key={section.id}
                    to={section.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-red-50 text-[#B71C1C] font-bold border-l-4 border-[#B71C1C] shadow-xs'
                        : 'text-slate-600 hover:bg-[#F5F5F5] hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#B71C1C]' : 'text-slate-400'}`} />
                    {!sidebarCollapsed && <span>{section.title}</span>}
                  </Link>
                );
              }

              return (
                <div key={section.id} className="space-y-1">
                  <button
                    onClick={() => setExpandedMenu(isExpanded ? null : section.id)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-[#F5F5F5] hover:text-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 shrink-0 text-slate-400" />
                      {!sidebarCollapsed && <span>{section.title}</span>}
                    </div>
                    {!sidebarCollapsed && (
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    )}
                  </button>

                  {!sidebarCollapsed && isExpanded && (
                    <div className="pl-9 space-y-1 border-l-2 border-slate-100 ml-3">
                      {section.subItems.map((sub, idx) => (
                        <Link
                          key={idx}
                          to={sub.path}
                          className="block py-1.5 px-2 rounded-lg text-[11px] font-medium text-slate-600 hover:text-[#B71C1C] hover:bg-red-50 transition-colors"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Footer inside sidebar */}
          {!sidebarCollapsed && (
            <div className="pt-3 border-t border-[#E5E7EB] text-[10px] text-slate-400 text-center font-medium">
              Karviyam Enterprise v2.4
            </div>
          )}
        </aside>

        {/* MAIN WORKSPACE CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>

      </div>

    </div>
  );
}
