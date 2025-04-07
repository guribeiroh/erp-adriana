import React, { useState } from 'react';
import { X, CreditCard, Banknote, QrCode, CheckCircle, PercentCircle } from 'lucide-react';
import { useCart } from '@/lib/context/CartContext';
import { toast } from 'react-hot-toast';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onConfirmPayment: (method: 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'transfer', generalDiscount?: number) => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  total,
  onConfirmPayment
}: PaymentModalProps) {
  const { subtotal, totalDiscount } = useCart();
  const [selectedMethod, setSelectedMethod] = useState<'cash' | 'credit_card' | 'debit_card' | 'pix' | 'transfer'>('credit_card');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [generalDiscount, setGeneralDiscount] = useState<string>('');
  const [discountType, setDiscountType] = useState<'value' | 'percentage'>('value');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirmPayment = () => {
    if (selectedMethod === 'cash' && parseAmount(cashReceived) < finalTotal) {
      toast.error('O valor em dinheiro deve ser maior ou igual ao total da venda');
      return;
    }
    
    setLoading(true);
    
    // Calcular o desconto geral
    const discountAmount = calculateGeneralDiscount();
    
    // Simular um leve atraso para melhor experiência de usuário
    setTimeout(() => {
      onConfirmPayment(selectedMethod, discountAmount);
      setLoading(false);
    }, 500);
  };

  const handleCashAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.,]/g, '');
    setCashReceived(value);
  };

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.,]/g, '');
    setGeneralDiscount(value);
  };

  const parseAmount = (value: string): number => {
    return parseFloat(value.replace(',', '.')) || 0;
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Calcular o desconto geral
  const calculateGeneralDiscount = (): number => {
    const discountValue = parseAmount(generalDiscount);
    
    if (discountValue <= 0) return 0;
    
    if (discountType === 'percentage') {
      // Calcular o valor com base na porcentagem (limitado a 100%)
      const safePercentage = Math.min(discountValue, 100);
      return (total * safePercentage) / 100;
    } else {
      // Valor direto (limitado ao total da venda)
      return Math.min(discountValue, total);
    }
  };

  // Calcular o valor final com desconto geral
  const generalDiscountAmount = calculateGeneralDiscount();
  const finalTotal = total - generalDiscountAmount;

  // Calcular troco para pagamento em dinheiro
  const cashAmount = parseAmount(cashReceived);
  const change = cashAmount - finalTotal > 0 ? cashAmount - finalTotal : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Finalizar Pagamento</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Resumo dos valores */}
        <div className="mb-6 space-y-2">
          <div className="flex justify-between text-gray-600">
            <span>Total:</span>
            <span>{formatCurrency(total)}</span>
          </div>

          {/* Campo de desconto geral */}
          <div className="pt-2 pb-2 border p-3 rounded-md">
            <div className="flex items-center mb-2">
              <PercentCircle className="h-4 w-4 mr-2" />
              <span className="font-medium">Desconto Geral</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={generalDiscount}
                  onChange={handleDiscountChange}
                  placeholder={discountType === 'percentage' ? '0%' : 'R$ 0,00'}
                  className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
                />
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setDiscountType('value')}
                  className={`px-3 py-1 rounded ${
                    discountType === 'value' 
                      ? 'bg-blue-100 text-blue-700 font-medium' 
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  R$
                </button>
                <button
                  onClick={() => setDiscountType('percentage')}
                  className={`px-3 py-1 rounded ${
                    discountType === 'percentage' 
                      ? 'bg-blue-100 text-blue-700 font-medium' 
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  %
                </button>
              </div>
            </div>
            
            {generalDiscountAmount > 0 && (
              <div className="text-sm font-medium text-green-600 flex justify-between mt-2">
                <span>Desconto aplicado:</span>
                <span>-{formatCurrency(generalDiscountAmount)}</span>
              </div>
            )}
          </div>

          {generalDiscountAmount > 0 && (
            <div className="flex justify-between font-medium text-lg text-green-700">
              <span>Novo Total:</span>
              <span>{formatCurrency(finalTotal)}</span>
            </div>
          )}
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Selecione a forma de pagamento</h3>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => setSelectedMethod('credit_card')}
              className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
                selectedMethod === 'credit_card' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <CreditCard className={`h-6 w-6 ${selectedMethod === 'credit_card' ? 'text-blue-600' : 'text-gray-600'}`} />
              <span className="mt-2 text-sm">Cartão de Crédito</span>
            </button>
            
            <button
              onClick={() => setSelectedMethod('debit_card')}
              className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
                selectedMethod === 'debit_card' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <CreditCard className={`h-6 w-6 ${selectedMethod === 'debit_card' ? 'text-blue-600' : 'text-gray-600'}`} />
              <span className="mt-2 text-sm">Cartão de Débito</span>
            </button>
            
            <button
              onClick={() => setSelectedMethod('cash')}
              className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
                selectedMethod === 'cash' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <Banknote className={`h-6 w-6 ${selectedMethod === 'cash' ? 'text-blue-600' : 'text-gray-600'}`} />
              <span className="mt-2 text-sm">Dinheiro</span>
            </button>
            
            <button
              onClick={() => setSelectedMethod('pix')}
              className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
                selectedMethod === 'pix' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <QrCode className={`h-6 w-6 ${selectedMethod === 'pix' ? 'text-blue-600' : 'text-gray-600'}`} />
              <span className="mt-2 text-sm">PIX</span>
            </button>
          </div>

          {/* Campos específicos para pagamento em dinheiro */}
          {selectedMethod === 'cash' && (
            <div className="mt-4 space-y-3 p-3 bg-gray-50 rounded-lg">
              <div>
                <label htmlFor="cashAmount" className="block text-sm text-gray-700 mb-1">
                  Valor recebido:
                </label>
                <input
                  id="cashAmount"
                  type="text"
                  value={cashReceived}
                  onChange={handleCashAmountChange}
                  placeholder="0,00"
                  className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
                />
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Troco:</span>
                <span className="font-medium">
                  {cashAmount >= finalTotal ? formatCurrency(change) : '--'}
                </span>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleConfirmPayment}
          disabled={loading || (selectedMethod === 'cash' && cashAmount < finalTotal)}
          className={`w-full flex justify-center items-center gap-2 rounded-lg py-3 font-semibold ${
            loading || (selectedMethod === 'cash' && cashAmount < finalTotal)
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Processando...</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5" />
              <span>Confirmar Pagamento</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
} 