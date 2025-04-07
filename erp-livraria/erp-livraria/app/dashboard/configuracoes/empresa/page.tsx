"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Check, 
  Building, 
  Map, 
  FileText,
  CreditCard
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface CompanyData {
  id: string;
  name: string;
  trade_name: string; // Nome fantasia
  cnpj: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email: string;
  website: string;
  logo_url: string;
  tax_regime: string;
  company_type: string;
  municipal_registration: string;
  state_registration: string;
}

export default function EmpresaPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("basic");
  const [formData, setFormData] = useState<CompanyData>({
    id: "",
    name: "",
    trade_name: "",
    cnpj: "",
    address: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zip_code: "",
    phone: "",
    email: "",
    website: "",
    logo_url: "",
    tax_regime: "simples_nacional",
    company_type: "ltda",
    municipal_registration: "",
    state_registration: "",
  });

  // Estados brasileiros
  const brazilianStates = [
    { value: "AC", label: "Acre" },
    { value: "AL", label: "Alagoas" },
    { value: "AP", label: "Amapá" },
    { value: "AM", label: "Amazonas" },
    { value: "BA", label: "Bahia" },
    { value: "CE", label: "Ceará" },
    { value: "DF", label: "Distrito Federal" },
    { value: "ES", label: "Espírito Santo" },
    { value: "GO", label: "Goiás" },
    { value: "MA", label: "Maranhão" },
    { value: "MT", label: "Mato Grosso" },
    { value: "MS", label: "Mato Grosso do Sul" },
    { value: "MG", label: "Minas Gerais" },
    { value: "PA", label: "Pará" },
    { value: "PB", label: "Paraíba" },
    { value: "PR", label: "Paraná" },
    { value: "PE", label: "Pernambuco" },
    { value: "PI", label: "Piauí" },
    { value: "RJ", label: "Rio de Janeiro" },
    { value: "RN", label: "Rio Grande do Norte" },
    { value: "RS", label: "Rio Grande do Sul" },
    { value: "RO", label: "Rondônia" },
    { value: "RR", label: "Roraima" },
    { value: "SC", label: "Santa Catarina" },
    { value: "SP", label: "São Paulo" },
    { value: "SE", label: "Sergipe" },
    { value: "TO", label: "Tocantins" },
  ];

  // Regimes tributários
  const taxRegimes = [
    { value: "simples_nacional", label: "Simples Nacional" },
    { value: "lucro_presumido", label: "Lucro Presumido" },
    { value: "lucro_real", label: "Lucro Real" },
    { value: "mei", label: "MEI" },
  ];

  // Tipos de empresa
  const companyTypes = [
    { value: "mei", label: "MEI - Microempreendedor Individual" },
    { value: "ei", label: "EI - Empresário Individual" },
    { value: "eireli", label: "EIRELI - Empresa Individual de Responsabilidade Limitada" },
    { value: "ltda", label: "LTDA - Sociedade Limitada" },
    { value: "sa", label: "S.A. - Sociedade Anônima" },
  ];

  // Carregar dados da empresa
  useEffect(() => {
    async function loadCompanyData() {
      setIsLoading(true);
      
      try {
        // Buscar as informações da empresa
        const { data, error } = await supabase
          .from("company_settings")
          .select("*")
          .single();

        if (error && error.code !== "PGRST116") {
          throw error;
        }

        if (data) {
          setFormData(data as CompanyData);
        }
      } catch (error) {
        console.error("Erro ao carregar dados da empresa:", error);
        setMessage({
          type: "error",
          text: "Não foi possível carregar os dados da empresa",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadCompanyData();
  }, []);

  // Funções para manipular formulários
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Função para formatar CNPJ
  const formatCNPJ = (value: string) => {
    // Remove todos os caracteres não numéricos
    const numericValue = value.replace(/\D/g, "");
    
    // Formata como CNPJ: XX.XXX.XXX/XXXX-XX
    return numericValue
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .substring(0, 18);
  };

  // Função para formatar CEP
  const formatCEP = (value: string) => {
    // Remove todos os caracteres não numéricos
    const numericValue = value.replace(/\D/g, "");
    
    // Formata como CEP: XXXXX-XXX
    return numericValue
      .replace(/^(\d{5})(\d)/, "$1-$2")
      .substring(0, 9);
  };

  // Função para formatar telefone
  const formatPhone = (value: string) => {
    // Remove todos os caracteres não numéricos
    const numericValue = value.replace(/\D/g, "");
    
    // Formata como telefone com DDD: (XX) XXXXX-XXXX
    if (numericValue.length <= 10) {
      return numericValue
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    } else {
      return numericValue
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
    }
  };

  // Handlers para campos formatados
  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = formatCNPJ(e.target.value);
    handleInputChange(e);
  };

  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = formatCEP(e.target.value);
    handleInputChange(e);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = formatPhone(e.target.value);
    handleInputChange(e);
  };

  // Salvar dados da empresa
  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      // Verificar se já existe um registro
      const { data: existingData } = await supabase
        .from("company_settings")
        .select("id")
        .limit(1);

      let result;
      
      if (existingData && existingData.length > 0) {
        // Atualizar registro existente
        result = await supabase
          .from("company_settings")
          .update(formData)
          .eq("id", existingData[0].id);
      } else {
        // Inserir novo registro
        result = await supabase
          .from("company_settings")
          .insert([formData]);
      }

      if (result?.error) {
        throw result.error;
      }

      setMessage({
        type: "success",
        text: "Dados da empresa salvos com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao salvar dados da empresa:", error);
      setMessage({
        type: "error",
        text: "Erro ao salvar dados da empresa. Tente novamente.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout title="Dados da Empresa">
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/configuracoes"
            className="rounded-full p-1.5 text-neutral-700 hover:bg-neutral-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900">Dados da Empresa</h1>
        </div>

        {/* Mensagem de feedback */}
        {message.text && (
          <div
            className={`rounded-md p-4 ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5" />
                <span>{message.text}</span>
              </div>
            ) : (
              <span>{message.text}</span>
            )}
          </div>
        )}

        {/* Conteúdo principal */}
        <div className="rounded-lg border border-neutral-200 bg-white shadow-sm">
          {/* Abas */}
          <div className="flex border-b border-neutral-200">
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === "basic"
                  ? "border-b-2 border-primary-500 text-primary-600"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
              onClick={() => setActiveTab("basic")}
            >
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                <span>Dados Básicos</span>
              </div>
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === "address"
                  ? "border-b-2 border-primary-500 text-primary-600"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
              onClick={() => setActiveTab("address")}
            >
              <div className="flex items-center gap-2">
                <Map className="h-4 w-4" />
                <span>Endereço</span>
              </div>
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === "fiscal"
                  ? "border-b-2 border-primary-500 text-primary-600"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
              onClick={() => setActiveTab("fiscal")}
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Dados Fiscais</span>
              </div>
            </button>
          </div>

          {/* Conteúdo das abas */}
          <div className="p-6">
            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
              </div>
            ) : (
              <form onSubmit={handleSaveCompany}>
                {/* Aba de Dados Básicos */}
                {activeTab === "basic" && (
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-neutral-700"
                      >
                        Razão Social <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="trade_name"
                        className="block text-sm font-medium text-neutral-700"
                      >
                        Nome Fantasia
                      </label>
                      <input
                        id="trade_name"
                        name="trade_name"
                        type="text"
                        value={formData.trade_name}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="cnpj"
                        className="block text-sm font-medium text-neutral-700"
                      >
                        CNPJ <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="cnpj"
                        name="cnpj"
                        type="text"
                        value={formData.cnpj}
                        onChange={handleCNPJChange}
                        required
                        maxLength={18}
                        placeholder="XX.XXX.XXX/XXXX-XX"
                        className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-neutral-700"
                      >
                        Telefone
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="text"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        placeholder="(XX) XXXXX-XXXX"
                        className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-neutral-700"
                      >
                        E-mail
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="website"
                        className="block text-sm font-medium text-neutral-700"
                      >
                        Website
                      </label>
                      <input
                        id="website"
                        name="website"
                        type="url"
                        value={formData.website}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Aba de Endereço */}
                {activeTab === "address" && (
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="zip_code"
                        className="block text-sm font-medium text-neutral-700"
                      >
                        CEP
                      </label>
                      <input
                        id="zip_code"
                        name="zip_code"
                        type="text"
                        value={formData.zip_code}
                        onChange={handleCEPChange}
                        placeholder="XXXXX-XXX"
                        className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="sm:col-span-2">
                        <label
                          htmlFor="address"
                          className="block text-sm font-medium text-neutral-700"
                        >
                          Endereço
                        </label>
                        <input
                          id="address"
                          name="address"
                          type="text"
                          value={formData.address}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="number"
                          className="block text-sm font-medium text-neutral-700"
                        >
                          Número
                        </label>
                        <input
                          id="number"
                          name="number"
                          type="text"
                          value={formData.number}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="complement"
                        className="block text-sm font-medium text-neutral-700"
                      >
                        Complemento
                      </label>
                      <input
                        id="complement"
                        name="complement"
                        type="text"
                        value={formData.complement}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="neighborhood"
                        className="block text-sm font-medium text-neutral-700"
                      >
                        Bairro
                      </label>
                      <input
                        id="neighborhood"
                        name="neighborhood"
                        type="text"
                        value={formData.neighborhood}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="city"
                          className="block text-sm font-medium text-neutral-700"
                        >
                          Cidade
                        </label>
                        <input
                          id="city"
                          name="city"
                          type="text"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="state"
                          className="block text-sm font-medium text-neutral-700"
                        >
                          Estado
                        </label>
                        <select
                          id="state"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                        >
                          <option value="">Selecione...</option>
                          {brazilianStates.map((state) => (
                            <option key={state.value} value={state.value}>
                              {state.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Aba de Dados Fiscais */}
                {activeTab === "fiscal" && (
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="company_type"
                        className="block text-sm font-medium text-neutral-700"
                      >
                        Tipo de Empresa
                      </label>
                      <select
                        id="company_type"
                        name="company_type"
                        value={formData.company_type}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                      >
                        {companyTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="tax_regime"
                        className="block text-sm font-medium text-neutral-700"
                      >
                        Regime Tributário
                      </label>
                      <select
                        id="tax_regime"
                        name="tax_regime"
                        value={formData.tax_regime}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                      >
                        {taxRegimes.map((regime) => (
                          <option key={regime.value} value={regime.value}>
                            {regime.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="state_registration"
                        className="block text-sm font-medium text-neutral-700"
                      >
                        Inscrição Estadual
                      </label>
                      <input
                        id="state_registration"
                        name="state_registration"
                        type="text"
                        value={formData.state_registration}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="municipal_registration"
                        className="block text-sm font-medium text-neutral-700"
                      >
                        Inscrição Municipal
                      </label>
                      <input
                        id="municipal_registration"
                        name="municipal_registration"
                        type="text"
                        value={formData.municipal_registration}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Botão de Salvar (disponível em todas as abas) */}
                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-70"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Salvar Dados da Empresa</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 