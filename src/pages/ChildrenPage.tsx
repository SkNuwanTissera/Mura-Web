import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { Child } from '../types';
import { createChild, fetchBookings, fetchChildren, updateChild } from '../api';
import { useAuth } from '../hooks/useAuth';
import ChildCard from '../components/ChildCard';
import { ActivityBooking } from '../types';
import { buildChildBookingCountGrid } from '../utils/bookingAvailabilityGrid';

const initialForm = {
  name: '',
  dateOfBirth: '',
  preferredCity: '',
  interests: '',
  maxBudgetGbp: '',
  availableTimes: '',
  travelRadiusKm: '',
  postcode: ''
};

function calculateAge(dateOfBirth: string) {
  if (!dateOfBirth) return 0;

  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const birthdayHasPassed =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

  if (!birthdayHasPassed) {
    age -= 1;
  }

  return Math.max(age, 0);
}

function optionalNumber(value: string) {
  return value === '' ? undefined : Number(value);
}

function ChildFormFields({
  form,
  onChange,
}: {
  form: typeof initialForm;
  onChange: (next: typeof initialForm) => void;
}) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Name"
          value={form.name}
          onChange={(event) => onChange({ ...form, name: event.target.value })}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Date of birth"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={form.dateOfBirth}
          onChange={(event) => onChange({ ...form, dateOfBirth: event.target.value })}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Age"
          type="number"
          value={form.dateOfBirth ? calculateAge(form.dateOfBirth) : ''}
          InputProps={{ readOnly: true }}
          helperText="Calculated from date of birth"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Preferred city"
          value={form.preferredCity}
          onChange={(event) => onChange({ ...form, preferredCity: event.target.value })}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Interests"
          value={form.interests}
          onChange={(event) => onChange({ ...form, interests: event.target.value })}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Max budget (£)"
          type="number"
          value={form.maxBudgetGbp}
          onChange={(event) => onChange({ ...form, maxBudgetGbp: event.target.value })}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Available times"
          value={form.availableTimes}
          onChange={(event) => onChange({ ...form, availableTimes: event.target.value })}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Travel radius (km)"
          type="number"
          value={form.travelRadiusKm}
          onChange={(event) => onChange({ ...form, travelRadiusKm: event.target.value })}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Postcode"
          value={form.postcode}
          onChange={(event) => onChange({ ...form, postcode: event.target.value })}
        />
      </Grid>
    </Grid>
  );
}

export default function ChildrenPage() {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [bookings, setBookings] = useState<ActivityBooking[]>([]);
  const [createForm, setCreateForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);

  useEffect(() => {
    refreshChildren();
  }, [user?.parentId]);

  const refreshChildren = async () => {
    if (!user || !user.parentId) {
      setChildren([]);
      setBookings([]);
      return;
    }
    setLoading(true);
    try {
      const [list, nextBookings] = await Promise.all([
        fetchChildren(user.parentId),
        fetchBookings(user.parentId),
      ]);
      setChildren(list);
      setBookings(nextBookings);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!user || !user.parentId || !createForm.name || !createForm.dateOfBirth) {
      return;
    }
    await createChild(user.parentId, {
      name: createForm.name,
      dateOfBirth: createForm.dateOfBirth,
      age: calculateAge(createForm.dateOfBirth),
      preferredCity: createForm.preferredCity || undefined,
      interests: createForm.interests || undefined,
      maxBudgetGbp: optionalNumber(createForm.maxBudgetGbp),
      availableTimes: createForm.availableTimes || undefined,
      travelRadiusKm: optionalNumber(createForm.travelRadiusKm),
      postcode: createForm.postcode || undefined
    });
    setCreateForm(initialForm);
    setCreateDialogOpen(false);
    refreshChildren();
  };

  const handleEdit = (child: Child) => {
    setEditingChild(child);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingChild) return;
    await updateChild(editingChild.id, editingChild);
    setEditDialogOpen(false);
    refreshChildren();
  };

  const closeCreateDialog = () => {
    setCreateDialogOpen(false);
    setCreateForm(initialForm);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Children Profiles
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create a child profile and update the details to improve activity recommendations.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
          disabled={!user?.parentId}
          sx={{ flexShrink: 0 }}
        >
          Add child
        </Button>
      </Box>

      {!user?.parentId && (
        <Typography variant="body2" color="warning.main" sx={{ mb: 2 }}>
          Your account is not yet linked to a backend parent profile. Child profile creation will be enabled once the account is linked.
        </Typography>
      )}

      <Stack spacing={3}>
        {loading && <Typography>Loading children...</Typography>}
        {!loading && !children.length && (
          <Typography color="text.secondary">No child profiles found yet. Add one to begin.</Typography>
        )}
        {children.map((child) => (
          <ChildCard
            key={child.id}
            child={child}
            bookingCounts={buildChildBookingCountGrid(bookings, child.id)}
            onEdit={() => handleEdit(child)}
          />
        ))}
      </Stack>

      <Dialog open={createDialogOpen} onClose={closeCreateDialog} fullWidth maxWidth="md">
        <DialogTitle>Add a new child</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <ChildFormFields form={createForm} onChange={setCreateForm} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCreateDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!user?.parentId || !createForm.name || !createForm.dateOfBirth}
          >
            Add child
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit child details</DialogTitle>
        <DialogContent>
          {editingChild && (
            <Box sx={{ mt: 1 }}>
              <Stack spacing={2}>
                <TextField
                  label="Name"
                  fullWidth
                  value={editingChild.name}
                  onChange={(event) => setEditingChild({ ...editingChild, name: event.target.value })}
                />
                <TextField
                  label="Date of birth"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  value={editingChild.dateOfBirth}
                  onChange={(event) => setEditingChild({ ...editingChild, dateOfBirth: event.target.value })}
                />
                <TextField
                  label="Preferred city"
                  fullWidth
                  value={editingChild.preferredCity || ''}
                  onChange={(event) => setEditingChild({ ...editingChild, preferredCity: event.target.value })}
                />
                <TextField
                  label="Interests"
                  fullWidth
                  value={editingChild.interests || ''}
                  onChange={(event) => setEditingChild({ ...editingChild, interests: event.target.value })}
                />
                <TextField
                  label="Max budget (£)"
                  type="number"
                  fullWidth
                  value={editingChild.maxBudgetGbp ?? ''}
                  onChange={(event) => setEditingChild({ ...editingChild, maxBudgetGbp: Number(event.target.value) })}
                />
                <TextField
                  label="Available times"
                  fullWidth
                  value={editingChild.availableTimes || ''}
                  onChange={(event) => setEditingChild({ ...editingChild, availableTimes: event.target.value })}
                />
                <TextField
                  label="Travel radius (km)"
                  type="number"
                  fullWidth
                  value={editingChild.travelRadiusKm ?? ''}
                  onChange={(event) => setEditingChild({ ...editingChild, travelRadiusKm: Number(event.target.value) })}
                />
                <TextField
                  label="Postcode"
                  fullWidth
                  value={editingChild.postcode || ''}
                  onChange={(event) => setEditingChild({ ...editingChild, postcode: event.target.value })}
                />
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEdit}>
            Save changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
