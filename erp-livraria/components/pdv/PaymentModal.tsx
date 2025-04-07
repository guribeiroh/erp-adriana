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
          <div className="bg-gray-50 pt-3 pb-3 px-4 border border-gray-200 rounded-lg">
            <div className="flex items-center mb-3">
              <PercentCircle className="h-5 w-5 mr-2 text-emerald-500" />
              <span className="font-medium text-gray-800">Desconto Geral</span>
            </div>
            
            <div className="flex flex-col gap-3">
              {/* Seletor de tipo de desconto */}
              <div className="flex justify-center">
                <div className="inline-flex rounded-md shadow-sm">
                  <button
                    type="button"
                    onClick={() => setDiscountType('value')}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-l-lg border ${
                      discountType === 'value'
                        ? 'z-10 bg-emerald-50 border-emerald-500 text-emerald-600'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-1 font-bold">R$</span> Valor
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('percentage')}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-r-lg border ${
                      discountType === 'percentage'
                        ? 'z-10 bg-emerald-50 border-emerald-500 text-emerald-600'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-1 font-bold">%</span> Porcentagem
                  </button>
                </div>
              </div>
              
              {/* Campo de entrada com dicas */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">
                    {discountType === 'value' ? 'R$' : '%'}
                  </span>
                </div>
                <input
                  type="text"
                  value={generalDiscount}
                  onChange={handleDiscountChange}
                  placeholder={discountType === 'percentage' ? '0' : '0,00'}
                  className="w-full rounded-md border border-gray-300 py-2 pl-8 pr-3 focus:border-emerald-500 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                />
                {discountType === 'percentage' && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">%</span>
                  </div>
                )}
              </div>
              
              {/* Mensagem de exemplo */}
              <div className="text-xs text-gray-500 italic">
                {discountType === 'value' 
                  ? 'Exemplo: 10,00 para R$ 10,00 de desconto' 
                  : 'Exemplo: 10 para 10% de desconto'}
              </div>
            </div>
            
            {generalDiscountAmount > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-sm font-medium text-emerald-600 flex justify-between">
                  <span>Desconto aplicado:</span>
                  <span>-{formatCurrency(generalDiscountAmount)}</span>
                </div>
                
                <div className="text-xs text-gray-500 mt-1">
                  {discountType === 'percentage' 
                    ? `(${parseAmount(generalDiscount)}% sobre ${formatCurrency(total)})` 
                    : ''}
                </div>
              </div>
            )}
          </div>

          {generalDiscountAmount > 0 && (
            <div className="flex justify-between items-center font-medium text-lg mt-3 text-emerald-700 p-2 bg-emerald-50 rounded-md">
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