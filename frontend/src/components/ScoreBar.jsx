// ScoreBar.jsx
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

export default function ScoreBar({ label, value, max = 100 }) {
  const percentage = (value / max) * 100;

  return (
    <Box
      sx={{
        width: '100%',
        mb: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Typography variant="body2" sx={{ mb: 1 }}>
        {label} ({value}/{max})
      </Typography>
      <Box sx={{ width: '80%' }}>
        <LinearProgress variant="determinate" value={percentage} />
      </Box>
    </Box>
  );
}
