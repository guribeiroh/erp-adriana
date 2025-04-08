import React, { useState } from 'react';
import { MinusCircle, PlusCircle, Trash2, Edit, Percent } from 'lucide-react';
import { CartItem as CartItemType } from '@/lib/context/CartContext';
import { formatCurrency } from '@/lib/utils/format';

type CartItemProps = {
  item: CartItemType;
  onUpdateQuantity: (bookId: string, quantity: number) => void;
  onRemoveItem: (bookId: string) => void;
  onUpdateDiscount: (bookId: string, discount: number, discountType: 'percentage' | 'fixed') => void;
};

export default function CartItem({
  item,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateDiscount
}: CartItemProps) {
  const [isEditingDiscount, setIsEditingDiscount] = useState(false);
  const [discountValue, setDiscountValue] = useState(item.discount.toString());
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>(item.discountType);

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.,]/g, '');
    setDiscountValue(value);
  };

  const handleDiscountBlur = () => {
    const numValue = parseFloat(discountValue.replace(',', '.')) || 0;
    let validDiscount = numValue;
    
    if (discountType === 'percentage') {
      // Limitar porcentagem a 100%
      validDiscount = Math.min(numValue, 100);
    } else {
      // Limitar desconto em reais ao valor total do item
      const maxDiscount = item.book.selling_price * item.quantity;
      validDiscount = Math.min(numValue, maxDiscount);
    }
    
    onUpdateDiscount(item.book.id, validDiscount, discountType);
    setDiscountValue(validDiscount.toString());
    setIsEditingDiscount(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleDiscountBlur();
    } else if (e.key === 'Escape') {
      setIsEditingDiscount(false);
      setDiscountValue(item.discount.toString());
      setDiscountType(item.discountType);
    }
  };

  const toggleDiscountType = (e: React.MouseEvent) => {
    e.preventDefault(); // Previne a propagação do evento
    e.stopPropagation(); // Garante que o evento não se propague
    
    const newType = discountType === 'fixed' ? 'percentage' : 'fixed';
    setDiscountType(newType);
    
    // Converter o valor atual para o novo tipo
    const currentValue = parseFloat(discountValue.replace(',', '.')) || 0;
    let newValue = currentValue;
    
    if (newType === 'percentage') {
      // Converter de reais para porcentagem
      newValue = (currentValue / (item.book.selling_price * item.quantity)) * 100;
    } else {
      // Converter de porcentagem para reais
      newValue = (currentValue / 100) * (item.book.selling_price * item.quantity);
    }
    
    setDiscountValue(newValue.toFixed(2));
    onUpdateDiscount(item.book.id, newValue, newType);
  };

  const calculatedDiscount = item.discountType === 'percentage'
    ? (item.book.selling_price * item.quantity) * (item.discount / 100)
    : item.discount;

  const itemTotal = (item.book.selling_price * item.quantity) - calculatedDiscount;

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
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-gray-500">Desconto:</span>
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
            {isEditingDiscount ? (
              <>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={discountValue}
                    onChange={handleDiscountChange}
                    onBlur={handleDiscountBlur}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="w-20 text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                    placeholder="0,00"
                  />
                  <label className="flex items-center gap-2 select-none">
                    <span className="text-xs font-medium text-gray-600">R$</span>
                    <div 
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                        discountType === 'percentage' ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                      onClick={toggleDiscountType}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          discountType === 'percentage' ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600">%</span>
                  </label>
                </div>
              </>
            ) : (
              <>
                <span className="text-sm font-medium text-red-600">
                  {item.discount > 0 
                    ? item.discountType === 'percentage'
                      ? `${item.discount}%`
                      : `- ${formatCurrency(item.discount)}`
                    : 'R$ 0,00'
                  }
                </span>
                <button 
                  onClick={() => setIsEditingDiscount(true)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <Edit className="h-3 w-3" />
                </button>
              </>
            )}
          </div>
          {item.discount > 0 && (
            <span className="text-xs text-red-500">
              (-{formatCurrency(calculatedDiscount)})
            </span>
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