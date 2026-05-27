import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';

import { ActivityBooking } from '../types';
import { formatAvailabilitySlotLabel } from '../utils/availabilitySlots';

type BookingEditDialogProps = {
  booking: ActivityBooking | null;
  open: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (availabilitySlot: string) => Promise<void>;
};

export default function BookingEditDialog({
  booking,
  open,
  saving,
  onClose,
  onSave,
}: BookingEditDialogProps) {
  const [selectedSlot, setSelectedSlot] = useState('');

  const slotOptions = useMemo(() => {
    if (!booking) {
      return [];
    }
    const options = new Set<string>(booking.activity.availabilitySlots ?? []);
    if (booking.availabilitySlot) {
      options.add(booking.availabilitySlot);
    }
    return [...options];
  }, [booking]);

  useEffect(() => {
    if (booking?.availabilitySlot) {
      setSelectedSlot(booking.availabilitySlot);
    } else if (slotOptions.length > 0) {
      setSelectedSlot(slotOptions[0]);
    } else {
      setSelectedSlot('');
    }
  }, [booking, slotOptions]);

  const handleSave = async () => {
    if (!selectedSlot) {
      window.alert('Select a timeslot');
      return;
    }
    await onSave(selectedSlot);
  };

  if (!booking) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit booking</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {booking.activity.name}
            {booking.child ? ` · ${booking.child.name}` : ''}
          </Typography>
          {slotOptions.length === 0 ? (
            <Typography variant="body2" color="error">
              No timeslots are currently available for this activity.
            </Typography>
          ) : (
            <FormControl fullWidth>
              <InputLabel id="booking-slot-label">Timeslot</InputLabel>
              <Select
                labelId="booking-slot-label"
                label="Timeslot"
                value={selectedSlot}
                onChange={(event) => setSelectedSlot(event.target.value)}
              >
                {slotOptions.map((slot) => (
                  <MenuItem key={slot} value={slot}>
                    {formatAvailabilitySlotLabel(slot)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Close
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleSave()}
          disabled={saving || slotOptions.length === 0}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
