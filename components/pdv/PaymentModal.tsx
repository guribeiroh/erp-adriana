import React, { useState, useEffect, useRef } from 'react';
import { X, CreditCard, Banknote, QrCode, CheckCircle, PercentCircle, DollarSign, Percent, RotateCcw } from 'lucide-react';
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
  const [showDiscountSection, setShowDiscountSection] = useState(false);
  const discountContainerRef = useRef<HTMLDivElement>(null);

  // Limpar os valores quando o modal é aberto/fechado
  useEffect(() => {
    if (isOpen) {
      setCashReceived('');
      setGeneralDiscount('');
      setDiscountType('value');
      setShowDiscountSection(false);
    }
  }, [isOpen]);

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

  // Calcular percentual de desconto para exibição
  const discountPercentage = total > 0 ? ((generalDiscountAmount / total) * 100).toFixed(1) : '0';

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
            <span>Subtotal:</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          
          {totalDiscount > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Descontos por item:</span>
              <span className="text-red-500">-{formatCurrency(totalDiscount)}</span>
            </div>
          )}
          
          <div className="flex justify-between font-medium text-lg">
            <span>Total:</span>
            <span>{formatCurrency(total)}</span>
          </div>

          {/* Botão para mostrar/esconder o desconto geral */}
          {!showDiscountSection ? (
            <button 
              onClick={() => setShowDiscountSection(true)}
              className="w-full mt-2 flex items-center justify-center space-x-2 py-2 border border-dashed border-emerald-300 rounded-lg text-emerald-600 hover:bg-emerald-50"
            >
              <PercentCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Aplicar desconto geral</span>
            </button>
          ) : (
            /* Campo de desconto geral */
            <div ref={discountContainerRef} className="bg-emerald-50 rounded-lg p-4 mt-4 border border-emerald-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <PercentCircle className="h-5 w-5 mr-2 text-emerald-600" />
                  <span className="font-medium text-gray-800">Desconto Geral</span>
                </div>
                <button
                  onClick={() => {
                    setShowDiscountSection(false);
                    setGeneralDiscount('');
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                  aria-label="Cancelar desconto"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="flex flex-col gap-3">
                {/* Seletor de tipo de desconto com switch toggle */}
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600">Tipo de desconto:</span>
                    
                    <label className="inline-flex items-center cursor-pointer">
                      <span className={`mr-2 text-sm ${discountType === 'value' ? 'font-semibold text-emerald-600' : 'text-gray-500'}`}>
                        <DollarSign className="h-4 w-4 inline mr-0.5" />
                        R$
                      </span>
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          value="" 
                          className="sr-only peer"
                          checked={discountType === 'percentage'}
                          onChange={() => setDiscountType(discountType === 'value' ? 'percentage' : 'value')}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                      </div>
                      <span className={`ml-2 text-sm ${discountType === 'percentage' ? 'font-semibold text-emerald-600' : 'text-gray-500'}`}>
                        <Percent className="h-4 w-4 inline mr-0.5" />
                        %
                      </span>
                    </label>
                  </div>
                  
                  {/* Campo de entrada com dicas */}
                  <div className="relative mt-2">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">
                        {discountType === 'value' ? 'R$' : ''}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={generalDiscount}
                      onChange={handleDiscountChange}
                      placeholder={discountType === 'percentage' ? '0' : '0,00'}
                      className="w-full rounded-md border border-gray-300 py-2 pl-8 pr-10 focus:border-emerald-500 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                    />
                    {discountType === 'percentage' && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">%</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Dica sobre o tipo de desconto */}
                  <div className="text-xs text-gray-500 mt-2 flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1 text-emerald-500" />
                    {discountType === 'value' 
                      ? 'Digite o valor do desconto (ex: 10,50)' 
                      : 'Digite a porcentagem (ex: 10 para 10%)'}
                  </div>
                </div>
                
                {/* Botão de aplicar desconto */}
                <div className="flex items-center justify-end">
                  <button 
                    onClick={() => {
                      // Atualiza a visualização, não precisa fazer nada adicional 
                      // já que o cálculo é automático baseado nos valores do estado
                    }}
                    className="text-sm px-3 py-2 font-medium rounded-md bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                  >
                    Aplicar desconto
                  </button>
                </div>
                
                {/* Resumo do desconto aplicado */}
                {generalDiscountAmount > 0 && (
                  <div className="bg-white rounded-lg mt-2 p-3 shadow-sm">
                    <div className="text-sm flex justify-between items-center">
                      <span className="text-gray-600">Desconto aplicado:</span>
                      <div className="flex flex-col items-end">
                        <span className="font-medium text-red-500">-{formatCurrency(generalDiscountAmount)}</span>
                        {discountType === 'percentage' ? (
                          <span className="text-xs text-gray-500">({parseAmount(generalDiscount)}%)</span>
                        ) : (
                          <span className="text-xs text-gray-500">({discountPercentage}%)</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-2 flex justify-between items-center font-medium text-emerald-700">
                      <span>Novo total:</span>
                      <span>{formatCurrency(finalTotal)}</span>
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-500 flex items-center">
                      <RotateCcw className="h-3 w-3 mr-1" />
                      <span>O desconto será distribuído entre os itens proporcionalmente</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Selecione a forma de pagamento</h3>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => setSelectedMethod('credit_card')}
              className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
                selectedMethod === 'credit_card' ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50/30'
              }`}
            >
              <CreditCard className={`h-6 w-6 ${selectedMethod === 'credit_card' ? 'text-blue-600' : 'text-gray-600'}`} />
              <span className="mt-2 text-sm">Cartão de Crédito</span>
            </button>
            
            <button
              onClick={() => setSelectedMethod('debit_card')}
              className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
                selectedMethod === 'debit_card' ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50/30'
              }`}
            >
              <CreditCard className={`h-6 w-6 ${selectedMethod === 'debit_card' ? 'text-blue-600' : 'text-gray-600'}`} />
              <span className="mt-2 text-sm">Cartão de Débito</span>
            </button>
            
            <button
              onClick={() => setSelectedMethod('cash')}
              className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
                selectedMethod === 'cash' ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50/30'
              }`}
            >
              <Banknote className={`h-6 w-6 ${selectedMethod === 'cash' ? 'text-blue-600' : 'text-gray-600'}`} />
              <span className="mt-2 text-sm">Dinheiro</span>
            </button>
            
            <button
              onClick={() => setSelectedMethod('pix')}
              className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
                selectedMethod === 'pix' ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50/30'
              }`}
            >
              <QrCode className={`h-6 w-6 ${selectedMethod === 'pix' ? 'text-blue-600' : 'text-gray-600'}`} />
              <span className="mt-2 text-sm">PIX</span>
            </button>
          </div>

          {/* Campos específicos para pagamento em dinheiro */}
          {selectedMethod === 'cash' && (
            <div className="mt-4 space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div>
                <label htmlFor="cashAmount" className="block text-sm text-gray-700 mb-2">
                  Valor recebido:
                </label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">R$</span>
                  </div>
                  <input
                    id="cashAmount"
                    type="text"
                    value={cashReceived}
                    onChange={handleCashAmountChange}
                    placeholder="0,00"
                    className="w-full rounded-md border border-gray-300 py-2 pl-8 pr-3 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                </div>
              </div>
              
              {cashAmount > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Valor da venda:</span>
                    <span>{formatCurrency(finalTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span>Troco a devolver:</span>
                    <span className={change > 0 ? 'text-blue-600' : 'text-gray-600'}>
                      {formatCurrency(change)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="mr-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmPayment}
            disabled={loading || (selectedMethod === 'cash' && parseAmount(cashReceived) < finalTotal)}
            className={`px-5 py-2 rounded-md text-white font-medium flex items-center ${
              loading || (selectedMethod === 'cash' && parseAmount(cashReceived) < finalTotal)
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processando...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-1" />
                Confirmar Pagamento
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 