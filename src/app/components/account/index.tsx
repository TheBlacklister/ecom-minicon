'use client';

import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import ProfileSection from './profile';
import OrdersSection from './orders';
import AddressesSection from './address';
/* -------------------------------------------------------------------------- */
/*                             Mock data types                                */
/* -------------------------------------------------------------------------- */


interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`account‑tab‑panel‑${index}`}
      aria-labelledby={`account‑tab‑${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 1 }}>{children}</Box>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Main page                                    */
/* -------------------------------------------------------------------------- */
export default function AccountPage() {
  const [tab, setTab] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ 
      maxWidth: 1200, 
      mx: 'auto', 
      px: { xs: 1, sm: 2, md: 4 }, 
      py: { xs: 2, sm: 3, md: 4 }, 
      backgroundColor: '#fff', 
      minHeight: '100vh',
      fontFamily: '"Montserrat", sans-serif'
    }}>
      <Typography 
        color='black' 
        variant={isMobile ? "h5" : "h4"} 
        fontWeight={700} 
        mb={3}
        sx={{ fontFamily: '"Montserrat", sans-serif' }}
      >
        My Account
      </Typography>

      {/* ----------------------------- Tabs -------------------------------- */}
      <Tabs
        value={tab}
        onChange={(e, v) => setTab(v)}
        variant={isMobile ? "fullWidth" : "scrollable"}
        scrollButtons="auto"
        aria-label="My account sections"
        sx={{ 
          mb: 3,
          color: 'black',
          '& .MuiTab-root': {
            fontFamily: '"Montserrat", sans-serif',
            fontSize: { xs: '0.875rem', sm: '1rem' },
            minWidth: { xs: 'auto', sm: '120px' },
            padding: { xs: '12px 8px', sm: '12px 16px' }
          }
        }}
      >
        <Tab label="Profile" id="account‑tab‑0" aria-controls="account‑tab‑panel‑0" />
        <Tab label="Orders" id="account‑tab‑1" aria-controls="account‑tab‑panel‑1" />
        <Tab label="Addresses" id="account‑tab‑2" aria-controls="account‑tab‑panel‑2" />
      </Tabs>

      {/* --------------------------- Profile ------------------------------- */}
        <TabPanel value={tab} index={0}>
        <ProfileSection />
      </TabPanel>
      <TabPanel value={tab} index={1}>
        <OrdersSection />
      </TabPanel>
      <TabPanel value={tab} index={2}>
        <AddressesSection />
      </TabPanel>
    </Box>
  );
}
