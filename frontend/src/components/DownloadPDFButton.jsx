import html2pdf from 'html2pdf.js';

export default function DownloadPDFButton({ report }) {
  if (!report) return null;

  const populateTemplate = () => {
    const coverage = report.coverage || { matched: [], close: [], missing: [] };

    const coverageSection = (entries, type) => {
      const count = entries.length;
      return `
        <b><h4 style="margin:8px 0;">${type.charAt(0).toUpperCase() + type.slice(1)} (${count})</h4></b>
        ${
          count === 0
            ? `<p>No ${type} entries</p>`
            : `
        <table style="width:100%; border-collapse: collapse; margin-bottom:10px;">
          <thead>
            <tr style="background:#f3f4f6;">
              <th style="text-align:left; padding:4px 6px; border:1px solid #ddd;">Target</th>
              <th style="text-align:left; padding:4px 6px; border:1px solid #ddd;">${type === 'matched' ? 'Matched With' : 'Candidate'}</th>
              <th style="text-align:left; padding:4px 6px; border:1px solid #ddd;">Confidence</th>
            </tr>
          </thead>
          <tbody>
            ${entries
              .map(
                (e) => `
              <tr>
                <td style="padding:4px 6px; border:1px solid #ddd;">${e.target}</td>
                <td style="padding:4px 6px; border:1px solid #ddd;">${e.matchedWith || e.candidate || '-'}</td>
                <td style="padding:4px 6px; border:1px solid #ddd;">${((e.confidence || 0) * 100).toFixed(0)}%</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>`
        }
      `;
    };

    let scoresHTML = '';
    if (report.scores) {
      for (const [key, value] of Object.entries(report.scores)) {
        if (key === 'readiness') continue;
        scoresHTML += `
          <div style="margin:4px 0;">
            <strong>${key}:</strong>
            <div style="background:#e2e8f0; border-radius:8px; overflow:hidden; height:16px; width:100%;">
              <div style="width:${value}%; background:#4f46e5; height:100%;"></div>
            </div>
          </div>
        `;
      }
    }

    const ruleLabels = {
      TOTALS_BALANCE: 'Totals Balance Check',
      LINE_MATH: 'Line Math Check',
      DATE_ISO: 'Date ISO Format',
      CURRENCY_ALLOWED: 'Allowed Currency',
      TRN_PRESENT: 'Transaction Present',
    };

    let rulesHTML = '';
    if (report.ruleFindings) {
      const groupedRules = report.ruleFindings.reduce((acc, r) => {
        if (!acc[r.rule]) acc[r.rule] = [];
        acc[r.rule].push(r);
        return acc;
      }, {});

      for (const [rule, items] of Object.entries(groupedRules)) {
        const label = ruleLabels[rule] || rule;
        const hasFailed = items.some((r) => !r.ok);

        if (hasFailed) {
          rulesHTML += `<div style="margin:4px 0; padding:4px; background:#fde2e2; border-radius:5px;">
            <strong>${label} (Failed)</strong>
            <ul style="margin:2px 0; padding-left:16px;">
              ${items
                .filter((r) => !r.ok)
                .map((r) => {
                  if (
                    r.line !== undefined &&
                    r.expected !== undefined &&
                    r.got !== undefined
                  )
                    return `<li>Line ${r.line}: expected ${r.expected}, got ${r.got}</li>`;
                  if (r.value !== undefined)
                    return `<li>Value: ${r.value}</li>`;
                  return `<li>Failed</li>`;
                })
                .join('')}
            </ul>
          </div>`;
        } else {
          rulesHTML += `<div style="margin:4px 0; padding:4px; background:#d4f7d4; border-radius:5px;">
            <strong>${label} (Passed)</strong>
          </div>`;
        }
      }
    }

    return `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color:#000; margin:20px; }
            h2,h3,h4 { margin:6px 0; }
          </style>
        </head>
        <body>
          <b><h2>Shared Report: ${report.reportId || report._id}</h2></b>
          
          <b><h3>Coverage</h3></b>
          <b> ${`Total Found: ${coverage.matched.length + coverage.close.length + coverage.missing.length}`} </b>
          ${coverageSection(coverage.matched, 'matched')}
          ${coverageSection(coverage.close, 'close')}
          ${coverageSection(coverage.missing, 'missing')}
          
          <h3>Scores</h3>
          ${scoresHTML}
          
          <h3>Rule Findings</h3>
          ${rulesHTML}
        </body>
      </html>
    `;
  };

  const handleDownload = () => {
    const htmlContent = populateTemplate();
    if (!htmlContent) return;

    const opt = {
      margin: 0.5,
      filename: `report_${report.reportId || report._id || 'analysis'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
    };

    html2pdf().set(opt).from(htmlContent).save();
  };

  return (
    <button
      className="bg-[#9c27b0] text-white px-4 py-2 rounded hover:bg-[#740d86] cursor-pointer"
      onClick={handleDownload}
    >
      Download PDF
    </button>
  );
}
