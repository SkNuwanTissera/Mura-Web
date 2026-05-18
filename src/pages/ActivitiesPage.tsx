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
import { Activity, Child } from '../types';
import { useAuth } from '../hooks/useAuth';
import {
  getCategories,
  getCities,
  geocodePostcode,
  searchActivities,
  addActivityToCart,
  fetchChildren,
} from '../api';
import ActivityCard from '../components/ActivityCard';

export default function ActivitiesPage() {
  const [filters, setFilters] = useState({ age: '', category: '', city: '', locationName: '', postcode: '', radiusMiles: '' });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cartLoading, setCartLoading] = useState<string | null>(null);
  const [cartMessage, setCartMessage] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [sortOption, setSortOption] = useState('newest');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [totalCount, setTotalCount] = useState(0);
  const [mapZoom, setMapZoom] = useState(10);
  const [mapCenter, setMapCenter] = useState({ lat: 51.5074, lon: -0.1278 });

  const [children, setChildren] = useState<Child[]>([]);
  const [childDialogActivity, setChildDialogActivity] = useState<string | null>(null);
  const [selectedChildId, setSelectedChildId] = useState('');

  const { user } = useAuth();

  useEffect(() => {
    getCategories().then(setCategories).catch(() => setCategories([]));
    getCities().then(setCities).catch(() => setCities([]));
  }, []);

  useEffect(() => {
    if (user?.parentId) {
      fetchChildren(user.parentId).then(setChildren).catch(() => setChildren([]));
    }
  }, [user?.parentId]);

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
        setMapCenter(location);
        setTotalCount(items.length);
      } else {
        setTotalCount(result.total);
        const firstValid = items.find((item) => item.latitude != null && item.longitude != null);
        if (firstValid) {
          setMapCenter({ lat: firstValid.latitude as number, lon: firstValid.longitude as number });
        }
      }

      const sorted = sortActivities(items, currentSort);
      setActivities(sorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load activities from the backend. Verify the API URL and backend status.');
      setActivities([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCartClick = (activityId: string) => {
    if (!user?.parentId) {
      setCartMessage('Please log in and ensure your account is connected to a parent profile before adding to cart.');
      return;
    }
    setCartMessage('');
    setSelectedChildId(children.length > 0 ? children[0].id : '');
    setChildDialogActivity(activityId);
  };

  const handleChildDialogConfirm = async () => {
    if (!user?.parentId || !childDialogActivity || !selectedChildId) return;
    setChildDialogActivity(null);
    setCartLoading(childDialogActivity);
    try {
      await addActivityToCart(user.parentId, childDialogActivity, selectedChildId);
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

  const chips = useMemo(
    () => [filters.category, filters.city, filters.postcode, filters.radiusMiles ? `${filters.radiusMiles} miles` : '']
      .filter(Boolean) as string[],
    [filters.category, filters.city, filters.postcode, filters.radiusMiles]
  );

  const getMapUrl = (items: Activity[], center: { lat: number; lon: number }, zoom: number) => {
    const url = new URL('https://staticmap.openstreetmap.de/staticmap.php');
    url.searchParams.set('center', `${center.lat},${center.lon}`);
    url.searchParams.set('zoom', String(zoom));
    url.searchParams.set('size', '640x420');
    url.searchParams.set('maptype', 'mapnik');

    items
      .filter((item) => item.latitude != null && item.longitude != null)
      .slice(0, 20)
      .forEach((item) => {
        url.searchParams.append('markers', `${item.latitude},${item.longitude},red`);
      });

    return url.toString();
  };

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
        <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
          {totalCount} activit{totalCount === 1 ? 'y' : 'ies'} found
        </Typography>
      </Stack>

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

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Stack spacing={3}>
            {activities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                loading={loading}
                onAddToCart={() => handleAddToCartClick(activity.id)}
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

        <Grid item xs={12} md={5}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6">Map view</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" variant="outlined" onClick={() => setMapZoom((z) => Math.min(18, z + 1))}>
                Zoom in
              </Button>
              <Button size="small" variant="outlined" onClick={() => setMapZoom((z) => Math.max(2, z - 1))}>
                Zoom out
              </Button>
              <Typography variant="body2" sx={{ ml: 'auto', alignSelf: 'center' }}>
                Zoom {mapZoom}
              </Typography>
            </Box>
            <Box sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
              {activities.some((activity) => activity.latitude != null && activity.longitude != null) ? (
                <img
                  src={getMapUrl(activities, mapCenter, mapZoom)}
                  alt="Activity locations map"
                  style={{ width: '100%', display: 'block', height: '420px', objectFit: 'cover' }}
                />
              ) : (
                <Box sx={{ minHeight: 420, p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.paper' }}>
                  <Typography variant="body2" color="text.secondary">
                    No geocoded activity locations found. Use postcode/radius filters or update activities with coordinates.
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Grid>
      </Grid>

      {!loading && !activities.length && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          No activities found. Try opening filters and choosing broader criteria.
        </Typography>
      )}

      <Dialog open={!!childDialogActivity} onClose={() => setChildDialogActivity(null)} fullWidth maxWidth="xs">
        <DialogTitle>Select a child for this activity</DialogTitle>
        <DialogContent>
          {children.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              You have no child profiles yet. Please add a child on the Children page before adding activities to your cart.
            </Typography>
          ) : (
            <FormControl fullWidth sx={{ mt: 1 }}>
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
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChildDialogActivity(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleChildDialogConfirm}
            disabled={children.length === 0 || !selectedChildId}
          >
            Add to cart
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
