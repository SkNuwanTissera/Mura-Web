import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Paper,
  Tooltip,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Link as RouterLink } from 'react-router-dom';
import { Provider } from '../types';
import { fetchProviders, createProvider, updateProvider, deleteProvider } from '../api';
import { useAuth } from '../hooks/useAuth';

const emptyForm = {
  name: '',
  description: '',
  email: '',
  phone: '',
  website: '',
  city: '',
  address: '',
};

type ProviderForm = typeof emptyForm;

export default function ProvidersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [form, setForm] = useState<ProviderForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Provider | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchProviders();
      setProviders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load providers.');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingProvider(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (provider: Provider) => {
    setEditingProvider(provider);
    setForm({
      name: provider.name ?? '',
      description: provider.description ?? '',
      email: provider.email ?? '',
      phone: provider.phone ?? '',
      website: provider.website ?? '',
      city: provider.city ?? '',
      address: provider.address ?? '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editingProvider) {
        const updated = await updateProvider(editingProvider.id, form);
        setProviders((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      } else {
        const created = await createProvider(form);
        setProviders((prev) => [...prev, created]);
      }
      setDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save provider.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteProvider(deleteConfirm.id);
      setProviders((prev) => prev.filter((p) => p.id !== deleteConfirm.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete provider.');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const field = (key: keyof ProviderForm, label: string, multiline = false) => (
    <TextField
      key={key}
      fullWidth
      label={label}
      value={form[key]}
      onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
      multiline={multiline}
      rows={multiline ? 3 : 1}
      required={key === 'name'}
    />
  );

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Providers
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage activity providers. Click a provider name to view their profile and activities.
          </Typography>
        </Box>
        {isAdmin ? (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Add provider
          </Button>
        ) : null}
      </Stack>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {loading ? (
        <Typography color="text.secondary">Loading providers...</Typography>
      ) : providers.length === 0 ? (
        <Typography color="text.secondary">
          No providers yet.{isAdmin ? ' Click "Add provider" to create your first one.' : ''}
        </Typography>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>City</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Phone</strong></TableCell>
                <TableCell><strong>Website</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {providers.map((provider) => (
                <TableRow key={provider.id} hover>
                  <TableCell>
                    <RouterLink
                      to={`/providers/${provider.id}`}
                      style={{ textDecoration: 'none', fontWeight: 600, color: 'inherit' }}
                    >
                      {provider.name}
                    </RouterLink>
                  </TableCell>
                  <TableCell>
                    {provider.city ? <Chip label={provider.city} size="small" /> : '—'}
                  </TableCell>
                  <TableCell>{provider.email || '—'}</TableCell>
                  <TableCell>{provider.phone || '—'}</TableCell>
                  <TableCell>
                    {provider.website ? (
                      <a href={provider.website} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        Visit <OpenInNewIcon sx={{ fontSize: 14 }} />
                      </a>
                    ) : '—'}
                  </TableCell>
                  <TableCell align="right">
                    {isAdmin ? (
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(provider)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => setDeleteConfirm(provider)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    ) : (
                      <RouterLink to={`/providers/${provider.id}`}>View</RouterLink>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingProvider ? 'Edit provider' : 'Add provider'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {field('name', 'Provider name')}
            {field('description', 'Description', true)}
            {field('email', 'Email')}
            {field('phone', 'Phone')}
            {field('website', 'Website URL')}
            {field('city', 'City')}
            {field('address', 'Address')}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
          >
            {saving ? 'Saving...' : editingProvider ? 'Save changes' : 'Create provider'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete provider</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? Activities linked to this provider will have their provider reference cleared.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
