import React, { useState } from 'react';
import { MinusCircle, PlusCircle, Trash2, Edit } from 'lucide-react';
import { CartItem as CartItemType } from '@/lib/context/CartContext';
import { formatCurrency } from '@/lib/utils/format';

type CartItemProps = {
  item: CartItemType;
  onUpdateQuantity: (bookId: string, quantity: number) => void;
  onRemoveItem: (bookId: string) => void;
  onUpdateDiscount: (bookId: string, discount: number) => void;
};

export default function CartItem({
  item,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateDiscount
}: CartItemProps) {
  const [isEditingDiscount, setIsEditingDiscount] = useState(false);
  const [discountValue, setDiscountValue] = useState(item.discount.toString());

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.,]/g, '');
    setDiscountValue(value);
  };

  const handleDiscountBlur = () => {
    const numValue = parseFloat(discountValue.replace(',', '.')) || 0;
    // Limitar o desconto ao valor total do item
    const maxDiscount = item.book.selling_price * item.quantity;
    const validDiscount = Math.min(numValue, maxDiscount);
    
    onUpdateDiscount(item.book.id, validDiscount);
    setDiscountValue(validDiscount.toString());
    setIsEditingDiscount(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleDiscountBlur();
    } else if (e.key === 'Escape') {
      setIsEditingDiscount(false);
      setDiscountValue(item.discount.toString());
    }
  };

  const itemTotal = (item.book.selling_price * item.quantity) - item.discount;

  return (
    <div className="flex justify-between border-b pb-3 pt-3">
      <div className="flex-1">
        <h3 className="text-sm font-medium text-gray-900">{item.book.title}</h3>
        <p className="text-xs text-gray-500">{item.book.author}</p>
        <div className="mt-1 flex items-center">
          <button 
            onClick={() => onUpdateQuantity(item.book.id, item.quantity - 1)}
            className="text-gray-500 hover:text-gray-700"
          >
            <MinusCircle className="h-4 w-4" />
          </button>
          <span className="mx-2 w-8 text-center">{item.quantity}</span>
          <button 
            onClick={() => onUpdateQuantity(item.book.id, item.quantity + 1)}
            className="text-gray-500 hover:text-gray-700"
          >
            <PlusCircle className="h-4 w-4" />
          </button>
          <span className="ml-2 text-xs text-gray-500">
            x {formatCurrency(item.book.selling_price)}
          </span>
        </div>
        
        {/* Desconto */}
        <div className="mt-1 flex items-center">
          <span className="text-xs text-gray-500 mr-1">Desconto:</span>
          {isEditingDiscount ? (
            <input
              type="text"
              value={discountValue}
              onChange={handleDiscountChange}
              onBlur={handleDiscountBlur}
              onKeyDown={handleKeyDown}
              autoFocus
              className="w-20 text-xs border border-gray-300 rounded px-1 py-0.5"
              placeholder="0,00"
            />
          ) : (
            <>
              <span className="text-xs text-red-500 mr-1">
                {item.discount > 0 ? `- ${formatCurrency(item.discount)}` : 'R$ 0,00'}
              </span>
              <button 
                onClick={() => setIsEditingDiscount(true)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Edit className="h-3 w-3" />
              </button>
            </>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-sm font-medium text-gray-900">
          {formatCurrency(itemTotal)}
        </span>
        <button 
          onClick={() => onRemoveItem(item.book.id)}
          className="mt-2 text-red-500 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
} 