import { Card, CardContent, CardActions, Button, Typography, Stack, Chip, Box } from '@mui/material';
import { Child } from '../types';
import ChildAvailabilityVisual from './ChildAvailabilityVisual';

export default function ChildCard({
  child,
  bookingCounts,
  onEdit,
}: {
  child: Child;
  bookingCounts?: number[][];
  onEdit: () => void;
}) {
  return (
    <Card sx={{ borderRadius: 4, overflow: 'visible' }}>
      <CardContent sx={{ px: 3, py: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h6">{child.name}</Typography>
            <Typography color="text.secondary" variant="body2">
              Age: {child.age} • Born {child.dateOfBirth}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ justifyContent: 'flex-end' }}>
            {child.preferredCity && <Chip label={child.preferredCity} size="small" />}
            {child.interests && <Chip label={child.interests} size="small" />}
          </Stack>
        </Stack>
        <Stack spacing={1.5}>
          <Typography variant="body2">
            Budget: {child.maxBudgetGbp != null ? `£${child.maxBudgetGbp}` : 'Not set'}
          </Typography>
          <ChildAvailabilityVisual availableTimes={child.availableTimes} bookingCounts={bookingCounts} />
          <Typography variant="body2" color="text.secondary">
            Travel radius: {child.travelRadiusKm ?? 'N/A'} km • {child.postcode || 'No postcode'}
          </Typography>
        </Stack>
      </CardContent>
      <CardActions sx={{ px: 3, pb: 2.5, pt: 0 }}>
        <Button size="small" onClick={onEdit}>
          Edit profile
        </Button>
      </CardActions>
    </Card>
  );
}
