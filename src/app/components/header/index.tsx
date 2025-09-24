'use client';

import { useState, MouseEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { FavoriteBorderOutlined, Menu as MenuIcon, Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import styles from './index.module.css';
import { MENUS } from '@/app/dummyData';
import { Typography, Divider, InputAdornment, Card, CardContent, Badge } from '@mui/material'
import CartDrawer from '../cartDrawer'
import { useAuth } from '../AuthProvider'
import { useCount } from '../CountProvider'

export default function Header() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const { cartCount, wishlistCount } = useCount();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedAccordion, setExpandedAccordion] = useState<string | false>(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Load products from localStorage and filter based on search
  useEffect(() => {
    if (search.trim()) {
      try {
        const storedProducts = localStorage.getItem('allProducts');
        if (storedProducts) {
          const products = JSON.parse(storedProducts);
          const searchLower = search.toLowerCase();
          
          const filtered = products.filter((product: any) => {
            // Search in multiple fields
            return (
              product.title?.toLowerCase().includes(searchLower) ||
              product.subtitle?.toLowerCase().includes(searchLower) ||
              product.description?.toLowerCase().includes(searchLower) ||
              product.collections?.some((col: string) => col.toLowerCase().includes(searchLower)) ||
              product.material?.toLowerCase().includes(searchLower) ||
              product.category?.some((cat: string) => cat.toLowerCase().includes(searchLower)) ||
              product.available_colors?.some((color: string) => color.toLowerCase().includes(searchLower))
            );
          });
          
          setSearchResults(filtered);
        }
      } catch (error) {
        console.error('Error parsing products from localStorage:', error);
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  }, [search]);

  const handleOpen =
    (index: number) =>
      (event: MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
        setActiveMenu(index);
      };

  const handleClose = () => {
    setAnchorEl(null);
    setActiveMenu(null);
  };
  

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleSearchDrawerToggle = () => {
    setSearchDrawerOpen(!searchDrawerOpen);
    if (!searchDrawerOpen) {
      setSearch(''); // Clear search when opening
      setSearchResults([]); // Clear results
    }
  };

  const handleProductClick = (productSlug: string) => {
    router.push(`/preCheckout?id=${encodeURIComponent(productSlug)}`);
    setSearchDrawerOpen(false);
    setMobileMenuOpen(false);
    setSearch('');
    setSearchResults([]);
  };

  const slug = (str: string) =>
    encodeURIComponent(str.toLowerCase().replace(/\s+/g, '-'));

  const renderMenus = () => (
    <div className={styles.menus}>
      {MENUS.map(({ label, items }, idx) => (
        <div key={label}>
          <Button
            sx={{
              fontFamily: '"Montserrat", sans-serif ',
              color: 'white',
              fontSize: { xs: '0.9rem', sm: '1rem' }
            }}
            aria-controls={activeMenu === idx ? `${label}-menu` : undefined}
            aria-haspopup="true"
            onClick={handleOpen(idx)}
            className={styles.navItem}
          >
            {label}
          </Button>
          <Menu
            id={`${label}-menu`}
            anchorEl={anchorEl}
            open={activeMenu === idx}
            onClose={handleClose}
            MenuListProps={{ onMouseLeave: handleClose, sx: { bgcolor: '#000', border: '1px solid #444' } }}
            keepMounted
            disableScrollLock
          >
            {items.map((item) => (
              <MenuItem
                key={item}
                onClick={() => {
                  if (slug(item)==='supima') {
                    router.push(`/categories/material/super_combed_cotton`);
                  } else {
                    router.push(`/categories/${slug(label)}/${slug(item)}`);
                  }
                  
                  handleClose();
                  setMobileMenuOpen(false);
                }}
                sx={{
                  bgcolor: '#000',
                  color: 'white',
                  borderBottom: '1px solid #444',
                  '&:last-child': { borderBottom: 'none' },
                  '&:hover': { bgcolor: '#222' }
                }}
              >
                <Typography sx={{ color: 'white', fontFamily: '"Montserrat", sans-serif ' }}>
                  {item}
                </Typography>
              </MenuItem>
            ))}
          </Menu>
        </div>
      ))}
    </div>
  );

  const renderSearchResults = () => {
    if (!search.trim() || searchResults.length === 0) {
      return search.trim() ? (
        <Box sx={{ textAlign: 'center', mt: 4, color: 'text.secondary' }}>
          <Typography>No products found matching {search}</Typography>
        </Box>
      ) : null;
    }

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
          {searchResults.length} {searchResults.length === 1 ? 'product' : 'products'} found
        </Typography>
        {searchResults.map((product) => {
          // ✅ FIXED: Properly clean the image path
          let imagePath = '/placeholder.jpg'; // Default fallback
          
          if (product.images?.[0]) {
            imagePath = product.images[0]
              .replace(/\\\\/g, '/') // Replace double backslashes with single forward slash
              .replace(/\\/g, '/')   // Replace any remaining backslashes with forward slashes
              .replace(/^public\//, '/') // Remove 'public/' prefix and ensure leading slash
              .replace(/\/+/g, '/'); // Replace multiple consecutive slashes with single slash
          }
          
          console.log('CLEANED IMAGE PATH:', {
            original: product.images?.[0],
            cleaned: imagePath
          });
          
          return (
            <Card
              key={product.id}
              onClick={() => handleProductClick(product.id)}
              sx={{
                display: 'flex',
                mb: 2,
                cursor: 'pointer',
                transition: 'all 0.3s',
                '&:hover': {
                  boxShadow: 3,
                  transform: 'translateY(-2px)',
                },
              }}
            >
              {/* Updated image component with proper error handling */}
              <Box sx={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
                <Image
                  src={imagePath}
                  alt={product.title}
                  fill
                  sizes="80px"
                  quality={40} // Reduce quality to 40% for thumbnails
                  style={{ objectFit: 'cover' }}
                  // ✅ Add error handling
                  onError={(e) => {
                    console.error('Image failed to load:', imagePath);
                    e.currentTarget.src = '/placeholder.jpg';
                  }}
                />
              </Box>
              
              <CardContent sx={{ flex: 1, py: 1, '&:last-child': { pb: 1 } }}>
                <Typography variant="body1" component="div" sx={{ fontWeight: 500 }}>
                  {product.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {product.subtitle}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    ₹{product.price_after}
                  </Typography>
                  {product.price_before > product.price_after && (
                    <>
                      <Typography
                        variant="body2"
                        sx={{ textDecoration: 'line-through', ml: 1, color: 'text.secondary' }}
                      >
                        ₹{product.price_before}
                      </Typography>
                      <Typography variant="body2" sx={{ ml: 1, color: 'success.main' }}>
                        {product.discount_percentage}% off
                      </Typography>
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    );
  };

  return (
    <>
      <header className={styles.header}>
        {/* Mobile menu button */}
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleMobileMenuToggle}
            sx={{ mr: 2, color: 'white' }}
            >
              <MenuIcon />
            </IconButton>
          )}

        {/* Center group: logo and menus */}
        <div className={styles.centerGroup}>
          <Link href="/" scroll={false} className={styles.logo}>
            <video
              src="/gifs/miniconLatestLogo.mp4"
              autoPlay
              muted
              loop
              playsInline
              style={{
                height: 'auto',
                width: isMobile ? '100px' : '8vw',
                maxWidth: '150px',
                minWidth: '80px',
              }}
            />
          </Link>

          {!isMobile && renderMenus()}

        {/* Right actions */}
        <div className={styles.actions}>
            {/* Search Icon - Now functional */}
            {!isMobile && (
              <SearchIcon
                className={styles.icon}
                onClick={handleSearchDrawerToggle}
                style={{ cursor: 'pointer' }}
              />
            )}
            
            {/* Wishlist Icon - Only show for authenticated users */}
            {user && (
              <Badge
                badgeContent={wishlistCount}
                sx={{
                  '& .MuiBadge-badge': {
                    right: -5,
                    top:0,
                    border: '1px solid white',
                    backgroundColor: '#000',
                    color: '#fff',
                  }
                }}
              >
                <FavoriteBorderOutlined
                  className={styles.icon}
                  onClick={() => router.push('/wishlist')}
                  style={{ cursor: 'pointer' }}
                />
              </Badge>
            )}

            {/* Cart Icon - Only show for authenticated users */}
            {user && (
              <Badge
                badgeContent={cartCount}
                sx={{
                  '& .MuiBadge-badge': {
                    right: -5,
                    top: 0,
                    border: '1px solid white',
                    backgroundColor: '#000',
                    color: '#fff',
                  }
                }}
              >
                <ShoppingCartIcon
                  className={styles.icon}
                  onClick={() => setCartOpen(true)}
                  style={{ cursor: 'pointer' }}
                />
              </Badge>
            )}
            <AccountCircleIcon
              className={styles.icon}
              onClick={() => router.push(user ? '/account' : '/login')}
              style={{ cursor: 'pointer' }}
            />
          </div>
          </div>

        {/* Mobile menu drawer */}
        <Drawer
          anchor="left"
          open={mobileMenuOpen}
          onClose={handleMobileMenuToggle}
          sx={{
            '& .MuiDrawer-paper': {
              width: '100%',
              maxWidth: '300px',
              bgcolor: '#fff',
              color: '#000',
              padding: 0,
            },
          }}
        >
          <Box sx={{ p: 0 }}>
            {/* Mobile search bar - Now functional */}
            {isMobile && (
              <Box sx={{ p: 2 }}>
                <TextField
                  fullWidth
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search products..."
                  size="small"
                  variant="outlined"
                  sx={{
                    background: '#f5f5f5',
                    borderRadius: 1,
                    '& .MuiInputBase-input': {
                      color: '#000',
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: '#666',
                      opacity: 1,
                    },
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        {search ? (
                          <IconButton size="small" onClick={() => setSearch('')}>
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        ) : (
                          <SearchIcon sx={{ color: '#666' }} />
                        )}
                      </InputAdornment>
                    ),
                  }}
                />
                {/* Mobile search results */}
                <Box sx={{ mt: 2, maxHeight: '300px', overflowY: 'auto' }}>
                  {renderSearchResults()}
                </Box>
              </Box>
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {MENUS.map(({ label, items }) => (
                <Accordion
                  key={label}
                  expanded={expandedAccordion === label}
                  onChange={() => setExpandedAccordion(expandedAccordion === label ? false : label)}
                  sx={{
                    bgcolor: '#fff',
                    color: '#000',
                    '&:before': { display: 'none' },
                    border: '1.5px solid #adacac',
                    boxShadow: 'none',
                    margin: 0,
                    '&:not(:last-child)': {
                      borderBottom: 'none',
                    },
                  }}
                >
                  <AccordionSummary
                    expandIcon={
                      <span style={{ fontSize: 24, width: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {expandedAccordion === label ? '-' : '+'}
                      </span>
                    }
                    sx={{
                      minHeight: 0,
                      padding: '0 16px',
                      '& .MuiAccordionSummary-content': {
                        margin: 0,
                        padding: '12px 0 12px 8px',
                        alignItems: 'center',
                      },
                    }}
                  >
                    <Typography sx={{ fontFamily: '"Montserrat", sans-serif ', fontSize: '1.1rem', color: '#000', pl: 1 }}>
                      {label}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0, m: 0 }}>
                    {items.map((item, index) => (
                      <Box
                        key={item}
                        onClick={() => {
                          router.push(`/categories/${slug(label)}/${slug(item)}`);
                          setMobileMenuOpen(false);
                        }}
                        sx={{
                          p: '10px 0 10px 24px',
                          borderTop: index === 0 ? 'none' : '1px solid #adacac',
                          cursor: 'pointer',
                          '&:hover': { bgcolor: '#f5f5f5' },
                          margin: 0,
                        }}
                      >
                        <Typography sx={{ color: '#000', fontFamily: '"Montserrat", sans-serif ', fontSize: '1rem' }}>
                          {item}
                        </Typography>
                      </Box>
                    ))}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          </Box>
        </Drawer>
        <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      </header>

      {/* Search Drawer - Desktop - Now functional */}
      {!isMobile && (
        <Drawer
          anchor="right"
          open={searchDrawerOpen}
          onClose={handleSearchDrawerToggle}
          sx={{
            '& .MuiDrawer-paper': {
              width: '400px',
              bgcolor: '#fff',
              padding: 3,
            },
          }}
        >
          <Box>
            {/* Search Bar at the top - Now functional */}
            <TextField
              fullWidth
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              variant="outlined"
              autoFocus
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#666' }} />
                  </InputAdornment>
                ),
                endAdornment: search && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearch('')}>
                      <CloseIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Divider sx={{ mb: 2 }} />

            {/* Search Results */}
            <Box sx={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
              {renderSearchResults()}
              {!search.trim() && (
                <Box sx={{ textAlign: 'center', mt: 8 }}>
                  <SearchIcon sx={{ fontSize: 60, color: '#ddd', mb: 2 }} />
                  <Typography color="text.secondary">
                    Start typing to search products
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Drawer>
      )}
    </>
  );
}
