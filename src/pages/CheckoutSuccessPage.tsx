import { Box, Button, Card, CardContent, CircularProgress, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { checkoutCart } from '../api';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';

export default function CheckoutSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { refreshCart } = useCart();
  const [confirming, setConfirming] = useState(true);
  const [bookingCount, setBookingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.parentId) {
      setConfirming(false);
      return;
    }

    const sessionId = searchParams.get('session_id') ?? undefined;

    checkoutCart(user.parentId, sessionId)
      .then(async (result) => {
        setBookingCount(result.count);
        await refreshCart();
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Could not confirm checkout yet.');
      })
      .finally(() => setConfirming(false));
  }, [user?.parentId, searchParams]);

  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '60vh', px: 2 }}>
      <Card sx={{ maxWidth: 600, width: '100%', p: 3, borderRadius: 4 }}>
        <CardContent>
          {confirming ? (
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <CircularProgress size={24} />
              <Typography variant="body2" color="text.secondary">
                Confirming your booking and clearing your cart...
              </Typography>
            </Stack>
          ) : null}
          <Typography variant="h4" gutterBottom>
            Payment successful
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            {error
              ? error
              : bookingCount > 0
                ? `${bookingCount} booking${bookingCount === 1 ? '' : 's'} confirmed. An order confirmation email has been sent.`
                : 'Your payment was received. View bookings below if they do not appear immediately.'}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button variant="contained" color="primary" onClick={() => navigate('/profile#bookings')}>
              View my bookings
            </Button>
            <Button variant="outlined" color="primary" onClick={() => navigate('/cart')}>
              Back to cart
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
