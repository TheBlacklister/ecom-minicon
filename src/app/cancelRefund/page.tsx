'use client';

import React, { useState } from 'react';
import { Box, Typography, Container, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function CancelRefundPage() {
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const faqs = [
    {
      id: 'panel1',
      question: "Can I cancel my order?",
      answer: "Yes, but only if the cancellation request is made within 12 hours of placing the order.\nAfter 12 hours, your order goes into production and cannot be cancelled.\n📧 To cancel, email us at miniconclothing@gmail.com with your Order ID."
    },
    {
      id: 'panel2',
      question: "Can I cancel an order during a sale or discount offer?",
      answer: "❌ No. Orders placed during promotions, discounts, or special drops are not eligible for cancellation."
    },
    {
      id: 'panel3',
      question: "Will I get a refund if I cancel my order?",
      answer: "✅ Yes, if you cancel within 12 hours, your payment will be refunded in full to your original payment method within 5–7 business days."
    },
    {
      id: 'panel4',
      question: "When am I eligible for a refund?",
      answer: "You're eligible for a full refund if:\n• You received the wrong product\n• Your product was damaged or misprinted\n• The order was lost in transit and confirmed undeliverable\n• A return claim is approved but cannot be reprinted\n\n📦 Unboxing video + clear images are required for all refund claims."
    },
    {
      id: 'panel5',
      question: "Can I cancel a COD (Cash on Delivery) order?",
      answer: "Yes, but only within 12 hours of placing the order.\nAfter that, your order enters production and cannot be cancelled.\nPlease email us at miniconclothing@gmail.com with your Order ID to cancel."
    },
    {
      id: 'panel6',
      question: "What happens if I refuse a COD delivery?",
      answer: "If you refuse a COD order at the time of delivery:\n• The item will be returned to us.\n• You may be blocked from placing future COD orders with Minicon.\n• We reserve the right to suspend COD service for your account.\n\n❗Please order responsibly to help us keep COD available for everyone."
    },
    {
      id: 'panel7',
      question: "Can I get a refund on a COD order?",
      answer: "If your COD order is approved for refund (e.g., damaged or wrong product received), we'll issue a refund via:\n• UPI or bank transfer (as COD cannot be refunded automatically)\n\n📩 You'll need to share your UPI ID or bank details with us at miniconclothing@gmail.com after claim approval."
    },
    {
      id: 'panel8',
      question: "What situations are not eligible for a refund?",
      answer: "We do not offer refunds for:\n• Ordering the wrong size, color, or product\n• Change of mind after production has started\n• Customer-caused damage while opening the package\n• Missing or edited unboxing video\n\n📌 Refunds are not accepted if requested after 7 days of delivery."
    },
    {
      id: 'panel9',
      question: "Is there any charge for a refund request by the customer?",
      answer: "Yes, if you choose to return a product and request a refund for reasons other than defects or our error, an additional return processing fee will apply.\n• For Prepaid orders, a charge of ₹100 will be deducted.\n• For Cash on Delivery (COD) orders, a charge of ₹150 will be deducted.\n\nThis fee covers handling and restocking costs related to the return.\n\nPlease note: Refund requests due to damaged or defective products caused by our mistake will not incur any charges."
    },
    {
      id: 'panel10',
      question: "How long does it take to receive my refund?",
      answer: "Once approved, your refund will be processed in 5–7 business days and credited to your original payment method.\nIf you haven't received it within that time, check with your bank or email us."
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
              fontFamily: '"Montserrat", sans-serif'
            }}
          >
            CANCEL & REFUND – FREQUENTLY ASKED QUESTIONS (FAQS)
          </Typography>
          
          <Typography 
            sx={{
              fontSize: { xs: '1rem', md: '1.125rem' },
              lineHeight: 1.8,
              color: '#000',
              fontFamily: '"Montserrat", sans-serif'
            }}
          >
            Everything you need to know about cancelling orders and requesting refunds.
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
                    fontFamily: '"Montserrat", sans-serif'
                  }}
                >
                  🔻 {item.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 3, pb: 3 }}>
                <Typography sx={{ 
                  fontSize: '1rem', 
                  lineHeight: 1.8, 
                  color: '#000', 
                  fontFamily: '"Montserrat", sans-serif',
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
              fontFamily: '"Montserrat", sans-serif'
            }}
          >
            ❓ Still Need Help?
          </Typography>
          
          <Typography 
            sx={{
              fontSize: { xs: '1rem', md: '1.125rem' },
              lineHeight: 1.8,
              mb: 3,
              color: '#000',
              fontFamily: '"Montserrat", sans-serif'
            }}
          >
            We&apos;re always here to help.
          </Typography>
          
          <Typography 
            sx={{
              fontSize: '1rem',
              lineHeight: 1.8,
              color: '#000',
              fontFamily: '"Montserrat", sans-serif'
            }}
          >
            📩 Email us at: miniconclothing@gmail.com
          </Typography>
        </Box>

        {/* Important Notes */}
        <Box sx={{ mt: 6, p: 4, bgcolor: '#f5f5f5', borderRadius: 2 }}>
          <Typography sx={{ 
            fontWeight: 700, 
            mb: 2, 
            color: '#000',
            fontSize: '1.125rem',
            fontFamily: '"Montserrat", sans-serif'
          }}>
            ⚠️ Important Notes:
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <Typography component="li" sx={{ 
              lineHeight: 1.8,
              fontSize: '1rem',
              color: '#000',
              fontFamily: '"Montserrat", sans-serif',
              mb: 1
            }}>
              All cancellation requests must be made within 12 hours of order placement
            </Typography>
            <Typography component="li" sx={{ 
              lineHeight: 1.8,
              fontSize: '1rem',
              color: '#000',
              fontFamily: '"Montserrat", sans-serif',
              mb: 1
            }}>
              Unboxing videos and clear images are mandatory for refund claims
            </Typography>
            <Typography component="li" sx={{ 
              lineHeight: 1.8,
              fontSize: '1rem',
              color: '#000',
              fontFamily: '"Montserrat", sans-serif',
              mb: 1
            }}>
              Refund processing takes 5-7 business days
            </Typography>
            <Typography component="li" sx={{ 
              lineHeight: 1.8,
              fontSize: '1rem',
              color: '#000',
              fontFamily: '"Montserrat", sans-serif'
            }}>
              Return processing fees apply for non-defective returns
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}