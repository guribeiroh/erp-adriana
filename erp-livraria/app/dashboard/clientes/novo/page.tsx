"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../../../components/layout/DashboardLayout";
import { createCustomer } from "@/lib/services/customerService";
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
  Loader2
} from "lucide-react";

// Tipos para validação
type TipoCliente = "pessoaFisica" | "pessoaJuridica";
type FormErrors = {
  [key: string]: string;
};

export default function NovoClientePage() {
  const router = useRouter();
  
  // Estado do tipo de cliente
  const [tipoCliente, setTipoCliente] = useState<TipoCliente>("pessoaFisica");
  
  // Estado do formulário
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    cpfCnpj: "",
    razaoSocial: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
    complemento: "",
    observacoes: "",
    status: "ativo"
  });
  
  // Estado de erros de validação
  const [errors, setErrors] = useState<FormErrors>({});
  
  // Estado de envio
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Handler para mudança de tipo de cliente
  const handleTipoClienteChange = (tipo: TipoCliente) => {
    setTipoCliente(tipo);
    setFormData({
      ...formData,
      cpfCnpj: "" // Limpar o campo quando mudar o tipo
    });
  };
  
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
  
  // Formatação de CPF/CNPJ durante digitação
  const handleCpfCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    let formattedValue = value.replace(/\D/g, ""); // Remove caracteres não numéricos
    
    if (tipoCliente === "pessoaFisica") {
      // Formatação de CPF: 123.456.789-10
      if (formattedValue.length <= 11) {
        if (formattedValue.length > 9) {
          formattedValue = formattedValue.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
        } else if (formattedValue.length > 6) {
          formattedValue = formattedValue.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
        } else if (formattedValue.length > 3) {
          formattedValue = formattedValue.replace(/(\d{3})(\d{1,3})/, "$1.$2");
        }
      }
    } else {
      // Formatação de CNPJ: 12.345.678/0001-90
      if (formattedValue.length <= 14) {
        if (formattedValue.length > 12) {
          formattedValue = formattedValue.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})/, "$1.$2.$3/$4-$5");
        } else if (formattedValue.length > 8) {
          formattedValue = formattedValue.replace(/(\d{2})(\d{3})(\d{3})(\d{1,4})/, "$1.$2.$3/$4");
        } else if (formattedValue.length > 5) {
          formattedValue = formattedValue.replace(/(\d{2})(\d{3})(\d{1,3})/, "$1.$2.$3");
        } else if (formattedValue.length > 2) {
          formattedValue = formattedValue.replace(/(\d{2})(\d{1,3})/, "$1.$2");
        }
      }
    }
    
    setFormData({
      ...formData,
      cpfCnpj: formattedValue
    });
    
    // Limpar erro quando o campo for preenchido
    if (errors.cpfCnpj) {
      setErrors({
        ...errors,
        cpfCnpj: ""
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
      telefone: formattedValue
    });
    
    // Limpar erro quando o campo for preenchido
    if (errors.telefone) {
      setErrors({
        ...errors,
        telefone: ""
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
      cep: formattedValue
    });
    
    // Limpar erro quando o campo for preenchido
    if (errors.cep) {
      setErrors({
        ...errors,
        cep: ""
      });
    }
  };
  
  // Validação do formulário
  const validateForm = () => {
    const newErrors: FormErrors = {};
    
    // Validação de campos obrigatórios
    if (!formData.nome.trim()) {
      newErrors.nome = "Nome é obrigatório";
    }
    
    // Validação de Razão Social para Pessoa Jurídica
    if (tipoCliente === "pessoaJuridica" && !formData.razaoSocial.trim()) {
      newErrors.razaoSocial = "Razão Social é obrigatória";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }
    
    if (!formData.telefone.trim()) {
      newErrors.telefone = "Telefone é obrigatório";
    } else if (formData.telefone.replace(/\D/g, "").length < 10) {
      newErrors.telefone = "Telefone inválido";
    }
    
    if (!formData.cpfCnpj.trim()) {
      newErrors.cpfCnpj = tipoCliente === "pessoaFisica" ? "CPF é obrigatório" : "CNPJ é obrigatório";
    } else {
      const onlyNumbers = formData.cpfCnpj.replace(/\D/g, "");
      if (tipoCliente === "pessoaFisica" && onlyNumbers.length !== 11) {
        newErrors.cpfCnpj = "CPF inválido";
      } else if (tipoCliente === "pessoaJuridica" && onlyNumbers.length !== 14) {
        newErrors.cpfCnpj = "CNPJ inválido";
      }
    }
    
    if (!formData.endereco.trim()) {
      newErrors.endereco = "Endereço é obrigatório";
    }
    
    if (!formData.cidade.trim()) {
      newErrors.cidade = "Cidade é obrigatória";
    }
    
    if (!formData.estado.trim()) {
      newErrors.estado = "Estado é obrigatório";
    }
    
    if (!formData.cep.trim()) {
      newErrors.cep = "CEP é obrigatório";
    } else if (formData.cep.replace(/\D/g, "").length !== 8) {
      newErrors.cep = "CEP inválido";
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
        const customerData = {
          name: formData.nome,
          email: formData.email,
          phone: formData.telefone,
          address: formData.endereco,
          city: formData.cidade,
          state: formData.estado,
          zip: formData.cep,
          address_complement: formData.complemento,
          notes: formData.observacoes,
          customer_type: tipoCliente === "pessoaFisica" ? "pf" : "pj",
          cpf: tipoCliente === "pessoaFisica" ? formData.cpfCnpj.replace(/\D/g, "") : undefined,
          cnpj: tipoCliente === "pessoaJuridica" ? formData.cpfCnpj.replace(/\D/g, "") : undefined,
          social_name: tipoCliente === "pessoaJuridica" ? formData.razaoSocial : undefined,
          status: formData.status === "ativo" ? "active" : "inactive"
        };
        
        // Enviar para a API
        await createCustomer(customerData);
        
        setSuccess(true);
        
        // Redirecionar após sucesso
        setTimeout(() => {
          router.push("/dashboard/clientes");
        }, 2000);
      } catch (error) {
        console.error("Erro ao cadastrar cliente:", error);
        setSubmitError(error instanceof Error ? error.message : "Erro ao cadastrar cliente. Tente novamente.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  return (
    <DashboardLayout title="Novo Cliente">
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
            Cadastrar Novo Cliente
          </h1>
        </div>
        
        {/* Seleção de tipo de cliente */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div 
            onClick={() => handleTipoClienteChange("pessoaFisica")}
            className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors ${
              tipoCliente === "pessoaFisica"
                ? "border-primary-200 bg-primary-50 ring-2 ring-primary-500/30"
                : "border-neutral-200 bg-white hover:border-primary-200 hover:bg-primary-50/50"
            }`}
          >
            <div className={`rounded-full p-3 ${
              tipoCliente === "pessoaFisica" 
                ? "bg-primary-100 text-primary-600"
                : "bg-neutral-100 text-neutral-500"
            }`}>
              <User className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-neutral-900">Pessoa Física</h3>
              <p className="text-sm text-neutral-500">Cadastrar cliente pessoa física (CPF)</p>
            </div>
          </div>
          
          <div 
            onClick={() => handleTipoClienteChange("pessoaJuridica")}
            className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors ${
              tipoCliente === "pessoaJuridica"
                ? "border-primary-200 bg-primary-50 ring-2 ring-primary-500/30"
                : "border-neutral-200 bg-white hover:border-primary-200 hover:bg-primary-50/50"
            }`}
          >
            <div className={`rounded-full p-3 ${
              tipoCliente === "pessoaJuridica" 
                ? "bg-primary-100 text-primary-600"
                : "bg-neutral-100 text-neutral-500"
            }`}>
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-neutral-900">Pessoa Jurídica</h3>
              <p className="text-sm text-neutral-500">Cadastrar cliente empresa (CNPJ)</p>
            </div>
          </div>
        </div>
        
        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-8 rounded-lg border border-neutral-200 bg-white p-6">
          {/* Informações básicas */}
          <div>
            <h2 className="mb-4 text-lg font-medium text-neutral-900">Informações Básicas</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Nome */}
              <div>
                <label htmlFor="nome" className="mb-1.5 block text-sm font-medium text-neutral-900">
                  {tipoCliente === "pessoaFisica" ? "Nome Completo" : "Nome Fantasia"} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    {tipoCliente === "pessoaFisica" ? 
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
                    placeholder={tipoCliente === "pessoaFisica" ? "Nome completo do cliente" : "Nome fantasia da empresa"}
                    className={`w-full rounded-lg border py-2.5 pl-10 pr-4 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
                      errors.nome ? "border-red-300 bg-red-50" : "border-neutral-300 bg-white"
                    }`}
                  />
                </div>
                {errors.nome && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.nome}</p>
                )}
              </div>
              
              {/* Razão Social (apenas para Pessoa Jurídica) */}
              {tipoCliente === "pessoaJuridica" && (
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
                        errors.razaoSocial ? "border-red-300 bg-red-50" : "border-neutral-300 bg-white"
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
                    placeholder="Email para contato"
                    className={`w-full rounded-lg border py-2.5 pl-10 pr-4 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
                      errors.email ? "border-red-300 bg-red-50" : "border-neutral-300 bg-white"
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>
                )}
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
                    type="text"
                    id="telefone"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleTelefoneChange}
                    placeholder="(00) 00000-0000"
                    className={`w-full rounded-lg border py-2.5 pl-10 pr-4 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
                      errors.telefone ? "border-red-300 bg-red-50" : "border-neutral-300 bg-white"
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
                  {tipoCliente === "pessoaFisica" ? "CPF" : "CNPJ"} <span className="text-red-500">*</span>
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
                    placeholder={tipoCliente === "pessoaFisica" ? "000.000.000-00" : "00.000.000/0000-00"}
                    className={`w-full rounded-lg border py-2.5 pl-10 pr-4 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
                      errors.cpfCnpj ? "border-red-300 bg-red-50" : "border-neutral-300 bg-white"
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
                      errors.endereco ? "border-red-300 bg-red-50" : "border-neutral-300 bg-white"
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
                  onChange={handleCepChange}
                  placeholder="00000-000"
                  className={`w-full rounded-lg border py-2.5 px-4 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
                    errors.cep ? "border-red-300 bg-red-50" : "border-neutral-300 bg-white"
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
                    errors.cidade ? "border-red-300 bg-red-50" : "border-neutral-300 bg-white"
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
                    errors.estado ? "border-red-300 bg-red-50" : "border-neutral-300 bg-white"
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
          
          {/* Mensagem de erro */}
          {submitError && (
            <div className="rounded-lg bg-red-50 p-4 text-red-600">
              <p>{submitError}</p>
            </div>
          )}
          
          {/* Botões de ação */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting || success}
              className="flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 font-medium text-white shadow-sm hover:bg-primary-700 disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : success ? (
                <>
                  <Save className="h-4 w-4" />
                  Salvo com sucesso!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar Cliente
                </>
              )}
            </button>
            
            <Link
              href="/dashboard/clientes"
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2.5 font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
} 