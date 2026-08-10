import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboardPage() {
  const [chartPeriod, setChartPeriod] = useState('Monthly'); // 'Daily', 'Weekly', 'Monthly'
  const [reviews, setReviews] = useState([
    { id: 1, customer: 'Ananya Sharma', product: 'Karviyam Cyberpunk Tee', rating: 5, comment: 'Exceptional 240 GSM heavy cotton fabric! Ultra premium fit.', status: 'Pending' },
    { id: 2, customer: 'Karthik Raja', product: 'Apex Stealth Sneakers', rating: 4, comment: 'Very comfortable sole and stylish design.', status: 'Approved' },
  ]);

  const kpiCards = [
    { title: "Today's Sales", value: '₹48,950', change: '+12.4%', period: 'vs yesterday', isPos: true },
    { title: 'Monthly Sales', value: '₹12,45,890', change: '+18.7%', period: 'vs last month', isPos: true },
    { title: 'Total Revenue', value: '₹45,80,000', change: '+24.1%', period: 'vs last year', isPos: true },
    { title: 'Net Profit', value: '₹14,20,500', change: '+15.2%', period: 'margin 31%', isPos: true },
    { title: 'Total Orders', value: '1,245', change: '+15.3%', period: 'orders placed', isPos: true },
    { title: 'Pending Orders', value: '42', change: 'Action Req', period: 'awaiting dispatch', isPos: false },
    { title: 'Active Customers', value: '8,932', change: '+12.5%', period: 'registered users', isPos: true },
    { title: 'Total Products', value: '2,345', change: '+8.2%', period: 'active catalog', isPos: true },
    { title: 'Out of Stock', value: '3 Items', change: 'Alert', period: 'needs restock', isPos: false },
    { title: 'Total Sellers', value: '14 Active', change: 'Verified', period: 'partner vendors', isPos: true },
  ];

  const recentOrders = [
    { id: '#ORD12345', customer: 'Ravi Kumar', products: 'Cyberpunk Tee (x1)', date: '05 May 2026', amount: '₹2,499', payStatus: 'Paid', status: 'Delivered', statusColor: 'bg-emerald-100 text-emerald-800' },
    { id: '#ORD12344', customer: 'Priya Sharma', products: 'Linen Shirt (x1)', date: '05 May 2026', amount: '₹1,999', payStatus: 'Paid', status: 'Shipped', statusColor: 'bg-blue-100 text-blue-800' },
    { id: '#ORD12343', customer: 'Amit Singh', products: 'Apex Sneakers (x1)', date: '04 May 2026', amount: '₹3,299', payStatus: 'COD', status: 'Processing', statusColor: 'bg-amber-100 text-amber-800' },
    { id: '#ORD12342', customer: 'Neha Patel', products: 'Silver Pendant (x1)', date: '04 May 2026', amount: '₹999', payStatus: 'Paid', status: 'Delivered', statusColor: 'bg-emerald-100 text-emerald-800' },
    { id: '#ORD12341', customer: 'Vikram Joshi', products: 'Graphic Hoodie (x1)', date: '03 May 2026', amount: '₹2,149', payStatus: 'Cancelled', status: 'Cancelled', statusColor: 'bg-red-100 text-red-800' },
  ];

  const topProducts = [
    { name: 'boAt Airdopes 131 Pro', category: 'Electronics', image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=150', stock: 45, sold: 1245, revenue: '₹12,44,755', status: 'In Stock' },
    { name: 'Redmi Note 13 Pro 5G', category: 'Smartphones', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=150', stock: 30, sold: 987, revenue: '₹18,72,813', status: 'In Stock' },
    { name: "Puma Men's Running Shoes", category: 'Footwear', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=150', stock: 12, sold: 845, revenue: '₹12,66,655', status: 'Low Stock' },
    { name: 'IFB 8 Kg Washing Machine', category: 'Appliances', image: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=150', stock: 0, sold: 654, revenue: '₹19,59,654', status: 'Out of Stock' },
  ];

  const lowStockAlerts = [
    { name: 'Apex Stealth Black Sneakers', sku: 'KV-SNK-03', stock: 2, reorderLevel: 10 },
    { name: 'Royal Emerald Silver Pendant', sku: 'KV-JWL-04', stock: 3, reorderLevel: 15 },
    { name: 'Vintage Anime Graphic Hoodie', sku: 'KV-HOD-05', stock: 0, reorderLevel: 20 },
  ];

  const recentCustomers = [
    { name: 'Siddharth Verma', email: 'siddharth@example.com', orders: 12, joined: '04 May 2026' },
    { name: 'Meera Nambiar', email: 'meera@example.com', orders: 5, joined: '03 May 2026' },
    { name: 'Arjun Das', email: 'arjun@example.com', orders: 8, joined: '01 May 2026' },
  ];

  const handleReviewAction = (id, newStatus) => {
    setReviews(reviews.map(r => r.id === id ? { ...r, status: newStatus } : r));
    toast.success(`Review ${newStatus.toLowerCase()} successfully!`);
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Dashboard Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
        <div>
          <h1 className="font-display font-black text-2xl text-[#1F2937] tracking-tight">
            Enterprise Control Center
          </h1>
          <p className="text-xs text-slate-500 font-medium">Real-time marketplace analytics, orders & catalog metrics</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => toast.success('Analytics report downloaded!')}
            className="flex items-center gap-2 bg-[#F5F5F5] hover:bg-slate-200 text-[#1F2937] px-4 py-2 rounded-xl text-xs font-bold transition-colors border border-[#E5E7EB]"
          >
            <FileText className="w-4 h-4 text-[#B71C1C]" />
            <span>Export Report</span>
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
            <div className="font-display font-extrabold text-2xl text-[#1F2937] my-1">
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
            <p className="text-xs text-slate-500">Gross transaction volume and monthly growth curves</p>
          </div>

          <div className="flex items-center gap-2 bg-[#F5F5F5] p-1 rounded-xl border border-[#E5E7EB]">
            {['Daily', 'Weekly', 'Monthly'].map((p) => (
              <button
                key={p}
                onClick={() => setChartPeriod(p)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  chartPeriod === p ? 'bg-[#B71C1C] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* SVG Interactive Curve Chart */}
        <div className="w-full h-64 relative pt-4">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 700 200" preserveAspectRatio="none">
            <defs>
              <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#B71C1C" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#B71C1C" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <line x1="0" y1="40" x2="700" y2="40" stroke="#f1f5f9" strokeDasharray="4 4" />
            <line x1="0" y1="90" x2="700" y2="90" stroke="#f1f5f9" strokeDasharray="4 4" />
            <line x1="0" y1="140" x2="700" y2="140" stroke="#f1f5f9" strokeDasharray="4 4" />

            <path d="M 0 140 Q 116 80, 233 100 T 466 110 T 700 40 L 700 200 L 0 200 Z" fill="url(#redGrad)" />
            <path d="M 0 140 Q 116 80, 233 100 T 466 110 T 700 40" fill="none" stroke="#B71C1C" strokeWidth="3" />
            
            <circle cx="233" cy="100" r="4" fill="#B71C1C" stroke="#ffffff" strokeWidth="2" />
            <circle cx="466" cy="110" r="4" fill="#B71C1C" stroke="#ffffff" strokeWidth="2" />
            <circle cx="700" cy="40" r="5" fill="#B71C1C" stroke="#ffffff" strokeWidth="2" />
          </svg>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 font-medium pt-2 border-t border-slate-100">
          <span>Week 1</span>
          <span>Week 2</span>
          <span>Week 3</span>
          <span>Week 4</span>
        </div>
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
          </div>
        </div>

        {/* TOP SELLING PRODUCTS */}
        <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-base text-[#1F2937]">Top Selling Products</h2>
              <Link to="/admin/products" className="text-xs font-bold text-[#B71C1C] hover:underline flex items-center gap-1">
                <span>All Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 font-bold border-b border-slate-100">
                    <th className="pb-3">Product</th>
                    <th className="pb-3 text-center">Sold</th>
                    <th className="pb-3 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topProducts.map((p, i) => (
                    <tr key={i} className="hover:bg-slate-50/80">
                      <td className="py-2.5 flex items-center gap-3">
                        <img src={p.image} alt="" className="w-8 h-8 rounded-lg object-cover border border-slate-200" />
                        <div>
                          <p className="font-bold text-slate-900 line-clamp-1">{p.name}</p>
                          <p className="text-[10px] text-slate-400">{p.category}</p>
                        </div>
                      </td>
                      <td className="py-2.5 text-center font-semibold text-slate-700">{p.sold}</td>
                      <td className="py-2.5 text-right font-bold text-slate-900">{p.revenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
              Action Req
            </span>
          </div>

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
        </div>

        {/* RECENT CUSTOMERS */}
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-[#B71C1C]" />
            <span>Recent Customers</span>
          </h3>

          <div className="space-y-3 text-xs">
            {recentCustomers.map((cust, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50">
                <div>
                  <p className="font-bold text-slate-900">{cust.name}</p>
                  <p className="text-[10px] text-slate-400">{cust.email}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-[#B71C1C] text-xs block">{cust.orders} Orders</span>
                  <span className="text-[10px] text-slate-400">{cust.joined}</span>
                </div>
              </div>
            ))}
          </div>
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
            + Add Banner
          </Link>
          <Link to="/admin/coupons" className="p-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-100 text-center transition-colors">
            + Create Coupon
          </Link>
          <Link to="/admin/brands" className="p-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-100 text-center transition-colors">
            + Create Brand
          </Link>
          <Link to="/admin/orders" className="p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 text-center transition-colors">
            Manage Orders
          </Link>
          <Link to="/admin/reports" className="p-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-100 text-center transition-colors">
            Generate Report
          </Link>
          <Link to="/admin/settings" className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-center transition-colors">
            Site Settings
          </Link>
        </div>
      </div>

    </div>
  );
}
