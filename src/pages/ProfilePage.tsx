import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  Typography
} from '@mui/material';
import { fetchBookings, fetchPaymentHistory } from '../api';
import { useAuth } from '../hooks/useAuth';
import { ActivityBooking, PaymentHistory } from '../types';

const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency || 'GBP'
  }).format(amount);

const formatDate = (value: string) => new Date(value).toLocaleString();

export default function ProfilePage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<ActivityBooking[]>([]);
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.parentId) {
        return;
      }

      setLoading(true);
      setError('');
      try {
        const [nextBookings, nextPayments] = await Promise.all([
          fetchBookings(user.parentId),
          fetchPaymentHistory(user.parentId)
        ]);
        setBookings(nextBookings);
        setPayments(nextPayments);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile details.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user?.parentId]);

  useEffect(() => {
    if (!loading && window.location.hash) {
      document.querySelector(window.location.hash)?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [loading]);

  const totalSpent = useMemo(
    () => payments.reduce((sum, payment) => sum + (payment.amountGbp ?? 0), 0),
    [payments]
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Profile
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage your account, bookings, and payment history.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ p: 2, borderRadius: 4, mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Account
          </Typography>
          <Typography variant="body1">{user?.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.email}
          </Typography>
          {user?.role ? (
            <Chip label={user.role} size="small" sx={{ mt: 1 }} />
          ) : null}
        </CardContent>
      </Card>

      {user?.role === 'PARENT' && loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : user?.role === 'PARENT' ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Card id="bookings" sx={{ p: 2, borderRadius: 4 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  My Bookings
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Confirmed activities from completed checkouts.
                </Typography>
                <Stack spacing={2}>
                  {bookings.map((booking) => (
                    <Box key={booking.id}>
                      <Stack direction="row" justifyContent="space-between" gap={2}>
                        <Box>
                          <Typography variant="subtitle1">{booking.activity.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {booking.activity.category} • {booking.activity.city}
                          </Typography>
                          {booking.child && (
                            <Typography variant="body2" color="text.secondary">
                              Child: {booking.child.name} (age {booking.child.age})
                            </Typography>
                          )}
                          <Typography variant="body2" color="text.secondary">
                            Booked: {formatDate(booking.createdAt)}
                          </Typography>
                        </Box>
                        <Chip label={booking.status} color="success" size="small" />
                      </Stack>
                      <Divider sx={{ mt: 2 }} />
                    </Box>
                  ))}
                </Stack>
                {bookings.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    You do not have any bookings yet.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            <Card id="payments" sx={{ p: 2, borderRadius: 4 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Payment History
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Total paid: {formatCurrency(totalSpent, 'GBP')}
                </Typography>
                <Stack spacing={2}>
                  {payments.map((payment) => (
                    <Box key={payment.id}>
                      <Stack direction="row" justifyContent="space-between" gap={2}>
                        <Box>
                          <Typography variant="subtitle1">
                            {formatCurrency(payment.amountGbp, payment.currency)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(payment.createdAt)}
                          </Typography>
                          {payment.customerEmail && (
                            <Typography variant="body2" color="text.secondary">
                              {payment.customerEmail}
                            </Typography>
                          )}
                        </Box>
                        <Chip label={payment.status} color="primary" size="small" />
                      </Stack>
                      <Divider sx={{ mt: 2 }} />
                    </Box>
                  ))}
                </Stack>
                {payments.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No payments have been recorded yet.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Bookings and payment history are available for parent accounts.
        </Typography>
      )}
    </Box>
  );
}
