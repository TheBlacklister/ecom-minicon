'use client';

import React, { useState } from 'react';
import { Box, Typography, Container, Accordion, AccordionSummary, AccordionDetails, } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function ShippingPage() {
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const faqs = [
    {
      id: 'panel1',
      question: "When will my order be shipped?",
      answer: "All Minicon orders are processed within 2–3 business days. Once ready, your order is shipped immediately."
    },
    {
      id: 'panel2',
      question: "How long does delivery take?",
      answer: "After dispatch, delivery usually takes:\n• 5–7 days for metro cities\n• 7–10 days for non-metro or remote areas\n\nYou'll receive a tracking link once your order is shipped."
    },
    {
      id: 'panel3',
      question: "Do you offer express shipping?",
      answer: "Currently, we offer standard shipping across India to maintain fair pricing. Express shipping options may be added in the future."
    },
    {
      id: 'panel4',
      question: "Is Cash on Delivery (COD) available?",
      answer: "Yes, COD is available in most serviceable pin codes. If COD is not available in your area, you'll be notified at checkout."
    },
    {
      id: 'panel5',
      question: "How can I track my order?",
      answer: "Once your order ships, you'll receive an email or SMS with a tracking link. You can click the link to follow your order in real-time."
    },
    {
      id: 'panel6',
      question: "What should I do if I haven't received my order?",
      answer: "If it's been more than 7 business days since dispatch and your tracking hasn't updated, reach out to us at:\n📧 miniconclothing@gmail.com"
    },
    {
      id: 'panel7',
      question: "Do you ship internationally?",
      answer: "We currently ship only within India. International shipping will be announced soon—stay tuned on our Instagram and website!"
    },
    {
      id: 'panel8',
      question: "What if my package is delayed?",
      answer: "While we aim for timely delivery, occasional delays may occur due to:\n• Weather disruptions\n• Courier issues\n• Festival seasons or strikes\n\nWe'll keep you informed via email/SMS in such cases."
    }
  ];

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        bgcolor: '#ffffff',
        py: { xs: 4, md: 8 }
      }}
    >
      <Container maxWidth="md">
        {/* Header Section */}
        <Box textAlign="center" mb={6}>
         
          
          <Typography 
            variant="h1" 
            sx={{
              fontSize: { xs: '2rem', md: '2.5rem' },
              fontWeight: 700,
              mb: 3,
              color: '#000',
              fontFamily: 'Futura, sans-serif'
            }}
          >
            📦 SHIPPING – FREQUENTLY ASKED QUESTIONS (FAQS)
          </Typography>
          
          <Typography 
            sx={{
              fontSize: { xs: '1rem', md: '1.125rem' },
              lineHeight: 1.8,
              color: '#000',
              fontFamily: 'Futura, sans-serif'
            }}
          >
            Everything you need to know about our shipping process, delivery times, and tracking your orders.
          </Typography>
        </Box>

        {/* FAQ Accordion Section */}
        <Box>
          {faqs.map((item) => (
            <Accordion
              key={item.id}
              expanded={expanded === item.id}
              onChange={handleChange(item.id)}
              sx={{
                mb: 2,
                bgcolor: '#fff',
                border: '1px solid #000',
                borderRadius: '4px !important',
                '&:before': {
                  display: 'none',
                },
                boxShadow: 'none',
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: '#000' }} />}
                sx={{
                  '&.MuiAccordionSummary-root': {
                    minHeight: 64,
                    px: 3,
                  },
                  '& .MuiAccordionSummary-content': {
                    margin: '12px 0',
                  },
                }}
              >
                <Typography 
                  sx={{ 
                    fontWeight: 600, 
                    fontSize: '1.125rem',
                    color: '#000',
                    fontFamily: 'Futura, sans-serif'
                  }}
                >
                  {item.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 3, pb: 3 }}>
                <Typography sx={{ 
                  fontSize: '1rem', 
                  lineHeight: 1.8, 
                  color: '#000', 
                  fontFamily: 'Futura, sans-serif',
                  whiteSpace: 'pre-line'
                }}>
                  {item.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        {/* Contact Section */}
        <Box 
          textAlign="center"
          sx={{ 
            mt: 8,
            p: 4,
            bgcolor: '#f8f8f8',
            borderRadius: 2
          }}
        >
          <Typography 
            variant="h3" 
            sx={{
              fontSize: { xs: '1.5rem', md: '2rem' },
              fontWeight: 700,
              mb: 3,
              color: '#000',
              fontFamily: 'Futura, sans-serif'
            }}
          >
            Still Need Help?
          </Typography>
          
          <Typography 
            sx={{
              fontSize: { xs: '1rem', md: '1.125rem' },
              lineHeight: 1.8,
              mb: 3,
              color: '#000',
              fontFamily: 'Futura, sans-serif'
            }}
          >
            Reach out anytime at:
          </Typography>
          
          <Box 
            sx={{ 
              display: 'inline-block',
              bgcolor: '#000',
              color: 'white',
              px: 4,
              py: 2,
              borderRadius: 1,
              fontWeight: 600,
              fontSize: '1rem',
              fontFamily: 'Futura, sans-serif'
            }}
          >
            📧 miniconclothing@gmail.com
          </Box>
          
          <Typography 
            sx={{
              fontSize: '1rem',
              lineHeight: 1.8,
              color: '#666',
              mt: 2,
              fontFamily: 'Futura, sans-serif'
            }}
          >
            We&apos;ll respond within 24–48 hours.
          </Typography>
        </Box>

        {/* Additional Info */}
        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Typography sx={{ 
            color: '#666', 
            mb: 2,
            fontSize: '1rem',
            fontFamily: 'Futura, sans-serif'
          }}>
            We&apos;re committed to providing you with the best shipping experience possible.
          </Typography>
          <Typography sx={{ 
            color: '#666',
            fontSize: '0.875rem',
            fontFamily: 'Futura, sans-serif'
          }}>
            For the most up-to-date shipping information, please check your order confirmation email.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}