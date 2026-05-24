import { Box, Chip, Paper, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Activity } from '../types';

export default function ChatActivitySuggestion({ activity }: { activity: Activity }) {
  const priceLabel = activity.priceGbp != null ? `£${activity.priceGbp.toFixed(2)}` : 'Free / not set';

  return (
    <Paper
      component={RouterLink}
      to="/activities"
      elevation={0}
      sx={{
        display: 'block',
        p: 1.25,
        borderRadius: 2,
        bgcolor: 'background.default',
        textDecoration: 'none',
        color: 'inherit',
        border: '1px solid',
        borderColor: 'divider',
        '&:hover': {
          borderColor: 'primary.main',
        },
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
        {activity.name}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 0.5 }}>
        {activity.category && <Chip label={activity.category} size="small" color="secondary" />}
        {activity.city && <Chip label={activity.city} size="small" variant="outlined" />}
      </Box>
      <Typography variant="caption" color="text.secondary">
        {priceLabel}
      </Typography>
    </Paper>
  );
}
