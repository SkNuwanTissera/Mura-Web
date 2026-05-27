import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { adminCancelBooking, fetchAdminBookings, fetchAdminPayments } from '../api';
import type { AdminActivityBooking, AdminPaymentHistory } from '../types';
import { formatAvailabilitySlotLabel } from '../utils/availabilitySlots';

type OperationsTab = 'bookings' | 'payments';

function formatDate(value?: string) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function formatMoney(amount?: number, currency = 'GBP') {
  if (amount == null) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount);
  } catch {
    return `£${amount.toFixed(2)}`;
  }
}

function shortId(id: string) {
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

export default function AdminOperationsPage() {
  const [tab, setTab] = useState<OperationsTab>('bookings');
  const [bookings, setBookings] = useState<AdminActivityBooking[]>([]);
  const [payments, setPayments] = useState<AdminPaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchDraft, setSearchDraft] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const filters = {
        status: statusFilter || undefined,
        q: appliedQuery || undefined,
      };
      const [nextBookings, nextPayments] = await Promise.all([
        fetchAdminBookings(filters),
        fetchAdminPayments(filters),
      ]);
      setBookings(nextBookings);
      setPayments(nextPayments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load operations data.');
    } finally {
      setLoading(false);
    }
  }, [appliedQuery, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const bookingStatuses = useMemo(
    () => [...new Set(bookings.map((booking) => booking.status).filter(Boolean))].sort(),
    [bookings],
  );

  const paymentStatuses = useMemo(
    () => [...new Set(payments.map((payment) => payment.status).filter(Boolean))].sort(),
    [payments],
  );

  const statusOptions = tab === 'bookings' ? bookingStatuses : paymentStatuses;

  const handleApplyFilters = () => {
    setAppliedQuery(searchDraft.trim());
  };

  const handleClearFilters = () => {
    setStatusFilter('');
    setSearchDraft('');
    setAppliedQuery('');
  };

  const handleJumpToPayment = (paymentId: string) => {
    setTab('payments');
    setSearchDraft(paymentId);
    setAppliedQuery(paymentId);
  };

  const handleAdminCancel = async (bookingId: string) => {
    setCancellingId(bookingId);
    setError('');
    try {
      await adminCancelBooking(bookingId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel booking.');
    } finally {
      setCancellingId(null);
    }
  };

  const activeRows = tab === 'bookings' ? bookings.length : payments.length;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Bookings & payments
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Platform-wide view for support and reconciliation. Search by parent email, activity, payment ID, or Stripe reference.
      </Typography>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      <Paper sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <TextField
            label="Search"
            size="small"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleApplyFilters();
              }
            }}
            placeholder="Email, activity, payment ID, Stripe session…"
            sx={{ minWidth: 280, flexGrow: 1 }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {statusOptions.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="contained" onClick={handleApplyFilters}>
            Apply
          </Button>
          <Button variant="outlined" onClick={handleClearFilters}>
            Clear
          </Button>
        </Box>
      </Paper>

      <Tabs
        value={tab}
        onChange={(_, value: OperationsTab) => {
          setTab(value);
          setStatusFilter('');
        }}
        sx={{ mb: 2 }}
      >
        <Tab value="bookings" label={`Bookings (${bookings.length})`} />
        <Tab value="payments" label={`Payments (${payments.length})`} />
      </Tabs>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {loading ? 'Loading…' : `${activeRows} ${tab === 'bookings' ? 'booking' : 'payment'}${activeRows === 1 ? '' : 's'} shown`}
      </Typography>

      {tab === 'bookings' ? (
        <Paper>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>When</TableCell>
                <TableCell>Parent</TableCell>
                <TableCell>Child</TableCell>
                <TableCell>Activity</TableCell>
                <TableCell>Timeslot</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8}>Loading bookings…</TableCell>
                </TableRow>
              ) : bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>No bookings match your filters.</TableCell>
                </TableRow>
              ) : (
                bookings.map((booking) => (
                  <TableRow key={booking.id} hover>
                    <TableCell>{formatDate(booking.createdAt)}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{booking.parentName || '—'}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {booking.parentEmail || booking.parentId}
                      </Typography>
                    </TableCell>
                    <TableCell>{booking.child?.name || '—'}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{booking.activity.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {booking.activity.providerName}
                        {booking.activity.city ? ` · ${booking.activity.city}` : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {booking.availabilitySlot
                        ? formatAvailabilitySlotLabel(booking.availabilitySlot)
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={booking.status} />
                    </TableCell>
                    <TableCell>
                      {booking.paymentRecordId ? (
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => handleJumpToPayment(booking.paymentRecordId!)}
                          title={booking.paymentRecordId}
                        >
                          {shortId(booking.paymentRecordId)}
                        </Button>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {booking.status.toUpperCase() !== 'CANCELLED' ? (
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          disabled={cancellingId === booking.id}
                          onClick={() => void handleAdminCancel(booking.id)}
                        >
                          Cancel
                        </Button>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Paper>
      ) : (
        <Paper>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>When</TableCell>
                <TableCell>Parent</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Bookings</TableCell>
                <TableCell>Stripe</TableCell>
                <TableCell>Payment ID</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7}>Loading payments…</TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>No payments match your filters.</TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id} hover>
                    <TableCell>{formatDate(payment.createdAt)}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {payment.parentName || payment.billingName || '—'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {payment.customerEmail || payment.parentId}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatMoney(payment.amountGbp, payment.currency)}</TableCell>
                    <TableCell>
                      <Chip size="small" label={payment.status} />
                    </TableCell>
                    <TableCell>{payment.bookingCount}</TableCell>
                    <TableCell>
                      <Typography variant="caption" component="div" title={payment.stripeSessionId}>
                        {payment.stripeSessionId ? `Session ${shortId(payment.stripeSessionId)}` : '—'}
                      </Typography>
                      {payment.stripePaymentIntentId ? (
                        <Typography variant="caption" color="text.secondary" component="div" title={payment.stripePaymentIntentId}>
                          Intent {shortId(payment.stripePaymentIntentId)}
                        </Typography>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" title={payment.id}>
                        {shortId(payment.id)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}
