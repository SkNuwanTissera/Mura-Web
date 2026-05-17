import { Box, Button, Card, CardContent, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function CheckoutCancelPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '60vh', px: 2 }}>
      <Card sx={{ maxWidth: 600, width: '100%', p: 3, borderRadius: 4 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Checkout cancelled
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Your payment session was cancelled or did not complete. You can try again from your cart.
          </Typography>
          <Button variant="contained" color="primary" onClick={() => navigate('/cart')}>
            Return to cart
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
