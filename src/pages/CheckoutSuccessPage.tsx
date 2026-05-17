import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function CheckoutSuccessPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '60vh', px: 2 }}>
      <Card sx={{ maxWidth: 600, width: '100%', p: 3, borderRadius: 4 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Payment successful
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Your booking is confirmed and an order confirmation email has been sent.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button variant="contained" color="primary" onClick={() => navigate('/profile#bookings')}>
              View my bookings
            </Button>
            <Button variant="outlined" color="primary" onClick={() => navigate('/profile#payments')}>
              View payment history
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
