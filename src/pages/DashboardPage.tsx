import { useEffect, useMemo, useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Stack,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import ActivityIcon from '@mui/icons-material/EventAvailable';
import ChildCareIcon from '@mui/icons-material/FamilyRestroom';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { addActivityToCart, fetchRecommendedActivities, getCategories, getCities } from '../api';
import { Activity, ChildRecommendations } from '../types';
import { Link as RouterLink } from 'react-router-dom';
import ActivityCard from '../components/ActivityCard';
import { formatAvailabilitySlotLabel } from '../utils/availabilitySlots';

const summaryItems = [
  { title: 'Explore Activities', description: 'Search by age, city, category, and find the best family moments.', icon: <ActivityIcon fontSize="large" color="primary" /> , path: '/activities' },
  { title: 'Manage Children', description: 'Add and update child profiles to keep recommendations personalized.', icon: <ChildCareIcon fontSize="large" color="primary" />, path: '/children' },
  { title: 'Family Insights', description: 'See available cities and categories from the backend data.', icon: <ThumbUpIcon fontSize="large" color="primary" />, path: '/activities' }
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { refreshCart } = useCart();
  const [cities, setCities] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<ChildRecommendations[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState<string | null>(null);
  const [cartMessage, setCartMessage] = useState('');
  const [slotDialog, setSlotDialog] = useState<{ activity: Activity; childId: string } | null>(null);
  const [selectedAvailabilitySlot, setSelectedAvailabilitySlot] = useState('');

  const isParent = user?.role === 'PARENT';

  useEffect(() => {
    getCities().then(setCities).catch(() => setCities([]));
    getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!isParent || !user?.parentId) {
      setRecommendations([]);
      return;
    }

    setRecommendationsLoading(true);
    fetchRecommendedActivities(user.parentId)
      .then(setRecommendations)
      .catch(() => setRecommendations([]))
      .finally(() => setRecommendationsLoading(false));
  }, [isParent, user?.parentId]);

  const slotDialogSlots = useMemo(() => slotDialog?.activity.availabilitySlots ?? [], [slotDialog]);

  const handleAddToCart = (activity: Activity, childId: string) => {
    if (!user?.parentId) {
      return;
    }

    const slots = activity.availabilitySlots ?? [];
    if (slots.length > 0) {
      setSelectedAvailabilitySlot('');
      setSlotDialog({ activity, childId });
      return;
    }

    void completeAddToCart(activity, childId);
  };

  const completeAddToCart = async (activity: Activity, childId: string, availabilitySlot?: string) => {
    if (!user?.parentId) {
      return;
    }

    setCartLoading(activity.id);
    setCartMessage('');
    try {
      await addActivityToCart(user.parentId, activity.id, childId, availabilitySlot);
      await refreshCart();
      setCartMessage(`${activity.name} added to cart.`);
      setSlotDialog(null);
    } catch (err) {
      setCartMessage(err instanceof Error ? err.message : 'Could not add activity to cart.');
    } finally {
      setCartLoading(null);
    }
  };

  const handleSlotDialogConfirm = async () => {
    if (!slotDialog || !selectedAvailabilitySlot) {
      return;
    }

    await completeAddToCart(slotDialog.activity, slotDialog.childId, selectedAvailabilitySlot);
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome, {user?.name}.
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 680 }}>
          Mura makes family planning feel easy. Search activities, manage children, and find local experiences with the data powered by your backend.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {summaryItems.map((summary) => (
          <Grid key={summary.title} item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>{summary.icon}<Typography variant="h6">{summary.title}</Typography></Box>
              <Typography color="text.secondary" sx={{ flexGrow: 1 }}>{summary.description}</Typography>
              <Button component={RouterLink} to={summary.path} variant="contained" sx={{ mt: 2 }}>
                Open
              </Button>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {isParent ? (
        <Box sx={{ mt: 5 }}>
          <Typography variant="h5" gutterBottom>
            Recommended activities
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Matched to your children&apos;s age, city, and budget.
          </Typography>

          {cartMessage ? (
            <Typography color="primary" sx={{ mb: 2 }}>
              {cartMessage}
            </Typography>
          ) : null}

          {recommendationsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : recommendations.length === 0 ? (
            <Paper sx={{ p: 3, borderRadius: 4 }}>
              <Typography color="text.secondary">
                Add child profiles on the Children page to see personalized recommendations.
              </Typography>
              <Button component={RouterLink} to="/children" variant="contained" sx={{ mt: 2 }}>
                Manage children
              </Button>
            </Paper>
          ) : (
            <Stack spacing={4}>
              {recommendations.map((section) => (
                <Box key={section.childId}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    For {section.childName}
                  </Typography>
                  {section.activities.length === 0 ? (
                    <Typography color="text.secondary">
                      No matching activities found. Try updating city or budget in the child profile.
                    </Typography>
                  ) : (
                    <Grid container spacing={2}>
                      {section.activities.map((activity) => (
                        <Grid key={`${section.childId}-${activity.id}`} item xs={12} sm={6} md={4}>
                          <ActivityCard
                            activity={activity}
                            loading={cartLoading === activity.id}
                            compact
                            onAddToCart={() => handleAddToCart(activity, section.childId)}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      ) : null}

      <Box sx={{ mt: 5 }}>
        <Paper sx={{ p: 3, backgroundColor: 'secondary.light' }}>
          <Typography variant="h6" gutterBottom>
            Data snapshot
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Available cities: {cities.length ? cities.join(', ') : 'Loading...' }
          </Typography>
          <Typography variant="body2">
            Activity categories: {categories.length ? categories.join(', ') : 'Loading...' }
          </Typography>
        </Paper>
      </Box>

      <Dialog open={!!slotDialog} onClose={() => setSlotDialog(null)} fullWidth maxWidth="xs">
        <DialogTitle>Choose a timeslot</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel id="home-slot-label">Timeslot</InputLabel>
            <Select
              labelId="home-slot-label"
              label="Timeslot"
              value={selectedAvailabilitySlot}
              onChange={(event) => setSelectedAvailabilitySlot(event.target.value)}
            >
              {slotDialogSlots.map((slot) => (
                <MenuItem key={slot} value={slot}>
                  {formatAvailabilitySlotLabel(slot)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSlotDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSlotDialogConfirm} disabled={!selectedAvailabilitySlot}>
            Add to cart
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
