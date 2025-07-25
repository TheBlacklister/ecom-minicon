'use client';

import { useMemo, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  Box,
  Typography,
  List,
  ListItem,
  FormControlLabel,
  Checkbox,
  Divider,
  Select,
  MenuItem,
  Button,
  IconButton,
  Drawer,
  useMediaQuery,
  useTheme,
  Paper,
  ListItemButton,
  ListItemText,
  Chip,
} from '@mui/material';
import { GridLegacy as Grid } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import SortIcon from '@mui/icons-material/Sort';
import FilterListIcon from '@mui/icons-material/FilterList';

/* -------------------------------------------------------------------------- */
/*                             Product utilities                              */
/* -------------------------------------------------------------------------- */
import type { Product } from '@/types';
import { ProductCard } from '@/app/components/productCard';
import { useAuth } from '@/app/components/AuthProvider';
import { supabase } from '@/lib/supabaseClient';

// Define types for API responses
interface WishlistItem {
  product: Product;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function CataloguePage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const { user } = useAuth();
  const [wishedIds, setWishedIds] = useState<Set<number>>(new Set());
  const pathname = usePathname();
  const catSegments = useMemo(() => pathname.split('/').slice(2), [pathname]);
  const [sortOpt, setSortOpt] = useState<string>('');
  const [sortDrawerOpen, setSortDrawerOpen] = useState(false);
  
  // Filter states
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedSizes, setSelectedSizes] = useState<Set<string>>(new Set());
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        setAllProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    }
    fetchProducts();
  }, []);
  console.log("ALL products",allProducts)

  useEffect(() => {
    if (!user) {
      setWishedIds(new Set());
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      const headers: Record<string, string> = {};
      if (session) headers['Authorization'] = `Bearer ${session.access_token}`;
      fetch('/api/wishlist', { headers })
        .then(res => res.ok ? res.json() : [])
        .then((data: WishlistItem[]) => setWishedIds(new Set(data.map((w) => w.product.id))));
      fetch('/api/cart', { headers })
        .then(res => res.ok ? res.json() : [])
        .then((data: CartItem[]) => {
          const map = new Map<number, number>();
          data.forEach((c) => map.set(c.product.id, c.quantity));
        });
    });
  }, [user]);

  const filters = useMemo(() => ({
    categories: Array.from(new Set(allProducts.map(p => p.category).flat())).sort(),
    size: Array.from(new Set(allProducts.flatMap(p => p.available_sizes))).sort(),
    colors: Array.from(new Set(allProducts.flatMap(p => p.available_colors))).sort(),
  }), [allProducts]);

  /* ---------------- Filter products by label / item ----------------------- */
  const filteredProducts = useMemo(() => {
    let filtered = allProducts;
  
    // Transform catSegments: replace "-" with "_" and convert to lowercase
    const transformedSegment = catSegments.map(seg => seg.replace(/-/g, '_').toLowerCase());
    const transformedSegments = transformedSegment.map(seg => seg.replace(/'/g, ''));
  
    console.log("Transformed catSegments:", transformedSegments);
  
    if (transformedSegments.length > 0) {
      const [labelSegment, valueSegment] = transformedSegments;
      const label = labelSegment;
      const value = valueSegment || '';
  
      if (label === 'category' && value) {
        filtered = filtered.filter((p) => {
          const categories = Array.isArray(p.category) ? p.category : (p.category ? [p.category] : []);
          const categoryMatches = categories.some(cat => {
            const match = cat.toLowerCase() === value;
            console.log(`Comparing product category '${cat.toLowerCase()}' with URL value '${value}':`, match);
            return match;
          });
          return categoryMatches;
        });
      } else if (label === 'collections' && value) {
        filtered = filtered.filter((p) => {
          const collections = Array.isArray(p.collections) ? p.collections : (p.collections ? [p.collections] : []);
          const collectionMatches = collections.some(col => {
            const match = col.toLowerCase() === value;
            console.log(`Comparing product collection '${col.toLowerCase()}' with URL value '${value}':`, match);
            return match;
          });
          return collectionMatches;
        });
      } else if (label === 'shop_by') {
        console.log("No filtering applied for 'shop_by'");
      }
    } else {
      console.log("No URL filtering segment detected.");
    }
  
    if (selectedCategories.size > 0) {
      filtered = filtered.filter(p => 
        (Array.isArray(p.category) ? p.category : [p.category])
          .some(cat => selectedCategories.has(cat))
      );
    }
    if (selectedSizes.size > 0) {
      filtered = filtered.filter(p => 
        p.available_sizes.some(size => selectedSizes.has(size))
      );
    }
    if (selectedColors.size > 0) {
      filtered = filtered.filter(p => 
        p.available_colors.some(color => selectedColors.has(color))
      );
    }
  
    console.log("Final filtered products:", filtered);
    return filtered;
  }, [catSegments, allProducts, selectedCategories, selectedSizes, selectedColors]);
  
  
  /* ---------------- Optional client-side sorting -------------------------- */
  const products = useMemo(() => {
    const list = [...filteredProducts];
    switch (sortOpt) {
      case 'new': return list.reverse();           // dummy "newest first"
      case 'price_low': return list.sort((a, b) => a.price_after - b.price_after);
      case 'price_high': return list.sort((a, b) => b.price_after - a.price_after);
      default: return list;
    }
  }, [filteredProducts, sortOpt]);

  /* ---------------- Human-readable heading -------------------------------- */
  const heading = useMemo(() => {
    const baseHeading = catSegments.length === 0
      ? 'All Products'
      : catSegments.join(' • ').replace(/-/g, ' ');
    
    const activeFiltersCount = selectedCategories.size + selectedSizes.size + selectedColors.size;
    
    if (activeFiltersCount > 0) {
      return `${baseHeading} (${activeFiltersCount} filter${activeFiltersCount > 1 ? 's' : ''} applied)`;
    }
    
    return baseHeading;
  }, [catSegments, selectedCategories, selectedSizes, selectedColors]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Filter handlers
  const handleCategoryChange = (category: string, checked: boolean) => {
    const newCategories = new Set(selectedCategories);
    if (checked) {
      newCategories.add(category);
    } else {
      newCategories.delete(category);
    }
    setSelectedCategories(newCategories);
  };

  const handleSizeChange = (size: string) => {
    const newSizes = new Set(selectedSizes);
    if (newSizes.has(size)) {
      newSizes.delete(size);
    } else {
      newSizes.add(size);
    }
    setSelectedSizes(newSizes);
  };

  const handleColorChange = (color: string) => {
    const newColors = new Set(selectedColors);
    if (newColors.has(color)) {
      newColors.delete(color);
    } else {
      newColors.add(color);
    }
    setSelectedColors(newColors);
  };

  const clearAllFilters = () => {
    setSelectedCategories(new Set());
    setSelectedSizes(new Set());
    setSelectedColors(new Set());
  };

  const handleSortChange = (value: string) => {
    setSortOpt(value);
    if (isMobile) {
      setSortDrawerOpen(false);
    }
  };

  const getSortLabel = (value: string) => {
    switch (value) {
      case 'new': return 'Newest First';
      case 'price_low': return 'Price — Low to High';
      case 'price_high': return 'Price — High to Low';
      default: return 'Sort by';
    }
  };

  const sortOptions = [
    { value: 'new', label: 'Newest First', icon: '🆕' },
    { value: 'price_low', label: 'Price — Low to High', icon: '💰' },
    { value: 'price_high', label: 'Price — High to Low', icon: '💎' },
  ];

  const drawer = (
    <Box sx={{ width: { xs: '100%', sm: 260 }, p: 2, overflowX: 'hidden' }}>
    
      {/* Category filter */}
      <Typography color='black' variant="subtitle1" fontWeight={700} mb={1} sx={{ fontFamily: '"Montserrat", sans-serif' }}>
        CATEGORIES
      </Typography>

      <List dense sx={{ maxHeight: 180, overflowY: 'auto', color: 'black' }}>
        {filters.categories.map((c) => (
          <ListItem key={c} disableGutters>
            <FormControlLabel
              control={
                <Checkbox 
                  size="small" 
                  sx={{ color: 'black' }}
                  checked={selectedCategories.has(c)}
                  onChange={(e) => handleCategoryChange(c, e.target.checked)}
                />
              }
              label={<Typography variant="body2" style={{color:'black',fontFamily: '"Montserrat", sans-serif'}}>{c}</Typography>}
            />
          </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 2, color: 'black' }} />

      {/* Size filter */}
      <Typography color='black' variant="subtitle1" fontWeight={700} mb={1} sx={{ fontFamily: '"Montserrat", sans-serif' }}>
        SIZE
      </Typography>
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 1,
        maxWidth: '100%',
        overflowX: 'hidden'
      }}>
        {filters.size.map((s) => (
          <Button
            key={s}
            onClick={() => handleSizeChange(s)}
            sx={{
              border: '1px solid #000',
              borderRadius: 1,
              px: 1.5,
              py: 0.5,
              fontSize: 14,
              cursor: 'pointer',
              color: selectedSizes.has(s) ? 'white' : 'black',
              backgroundColor: selectedSizes.has(s) ? 'black' : '#fff',
              '&:hover': { 
                backgroundColor: selectedSizes.has(s) ? '#333' : '#f5f5f5' 
              },
              fontFamily: '"Montserrat", sans-serif',
              textTransform: 'none',
              minWidth: 'auto',
              flexShrink: 0
            }}
          >
            {s}
          </Button>
        ))}
      </Box>

      <Divider sx={{ my: 2, color: 'black' }} />

      {/* Color filter */}
      <Typography color='black' variant="subtitle1" fontWeight={700} mb={1} sx={{ fontFamily: '"Montserrat", sans-serif' }}>
        COLORS
      </Typography>
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 1,
        maxWidth: '100%',
        overflowX: 'hidden'
      }}>
        {filters.colors.map((color) => (
          <Button
            key={color}
            onClick={() => handleColorChange(color)}
            sx={{
              border: '1px solid #000',
              borderRadius: 1,
              px: 1.5,
              py: 0.5,
              fontSize: 12,
              cursor: 'pointer',
              color: selectedColors.has(color) ? 'white' : 'black',
              backgroundColor: selectedColors.has(color) ? 'black' : '#fff',
              '&:hover': { 
                backgroundColor: selectedColors.has(color) ? '#333' : '#f5f5f5' 
              },
              fontFamily: '"Montserrat", sans-serif',
              textTransform: 'none',
              minWidth: 'auto',
              flexShrink: 0
            }}
          >
            {color}
          </Button>
        ))}
      </Box>
      <Divider sx={{ my: 2, color: 'black' }} />
        {/* Clear filters button */}
        {(selectedCategories.size > 0 || selectedSizes.size > 0 || selectedColors.size > 0) && (
        <Box sx={{ mb: 2 }}>
          <Button
            onClick={clearAllFilters}
            sx={{
              border: '1px solid #000',
              borderRadius: 1,
              px: 2,
              py: 0.5,
              fontSize: 12,
              color: 'black',
              backgroundColor: '#fff',
              '&:hover': { backgroundColor: '#f5f5f5' },
              fontFamily: '"Montserrat", sans-serif',
              textTransform: 'none'
            }}
          >
            Clear All Filters
          </Button>
        </Box>
      )}

    </Box>
  );

  // Mobile sort drawer
  const mobileSortDrawer = (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6" fontWeight={600} sx={{ fontFamily: '"Montserrat", sans-serif', color: 'black' }}>
          Sort Products
        </Typography>
        <IconButton onClick={() => setSortDrawerOpen(false)}>
          <Typography sx={{ fontSize: 24, color: 'black' }}>×</Typography>
        </IconButton>
      </Box>
      
      <List>
        <ListItem disablePadding sx={{ mb: 1 }}>
          <ListItemButton
            onClick={() => handleSortChange('')}
            sx={{
              borderRadius: 2,
              border: sortOpt === '' ? '2px solid #000' : '1px solid #e0e0e0',
              backgroundColor: sortOpt === '' ? '#f8f8f8' : 'transparent',
              '&:hover': {
                backgroundColor: '#f5f5f5',
                border: '2px solid #000',
              },
            }}
          >
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1" sx={{ fontFamily: '"Montserrat", sans-serif', fontWeight: sortOpt === '' ? 600 : 400 }}>
                    Sort by
                  </Typography>
                  {sortOpt === '' && <Chip label="Default" size="small" sx={{ fontSize: 10, height: 20 }} />}
                </Box>
              }
            />
          </ListItemButton>
        </ListItem>
        
        {sortOptions.map((option) => (
          <ListItem key={option.value} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              onClick={() => handleSortChange(option.value)}
              sx={{
                borderRadius: 2,
                border: sortOpt === option.value ? '2px solid #000' : '1px solid #e0e0e0',
                backgroundColor: sortOpt === option.value ? '#f8f8f8' : 'transparent',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                  border: '2px solid #000',
                },
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1" sx={{ fontFamily: '"Montserrat", sans-serif', fontWeight: sortOpt === option.value ? 600 : 400 }}>
                      {option.label}
                    </Typography>
                    {sortOpt === option.value && <Chip label="Selected" size="small" sx={{ fontSize: 10, height: 20 }} />}
                  </Box>
                }
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box component="section" sx={{ 
      display: 'flex', 
      flexDirection: { xs: 'column', md: 'row' }, 
      px: { xs: 1, sm: 2 }, 
      py: 4, 
      gap: 4, 
      backgroundColor: '#fff',
      overflowX: 'hidden',
      maxWidth: '100vw'
    }}>
      {/* Mobile drawer toggle */}
      {isMobile && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, color: 'black' }}
          >
            <FilterListIcon />
          </IconButton>
          <Typography color='black' variant="h6" fontWeight={600} sx={{ fontFamily: '"Montserrat", sans-serif' }}>
            {heading} — {products.length} items
          </Typography>
        </Box>
      )}

      {/* Sidebar/Drawer */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          anchor="left"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 260 },
          }}
        >
          {drawer}
        </Drawer>
      ) : (
        <Box sx={{ 
          width: 260, 
          flexShrink: 0, 
          overflowY: 'auto', 
          overflowX: 'hidden',
          backgroundColor: '#fff', 
          color: 'black', 
          borderRight: '1px solid #eee' 
        }}>
          {drawer}
        </Box>
      )}

      {/* Main content */}
      <Box sx={{ flex: 1, minWidth: 0, overflowX: 'hidden' }}>
        {/* Top bar - only show on desktop */}
        {!isMobile && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography color='black' variant="h6" fontWeight={600} sx={{ fontFamily: '"Montserrat", sans-serif' }}>
              {heading} — {products.length} items
            </Typography>

            {/* Premium Desktop Sort Select */}
            <Paper
              elevation={0}
              sx={{
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                overflow: 'hidden',
                '&:hover': {
                  border: '1px solid #000',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <Select
                size="small"
                displayEmpty
                value={sortOpt}
                onChange={(e) => setSortOpt(e.target.value)}
                IconComponent={KeyboardArrowDownIcon}
                sx={{
                  minWidth: 200,
                  color: 'black',
                  backgroundColor: 'transparent',
                  fontFamily: '"Montserrat", sans-serif',
                  fontWeight: 500,
                  '& .MuiSelect-select': {
                    py: 1.5,
                    px: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  },
                  '& .MuiSelect-icon': { 
                    color: 'black',
                    transition: 'transform 0.2s ease-in-out',
                  },
                  '&.Mui-focused .MuiSelect-icon': {
                    transform: 'rotate(180deg)',
                  },
                  '& fieldset': { border: 'none' },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      mt: 1,
                      borderRadius: 2,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                      border: '1px solid #e0e0e0',
                      overflow: 'hidden',
                    },
                  },
                }}
              >
                <MenuItem
                  value=""
                  sx={{
                    py: 1.5,
                    px: 2,
                    fontFamily: '"Montserrat", sans-serif',
                    '&.Mui-selected': {
                      backgroundColor: '#f8f8f8',
                      fontWeight: 600,
                    },
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SortIcon sx={{ fontSize: 18, color: '#666' }} />
                    <Typography>Sort by</Typography>
                  </Box>
                </MenuItem>
                {sortOptions.map((option) => (
                  <MenuItem
                    key={option.value}
                    value={option.value}
                    sx={{
                      py: 1.5,
                      px: 2,
                      fontFamily: '"Montserrat", sans-serif',
                      '&.Mui-selected': {
                        backgroundColor: '#f8f8f8',
                        fontWeight: 600,
                      },
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography>{option.label}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </Paper>
          </Box>
        )}

        {/* Mobile sorting - show below the header */}
        {isMobile && (
          <Box sx={{ mb: 2 }}>
            <Paper
              elevation={0}
              sx={{
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                overflow: 'hidden',
                '&:hover': {
                  border: '1px solid #000',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <Button
                fullWidth
                onClick={() => setSortDrawerOpen(true)}
                sx={{
                  py: 1.5,
                  px: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: 'black',
                  backgroundColor: 'transparent',
                  fontFamily: '"Montserrat", sans-serif',
                  fontWeight: 500,
                  textTransform: 'none',
                  border: 'none',
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SortIcon sx={{ fontSize: 18, color: '#666' }} />
                  <Typography>{getSortLabel(sortOpt)}</Typography>
                </Box>
                <KeyboardArrowDownIcon sx={{ color: '#666' }} />
              </Button>
            </Paper>
          </Box>
        )}

        {/* Product cards */}
        <Grid container spacing={{ xs: 1, sm: 2, md: 3 }}>
          {products.map((p) => (
            <Grid item xs={6} sm={4} md={3} key={p.id}>
              <ProductCard
                product={p}
                initialIsWished={wishedIds.has(p.id)}
              />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Mobile Sort Drawer */}
      <Drawer
        anchor="bottom"
        open={sortDrawerOpen}
        onClose={() => setSortDrawerOpen(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '70vh',
          },
        }}
      >
        {mobileSortDrawer}
      </Drawer>
    </Box>
  );
}