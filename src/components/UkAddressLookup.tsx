import { useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { lookupUkAddressesByPostcode, UkAddressOption } from '../utils/ukAddress';

export interface UkAddressValue {
  postcode: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
}

export default function UkAddressLookup({
  value,
  onChange,
}: {
  value: UkAddressValue;
  onChange: (next: UkAddressValue) => void;
}) {
  const [postcodeInput, setPostcodeInput] = useState(value.postcode);
  const [options, setOptions] = useState<UkAddressOption[]>([]);
  const [selected, setSelected] = useState<UkAddressOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addressListOpen, setAddressListOpen] = useState(false);

  const handleSearch = async () => {
    if (!postcodeInput.trim()) {
      setError('Enter a UK postcode.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const results = await lookupUkAddressesByPostcode(postcodeInput);
      setOptions(results);
      setAddressListOpen(results.length > 0);
      if (results.length === 1) {
        applySelection(results[0]);
      } else {
        setSelected(null);
      }
    } catch (err) {
      setOptions([]);
      setSelected(null);
      setError(err instanceof Error ? err.message : 'Address lookup failed.');
    } finally {
      setLoading(false);
    }
  };

  const applySelection = (option: UkAddressOption) => {
    setSelected(option);
    onChange({
      postcode: option.postcode,
      address: option.line1,
      city: option.city,
      latitude: option.latitude,
      longitude: option.longitude,
    });
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        UK address
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="Postcode"
          placeholder="e.g. SW1A 1AA"
          value={postcodeInput}
          onChange={(e) => setPostcodeInput(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearch();
            }
          }}
        />
        <Button
          variant="outlined"
          onClick={handleSearch}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={18} /> : <SearchIcon />}
          sx={{ minWidth: { sm: 140 }, flexShrink: 0 }}
        >
          Find address
        </Button>
      </Stack>

      {error && (
        <Typography variant="body2" color="error" sx={{ mb: 1 }}>
          {error}
        </Typography>
      )}

      {options.length > 0 && !error && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {options.length} address{options.length === 1 ? '' : 'es'} found — select one below
        </Typography>
      )}

      <Autocomplete
        open={addressListOpen}
        onOpen={() => setAddressListOpen(true)}
        onClose={() => setAddressListOpen(false)}
        options={options}
        value={selected}
        onChange={(_event, option) => {
          if (option) applySelection(option);
          setAddressListOpen(false);
        }}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        noOptionsText={options.length === 0 ? 'Search by postcode to see addresses' : 'No matching addresses'}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Select address"
            placeholder="Choose from postcode results"
          />
        )}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        label="Address line"
        value={value.address}
        onChange={(e) => onChange({ ...value, address: e.target.value })}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        label="City / town"
        value={value.city}
        onChange={(e) => onChange({ ...value, city: e.target.value })}
      />
    </Box>
  );
}
