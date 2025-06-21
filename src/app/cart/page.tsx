'use client'
import React from 'react'
import CartPage from '../components/cart'
import { useSearchParams } from 'next/navigation'

const Cart = () => {
  const searchParams = useSearchParams()
  const buyNowProductId = searchParams.get('buyNow')

  return (
    <div style={{
      backgroundColor: '#fff',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <CartPage buyNowProductId={buyNowProductId} />
    </div>
  )
}

export default function CartPageWithSuspense() {
  return (
    <React.Suspense>
      <Cart />
    </React.Suspense>
  )
}
