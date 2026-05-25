import { AppBar, Toolbar, Typography, Button, Box, IconButton, Badge } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ThemeToggle from './ThemeToggle';

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
    <AppBar position="static" color="secondary" elevation={1}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ mr: 4 }}>
            Mura Web
          </Typography>
          <NavLink to="/activities" style={linkStyle}>
            Activities
          </NavLink>
          {user ? (
            <>
              <NavLink to="/" style={linkStyle}>
                Home
              </NavLink>
              {user.role === 'PARENT' ? (
                <>
                  <NavLink to="/children" style={linkStyle}>
                    Children
                  </NavLink>
                </>
              ) : null}
              {user.role === 'ADMIN' ? (
                <NavLink to="/providers" style={linkStyle}>
                  Providers
                </NavLink>
              ) : null}
              {user.role === 'ADMIN' ? (
                <NavLink to="/admin/users" style={linkStyle}>
                  Users
                </NavLink>
              ) : null}
              <NavLink to="/profile" style={linkStyle}>
                Profile
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/login" style={linkStyle}>
                Sign in
              </NavLink>
              <NavLink to="/signup" style={linkStyle}>
                Sign up
              </NavLink>
            </>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ThemeToggle />
          {user ? (
            <>
              {user.role === 'PARENT' ? (
                <IconButton
                  color="inherit"
                  component={NavLink}
                  to="/cart"
                  aria-label="Cart"
                  sx={{ mr: 1 }}
                >
                  <Badge badgeContent={0} color="error">
                    <ShoppingCartIcon />
                  </Badge>
                </IconButton>
              ) : null}
              <Button color="inherit" onClick={() => navigate('/profile')}>
                {user.name}
              </Button>
              <Button color="inherit" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : null}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
