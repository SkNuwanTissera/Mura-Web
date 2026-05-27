import { Box, Button, Chip, Divider, Link, Stack, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Link as RouterLink } from 'react-router-dom';
import { Activity } from '../types';
import { formatAvailabilitySlotLabel } from '../utils/availabilitySlots';

type ActivityDetailPanelProps = {
  activity: Activity | null;
  onAddToCart?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  addToCartLoading?: boolean;
};

export default function ActivityDetailPanel({
  activity,
  onAddToCart,
  onEdit,
  onDelete,
  addToCartLoading,
}: ActivityDetailPanelProps) {
  if (!activity) {
    return (
      <Box
        sx={{
          height: '100%',
          minHeight: 320,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: 3,
          p: 3,
        }}
      >
        <Typography variant="body1" color="text.secondary" textAlign="center">
          Select an activity from the list to view details.
        </Typography>
      </Box>
    );
  }

  const provider = activity.providerName || 'Unknown provider';
  const location = activity.locationName || activity.address || 'Unknown location';
  const ageLabel =
    activity.minAge != null && activity.maxAge != null
      ? `${activity.minAge} - ${activity.maxAge}`
      : 'Any age';
  const priceLabel =
    activity.priceGbp != null ? `£${activity.priceGbp.toFixed(2)}` : 'Free / not set';

  return (
    <Box
      sx={{
        height: '100%',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        p: { xs: 2, sm: 2.5 },
        position: { md: 'sticky' },
        top: 16,
        maxHeight: { md: 'calc(100vh - 120px)' },
        overflow: 'auto',
      }}
    >
      <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: 'wrap' }}>
        <Chip label={activity.category || 'General'} color="secondary" size="small" />
        <Chip label={activity.city || 'Any city'} size="small" />
      </Stack>

      <Typography variant="h5" sx={{ mb: 1 }}>
        {activity.name || 'Untitled activity'}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
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

      <Divider sx={{ my: 2 }} />

      <Stack spacing={1.25}>
        <Typography variant="body2">
          <strong>Location</strong>: {location}
        </Typography>
        {activity.address && activity.locationName ? (
          <Typography variant="body2" color="text.secondary">
            {activity.address}
          </Typography>
        ) : null}
        <Typography variant="body2">
          <strong>Age</strong>: {ageLabel}
        </Typography>
        <Typography variant="body2">
          <strong>Price</strong>: {priceLabel}
        </Typography>
        {activity.contactPhone ? (
          <Typography variant="body2">
            <strong>Contact</strong>: {activity.contactPhone}
          </Typography>
        ) : null}
      </Stack>

      {activity.availabilitySlots?.length > 0 ? (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Availability
          </Typography>
          <Stack spacing={0.5}>
            {activity.availabilitySlots.map((slot) => (
              <Typography key={slot} variant="body2" color="text.secondary">
                {formatAvailabilitySlotLabel(slot)}
              </Typography>
            ))}
          </Stack>
        </>
      ) : null}

      {(onAddToCart || onEdit || onDelete) && (
        <>
          <Divider sx={{ my: 2 }} />
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {onEdit ? (
              <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={onEdit}>
                Edit
              </Button>
            ) : null}
            {onDelete ? (
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={onDelete}
              >
                Delete
              </Button>
            ) : null}
            {onAddToCart ? (
              <Button
                size="small"
                variant="contained"
                onClick={onAddToCart}
                disabled={addToCartLoading}
              >
                {addToCartLoading ? 'Adding…' : 'Add to cart'}
              </Button>
            ) : null}
          </Stack>
        </>
      )}
    </Box>
  );
}
