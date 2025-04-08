import React, { useState, useEffect } from 'react';
import { Customer } from '@/models/database.types';
import { Search, X } from 'lucide-react';
import { fetchCustomers } from '@/lib/services/pdvService';

type CustomerSelectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: Customer) => void;
};

export default function CustomerSelectModal({
  isOpen,
  onClose,
  onSelectCustomer
}: CustomerSelectModalProps) {
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce para a pesquisa
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Carregar clientes quando o termo de pesquisa mudar
  useEffect(() => {
    if (debouncedSearch.trim().length >= 2) {
      loadCustomers(debouncedSearch);
    } else {
      setCustomers([]);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setCustomers([]);
    }
  }, [isOpen]);

  const loadCustomers = async (searchTerm = '') => {
    try {
      setLoading(true);
      const data = await fetchCustomers(searchTerm);
      setCustomers(data);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Selecionar Cliente</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Digite o nome do cliente..."
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className="mt-4 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : customers.length === 0 ? (
            search.length >= 2 ? (
              <p className="text-center text-gray-500 py-4">
                Nenhum cliente encontrado.
              </p>
            ) : (
              <p className="text-center text-gray-500 py-4">
                Digite pelo menos 2 caracteres para pesquisar...
              </p>
            )
          ) : (
            <div className="space-y-1">
              {customers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => onSelectCustomer(customer)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg flex items-center justify-between group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">
                      {customer.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {customer.email} • {customer.phone}
                    </div>
                  </div>
                  <span className="text-sm text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Selecionar
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 