import React, { useState } from 'react';
import { BarChart3, FileText, Download, Calendar, RotateCcw, Edit2, Trash2, Plus, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const INITIAL_REPORT_DATA = {
  Sales: {
    headers: ['Period / Date', 'Total Orders', 'Gross Amount', 'Discounts Applied', 'Net Revenue'],
    rows: [
      ['05 May 2026', '42 Orders', '₹48,950', '-₹4,200', '₹44,750'],
      ['04 May 2026', '38 Orders', '₹42,100', '-₹3,800', '₹38,300'],
      ['03 May 2026', '51 Orders', '₹61,400', '-₹5,100', '₹56,300'],
      ['02 May 2026', '29 Orders', '₹33,800', '-₹2,900', '₹30,900'],
      ['01 May 2026', '45 Orders', '₹52,000', '-₹4,500', '₹47,500'],
    ],
    summary: [
      { title: 'Gross Revenue', value: '₹12,45,890' },
      { title: 'Total Taxes Collected (GST 18%)', value: '₹2,24,260' },
      { title: 'Net Completed Orders', value: '1,120' },
      { title: 'Total Refunds Processed', value: '₹14,500' },
    ]
  },
  Revenue: {
    headers: ['Category / Stream', 'Units Sold', 'Gross Sales', 'Platform Fee', 'Net Profit Margin'],
    rows: [
      ['Streetwear Apparel', '640 Units', '₹6,40,000', '-₹32,000', '₹6,08,000'],
      ['925 Sterling Jewellery', '320 Units', '₹4,80,000', '-₹24,000', '₹4,56,000'],
      ['Footwear & Sneakers', '160 Units', '₹2,40,000', '-₹12,000', '₹2,28,000'],
    ],
    summary: [
      { title: 'Total Revenue', value: '₹13,60,000' },
      { title: 'Gross Profit Margin', value: '93.5%' },
      { title: 'Avg Order Value', value: '₹1,214' },
      { title: 'Net Commission', value: '₹68,000' },
    ]
  },
  Tax: {
    headers: ['Tax Slab', 'Taxable Turnover', 'CGST (9%)', 'SGST (9%)', 'Total GST Liability'],
    rows: [
      ['GST 18% Standard', '₹10,50,000', '₹94,500', '₹94,500', '₹1,89,000'],
      ['GST 12% Reduced', '₹1,95,890', '₹11,753', '₹11,753', '₹23,506'],
    ],
    summary: [
      { title: 'Total Taxable Turnover', value: '₹12,45,890' },
      { title: 'Total CGST', value: '₹1,06,253' },
      { title: 'Total SGST', value: '₹1,06,253' },
      { title: 'Total GST Paid', value: '₹2,12,506' },
    ]
  },
  Inventory: {
    headers: ['Product Name & SKU', 'Category', 'Current Stock', 'Reorder Level', 'Stock Valuation'],
    rows: [
      ['Karviyam Cyberpunk Tee (KV-TS-01)', 'Apparel', '145 Units', '20 Units', '₹1,45,000'],
      ['Royal Emerald Silver Pendant (KV-JW-02)', 'Jewellery', '82 Units', '15 Units', '₹2,46,000'],
      ['Apex Stealth Sneakers (KV-FW-03)', 'Footwear', '34 Units', '10 Units', '₹1,36,000'],
    ],
    summary: [
      { title: 'Total Active SKUs', value: '48 SKUs' },
      { title: 'Total Stock Quantity', value: '1,840 Items' },
      { title: 'Total Inventory Value', value: '₹18,50,000' },
      { title: 'Low Stock Alerts', value: '2 Items' },
    ]
  },
  Customers: {
    headers: ['Customer Segment', 'Total Accounts', 'Active Buyers', 'Repeat Order Rate', 'Total Spent'],
    rows: [
      ['VIP Loyal Buyers', '180 Users', '165 Users', '84%', '₹6,40,000'],
      ['Regular Customers', '540 Users', '420 Users', '45%', '₹4,50,000'],
      ['New Signups', '400 Users', '280 Users', '18%', '₹1,55,890'],
    ],
    summary: [
      { title: 'Total Registered Customers', value: '1,120 Accounts' },
      { title: 'Active Monthly Buyers', value: '865 Buyers' },
      { title: 'Repeat Purchase Rate', value: '48.5%' },
      { title: 'Customer Retention Rate', value: '76.2%' },
    ]
  }
};

const ZERO_REPORT_DATA = {
  Sales: {
    headers: ['Period / Date', 'Total Orders', 'Gross Amount', 'Discounts Applied', 'Net Revenue'],
    rows: [],
    summary: [
      { title: 'Gross Revenue', value: '₹0' },
      { title: 'Total Taxes Collected (GST 18%)', value: '₹0' },
      { title: 'Net Completed Orders', value: '0' },
      { title: 'Total Refunds Processed', value: '₹0' },
    ]
  },
  Revenue: {
    headers: ['Category / Stream', 'Units Sold', 'Gross Sales', 'Platform Fee', 'Net Profit Margin'],
    rows: [],
    summary: [
      { title: 'Total Revenue', value: '₹0' },
      { title: 'Gross Profit Margin', value: '0%' },
      { title: 'Avg Order Value', value: '₹0' },
      { title: 'Net Commission', value: '₹0' },
    ]
  },
  Tax: {
    headers: ['Tax Slab', 'Taxable Turnover', 'CGST (9%)', 'SGST (9%)', 'Total GST Liability'],
    rows: [],
    summary: [
      { title: 'Total Taxable Turnover', value: '₹0' },
      { title: 'Total CGST', value: '₹0' },
      { title: 'Total SGST', value: '₹0' },
      { title: 'Total GST Paid', value: '₹0' },
    ]
  },
  Inventory: {
    headers: ['Product Name & SKU', 'Category', 'Current Stock', 'Reorder Level', 'Stock Valuation'],
    rows: [],
    summary: [
      { title: 'Total Active SKUs', value: '0 SKUs' },
      { title: 'Total Stock Quantity', value: '0 Items' },
      { title: 'Total Inventory Value', value: '₹0' },
      { title: 'Low Stock Alerts', value: '0 Items' },
    ]
  },
  Customers: {
    headers: ['Customer Segment', 'Total Accounts', 'Active Buyers', 'Repeat Order Rate', 'Total Spent'],
    rows: [],
    summary: [
      { title: 'Total Registered Customers', value: '0 Accounts' },
      { title: 'Active Monthly Buyers', value: '0 Buyers' },
      { title: 'Repeat Purchase Rate', value: '0%' },
      { title: 'Customer Retention Rate', value: '0%' },
    ]
  }
};

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState('Sales');
  const [dateRange, setDateRange] = useState('This Month');

  const [reportData, setReportData] = useState(() => {
    try {
      const saved = localStorage.getItem('karviyam_admin_reports_data');
      return saved ? JSON.parse(saved) : INITIAL_REPORT_DATA;
    } catch (e) {
      return INITIAL_REPORT_DATA;
    }
  });

  // Modal State for Adding/Editing Rows
  const [rowModalOpen, setRowModalOpen] = useState(false);
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [editRowValues, setEditRowValues] = useState([]);

  const activeData = reportData[reportType] || ZERO_REPORT_DATA[reportType] || ZERO_REPORT_DATA.Sales;

  const saveReportData = (newData) => {
    setReportData(newData);
    try {
      localStorage.setItem('karviyam_admin_reports_data', JSON.stringify(newData));
    } catch (e) {}
  };

  const handleResetData = () => {
    if (!window.confirm('Reset all reports metrics to 0 and clear all data entries?')) return;
    saveReportData(ZERO_REPORT_DATA);
    toast.success('Reports reset! All metrics cleared to 0.');
  };

  const handleRestoreInitialDefaults = () => {
    if (!window.confirm('Restore initial sample report metrics and sample data?')) return;
    saveReportData(INITIAL_REPORT_DATA);
    toast.success('Sample report data restored!');
  };

  const handleOpenAddRow = () => {
    setEditingRowIndex(null);
    setEditRowValues(new Array(activeData.headers.length).fill(''));
    setRowModalOpen(true);
  };

  const handleOpenEditRow = (rIdx, rowValues) => {
    setEditingRowIndex(rIdx);
    setEditRowValues([...rowValues]);
    setRowModalOpen(true);
  };

  const handleDeleteRow = (rIdx) => {
    if (!window.confirm('Are you sure you want to delete this report row?')) return;
    const currentTab = reportData[reportType] || ZERO_REPORT_DATA[reportType];
    const newRows = currentTab.rows.filter((_, idx) => idx !== rIdx);
    
    const updated = {
      ...reportData,
      [reportType]: {
        ...currentTab,
        rows: newRows
      }
    };
    saveReportData(updated);
    toast.success('Report row deleted successfully!');
  };

  const handleSaveRowSubmit = (e) => {
    e.preventDefault();
    const currentTab = reportData[reportType] || ZERO_REPORT_DATA[reportType];
    let newRows = [...currentTab.rows];

    if (editingRowIndex !== null) {
      newRows[editingRowIndex] = editRowValues;
    } else {
      newRows.unshift(editRowValues);
    }

    const updated = {
      ...reportData,
      [reportType]: {
        ...currentTab,
        rows: newRows
      }
    };

    saveReportData(updated);
    toast.success(editingRowIndex !== null ? 'Report entry updated successfully!' : 'New report entry added successfully!');
    setRowModalOpen(false);
  };

  // Export PDF functionality via printable document
  const handleExportPDF = () => {
    try {
      const customLogo = localStorage.getItem('karviyam_logo');
      const logoHtml = customLogo
        ? `<img src="${customLogo}" style="height: 44px; max-width: 180px; object-fit: contain;" />`
        : `<svg width="42" height="42" viewBox="0 0 100 100">
            <path d="M50 5 L85 25 L85 75 L50 95 L15 75 L15 25 Z" fill="#B71C1C" />
            <path d="M50 15 L75 30 L75 70 L50 85 L25 70 L25 30 Z" fill="#8E0000" />
            <circle cx="50" cy="50" r="15" fill="#FFFFFF" />
            <path d="M50 40 L58 55 L42 55 Z" fill="#B71C1C" />
          </svg>`;

      const printWin = window.open('', '_blank', 'width=900,height=850');
      if (!printWin) {
        toast.error('Popup window blocked! Please allow popups to export PDF.');
        return;
      }

      const rowsHtml = activeData.rows.length > 0
        ? activeData.rows
          .map(
            (row) => `
            <tr>
              ${row.map((cell) => `<td style="padding: 10px; border-bottom: 1px solid #E2E8F0;">${cell}</td>`).join('')}
            </tr>`
          )
          .join('')
        : `<tr><td colSpan="${activeData.headers.length}" style="padding: 16px; text-align: center; color: #94A3B8;">No data records available (All values 0).</td></tr>`;

      const summaryHtml = activeData.summary
        .map(
          (s) => `
          <div class="summary-card">
            <div class="summary-label">${s.title}</div>
            <div class="summary-val">${s.value}</div>
          </div>`
        )
        .join('');

      toast.success("Opening Print Preview...", { duration: 3000 });

      printWin.document.open();
      printWin.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Karviyam ${reportType} Report (${dateRange})</title>
            <style>
              @page { margin: 0; size: A4 portrait; }
              *, *:before, *:after { box-sizing: border-box; }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                height: 100% !important;
                background: #ffffff !important;
                color: #0F172A !important;
                font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .report-wrapper {
                min-height: 98vh;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                padding: 16mm 18mm;
                box-sizing: border-box;
              }
              .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #B71C1C; padding-bottom: 16px; margin-bottom: 24px; }
              .header-brand { display: flex; align-items: center; gap: 16px; }
              .title { font-size: 26px; font-weight: 900; color: #B71C1C; margin: 0; letter-spacing: -0.5px; }
              .subtitle { font-size: 13px; color: #475569; margin-top: 5px; font-weight: 600; }
              .summary-grid { display: grid; grid-template-cols: repeat(2, 1fr); gap: 16px; margin-bottom: 28px; }
              .summary-card { background: #F8FAFC; border: 1.5px solid #E2E8F0; padding: 18px 20px; border-radius: 12px; }
              .summary-label { font-size: 11px; color: #64748B; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
              .summary-val { font-size: 24px; color: #0F172A; font-weight: 900; margin-top: 6px; }
              .section-title { font-size: 16px; font-weight: 800; color: #0F172A; margin-bottom: 14px; margin-top: 8px; }
              .table-wrapper { flex: 1; margin-bottom: 24px; }
              table { width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; }
              th { background: #F1F5F9; color: #334155; text-align: left; padding: 14px 16px; font-weight: 800; text-transform: uppercase; font-size: 11px; border-bottom: 2px solid #CBD5E1; }
              td { padding: 14px 16px; border-bottom: 1px solid #E2E8F0; font-weight: 500; }
              .footer { margin-top: auto; font-size: 11px; color: #94A3B8; border-top: 1.5px solid #E2E8F0; padding-top: 14px; text-align: justify; }
            </style>
          </head>
          <body>
            <div class="report-wrapper">
              <div>
                <div class="header">
                  <div class="header-brand">
                    ${logoHtml}
                    <div>
                      <h1 class="title">KARVIYAM ENTERPRISE REPORTS</h1>
                      <div class="subtitle">${reportType} Performance Analysis • Period: ${dateRange} • Generated: ${new Date().toLocaleDateString('en-IN')}</div>
                    </div>
                  </div>
                </div>

                <div class="summary-grid">
                  ${summaryHtml}
                </div>

                <div class="table-wrapper">
                  <h3 class="section-title">Detailed Breakdown Data (${dateRange})</h3>
                  <table>
                    <thead>
                      <tr>
                        ${activeData.headers.map((h) => `<th>${h}</th>`).join('')}
                      </tr>
                    </thead>
                    <tbody>
                      ${rowsHtml}
                    </tbody>
                  </table>
                </div>
              </div>

              <div class="footer">
                Confidential report generated by Karviyam Enterprise Admin Suite. For internal business & audit purposes only.
              </div>
            </div>

            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  window.close();
                }, 300);
              };
            </script>
          </body>
        </html>
      `);
      printWin.document.close();
      toast.success(`${reportType} PDF report generated successfully!`);
    } catch (e) {
      toast.error('Failed to export PDF');
    }
  };

  // Export Excel CSV file download
  const handleExportExcel = () => {
    try {
      const csvRows = [];
      csvRows.push([`Karviyam Enterprise ${reportType} Report (${dateRange})`]);
      csvRows.push([`Generated On: ${new Date().toLocaleString()}`]);
      csvRows.push([]);

      csvRows.push(['Metric Title', 'Value']);
      activeData.summary.forEach((s) => {
        csvRows.push([`"${s.title}"`, `"${s.value}"`]);
      });
      csvRows.push([]);

      csvRows.push(activeData.headers.map((h) => `"${h}"`));
      if (activeData.rows.length > 0) {
        activeData.rows.forEach((r) => {
          csvRows.push(r.map((cell) => `"${cell}"`));
        });
      } else {
        csvRows.push(['No data rows available']);
      }

      const csvString = csvRows.map((e) => e.join(',')).join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Karviyam_${reportType}_Report_${dateRange.replace(' ', '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`${reportType} Report exported to Excel (.csv) successfully!`);
    } catch (e) {
      toast.error('Failed to export Excel file');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-[#B71C1C]" />
            <span>Reports & Analytics Center</span>
          </h1>
          <p className="text-xs text-slate-500">Generate, customize, and export financial, tax, inventory, and sales performance reports</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleResetData}
            className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-[#B71C1C] px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border border-red-200 cursor-pointer shadow-xs"
            title="Reset All Metrics and Rows to 0"
          >
            <RotateCcw className="w-4 h-4 text-[#B71C1C]" />
            <span>Reset All to 0</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-[#B71C1C] hover:bg-[#900C0C] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Report Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="font-bold text-slate-700 shrink-0">Report Type:</span>
          {['Sales', 'Revenue', 'Tax', 'Inventory', 'Customers'].map((t) => (
            <button
              key={t}
              onClick={() => setReportType(t)}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                reportType === t ? 'bg-[#B71C1C] text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRestoreInitialDefaults}
            className="text-[11px] font-bold text-slate-500 hover:text-slate-800 underline underline-offset-2 mr-2 cursor-pointer"
          >
            Restore Sample Data
          </button>
          <Calendar className="w-4 h-4 text-slate-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-bold outline-none cursor-pointer"
          >
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
            <option value="This Year">This Year</option>
          </select>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {activeData.summary.map((item, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase text-slate-400">{item.title}</span>
            <div className="font-display font-extrabold text-2xl text-slate-900 mt-1">{item.value}</div>
          </div>
        ))}
      </div>

      {/* Breakdown Report Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base">{reportType} Breakdown ({dateRange})</h3>
          <button
            onClick={handleOpenAddRow}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-black text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Add Report Entry</span>
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
              <tr>
                {activeData.headers.map((h, i) => (
                  <th key={i} className="p-3">
                    {h}
                  </th>
                ))}
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeData.rows.length === 0 ? (
                <tr>
                  <td colSpan={activeData.headers.length + 1} className="p-8 text-center text-slate-400 italic font-medium">
                    All metrics reset to 0. Click "Add Report Entry" to create a new record.
                  </td>
                </tr>
              ) : (
                activeData.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className={`p-3 ${
                          cIdx === 0
                            ? 'font-bold text-slate-900'
                            : cIdx === row.length - 1
                            ? 'font-black text-[#B71C1C]'
                            : 'text-slate-700'
                        }`}
                      >
                        {cell}
                      </td>
                    ))}
                    <td className="p-3 text-right whitespace-nowrap space-x-1">
                      <button
                        onClick={() => handleOpenEditRow(rIdx, row)}
                        className="p-1.5 text-slate-500 hover:text-[#B71C1C] hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Row"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRow(rIdx)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Report Row Modal */}
      {rowModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg p-6 rounded-3xl shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingRowIndex !== null ? `Edit ${reportType} Entry` : `Add New ${reportType} Entry`}
              </h3>
              <button onClick={() => setRowModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRowSubmit} className="space-y-3.5 text-xs">
              {activeData.headers.map((h, i) => (
                <div key={i}>
                  <label className="block font-bold text-slate-700 mb-1">{h} *</label>
                  <input
                    type="text"
                    required
                    value={editRowValues[i] || ''}
                    onChange={(e) => {
                      const updated = [...editRowValues];
                      updated[i] = e.target.value;
                      setEditRowValues(updated);
                    }}
                    placeholder={`Enter ${h}`}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none focus:border-[#B71C1C] font-medium text-slate-800"
                  />
                </div>
              ))}

              <div className="flex gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setRowModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#B71C1C] hover:bg-[#900C0C] text-white py-2.5 rounded-xl font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingRowIndex !== null ? 'Save Changes' : 'Add Entry'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
