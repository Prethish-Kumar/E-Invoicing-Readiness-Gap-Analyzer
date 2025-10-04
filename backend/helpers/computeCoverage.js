import levenshtein from 'fast-levenshtein';

function normalizeKey(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .replace(/\[\]/g, '')
    .replace(/[_\s\.]/g, '');
}

export function computeCoverage(schemaFields, dataRows, closeThreshold = 0.3) {
  if (!dataRows || !dataRows.length)
    return {
      matched: [],
      close: [],
      missing: schemaFields.map((f) => f.path),
    };

  const schemaKeys = schemaFields.map((f) => f.path);
  const normalizedSchemaKeys = schemaKeys.map(normalizeKey);
  const dataKeys = Object.keys(dataRows[0]);
  const normalizedDataKeys = dataKeys.map(normalizeKey);

  const matched = [];
  const close = [];
  const missing = [];

  normalizedSchemaKeys.forEach((sNormKey, index) => {
    const sKey = schemaKeys[index];

    const exactIndex = normalizedDataKeys.findIndex((dk) => dk === sNormKey);
    if (exactIndex !== -1) {
      matched.push({
        target: sKey,
        matchedWith: dataKeys[exactIndex],
        confidence: 1,
      });
      return;
    }

    const includesIndex = normalizedDataKeys.findIndex(
      (dk) => dk.includes(sNormKey) || sNormKey.includes(dk)
    );
    if (includesIndex !== -1) {
      matched.push({
        target: sKey,
        matchedWith: dataKeys[includesIndex],
        confidence: 0.9,
      });
      return;
    }

    const closest = normalizedDataKeys.reduce((best, dk, i) => {
      const distance = levenshtein.get(sNormKey, dk);
      const similarity = 1 - distance / Math.max(sNormKey.length, dk.length);
      if (similarity > (best.similarity || 0)) return { index: i, similarity };
      return best;
    }, {});

    if (closest.similarity >= closeThreshold) {
      close.push({
        target: sKey,
        candidate: dataKeys[closest.index],
        confidence: parseFloat(closest.similarity.toFixed(2)),
      });
    } else {
      missing.push(sKey);
    }
  });

  return { matched, close, missing };
}
