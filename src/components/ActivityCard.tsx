import { Card, CardContent, CardActions, Button, Typography, Chip, Stack, Box, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Activity } from '../types';
import { formatAvailabilitySlotLabel } from '../utils/availabilitySlots';

export default function ActivityCard({
  activity,
  loading,
  onAddToCart
}: {
  activity: Activity;
  loading: boolean;
  onAddToCart?: () => void;
}) {
  const provider = activity.providerName || 'Unknown provider';
  const location = activity.locationName || activity.address || 'Unknown location';
  const ageLabel = activity.minAge != null && activity.maxAge != null
    ? `${activity.minAge} - ${activity.maxAge}`
    : 'Any age';
  const priceLabel = activity.priceGbp != null ? `£${activity.priceGbp.toFixed(2)}` : 'Free / not set';

  return (
    <Card
      sx={{
        minHeight: 220,
        borderRadius: 3,
        opacity: loading ? 0.9 : 1,
        boxShadow: 1,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
          <Chip label={activity.category || 'General'} color="secondary" size="small" />
          <Chip label={activity.city || 'Any city'} size="small" />
        </Stack>

        <Typography variant="h6" gutterBottom>
          {activity.name || 'Untitled activity'}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Provider:{' '}
          {activity.providerId ? (
            <Link
              component={RouterLink}
              to={`/providers/${activity.providerId}`}
              underline="hover"
              color="primary"
            >
              {provider}
            </Link>
          ) : (
            provider
          )}
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Location: {location}
        </Typography>

        <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Age: {ageLabel}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Price: {priceLabel}
          </Typography>
        </Box>

        {activity.availabilitySlots?.length > 0 && (
          <Box component="div" sx={{ color: 'text.secondary' }}>
            {activity.availabilitySlots.map((slot) => (
              <Typography key={slot} variant="body2" color="text.secondary">
                {formatAvailabilitySlotLabel(slot)}
              </Typography>
            ))}
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ justifyContent: 'flex-end', p: 1, pt: 0 }}>
        <Button size="small" variant="contained" color="primary" onClick={onAddToCart} disabled={!onAddToCart || loading}>
          Add to cart
        </Button>
      </CardActions>
    </Card>
  );
}
