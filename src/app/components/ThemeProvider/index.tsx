'use client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ReactNode } from 'react';

const theme = createTheme({
  typography: {
    fontFamily: 'Futura, sans-serif',
  },
  palette: {
    text: {
      primary: '#000',
    },
    background: {
      default: '#fff',
      paper: '#fff',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontFamily: 'Futura, sans-serif',
        },
      },
    },
  },
});

export default function MuiTheme({ children }: { children: ReactNode }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}