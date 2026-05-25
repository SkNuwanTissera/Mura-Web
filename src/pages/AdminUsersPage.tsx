import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { fetchManagedUsers, fetchProviders, updateUserEnabled, updateUserRole } from '../api';
import { useAuth } from '../hooks/useAuth';
import type { ManagedUser, Provider, UserRole } from '../types';

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);
  const [roleDrafts, setRoleDrafts] = useState<Record<string, UserRole>>({});
  const [providerDrafts, setProviderDrafts] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [nextUsers, nextProviders] = await Promise.all([
        fetchManagedUsers(),
        fetchProviders(),
      ]);
      setUsers(nextUsers);
      setProviders(nextProviders);
      setRoleDrafts(Object.fromEntries(nextUsers.map((user) => [user.id, user.role])));
      setProviderDrafts(Object.fromEntries(
        nextUsers.map((user) => [user.id, user.providerId ?? ''])
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (user: ManagedUser) => {
    const role = roleDrafts[user.id] ?? user.role;
    const providerId = providerDrafts[user.id] || undefined;

    if (role === 'PROVIDER' && !providerId) {
      setError('Select a provider when assigning the provider role.');
      return;
    }

    setSavingUserId(user.id);
    setError('');
    try {
      const updated = await updateUserRole(user.id, role, role === 'PROVIDER' ? providerId : undefined);
      setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user role.');
    } finally {
      setSavingUserId(null);
    }
  };

  const handleToggleEnabled = async (user: ManagedUser, enabled: boolean) => {
    setTogglingUserId(user.id);
    setError('');
    try {
      const updated = await updateUserEnabled(user.id, enabled);
      setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update account status.');
    } finally {
      setTogglingUserId(null);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        User management
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Promote parents to providers or admins, and enable or disable sign-in for any account.
        Self sign-up always creates parent accounts.
      </Typography>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Current role</TableCell>
              <TableCell>New role</TableCell>
              <TableCell>Provider</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7}>Loading users...</TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>No users found.</TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const draftRole = roleDrafts[user.id] ?? user.role;
                const isSelf = currentUser?.id === user.id;
                return (
                  <TableRow
                    key={user.id}
                    sx={{ opacity: user.enabled ? 1 : 0.65 }}
                  >
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={user.enabled}
                            disabled={togglingUserId === user.id || (isSelf && user.enabled)}
                            onChange={(_, checked) => handleToggleEnabled(user, checked)}
                            color="primary"
                          />
                        }
                        label={user.enabled ? 'Enabled' : 'Disabled'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={user.role} />
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" sx={{ minWidth: 140 }} disabled={!user.enabled}>
                        <InputLabel>Role</InputLabel>
                        <Select
                          label="Role"
                          value={draftRole}
                          onChange={(event) =>
                            setRoleDrafts((current) => ({
                              ...current,
                              [user.id]: event.target.value as UserRole,
                            }))
                          }
                        >
                          <MenuItem value="PARENT">Parent</MenuItem>
                          <MenuItem value="PROVIDER">Provider</MenuItem>
                          <MenuItem value="ADMIN">Admin</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      {draftRole === 'PROVIDER' ? (
                        <FormControl size="small" sx={{ minWidth: 180 }} disabled={!user.enabled}>
                          <InputLabel>Provider</InputLabel>
                          <Select
                            label="Provider"
                            value={providerDrafts[user.id] ?? ''}
                            onChange={(event) =>
                              setProviderDrafts((current) => ({
                                ...current,
                                [user.id]: event.target.value,
                              }))
                            }
                          >
                            {providers.map((provider) => (
                              <MenuItem key={provider.id} value={provider.id}>
                                {provider.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        user.providerName || '—'
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="contained"
                        disabled={!user.enabled || savingUserId === user.id}
                        onClick={() => handleSave(user)}
                      >
                        Save role
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
