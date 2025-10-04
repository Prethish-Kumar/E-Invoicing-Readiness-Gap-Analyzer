export function computeScores(
  dataRows,
  coverage,
  ruleFindings,
  postureScore = 100
) {
  // --- DATA SCORE (25%) ---
  const totalFields =
    (coverage.matched?.length || 0) +
    (coverage.close?.length || 0) +
    (coverage.missing?.length || 0);
  const matchedOrClose =
    (coverage.matched?.length || 0) + (coverage.close?.length || 0);
  const dataPct = totalFields ? matchedOrClose / totalFields : 0;
  const dataScore = dataPct * 25;

  // --- COVERAGE SCORE (35%) ---
  const allKeys = [
    ...(coverage.matched || []).map((c) => c.target || c),
    ...(coverage.close || []).map((c) => c.target || c),
  ];

  const headerSBKeys = allKeys.filter(
    (k) =>
      k.startsWith('invoice') || k.startsWith('seller') || k.startsWith('buyer')
  );
  const lineKeys = allKeys.filter((k) => k.startsWith('lines'));

  const matchedHeaderSB = headerSBKeys.length
    ? headerSBKeys.filter(
        (k) =>
          coverage.matched.some(
            (c) => (typeof c === 'string' ? c : c.target) === k
          ) || coverage.close.some((c) => c.target === k)
      ).length
    : 0;

  const matchedLines = lineKeys.length
    ? lineKeys.filter(
        (k) =>
          coverage.matched.some(
            (c) => (typeof c === 'string' ? c : c.target) === k
          ) || coverage.close.some((c) => c.target === k)
      ).length
    : 0;

  const headerWeight = 0.7;
  const linesWeight = 0.3;

  const coveragePct =
    (headerSBKeys.length
      ? (matchedHeaderSB / headerSBKeys.length) * headerWeight
      : 0) +
    (lineKeys.length ? (matchedLines / lineKeys.length) * linesWeight : 0);

  const coverageScore = coveragePct * 35;

  // --- RULES SCORE (30%) ---
  const ruleNames = [...new Set(ruleFindings.map((f) => f.rule))];
  const totalRuleChecks = dataRows.length * ruleNames.length;

  const failedRuleChecks = ruleFindings.filter((f) => f.ok === false).length;

  const rulesPct = totalRuleChecks
    ? (totalRuleChecks - failedRuleChecks) / totalRuleChecks
    : 0;
  const rulesScore = rulesPct * 30;

  // --- POSTURE SCORE (10%) ---
  const posture = postureScore * 0.1;

  // --- OVERALL ---
  const overall = dataScore + coverageScore + rulesScore + posture;

  // --- READINESS LABEL ---
  let readiness;
  if (overall >= 90) readiness = 'High';
  else if (overall >= 50) readiness = 'Medium';
  else readiness = 'Low';

  return {
    dataScore: dataScore.toFixed(2),
    coverageScore: coverageScore.toFixed(2),
    rulesScore: rulesScore.toFixed(2),
    postureScore: posture.toFixed(2),
    overall: overall.toFixed(2),
    readiness,
  };
}
