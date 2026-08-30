// Reusable Export Utility for CSV, Excel (.xlsx), and PDF formats

export const exportToCSV = (filename, headers, data) => {
  if (!data || !data.length) return;

  const headerRow = headers.map(h => `"${h.label.replace(/"/g, '""')}"`).join(',');
  const rows = data.map(item => {
    return headers.map(h => {
      let val = h.accessor ? (typeof h.accessor === 'function' ? h.accessor(item) : item[h.accessor]) : '';
      if (val === null || val === undefined) val = '';
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headerRow, ...rows].join('\r\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filename}_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToExcel = (filename, headers, data) => {
  if (!data || !data.length) return;

  let tableHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta charset="utf-8" />
    <!--[if gte mso 9]>
    <xml>
      <x:ExcelWorkbook>
        <x:ExcelWorksheets>
          <x:ExcelWorksheet>
            <x:Name>Sheet1</x:Name>
            <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
          </x:ExcelWorksheet>
        </x:ExcelWorksheets>
      </x:ExcelWorkbook>
    </xml>
    <![endif]-->
    <style>
      th { background-color: #B71C1C; color: #ffffff; font-weight: bold; padding: 8px; border: 1px solid #cccccc; }
      td { padding: 6px; border: 1px solid #eeeeee; }
    </style>
  </head>
  <body>
    <table>
      <thead>
        <tr>
          ${headers.map(h => `<th>${h.label}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${data.map(item => `
          <tr>
            ${headers.map(h => {
              let val = h.accessor ? (typeof h.accessor === 'function' ? h.accessor(item) : item[h.accessor]) : '';
              return `<td>${val !== null && val !== undefined ? val : ''}</td>`;
            }).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  </body>
  </html>`;

  const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${Date.now()}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = (filename, title, headers, data) => {
  if (!data || !data.length) return;

  const storedLogo = typeof localStorage !== 'undefined' ? localStorage.getItem('karviyam_logo') : null;
  const logoHtml = storedLogo
    ? `<img src="${storedLogo}" alt="Logo" style="height: 42px; width: auto; object-fit: contain; margin-right: 14px; vertical-align: middle;" />`
    : `<div style="width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #D32F2F, #B71C1C); display: inline-flex; align-items: center; justify-content: center; color: #ffffff; margin-right: 14px; vertical-align: middle;">
        <svg style="width: 24px; height: 24px; fill: currentColor;" viewBox="0 0 24 24">
          <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3zm0 4a3 3 0 110 6 3 3 0 010-6zm-4 9.5c0-2 4-3.1 4-3.1s4 1.1 4 3.1V16H8v-0.5z"/>
        </svg>
       </div>`;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - Karviyam Enterprise</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          body { font-family: 'Inter', system-ui, -apple-system, sans-serif; padding: 20px; color: #0f172a; background: #ffffff; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #B71C1C; padding-bottom: 14px; margin-bottom: 16px; }
          .brand-box { display: flex; align-items: center; }
          .logo-text { font-size: 22px; font-weight: 900; color: #B71C1C; letter-spacing: -0.5px; line-height: 1.1; }
          .subtitle { font-size: 12px; color: #64748b; margin-top: 3px; font-weight: 600; }
          .meta-bar { display: flex; justify-content: space-between; font-size: 11px; color: #334155; background: #f8fafc; padding: 8px 14px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
          th { background: #0f172a; color: #ffffff; font-weight: 700; text-align: left; padding: 9px 12px; border: 1px solid #1e293b; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
          td { padding: 8px 12px; border: 1px solid #e2e8f0; color: #334155; }
          tr:nth-child(even) { background: #f8fafc; }
          .img-cell { display: flex; align-items: center; gap: 8px; }
          .img-thumb { width: 34px; height: 34px; object-fit: cover; border-radius: 6px; border: 1px solid #cbd5e1; }
          .img-link { color: #B71C1C; font-weight: 700; text-decoration: underline; font-size: 10px; word-break: break-all; }
          .footer { margin-top: 24px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          @media print {
            body { padding: 0; }
            th { background: #0f172a !important; color: #ffffff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            tr:nth-child(even) { background: #f8fafc !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand-box">
            ${logoHtml}
            <div>
              <div class="logo-text">KARVIYAM ENTERPRISE</div>
              <div class="subtitle">${title}</div>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12px; font-weight: 800; color: #B71C1C; text-transform: uppercase;">Official System Report</div>
            <div style="font-size: 10px; color: #64748b;">${new Date().toLocaleString()}</div>
          </div>
        </div>
        <div class="meta-bar">
          <div><strong>Total Records:</strong> ${data.length} Items</div>
          <div><strong>Format:</strong> PDF Document</div>
          <div><strong>Generated By:</strong> Karviyam Admin Panel</div>
        </div>
        <table>
          <thead>
            <tr>
              ${headers.map(h => `<th>${h.label}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(item => `
              <tr>
                ${headers.map(h => {
                  let val = h.accessor ? (typeof h.accessor === 'function' ? h.accessor(item) : item[h.accessor]) : '';
                  if (val === null || val === undefined) val = '';
                  const strVal = String(val).trim();
                  const isImageVal = strVal.startsWith('http://') || strVal.startsWith('https://') || strVal.startsWith('/uploads/') || /\.(jpg|jpeg|png|webp|avif|gif)(\?.*)?$/i.test(strVal);
                  
                  if (isImageVal) {
                    const fullUrl = strVal.startsWith('http') ? strVal : `${window.location.origin}${strVal.startsWith('/') ? strVal : '/' + strVal}`;
                    return `<td>
                      <div class="img-cell">
                        <img src="${fullUrl}" alt="Product" class="img-thumb" onerror="this.style.display='none'" />
                        <a href="${fullUrl}" target="_blank" class="img-link">${fullUrl}</a>
                      </div>
                    </td>`;
                  }
                  return `<td>${strVal}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          <span>Karviyam Retail Operations System • Confidential</span>
          <span>Official System Document</span>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
