import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Divider,
  Grid,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack
} from '@mui/material';
import { Child } from '../types';
import { createChild, fetchChildren, updateChild } from '../api';
import { useAuth } from '../hooks/useAuth';
import ChildCard from '../components/ChildCard';

const initialForm = { name: '', dateOfBirth: '' };

export default function ChildrenPage() {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [createForm, setCreateForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);

  useEffect(() => {
    refreshChildren();
  }, [user?.parentId]);

  const refreshChildren = async () => {
    if (!user || !user.parentId) {
      setChildren([]);
      return;
    }
    setLoading(true);
    try {
      const list = await fetchChildren(user.parentId);
      setChildren(list);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!user || !user.parentId || !createForm.name || !createForm.dateOfBirth) {
      return;
    }
    await createChild(user.parentId, createForm.name, createForm.dateOfBirth);
    setCreateForm(initialForm);
    refreshChildren();
  };

  const handleEdit = (child: Child) => {
    setEditingChild(child);
    setDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingChild) return;
    await updateChild(editingChild.id, editingChild);
    setDialogOpen(false);
    refreshChildren();
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Children Profiles
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Create a child profile and update the details to improve activity recommendations.
      </Typography>
      {!user?.parentId && (
        <Typography variant="body2" color="warning.main" sx={{ mb: 2 }}>
          Your account is not yet linked to a backend parent profile. Child profile creation will be enabled once the account is linked.
        </Typography>
      )}

      <Card sx={{ p: 3, mb: 4, borderRadius: 4 }}>
        <Typography variant="h6" gutterBottom>
          Add a new child
        </Typography>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              label="Name"
              value={createForm.name}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
            />
          </Grid>
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              label="Date of birth"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={createForm.dateOfBirth}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, dateOfBirth: event.target.value }))}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button variant="contained" fullWidth onClick={handleCreate} disabled={!user?.parentId}>
              Add child
            </Button>
          </Grid>
        </Grid>
      </Card>

      <Stack spacing={3}>
        {loading && <Typography>Loading children...</Typography>}
        {!loading && !children.length && (
          <Typography color="text.secondary">No child profiles found yet. Add one to begin.</Typography>
        )}
        {children.map((child) => (
          <ChildCard key={child.id} child={child} onEdit={() => handleEdit(child)} />
        ))}
      </Stack>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
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
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEdit}>
            Save changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
