import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function CoverageDetails({ coverage, defaultOpen = false }) {
  if (!coverage) return null;

  const unifiedDetails = [];

  if (Array.isArray(coverage.matched)) {
    coverage.matched.forEach((item) => {
      unifiedDetails.push({
        schemaKey: item.target,
        matchedWith: item.matchedWith,
        confidence: item.confidence,
        status: 'matched',
      });
    });
  }

  if (Array.isArray(coverage.close)) {
    coverage.close.forEach((item) => {
      unifiedDetails.push({
        schemaKey: item.target,
        matchedWith: item.candidate,
        confidence: item.confidence,
        status: 'close',
      });
    });
  }

  if (Array.isArray(coverage.missing)) {
    coverage.missing.forEach((item) => {
      const key =
        typeof item === 'object'
          ? item.target || item.description || JSON.stringify(item)
          : item;
      unifiedDetails.push({
        schemaKey: key,
        status: 'missing',
      });
    });
  }

  const sortedDetails = unifiedDetails.sort((a, b) => {
    const order = { matched: 0, close: 1, missing: 2 };
    return (order[a.status] ?? 3) - (order[b.status] ?? 3);
  });

  return (
    <div className="mt-4 max-w-xl mx-auto">
      <Accordion defaultExpanded={defaultOpen}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="coverage-content"
          id="coverage-header"
        >
          <Typography className="font-bold">Coverage Details</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <div className="space-y-2">
            {sortedDetails.map((item, idx) => {
              const { schemaKey, status, matchedWith, confidence } = item;

              let bgColor, text;
              if (status === 'matched') {
                bgColor = 'bg-green-200 text-green-800';
                text = `Matched (${(confidence * 100).toFixed(1)}%)`;
              } else if (status === 'close') {
                bgColor = 'bg-yellow-200 text-yellow-800';
                text = `Close Match (${(confidence * 100).toFixed(1)}%) → ${matchedWith}`;
              } else {
                bgColor = 'bg-red-200 text-red-800';
                text = 'Missing';
              }

              return (
                <div
                  key={idx}
                  className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 rounded-md ${bgColor} break-words`}
                >
                  <span className="font-medium truncate sm:truncate-none w-full sm:w-auto">
                    {schemaKey}
                  </span>
                  <span className="text-sm mt-1 sm:mt-0 break-words">
                    {text}
                  </span>
                </div>
              );
            })}
          </div>
        </AccordionDetails>
      </Accordion>
    </div>
  );
}
