import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Grid,
  MenuItem,
  Select,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Stack
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Activity } from '../types';
import { getCategories, getCities, searchActivities } from '../api';
import ActivityCard from '../components/ActivityCard';

export default function ActivitiesPage() {
  const [filters, setFilters] = useState({ age: '', category: '', city: '', locationName: '' });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getCategories().then(setCategories).catch(() => setCategories([]));
    getCities().then(setCities).catch(() => setCities([]));
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    try {
      const age = filters.age ? Number(filters.age) : undefined;
      const result = await searchActivities({
        age,
        category: filters.category || undefined,
        city: filters.city || undefined,
        locationName: filters.locationName || undefined
      });
      setActivities(result);
    } catch (err) {
      setError('Unable to load activities from the backend. Verify the API URL and backend status.');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const chips = useMemo(
    () => [filters.category, filters.city].filter(Boolean) as string[],
    [filters.category, filters.city]
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Activity Explorer
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Find activities using the backend search API. Use age, category, and city filters to narrow results.
      </Typography>

      <Card sx={{ mb: 3, p: 3, borderRadius: 4 }}>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Child age"
              value={filters.age}
              onChange={(event) => setFilters((prev) => ({ ...prev, age: event.target.value }))}
              type="number"
            />
          </Grid>
          <Grid item xs={12} md={3}>
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
          <Grid item xs={12} md={3}>
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
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Location or provider"
              value={filters.locationName}
              onChange={(event) => setFilters((prev) => ({ ...prev, locationName: event.target.value }))}
            />
          </Grid>
          <Grid item xs={12} md={12}>
            <Button
              onClick={handleSearch}
              startIcon={<SearchIcon />}
              variant="contained"
              size="large"
            >
              Search activities
            </Button>
          </Grid>
        </Grid>
      </Card>

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
        {activities.map((activity) => (
          <Grid item xs={12} md={6} key={activity.id}>
            <ActivityCard activity={activity} loading={loading} />
          </Grid>
        ))}
      </Grid>

      {!loading && !activities.length && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          Search for activities to see results here.
        </Typography>
      )}
    </Box>
  );
}
