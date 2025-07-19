"use client"
import React from 'react'
import { Box, Typography } from '@mui/material';

const Privacy = () => {
  return (
    <Box sx={{ 
      maxWidth: 900, 
      mx: 'auto', 
      px: { xs: 2, sm: 3, md: 4 }, 
      py: { xs: 3, sm: 5, md: 6 },
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif '
    }}>
      <Typography 
        variant="h3" 
        fontWeight={700} 
        mb={4} 
        fontSize={{ xs: '2.2rem', md: '2.8rem' }}
        sx={{ 
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif ',
          color: '#1a1a1a',
          textAlign: 'center',
          letterSpacing: '-0.02em'
        }}
      >
        Privacy Policy
      </Typography>
      
      <Typography 
        fontSize={{ xs: '1.1rem', md: '1.2rem' }} 
        mb={4} 
        color="#4a4a4a" 
        lineHeight={1.8}
        sx={{ 
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif ',
          fontWeight: 400
        }}
      >
        At Minicon, we value your privacy and are committed to protecting your personal data in accordance with applicable Indian laws, including the IT Act 2000 and its related rules. This Privacy Policy explains how we collect, use, disclose, and protect your personal information.
      </Typography>

      <Box sx={{ borderBottom: '2px solid #e0e0e0', mb: 4 }} />

      <Typography 
        variant="h4" 
        fontWeight={600} 
        mt={4} 
        mb={3} 
        fontSize={{ xs: '1.4rem', md: '1.5rem' }}
        sx={{ 
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif ',
          color: '#1a1a1a',
          letterSpacing: '-0.01em'
        }}
      >
        1. Information We Collect
      </Typography>
      <Typography 
        fontSize={{ xs: '1rem', md: '1.1rem' }} 
        mb={3} 
        color="#4a4a4a"
        sx={{ 
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif ',
          fontWeight: 500
        }}
      >
        We collect the following types of information from you:
      </Typography>
      <Typography 
        fontSize={{ xs: '1rem', md: '1.1rem' }} 
        color="#4a4a4a" 
        sx={{ 
          ml: { xs: 2, md: 3 }, 
          mb: { xs: 2.5, md: 3 }, 
          lineHeight: 1.8,
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif '
        }}
      >
        <Typography component="span" fontWeight={600} color="#1a1a1a" sx={{ fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif ' }}>• Personal Information:</Typography> Your name, postal address, email address, phone number, and payment details when you place an order or register on our website.
      </Typography>
      <Typography 
        fontSize={{ xs: '1rem', md: '1.1rem' }} 
        color="#4a4a4a" 
        sx={{ 
          ml: { xs: 2, md: 3 }, 
          mb: { xs: 2.5, md: 3 }, 
          lineHeight: 1.8,
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif '
        }}
      >
        <Typography component="span" fontWeight={600} color="#1a1a1a" sx={{ fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif ' }}>• Sensitive Personal Data:</Typography> Payment information and any other sensitive details needed to complete your purchase securely.
      </Typography>
      <Typography 
        fontSize={{ xs: '1rem', md: '1.1rem' }} 
        color="#4a4a4a" 
        sx={{ 
          ml: { xs: 2, md: 3 }, 
          mb: { xs: 2.5, md: 3 }, 
          lineHeight: 1.8,
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif '
        }}
      >
        <Typography component="span" fontWeight={600} color="#1a1a1a" sx={{ fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif ' }}>• Technical Data:</Typography> IP address, browser type, device information, and usage data collected automatically through cookies and similar technologies.
      </Typography>

      <Box sx={{ borderBottom: '2px solid #e0e0e0', mb: 4 }} />

      <Typography 
        variant="h4" 
        fontWeight={600} 
        mt={4} 
        mb={3} 
        fontSize={{ xs: '1.4rem', md: '1.5rem' }}
        sx={{ 
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif ',
          color: '#1a1a1a',
          letterSpacing: '-0.01em'
        }}
      >
        2. Purpose of Collection and Use of Information
      </Typography>
      <Typography 
        fontSize={{ xs: '1rem', md: '1.1rem' }} 
        mb={3} 
        color="#4a4a4a"
        sx={{ 
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif ',
          fontWeight: 500
        }}
      >
        We collect and use your information to:
      </Typography>
      <Typography 
        fontSize={{ xs: '1rem', md: '1.1rem' }} 
        color="#4a4a4a" 
        sx={{ 
          ml: { xs: 2, md: 3 }, 
          mb: { xs: 1.5, md: 2 }, 
          lineHeight: 1.8,
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif '
        }}
      >
        • Process and fulfill your orders.
      </Typography>
      <Typography 
        fontSize={{ xs: '1rem', md: '1.1rem' }} 
        color="#4a4a4a" 
        sx={{ 
          ml: { xs: 2, md: 3 }, 
          mb: { xs: 1.5, md: 2 }, 
          lineHeight: 1.8,
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif '
        }}
      >
        • Communicate order status, updates, and promotional offers (with your consent).
      </Typography>
      <Typography 
        fontSize={{ xs: '1rem', md: '1.1rem' }} 
        color="#4a4a4a" 
        sx={{ 
          ml: { xs: 2, md: 3 }, 
          mb: { xs: 1.5, md: 2 }, 
          lineHeight: 1.8,
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif '
        }}
      >
        • Prevent fraudulent or illegal activities.
      </Typography>
      <Typography 
        fontSize={{ xs: '1rem', md: '1.1rem' }} 
        color="#4a4a4a" 
        sx={{ 
          ml: { xs: 2, md: 3 }, 
          mb: { xs: 1.5, md: 2 }, 
          lineHeight: 1.8,
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif '
        }}
      >
        • Improve website experience and services.
      </Typography>
      <Typography 
        fontSize={{ xs: '1rem', md: '1.1rem' }} 
        color="#4a4a4a" 
        sx={{ 
          ml: { xs: 2, md: 3 }, 
          mb: { xs: 2.5, md: 3 }, 
          lineHeight: 1.8,
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif '
        }}
      >
        • Comply with applicable legal and regulatory requirements.
      </Typography>

      <Box sx={{ borderBottom: '2px solid #e0e0e0', mb: 4 }} />

      <Typography 
        variant="h4" 
        fontWeight={600} 
        mt={4} 
        mb={3} 
        fontSize={{ xs: '1.4rem', md: '1.5rem' }}
        sx={{ 
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif ',
          color: '#1a1a1a',
          letterSpacing: '-0.01em'
        }}
      >
        3. Consent and Disclosure
      </Typography>
      <Typography 
        fontSize={{ xs: '1rem', md: '1.1rem' }} 
        mb={3} 
        color="#4a4a4a" 
        lineHeight={1.8}
        sx={{ 
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif '
        }}
      >
        By using our services or website, you consent to the collection, processing, and transfer of your data as described in this policy. We do not disclose your personal information to third parties except:
      </Typography>
      <Typography 
        fontSize={{ xs: '1rem', md: '1.1rem' }} 
        color="#4a4a4a" 
        sx={{ 
          ml: { xs: 2, md: 3 }, 
          mb: { xs: 1.5, md: 2 }, 
          lineHeight: 1.8,
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif '
        }}
      >
        • To trusted service providers (payment processors, couriers, IT service providers) who agree to keep your information confidential and use it only to provide services to us.
      </Typography>
      <Typography 
        fontSize={{ xs: '1rem', md: '1.1rem' }} 
        color="#4a4a4a" 
        sx={{ 
          ml: { xs: 2, md: 3 }, 
          mb: { xs: 2.5, md: 3 }, 
          lineHeight: 1.8,
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif '
        }}
      >
        • As required by law, court order, or government regulation.
      </Typography>

      <Box sx={{ borderBottom: '2px solid #e0e0e0', mb: 4 }} />

      <Typography 
        variant="h4" 
        fontWeight={600} 
        mt={4} 
        mb={3} 
        fontSize={{ xs: '1.4rem', md: '1.5rem' }}
        sx={{ 
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif ',
          color: '#1a1a1a',
          letterSpacing: '-0.01em'
        }}
      >
        4. Data Security Measures
      </Typography>
      <Typography 
        fontSize={{ xs: '1rem', md: '1.1rem' }} 
        mb={3} 
        color="#4a4a4a" 
        lineHeight={1.8}
        sx={{ 
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif '
        }}
      >
        We have implemented reasonable security practices and procedures to protect your personal data from unauthorized access, misuse, or disclosure, including encryption and secured servers.
      </Typography>
      <Typography 
        fontSize={{ xs: '1rem', md: '1.1rem' }} 
        mb={4} 
        color="#4a4a4a" 
        lineHeight={1.8}
        sx={{ 
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif '
        }}
      >
        However, no method of electronic transmission or storage is 100% secure. You acknowledge and accept the risks of sharing information online.
      </Typography>

      <Box sx={{ borderBottom: '2px solid #e0e0e0', mb: 4 }} />

      <Typography 
        variant="h4" 
        fontWeight={600} 
        mt={4} 
        mb={3} 
        fontSize={{ xs: '1.4rem', md: '1.5rem' }}
        sx={{ 
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif ',
          color: '#1a1a1a',
          letterSpacing: '-0.01em'
        }}
      >
        5. Cookies and Tracking Technologies
      </Typography>
      <Typography 
        fontSize={{ xs: '1rem', md: '1.1rem' }} 
        mb={4} 
        color="#4a4a4a" 
        lineHeight={1.8}
        sx={{ 
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif '
        }}
      >
        Our website uses cookies to enhance user experience, analyze website traffic, and provide relevant advertisements. You can disable cookies in your browser settings, but this may affect website functionality.
      </Typography>

      <Box sx={{ borderBottom: '2px solid #e0e0e0', mb: 4 }} />

      <Typography 
        variant="h4" 
        fontWeight={600} 
        mt={4} 
        mb={3} 
        fontSize={{ xs: '1.4rem', md: '1.5rem' }}
        sx={{ 
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif ',
          color: '#1a1a1a',
          letterSpacing: '-0.01em'
        }}
      >
        6. Retention of Information
      </Typography>
      <Typography 
        fontSize={{ xs: '1rem', md: '1.1rem' }} 
        mb={4} 
        color="#4a4a4a" 
        lineHeight={1.8}
        sx={{ 
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif '
        }}
      >
        We retain your personal information only as long as necessary to fulfill the purposes outlined, comply with legal obligations, resolve disputes, and enforce our agreements.
      </Typography>

      <Box sx={{ borderBottom: '2px solid #e0e0e0', mb: 4 }} />

      <Typography 
        variant="h4" 
        fontWeight={600} 
        mt={4} 
        mb={3} 
        fontSize={{ xs: '1.4rem', md: '1.5rem' }}
        sx={{ 
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif ',
          color: '#1a1a1a',
          letterSpacing: '-0.01em'
        }}
      >
        7. Your Rights
      </Typography>
      <Typography 
        fontSize={{ xs: '1rem', md: '1.1rem' }} 
        mb={3} 
        color="#4a4a4a"
        sx={{ 
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif ',
          fontWeight: 500
        }}
      >
        Under Indian law, you have the right to:
      </Typography>
      <Typography 
        fontSize={{ xs: '1rem', md: '1.1rem' }} 
        color="#4a4a4a" 
        sx={{ 
          ml: { xs: 2, md: 3 }, 
          mb: { xs: 1.5, md: 2 }, 
          lineHeight: 1.8,
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif '
        }}
      >
        • Access the personal data we hold about you.
      </Typography>
      <Typography 
        fontSize={{ xs: '1rem', md: '1.1rem' }} 
        color="#4a4a4a" 
        sx={{ 
          ml: { xs: 2, md: 3 }, 
          mb: { xs: 1.5, md: 2 }, 
          lineHeight: 1.8,
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif '
        }}
      >
        • Request corrections or updates to your information.
      </Typography>
      <Typography 
        fontSize={{ xs: '1rem', md: '1.1rem' }} 
        color="#4a4a4a" 
        sx={{ 
          ml: { xs: 2, md: 3 }, 
          mb: { xs: 1.5, md: 2 }, 
          lineHeight: 1.8,
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif '
        }}
      >
        • Withdraw consent to marketing communications.
      </Typography>
      <Typography 
        fontSize={{ xs: '1rem', md: '1.1rem' }} 
        color="#4a4a4a" 
        sx={{ 
          ml: { xs: 2, md: 3 }, 
          mb: { xs: 2.5, md: 3 }, 
          lineHeight: 1.8,
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif '
        }}
      >
        • Request deletion or blocking of your personal data (subject to legal requirements).
      </Typography>
      <Typography 
        fontSize={{ xs: '1rem', md: '1.1rem' }} 
        mb={4} 
        color="#4a4a4a" 
        lineHeight={1.8}
        sx={{ 
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif '
        }}
      >
        To exercise these rights, please contact us at{' '}
        <a 
          href="mailto:miniconclothing@gmail.com" 
          style={{ 
            color: '#1976d2', 
            textDecoration: 'none',
            fontWeight: 500,
            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif '
          }}
          onMouseEnter={(e) => (e.target as HTMLElement).style.textDecoration = 'underline'}
          onMouseLeave={(e) => (e.target as HTMLElement).style.textDecoration = 'none'}
        >
          miniconclothing@gmail.com
        </a>.
      </Typography>

      <Box sx={{ borderBottom: '2px solid #e0e0e0', mb: 4 }} />

      <Typography 
        variant="h4" 
        fontWeight={600} 
        mt={4} 
        mb={3} 
        fontSize={{ xs: '1.4rem', md: '1.5rem' }}
        sx={{ 
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif ',
          color: '#1a1a1a',
          letterSpacing: '-0.01em'
        }}
      >
        8. Children&apos;s Privacy
      </Typography>
      <Typography 
        fontSize={{ xs: '1rem', md: '1.1rem' }} 
        mb={4} 
        color="#4a4a4a" 
        lineHeight={1.8}
        sx={{ 
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif '
        }}
      >
        Our website and services are not directed at children under 13 years of age. We do not knowingly collect data from children under this age.
      </Typography>

      <Box sx={{ borderBottom: '2px solid #e0e0e0', mb: 4 }} />

      <Typography 
        variant="h4" 
        fontWeight={600} 
        mt={4} 
        mb={3} 
        fontSize={{ xs: '1.4rem', md: '1.5rem' }}
        sx={{ 
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif ',
          color: '#1a1a1a',
          letterSpacing: '-0.01em'
        }}
      >
        9. Changes to This Privacy Policy
      </Typography>
      <Typography 
        fontSize={{ xs: '1rem', md: '1.1rem' }} 
        mb={4} 
        color="#4a4a4a" 
        lineHeight={1.8}
        sx={{ 
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif '
        }}
      >
        We may update this Privacy Policy occasionally to reflect changes in laws or business practices. We encourage you to review this policy regularly. Continued use of the website constitutes acceptance of any updates.
      </Typography>

      <Box sx={{ borderBottom: '2px solid #e0e0e0', mb: 4 }} />

      <Typography 
        variant="h4" 
        fontWeight={600} 
        mt={4} 
        mb={3} 
        fontSize={{ xs: '1.4rem', md: '1.5rem' }}
        sx={{ 
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif ',
          color: '#1a1a1a',
          letterSpacing: '-0.01em'
        }}
      >
        10. Contact Information
      </Typography>
      <Typography 
        fontSize={{ xs: '1rem', md: '1.1rem' }} 
        mb={3} 
        color="#4a4a4a" 
        lineHeight={1.8}
        sx={{ 
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif '
        }}
      >
        For any questions, concerns, or requests related to your privacy, please reach out to us:
      </Typography>
      <Typography 
        fontSize={{ xs: '1rem', md: '1.1rem' }} 
        mb={4} 
        color="#4a4a4a" 
        lineHeight={1.8}
        sx={{ 
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif '
        }}
      >
        Email:{' '}
        <a 
          href="mailto:miniconclothing@gmail.com" 
          style={{ 
            color: '#1976d2', 
            textDecoration: 'none',
            fontWeight: 500,
            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", "Montserrat", sans-serif '
          }}
          onMouseEnter={(e) => (e.target as HTMLElement).style.textDecoration = 'underline'}
          onMouseLeave={(e) => (e.target as HTMLElement).style.textDecoration = 'none'}
        >
          miniconclothing@gmail.com
        </a>
      </Typography>
    </Box>
  )
}

export default Privacy