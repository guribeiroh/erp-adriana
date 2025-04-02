"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';

type PDVButtonProps = {
  className?: string;
  variant?: 'primary' | 'floating';
};

export default function PDVButton({ 
  className = '', 
  variant = 'primary' 
}: PDVButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push('/dashboard/pdv');
  };

  if (variant === 'floating') {
    return (
      <button
        onClick={handleClick}
        className={`fixed bottom-6 right-6 rounded-full bg-primary-600 p-4 text-white shadow-lg hover:bg-primary-700 transition-all focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 ${className}`}
        title="Abrir PDV"
      >
        <ShoppingCart className="h-6 w-6" />
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 transition-all ${className}`}
    >
      <ShoppingCart className="h-5 w-5" />
      <span>PDV</span>
    </button>
  );
} 