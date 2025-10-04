import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Preview from './Preview';
import Papa from 'papaparse';
import axios from 'axios';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

function flattenInvoices(invoices) {
  const flatRows = [];
  invoices.forEach((inv) => {
    if (Array.isArray(inv.lines) && inv.lines.length) {
      inv.lines.forEach((line) => {
        const { _lines, ...invoiceFields } = inv;
        flatRows.push({ ...invoiceFields, ...line });
      });
    } else {
      flatRows.push(inv);
    }
  });
  return flatRows;
}

function getColumnsFromRows(rows) {
  if (!rows.length) return [];
  return Object.keys(rows[0]).map((key) => ({
    label: key.replace(/_/g, ' '),
    key,
    align: typeof rows[0][key] === 'number' ? 'right' : 'left',
  }));
}

export default function Upload({ setData, setUploadId }) {
  const [flatRows, setFlatRows] = useState([]);
  const [tableColumns, setTableColumns] = useState([]);
  const [uploading, setUploading] = useState(false);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('error');

  const showSnackbar = (message, severity = 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  const processData = (jsonData) => {
    setData(jsonData);
    const flat = flattenInvoices(jsonData);
    setFlatRows(flat);
    setTableColumns(flat.length ? getColumnsFromRows(flat) : []);

    // Send JSON to /upload
    setUploading(true);
    axios
      .post('http://localhost:5000/upload', { data: jsonData })
      .then((res) => {
        setUploadId(res.data.uploadId);
        showSnackbar('File uploaded successfully!', 'success');
      })
      .catch((err) => {
        console.error(err);
        showSnackbar('Failed to upload file');
      })
      .finally(() => setUploading(false));
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop().toLowerCase();

    if (fileExt === 'json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target.result);
          processData(jsonData);
        } catch (err) {
          console.error('JSON parse error', err);
          showSnackbar('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    } else if (fileExt === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
          processData(results.data);
        },
        error: function (err) {
          console.error('CSV parse error', err);
          showSnackbar('Error parsing CSV file');
        },
      });
    } else {
      showSnackbar('Unsupported file type. Please upload a CSV or JSON file.');
    }
  };

  return (
    <div className="flex-col mt-10">
      <div className="flex justify-center">
        <Button component="label" variant="contained" disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload E-Invoice Report'}
          <VisuallyHiddenInput type="file" onChange={handleFileUpload} />
        </Button>
      </div>

      {flatRows.length > 0 && (
        <div className="mt-10">
          <h1 className="text-xl text-center mb-2">Data Preview:</h1>
          <Preview columns={tableColumns} rows={flatRows.slice(0, 20)} />
        </div>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}
