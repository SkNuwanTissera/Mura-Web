import { useEffect, useState } from 'react';
import { Grid, Paper, Typography, Box, Button } from '@mui/material';
import ActivityIcon from '@mui/icons-material/EventAvailable';
import ChildCareIcon from '@mui/icons-material/FamilyRestroom';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import { useAuth } from '../hooks/useAuth';
import { getCategories, getCities } from '../api';
import { Link as RouterLink } from 'react-router-dom';

const summaryItems = [
  { title: 'Explore Activities', description: 'Search by age, city, category, and find the best family moments.', icon: <ActivityIcon fontSize="large" color="primary" /> , path: '/activities' },
  { title: 'Manage Children', description: 'Add and update child profiles to keep recommendations personalized.', icon: <ChildCareIcon fontSize="large" color="primary" />, path: '/children' },
  { title: 'Family Insights', description: 'See available cities and categories from the backend data.', icon: <ThumbUpIcon fontSize="large" color="primary" />, path: '/activities' }
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [cities, setCities] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    getCities().then(setCities).catch(() => setCities([]));
    getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

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
    </Box>
  );
}
