"use client"
import React, { useState } from 'react';
import { Box, Typography, Container, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const Disclaimer = () => {
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const sections = [
    {
      id: 'panel1',
      title: '1. Product Representation',
      content: (
        <>
          <Typography sx={{ fontSize: '1rem', mb: 2, color: '#000', lineHeight: 1.7, fontFamily: '"Montserrat", sans-serif ' }}>
            We make every effort to accurately display and describe our products, including colors, designs, sizes, and product images. However, due to differences in screen displays, lighting during photography, and printing methods:
          </Typography>
          <Box component="ul" sx={{ fontSize: '1rem', color: '#000', ml: 3, mb: 2, lineHeight: 1.7, fontFamily: '"Montserrat", sans-serif ' }}>
            <li>Minor variations in color, alignment, or print placement may occur.</li>
            <li>The actual product may slightly differ from the preview shown on the Website.</li>
          </Box>
          <Typography sx={{ fontSize: '1rem', color: '#000', lineHeight: 1.7, fontFamily: '"Montserrat", sans-serif ' }}>
            These differences shall not be considered defects and are not eligible for refunds or replacements unless explicitly stated otherwise.
          </Typography>
        </>
      )
    },
    {
      id: 'panel2',
      title: '2. Made-to-Order Products',
      content: (
        <>
          <Typography sx={{ fontSize: '1rem', mb: 2, color: '#000', lineHeight: 1.7, fontFamily: '"Montserrat", sans-serif ' }}>
            All products sold on our Website are made-to-order and custom-printed upon receiving your order. As a result:
          </Typography>
          <Box component="ul" sx={{ fontSize: '1rem', color: '#000', ml: 3, mb: 2, lineHeight: 1.7, fontFamily: '"Montserrat", sans-serif ' }}>
            <li>Products may have slight variations between batches.</li>
            <li>Delivery timelines may vary based on demand, production schedules, and third-party logistics.</li>
          </Box>
          <Typography sx={{ fontSize: '1rem', color: '#000', lineHeight: 1.7, fontFamily: '"Montserrat", sans-serif ' }}>
            We shall not be held responsible for delays caused by external factors such as courier disruptions, public holidays, or unforeseen events.
          </Typography>
        </>
      )
    },
    {
      id: 'panel3',
      title: '3. Third-Party Fulfilment',
      content: (
        <Typography sx={{ fontSize: '1rem', color: '#000', lineHeight: 1.7, fontFamily: '"Montserrat", sans-serif ' }}>
          We work with third-party fulfilment and print-on-demand service providers for manufacturing and shipping. While we maintain high standards in selecting partners, we are not liable for any direct, incidental, or consequential damages resulting from their performance or negligence.
        </Typography>
      )
    },
    {
      id: 'panel4',
      title: '4. Sizing and Fit',
      content: (
        <>
          <Typography sx={{ fontSize: '1rem', mb: 2, color: '#000', lineHeight: 1.7, fontFamily: '"Montserrat", sans-serif ' }}>
            Each product includes a detailed size chart. It is the customer&apos;s responsibility to review and select the correct size prior to placing an order. Returns or refunds will not be accepted for sizing issues unless:
          </Typography>
          <Box component="ul" sx={{ fontSize: '1rem', color: '#000', ml: 3, lineHeight: 1.7, fontFamily: '"Montserrat", sans-serif ' }}>
            <li>The product differs from the ordered size.</li>
            <li>A manufacturing defect is demonstrated with valid proof, including an unedited unboxing video and clear images.</li>
          </Box>
        </>
      )
    },
    {
      id: 'panel5',
      title: '5. Intellectual Property',
      content: (
        <Typography sx={{ fontSize: '1rem', color: '#000', lineHeight: 1.7, fontFamily: '"Montserrat", sans-serif ' }}>
          All content, designs, artwork, logos, branding, and trademarks displayed on this Website are the exclusive intellectual property of Minicon Clothing. Any reproduction, redistribution, or unauthorized commercial use is strictly prohibited and may lead to legal action under applicable laws.
        </Typography>
      )
    },
    {
      id: 'panel6',
      title: '6. Limitation of Liability',
      content: (
        <>
          <Typography sx={{ fontSize: '1rem', mb: 2, color: '#000', lineHeight: 1.7, fontFamily: '"Montserrat", sans-serif ' }}>
            To the fullest extent permitted by law, Minicon Clothing shall not be liable for any:
          </Typography>
          <Box component="ul" sx={{ fontSize: '1rem', color: '#000', ml: 3, mb: 2, lineHeight: 1.7, fontFamily: '"Montserrat", sans-serif ' }}>
            <li>Direct or indirect damages resulting from product use or website access.</li>
            <li>Loss or damage due to courier delays, user error, or third-party service failure.</li>
            <li>Damages resulting from misuse of our services, including fraudulent COD orders, misuse of promotional offers, or improper unboxing.</li>
          </Box>
          <Typography sx={{ fontSize: '1rem', color: '#000', lineHeight: 1.7, fontFamily: '"Montserrat", sans-serif ' }}>
            Your sole and exclusive remedy for dissatisfaction with any product or service is to discontinue use of the Website.
          </Typography>
        </>
      )
    },
    {
      id: 'panel7',
      title: '7. Governing Law & Jurisdiction',
      content: (
        <Typography sx={{ fontSize: '1rem', color: '#000', lineHeight: 1.7, fontFamily: '"Montserrat", sans-serif ' }}>
          This Disclaimer and any dispute arising from your use of this Website shall be governed by and construed in accordance with the laws of India. All disputes shall be subject to the exclusive jurisdiction of the courts located in Kolkata, India.
        </Typography>
      )
    },
    {
      id: 'panel8',
      title: '8. Contact Information',
      content: (
        <>
          <Typography sx={{ fontSize: '1rem', mb: 2, color: '#000', lineHeight: 1.7, fontFamily: '"Montserrat", sans-serif ' }}>
            For any questions or concerns related to this Disclaimer, you may contact us at:
          </Typography>
          <Typography sx={{ fontSize: '1rem', color: '#000', lineHeight: 1.7, fontFamily: '"Montserrat", sans-serif ' }}>
            📧 miniconclothing@gmail.com
          </Typography>
        </>
      )
    }
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: '#ffffff',
      py: { xs: 4, md: 8 }
    }}>
      <Container maxWidth="md">
        <Box textAlign="center" mb={6}>
          <Typography 
            variant="h1" 
            sx={{
              fontSize: { xs: '2rem', md: '2.5rem' },
              fontWeight: 700,
              mb: 3,
              color: '#000',
              fontFamily: '"Montserrat", sans-serif '
            }}
          >
            DISCLAIMER
          </Typography>
          
          <Typography sx={{ 
            fontSize: '1rem', 
            mb: 2, 
            color: '#000',
            fontWeight: 600,
            fontFamily: '"Montserrat", sans-serif '
          }}>
            Effective Date: 1 July 2025
          </Typography>
          
          <Typography sx={{ 
            fontSize: '1rem', 
            mb: 3, 
            color: '#000', 
            lineHeight: 1.7,
            fontFamily: '"Montserrat", sans-serif '
          }}>
            This Disclaimer (&quot;Disclaimer&quot;, &quot;Policy&quot;) governs the use of the website www.minicon.in (&quot;Website&quot;) and all related services, products, and content provided by MINICON & TRX TRNDS (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;).
          </Typography>
          
          <Typography sx={{ 
            fontSize: '1rem', 
            mb: 4, 
            color: '#000', 
            lineHeight: 1.7,
            fontFamily: '"Montserrat", sans-serif '
          }}>
            By accessing, browsing, or using this Website, you (&quot;User&quot;, &quot;you&quot;) agree to be bound by this Disclaimer. If you do not agree with any part of this Disclaimer, you must refrain from using our website or services.
          </Typography>
        </Box>

        {/* Accordion Sections */}
        <Box>
          {sections.map((section) => (
            <Accordion
              key={section.id}
              expanded={expanded === section.id}
              onChange={handleChange(section.id)}
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
                <Typography sx={{ 
                  fontWeight: 600, 
                  fontSize: '1.25rem',
                  color: '#000',
                  fontFamily: '"Montserrat", sans-serif '
                }}>
                  {section.title}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 3, pb: 3 }}>
                {section.content}
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Container>
    </Box>
  );
};

export default Disclaimer;