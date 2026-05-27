import { Box, Chip, Stack, Tooltip, Typography } from '@mui/material';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import { muraPalette } from '../theme';
import {
  buildAvailabilityGrid,
  parseChildAvailability,
  TIME_PERIOD_LABELS,
  WEEKDAY_LABELS,
} from '../utils/childAvailability';

const LABEL_COLUMN_WIDTH = 72;
const DAY_COLUMN_WIDTH = 34;
const ROW_HEIGHT = 32;

function AvailabilityBubble({
  active,
  bookingCount,
  label,
}: {
  active: boolean;
  bookingCount: number;
  label: string;
}) {
  const showBubble = active || bookingCount > 0;
  const tooltip =
    bookingCount > 0
      ? `${label.replace(/: (free|not available)$/, '')}: ${bookingCount} booking${bookingCount === 1 ? '' : 's'}`
      : label;

  return (
    <Tooltip title={tooltip} arrow>
      <Box
        sx={{
          width: DAY_COLUMN_WIDTH,
          height: ROW_HEIGHT,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {showBubble ? (
          <Box
            sx={{
              minWidth: bookingCount > 0 ? 18 : 14,
              height: bookingCount > 0 ? 18 : 14,
              px: bookingCount > 0 ? 0.25 : 0,
              borderRadius: '50%',
              bgcolor: muraPalette.pink,
              opacity: bookingCount > 0 ? 0.85 : 0.45,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {bookingCount > 0 ? (
              <Typography
                component="span"
                sx={{
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  lineHeight: 1,
                  color: 'common.black',
                }}
              >
                {bookingCount}
              </Typography>
            ) : null}
          </Box>
        ) : null}
      </Box>
    </Tooltip>
  );
}

function AvailabilityGridTable({
  grid,
  bookingCounts,
}: {
  grid: boolean[][];
  bookingCounts: number[][];
}) {
  return (
    <Box
      sx={{
        display: 'inline-block',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
        <Box sx={{ width: LABEL_COLUMN_WIDTH, flexShrink: 0 }} />
        {WEEKDAY_LABELS.map((day) => (
          <Box
            key={day}
            sx={{
              width: DAY_COLUMN_WIDTH,
              flexShrink: 0,
              textAlign: 'center',
              py: 0.75,
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.65rem' }}>
              {day}
            </Typography>
          </Box>
        ))}
      </Box>

      {TIME_PERIOD_LABELS.map((period, periodIndex) => (
        <Box
          key={period}
          sx={{
            display: 'flex',
            borderBottom: periodIndex < TIME_PERIOD_LABELS.length - 1 ? '1px solid' : 'none',
            borderColor: 'divider',
          }}
        >
          <Box
            sx={{
              width: LABEL_COLUMN_WIDTH,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              px: 1,
              bgcolor: 'action.hover',
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
              {period}
            </Typography>
          </Box>
          {WEEKDAY_LABELS.map((day, dayIndex) => (
            <AvailabilityBubble
              key={`${period}-${day}`}
              active={grid[periodIndex][dayIndex]}
              bookingCount={bookingCounts[periodIndex]?.[dayIndex] ?? 0}
              label={
                grid[periodIndex][dayIndex]
                  ? `${day} ${period.toLowerCase()}: free`
                  : `${day} ${period.toLowerCase()}: not available`
              }
            />
          ))}
        </Box>
      ))}
    </Box>
  );
}

export default function ChildAvailabilityVisual({
  availableTimes,
  bookingCounts,
}: {
  availableTimes?: string;
  bookingCounts?: number[][];
}) {
  const parsed = parseChildAvailability(availableTimes);
  const grid = buildAvailabilityGrid(parsed);
  const counts =
    bookingCounts ??
    TIME_PERIOD_LABELS.map(() => WEEKDAY_LABELS.map(() => 0));
  const hasGridSlots = grid.some((row) => row.some(Boolean));

  if (!availableTimes?.trim()) {
    return (
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Availability
        </Typography>
        <Chip
          size="small"
          variant="outlined"
          icon={<EventAvailableOutlinedIcon />}
          label="Not specified"
          sx={{ opacity: 0.7 }}
        />
      </Box>
    );
  }

  if (hasGridSlots) {
    return (
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Availability
        </Typography>
        <AvailabilityGridTable grid={grid} bookingCounts={counts} />
      </Box>
    );
  }

  const fallbackLabels =
    parsed.labels.length > 0 ? parsed.labels : [availableTimes];

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        Availability
      </Typography>
      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
        {fallbackLabels.map((label) => (
          <Chip
            key={label}
            size="small"
            color="secondary"
            variant="outlined"
            icon={<EventAvailableOutlinedIcon />}
            label={label}
          />
        ))}
      </Stack>
    </Box>
  );
}
