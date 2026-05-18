import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { CartItem } from '../types';
import { createCheckoutSession, fetchCartItems, removeCartItem } from '../api';

export default function CartPage() {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [billingName, setBillingName] = useState(user?.name ?? '');
  const [billingEmail, setBillingEmail] = useState(user?.email ?? '');
  const [billingAddressLine1, setBillingAddressLine1] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingPostcode, setBillingPostcode] = useState('');
  const [billingCountry, setBillingCountry] = useState('GB');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setBillingName(user?.name ?? '');
    setBillingEmail(user?.email ?? '');
  }, [user?.name, user?.email]);

  useEffect(() => {
    const loadCart = async () => {
      if (!user?.parentId) {
        return;
      }
      setLoading(true);
      setError('');
      try {
        const items = await fetchCartItems(user.parentId);
        setCartItems(items);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load cart items.');
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [user?.parentId]);


  const handleRemove = async (itemId: string) => {
    if (!user?.parentId) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      await removeCartItem(itemId);
      setCartItems((prev) => prev.filter((item) => item.id !== itemId));
      setSuccess('Removed item from cart.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove item.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!user?.parentId) {
      return;
    }
    setCheckoutLoading(true);
    setError('');
    try {
      const response = await createCheckoutSession({
        parentId: user.parentId,
        billingName,
        billingEmail,
        billingAddressLine1,
        billingCity,
        billingPostcode,
        billingCountry,
        successUrl: `${window.location.origin}/checkout/success`,
        cancelUrl: `${window.location.origin}/checkout/cancel`
      });

      if (!response.checkoutUrl) {
        throw new Error('Stripe checkout URL was not returned.');
      }

      window.location.href = response.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + (item.activity.priceGbp ?? 0), 0);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Cart
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Review selected activities, remove items, and checkout when ready.
      </Typography>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      {success && (
        <Typography color="primary" sx={{ mb: 2 }}>
          {success}
        </Typography>
      )}

      <Stack spacing={2}>
        {cartItems.map((item) => (
          <Card key={item.id} sx={{ p: 2, borderRadius: 4 }}>
            <CardContent>
              <Typography variant="h6">{item.activity.name}</Typography>
              <Typography color="text.secondary" sx={{ mb: 1 }}>
                {item.activity.category} • {item.activity.city}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                For: <strong>{item.child?.name ?? 'Unknown child'}</strong> (age {item.child?.age})
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Price: {item.activity.priceGbp != null ? `£${item.activity.priceGbp.toFixed(2)}` : 'Free'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Added: {new Date(item.createdAt).toLocaleString()}
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
              <Button size="small" variant="outlined" onClick={() => handleRemove(item.id)} disabled={loading}>
                Remove
              </Button>
            </CardActions>
          </Card>
        ))}
      </Stack>

      {!loading && cartItems.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          Your cart is empty. Add activities from the Explore page to check out together.
        </Typography>
      )}

      {cartItems.length > 0 && (
        <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Card sx={{ p: 2, borderRadius: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Billing details
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Name"
                  value={billingName}
                  onChange={(event) => setBillingName(event.target.value)}
                  fullWidth
                />
                <TextField
                  label="Email"
                  type="email"
                  value={billingEmail}
                  onChange={(event) => setBillingEmail(event.target.value)}
                  fullWidth
                />
                <TextField
                  label="Address line 1"
                  value={billingAddressLine1}
                  onChange={(event) => setBillingAddressLine1(event.target.value)}
                  fullWidth
                />
                <TextField
                  label="City"
                  value={billingCity}
                  onChange={(event) => setBillingCity(event.target.value)}
                  fullWidth
                />
                <TextField
                  label="Postcode"
                  value={billingPostcode}
                  onChange={(event) => setBillingPostcode(event.target.value)}
                  fullWidth
                />
                <TextField
                  label="Country"
                  value={billingCountry}
                  onChange={(event) => setBillingCountry(event.target.value)}
                  fullWidth
                />
              </Stack>
            </CardContent>
          </Card>

          <Divider />
          <Typography variant="h6">Total: £{totalPrice.toFixed(2)}</Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCheckout}
            disabled={checkoutLoading || !billingEmail || !billingName}
          >
            Checkout together
          </Button>
        </Box>
      )}
    </Box>
  );
}
