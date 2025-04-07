"use client";

import React, { useState, useEffect } from 'react';
import { Search, User, ShoppingCart, AlertCircle } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useCart } from '@/lib/context/CartContext';
import { useAuth } from '@/lib/context/AuthContext';
import { Book, Customer } from '@/models/database.types';
import { fetchAvailableBooks, finalizeSale } from '@/lib/services/pdvService';
import { formatCurrency } from '@/lib/utils/format';
import ProductItem from '@/components/pdv/ProductItem';
import CartItem from '@/components/pdv/CartItem';
import CustomerSelectModal from '@/components/pdv/CustomerSelectModal';
import PaymentModal from '@/components/pdv/PaymentModal';
import SaleSuccessModal from '@/components/pdv/SaleSuccessModal';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';

export default function PDVPage() {
  const { 
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
  } = useCart();

  const { user, isLoading: authLoading } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [availableBooks, setAvailableBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSaleSuccessModalOpen, setIsSaleSuccessModalOpen] = useState(false);
  const [currentSaleId, setCurrentSaleId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit_card' | 'debit_card' | 'pix' | 'transfer'>('credit_card');
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Verificar se estamos no modo demonstração (sem Supabase)
  useEffect(() => {
    setIsDemoMode(!supabase);
  }, []);

  // Carregar livros disponíveis quando o componente for montado
  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async (search: string = '') => {
    try {
      setLoading(true);
      const books = await fetchAvailableBooks(search);
      setAvailableBooks(books);
    } catch (error) {
      console.error('Erro ao carregar livros:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadBooks(searchTerm);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    setCustomer(customer);
    setIsCustomerModalOpen(false);
  };

  const handleConfirmPayment = async (paymentMethod: 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'transfer', generalDiscount: number = 0) => {
    if (!user) {
      toast.error('É necessário estar logado para finalizar a venda');
      return;
    }

    try {
      setPaymentMethod(paymentMethod);
      
      // Aplicar desconto geral como desconto adicional no último item, se houver
      if (generalDiscount > 0 && items.length > 0) {
        console.log(`Aplicando desconto geral de ${generalDiscount} na venda`);
        
        // Vamos adicionar o desconto geral como uma observação 
        // para manter registro dele em caso de necessidade futura
        const notes = `Desconto geral aplicado: R$ ${generalDiscount.toFixed(2)}`;
        
        // Se houver apenas um item, aplicar todo o desconto a ele
        if (items.length === 1) {
          const item = items[0];
          // Adicionar o desconto geral ao desconto específico do item
          const totalItemDiscount = item.discount + generalDiscount;
          // Garantir que o desconto não exceda o valor do item
          const maxDiscount = item.book.selling_price * item.quantity;
          const safeDiscount = Math.min(totalItemDiscount, maxDiscount);
          
          // Atualizar o desconto no item
          updateDiscount(item.book.id, safeDiscount);
        } else {
          // Estratégia: distribuir o desconto entre os itens proporcionalmente
          // ao valor de cada um
          
          // Calcular o valor total dos itens para distribuição proporcional
          const itemsTotal = items.reduce((sum, item) => 
            sum + (item.book.selling_price * item.quantity), 0);
          
          // Aplicar desconto proporcionalmente
          let remainingDiscount = generalDiscount;
          
          // Aplicar aos itens, exceto o último
          for (let i = 0; i < items.length - 1; i++) {
            const item = items[i];
            const itemTotal = item.book.selling_price * item.quantity;
            const itemDiscountShare = (itemTotal / itemsTotal) * generalDiscount;
            const roundedDiscount = Math.floor(itemDiscountShare * 100) / 100; // Arredondar para 2 casas
            
            // Adicionar ao desconto existente do item
            const newDiscount = item.discount + roundedDiscount;
            updateDiscount(item.book.id, newDiscount);
            
            remainingDiscount -= roundedDiscount;
          }
          
          // Aplicar o restante ao último item
          const lastItem = items[items.length - 1];
          const newLastItemDiscount = lastItem.discount + remainingDiscount;
          updateDiscount(lastItem.book.id, newLastItemDiscount);
        }
      }
      
      // Aguardar um momento para que os estados atualizem com os novos descontos
      setTimeout(async () => {
        // Chamar a função de finalização de venda com os itens atualizados
        const saleId = await finalizeSale(
          items,
          customer?.id ?? null,
          user?.id ?? 'anonymous',
          paymentMethod,
          customer ? `Cliente: ${customer.name}` : 'Venda balcão'
        );
        
        setCurrentSaleId(saleId);
        setIsPaymentModalOpen(false);
        setIsSaleSuccessModalOpen(true);
      }, 100);
    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      toast.error('Ocorreu um erro ao finalizar a venda');
    }
  };

  const handleCloseSaleSuccess = () => {
    setIsSaleSuccessModalOpen(false);
    clearCart();
    loadBooks(); // Recarregar livros para atualizar o estoque
  };

  return (
    <DashboardLayout title="PDV">
      {isDemoMode && (
        <div className="mb-4 rounded-lg bg-amber-50 p-3 flex items-center text-amber-800 border border-amber-200">
          <AlertCircle className="h-5 w-5 mr-2 text-amber-500" />
          <div>
            <p className="font-medium">Modo Demonstração</p>
            <p className="text-sm">Sistema rodando com dados simulados. Para conectar ao Supabase, configure as variáveis de ambiente no arquivo .env.local</p>
          </div>
        </div>
      )}
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Lado esquerdo - Produtos disponíveis e busca */}
        <div className="w-full lg:w-3/5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar livro por título, autor ou ISBN..."
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <button 
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              onClick={() => setIsCustomerModalOpen(true)}
            >
              <User size={16} />
              <span>{customer ? 'Cliente: ' + customer.name.split(' ')[0] : 'Cliente'}</span>
            </button>
          </div>

          {/* Grid de produtos */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : availableBooks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenhum produto encontrado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableBooks.map((book) => (
                <ProductItem 
                  key={book.id} 
                  book={book} 
                  onAddToCart={addItem} 
                />
              ))}
            </div>
          )}
        </div>

        {/* Lado direito - Carrinho de compras */}
        <div className="w-full lg:w-2/5 space-y-4">
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-semibold text-gray-900">Carrinho</h2>
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-gray-600" />
                <span className="text-sm text-gray-600">
                  {items.length === 1 
                    ? '1 item' 
                    : `${items.length} itens`}
                </span>
              </div>
            </div>

            <div className="mt-3 space-y-1 max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <p className="text-center text-gray-500 py-6">
                  Nenhum item no carrinho.
                </p>
              ) : (
                items.map((item) => (
                  <CartItem
                    key={item.book.id}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemoveItem={removeItem}
                    onUpdateDiscount={updateDiscount}
                  />
                ))
              )}
            </div>

            {/* Subtotal e descontos */}
            <div className="mt-4 space-y-2 border-t pt-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Desconto:</span>
                <span className="font-medium text-red-600">-{formatCurrency(totalDiscount)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold">
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Botão de finalizar */}
            <button 
              onClick={() => setIsPaymentModalOpen(true)}
              disabled={items.length === 0}
              className={`mt-4 w-full rounded-lg py-3 text-center font-semibold ${
                items.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              Finalizar Venda
            </button>
          </div>
        </div>
      </div>

      {/* Modais */}
      <CustomerSelectModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSelectCustomer={handleSelectCustomer}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        total={total}
        onConfirmPayment={handleConfirmPayment}
      />

      <SaleSuccessModal
        isOpen={isSaleSuccessModalOpen}
        onClose={handleCloseSaleSuccess}
        saleId={currentSaleId}
        paymentMethod={paymentMethod}
      />
    </DashboardLayout>
  );
} 