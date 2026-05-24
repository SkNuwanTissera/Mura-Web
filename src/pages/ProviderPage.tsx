import { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  Card,
  CardContent,
  CardActions,
  Link,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LanguageIcon from '@mui/icons-material/Language';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { Provider, Activity } from '../types';
import {
  fetchProviderById,
  fetchActivitiesByProvider,
  getCategories,
  getCities,
  createActivity,
  updateActivity,
  deleteActivity,
} from '../api';
import ActivityFormFields from '../components/ActivityFormFields';
import { formatAvailabilitySlotLabel } from '../utils/availabilitySlots';
import {
  activityFormStateFromActivity,
  activityFormStateToPayload,
  emptyActivityFormState,
  validateActivityFormState,
  ActivityFormState,
} from '../utils/activityForm';

export default function ProviderPage() {
  const { id } = useParams<{ id: string }>();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [form, setForm] = useState<ActivityFormState>(emptyActivityFormState());
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Activity | null>(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      fetchProviderById(id),
      fetchActivitiesByProvider(id),
      getCategories(),
      getCities(),
    ])
      .then(([prov, acts, cats, ctys]) => {
        setProvider(prov);
        setActivities(acts);
        setCategories(cats);
        setCities(ctys);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load provider.'))
      .finally(() => setLoading(false));
  }, [id]);

  const openCreate = () => {
    if (!id) return;
    setEditingActivity(null);
    setForm(emptyActivityFormState(id));
    setActionError('');
    setDialogOpen(true);
  };

  const openEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setForm(activityFormStateFromActivity(activity));
    setActionError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!id) return;
    const validationError = validateActivityFormState({ ...form, providerId: id });
    if (validationError) {
      setActionError(validationError);
      return;
    }
    setSaving(true);
    setActionError('');
    try {
      const payload = activityFormStateToPayload(form, id);
      if (editingActivity) {
        const updated = await updateActivity(editingActivity.id, payload);
        setActivities((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      } else {
        const created = await createActivity(payload);
        setActivities((prev) => [...prev, created]);
      }
      setDialogOpen(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to save activity.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteActivity(deleteConfirm.id);
      setActivities((prev) => prev.filter((a) => a.id !== deleteConfirm.id));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete activity.');
    } finally {
      setDeleteConfirm(null);
    }
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={200} height={48} />
        <Skeleton variant="rectangular" height={120} sx={{ mt: 2, borderRadius: 3 }} />
        <Skeleton variant="rectangular" height={200} sx={{ mt: 3, borderRadius: 3 }} />
      </Box>
    );
  }

  if (error || !provider) {
    return (
      <Box>
        <Typography color="error">{error || 'Provider not found.'}</Typography>
        <Button component={RouterLink} to="/providers" startIcon={<ArrowBackIcon />} sx={{ mt: 2 }}>
          Back to providers
        </Button>
      </Box>
    );
  }

  const categoryBreakdown = activities.reduce<Record<string, number>>((acc, act) => {
    acc[act.category] = (acc[act.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <Box>
      {/* Breadcrumb */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
        <Button component={RouterLink} to="/providers" startIcon={<ArrowBackIcon />} variant="text">
          Providers
        </Button>
        <Typography color="text.secondary">/</Typography>
        <Typography fontWeight={600}>{provider.name}</Typography>
      </Stack>

      {/* Provider header card */}
      <Card sx={{ borderRadius: 3, mb: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ sm: 'flex-start' }}
            spacing={2}
          >
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                {provider.name}
              </Typography>

              {provider.description && (
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2, maxWidth: 680 }}>
                  {provider.description}
                </Typography>
              )}

              <Stack direction="row" flexWrap="wrap" gap={2}>
                {(provider.city || provider.address) && (
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <LocationOnIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {[provider.address, provider.city].filter(Boolean).join(', ')}
                    </Typography>
                  </Stack>
                )}
                {provider.email && (
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <EmailIcon fontSize="small" color="action" />
                    <Link href={`mailto:${provider.email}`} variant="body2" underline="hover">
                      {provider.email}
                    </Link>
                  </Stack>
                )}
                {provider.phone && (
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <PhoneIcon fontSize="small" color="action" />
                    <Link href={`tel:${provider.phone}`} variant="body2" underline="hover">
                      {provider.phone}
                    </Link>
                  </Stack>
                )}
                {provider.website && (
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <LanguageIcon fontSize="small" color="action" />
                    <Link href={provider.website} target="_blank" rel="noopener noreferrer" variant="body2" underline="hover">
                      {provider.website.replace(/^https?:\/\//, '')}
                    </Link>
                  </Stack>
                )}
              </Stack>
            </Box>

            <Button
              component={RouterLink}
              to="/providers"
              startIcon={<EditIcon />}
              variant="outlined"
              size="small"
              sx={{ flexShrink: 0 }}
            >
              Manage providers
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderRadius: 3, textAlign: 'center', py: 2 }}>
            <Typography variant="h3" fontWeight={700} color="primary">
              {activities.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {activities.length === 1 ? 'Activity' : 'Activities'}
            </Typography>
          </Card>
        </Grid>
        {Object.entries(categoryBreakdown).slice(0, 3).map(([cat, count]) => (
          <Grid item xs={6} sm={3} key={cat}>
            <Card sx={{ borderRadius: 3, textAlign: 'center', py: 2 }}>
              <Typography variant="h3" fontWeight={700} color="secondary">
                {count}
              </Typography>
              <Typography variant="body2" color="text.secondary">{cat}</Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Activities header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={600}>
          Activities
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Add activity
        </Button>
      </Stack>
      <Divider sx={{ mb: 3 }} />

      {actionError && (
        <Typography color="error" sx={{ mb: 2 }}>
          {actionError}
        </Typography>
      )}

      {activities.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 6,
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 3,
          }}
        >
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            No activities yet for this provider.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Add first activity
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {activities.map((activity) => {
            const priceLabel = activity.priceGbp != null ? `£${activity.priceGbp.toFixed(2)}` : 'Free';
            const ageLabel = `Ages ${activity.minAge}–${activity.maxAge}`;
            return (
              <Grid item xs={12} sm={6} md={4} key={activity.id}>
                <Card sx={{ borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
                      <Chip label={activity.category} color="secondary" size="small" />
                      {activity.city && <Chip label={activity.city} size="small" />}
                    </Stack>
                    <Typography variant="h6" gutterBottom>
                      {activity.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {activity.locationName}
                    </Typography>
                    {activity.address && (
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        {activity.address}
                      </Typography>
                    )}
                    <Stack direction="row" spacing={2} sx={{ mt: 1.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        {ageLabel}
                      </Typography>
                      <Typography variant="body2" fontWeight={600} color="primary">
                        {priceLabel}
                      </Typography>
                    </Stack>
                    {activity.availabilitySlots?.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        {activity.availabilitySlots.map((slot) => (
                          <Typography key={slot} variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            {formatAvailabilitySlotLabel(slot)}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 1.5 }}>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEdit(activity)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => setDeleteConfirm(activity)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Add / Edit activity dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{editingActivity ? 'Edit activity' : 'Add activity'}</DialogTitle>
        <DialogContent>
          <ActivityFormFields
            form={form}
            onChange={setForm}
            categories={categories}
            cities={cities}
            providers={provider ? [provider] : []}
            showProviderSelect={false}
          />
          {actionError && (
            <Typography color="error" variant="body2" sx={{ mt: 2 }}>
              {actionError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !form.name.trim() || !form.category || !form.locationName.trim()}
          >
            {saving ? 'Saving...' : editingActivity ? 'Save changes' : 'Add activity'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete activity</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
