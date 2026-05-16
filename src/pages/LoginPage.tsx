import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Button,
  TextField,
  Typography,
  Paper,
  Box,
  Container,
  Alert
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [parentId, setParentId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !parentId.trim()) {
      setError('Please complete all fields, including your Parent ID.');
      return;
    }
    login({ name: name.trim(), email: email.trim(), parentId: parentId.trim() });
    navigate('/');
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={8} sx={{ mt: 10, p: 4, borderRadius: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5" gutterBottom>
            Family Login
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
            label="Parent ID"
            value={parentId}
            helperText="Use the backend parent UUID to load saved children and activities."
            onChange={(event) => setParentId(event.target.value)}
          />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
            Continue
          </Button>
          <Typography variant="body2" color="text.secondary" align="center">
            If you do not know your Parent ID, you can use a test value from your backend seed data.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
