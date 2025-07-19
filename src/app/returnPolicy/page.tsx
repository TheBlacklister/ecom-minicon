"use client"
import React, { useState } from 'react';
import { Box, Typography, Container, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const ReturnPolicy = () => {
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const faqItems = [
    {
      id: 'panel1',
      question: 'Can I return or exchange my product?',
      content: (
        <>
          <Typography sx={{ fontSize: '1rem', lineHeight: 1.8, mb: 3, color: '#000', fontFamily: 'Futura, sans-serif' }}>
            You can request a return or exchange only if the item is:
          </Typography>
          
          <Box component="ul" sx={{ pl: 4, mb: 3 }}>
            {[
              'Misprinted',
              'Damaged during shipping',
              'Defective (manufacturing fault)',
              'Wrong product delivered'
            ].map((item, index) => (
              <Typography 
                key={index}
                component="li" 
                sx={{ fontSize: '1rem', lineHeight: 1.8, color: '#000', mb: 1, fontFamily: 'Futura, sans-serif' }}
              >
                {item}
              </Typography>
            ))}
          </Box>
          
          <Box sx={{ bgcolor: '#f5f5f5', p: 3, borderRadius: 1 }}>
            <Typography sx={{ fontSize: '0.95rem', lineHeight: 1.7, mb: 2, color: '#000', fontFamily: 'Futura, sans-serif' }}>
              • All returned items must be new, unused, and in their original condition.
            </Typography>
            <Typography sx={{ fontSize: '0.95rem', lineHeight: 1.7, mb: 2, color: '#000', fontFamily: 'Futura, sans-serif' }}>
              • Returns will not be accepted if the brand tag or labels is removed from the product.
            </Typography>
            <Typography sx={{ fontSize: '0.95rem', lineHeight: 1.7, color: '#000', fontWeight: 600, fontFamily: 'Futura, sans-serif' }}>
              📌 Change of mind or wrong size orders are not eligible for free return/exchange. You&apos;ll need to place a new order at your cost.
            </Typography>
          </Box>
        </>
      )
    },
    {
      id: 'panel2',
      question: 'What is the time frame to raise a return request?',
      content: (
        <Box sx={{ bgcolor: '#f5f5f5', p: 3, borderRadius: 1 }}>
          <Typography sx={{ fontSize: '1rem', lineHeight: 1.8, mb: 2, color: '#000', fontFamily: 'Futura, sans-serif' }}>
            All return/exchange claims must be made within <strong>5 days</strong> of product delivery.
          </Typography>
          <Typography sx={{ fontSize: '1rem', lineHeight: 1.8, color: '#000', fontWeight: 600, fontFamily: 'Futura, sans-serif' }}>
            After this period, the return request will be declined.
          </Typography>
        </Box>
      )
    },
    {
      id: 'panel3',
      question: 'What evidence is required to submit a return request?',
      content: (
        <>
          <Typography sx={{ fontSize: '1rem', lineHeight: 1.8, mb: 3, color: '#000', fontFamily: 'Futura, sans-serif' }}>
            To submit a valid claim, you must provide:
          </Typography>
          
          <Box component="ul" sx={{ pl: 4, mb: 3 }}>
            {[
              'A proper unboxing video (from sealed package to full opening – no cuts or edits)',
              'Photos clearly showing the defect or damage',
              'Images of the original packaging'
            ].map((item, index) => (
              <Typography 
                key={index}
                component="li" 
                sx={{ fontSize: '1rem', lineHeight: 1.8, color: '#000', mb: 1, fontFamily: 'Futura, sans-serif' }}
              >
                {item}
              </Typography>
            ))}
          </Box>
          
          <Box sx={{ bgcolor: '#f5f5f5', p: 3, borderRadius: 1 }}>
            <Typography sx={{ fontSize: '1rem', lineHeight: 1.8, color: '#000', fontWeight: 600, fontFamily: 'Futura, sans-serif' }}>
              📩 Email all documents to: <strong>miniconclothing@gmail.com</strong>
            </Typography>
          </Box>
        </>
      )
    },
    {
      id: 'panel4',
      question: 'Can I return or exchange if I ordered the wrong size?',
      content: (
        <Box sx={{ bgcolor: '#f5f5f5', p: 3, borderRadius: 1 }}>
          <Typography sx={{ fontSize: '1rem', lineHeight: 1.8, mb: 2, color: '#000', fontWeight: 600, fontFamily: 'Futura, sans-serif' }}>
            Unfortunately, we do not offer returns or exchanges for incorrect size selection.
          </Typography>
          <Typography sx={{ fontSize: '1rem', lineHeight: 1.8, mb: 2, color: '#000', fontFamily: 'Futura, sans-serif' }}>
            However, you may place a new order at your own expense if you&apos;d like to get a different size.
          </Typography>
          <Typography sx={{ fontSize: '1rem', lineHeight: 1.8, color: '#000', fontFamily: 'Futura, sans-serif' }}>
            <strong>Tip:</strong> Always refer to our size chart before placing your order.
          </Typography>
        </Box>
      )
    },
    {
      id: 'panel5',
      question: 'What if the product was damaged while opening?',
      content: (
        <Box sx={{ bgcolor: '#f5f5f5', p: 3, borderRadius: 1 }}>
          <Typography sx={{ fontSize: '1rem', lineHeight: 1.8, mb: 2, color: '#000', fontWeight: 600, fontFamily: 'Futura, sans-serif' }}>
            If the item was accidentally cut or damaged while opening (e.g. with scissors), we cannot approve a return unless:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <Typography component="li" sx={{ fontSize: '1rem', lineHeight: 1.8, color: '#000', mb: 1, fontFamily: 'Futura, sans-serif' }}>
              A clear unboxing video shows the condition before damage
            </Typography>
            <Typography component="li" sx={{ fontSize: '1rem', lineHeight: 1.8, color: '#000', mb: 1, fontFamily: 'Futura, sans-serif' }}>
              The damage wasn&apos;t caused during unpacking
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '1rem', lineHeight: 1.8, color: '#000', fontWeight: 600, fontFamily: 'Futura, sans-serif' }}>
            Please unbox your order carefully.
          </Typography>
        </Box>
      )
    },
    {
      id: 'panel6',
      question: 'How do I arrange a reverse pickup (if eligible)?',
      content: (
        <Box sx={{ bgcolor: '#f5f5f5', p: 3, borderRadius: 1 }}>
          <Typography sx={{ fontSize: '1rem', lineHeight: 1.8, mb: 2, color: '#000', fontFamily: 'Futura, sans-serif' }}>
            In select approved return cases, we may help arrange a reverse pickup within 5 days of delivery.
          </Typography>
          <Typography sx={{ fontSize: '1rem', lineHeight: 1.8, color: '#000', fontWeight: 600, fontFamily: 'Futura, sans-serif' }}>
            📦 This will be confirmed via email with instructions.
          </Typography>
        </Box>
      )
    },
    {
      id: 'panel7',
      question: 'What should I do if the package looks damaged on delivery?',
      content: (
        <>
          <Typography sx={{ fontSize: '1rem', lineHeight: 1.8, mb: 3, color: '#000', fontFamily: 'Futura, sans-serif' }}>
            Inspect the package before signing from the courier.
          </Typography>
          
          <Typography sx={{ fontSize: '1rem', lineHeight: 1.8, mb: 2, color: '#000', fontFamily: 'Futura, sans-serif' }}>
            If you notice visible damage:
          </Typography>
          
          <Box component="ul" sx={{ pl: 4, mb: 3 }}>
            {[
              'Mention it in the delivery remarks/signature',
              'Click photos immediately',
              'Share them with us when filing your claim'
            ].map((item, index) => (
              <Typography 
                key={index}
                component="li" 
                sx={{ fontSize: '1rem', lineHeight: 1.8, color: '#000', mb: 1, fontFamily: 'Futura, sans-serif' }}
              >
                {item}
              </Typography>
            ))}
          </Box>
          
          <Box sx={{ bgcolor: '#f5f5f5', p: 3, borderRadius: 1 }}>
            <Typography sx={{ fontSize: '1rem', lineHeight: 1.8, color: '#000', fontWeight: 600, fontFamily: 'Futura, sans-serif' }}>
              This helps us raise claims with the courier partner.
            </Typography>
          </Box>
        </>
      )
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
            Return & Exchange Policy
          </Typography>
          
          <Typography 
            sx={{
              fontSize: { xs: '1rem', md: '1.125rem' },
              lineHeight: 1.8,
              color: '#000',
              fontFamily: 'Futura, sans-serif',
              mb: 1
            }}
          >
            We want your Minicon experience to be smooth, transparent, and satisfying.
          </Typography>
          
          <Typography 
            sx={{
              fontSize: { xs: '1rem', md: '1.125rem' },
              lineHeight: 1.8,
              color: '#000',
              fontFamily: 'Futura, sans-serif'
            }}
          >
            Here are some key return and exchange guidelines.
          </Typography>
        </Box>

        {/* FAQ Accordion Section */}
        <Box>
          {faqItems.map((item) => (
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
                {item.content}
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
      </Container>
    </Box>
  );
};

export default ReturnPolicy;