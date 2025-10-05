import CircularProgress from '@mui/material/CircularProgress';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from 'axios';
import ScoreBar from './ScoreBar.jsx';
import CoverageDetails from './CoverageDetails.jsx';
import Button from '@mui/material/Button';
import DownloadPDFButton from './DownloadPDFButton.jsx';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

export default function SharePage() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const ruleLabels = {
    TOTALS_BALANCE: 'Totals Balance Check',
    LINE_MATH: 'Line Math Check',
    DATE_ISO: 'Date ISO Format',
    CURRENCY_ALLOWED: 'Allowed Currency',
    TRN_PRESENT: 'Transaction Present',
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    axios
      .get(`/report/${id}`)
      .then((res) => {
        setReport(res.data.analysis || res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load report. Please check if the link is valid.');
        setLoading(false);
      });
  }, [id]);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <CircularProgress />
        <p className="mt-2 text-gray-700">Loading shared report...</p>
      </div>
    );

  if (error) return <p className="text-red-500 mt-10 text-center">{error}</p>;

  if (!report)
    return <p className="text-center mt-10 text-gray-600">No report found.</p>;

  const scoreConfig = {
    dataScore: { label: 'Data Score', max: 25 },
    coverageScore: { label: 'Coverage Score', max: 35 },
    rulesScore: { label: 'Rules Compliance', max: 50 },
    postureScore: { label: 'Posture Score', max: 10 },
    overall: { label: 'Overall Score', max: 100 },
  };

  return (
    <>
      <img
        className="w-full max-w-md mx-auto mt-5"
        src="https://cdn.sanity.io/images/s1vd82jm/production/16b320c118fe2a630aa9855b697c77e082412806-1005x132.svg"
        alt=""
      />
      <div
        id="reportCard"
        className="flex justify-center py-10 px-4 max-w-xl mx-auto text-black"
      >
        <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 lg:p-10 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-1">Shared Report</h2>
            <p className="text-gray-500 break-all">
              {report.reportId || report._id}
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Coverage</h3>
            <div className="bg-slate-100 rounded-xl p-4 space-y-2">
              <p>
                <span className="font-bold">Total Found:</span>{' '}
                {report.coverage.matched.length +
                  report.coverage.close.length +
                  report.coverage.missing.length || 0}
              </p>
              <p>
                <span className="font-bold">Matched:</span>{' '}
                {report.coverage.matched?.length || 0}
              </p>
              <p>
                <span className="font-bold">Close:</span>{' '}
                {report.coverage.close?.length || 0}
              </p>
              <p>
                <span className="font-bold">Missing:</span>{' '}
                {report.coverage.missing?.length || 0}
              </p>
              <CoverageDetails coverage={report.coverage} defaultOpen />
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Scores</h3>
            <div className="bg-slate-100 p-4 rounded-xl space-y-2">
              {report.scores &&
                Object.entries(report.scores)
                  .filter(([key]) => key !== 'readiness')
                  .map(([key, value]) => {
                    const config = scoreConfig[key] || { label: key, max: 100 };
                    return (
                      <ScoreBar
                        key={key}
                        label={config.label}
                        value={value}
                        max={config.max}
                      />
                    );
                  })}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Rule Findings</h3>
            <div className="space-y-2">
              {Object.entries(
                report.ruleFindings.reduce((acc, rule) => {
                  const key = rule.rule;
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(rule);
                  return acc;
                }, {})
              ).map(([rule, rules], idx) => {
                const label = ruleLabels[rule] || rule;
                const hasFailed = rules.some((r) => !r.ok);

                if (hasFailed) {
                  return (
                    <Accordion
                      key={idx}
                      className="bg-gray-100 rounded-md"
                      defaultExpanded
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <span className="font-medium">{label}:</span>
                        <span className="ml-2 px-2 py-1 rounded-full text-sm font-semibold bg-red-200 text-red-800">
                          False ({rules.length})
                        </span>
                      </AccordionSummary>
                      <AccordionDetails className="flex flex-col space-y-1">
                        {rules
                          .filter((r) => !r.ok)
                          .map((r, i) => {
                            let text = '';
                            if (
                              r.line !== undefined &&
                              r.expected !== undefined &&
                              r.got !== undefined
                            ) {
                              text = `Line ${r.line}: expected ${r.expected}, got ${r.got}`;
                            } else if (r.value !== undefined) {
                              text = `Value: ${r.value}`;
                            } else {
                              text = 'Failed';
                            }
                            return (
                              <div
                                key={i}
                                className="text-sm bg-red-100 p-2 rounded-md break-words"
                              >
                                {text}
                              </div>
                            );
                          })}
                      </AccordionDetails>
                    </Accordion>
                  );
                } else {
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-gray-100 rounded-md"
                    >
                      <span className="font-medium">{label}:</span>
                      <span className="bg-green-200 text-green-800 px-2 py-1 rounded-full text-sm font-semibold">
                        True
                      </span>
                    </div>
                  );
                }
              })}
            </div>
          </div>

          <div className="flex flex-col items-center space-y-4">
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                variant="contained"
                color="secondary"
                onClick={() => {
                  const file = new Blob([JSON.stringify(report, null, 2)], {
                    type: 'application/json',
                  });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(file);
                  link.download = `report_${report.reportId || report._id}.json`;
                  link.click();
                  URL.revokeObjectURL(link.href);
                }}
              >
                Download Report (JSON)
              </Button>
              <DownloadPDFButton report={report} />
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <Button
                variant="contained"
                color="warning"
                onClick={() =>
                  navigator.clipboard.writeText(
                    `${window.location.origin}/report/${report.reportId || report._id}`
                  )
                }
              >
                Copy Sharable Link (JSON)
              </Button>
              <Button
                variant="contained"
                color="warning"
                onClick={() =>
                  navigator.clipboard.writeText(
                    `${window.location.origin}/share/${report.reportId || report._id}`
                  )
                }
              >
                Copy Sharable Link
              </Button>
            </div>

            <Button
              variant="contained"
              className="bg-gray-800 hover:bg-gray-900 text-white"
              onClick={() => (window.location.href = '/')}
            >
              Analyze Another Document
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
