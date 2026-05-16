import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const linkStyle = ({ isActive }: { isActive: boolean }) => ({
  color: 'inherit',
  textDecoration: 'none',
  fontWeight: isActive ? 700 : 500,
  marginRight: 16
});

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar position="static" color="primary" elevation={2}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" component="div" sx={{ mr: 4 }}>
            Mura Web
          </Typography>
          {user && (
            <>
              <NavLink to="/" style={linkStyle}>
                Home
              </NavLink>
              <NavLink to="/activities" style={linkStyle}>
                Activities
              </NavLink>
              <NavLink to="/children" style={linkStyle}>
                Children
              </NavLink>
            </>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {user ? (
            <>
              <Typography variant="body2">{user.name}</Typography>
              <Button color="inherit" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <Button component={NavLink} to="/login" color="inherit">
              Sign in
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
