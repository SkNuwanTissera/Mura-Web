import { Box, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import { COUNTRY_DIAL_CODES, combinePhone, splitPhone } from '../utils/phone';

export default function PhoneField({
  value,
  onChange,
  label = 'Contact phone',
}: {
  value: string;
  onChange: (fullPhone: string) => void;
  label?: string;
}) {
  const { countryCode, number } = splitPhone(value);

  const update = (code: string, num: string) => {
    onChange(combinePhone(code, num));
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        {label}
      </Typography>
      <Stack direction="row" spacing={1}>
        <FormControl sx={{ minWidth: 130 }} size="small">
          <InputLabel id="phone-country-label">Code</InputLabel>
          <Select
            labelId="phone-country-label"
            value={countryCode}
            label="Code"
            onChange={(e) => update(e.target.value, number)}
          >
            {COUNTRY_DIAL_CODES.map((entry) => (
              <MenuItem key={entry.code} value={entry.code}>
                {entry.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          fullWidth
          size="small"
          label="Phone number"
          placeholder="7700 900123"
          value={number}
          onChange={(e) => update(countryCode, e.target.value)}
          inputProps={{ inputMode: 'tel' }}
        />
      </Stack>
    </Box>
  );
}
