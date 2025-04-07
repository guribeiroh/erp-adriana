'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { fetchCustomerById, updateCustomer } from '@/lib/services/customerService';
import { Customer } from '@/models/database.types';
import { 
  ArrowLeft, 
  User, 
  Building2, 
  Mail, 
  Phone, 
  Hash, 
  MapPin, 
  CalendarClock,
  Save,
  Loader2,
  Instagram
} from 'lucide-react';

type FormData = {
  nome: string;
  email: string;
  instagram: string;
  telefone: string;
  cpfCnpj: string;
  razaoSocial: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  complemento: string;
  observacoes: string;
  status: string;
};

type FormErrors = {
  [key in keyof FormData]?: string;
};

export default function EditarClientePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  
  // Estado do tipo de cliente
  const [tipoCliente, setTipoCliente] = useState<'pessoaFisica' | 'pessoaJuridica'>('pessoaFisica');
  
  // Estado do formulário
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    email: '',
    instagram: '',
    telefone: '',
    cpfCnpj: '',
    razaoSocial: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    complemento: '',
    observacoes: '',
    status: 'ativo'
  });
  
  // Estado de carregamento inicial
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Estado de erros de validação
  const [errors, setErrors] = useState<FormErrors>({});
  
  // Estado de envio
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Carregar dados do cliente
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        
        const customer = await fetchCustomerById(id);
        
        if (customer) {
          // Determinar o tipo de cliente
          const customerType = customer.customer_type === 'pf' ? 'pessoaFisica' : 'pessoaJuridica';
          setTipoCliente(customerType);
          
          // Preencher o formulário
          setFormData({
            nome: customer.name || '',
            email: customer.email || '',
            instagram: customer.instagram || '',
            telefone: customer.phone || '',
            cpfCnpj: customerType === 'pessoaFisica' 
              ? (customer.cpf || '') 
              : (customer.cnpj || ''),
            razaoSocial: customer.social_name || '',
            endereco: customer.address || '',
            cidade: customer.city || '',
            estado: customer.state || '',
            cep: customer.zip || '',
            complemento: customer.address_complement || '',
            observacoes: customer.notes || '',
            status: customer.status === 'active' ? 'ativo' : 'inativo'
          });
        } else {
          setLoadError('Cliente não encontrado');
        }
      } catch (error) {
        console.error('Erro ao carregar cliente:', error);
        setLoadError('Não foi possível carregar os dados do cliente');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCustomer();
  }, [id]);

  // Formatadores para CPF/CNPJ e telefone
  const formatCpfCnpj = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    
    if (tipoCliente === 'pessoaFisica') {
      // Formato CPF: 000.000.000-00
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
      if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
    } else {
      // Formato CNPJ: 00.000.000/0000-00
      if (digits.length <= 2) return digits;
      if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
      if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
      if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
    }
  };
  
  const formatPhone = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };
  
  // Handler para mudança nos campos do formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Limpar erro quando o campo for preenchido
    if (errors[name as keyof FormData]) {
      setErrors({
        ...errors,
        [name]: undefined
      });
    }
  };
  
  // Handler específico para CPF/CNPJ (com formatação)
  const handleCpfCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const formattedValue = formatCpfCnpj(value);
    
    setFormData({
      ...formData,
      cpfCnpj: formattedValue
    });
    
    if (errors.cpfCnpj) {
      setErrors({
        ...errors,
        cpfCnpj: undefined
      });
    }
  };
  
  // Handler específico para telefone (com formatação)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const formattedValue = formatPhone(value);
    
    setFormData({
      ...formData,
      telefone: formattedValue
    });
    
    if (errors.telefone) {
      setErrors({
        ...errors,
        telefone: undefined
      });
    }
  };
  
  // Validação do formulário
  const validateForm = () => {
    const newErrors: FormErrors = {};
    
    // Validação de campos obrigatórios
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }
    
    // Validação de Razão Social para Pessoa Jurídica
    if (tipoCliente === 'pessoaJuridica' && !formData.razaoSocial.trim()) {
      newErrors.razaoSocial = 'Razão Social é obrigatória';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!formData.telefone.trim()) {
      newErrors.telefone = 'Telefone é obrigatório';
    } else if (formData.telefone.replace(/\D/g, '').length < 10) {
      newErrors.telefone = 'Telefone inválido';
    }
    
    if (!formData.cpfCnpj.trim()) {
      newErrors.cpfCnpj = tipoCliente === 'pessoaFisica' ? 'CPF é obrigatório' : 'CNPJ é obrigatório';
    } else {
      const onlyNumbers = formData.cpfCnpj.replace(/\D/g, '');
      if (tipoCliente === 'pessoaFisica' && onlyNumbers.length !== 11) {
        newErrors.cpfCnpj = 'CPF inválido';
      } else if (tipoCliente === 'pessoaJuridica' && onlyNumbers.length !== 14) {
        newErrors.cpfCnpj = 'CNPJ inválido';
      }
    }
    
    if (!formData.endereco.trim()) {
      newErrors.endereco = 'Endereço é obrigatório';
    }
    
    if (!formData.cidade.trim()) {
      newErrors.cidade = 'Cidade é obrigatória';
    }
    
    if (!formData.estado.trim()) {
      newErrors.estado = 'Estado é obrigatório';
    }
    
    if (!formData.cep.trim()) {
      newErrors.cep = 'CEP é obrigatório';
    } else if (formData.cep.replace(/\D/g, '').length !== 8) {
      newErrors.cep = 'CEP inválido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      setSubmitError(null);
      
      try {
        // Preparar dados para o formato esperado pelo Supabase
        const customerData: Partial<Customer> = {
          id,
          name: formData.nome,
          email: formData.email,
          instagram: formData.instagram,
          phone: formData.telefone,
          address: formData.endereco,
          city: formData.cidade,
          state: formData.estado,
          zip: formData.cep,
          address_complement: formData.complemento,
          notes: formData.observacoes,
          customer_type: tipoCliente === 'pessoaFisica' ? 'pf' : 'pj',
          status: formData.status === 'ativo' ? 'active' : 'inactive'
        };
        
        // Adicionar campos específicos por tipo de cliente
        if (tipoCliente === 'pessoaFisica') {
          customerData.cpf = formData.cpfCnpj.replace(/\D/g, '');
          customerData.cnpj = undefined;
          customerData.social_name = undefined;
        } else {
          customerData.cnpj = formData.cpfCnpj.replace(/\D/g, '');
          customerData.social_name = formData.razaoSocial;
          customerData.cpf = undefined;
        }
        
        // Enviar para a API - a ordem correta é (id, customerData)
        await updateCustomer(id, customerData);
        
        setSuccess(true);
        
        // Redirecionar após sucesso
        setTimeout(() => {
          router.push('/dashboard/clientes');
        }, 2000);
      } catch (error) {
        console.error('Erro ao atualizar cliente:', error);
        setSubmitError(error instanceof Error ? error.message : 'Erro ao atualizar cliente. Tente novamente.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  // Renderização do formulário
  return (
    <DashboardLayout title="Editar Cliente">
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard/clientes" 
            className="rounded-full p-1.5 text-neutral-700 hover:bg-neutral-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900">
            Editar Cliente
          </h1>
        </div>
        
        {/* Loading state */}
        {isLoading && (
          <div className="rounded-lg border border-neutral-200 bg-white p-12 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-600" />
            <p className="mt-3 text-neutral-600">Carregando dados do cliente...</p>
          </div>
        )}
        
        {/* Error state */}
        {loadError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-red-800">{loadError}</p>
            <Link 
              href="/dashboard/clientes" 
              className="mt-4 inline-block rounded-lg bg-neutral-200 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-300"
            >
              Voltar para lista de clientes
            </Link>
          </div>
        )}
        
        {/* Success message */}
        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
            <p className="text-green-800">Cliente atualizado com sucesso!</p>
            <p className="mt-2 text-sm text-green-700">Redirecionando...</p>
          </div>
        )}
        
        {/* Form */}
        {!isLoading && !loadError && !success && (
          <>
            {/* Tipo de cliente */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div 
                className={`flex cursor-not-allowed items-center gap-4 rounded-lg border p-4 transition-colors ${
                  tipoCliente === 'pessoaFisica'
                    ? 'border-primary-200 bg-primary-50 ring-2 ring-primary-500/30'
                    : 'border-neutral-200 bg-white opacity-50'
                }`}
              >
                <div className={`rounded-full p-3 ${
                  tipoCliente === 'pessoaFisica' 
                    ? 'bg-primary-100 text-primary-600'
                    : 'bg-neutral-100 text-neutral-500'
                }`}>
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-neutral-900">Pessoa Física</h3>
                  <p className="text-sm text-neutral-500">Cliente pessoa física (CPF)</p>
                </div>
              </div>
              
              <div 
                className={`flex cursor-not-allowed items-center gap-4 rounded-lg border p-4 transition-colors ${
                  tipoCliente === 'pessoaJuridica'
                    ? 'border-primary-200 bg-primary-50 ring-2 ring-primary-500/30'
                    : 'border-neutral-200 bg-white opacity-50'
                }`}
              >
                <div className={`rounded-full p-3 ${
                  tipoCliente === 'pessoaJuridica' 
                    ? 'bg-primary-100 text-primary-600'
                    : 'bg-neutral-100 text-neutral-500'
                }`}>
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-neutral-900">Pessoa Jurídica</h3>
                  <p className="text-sm text-neutral-500">Cliente empresa (CNPJ)</p>
                </div>
              </div>
              
              <div className="md:col-span-2 mt-2">
                <p className="text-xs text-neutral-500 italic">* O tipo de cliente não pode ser alterado após o cadastro.</p>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-8 rounded-lg border border-neutral-200 bg-white p-6">
              {/* Informações básicas */}
              <div>
                <h2 className="mb-4 text-lg font-medium text-neutral-900">Informações Básicas</h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Nome */}
                  <div>
                    <label htmlFor="nome" className="mb-1.5 block text-sm font-medium text-neutral-900">
                      {tipoCliente === 'pessoaFisica' ? 'Nome Completo' : 'Nome Fantasia'} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        {tipoCliente === 'pessoaFisica' ? 
                          <User className="h-4 w-4 text-neutral-400" /> : 
                          <Building2 className="h-4 w-4 text-neutral-400" />
                        }
                      </div>
                      <input
                        type="text"
                        id="nome"
                        name="nome"
                        value={formData.nome}
                        onChange={handleChange}
                        placeholder={tipoCliente === 'pessoaFisica' ? 'Nome completo do cliente' : 'Nome fantasia da empresa'}
                        className={`w-full rounded-lg border py-2.5 pl-10 pr-4 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
                          errors.nome ? 'border-red-300 bg-red-50' : 'border-neutral-300 bg-white'
                        }`}
                      />
                    </div>
                    {errors.nome && (
                      <p className="mt-1.5 text-sm text-red-600">{errors.nome}</p>
                    )}
                  </div>
                  
                  {/* Razão Social (apenas para Pessoa Jurídica) */}
                  {tipoCliente === 'pessoaJuridica' && (
                    <div>
                      <label htmlFor="razaoSocial" className="mb-1.5 block text-sm font-medium text-neutral-900">
                        Razão Social <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Building2 className="h-4 w-4 text-neutral-400" />
                        </div>
                        <input
                          type="text"
                          id="razaoSocial"
                          name="razaoSocial"
                          value={formData.razaoSocial}
                          onChange={handleChange}
                          placeholder="Razão social da empresa"
                          className={`w-full rounded-lg border py-2.5 pl-10 pr-4 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
                            errors.razaoSocial ? 'border-red-300 bg-red-50' : 'border-neutral-300 bg-white'
                          }`}
                        />
                      </div>
                      {errors.razaoSocial && (
                        <p className="mt-1.5 text-sm text-red-600">{errors.razaoSocial}</p>
                      )}
                    </div>
                  )}
                  
                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-neutral-900">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Mail className="h-4 w-4 text-neutral-400" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="email@exemplo.com"
                        className={`w-full rounded-lg border py-2.5 pl-10 pr-4 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
                          errors.email ? 'border-red-300 bg-red-50' : 'border-neutral-300 bg-white'
                        }`}
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>
                  
                  {/* Instagram */}
                  <div>
                    <label htmlFor="instagram" className="mb-1.5 block text-sm font-medium text-neutral-900">
                      Instagram
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Instagram className="h-4 w-4 text-neutral-400" />
                      </div>
                      <input
                        type="text"
                        id="instagram"
                        name="instagram"
                        value={formData.instagram}
                        onChange={handleChange}
                        placeholder="usuario (sem @)"
                        className="w-full rounded-lg border border-neutral-300 bg-white py-2.5 pl-10 pr-4 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                      />
                    </div>
                  </div>
                  
                  {/* Telefone */}
                  <div>
                    <label htmlFor="telefone" className="mb-1.5 block text-sm font-medium text-neutral-900">
                      Telefone <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Phone className="h-4 w-4 text-neutral-400" />
                      </div>
                      <input
                        type="tel"
                        id="telefone"
                        name="telefone"
                        value={formData.telefone}
                        onChange={handlePhoneChange}
                        placeholder="(00) 00000-0000"
                        className={`w-full rounded-lg border py-2.5 pl-10 pr-4 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
                          errors.telefone ? 'border-red-300 bg-red-50' : 'border-neutral-300 bg-white'
                        }`}
                      />
                    </div>
                    {errors.telefone && (
                      <p className="mt-1.5 text-sm text-red-600">{errors.telefone}</p>
                    )}
                  </div>
                  
                  {/* CPF/CNPJ */}
                  <div>
                    <label htmlFor="cpfCnpj" className="mb-1.5 block text-sm font-medium text-neutral-900">
                      {tipoCliente === 'pessoaFisica' ? 'CPF' : 'CNPJ'} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Hash className="h-4 w-4 text-neutral-400" />
                      </div>
                      <input
                        type="text"
                        id="cpfCnpj"
                        name="cpfCnpj"
                        value={formData.cpfCnpj}
                        onChange={handleCpfCnpjChange}
                        placeholder={tipoCliente === 'pessoaFisica' ? '000.000.000-00' : '00.000.000/0000-00'}
                        className={`w-full rounded-lg border py-2.5 pl-10 pr-4 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
                          errors.cpfCnpj ? 'border-red-300 bg-red-50' : 'border-neutral-300 bg-white'
                        }`}
                      />
                    </div>
                    {errors.cpfCnpj && (
                      <p className="mt-1.5 text-sm text-red-600">{errors.cpfCnpj}</p>
                    )}
                  </div>
                  
                  {/* Status */}
                  <div>
                    <label htmlFor="status" className="mb-1.5 block text-sm font-medium text-neutral-900">
                      Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-neutral-300 bg-white py-2.5 px-4 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Endereço */}
              <div>
                <h2 className="mb-4 text-lg font-medium text-neutral-900">Endereço</h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Endereço */}
                  <div className="md:col-span-2">
                    <label htmlFor="endereco" className="mb-1.5 block text-sm font-medium text-neutral-900">
                      Endereço <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <MapPin className="h-4 w-4 text-neutral-400" />
                      </div>
                      <input
                        type="text"
                        id="endereco"
                        name="endereco"
                        value={formData.endereco}
                        onChange={handleChange}
                        placeholder="Rua, número, bairro"
                        className={`w-full rounded-lg border py-2.5 pl-10 pr-4 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
                          errors.endereco ? 'border-red-300 bg-red-50' : 'border-neutral-300 bg-white'
                        }`}
                      />
                    </div>
                    {errors.endereco && (
                      <p className="mt-1.5 text-sm text-red-600">{errors.endereco}</p>
                    )}
                  </div>
                  
                  {/* Complemento */}
                  <div>
                    <label htmlFor="complemento" className="mb-1.5 block text-sm font-medium text-neutral-900">
                      Complemento
                    </label>
                    <input
                      type="text"
                      id="complemento"
                      name="complemento"
                      value={formData.complemento}
                      onChange={handleChange}
                      placeholder="Apartamento, bloco, etc."
                      className="w-full rounded-lg border border-neutral-300 py-2.5 px-4 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    />
                  </div>
                  
                  {/* CEP */}
                  <div>
                    <label htmlFor="cep" className="mb-1.5 block text-sm font-medium text-neutral-900">
                      CEP <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="cep"
                      name="cep"
                      value={formData.cep}
                      onChange={handleChange}
                      placeholder="00000-000"
                      className={`w-full rounded-lg border py-2.5 px-4 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
                        errors.cep ? 'border-red-300 bg-red-50' : 'border-neutral-300 bg-white'
                      }`}
                    />
                    {errors.cep && (
                      <p className="mt-1.5 text-sm text-red-600">{errors.cep}</p>
                    )}
                  </div>
                  
                  {/* Cidade */}
                  <div>
                    <label htmlFor="cidade" className="mb-1.5 block text-sm font-medium text-neutral-900">
                      Cidade <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="cidade"
                      name="cidade"
                      value={formData.cidade}
                      onChange={handleChange}
                      placeholder="Nome da cidade"
                      className={`w-full rounded-lg border py-2.5 px-4 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
                        errors.cidade ? 'border-red-300 bg-red-50' : 'border-neutral-300 bg-white'
                      }`}
                    />
                    {errors.cidade && (
                      <p className="mt-1.5 text-sm text-red-600">{errors.cidade}</p>
                    )}
                  </div>
                  
                  {/* Estado */}
                  <div>
                    <label htmlFor="estado" className="mb-1.5 block text-sm font-medium text-neutral-900">
                      Estado <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="estado"
                      name="estado"
                      value={formData.estado}
                      onChange={handleChange}
                      className={`w-full rounded-lg border py-2.5 px-4 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
                        errors.estado ? 'border-red-300 bg-red-50' : 'border-neutral-300 bg-white'
                      }`}
                    >
                      <option value="">Selecione um estado</option>
                      <option value="AC">Acre</option>
                      <option value="AL">Alagoas</option>
                      <option value="AP">Amapá</option>
                      <option value="AM">Amazonas</option>
                      <option value="BA">Bahia</option>
                      <option value="CE">Ceará</option>
                      <option value="DF">Distrito Federal</option>
                      <option value="ES">Espírito Santo</option>
                      <option value="GO">Goiás</option>
                      <option value="MA">Maranhão</option>
                      <option value="MT">Mato Grosso</option>
                      <option value="MS">Mato Grosso do Sul</option>
                      <option value="MG">Minas Gerais</option>
                      <option value="PA">Pará</option>
                      <option value="PB">Paraíba</option>
                      <option value="PR">Paraná</option>
                      <option value="PE">Pernambuco</option>
                      <option value="PI">Piauí</option>
                      <option value="RJ">Rio de Janeiro</option>
                      <option value="RN">Rio Grande do Norte</option>
                      <option value="RS">Rio Grande do Sul</option>
                      <option value="RO">Rondônia</option>
                      <option value="RR">Roraima</option>
                      <option value="SC">Santa Catarina</option>
                      <option value="SP">São Paulo</option>
                      <option value="SE">Sergipe</option>
                      <option value="TO">Tocantins</option>
                    </select>
                    {errors.estado && (
                      <p className="mt-1.5 text-sm text-red-600">{errors.estado}</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Observações */}
              <div>
                <label htmlFor="observacoes" className="mb-1.5 block text-sm font-medium text-neutral-900">
                  Observações
                </label>
                <textarea
                  id="observacoes"
                  name="observacoes"
                  rows={4}
                  value={formData.observacoes}
                  onChange={handleChange}
                  placeholder="Informações adicionais sobre o cliente (opcional)"
                  className="w-full rounded-lg border border-neutral-300 py-2.5 px-4 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                />
              </div>
              
              {/* Botões de ação */}
              <div className="flex flex-col-reverse gap-3 pt-6 sm:flex-row sm:justify-end">
                <Link
                  href="/dashboard/clientes"
                  className="rounded-lg border border-neutral-300 bg-white px-6 py-2.5 text-center text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center justify-center rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700 disabled:bg-neutral-400"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Alterações
                    </>
                  )}
                </button>
              </div>
              
              {/* Erro de envio */}
              {submitError && (
                <div className="mt-4 rounded-lg bg-red-50 p-3 text-red-800 border border-red-200">
                  {submitError}
                </div>
              )}
            </form>
          </>
        )}
      </div>
    </DashboardLayout>
  );
} 