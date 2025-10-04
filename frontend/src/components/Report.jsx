import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import axios from 'axios';
import ScoreBar from './ScoreBar.jsx';
import CoverageDetails from './CoverageDetails.jsx';
import Button from '@mui/material/Button';
import DownloadPDFButton from './DownloadPDFButton.jsx';
import { useState, useEffect } from 'react';

export default function Report({ uploadId }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openRules, setOpenRules] = useState({});

  const ruleLabels = {
    TOTALS_BALANCE: 'Totals Balance Check',
    LINE_MATH: 'Line Math Check',
    DATE_ISO: 'Date ISO Format',
    CURRENCY_ALLOWED: 'Allowed Currency',
    TRN_PRESENT: 'Transaction Present',
  };

  useEffect(() => {
    if (!uploadId) return;

    setLoading(true);
    setError(null);

    axios
      .post('http://localhost:5000/analyze', {
        uploadId,
        questionnaire: { webhooks: true, sandbox_env: true, retries: false },
      })
      .then((res) => pollReport(res.data.reportId))
      .catch((err) => {
        console.error(err);
        setError('Failed to submit report, Try Again!');
        setLoading(false);
      });
  }, [uploadId]);

  const pollReport = (id) => {
    const interval = setInterval(() => {
      axios
        .get(`http://localhost:5000/report/${id}`)
        .then((res) => {
          if (res.data.status === 'done') {
            setReport(res.data.analysis);
            setLoading(false);
            clearInterval(interval);
          } else if (res.data.status === 'failed') {
            setError('Report generation failed');
            setLoading(false);
            clearInterval(interval);
          }
        })
        .catch((err) => {
          console.error(err);
          setError('Error fetching report');
          setLoading(false);
          clearInterval(interval);
        });
    }, 1000);
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center mt-10">
        <CircularProgress />
        <p className="mt-2">Generating report...</p>
      </div>
    );

  if (error) return <p className="text-red-500 mt-10 text-center">{error}</p>;
  if (!report) return null;

  const scoreConfig = {
    dataScore: { label: 'Data Score', max: 25 },
    coverageScore: { label: 'Coverage Score', max: 35 },
    rulesScore: { label: 'Rules Compliance', max: 30 },
    postureScore: { label: 'Posture Score', max: 10 },
    overall: { label: 'Overall Score', max: 100 },
  };

  const groupedRules = report.ruleFindings.reduce((acc, r) => {
    if (!acc[r.rule]) acc[r.rule] = [];
    acc[r.rule].push(r);
    return acc;
  }, {});

  return (
    <div>
      <div className="mt-4 text-center max-w-md mx-auto">
        <h2 className="font-bold text-xl">Report ID:</h2>
        <p>{report.reportId}</p>
      </div>

      <div className="mt-4 mx-auto">
        <h2 className="font-bold text-xl">Coverage:</h2>
        <div className="mt-2 p-4 rounded-2xl bg-slate-100">
          <p>
            <span className="font-bold">Total Found:</span>{' '}
            {report.coverage.matched.length +
              report.coverage.close.length +
              report.coverage.missing.length}
          </p>
          <p>
            <span className="font-bold">Matched:</span>{' '}
            {report.coverage.matched.length}
          </p>
          <p>
            <span className="font-bold">Close:</span>{' '}
            {report.coverage.close.length}
          </p>
          <p>
            <span className="font-bold">Missing:</span>{' '}
            {report.coverage.missing.length}
          </p>
          <CoverageDetails coverage={report.coverage} />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="font-bold text-xl">Scores:</h1>
        {report.scores?.readiness &&
          (() => {
            let colorClass = 'text-gray-800';
            if (report.scores.readiness === 'High')
              colorClass = 'text-green-700 bg-green-200';
            else if (report.scores.readiness === 'Medium')
              colorClass = 'text-yellow-700 bg-yellow-200';
            else if (report.scores.readiness === 'Low')
              colorClass = 'text-red-700 bg-red-200';

            return (
              <span
                className={`px-3 py-1 rounded-md font-semibold ${colorClass}`}
              >
                {report.scores.readiness}
              </span>
            );
          })()}
      </div>

      <div className="mt-2 bg-slate-100 p-4 rounded-2xl">
        {report.scores &&
          Object.entries(report.scores)
            .filter(([key]) => key !== 'readiness')
            .map(([key, value]) => {
              const config = scoreConfig[key] || { label: key, max: 90 };
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

      <div className="mt-4">
        <h2 className="font-bold text-xl mb-2">Rule Findings:</h2>
        <div className="space-y-2">
          {Object.entries(groupedRules).map(([rule, items]) => {
            const label = ruleLabels[rule] || rule;
            const hasErrors = items.some((r) => !r.ok);

            if (!hasErrors) {
              return (
                <div
                  key={rule}
                  className="flex items-center justify-between p-2 bg-gray-100 rounded-md"
                >
                  <span className="font-medium">{label}:</span>
                  <span className="bg-green-200 text-green-800 px-2 py-1 rounded-full text-sm font-semibold">
                    True
                  </span>
                </div>
              );
            }

            return (
              <div key={rule} className="bg-gray-100 p-2 rounded-md">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() =>
                    setOpenRules((prev) => ({ ...prev, [rule]: !prev[rule] }))
                  }
                >
                  <span className="font-medium">{label}:</span>
                  <span className="bg-red-200 text-red-800 px-2 py-1 rounded-full text-sm font-semibold">
                    False ({items.length})
                  </span>
                </div>
                {openRules[rule] && (
                  <div className="mt-2 ml-4 space-y-1">
                    {items.map((r, idx) => {
                      let tooltipText = '';
                      if (r.expected !== undefined && r.got !== undefined) {
                        tooltipText = `Line ${r.line}: expected ${r.expected}, got ${r.got}`;
                      } else if (r.value !== undefined) {
                        tooltipText = `Line ${r.line}: Value ${r.value}`;
                      } else {
                        tooltipText = `Line ${r.line}: Failed`;
                      }
                      return (
                        <Tooltip key={idx} title={tooltipText} arrow>
                          <div className="text-sm text-red-800 cursor-pointer">
                            {tooltipText}
                          </div>
                        </Tooltip>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col items-center space-y-6 mt-8">
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
              link.download = `report_${report.reportId}.json`;
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
                `${window.location.origin}/report/${report.reportId}`
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
                `${window.location.origin}/share/${report.reportId}`
              )
            }
          >
            Copy Sharable Link
          </Button>
        </div>

        <div>
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
  );
}
