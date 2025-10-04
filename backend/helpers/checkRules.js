export function checkRules(dataRows, coverage) {
  if (!coverage || typeof coverage !== 'object') {
    console.error('checkRules: coverage is invalid!', coverage);
    coverage = { matched: [], close: [], missing: [] };
  }

  // Flatten coverage for easy lookup
  const coverageDetails = [];

  (coverage.matched || []).forEach((item) => {
    coverageDetails.push({
      schemaKey: item.target,
      matchedWith: item.matchedWith,
      confidence: item.confidence,
      status: 'matched',
    });
  });

  (coverage.close || []).forEach((item) => {
    coverageDetails.push({
      schemaKey: item.target,
      matchedWith: item.candidate,
      confidence: item.confidence,
      status: 'close',
    });
  });

  (coverage.missing || []).forEach((schemaKey) => {
    coverageDetails.push({ schemaKey, status: 'missing' });
  });

  const rulesResults = {
    TOTALS_BALANCE: [],
    LINE_MATH: [],
    DATE_ISO: [],
    CURRENCY_ALLOWED: [],
    TRN_PRESENT: [],
  };

  const getDataKey = (schemaKey, coverageDetails, row) => {
    row = row || {};
    const match = coverageDetails.find(
      (d) =>
        d.schemaKey === schemaKey &&
        (d.status === 'matched' || d.status === 'close')
    );
    if (!match) return null;
    const candidate = match.matchedWith || schemaKey;
    return row.hasOwnProperty(candidate) ? candidate : null;
  };

  dataRows.forEach((row, rowIndex) => {
    // --- TOTALS_BALANCE ---
    const totalKey = getDataKey('invoice.total_excl_vat', coverageDetails, row);
    const vatKey = getDataKey('invoice.vat_amount', coverageDetails, row);
    const grandKey = getDataKey('invoice.total_incl_vat', coverageDetails, row);
    if (totalKey && vatKey && grandKey) {
      const total = parseFloat(row[totalKey]) || 0;
      const vat = parseFloat(row[vatKey]) || 0;
      const grand = parseFloat(row[grandKey]) || 0;
      if (Math.abs(total + vat - grand) > 0.01) {
        rulesResults.TOTALS_BALANCE.push({
          line: rowIndex + 1,
          expected: total + vat,
          got: grand,
        });
      }
    } else {
      rulesResults.TOTALS_BALANCE.push({
        line: rowIndex + 1,
        error: 'Missing keys',
      });
    }

    // --- LINE_MATH ---
    const qtyKey = getDataKey('lines[].qty', coverageDetails, row);
    const priceKey = getDataKey('lines[].unit_price', coverageDetails, row);
    const lineTotalKey = getDataKey('lines[].line_total', coverageDetails, row);
    if (qtyKey && priceKey && lineTotalKey) {
      const qty = parseFloat(row[qtyKey]) || 0;
      const price = parseFloat(row[priceKey]) || 0;
      const lineTotal = parseFloat(row[lineTotalKey]) || 0;
      if (Math.abs(qty * price - lineTotal) > 0.01) {
        rulesResults.LINE_MATH.push({
          line: rowIndex + 1,
          expected: qty * price,
          got: lineTotal,
        });
      }
    } else {
      rulesResults.LINE_MATH.push({
        line: rowIndex + 1,
        error: 'Missing keys',
      });
    }

    // --- DATE_ISO ---
    const dateKey = getDataKey('invoice.issue_date', coverageDetails, row);
    if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(row[dateKey])) {
      rulesResults.DATE_ISO.push({
        line: rowIndex + 1,
        value: row[dateKey] || null,
      });
    }

    // --- CURRENCY_ALLOWED ---
    const currencyKey = getDataKey('invoice.currency', coverageDetails, row);
    const allowed = ['AED', 'SAR', 'MYR', 'USD'];
    if (!currencyKey || !allowed.includes(row[currencyKey])) {
      rulesResults.CURRENCY_ALLOWED.push({
        line: rowIndex + 1,
        value: row[currencyKey] || null,
      });
    }

    // --- TRN_PRESENT ---
    const buyerTRNKey = getDataKey('buyer.trn', coverageDetails, row);
    const sellerTRNKey = getDataKey('seller.trn', coverageDetails, row);
    if (
      !buyerTRNKey ||
      !row[buyerTRNKey] ||
      !sellerTRNKey ||
      !row[sellerTRNKey]
    ) {
      rulesResults.TRN_PRESENT.push({
        line: rowIndex + 1,
        error: 'Missing TRN',
      });
    }
  });

  const summary = {};
  Object.entries(rulesResults).forEach(([rule, errors]) => {
    summary[rule] = { ok: errors.length === 0 };
    if (errors.length > 0) summary[rule].rows = errors;
  });

  return summary;
}
