import { Card, CardContent, CardActions, Button, Typography, Chip, Stack } from '@mui/material';
import { Activity } from '../types';

export default function ActivityCard({ activity, loading }: { activity: Activity; loading: boolean }) {
  return (
    <Card sx={{ minHeight: 260, borderRadius: 4, opacity: loading ? 0.85 : 1 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {activity.name}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
          <Chip label={activity.category} color="secondary" size="small" />
          <Chip label={activity.city} size="small" />
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Provider: {activity.providerName}
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Location: {activity.locationName}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Age: {activity.minAge} - {activity.maxAge}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Price: {activity.priceGbp != null ? `£${activity.priceGbp.toFixed(2)}` : 'Free / not set'}
        </Typography>
      </CardContent>
      <CardActions sx={{ justifyContent: 'space-between' }}>
        <Button size="small" disabled>
          Book later
        </Button>
        <Button size="small" href={`tel:${activity.contactPhone}`} disabled={!activity.contactPhone}>
          {activity.contactPhone ? 'Call provider' : 'No phone'}
        </Button>
      </CardActions>
    </Card>
  );
}
