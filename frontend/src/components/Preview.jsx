import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

export default function Preview({ columns, rows }) {
  return (
    <TableContainer component={Paper} className="overflow-x-auto">
      <Table sx={{ width: '100%' }} aria-label="dynamic table">
        <TableHead>
          <TableRow>
            <TableCell align="left">No.</TableCell>
            {columns.map((col) => (
              <TableCell key={col.key} align={col.align || 'left'}>
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow
              key={rowIndex}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {rowIndex + 1}
              </TableCell>
              {columns.map((col) => {
                const cellValue = row[col.key];
                return (
                  <TableCell key={col.key} align={col.align || 'left'}>
                    {cellValue !== null && typeof cellValue === 'object'
                      ? JSON.stringify(cellValue)
                      : cellValue}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
