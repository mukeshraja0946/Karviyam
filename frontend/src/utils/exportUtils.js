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

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; color: #1e293b; }
          .header { display: flex; justify-content: space-between; align-items: center; border-b: 2px solid #B71C1C; padding-bottom: 12px; margin-bottom: 20px; }
          .title { font-size: 20px; font-weight: 800; color: #B71C1C; margin: 0; }
          .subtitle { font-size: 11px; color: #64748b; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 11px; }
          th { background: #f8fafc; color: #475569; font-weight: 700; text-align: left; padding: 8px 12px; border: 1px solid #e2e8f0; text-transform: uppercase; font-size: 10px; }
          td { padding: 8px 12px; border: 1px solid #e2e8f0; }
          tr:nth-child(even) { background: #f8fafc; }
          .footer { margin-top: 30px; font-size: 10px; color: #94a3b8; text-align: right; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">KARVIYAM ENTERPRISE REPORT</h1>
            <p class="subtitle">${title} • Generated on ${new Date().toLocaleString()}</p>
          </div>
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
                  return `<td>${val !== null && val !== undefined ? val : ''}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">Karviyam System Report • Confidential</div>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
