"use client";

import React from 'react';
import { CartProvider } from '@/lib/context/CartContext';

export default function PDVLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
    </CartProvider>
  );
} 