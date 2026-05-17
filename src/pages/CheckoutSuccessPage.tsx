import { Box, Button, Card, CardContent, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function CheckoutSuccessPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '60vh', px: 2 }}>
      <Card sx={{ maxWidth: 600, width: '100%', p: 3, borderRadius: 4 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Checkout complete
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Your booking is complete. A confirmation email has been sent if your payment was successful.
          </Typography>
          <Button variant="contained" color="primary" onClick={() => navigate('/cart')}>
            Back to cart
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
