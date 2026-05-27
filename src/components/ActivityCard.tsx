import type { MouseEvent } from 'react';
import { Card, CardContent, CardActions, Button, Typography, Chip, Stack, Box, Link } from '@mui/material';

import EditIcon from '@mui/icons-material/Edit';

import DeleteIcon from '@mui/icons-material/Delete';

import { Link as RouterLink } from 'react-router-dom';

import { Activity } from '../types';

import { formatAvailabilitySlotLabel } from '../utils/availabilitySlots';



export default function ActivityCard({

  activity,

  loading,

  selected,

  compact,

  onSelect,

  onAddToCart,

  onEdit,

  onDelete,

}: {

  activity: Activity;

  loading: boolean;

  selected?: boolean;

  compact?: boolean;

  onSelect?: () => void;

  onAddToCart?: () => void;

  onEdit?: () => void;

  onDelete?: () => void;

}) {

  const provider = activity.providerName || 'Unknown provider';

  const location = activity.locationName || activity.address || 'Unknown location';

  const ageLabel = activity.minAge != null && activity.maxAge != null

    ? `${activity.minAge} - ${activity.maxAge}`

    : 'Any age';

  const priceLabel = activity.priceGbp != null ? `£${activity.priceGbp.toFixed(2)}` : 'Free / not set';



  const stopPropagation = (event: MouseEvent) => {

    event.stopPropagation();

  };



  return (

    <Card

      onClick={onSelect}

      sx={{

        minHeight: compact ? 0 : 220,

        borderRadius: 3,

        opacity: loading ? 0.9 : 1,

        boxShadow: selected ? 3 : 1,

        display: 'flex',

        flexDirection: 'column',

        overflow: 'visible',

        cursor: onSelect ? 'pointer' : 'default',

        border: '2px solid',

        borderColor: selected ? 'primary.main' : 'transparent',

        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',

        '&:hover': onSelect

          ? { borderColor: selected ? 'primary.main' : 'divider', boxShadow: 2 }

          : undefined,

      }}

    >

      <CardContent sx={{ flexGrow: 1, p: compact ? 2 : 3 }}>

        <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>

          <Chip label={activity.category || 'General'} color="secondary" size="small" />

          {!compact ? <Chip label={activity.city || 'Any city'} size="small" /> : null}

        </Stack>



        <Typography variant={compact ? 'subtitle1' : 'h6'} gutterBottom>

          {activity.name || 'Untitled activity'}

        </Typography>



        {!compact ? (

          <>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>

              Provider:{' '}

              {activity.providerId ? (

                <Link

                  component={RouterLink}

                  to={`/providers/${activity.providerId}`}

                  underline="hover"

                  color="primary"

                  onClick={stopPropagation}

                >

                  {provider}

                </Link>

              ) : (

                provider

              )}

            </Typography>

            <Typography variant="body2" sx={{ mb: 1 }}>

              Location: {location}

            </Typography>



            <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', mb: 1 }}>

              <Typography variant="body2" color="text.secondary">

                Age: {ageLabel}

              </Typography>

              <Typography variant="body2" color="text.secondary">

                Price: {priceLabel}

              </Typography>

            </Box>



            {activity.availabilitySlots?.length > 0 && (

              <Box component="div" sx={{ color: 'text.secondary' }}>

                {activity.availabilitySlots.map((slot) => (

                  <Typography key={slot} variant="body2" color="text.secondary">

                    {formatAvailabilitySlotLabel(slot)}

                  </Typography>

                ))}

              </Box>

            )}

          </>

        ) : (

          <>

            <Typography variant="body2" color="text.secondary">

              {priceLabel} · Ages {ageLabel}

            </Typography>

            {activity.availabilitySlots?.length > 0 ? (

              <Box sx={{ mt: 1 }}>

                {activity.availabilitySlots.map((slot) => (

                  <Typography key={slot} variant="caption" color="text.secondary" display="block">

                    {formatAvailabilitySlotLabel(slot)}

                  </Typography>

                ))}

              </Box>

            ) : null}

          </>

        )}

      </CardContent>



      {(onEdit || onDelete || onAddToCart) ? (

        <CardActions sx={{ justifyContent: 'flex-end', p: compact ? 1.5 : 2, pt: compact ? 0 : 1, gap: 1, flexWrap: 'wrap' }}>

          {onEdit ? (

            <Button

              size="small"

              variant="outlined"

              startIcon={<EditIcon />}

              onClick={(e) => {

                stopPropagation(e);

                onEdit();

              }}

              disabled={loading}

            >

              Edit

            </Button>

          ) : null}

          {onDelete ? (

            <Button

              size="small"

              variant="outlined"

              color="error"

              startIcon={<DeleteIcon />}

              onClick={(e) => {

                stopPropagation(e);

                onDelete();

              }}

              disabled={loading}

            >

              Delete

            </Button>

          ) : null}

          {onAddToCart ? (

            <Button

              size="small"

              variant="contained"

              color="primary"

              onClick={(e) => {

                stopPropagation(e);

                onAddToCart();

              }}

              disabled={loading}

            >

              Add to cart

            </Button>

          ) : null}

        </CardActions>

      ) : null}

    </Card>

  );

}

