import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { CssBaseline, Container, Box } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import ActivitiesPage from './pages/ActivitiesPage';
import CartPage from './pages/CartPage';
import ChildrenPage from './pages/ChildrenPage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import CheckoutCancelPage from './pages/CheckoutCancelPage';
import ProfilePage from './pages/ProfilePage';
import ProvidersPage from './pages/ProvidersPage';
import ProviderPage from './pages/ProviderPage';
import AdminUsersPage from './pages/AdminUsersPage';
import NavBar from './components/NavBar';
import ChatWidget from './components/ChatWidget';
import type { UserRole } from './types';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function RoleRoute({ roles, children }: { roles: UserRole[]; children: JSX.Element }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function AppContent() {
  const { user } = useAuth();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <NavBar />
        <Container maxWidth="lg">
          <Box sx={{ pt: 4, pb: 6 }}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/activities" element={<ActivitiesPage />} />
              <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/cart" element={<RoleRoute roles={['PARENT']}><CartPage /></RoleRoute>} />
              <Route path="/checkout/success" element={<RoleRoute roles={['PARENT']}><CheckoutSuccessPage /></RoleRoute>} />
              <Route path="/checkout/cancel" element={<RoleRoute roles={['PARENT']}><CheckoutCancelPage /></RoleRoute>} />
              <Route path="/children" element={<RoleRoute roles={['PARENT']}><ChildrenPage /></RoleRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/providers" element={<ProtectedRoute><ProvidersPage /></ProtectedRoute>} />
              <Route path="/providers/:id" element={<ProtectedRoute><ProviderPage /></ProtectedRoute>} />
              <Route path="/admin/users" element={<RoleRoute roles={['ADMIN']}><AdminUsersPage /></RoleRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Box>
        </Container>
        {user?.role === 'PARENT' ? <ChatWidget /> : null}
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
