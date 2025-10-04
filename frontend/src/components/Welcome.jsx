import React, { useEffect, useState } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableCell';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

export default function Welcome() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/reports?limit=10')
      .then((res) => res.json())
      .then((data) => setReports(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="mt-5 px-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold">
          E‑Invoicing Readiness & Gap Analyzer
        </h1>
        <p className="mt-4">
          Quickly check your invoice data against the GETS standard. Upload your
          sample to see coverage, rule violations, and overall readiness.
        </p>
      </div>

      <h2 className="text-2xl mb-4 text-center">Recent Reports</h2>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Report ID</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report._id}>
                <TableCell>{report._id}</TableCell>
                <TableCell>
                  {new Date(report.createdAt).toLocaleString()}
                </TableCell>
                <TableCell align="center">
                  <Button
                    component="a"
                    href={`/share/${report._id}`}
                    target="_blank"
                    variant="contained"
                    color="primary"
                  >
                    View / Share
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {reports.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  No recent reports found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}
