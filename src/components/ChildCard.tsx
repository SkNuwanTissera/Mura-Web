import { Card, CardContent, CardActions, Button, Typography, Stack, Chip } from '@mui/material';
import { Child } from '../types';

export default function ChildCard({ child, onEdit }: { child: Child; onEdit: () => void }) {
  return (
    <Card sx={{ borderRadius: 4 }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
          <div>
            <Typography variant="h6">{child.name}</Typography>
            <Typography color="text.secondary" variant="body2">
              Age: {child.age} • Born {child.dateOfBirth}
            </Typography>
          </div>
          <Stack direction="row" spacing={1}>
            {child.preferredCity && <Chip label={child.preferredCity} size="small" />}
            {child.interests && <Chip label={child.interests} size="small" />}
          </Stack>
        </Stack>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Budget: {child.maxBudgetGbp != null ? `£${child.maxBudgetGbp}` : 'Not set'}
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Availability: {child.availableTimes || 'Not specified'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Travel radius: {child.travelRadiusKm ?? 'N/A'} km • {child.postcode || 'No postcode'}
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="small" onClick={onEdit}>
          Edit profile
        </Button>
      </CardActions>
    </Card>
  );
}
