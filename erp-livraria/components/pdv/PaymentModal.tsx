import { useState } from 'react';
import { Loader2, BanknoteIcon, CreditCardIcon, QrCodeIcon, ArrowRightIcon, PercentCircle } from 'lucide-react';
import { useCart } from '@/lib/context/CartContext';
import { toast } from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Button
} from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onConfirmPayment: (method: 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'transfer', generalDiscount?: number) => void;
}

export default function PaymentModal({ isOpen, onClose, total, onConfirmPayment }: PaymentModalProps) {
  const { subtotal, totalDiscount } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit_card' | 'debit_card' | 'pix' | 'transfer'>('cash');
  const [cashAmount, setCashAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [generalDiscount, setGeneralDiscount] = useState<string>('');
  const [discountType, setDiscountType] = useState<'value' | 'percentage'>('value');

  const calculateGeneralDiscount = (): number => {
    if (!generalDiscount || generalDiscount === '0') return 0;
    
    const discountValue = parseFloat(generalDiscount.replace(',', '.'));
    if (isNaN(discountValue) || discountValue <= 0) return 0;
    
    if (discountType === 'percentage') {
      // Limitar percentual a 100%
      const safePercentage = Math.min(discountValue, 100);
      return (total * safePercentage) / 100;
    } else {
      // Limitar desconto ao valor total
      return Math.min(discountValue, total);
    }
  };

  const finalTotal = Math.max(0, total - calculateGeneralDiscount());
  const change = cashAmount 
    ? Math.max(0, parseFloat(cashAmount.replace(',', '.')) - finalTotal) 
    : 0;

  const handleConfirmPayment = async () => {
    if (paymentMethod === 'cash' && (!cashAmount || parseFloat(cashAmount.replace(',', '.')) < finalTotal)) {
      toast.error('O valor em dinheiro deve ser maior ou igual ao total da venda');
      return;
    }

    try {
      setIsLoading(true);
      await onConfirmPayment(paymentMethod, calculateGeneralDiscount());
      onClose();
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      toast.error('Ocorreu um erro ao processar o pagamento');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pagamento</DialogTitle>
          <DialogDescription>
            Selecione o método de pagamento
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="flex justify-between items-center font-medium text-lg">
            <span>Total:</span>
            <span>{formatCurrency(total)}</span>
          </div>

          {/* Seção de desconto geral */}
          <div className="space-y-2 border p-3 rounded-md">
            <h4 className="font-medium flex items-center">
              <PercentCircle className="h-4 w-4 mr-2" />
              Desconto Geral
            </h4>
            
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder={discountType === 'percentage' ? '0%' : 'R$ 0,00'}
                  value={generalDiscount}
                  onChange={(e) => setGeneralDiscount(e.target.value)}
                />
              </div>
              
              <Select
                value={discountType}
                onValueChange={(value) => setDiscountType(value as 'value' | 'percentage')}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="value">Valor (R$)</SelectItem>
                  <SelectItem value="percentage">Percentual (%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {calculateGeneralDiscount() > 0 && (
              <div className="text-sm font-medium text-green-600 flex justify-between">
                <span>Desconto aplicado:</span>
                <span>-{formatCurrency(calculateGeneralDiscount())}</span>
              </div>
            )}
          </div>

          {calculateGeneralDiscount() > 0 && (
            <div className="flex justify-between items-center font-medium text-lg text-green-700">
              <span>Novo Total:</span>
              <span>{formatCurrency(finalTotal)}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label>Método de Pagamento</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('cash')}
                className="flex items-center justify-center"
              >
                <BanknoteIcon className="h-4 w-4 mr-2" />
                Dinheiro
              </Button>
              <Button
                type="button"
                variant={paymentMethod === 'credit_card' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('credit_card')}
                className="flex items-center justify-center"
              >
                <CreditCardIcon className="h-4 w-4 mr-2" />
                Crédito
              </Button>
              <Button
                type="button"
                variant={paymentMethod === 'debit_card' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('debit_card')}
                className="flex items-center justify-center"
              >
                <CreditCardIcon className="h-4 w-4 mr-2" />
                Débito
              </Button>
              <Button
                type="button"
                variant={paymentMethod === 'pix' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('pix')}
                className="flex items-center justify-center"
              >
                <QrCodeIcon className="h-4 w-4 mr-2" />
                PIX
              </Button>
              <Button
                type="button"
                variant={paymentMethod === 'transfer' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('transfer')}
                className="flex items-center justify-center col-span-2"
              >
                <ArrowRightIcon className="h-4 w-4 mr-2" />
                Transferência
              </Button>
            </div>
          </div>

          {paymentMethod === 'cash' && (
            <div className="space-y-2">
              <Label htmlFor="cashAmount">Valor em Dinheiro</Label>
              <Input
                id="cashAmount"
                placeholder="R$ 0,00"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
              />
              {cashAmount && parseFloat(cashAmount.replace(',', '.')) >= finalTotal && (
                <div className="flex justify-between items-center font-medium">
                  <span>Troco:</span>
                  <span>{formatCurrency(change)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmPayment} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              'Confirmar Pagamento'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 