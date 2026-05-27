import { useEffect, useMemo, useState, ChangeEvent } from 'react';
import {
  Box,
  Button,
  Chip,
  Grid,
  MenuItem,
  Select,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  Radio,
  FormControlLabel,
  Pagination
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import { Activity, Child, Provider } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import {
  getCategories,
  getCities,
  geocodePostcode,
  searchActivities,
  addActivityToCart,
  fetchChildren,
  fetchProviders,
  createActivity,
  updateActivity,
  deleteActivity,
} from '../api';
import {
  activityFormStateFromActivity,
} from '../utils/activityForm';
import ActivityCard from '../components/ActivityCard';
import ActivityDetailPanel from '../components/ActivityDetailPanel';
import ActivityFormFields from '../components/ActivityFormFields';
import {
  activityFormStateToPayload,
  emptyActivityFormState,
  validateActivityFormState,
  ActivityFormState,
} from '../utils/activityForm';
import { formatAvailabilitySlotLabel } from '../utils/availabilitySlots';

export default function ActivitiesPage() {
  const [filters, setFilters] = useState({ age: '', category: '', city: '', locationName: '', postcode: '', radiusMiles: '' });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Activity | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [activityForm, setActivityForm] = useState<ActivityFormState>(emptyActivityFormState());
  const [activitySaving, setActivitySaving] = useState(false);
  const [activityFormError, setActivityFormError] = useState('');
  const [cartLoading, setCartLoading] = useState<string | null>(null);
  const [cartMessage, setCartMessage] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [sortOption, setSortOption] = useState('newest');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const [children, setChildren] = useState<Child[]>([]);
  const [childDialogActivity, setChildDialogActivity] = useState<string | null>(null);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [selectedAvailabilitySlot, setSelectedAvailabilitySlot] = useState('');

  const { user } = useAuth();
  const { refreshCart } = useCart();

  const canManageActivities = user?.role === 'ADMIN' || user?.role === 'PROVIDER';
  const isParent = user?.role === 'PARENT';

  useEffect(() => {
    getCategories().then(setCategories).catch(() => setCategories([]));
    getCities().then(setCities).catch(() => setCities([]));
  }, []);

  useEffect(() => {
    if (user && (user.role === 'ADMIN' || user.role === 'PROVIDER')) {
      fetchProviders().then(setProviders).catch(() => setProviders([]));
    }
  }, [user]);

  useEffect(() => {
    if (user?.parentId && user.role === 'PARENT') {
      fetchChildren(user.parentId).then(setChildren).catch(() => setChildren([]));
    }
  }, [user?.parentId, user?.role]);

  useEffect(() => {
    loadActivities(page, filters, sortOption);
  }, [page, sortOption]);

  const sortActivities = (items: Activity[], option: string) => {
    if (option === 'ageAsc') {
      return [...items].sort((a, b) => (a.minAge || 0) - (b.minAge || 0));
    }
    if (option === 'ageDesc') {
      return [...items].sort((a, b) => (b.maxAge || 0) - (a.maxAge || 0));
    }
    if (option === 'priceAsc') {
      return [...items].sort((a, b) => (a.priceGbp ?? 0) - (b.priceGbp ?? 0));
    }
    if (option === 'priceDesc') {
      return [...items].sort((a, b) => (b.priceGbp ?? 0) - (a.priceGbp ?? 0));
    }
    return items;
  };

  const filterByRadius = (items: Activity[], lat: number, lon: number, radiusMiles: number) => {
    const toRadians = (value: number) => (value * Math.PI) / 180;
    return items.filter((item) => {
      if (item.latitude == null || item.longitude == null) {
        return false;
      }
      const earthRadiusMiles = 3958.8;
      const dLat = toRadians(item.latitude - lat);
      const dLon = toRadians(item.longitude - lon);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat)) * Math.cos(toRadians(item.latitude)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const distance =
        earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return distance <= radiusMiles;
    });
  };

  const loadActivities = async (
    requestedPage = 1,
    currentFilters = filters,
    currentSort = sortOption
  ) => {
    setLoading(true);
    setError('');
    try {
      const age = currentFilters.age ? Number(currentFilters.age) : undefined;
      const radiusMiles = currentFilters.radiusMiles ? Number(currentFilters.radiusMiles) : undefined;
      const result = await searchActivities({
        age,
        category: currentFilters.category || undefined,
        city: currentFilters.city || undefined,
        locationName: currentFilters.locationName || undefined,
        page: requestedPage,
        limit: radiusMiles ? 100 : pageSize
      });

      let items = result.items;
      if (currentFilters.postcode && radiusMiles) {
        const location = await geocodePostcode(currentFilters.postcode);
        if (!location) {
          throw new Error('Unable to resolve postcode. Please try another postcode.');
        }
        items = filterByRadius(items, location.lat, location.lon, radiusMiles);
        setTotalCount(items.length);
      } else {
        setTotalCount(result.total);
      }

      const sorted = sortActivities(items, currentSort);
      setActivities(sorted);
      setSelectedActivity((current) => {
        if (!current) return null;
        return sorted.find((item) => item.id === current.id) ?? null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load activities from the backend. Verify the API URL and backend status.');
      setActivities([]);
      setTotalCount(0);
      setSelectedActivity(null);
    } finally {
      setLoading(false);
    }
  };

  const cartDialogActivity = useMemo(() => {
    if (!childDialogActivity) return null;
    return (
      activities.find((item) => item.id === childDialogActivity) ??
      (selectedActivity?.id === childDialogActivity ? selectedActivity : null)
    );
  }, [childDialogActivity, activities, selectedActivity]);

  const cartDialogSlots = cartDialogActivity?.availabilitySlots ?? [];
  const cartDialogRequiresSlot = cartDialogSlots.length > 0;

  const handleAddToCartClick = (activityId: string) => {
    if (!user || user.role !== 'PARENT') {
      setCartMessage('Sign in as a parent to add activities to your cart.');
      return;
    }
    if (!user.parentId) {
      setCartMessage('Your parent profile is not linked to this account.');
      return;
    }
    const activity =
      activities.find((item) => item.id === activityId) ??
      (selectedActivity?.id === activityId ? selectedActivity : null);
    const slots = activity?.availabilitySlots ?? [];
    setCartMessage('');
    setSelectedChildId(children.length > 0 ? children[0].id : '');
    setSelectedAvailabilitySlot(slots.length > 0 ? slots[0] : '');
    setChildDialogActivity(activityId);
  };

  const handleChildDialogConfirm = async () => {
    if (!user?.parentId || !childDialogActivity || !selectedChildId) return;
    if (cartDialogRequiresSlot && !selectedAvailabilitySlot) return;
    const activityId = childDialogActivity;
    setChildDialogActivity(null);
    setCartLoading(activityId);
    try {
      await addActivityToCart(
        user.parentId,
        activityId,
        selectedChildId,
        cartDialogRequiresSlot ? selectedAvailabilitySlot : undefined
      );
      await refreshCart();
      setCartMessage('Activity added to cart successfully.');
    } catch (err) {
      setCartMessage(err instanceof Error ? err.message : 'Could not add activity to cart.');
    } finally {
      setCartLoading(null);
    }
  };

  const handleApplyFilters = async () => {
    setFilterOpen(false);
    setPage(1);
    await loadActivities(1, filters, sortOption);
  };

  const handleResetFilters = async () => {
    const resetValues = { age: '', category: '', city: '', locationName: '', postcode: '', radiusMiles: '' };
    setFilters(resetValues);
    setPage(1);
    setFilterOpen(false);
    await loadActivities(1, resetValues, sortOption);
  };

  const handlePageChange = (_event: unknown, value: number) => {
    setPage(value);
  };

  const handleSortChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSortOption(event.target.value);
    setSortOpen(false);
  };

  const handleOpenActivityDialog = () => {
    const defaultProviderId = user?.role === 'PROVIDER'
      ? (user.providerId ?? '')
      : (providers.length === 1 ? providers[0].id : '');
    setEditingActivity(null);
    setActivityForm(emptyActivityFormState(defaultProviderId));
    setActivityFormError('');
    setActivityDialogOpen(true);
  };

  const handleOpenEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setActivityForm(activityFormStateFromActivity(activity));
    setActivityFormError('');
    setActivityDialogOpen(true);
  };

  const handleSaveActivity = async () => {
    const validationError = validateActivityFormState(activityForm);
    if (validationError) {
      setActivityFormError(validationError);
      return;
    }

    setActivitySaving(true);
    setActivityFormError('');
    try {
      const payload = activityFormStateToPayload(activityForm, activityForm.providerId);
      if (editingActivity) {
        await updateActivity(editingActivity.id, payload);
      } else {
        await createActivity(payload);
      }
      setActivityDialogOpen(false);
      setEditingActivity(null);
      setActivityForm(emptyActivityFormState());
      setPage(1);
      await loadActivities(1, filters, sortOption);
      getCategories().then(setCategories).catch(() => setCategories([]));
      getCities().then(setCities).catch(() => setCities([]));
    } catch (err) {
      setActivityFormError(
        err instanceof Error
          ? err.message
          : editingActivity
            ? 'Unable to update activity.'
            : 'Unable to create activity.'
      );
    } finally {
      setActivitySaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    setDeleteSaving(true);
    setError('');
    try {
      await deleteActivity(deleteTarget.id);
      if (selectedActivity?.id === deleteTarget.id) {
        setSelectedActivity(null);
      }
      setDeleteTarget(null);
      await loadActivities(page, filters, sortOption);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete activity.');
    } finally {
      setDeleteSaving(false);
    }
  };

  const canEditActivity = (activity: Activity) => {
    if (!canManageActivities) {
      return false;
    }
    if (user?.role === 'ADMIN') {
      return true;
    }
    return user?.role === 'PROVIDER' && !!user.providerId && activity.providerId === user.providerId;
  };

  const chips = useMemo(
    () => [filters.category, filters.city, filters.postcode, filters.radiusMiles ? `${filters.radiusMiles} miles` : '']
      .filter(Boolean) as string[],
    [filters.category, filters.city, filters.postcode, filters.radiusMiles]
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Activity Explorer
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Browse activities and narrow results with filters or custom sorting. Use the buttons below to open filter and sort popups.
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Button
          startIcon={<FilterListIcon />}
          variant="outlined"
          onClick={() => setFilterOpen(true)}
        >
          Filter
        </Button>
        <Button
          startIcon={<SortIcon />}
          variant="outlined"
          onClick={() => setSortOpen(true)}
        >
          Sort
        </Button>
        <Button
          startIcon={<RefreshIcon />}
          variant="contained"
          onClick={() => loadActivities(page, filters, sortOption)}
        >
          Refresh
        </Button>
        <Button
          startIcon={<AddIcon />}
          variant="contained"
          color="secondary"
          onClick={handleOpenActivityDialog}
          sx={{ display: canManageActivities ? 'inline-flex' : 'none' }}
        >
          Add activity
        </Button>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
          {totalCount} activit{totalCount === 1 ? 'y' : 'ies'} found
        </Typography>
      </Stack>

      <Dialog
        open={activityDialogOpen}
        onClose={() => {
          setActivityDialogOpen(false);
          setEditingActivity(null);
        }}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>{editingActivity ? 'Edit activity' : 'Add activity'}</DialogTitle>
        <DialogContent>
          <ActivityFormFields
            form={activityForm}
            onChange={setActivityForm}
            categories={categories}
            cities={cities}
            providers={providers}
            showProviderSelect={user?.role === 'ADMIN'}
          />
          {!editingActivity && providers.length === 0 && user?.role === 'ADMIN' && (
            <Typography variant="body2" color="error" sx={{ mt: 2 }}>
              Add a provider first before creating activities.
            </Typography>
          )}
          {activityFormError && (
            <Typography variant="body2" color="error" sx={{ mt: 2 }}>
              {activityFormError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setActivityDialogOpen(false);
              setEditingActivity(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveActivity}
            disabled={activitySaving || (!editingActivity && user?.role === 'ADMIN' && providers.length === 0)}
          >
            {activitySaving ? 'Saving...' : editingActivity ? 'Save changes' : 'Create activity'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete activity</DialogTitle>
        <DialogContent>
          <Typography>
            Delete &quot;{deleteTarget?.name}&quot;? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleteSaving}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleConfirmDelete} disabled={deleteSaving}>
            {deleteSaving ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={filterOpen} onClose={() => setFilterOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Filter activities</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Child age"
                value={filters.age}
                onChange={(event) => setFilters((prev) => ({ ...prev, age: event.target.value }))}
                type="number"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={filters.category}
                  label="Category"
                  onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))}
                >
                  <MenuItem value="">Any category</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>City</InputLabel>
                <Select
                  value={filters.city}
                  label="City"
                  onChange={(event) => setFilters((prev) => ({ ...prev, city: event.target.value }))}
                >
                  <MenuItem value="">Any city</MenuItem>
                  {cities.map((city) => (
                    <MenuItem key={city} value={city}>
                      {city}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location or provider"
                value={filters.locationName}
                onChange={(event) => setFilters((prev) => ({ ...prev, locationName: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Postcode"
                value={filters.postcode}
                onChange={(event) => setFilters((prev) => ({ ...prev, postcode: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Radius</InputLabel>
                <Select
                  value={filters.radiusMiles}
                  label="Radius"
                  onChange={(event) => setFilters((prev) => ({ ...prev, radiusMiles: event.target.value }))}
                >
                  <MenuItem value="">Any distance</MenuItem>
                  <MenuItem value="5">5 miles</MenuItem>
                  <MenuItem value="10">10 miles</MenuItem>
                  <MenuItem value="15">15 miles</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleResetFilters}>Reset</Button>
          <Button onClick={() => setFilterOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleApplyFilters}>
            Apply filters
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={sortOpen} onClose={() => setSortOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Sort activities</DialogTitle>
        <DialogContent>
          <FormControl component="fieldset">
            <RadioGroup value={sortOption} onChange={handleSortChange}>
              <FormControlLabel value="newest" control={<Radio />} label="Newest first" />
              <FormControlLabel value="ageAsc" control={<Radio />} label="Age: low to high" />
              <FormControlLabel value="ageDesc" control={<Radio />} label="Age: high to low" />
              <FormControlLabel value="priceAsc" control={<Radio />} label="Price: low to high" />
              <FormControlLabel value="priceDesc" control={<Radio />} label="Price: high to low" />
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSortOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {chips.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          {chips.map((chip) => (
            <Chip key={chip} label={chip} color="secondary" />
          ))}
        </Stack>
      )}

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Grid container spacing={3} alignItems="flex-start">
        <Grid item xs={12} md={selectedActivity ? 5 : 12}>
          <Stack spacing={selectedActivity ? 1.5 : 3}>
            {activities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                loading={loading}
                selected={selectedActivity?.id === activity.id}
                compact={!!selectedActivity}
                onSelect={() => setSelectedActivity(activity)}
                onAddToCart={
                  !selectedActivity && isParent
                    ? () => handleAddToCartClick(activity.id)
                    : undefined
                }
                onEdit={
                  !selectedActivity && canEditActivity(activity)
                    ? () => handleOpenEditActivity(activity)
                    : undefined
                }
                onDelete={
                  !selectedActivity && canEditActivity(activity)
                    ? () => setDeleteTarget(activity)
                    : undefined
                }
              />
            ))}
          </Stack>

          {totalCount > pageSize && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={Math.ceil(totalCount / pageSize)}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </Grid>

        {selectedActivity ? (
          <Grid item xs={12} md={7}>
            <ActivityDetailPanel
              activity={selectedActivity}
              onAddToCart={isParent ? () => handleAddToCartClick(selectedActivity.id) : undefined}
              onEdit={
                canEditActivity(selectedActivity)
                  ? () => handleOpenEditActivity(selectedActivity)
                  : undefined
              }
              onDelete={
                canEditActivity(selectedActivity) ? () => setDeleteTarget(selectedActivity) : undefined
              }
              addToCartLoading={cartLoading === selectedActivity.id}
            />
          </Grid>
        ) : null}
      </Grid>

      {!loading && !activities.length && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          No activities found. Try opening filters and choosing broader criteria.
        </Typography>
      )}

      <Dialog open={!!childDialogActivity} onClose={() => setChildDialogActivity(null)} fullWidth maxWidth="xs">
        <DialogTitle>Add to cart</DialogTitle>
        <DialogContent>
          {children.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              You have no child profiles yet. Please add a child on the Children page before adding activities to your cart.
            </Typography>
          ) : (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Child</InputLabel>
                <Select
                  value={selectedChildId}
                  label="Child"
                  onChange={(event) => setSelectedChildId(event.target.value)}
                >
                  {children.map((child) => (
                    <MenuItem key={child.id} value={child.id}>
                      {child.name} (age {child.age})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {cartDialogRequiresSlot ? (
                <FormControl fullWidth>
                  <InputLabel>Timeslot</InputLabel>
                  <Select
                    value={selectedAvailabilitySlot}
                    label="Timeslot"
                    onChange={(event) => setSelectedAvailabilitySlot(event.target.value)}
                  >
                    {cartDialogSlots.map((slot) => (
                      <MenuItem key={slot} value={slot}>
                        {formatAvailabilitySlotLabel(slot)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : null}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChildDialogActivity(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleChildDialogConfirm}
            disabled={
              children.length === 0 ||
              !selectedChildId ||
              (cartDialogRequiresSlot && !selectedAvailabilitySlot)
            }
          >
            Add to cart
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
