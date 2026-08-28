import React, { useState, useEffect } from 'react';
import { X, Printer, Shield, CheckCircle, FileText } from 'lucide-react';

function amountToWords(num) {
  if (!num || isNaN(num) || num <= 0) return 'Zero Rupees Only';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n) {
    let str = '';
    const numStr = ('000000000' + n).substr(-9);
    const match = numStr.match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!match) return '';

    if (Number(match[1]) !== 0) str += (a[Number(match[1])] || b[match[1][0]] + ' ' + a[match[1][1]]) + 'Crore ';
    if (Number(match[2]) !== 0) str += (a[Number(match[2])] || b[match[2][0]] + ' ' + a[match[2][1]]) + 'Lakh ';
    if (Number(match[3]) !== 0) str += (a[Number(match[3])] || b[match[3][0]] + ' ' + a[match[3][1]]) + 'Thousand ';
    if (Number(match[4]) !== 0) str += (a[Number(match[4])] || b[match[4][0]] + ' ' + a[match[4][1]]) + 'Hundred ';
    if (Number(match[5]) !== 0) {
      if (str !== '') str += 'and ';
      str += (a[Number(match[5])] || b[match[5][0]] + ' ' + a[match[5][1]]);
    }
    return str;
  }
  return (inWords(Math.floor(num)) + 'Rupees Only').trim();
}

export default function InvoiceModal({ isOpen, onClose, orderDetails, order }) {
  const [customLogo, setCustomLogo] = useState('');
  const activeOrder = orderDetails || order;
  const isModalOpen = isOpen !== undefined ? isOpen : !!activeOrder;

  useEffect(() => {
    const logo = localStorage.getItem('karviyam_logo');
    if (logo) setCustomLogo(logo);
  }, [isModalOpen]);

  if (!isModalOpen || !activeOrder) return null;

  const handlePrint = () => {
    console.log('[InvoiceModal] Initiating Tax Invoice Print...');
    const invoiceElem = document.getElementById('printable-invoice-wrapper');

    if (!invoiceElem) {
      console.error('[InvoiceModal] Printable element #printable-invoice-wrapper not found in DOM');
      window.print();
      return;
    }

    try {
      const contentHtml = invoiceElem.outerHTML;
      const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map((s) => s.outerHTML)
        .join('\n');

      const printWin = window.open('', '_blank', 'width=900,height=850');
      if (!printWin) {
        console.warn('[InvoiceModal] Popup window blocked, falling back to window.print()');
        window.print();
        return;
      }

      printWin.document.open();
      printWin.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Tax Invoice - ${invoiceNo}</title>
            <meta charset="utf-8" />
            ${styles}
            <style>
              @page {
                margin: 8mm;
                size: A4 portrait;
              }
              html, body {
                background: #ffffff !important;
                color: #000000 !important;
                margin: 0 !important;
                padding: 10px !important;
                font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              #printable-invoice-wrapper {
                display: block !important;
                visibility: visible !important;
                position: relative !important;
                width: 100% !important;
                max-width: 800px !important;
                margin: 0 auto !important;
                box-shadow: none !important;
                border: 1px solid #000000 !important;
                background: #ffffff !important;
              }
              .print\\:hidden, .no-print {
                display: none !important;
              }
            </style>
          </head>
          <body>
            ${contentHtml}
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.focus();
                  window.print();
                  window.close();
                }, 300);
              };
            </script>
          </body>
        </html>
      `);
      printWin.document.close();
      console.log('[InvoiceModal] Tax Invoice print document created and dispatched cleanly.');
    } catch (err) {
      console.error('[InvoiceModal] Error during print document generation:', err);
      window.print();
    }
  };

  const activeObj = activeOrder || {};
  const invoiceNo = activeObj.invoiceNumber || activeObj.invoiceNo || (activeObj.id ? `KAR-${String(activeObj.id).padStart(6, '0')}` : 'KAR-000001');
  const orderNo = activeObj.trackingNumber || activeObj.orderCode || (activeObj.id ? `KV-ORD-${String(activeObj.id).padStart(6, '0')}` : 'KV-ORD-000001');
  
  const today = new Date();
  const dateFormatted = activeObj.date || activeObj.createdAt
    ? new Date(activeObj.createdAt || today).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : today.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const itemsList = Array.isArray(activeObj.items || activeObj.orderItems) && (activeObj.items || activeObj.orderItems).length > 0
    ? (activeObj.items || activeObj.orderItems)
    : [{ name: 'Karviyam Apparel Item', quantity: 1, price: activeObj.totalAmount || 899 }];

  const totalAmount = Number(activeObj.totalAmount || activeObj.subtotal || 899);
  const taxRate = 18; // 18% GST (9% CGST + 9% SGST)
  const netAmount = Math.round((totalAmount / 1.18) * 100) / 100;
  const taxAmount = Math.round((totalAmount - netAmount) * 100) / 100;
  const cgstAmount = Math.round((taxAmount / 2) * 100) / 100;
  const sgstAmount = Math.round((taxAmount / 2) * 100) / 100;

  const companyName = localStorage.getItem('karviyam_legal_company_name') || localStorage.getItem('karviyam_store_name') || 'Karviyam Ventures Private Limited';
  const sellerAddress = localStorage.getItem('karviyam_address') || 'Karviyam Tower, Park Avenue, Chennai, Tamil Nadu 600001';
  const sellerPhone = localStorage.getItem('karviyam_support_phone') || '+91 98765 43210';
  const sellerEmail = localStorage.getItem('karviyam_support_email') || 'vanakkam@karviyam.com';
  const gstNo = localStorage.getItem('karviyam_gst_no') || '33AAACK1234F1Z9';
  const panNo = localStorage.getItem('karviyam_pan_no') || 'AAACK1234F';
  const stateCode = localStorage.getItem('karviyam_state_code') || '33';
  const signatory = localStorage.getItem('karviyam_signatory_name') || 'Karviyam Operations';

  const customerName = activeObj.customer || activeObj.fullName || activeObj.shippingAddress?.fullName || 'Valued Customer';
  const customerAddress = activeObj.shippingAddress?.addressLine || activeObj.address || sellerAddress;
  const customerCity = activeObj.shippingAddress?.city || activeObj.city || 'Chennai';
  const customerPincode = activeObj.shippingAddress?.pincode || activeObj.pincode || '600001';
  const customerPhone = activeObj.phone || activeObj.shippingAddress?.phone || sellerPhone;
  const customerEmail = activeObj.email || 'customer@karviyam.com';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 bg-slate-900/70 backdrop-blur-xs overflow-hidden print:static print:p-0 print:bg-white print:overflow-visible">
      <div className="bg-white w-full max-w-4xl p-3 sm:p-5 rounded-2xl shadow-2xl border border-slate-200 relative max-h-[96vh] overflow-y-auto print:static print:max-h-none print:p-0 print:shadow-none print:border-0 print:max-w-none print:w-full print:bg-white">
        
        {/* Action Header (Hidden on Print) */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#B71C1C]" />
            <h3 className="font-display font-bold text-sm text-slate-900">Tax Invoice & Bill of Supply</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-[#B71C1C] hover:bg-[#900C0C] text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Tax Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* AMAZON-STYLE INVOICE CONTAINER */}
        <div id="printable-invoice-wrapper" className="border border-slate-400 text-slate-900 font-sans text-xs bg-white p-3 sm:p-4 rounded-lg print:border-black">
          
          {/* Top Label Bar */}
          <div className="flex items-center justify-between border-b border-slate-400 pb-1.5 mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-700">
            <span>Tax Invoice / Bill of Supply / Cash Memo</span>
            <span>(Original for Recipient)</span>
          </div>

          {/* Header Grid: Logo & Seller Info vs Order Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-400 pb-3 mb-3">
            
            {/* Left: Seller Branding & Details */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {customLogo ? (
                  <img src={customLogo} alt="Karviyam Logo" className="h-8 w-auto object-contain max-w-[180px]" />
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#B71C1C] text-white font-black text-lg flex items-center justify-center shadow-sm">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3zm0 4a3 3 0 110 6 3 3 0 010-6zm-4 9.5c0-2 4-3.1 4-3.1s4 1.1 4 3.1V16H8v-0.5z"/>
                      </svg>
                    </div>
                    <span className="font-display font-black text-xl tracking-tight text-[#B71C1C]">
                      KARVIYAM
                    </span>
                  </div>
                )}
              </div>

              <div className="text-[10px] text-slate-700 space-y-0.5">
                <p className="font-bold text-slate-900 text-[11px]">Sold By: {companyName}</p>
                <p>{sellerAddress}</p>
                <p><span className="font-bold">GSTIN:</span> {gstNo} | <span className="font-bold">PAN:</span> {panNo} | <span className="font-bold">State Code:</span> {stateCode}</p>
              </div>
            </div>

            {/* Right: Order & Invoice Details */}
            <div className="text-left sm:text-right text-[10px] text-slate-700 space-y-0.5 bg-slate-50 p-2 rounded border border-slate-200 sm:bg-transparent sm:p-0 sm:border-0">
              <div>
                <span className="text-slate-500 font-bold uppercase text-[9px] mr-1">Invoice No:</span>
                <span className="font-mono font-black text-xs text-slate-900">{invoiceNo}</span>
              </div>
              <p><span className="font-bold text-slate-800">Invoice Date:</span> {dateFormatted}</p>
              <p><span className="font-bold text-slate-800">Order ID:</span> <span className="font-mono font-bold text-[#B71C1C]">{orderNo}</span></p>
              <p><span className="font-bold text-slate-800">Order Date:</span> {dateFormatted}</p>
              <p><span className="font-bold text-slate-800">Payment Status:</span> <span className="text-emerald-700 font-bold">Paid ({orderDetails.paymentMethod || 'Online'})</span></p>
            </div>
          </div>

          {/* Billing & Shipping Address Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-400 pb-3 mb-3 text-[10px]">
            <div>
              <span className="font-bold uppercase text-[9px] text-slate-500 block mb-0.5">Billing Address</span>
              <p className="font-bold text-slate-900 text-[11px]">{customerName}</p>
              <p>{customerAddress}, {customerCity}, Tamil Nadu - {customerPincode}</p>
              <p><span className="font-bold">State Code:</span> {stateCode} | <span className="font-bold">Phone:</span> {customerPhone}</p>
            </div>

            <div className="sm:border-l sm:border-slate-300 sm:pl-4">
              <span className="font-bold uppercase text-[9px] text-slate-500 block mb-0.5">Shipping Address</span>
              <p className="font-bold text-slate-900 text-[11px]">{customerName}</p>
              <p>{customerAddress}, {customerCity}, Tamil Nadu - {customerPincode}</p>
              <p><span className="font-bold">State Code:</span> {stateCode} | <span className="font-bold">Phone:</span> {customerPhone}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto mb-3">
            <table className="w-full text-left text-[10px] border border-slate-400">
              <thead className="bg-slate-100 border-b border-slate-400 font-bold uppercase text-slate-800">
                <tr>
                  <th className="p-1.5 border-r border-slate-400 text-center w-8">Sl.</th>
                  <th className="p-1.5 border-r border-slate-400">Description of Goods</th>
                  <th className="p-1.5 border-r border-slate-400 text-right">Unit Price</th>
                  <th className="p-1.5 border-r border-slate-400 text-center w-10">Qty</th>
                  <th className="p-1.5 border-r border-slate-400 text-right">Net Amount</th>
                  <th className="p-1.5 border-r border-slate-400 text-center">Tax Rate</th>
                  <th className="p-1.5 border-r border-slate-400 text-right">Tax Type</th>
                  <th className="p-1.5 border-r border-slate-400 text-right">Tax Amount</th>
                  <th className="p-1.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {itemsList.map((item, idx) => {
                  const unitPrice = item.priceAtTime || item.price || 0;
                  const qty = item.quantity || 1;
                  const itemTotal = unitPrice * qty;
                  const itemNet = Math.round((itemTotal / 1.18) * 100) / 100;
                  const itemTax = Math.round((itemTotal - itemNet) * 100) / 100;

                  return (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-1.5 border-r border-slate-300 text-center font-bold">{idx + 1}</td>
                      <td className="p-1.5 border-r border-slate-300 font-semibold text-slate-900">
                        {item.productName || item.name}
                        {item.selectedSize && <span className="text-[9px] text-slate-500 block">Size: {item.selectedSize}</span>}
                      </td>
                      <td className="p-1.5 border-r border-slate-300 text-right">₹{unitPrice}</td>
                      <td className="p-1.5 border-r border-slate-300 text-center font-bold">{qty}</td>
                      <td className="p-1.5 border-r border-slate-300 text-right">₹{itemNet}</td>
                      <td className="p-1.5 border-r border-slate-300 text-center font-semibold">18% GST</td>
                      <td className="p-1.5 border-r border-slate-300 text-right text-[9px]">CGST (9%)<br/>SGST (9%)</td>
                      <td className="p-1.5 border-r border-slate-300 text-right font-medium">₹{itemTax}</td>
                      <td className="p-1.5 text-right font-bold text-slate-900">₹{itemTotal}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Subtotals & Amount in Words Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-400 pb-3 mb-3">
            
            {/* Amount in Words */}
            <div className="space-y-1.5">
              <span className="font-bold text-[9px] uppercase text-slate-500 block">Amount in Words</span>
              <p className="font-bold text-slate-900 text-[11px] italic bg-slate-50 p-2 rounded border border-slate-200">
                {amountToWords(totalAmount)}
              </p>
              <div className="text-[9px] text-slate-500 space-y-0.5">
                <p><span className="font-bold text-slate-700">Reverse Charge Tax:</span> No</p>
                <p><span className="font-bold text-slate-700">Shipping Terms:</span> Standard Express Delivery</p>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-1 text-[10px] text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">
              <div className="flex justify-between">
                <span>Total Net Amount:</span>
                <span className="font-bold">₹{netAmount}</span>
              </div>
              <div className="flex justify-between">
                <span>CGST (9%):</span>
                <span>₹{cgstAmount}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST (9%):</span>
                <span>₹{sgstAmount}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Shipping Charges:</span>
                <span className="font-bold">FREE</span>
              </div>
              <div className="flex justify-between font-black text-xs text-slate-900 border-t border-slate-300 pt-1">
                <span>Grand Total:</span>
                <span className="text-[#B71C1C]">₹{totalAmount}</span>
              </div>
            </div>
          </div>

          {/* Signatory & Footer */}
          <div className="flex flex-col sm:flex-row items-end justify-between gap-2">
            <div className="text-[9px] text-slate-500">
              <p className="font-bold text-slate-700">Thank you for shopping on Karviyam!</p>
              <p>For support or returns, email {sellerEmail}</p>
            </div>

            <div className="text-right text-[9px]">
              <p className="font-bold text-slate-900 mb-4">For {companyName}</p>
              <div className="border-t border-slate-400 pt-0.5 font-bold text-slate-700">
                {signatory}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

