"use client";

import { useState, useEffect } from 'react';
import { Search, User, ShoppingCart, AlertCircle } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useCart } from '@/lib/context/CartContext';
import { Book, Customer } from '@/models/database.types';
import { fetchAvailableBooks, finalizeSale } from '@/lib/services/pdvService';
import { formatCurrency } from '@/lib/utils/format';
import ProductItem from '@/components/pdv/ProductItem';
import CartItem from '@/components/pdv/CartItem';
import CustomerSelectModal from '@/components/pdv/CustomerSelectModal';
import PaymentModal from '@/components/pdv/PaymentModal';
import SaleSuccessModal from '@/components/pdv/SaleSuccessModal';
import { supabase } from '@/lib/supabase/client';

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

  const handleConfirmPayment = async (method: 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'transfer') => {
    try {
      // Aqui seria necessário obter o ID do usuário autenticado
      const userId = 'current_user_id'; // Substituir pelo ID real do usuário autenticado
      
      const saleId = await finalizeSale(
        items,
        customer?.id || null,
        userId,
        method,
        ''
      );
      
      setCurrentSaleId(saleId);
      setPaymentMethod(method);
      setIsPaymentModalOpen(false);
      setIsSaleSuccessModalOpen(true);
    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      // Implementar tratamento de erro aqui
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