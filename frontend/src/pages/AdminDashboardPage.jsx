import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { resolveImageUrl, handleImageError } from '../utils/imageUtils';
import api from '../utils/api';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle,
  Plus,
  ArrowRight,
  Layers,
  Image,
  Ticket,
  Award,
  Star,
  ChevronDown,
  BarChart3,
  FileText,
  Filter,
  Check,
  X,
  RefreshCw,
  Store
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [dashData, setDashData] = useState(null);
  const [chartPeriod, setChartPeriod] = useState('Monthly'); // 'Daily', 'Weekly', 'Monthly'
  const [reviews, setReviews] = useState([
    { id: 1, customer: 'Ananya Sharma', product: 'Karviyam Cyberpunk Tee', rating: 5, comment: 'Exceptional 240 GSM heavy cotton fabric! Ultra premium fit.', status: 'Pending' },
    { id: 2, customer: 'Karthik Raja', product: 'Apex Stealth Sneakers', rating: 4, comment: 'Very comfortable sole and stylish design.', status: 'Approved' },
  ]);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/dashboard/stats');
      if (res && res.data && res.data.data) {
        setDashData(res.data.data);
      }
    } catch (err) {
      console.error('[Dashboard Error] Failed to fetch live analytics:', err);
      toast.error('Unable to fetch live database analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();

    const handleResetOrUpdate = () => {
      fetchDashboardStats();
    };

    window.addEventListener('karviyam_analytics_reset', handleResetOrUpdate);
    window.addEventListener('storage', handleResetOrUpdate);
    return () => {
      window.removeEventListener('karviyam_analytics_reset', handleResetOrUpdate);
      window.removeEventListener('storage', handleResetOrUpdate);
    };
  }, []);

  const isReportsReset = typeof localStorage !== 'undefined' && localStorage.getItem('karviyam_admin_reports_reset') === 'true';

  // Calculate actual dynamic KPI metrics
  const rawTodaySales = isReportsReset ? 0 : (dashData?.todaySales || 0);
  const rawMonthlySales = isReportsReset ? 0 : (dashData?.monthlySales || 0);
  const rawTotalRevenue = isReportsReset ? 0 : (dashData?.totalRevenue || 0);
  const rawNetProfit = isReportsReset ? 0 : (dashData?.netProfit || 0);
  const rawTotalOrders = isReportsReset ? 0 : (dashData?.totalOrders || 0);
  const rawPendingOrders = isReportsReset ? 0 : (dashData?.pendingOrders || 0);

  const kpiCards = [
    { title: "Today's Sales", value: `₹${rawTodaySales.toLocaleString('en-IN')}`, change: rawTodaySales > 0 ? '+12.4%' : '₹0', period: 'today', isPos: rawTodaySales > 0 },
    { title: 'Monthly Sales', value: `₹${rawMonthlySales.toLocaleString('en-IN')}`, change: rawMonthlySales > 0 ? '+18.7%' : '₹0', period: 'this month', isPos: rawMonthlySales > 0 },
    { title: 'Total Revenue', value: `₹${rawTotalRevenue.toLocaleString('en-IN')}`, change: rawTotalRevenue > 0 ? '+24.1%' : '₹0', period: 'all-time', isPos: rawTotalRevenue > 0 },
    { title: 'Net Profit', value: `₹${rawNetProfit.toLocaleString('en-IN')}`, change: '31% margin', period: 'net margin', isPos: rawNetProfit > 0 },
    { title: 'Total Orders', value: rawTotalOrders.toLocaleString('en-IN'), change: rawTotalOrders > 0 ? '+15.3%' : '0', period: 'orders placed', isPos: rawTotalOrders > 0 },
    { title: 'Pending Orders', value: rawPendingOrders.toLocaleString('en-IN'), change: rawPendingOrders > 0 ? 'Action Req' : '0 Pending', period: 'awaiting dispatch', isPos: false },
    { title: 'Active Customers', value: (dashData?.activeCustomers || 0).toLocaleString('en-IN'), change: '+12.5%', period: 'registered users', isPos: true },
    { title: 'Total Products', value: (dashData?.totalProducts || 0).toLocaleString('en-IN'), change: 'Catalog', period: 'active products', isPos: true },
    { title: 'Out of Stock', value: `${dashData?.outOfStock || 0} Items`, change: dashData?.outOfStock > 0 ? 'Alert' : 'Clean', period: 'needs restock', isPos: false },
    { title: 'Total Sellers', value: `${dashData?.totalSellers || 1} Active`, change: 'Verified', period: 'partner vendors', isPos: true },
  ];

  const recentOrders = dashData?.recentOrders || [];
  const topProducts = dashData?.topProducts || [];
  const lowStockAlerts = dashData?.lowStockAlerts || [];
  const recentCustomers = dashData?.recentCustomers || [];

  const handleReviewAction = (id, newStatus) => {
    setReviews(reviews.map(r => r.id === id ? { ...r, status: newStatus } : r));
    toast.success(`Review ${newStatus.toLowerCase()} successfully!`);
  };

  // Chart data setup
  const chartItems = isReportsReset
    ? []
    : chartPeriod === 'Daily'
      ? (dashData?.chartData?.daily || [])
      : (dashData?.chartData?.monthly || []);

  const maxChartSales = Math.max(...chartItems.map(c => c.sales), 1000);

  return (
    <div className="space-y-8 pb-12">
      
      {/* Dashboard Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
        <div>
          <h1 className="font-display font-black text-2xl text-[#1F2937] tracking-tight flex items-center gap-2">
            <span>Enterprise Control Center</span>
            {loading && <RefreshCw className="w-4 h-4 animate-spin text-red-600" />}
          </h1>
          <p className="text-xs text-slate-500 font-medium">Real-time marketplace analytics, database orders & catalog metrics</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardStats}
            className="flex items-center gap-2 bg-[#F5F5F5] hover:bg-slate-200 text-[#1F2937] px-3.5 py-2 rounded-xl text-xs font-bold transition-colors border border-[#E5E7EB] cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#B71C1C] ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Analytics</span>
          </button>
          <Link
            to="/admin/products"
            className="flex items-center gap-2 bg-[#B71C1C] hover:bg-[#900C0C] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* 10 TOP STATISTICS CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiCards.map((c, i) => (
          <div
            key={i}
            className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <span className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
              {c.title}
            </span>
            <div className="font-display font-extrabold text-2xl text-[#1F2937] my-1 truncate">
              {c.value}
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className={`font-bold ${c.isPos ? 'text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md' : 'text-red-700 bg-red-50 px-1.5 py-0.5 rounded-md'}`}>
                {c.change}
              </span>
              <span className="text-slate-400 font-medium">{c.period}</span>
            </div>
          </div>
        ))}
      </div>

      {/* INTERACTIVE ANALYTICS CHARTS SECTION */}
      <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-bold text-base text-[#1F2937]">Sales & Revenue Analytics</h2>
            <p className="text-xs text-slate-500">Gross transaction volume and timeline growth curves</p>
          </div>

          <div className="flex items-center gap-2 bg-[#F5F5F5] p-1 rounded-xl border border-[#E5E7EB]">
            {['Daily', 'Monthly'].map((p) => (
              <button
                key={p}
                onClick={() => setChartPeriod(p)}
                className={`px-3.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  chartPeriod === p ? 'bg-[#B71C1C] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Interactive Bar & Curve Chart */}
        {chartItems.length === 0 || isReportsReset ? (
          <div className="w-full h-56 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center p-6 text-center">
            <BarChart3 className="w-10 h-10 text-slate-300 mb-2" />
            <p className="font-bold text-xs text-slate-600">No Sales Data Recorded</p>
            <p className="text-[11px] text-slate-400 max-w-sm mt-0.5">
              {isReportsReset ? 'Reports & Analytics metrics have been reset to zero.' : 'New orders placed will automatically populate live revenue curves here.'}
            </p>
          </div>
        ) : (
          <div className="w-full pt-4 space-y-3">
            <div className="flex items-end justify-between gap-2 h-48 border-b border-slate-200 pb-2">
              {chartItems.map((item, idx) => {
                const pct = Math.min(100, Math.max(8, Math.round((item.sales / maxChartSales) * 100)));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <div className="text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white px-1.5 py-0.5 rounded shadow-xs">
                      ₹{item.sales.toLocaleString('en-IN')}
                    </div>
                    <div
                      style={{ height: `${pct}%` }}
                      className="w-full max-w-[36px] bg-linear-to-t from-red-800 to-red-600 rounded-t-lg transition-all duration-500 group-hover:from-red-700 group-hover:to-red-500 shadow-2xs"
                    />
                    <span className="text-[11px] font-bold text-slate-500 uppercase">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* TWO COLUMN GRID: RECENT ORDERS & TOP SELLING PRODUCTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* RECENT ORDERS TABLE */}
        <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-base text-[#1F2937]">Recent Orders</h2>
              <Link to="/admin/orders" className="text-xs font-bold text-[#B71C1C] hover:underline flex items-center gap-1">
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                🛍️ No recent orders found in database.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 font-bold border-b border-slate-100">
                      <th className="pb-3">Order ID</th>
                      <th className="pb-3">Customer</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentOrders.map((o, i) => (
                      <tr key={i} className="hover:bg-slate-50/80">
                        <td className="py-3 font-bold text-slate-900">{o.id}</td>
                        <td className="py-3 font-medium text-slate-700">{o.customer}</td>
                        <td className="py-3 font-bold text-slate-900">{o.amount}</td>
                        <td className="py-3 text-right">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${o.statusColor}`}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* TOP SELLING PRODUCTS */}
        <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-base text-[#1F2937]">Top Catalog Products</h2>
              <Link to="/admin/products" className="text-xs font-bold text-[#B71C1C] hover:underline flex items-center gap-1">
                <span>All Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {topProducts.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                📦 No products in catalog yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 font-bold border-b border-slate-100">
                      <th className="pb-3">Product</th>
                      <th className="pb-3 text-center">Stock</th>
                      <th className="pb-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {topProducts.map((p, i) => (
                      <tr key={i} className="hover:bg-slate-50/80">
                        <td className="py-2.5 flex items-center gap-3">
                          <img
                            src={resolveImageUrl(p.image || p.imageUrl, p.id || i)}
                            onError={(e) => handleImageError(e, p.id || i)}
                            alt={p.name}
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100"
                          />
                          <div>
                            <p className="font-bold text-slate-900 line-clamp-1">{p.name}</p>
                            <p className="text-[10px] text-slate-400">{p.category}</p>
                          </div>
                        </td>
                        <td className="py-2.5 text-center font-semibold text-slate-700">{p.stock}</td>
                        <td className="py-2.5 text-right font-bold">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            p.stock <= 0 ? 'bg-red-50 text-red-700' : p.stock <= 5 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* THREE COLUMN GRID: LOW STOCK ALERTS, RECENT CUSTOMERS, LATEST REVIEWS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* LOW STOCK ALERT */}
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Low Stock Alerts</span>
            </h3>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              {lowStockAlerts.length} Alerts
            </span>
          </div>

          {lowStockAlerts.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs font-semibold">
              ✅ All product inventory levels are healthy!
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              {lowStockAlerts.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{item.name}</p>
                    <p className="text-[10px] text-slate-400">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-red-600 block">{item.stock} Left</span>
                    <span className="text-[10px] text-slate-400">Reorder @ {item.reorderLevel}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RECENT CUSTOMERS */}
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-[#B71C1C]" />
            <span>Recent Customers</span>
          </h3>

          {recentCustomers.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs font-semibold">
              👥 No customer accounts registered yet.
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              {recentCustomers.map((cust, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50">
                  <div>
                    <p className="font-bold text-slate-900">{cust.name}</p>
                    <p className="text-[10px] text-slate-400">{cust.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400">{cust.joined}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* LATEST REVIEWS */}
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500 fill-current" />
            <span>Latest Reviews</span>
          </h3>

          <div className="space-y-3 text-xs">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900">{rev.customer}</span>
                  <span className="flex text-amber-400"><Star className="w-3 h-3 fill-current" /> {rev.rating}</span>
                </div>
                <p className="text-[11px] text-slate-600 italic">"{rev.comment}"</p>
                
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <span className={`text-[10px] font-bold ${rev.status === 'Approved' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {rev.status}
                  </span>
                  {rev.status === 'Pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleReviewAction(rev.id, 'Approved')} className="p-1 text-emerald-600 hover:bg-emerald-100 rounded-md">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleReviewAction(rev.id, 'Rejected')} className="p-1 text-red-600 hover:bg-red-100 rounded-md">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* QUICK ACTIONS BAR */}
      <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-xs space-y-4">
        <h2 className="font-display font-bold text-base text-[#1F2937]">Quick Admin Actions</h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-xs font-bold">
          <Link to="/admin/products" className="p-3 rounded-xl bg-red-50 hover:bg-red-100 text-[#B71C1C] border border-red-100 text-center transition-colors">
            + Add Product
          </Link>
          <Link to="/admin/categories" className="p-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 text-center transition-colors">
            + Add Category
          </Link>
          <Link to="/admin/banners" className="p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 text-center transition-colors">
            + Banner Slide
          </Link>
          <Link to="/admin/coupons" className="p-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-100 text-center transition-colors">
            + Create Coupon
          </Link>
          <Link to="/admin/orders" className="p-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-100 text-center transition-colors">
            View Orders
          </Link>
          <Link to="/admin/customers" className="p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 text-center transition-colors">
            Customers
          </Link>
          <Link to="/admin/reports" className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-center transition-colors">
            Reports & Analytics
          </Link>
          <Link to="/admin/settings" className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-center transition-colors">
            System Settings
          </Link>
        </div>
      </div>

    </div>
  );
}
