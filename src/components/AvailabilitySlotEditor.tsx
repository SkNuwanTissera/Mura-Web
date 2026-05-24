import {
  Box,
  Button,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  AvailabilitySlotRow,
  createEmptySlot,
  WEEKDAYS,
} from '../utils/availabilitySlots';

export default function AvailabilitySlotEditor({
  slots,
  onChange,
}: {
  slots: AvailabilitySlotRow[];
  onChange: (slots: AvailabilitySlotRow[]) => void;
}) {
  const updateSlot = (id: string, patch: Partial<AvailabilitySlotRow>) => {
    onChange(slots.map((slot) => (slot.id === id ? { ...slot, ...patch } : slot)));
  };

  const addSlot = () => onChange([...slots, createEmptySlot()]);

  const removeSlot = (id: string) => {
    if (slots.length === 1) {
      onChange([createEmptySlot()]);
      return;
    }
    onChange(slots.filter((slot) => slot.id !== id));
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="subtitle2">Availability slots</Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={addSlot}>
          Add slot
        </Button>
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        Set when the activity runs and how many places can be booked in each slot.
      </Typography>

      <Stack spacing={2}>
        {slots.map((slot, index) => (
          <Box
            key={slot.id}
            sx={{
              p: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="body2" fontWeight={600}>
                Slot {index + 1}
              </Typography>
              <IconButton size="small" color="error" onClick={() => removeSlot(slot.id)} aria-label="Remove slot">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Stack>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Day</InputLabel>
                  <Select
                    value={slot.day}
                    label="Day"
                    onChange={(e) => updateSlot(slot.id, { day: e.target.value })}
                  >
                    {WEEKDAYS.map((day) => (
                      <MenuItem key={day} value={day}>
                        {day}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="time"
                  label="Start"
                  value={slot.startTime}
                  onChange={(e) => updateSlot(slot.id, { startTime: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="time"
                  label="End"
                  value={slot.endTime}
                  onChange={(e) => updateSlot(slot.id, { endTime: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Places to book"
                  value={slot.capacity}
                  onChange={(e) =>
                    updateSlot(slot.id, { capacity: Math.max(1, Number(e.target.value) || 1) })
                  }
                  inputProps={{ min: 1 }}
                />
              </Grid>
            </Grid>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
