import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2e7d32'
    },
    secondary: {
      main: '#f9a825'
    },
    background: {
      default: '#f4f7f5',
      paper: '#ffffff'
    }
  },
  typography: {
    fontFamily: ['Inter', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'].join(',')
  },
  shape: {
    borderRadius: 18
  }
});

export default theme;
