"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "../../../../../components/layout/DashboardLayout";
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
  AlertTriangle
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Customer } from "@/models/database.types";

// Tipos para validação
type FormErrors = {
  [key: string]: string;
};

export default function EditarClientePage() {
  const params = useParams();
  const router = useRouter();
  
  // Estado do formulário
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    notes: ""
  });
  
  // Estado de erros de validação
  const [errors, setErrors] = useState<FormErrors>({});
  
  // Estados de carregamento
  const [carregando, setCarregando] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  
  // Carregar dados do cliente
  useEffect(() => {
    async function carregarCliente() {
      try {
        setCarregando(true);
        setErro(null);
        
        if (!supabase) {
          throw new Error("Cliente Supabase não disponível");
        }
        
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('id', params.id)
          .single();
        
        if (error) {
          throw new Error(`Erro ao carregar cliente: ${error.message}`);
        }
        
        if (!data) {
          throw new Error("Cliente não encontrado");
        }
        
        // Preencher o formulário com os dados do cliente
        setFormData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          zip: data.zip || "",
          notes: data.notes || ""
        });
      } catch (error) {
        console.error("Erro ao carregar cliente:", error);
        setErro(error instanceof Error ? error.message : "Erro desconhecido");
      } finally {
        setCarregando(false);
      }
    }
    
    carregarCliente();
  }, [params.id]);
  
  // Handler para mudança nos campos do formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Limpar erro quando o campo for preenchido
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ""
      });
    }
  };
  
  // Formatação de telefone durante digitação
  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    let formattedValue = value.replace(/\D/g, ""); // Remove caracteres não numéricos
    
    // Formatação de telefone: (11) 98765-4321
    if (formattedValue.length <= 11) {
      if (formattedValue.length > 10) {
        formattedValue = formattedValue.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
      } else if (formattedValue.length > 6) {
        formattedValue = formattedValue.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
      } else if (formattedValue.length > 2) {
        formattedValue = formattedValue.replace(/(\d{2})(\d{0,5})/, "($1) $2");
      }
    }
    
    setFormData({
      ...formData,
      phone: formattedValue
    });
    
    // Limpar erro quando o campo for preenchido
    if (errors.phone) {
      setErrors({
        ...errors,
        phone: ""
      });
    }
  };
  
  // Formatação de CEP durante digitação
  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    let formattedValue = value.replace(/\D/g, ""); // Remove caracteres não numéricos
    
    // Formatação de CEP: 12345-678
    if (formattedValue.length <= 8) {
      if (formattedValue.length > 5) {
        formattedValue = formattedValue.replace(/(\d{5})(\d{1,3})/, "$1-$2");
      }
    }
    
    setFormData({
      ...formData,
      zip: formattedValue
    });
    
    // Limpar erro quando o campo for preenchido
    if (errors.zip) {
      setErrors({
        ...errors,
        zip: ""
      });
    }
  };
  
  // Validação do formulário
  const validateForm = () => {
    const newErrors: FormErrors = {};
    
    // Validação de campos obrigatórios
    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = "Telefone é obrigatório";
    } else if (formData.phone.replace(/\D/g, "").length < 10) {
      newErrors.phone = "Telefone inválido";
    }
    
    if (!formData.address.trim()) {
      newErrors.address = "Endereço é obrigatório";
    }
    
    if (!formData.city.trim()) {
      newErrors.city = "Cidade é obrigatória";
    }
    
    if (!formData.state.trim()) {
      newErrors.state = "Estado é obrigatório";
    }
    
    if (!formData.zip.trim()) {
      newErrors.zip = "CEP é obrigatório";
    } else if (formData.zip.replace(/\D/g, "").length !== 8) {
      newErrors.zip = "CEP inválido";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setSuccess(false);
    
    try {
      if (!supabase) {
        throw new Error("Cliente Supabase não disponível");
      }
      
      // Atualizar cliente no Supabase
      const { error } = await supabase
        .from('customers')
        .update({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          notes: formData.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id);
      
      if (error) {
        throw new Error(`Erro ao atualizar cliente: ${error.message}`);
      }
      
      // Sucesso na atualização
      setSuccess(true);
      
      // Redirecionar após sucesso
      setTimeout(() => {
        router.push(`/dashboard/clientes/${params.id}`);
      }, 1500);
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error);
      alert(`Erro ao atualizar cliente: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Exibição de carregamento
  if (carregando) {
    return (
      <DashboardLayout title="Carregando...">
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-neutral-300 border-t-primary-600"></div>
            <p className="text-neutral-600">Carregando informações do cliente...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  // Exibição de erro
  if (erro) {
    return (
      <DashboardLayout title="Erro">
        <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border border-neutral-200 bg-white p-6">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-neutral-900">Erro ao carregar cliente</h2>
          <p className="mb-6 text-neutral-600">{erro}</p>
          <div className="flex gap-3">
            <Link
              href="/dashboard/clientes"
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para Clientes
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout title="Editar Cliente">
      <div className="space-y-6">
        {/* Cabeçalho e navegação de volta */}
        <div className="mb-8 flex items-center gap-2">
          <Link 
            href={`/dashboard/clientes/${params.id}`}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900">Editar Cliente</h1>
        </div>
        
        {/* Formulário de edição */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Dados básicos */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <h2 className="text-lg font-medium text-neutral-900 mb-4">Informações Básicas</h2>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full rounded-md border ${errors.name ? 'border-red-300' : 'border-neutral-300'} px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500`}
                  placeholder="Nome do cliente"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full rounded-md border ${errors.email ? 'border-red-300' : 'border-neutral-300'} px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500`}
                  placeholder="email@exemplo.com"
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-1">
                  Telefone <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleTelefoneChange}
                  className={`w-full rounded-md border ${errors.phone ? 'border-red-300' : 'border-neutral-300'} px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500`}
                  placeholder="(00) 00000-0000"
                />
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
              </div>
            </div>
          </div>
          
          {/* Endereço */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <h2 className="text-lg font-medium text-neutral-900 mb-4">Endereço</h2>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-neutral-700 mb-1">
                  Endereço <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className={`w-full rounded-md border ${errors.address ? 'border-red-300' : 'border-neutral-300'} px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500`}
                  placeholder="Rua, número, bairro"
                />
                {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
              </div>
              
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-neutral-700 mb-1">
                  Cidade <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={`w-full rounded-md border ${errors.city ? 'border-red-300' : 'border-neutral-300'} px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500`}
                  placeholder="Cidade"
                />
                {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
              </div>
              
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-neutral-700 mb-1">
                  Estado <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className={`w-full rounded-md border ${errors.state ? 'border-red-300' : 'border-neutral-300'} px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500`}
                  placeholder="Estado"
                />
                {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state}</p>}
              </div>
              
              <div>
                <label htmlFor="zip" className="block text-sm font-medium text-neutral-700 mb-1">
                  CEP <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="zip"
                  name="zip"
                  value={formData.zip}
                  onChange={handleCepChange}
                  className={`w-full rounded-md border ${errors.zip ? 'border-red-300' : 'border-neutral-300'} px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500`}
                  placeholder="00000-000"
                />
                {errors.zip && <p className="mt-1 text-sm text-red-600">{errors.zip}</p>}
              </div>
            </div>
          </div>
          
          {/* Observações */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <h2 className="text-lg font-medium text-neutral-900 mb-4">Observações</h2>
            
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-neutral-700 mb-1">
                Observações
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                value={formData.notes}
                onChange={handleChange}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Observações sobre o cliente"
              ></textarea>
            </div>
          </div>
          
          {/* Botões de ação */}
          <div className="flex items-center justify-end gap-3">
            <Link
              href={`/dashboard/clientes/${params.id}`}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 disabled:bg-primary-300"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
          
          {/* Mensagem de sucesso */}
          {success && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    Cliente atualizado com sucesso! Redirecionando...
                  </p>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </DashboardLayout>
  );
}