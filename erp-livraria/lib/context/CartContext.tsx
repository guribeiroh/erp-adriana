import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Book, Customer } from '@/models/database.types';

export type CartItem = {
  book: Book;
  quantity: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
};

type CartContextType = {
  items: CartItem[];
  customer: Customer | null;
  addItem: (book: Book) => void;
  removeItem: (bookId: string) => void;
  updateQuantity: (bookId: string, quantity: number) => void;
  updateDiscount: (bookId: string, discount: number, discountType: 'percentage' | 'fixed') => void;
  clearCart: () => void;
  setCustomer: (customer: Customer | null) => void;
  subtotal: number;
  totalDiscount: number;
  total: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [subtotal, setSubtotal] = useState(0);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [total, setTotal] = useState(0);

  // Recalcular totais quando os itens mudarem
  useEffect(() => {
    const newSubtotal = items.reduce((sum, item) => sum + (item.book.selling_price * item.quantity), 0);
    const newTotalDiscount = items.reduce((sum, item) => {
      if (item.discountType === 'percentage') {
        return sum + ((item.book.selling_price * item.quantity) * (item.discount / 100));
      }
      return sum + item.discount;
    }, 0);
    const newTotal = newSubtotal - newTotalDiscount;

    setSubtotal(newSubtotal);
    setTotalDiscount(newTotalDiscount);
    setTotal(newTotal);
  }, [items]);

  // Adicionar item ao carrinho
  const addItem = (book: Book) => {
    const existingItem = items.find(item => item.book.id === book.id);

    if (existingItem) {
      updateQuantity(book.id, existingItem.quantity + 1);
    } else {
      setItems([...items, { book, quantity: 1, discount: 0, discountType: 'fixed' }]);
    }
  };

  // Remover item do carrinho
  const removeItem = (bookId: string) => {
    setItems(items.filter(item => item.book.id !== bookId));
  };

  // Atualizar quantidade de um item
  const updateQuantity = (bookId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(bookId);
      return;
    }

    setItems(
      items.map(item => 
        item.book.id === bookId 
          ? { ...item, quantity } 
          : item
      )
    );
  };

  // Atualizar desconto de um item
  const updateDiscount = (bookId: string, discount: number, discountType: 'percentage' | 'fixed') => {
    setItems(
      items.map(item => 
        item.book.id === bookId 
          ? { ...item, discount, discountType } 
          : item
      )
    );
  };

  // Limpar o carrinho
  const clearCart = () => {
    setItems([]);
    setCustomer(null);
  };

  return (
    <CartContext.Provider value={{
      items,
      customer,
      addItem,
      removeItem,
      updateQuantity,
      updateDiscount,
      clearCart,
      setCustomer,
      subtotal,
      totalDiscount,
      total
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 