'use client';
import { Card, CardContent, Typography, Button, Stack, useTheme, useMediaQuery, Box } from '@mui/material';

const MOCK_ORDERS = [
  {
    id: 'ORD‑230519‑A7F2',
    date: '19 May 2025',
    items: 3,
    total: 2799,
    status: 'Shipped',
  },
  {
    id: 'ORD‑230428‑X3J9',
    date: '28 Apr 2025',
    items: 1,
    total: 1199,
    status: 'Delivered',
  },
];

export default function OrdersSection() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <>
      {MOCK_ORDERS.length === 0 ? (
        <Typography sx={{ fontFamily: 'Futura, sans-serif' }}>No past orders.</Typography>
      ) : (
        <Stack spacing={2}>
          {MOCK_ORDERS.map((o) => (
            <Card key={o.id} variant="outlined" sx={{ 
              backgroundColor: '#fff',
              fontFamily: 'Futura, sans-serif',
              width: '100%'
            }}>
              <CardContent>
                <Box sx={{ 
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(4, 1fr)',
                    md: 'repeat(5, 1fr)'
                  },
                  gap: 2,
                  alignItems: 'center'
                }}>
                  <Box>
                    <Typography 
                      fontWeight={600} 
                      color="black"
                      variant={isMobile ? "subtitle1" : "h6"}
                      sx={{ fontFamily: 'Futura, sans-serif' }}
                    >
                      {o.id}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="black"
                      sx={{ fontFamily: 'Futura, sans-serif' }}
                    >
                      {o.date}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography 
                      color="black"
                      sx={{ fontFamily: 'Futura, sans-serif' }}
                    >
                      {o.items} item{o.items > 1 ? 's' : ''}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography 
                      fontWeight={700} 
                      color="black"
                      sx={{ fontFamily: 'Futura, sans-serif' }}
                    >
                      ₹ {o.total}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography 
                      color="black"
                      sx={{ fontFamily: 'Futura, sans-serif' }}
                    >
                      {o.status}
                    </Typography>
                  </Box>
                  <Box>
                    <Button 
                      fullWidth 
                      size="small" 
                      variant="outlined"
                      sx={{ 
                        fontFamily: 'Futura, sans-serif',
                        mt: { xs: 1, sm: 0 }
                      }}
                    >
                      View Details
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </>
  );
}
