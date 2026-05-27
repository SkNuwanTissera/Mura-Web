import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  Stack,
  Typography
} from '@mui/material';
import { cancelBooking, fetchBookings, fetchPaymentHistory, updateBooking } from '../api';
import BookingEditDialog from '../components/BookingEditDialog';
import { useAuth } from '../hooks/useAuth';
import { ActivityBooking, PaymentHistory } from '../types';
import { formatAvailabilitySlotLabel } from '../utils/availabilitySlots';

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
  const [actionError, setActionError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingBooking, setEditingBooking] = useState<ActivityBooking | null>(null);
  const [cancellingBooking, setCancellingBooking] = useState<ActivityBooking | null>(null);

  const loadProfile = useCallback(async () => {
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
  }, [user?.parentId]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!loading && window.location.hash) {
      document.querySelector(window.location.hash)?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [loading]);

  const totalSpent = useMemo(
    () => payments.reduce((sum, payment) => sum + (payment.amountGbp ?? 0), 0),
    [payments]
  );

  const isCancelled = (status: string) => status.toUpperCase() === 'CANCELLED';

  const handleSaveBooking = async (availabilitySlot: string) => {
    if (!editingBooking) {
      return;
    }
    setSaving(true);
    setActionError('');
    try {
      await updateBooking(editingBooking.id, availabilitySlot);
      setEditingBooking(null);
      await loadProfile();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update booking.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancellingBooking) {
      return;
    }
    setSaving(true);
    setActionError('');
    try {
      await cancelBooking(cancellingBooking.id);
      setCancellingBooking(null);
      await loadProfile();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to cancel booking.');
    } finally {
      setSaving(false);
    }
  };

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

      {actionError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setActionError('')}>
          {actionError}
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
                  {bookings.map((booking) => {
                    const cancelled = isCancelled(booking.status);
                    return (
                      <Box key={booking.id}>
                        <Stack direction="row" justifyContent="space-between" gap={2}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1">{booking.activity.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {booking.activity.category} • {booking.activity.city}
                            </Typography>
                            {booking.child && (
                              <Typography variant="body2" color="text.secondary">
                                Child: {booking.child.name} (age {booking.child.age})
                              </Typography>
                            )}
                            {booking.availabilitySlot && (
                              <Typography variant="body2" color="text.secondary">
                                Timeslot: {formatAvailabilitySlotLabel(booking.availabilitySlot)}
                              </Typography>
                            )}
                            <Typography variant="body2" color="text.secondary">
                              Booked: {formatDate(booking.createdAt)}
                            </Typography>
                          </Box>
                          <Stack alignItems="flex-end" spacing={1}>
                            <Chip
                              label={booking.status}
                              color={cancelled ? 'default' : 'success'}
                              size="small"
                            />
                            {!cancelled && (
                              <Stack direction="row" spacing={1}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => setEditingBooking(booking)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  onClick={() => setCancellingBooking(booking)}
                                >
                                  Cancel
                                </Button>
                              </Stack>
                            )}
                          </Stack>
                        </Stack>
                        <Divider sx={{ mt: 2 }} />
                      </Box>
                    );
                  })}
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

      <BookingEditDialog
        booking={editingBooking}
        open={Boolean(editingBooking)}
        saving={saving}
        onClose={() => setEditingBooking(null)}
        onSave={handleSaveBooking}
      />

      <Dialog open={Boolean(cancellingBooking)} onClose={() => setCancellingBooking(null)}>
        <DialogTitle>Cancel booking?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will cancel your booking for {cancellingBooking?.activity.name} and return the
            timeslot to the provider&apos;s availability.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancellingBooking(null)} disabled={saving}>
            Keep booking
          </Button>
          <Button color="error" variant="contained" onClick={() => void handleConfirmCancel()} disabled={saving}>
            Cancel booking
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
