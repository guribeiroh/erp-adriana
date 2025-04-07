import React, { useState, useEffect, useRef } from 'react';
import { MinusCircle, PlusCircle, Trash2, Edit, Tag, Percent, DollarSign, Check, X } from 'lucide-react';
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
  const [discountType, setDiscountType] = useState<'value' | 'percentage'>('value');
  const [percentageValue, setPercentageValue] = useState('0');
  const discountContainerRef = useRef<HTMLDivElement>(null);
  
  const itemPrice = item.book.selling_price;
  const itemTotal = (itemPrice * item.quantity) - item.discount;
  const maxDiscount = itemPrice * item.quantity;
  
  // Quando o item.discount mudar, atualize o estado local
  useEffect(() => {
    setDiscountValue(item.discount.toString());
    // Calcular o percentual aproximado se houver desconto
    if (item.discount > 0 && maxDiscount > 0) {
      const percentage = (item.discount / maxDiscount) * 100;
      setPercentageValue(percentage.toFixed(1));
    } else {
      setPercentageValue('0');
    }
  }, [item.discount, maxDiscount]);

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.,]/g, '');
    
    if (discountType === 'value') {
      setDiscountValue(value);
    } else {
      setPercentageValue(value);
      // Calcular o valor do desconto baseado na porcentagem
      const percentage = parseFloat(value.replace(',', '.')) || 0;
      const safePercentage = Math.min(percentage, 100);
      const calculatedDiscount = (maxDiscount * safePercentage) / 100;
      setDiscountValue(calculatedDiscount.toFixed(2));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const finalDiscount = calculateFinalDiscount();
      onUpdateDiscount(item.book.id, finalDiscount);
      setDiscountValue(finalDiscount.toString());
      setIsEditingDiscount(false);
    } else if (e.key === 'Escape') {
      setIsEditingDiscount(false);
      setDiscountValue(item.discount.toString());
    }
  };
  
  const calculateFinalDiscount = (): number => {
    let finalDiscount = 0;
    
    if (discountType === 'value') {
      const numValue = parseFloat(discountValue.replace(',', '.')) || 0;
      finalDiscount = Math.min(numValue, maxDiscount);
    } else {
      const percentage = parseFloat(percentageValue.replace(',', '.')) || 0;
      const safePercentage = Math.min(percentage, 100);
      finalDiscount = (maxDiscount * safePercentage) / 100;
    }
    
    return finalDiscount;
  };

  const handleSaveDiscount = () => {
    const finalDiscount = calculateFinalDiscount();
    onUpdateDiscount(item.book.id, finalDiscount);
    setDiscountValue(finalDiscount.toString());
    setIsEditingDiscount(false);
  };

  const handleCancelDiscount = () => {
    setIsEditingDiscount(false);
    setDiscountValue(item.discount.toString());
  };

  const toggleDiscountType = () => {
    if (discountType === 'value') {
      setDiscountType('percentage');
      // Converter valor para porcentagem
      if (maxDiscount > 0) {
        const currentDiscount = parseFloat(discountValue.replace(',', '.')) || 0;
        const percentage = (currentDiscount / maxDiscount) * 100;
        setPercentageValue(percentage.toFixed(1));
      }
    } else {
      setDiscountType('value');
    }
  };

  const discountPercentage = maxDiscount > 0 ? ((item.discount / maxDiscount) * 100).toFixed(1) : '0';
  const showDiscount = item.discount > 0 || isEditingDiscount;

  return (
    <div className="flex justify-between border-b pb-3 pt-3">
      <div className="flex-1">
        <h3 className="text-sm font-medium text-gray-900">{item.book.title}</h3>
        <p className="text-xs text-gray-500">{item.book.author}</p>
        <div className="mt-1 flex items-center">
          <button 
            onClick={() => onUpdateQuantity(item.book.id, item.quantity - 1)}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Diminuir quantidade"
          >
            <MinusCircle className="h-4 w-4" />
          </button>
          <span className="mx-2 w-8 text-center">{item.quantity}</span>
          <button 
            onClick={() => onUpdateQuantity(item.book.id, item.quantity + 1)}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Aumentar quantidade"
          >
            <PlusCircle className="h-4 w-4" />
          </button>
          <span className="ml-2 text-xs text-gray-500">
            x {formatCurrency(item.book.selling_price)}
          </span>
        </div>
        
        {/* Desconto */}
        <div className="mt-2">
          {!isEditingDiscount && !showDiscount ? (
            <button 
              onClick={() => setIsEditingDiscount(true)}
              className="flex items-center text-xs text-emerald-600 hover:text-emerald-700"
            >
              <Tag className="h-3 w-3 mr-1" />
              <span>Adicionar desconto</span>
            </button>
          ) : (
            <div className="flex flex-col space-y-1">
              <div className="flex items-center">
                <span className="text-xs text-gray-500 mr-2 w-14">Desconto:</span>
                
                {isEditingDiscount ? (
                  <div ref={discountContainerRef} className="flex flex-col space-y-2 w-full">
                    {/* Switch Toggle */}
                    <div className="flex items-center justify-between w-full">
                      <label className="inline-flex items-center cursor-pointer">
                        <span className={`mr-2 text-xs ${discountType === 'value' ? 'font-semibold text-emerald-600' : 'text-gray-500'}`}>
                          <DollarSign className="h-3 w-3 inline mr-0.5" />
                          R$
                        </span>
                        <div className="relative">
                          <input 
                            type="checkbox" 
                            value="" 
                            className="sr-only peer"
                            checked={discountType === 'percentage'}
                            onChange={toggleDiscountType}
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                        </div>
                        <span className={`ml-2 text-xs ${discountType === 'percentage' ? 'font-semibold text-emerald-600' : 'text-gray-500'}`}>
                          <Percent className="h-3 w-3 inline mr-0.5" />
                          %
                        </span>
                      </label>
                    </div>
                    
                    {/* Input de desconto */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                        {discountType === 'value' ? (
                          <DollarSign className="h-3 w-3 text-gray-500" />
                        ) : (
                          <Percent className="h-3 w-3 text-gray-500" />
                        )}
                      </div>
                      <input
                        type="text"
                        value={discountType === 'value' ? discountValue : percentageValue}
                        onChange={handleDiscountChange}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        className="w-full text-xs border border-gray-300 rounded-md px-6 py-1 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder={discountType === 'value' ? '0,00' : '0'}
                      />
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      {discountType === 'value' 
                        ? `Equivale a ${percentageValue}% de desconto`
                        : `Valor de ${formatCurrency(parseFloat(discountValue) || 0)}`}
                    </div>
                    
                    {/* Botões de Confirmar/Cancelar */}
                    <div className="flex justify-end space-x-2 mt-1">
                      <button
                        onClick={handleCancelDiscount}
                        className="p-1 rounded-full text-gray-500 hover:bg-gray-100"
                        aria-label="Cancelar desconto"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleSaveDiscount}
                        className="p-1 rounded-full text-emerald-600 hover:bg-emerald-50"
                        aria-label="Confirmar desconto"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span className="text-xs font-medium text-red-500 mr-2">
                      - {formatCurrency(item.discount)}
                    </span>
                    <span className="text-xs text-gray-500 mr-2">
                      ({discountPercentage}%)
                    </span>
                    <button 
                      onClick={() => setIsEditingDiscount(true)}
                      className="text-gray-400 hover:text-gray-600"
                      aria-label="Editar desconto"
                    >
                      <Edit className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-sm font-medium text-gray-900">
          {formatCurrency(itemTotal)}
        </span>
        {item.discount > 0 && (
          <span className="text-xs text-gray-500 line-through">
            {formatCurrency(item.book.selling_price * item.quantity)}
          </span>
        )}
        <button 
          onClick={() => onRemoveItem(item.book.id)}
          className="mt-2 text-red-500 hover:text-red-700"
          aria-label="Remover item"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
} 