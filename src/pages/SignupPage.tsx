import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Button,
  TextField,
  Typography,
  Paper,
  Box,
  Container,
  Alert,
  Link,
  Divider
} from '@mui/material';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import GoogleIcon from '@mui/icons-material/Google';
import { useAuth } from '../hooks/useAuth';

export default function SignupPage() {
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    const result = await googleLogin();
    setGoogleLoading(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    navigate('/');
  };

  const validatePassword = (value: string) => {
    if (value.length < 8) {
      return 'Password must be at least 8 characters long.';
    }
    return '';
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please complete all fields.');
      return;
    }

    const passwordValidation = validatePassword(password.trim());
    if (passwordValidation) {
      setError(passwordValidation);
      return;
    }

    setLoading(true);
    const result = await register({
      name: name.trim(),
      email: email.trim(),
      password: password.trim()
    });
    setLoading(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    navigate('/login');
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={8} sx={{ mt: 10, p: 4, borderRadius: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <HowToRegIcon />
          </Avatar>
          <Typography component="h1" variant="h5" gutterBottom>
            Create account
          </Typography>
        </Box>

        {error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Your Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Email address"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={loading}>
            {loading ? 'Creating account...' : 'Sign up'}
          </Button>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<GoogleIcon />}
            sx={{ mb: 2 }}
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
          >
            {googleLoading ? 'Continuing with Google...' : 'Continue with Google'}
          </Button>
          <Typography variant="body2" color="text.secondary" align="center">
            Already have an account?{' '}
            <Link component={RouterLink} to="/login">
              Log in
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
