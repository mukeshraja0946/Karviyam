import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Box,
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
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-[#F5F5F5] rounded-xl transition-colors relative"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#B71C1C] rounded-full animate-pulse" />
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#E5E7EB] p-3 z-50 text-xs space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 font-bold">
                  <span>System Alerts</span>
                  <span className="text-[10px] text-[#B71C1C]">3 New</span>
                </div>
                <div className="p-2 rounded-xl bg-red-50 text-slate-800">
                  <p className="font-bold text-[#B71C1C]">Low Stock Alert</p>
                  <p className="text-[11px] text-slate-600">8 products have reached minimum stock threshold.</p>
                </div>
                <div className="p-2 rounded-xl bg-blue-50 text-slate-800">
                  <p className="font-bold text-blue-700">New Order Received</p>
                  <p className="text-[11px] text-slate-600">Order #ORD12345 placed by Ravi Kumar.</p>
                </div>
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
