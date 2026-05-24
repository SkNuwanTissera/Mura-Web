import {
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import { Provider } from '../types';
import { ActivityFormState } from '../utils/activityForm';
import UkAddressLookup from './UkAddressLookup';
import AvailabilitySlotEditor from './AvailabilitySlotEditor';
import PhoneField from './PhoneField';

export default function ActivityFormFields({
  form,
  onChange,
  categories,
  cities,
  providers,
  showProviderSelect = true,
}: {
  form: ActivityFormState;
  onChange: (next: ActivityFormState) => void;
  categories: string[];
  cities: string[];
  providers: Provider[];
  showProviderSelect?: boolean;
}) {
  const patch = (partial: Partial<ActivityFormState>) => onChange({ ...form, ...partial });

  return (
    <Stack spacing={2} sx={{ pt: 1 }}>
      <TextField
        fullWidth
        required
        label="Activity name"
        value={form.name}
        onChange={(e) => patch({ name: e.target.value })}
      />

      <Grid container spacing={2}>
        <Grid item xs={12} sm={showProviderSelect ? 6 : 12}>
          <TextField
            fullWidth
            required
            label="Category"
            value={form.category}
            onChange={(e) => patch({ category: e.target.value })}
            helperText={categories.length ? `e.g. ${categories.slice(0, 3).join(', ')}` : undefined}
          />
        </Grid>
        {showProviderSelect && (
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Provider</InputLabel>
              <Select
                value={form.providerId}
                label="Provider"
                onChange={(e) => patch({ providerId: e.target.value })}
              >
                {providers.map((provider) => (
                  <MenuItem key={provider.id} value={provider.id}>
                    {provider.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}
      </Grid>

      <TextField
        fullWidth
        required
        label="Location / venue name"
        value={form.locationName}
        onChange={(e) => patch({ locationName: e.target.value })}
      />

      <UkAddressLookup
        value={{
          postcode: form.postcode,
          address: form.address,
          city: form.city,
          latitude: form.latitude,
          longitude: form.longitude,
        }}
        onChange={(addressValue) =>
          patch({
            postcode: addressValue.postcode,
            address: addressValue.address,
            city: addressValue.city,
            latitude: addressValue.latitude,
            longitude: addressValue.longitude,
          })
        }
      />

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required
            type="number"
            label="Min age"
            value={form.minAge}
            onChange={(e) => patch({ minAge: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required
            type="number"
            label="Max age"
            value={form.maxAge}
            onChange={(e) => patch({ maxAge: e.target.value })}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            type="number"
            label="Price (£)"
            value={form.priceGbp}
            onChange={(e) => patch({ priceGbp: e.target.value })}
          />
        </Grid>
        <Grid item xs={6} sm={4}>
          <TextField
            fullWidth
            type="time"
            label="Start time"
            value={form.startTime}
            onChange={(e) => patch({ startTime: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={6} sm={4}>
          <TextField
            fullWidth
            type="time"
            label="End time"
            value={form.endTime}
            onChange={(e) => patch({ endTime: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
      </Grid>

      <AvailabilitySlotEditor slots={form.slots} onChange={(slots) => patch({ slots })} />

      <PhoneField value={form.contactPhone} onChange={(contactPhone) => patch({ contactPhone })} />

      {cities.length > 0 && form.city && !cities.includes(form.city) && (
        <TextField
          fullWidth
          label="City (from address)"
          value={form.city}
          onChange={(e) => patch({ city: e.target.value })}
          helperText="City was set from your address selection"
        />
      )}
    </Stack>
  );
}
