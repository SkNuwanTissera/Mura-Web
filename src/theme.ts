import { createTheme } from '@mui/material/styles';
import type { PaletteMode } from '@mui/material';

/** Core Mura palette: black, white, pastel pink */
export const muraPalette = {
  black: '#1a1a1a',
  white: '#ffffff',
  pink: '#f5c6d6',
  pinkLight: '#fce8ef',
  pinkMuted: '#e8b4bc',
  backgroundLight: '#fffafb',
  backgroundDark: '#1a1a1a',
  paperDark: '#262626',
} as const;

const sharedTypography = {
  fontFamily: ['Inter', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'].join(','),
};

const sharedShape = {
  borderRadius: 18,
};

export function createAppTheme(mode: PaletteMode) {
  const isDark = mode === 'dark';
  const { black, white, pink, pinkLight, pinkMuted, backgroundLight, backgroundDark, paperDark } = muraPalette;

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? pink : black,
        light: isDark ? pinkLight : '#333333',
        dark: isDark ? pinkMuted : '#000000',
        contrastText: isDark ? black : white,
      },
      secondary: {
        main: pink,
        light: pinkLight,
        dark: pinkMuted,
        contrastText: black,
      },
      background: {
        default: isDark ? backgroundDark : backgroundLight,
        paper: isDark ? paperDark : white,
      },
      text: {
        primary: isDark ? white : black,
        secondary: isDark ? pinkLight : '#4a4a4a',
      },
      divider: isDark ? '#3d3d3d' : pinkLight,
    },
    typography: sharedTypography,
    shape: sharedShape,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: isDark ? backgroundDark : backgroundLight,
            color: isDark ? white : black,
          },
          '#root': {
            backgroundColor: isDark ? backgroundDark : backgroundLight,
            minHeight: '100%',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? paperDark : pink,
            color: black,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
          },
          containedPrimary: isDark
            ? undefined
            : {
                '&:hover': {
                  backgroundColor: '#333333',
                },
              },
        },
      },
      MuiChip: {
        styleOverrides: {
          colorPrimary: {
            backgroundColor: pinkLight,
            color: black,
          },
        },
      },
    },
  });
}

export const lightTheme = createAppTheme('light');
export default lightTheme;
