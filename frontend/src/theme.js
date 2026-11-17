import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: { main: '#2563EB' },
    success: { main: '#16A34A' },
    warning: { main: '#D97706' },
    error: { main: '#DC2626' },
    info: { main: '#2563EB' },
    background: { default: '#F8FAFC', paper: '#FFFFFF' },
    text: { primary: '#18181B', secondary: '#71717A' },
    divider: '#E4E4E7',
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiCard: { defaultProps: { variant: 'outlined' } },
    MuiTextField: { defaultProps: { size: 'small' } },
  },
});
