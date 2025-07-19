'use client';

import { Box, Typography, Container, Paper, Stack, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BusinessIcon from '@mui/icons-material/Business';

export default function ContactPage() {
  return (
    <Container maxWidth="md" sx={{ py: 6, fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif ', color: 'black' }}>
      <Typography variant="h4" component="h1" sx={{ textAlign: 'center', fontWeight: 'bold', mb: 4, fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif ' }}>
        Contact Us
      </Typography>

      <Paper elevation={2} sx={{ p: 4, borderRadius: 2, bgcolor: 'white', border: '1px solid black', fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif ' }}>
        <Stack spacing={2}>
          <Accordion sx={{ fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif ' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'black' }} />}>
              <Typography sx={{ fontWeight: 'bold', color: 'black', fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif ' }}>
                <BusinessIcon sx={{ verticalAlign: 'middle', mr: 1, color: 'black' }} /> Business Name
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography sx={{ color: 'black', fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif ' }}>
                MINICON & TRX TRENDS
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif ' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'black' }} />}>
              <Typography sx={{ fontWeight: 'bold', color: 'black', fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif ' }}>
                <LocationOnIcon sx={{ verticalAlign: 'middle', mr: 1, color: 'black' }} /> Address
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography sx={{ color: 'black', fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif ' }}>
                1/H/9 Rashmoni Bazar Road,<br />
                Kolkata – 700010, West Bengal, India
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif ' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'black' }} />}>
              <Typography sx={{ fontWeight: 'bold', color: 'black', fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif ' }}>
                <EmailIcon sx={{ verticalAlign: 'middle', mr: 1, color: 'black' }} /> Email
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography sx={{ fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif ' }}>
                <a href="mailto:miniconclothing@gmail.com" style={{ color: 'black', textDecoration: 'none', fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif ' }}>
                  miniconclothing@gmail.com
                </a>
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif ' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'black' }} />}>
              <Typography sx={{ fontWeight: 'bold', color: 'black', fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif ' }}>
                <WhatsAppIcon sx={{ verticalAlign: 'middle', mr: 1, color: 'black' }} /> WhatsApp Support
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography sx={{ fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif ' }}>
                <a href="https://wa.me/918777073645" target="_blank" rel="noopener noreferrer" style={{ color: 'black', textDecoration: 'none', fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif ' }}>
                  +91 87770 73645
                </a>
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif ' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'black' }} />}>
              <Typography sx={{ fontWeight: 'bold', color: 'black', fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif ' }}>
                <AccessTimeIcon sx={{ verticalAlign: 'middle', mr: 1, color: 'black' }} /> Business Hours
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography sx={{ color: 'black', fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif ' }}>
                Monday to Saturday – 11 AM to 6 PM IST
              </Typography>
            </AccordionDetails>
          </Accordion>
        </Stack>
      </Paper>

      <Box sx={{ mt: 4, textAlign: 'center', fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif ' }}>
        <Typography variant="body2" sx={{ color: 'black', fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif ' }}>
          Need immediate assistance? Reach out to us through any of the methods above. We respond within 24 hours during business days.
        </Typography>
      </Box>
    </Container>
  );
}