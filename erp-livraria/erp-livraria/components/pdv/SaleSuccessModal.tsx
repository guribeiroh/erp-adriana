import React from 'react';
import { CheckCircle, Printer, X } from 'lucide-react';
import { useCart } from '@/lib/context/CartContext';
import { formatCurrency, formatDateTime } from '@/lib/utils/format';

type SaleSuccessModalProps = {
  isOpen: boolean;
  onClose: () => void;
  saleId: string;
  paymentMethod: string;
};

export default function SaleSuccessModal({
  isOpen,
  onClose,
  saleId,
  paymentMethod
}: SaleSuccessModalProps) {
  const { items, subtotal, totalDiscount, total, customer } = useCart();

  if (!isOpen) return null;

  const getPaymentMethodName = (method: string) => {
    const methods: Record<string, string> = {
      'cash': 'Dinheiro',
      'credit_card': 'Cartão de Crédito',
      'debit_card': 'Cartão de Débito',
      'pix': 'PIX',
      'transfer': 'Transferência'
    };
    
    return methods[method] || method;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Venda Finalizada</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col items-center mb-6">
          <div className="bg-green-100 p-3 rounded-full">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mt-2">Venda realizada com sucesso!</h3>
          <p className="text-sm text-gray-600">Código da venda: {saleId}</p>
        </div>

        <div className="mb-4 border-t border-b py-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Data/Hora:</span>
            <span className="text-gray-900">{formatDateTime(new Date())}</span>
          </div>
          
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Forma de Pagamento:</span>
            <span className="text-gray-900">{getPaymentMethodName(paymentMethod)}</span>
          </div>
          
          {customer && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Cliente:</span>
              <span className="text-gray-900">{customer.name}</span>
            </div>
          )}
        </div>

        <div className="mb-6">
          <h4 className="font-medium text-sm text-gray-700 mb-2">Itens:</h4>
          
          <div className="max-h-40 overflow-y-auto mb-3">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm py-1 border-b border-gray-100">
                <div>
                  <span className="text-gray-800">{item.quantity}x </span>
                  <span className="text-gray-600">{item.book.title}</span>
                </div>
                <span className="text-gray-900">{formatCurrency((item.book.selling_price * item.quantity) - item.discount)}</span>
              </div>
            ))}
          </div>
          
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="text-gray-900">{formatCurrency(subtotal)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Desconto:</span>
              <span className="text-red-600">-{formatCurrency(totalDiscount)}</span>
            </div>
            
            <div className="flex justify-between text-base font-semibold pt-1 border-t">
              <span>Total:</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
          >
            Fechar
          </button>
          
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimir comprovante</span>
          </button>
        </div>
      </div>
    </div>
  );
} 