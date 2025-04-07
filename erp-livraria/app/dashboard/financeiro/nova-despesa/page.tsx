"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import { createTransacao } from "@/lib/services/financialService";
import { 
  ArrowLeft, 
  Calendar, 
  FileText, 
  Save,
  Loader2,
  Search,
  Tag,
  TrendingDown,
  LinkIcon,
  Receipt,
  AlertCircle,
  Check,
  X,
  Clock,
  Building,
  Store,
  CreditCard
} from "lucide-react";
import { categoriasDespesas, meiosPagamento } from '@/lib/constants/financeiro';
import { Combobox } from '@/components/ui/Combobox';
import { DatePicker } from '@/components/ui/DatePicker';
import { getSuppliers, createSupplier } from '@/lib/services/supplierService';
import { cn, formatCurrency, formatDate, formatDecimal } from '@/lib/utils';
import { dueValueInDays } from '@/lib/constants';

// Tipos
type FormaPagamento = "dinheiro" | "credito" | "debito" | "pix" | "boleto" | "transferencia";
type Periodicidade = "unica" | "mensal" | "trimestral" | "semestral" | "anual";

interface Fornecedor {
  id: string;
  nome: string;
  cpfCnpj: string;
}

// Dados simulados
const fornecedores: Fornecedor[] = [
  { id: "F001", nome: "Editora Companhia das Letras", cpfCnpj: "45.987.245/0001-92" },
  { id: "F002", nome: "Distribuidora Nacional de Livros", cpfCnpj: "21.654.321/0001-87" },
  { id: "F003", nome: "Papel & Arte Ltda", cpfCnpj: "12.345.678/0001-90" },
  { id: "F004", nome: "Gráfica Moderna S.A.", cpfCnpj: "98.765.432/0001-21" },
  { id: "F005", nome: "Transportadora Rápida", cpfCnpj: "32.109.876/0001-54" }
];

export default function NovaDespesaPage() {
  const router = useRouter();
  
  // Estados do formulário
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("");
  const [data, setData] = useState<Date | undefined>(new Date());
  const [dataVencimento, setDataVencimento] = useState<Date | undefined>(
    new Date(new Date().setDate(new Date().getDate() + dueValueInDays))
  );
  const [dataPagamento, setDataPagamento] = useState("");
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>("dinheiro");
  const [observacoes, setObservacoes] = useState("");
  const [isPago, setIsPago] = useState(false);
  const [comprovante, setComprovante] = useState<File | null>(null);
  
  // Estados para fornecedor
  const [buscarFornecedor, setBuscarFornecedor] = useState(false);
  const [buscaFornecedor, setBuscaFornecedor] = useState("");
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState<Fornecedor | null>(null);
  const [fornecedoresFiltrados, setFornecedoresFiltrados] = useState<Fornecedor[]>([]);
  const [mostrarResultadosFornecedor, setMostrarResultadosFornecedor] = useState(false);
  
  // Estados para despesa recorrente
  const [isDespesaRecorrente, setIsDespesaRecorrente] = useState(false);
  const [periodicidade, setPeriodicidade] = useState<Periodicidade>("mensal");
  const [dataFim, setDataFim] = useState("");
  
  // Estados de submissão
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<{
    descricao?: string;
    valor?: string;
    categoria?: string;
    meioPagamento?: string;
    data?: string;
    dataVencimento?: string;
    geral?: string;
  }>({});
  
  // Handler para formatar valor monetário
  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value === "") {
      setValor("");
      return;
    }
    
    const valueNumber = parseFloat(value) / 100;
    setValor(valueNumber.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };
  
  // Handler para alternar se já foi pago
  const handlePagoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsPago(e.target.checked);
    if (!e.target.checked) {
      setDataPagamento("");
    } else {
      setDataPagamento(new Date().toISOString().split('T')[0]);
    }
  };
  
  // Handler para buscar fornecedor
  const handleBuscaFornecedorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const termo = e.target.value;
    setBuscaFornecedor(termo);
    
    if (termo.trim() === "") {
      setFornecedoresFiltrados([]);
    } else {
      const termoBusca = termo.toLowerCase();
      const resultados = fornecedores.filter(
        fornecedor => 
          fornecedor.id.toLowerCase().includes(termoBusca) || 
          fornecedor.nome.toLowerCase().includes(termoBusca) ||
          fornecedor.cpfCnpj.replace(/\D/g, "").includes(termoBusca.replace(/\D/g, ""))
      );
      setFornecedoresFiltrados(resultados);
    }
    
    setMostrarResultadosFornecedor(true);
  };
  
  // Handler para selecionar fornecedor
  const handleSelecionarFornecedor = (fornecedor: Fornecedor) => {
    setFornecedorSelecionado(fornecedor);
    setBuscaFornecedor("");
    setFornecedoresFiltrados([]);
    setMostrarResultadosFornecedor(false);
  };
  
  // Handler para upload de comprovante
  const handleComprovanteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setComprovante(e.target.files[0]);
    }
  };
  
  // Formatar CNPJ/CPF
  const formatarCpfCnpj = (valor: string) => {
    // CNPJ
    if (valor.length === 14) {
      return valor.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
    }
    // CPF
    else if (valor.length === 11) {
      return valor.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
    }
    return valor;
  };
  
  // Validar formulário
  const validateForm = () => {
    const newErrors: any = {};
    
    if (!descricao.trim()) newErrors.descricao = 'Descrição é obrigatória';
    if (!valor.trim()) newErrors.valor = 'Valor é obrigatório';
    if (!categoria) newErrors.categoria = 'Categoria é obrigatória';
    if (!data) newErrors.data = 'Data é obrigatória';
    if (!dataVencimento) newErrors.dataVencimento = 'Data de vencimento é obrigatória';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Função para salvar despesa
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação do formulário
    const newErrors: any = {};
    
    if (!descricao.trim()) newErrors.descricao = 'Descrição é obrigatória';
    if (!valor.trim()) newErrors.valor = 'Valor é obrigatório';
    if (!categoria) newErrors.categoria = 'Categoria é obrigatória';
    if (!formaPagamento) newErrors.formaPagamento = 'Forma de pagamento é obrigatória';
    if (!data) newErrors.data = 'Data é obrigatória';
    if (!dataVencimento) newErrors.dataVencimento = 'Data de vencimento é obrigatória';
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Converter o valor para número
      const valorNumerico = parseFloat(
        valor.replace('R$', '')
        .replace(/\./g, '')
        .replace(',', '.')
        .trim()
      );
      
      if (isNaN(valorNumerico)) {
        throw new Error('Valor inválido');
      }
      
      // Preparar os dados da despesa
      const dadosDespesa = {
        descricao,
        valor: valorNumerico,
        categoria,
        formaPagamento,
        data: data instanceof Date ? data.toISOString() : new Date().toISOString(),
        dataVencimento: dataVencimento instanceof Date ? dataVencimento.toISOString() : undefined,
        dataPagamento: isPago && dataPagamento ? dataPagamento : undefined,
        tipo: 'despesa' as const,
        status: isPago ? 'confirmada' as const : 'pendente' as const,
        observacoes,
        vinculoTipo: fornecedorSelecionado ? 'fornecedor' as const : undefined,
        vinculoId: fornecedorSelecionado?.id,
        vinculoNome: fornecedorSelecionado?.nome,
        comprovante: comprovante ? {
          nome: comprovante.name,
          tipo: comprovante.type,
          tamanho: comprovante.size,
          // Em uma implementação real, aqui seria feito o upload do arquivo
          url: URL.createObjectURL(comprovante)
        } : undefined
      };
      
      console.log('Salvando despesa:', dadosDespesa);
      
      // Chamar o serviço para criar a transação
      const resultado = await createTransacao(dadosDespesa);
      
      console.log('Despesa salva com sucesso:', resultado);
      
      setSuccess(true);
      
      // Redirecionar após um breve delay
      setTimeout(() => {
        router.push('/dashboard/financeiro');
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
      setErrors({
        ...errors,
        geral: error instanceof Error ? error.message : 'Ocorreu um erro ao salvar a despesa'
      });
      setIsSubmitting(false);
    }
  };
  
  // Formatador de valor monetário para exibição
  const formatarValor = (valorString: string) => {
    if (!valorString) return "R$ 0,00";
    
    const valor = valorString.includes(",") 
      ? parseFloat(valorString.replace(/\./g, "").replace(",", "."))
      : parseFloat(valorString);
      
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };
  
  return (
    <DashboardLayout title="Nova Despesa">
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/financeiro"
            className="rounded-full p-1.5 text-neutral-700 hover:bg-neutral-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900">
            Registrar Nova Despesa
          </h1>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Fornecedor */}
          <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-medium text-neutral-900">Fornecedor (Opcional)</h2>
            
            <div className="mb-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="buscar-fornecedor"
                  checked={buscarFornecedor}
                  onChange={(e) => {
                    setBuscarFornecedor(e.target.checked);
                    if (!e.target.checked) {
                      setFornecedorSelecionado(null);
                    }
                  }}
                  className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="buscar-fornecedor" className="flex items-center gap-2 text-neutral-900">
                  <Store className="h-5 w-5 text-neutral-500" /> Vincular a um fornecedor
                </label>
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                Vincular esta despesa a um fornecedor registrado no sistema
              </p>
            </div>
            
            {buscarFornecedor && (
              <div className="space-y-4">
                {fornecedorSelecionado ? (
                  <div className="mb-4 flex items-center justify-between rounded-lg bg-neutral-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-200">
                        <Building className="h-5 w-5 text-neutral-700" />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">{fornecedorSelecionado.nome}</p>
                        <p className="text-sm text-neutral-600">
                          {formatarCpfCnpj(fornecedorSelecionado.cpfCnpj.replace(/\D/g, ""))}
                        </p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setFornecedorSelecionado(null)}
                      className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Search className="h-4 w-4 text-neutral-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar fornecedor por nome ou CNPJ..."
                      value={buscaFornecedor}
                      onChange={handleBuscaFornecedorChange}
                      onFocus={() => setMostrarResultadosFornecedor(true)}
                      className="w-full rounded-lg border border-neutral-300 py-2.5 pl-10 pr-4 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    />
                    
                    {mostrarResultadosFornecedor && fornecedoresFiltrados.length > 0 && (
                      <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-neutral-200 bg-white py-1 shadow-lg">
                        {fornecedoresFiltrados.map((fornecedor) => (
                          <button
                            key={fornecedor.id}
                            type="button"
                            onClick={() => handleSelecionarFornecedor(fornecedor)}
                            className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-neutral-50"
                          >
                            <Building className="h-4 w-4 text-neutral-400" />
                            <div>
                              <p className="font-medium text-neutral-900">{fornecedor.nome}</p>
                              <p className="text-sm text-neutral-600">
                                {formatarCpfCnpj(fornecedor.cpfCnpj.replace(/\D/g, ""))}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {mostrarResultadosFornecedor && buscaFornecedor.trim() !== "" && fornecedoresFiltrados.length === 0 && (
                      <div className="absolute z-10 mt-1 w-full rounded-md border border-neutral-200 bg-white p-4 text-center text-neutral-600 shadow-lg">
                        Nenhum fornecedor encontrado.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Detalhes da despesa */}
          <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-medium text-neutral-900">Detalhes da Despesa</h2>
            
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Descrição */}
              <div className="col-span-full">
                <label htmlFor="descricao" className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Descrição <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Ex: Compra de livros, Pagamento de impostos, etc."
                  className={`w-full rounded-lg border ${errors.descricao ? 'border-red-300' : 'border-neutral-300'} py-2.5 px-3 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50`}
                />
                {errors.descricao && (
                  <p className="mt-1 text-xs text-red-600">{errors.descricao}</p>
                )}
              </div>
              
              {/* Valor */}
              <div>
                <label htmlFor="valor" className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Valor <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-neutral-500">R$</span>
                  </div>
                  <input
                    type="text"
                    id="valor"
                    value={valor}
                    onChange={handleValorChange}
                    placeholder="0,00"
                    className={`w-full rounded-lg border ${errors.valor ? 'border-red-300' : 'border-neutral-300'} py-2.5 pl-10 pr-4 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50`}
                  />
                </div>
                {errors.valor && (
                  <p className="mt-1 text-xs text-red-600">{errors.valor}</p>
                )}
              </div>
              
              {/* Categoria */}
              <div>
                <label htmlFor="categoria" className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Categoria <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="categoria"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className={`w-full rounded-lg border ${errors.categoria ? 'border-red-300' : 'border-neutral-300'} py-2.5 px-3 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50`}
                  >
                    <option value="">Selecione uma categoria</option>
                    {categoriasDespesas.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <Tag className="h-4 w-4 text-neutral-400" />
                  </div>
                </div>
                {errors.categoria && (
                  <p className="mt-1 text-xs text-red-600">{errors.categoria}</p>
                )}
              </div>
              
              {/* Data da despesa */}
              <div>
                <label htmlFor="data" className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Data da Despesa <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Calendar className="h-4 w-4 text-neutral-400" />
                  </div>
                  <input
                    type="date"
                    id="data"
                    value={data?.toISOString().split('T')[0]}
                    onChange={(e) => setData(new Date(e.target.value))}
                    className={`w-full rounded-lg border ${errors.data ? 'border-red-300' : 'border-neutral-300'} py-2.5 pl-10 pr-4 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50`}
                  />
                </div>
                {errors.data && (
                  <p className="mt-1 text-xs text-red-600">{errors.data}</p>
                )}
              </div>
              
              {/* Data de vencimento */}
              <div>
                <label htmlFor="data-vencimento" className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Data de Vencimento <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Calendar className="h-4 w-4 text-neutral-400" />
                  </div>
                  <input
                    type="date"
                    id="data-vencimento"
                    value={dataVencimento?.toISOString().split('T')[0]}
                    onChange={(e) => setDataVencimento(new Date(e.target.value))}
                    className={`w-full rounded-lg border ${errors.dataVencimento ? 'border-red-300' : 'border-neutral-300'} py-2.5 pl-10 pr-4 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50`}
                  />
                </div>
                {errors.dataVencimento && (
                  <p className="mt-1 text-xs text-red-600">{errors.dataVencimento}</p>
                )}
              </div>
              
              {/* Status de pagamento */}
              <div className="col-span-full">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is-pago"
                    checked={isPago}
                    onChange={handlePagoChange}
                    className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="is-pago" className="flex items-center gap-2 text-neutral-900">
                    <Check className="h-5 w-5 text-green-500" /> Despesa já paga
                  </label>
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  Marque esta opção se a despesa já foi paga
                </p>
              </div>
              
              {/* Data de pagamento (se já foi pago) */}
              {isPago && (
                <div>
                  <label htmlFor="data-pagamento" className="mb-1.5 block text-sm font-medium text-neutral-700">
                    Data de Pagamento <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Calendar className="h-4 w-4 text-neutral-400" />
                    </div>
                    <input
                      type="date"
                      id="data-pagamento"
                      value={dataPagamento}
                      onChange={(e) => setDataPagamento(e.target.value)}
                      className={`w-full rounded-lg border ${errors.dataPagamento ? 'border-red-300' : 'border-neutral-300'} py-2.5 pl-10 pr-4 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50`}
                    />
                  </div>
                  {errors.dataPagamento && (
                    <p className="mt-1 text-xs text-red-600">{errors.dataPagamento}</p>
                  )}
                </div>
              )}
              
              {/* Forma de pagamento (se já foi pago) */}
              {isPago && (
                <div>
                  <label htmlFor="forma-pagamento" className="mb-1.5 block text-sm font-medium text-neutral-700">
                    Forma de Pagamento
                  </label>
                  <select
                    id="forma-pagamento"
                    value={formaPagamento}
                    onChange={(e) => setFormaPagamento(e.target.value as FormaPagamento)}
                    className="w-full rounded-lg border border-neutral-300 py-2.5 px-3 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  >
                    <option value="dinheiro">Dinheiro</option>
                    <option value="credito">Cartão de Crédito</option>
                    <option value="debito">Cartão de Débito</option>
                    <option value="pix">PIX</option>
                    <option value="boleto">Boleto Bancário</option>
                    <option value="transferencia">Transferência Bancária</option>
                  </select>
                </div>
              )}
            </div>
          </div>
          
          {/* Recorrência */}
          <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium text-neutral-900">Recorrência</h2>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is-recorrente"
                  checked={isDespesaRecorrente}
                  onChange={(e) => setIsDespesaRecorrente(e.target.checked)}
                  className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="is-recorrente" className="ml-2 flex items-center gap-2 text-sm text-neutral-900">
                  <Clock className="h-4 w-4 text-neutral-500" /> Despesa recorrente
                </label>
              </div>
            </div>
            
            {isDespesaRecorrente && (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* Periodicidade */}
                <div>
                  <label htmlFor="periodicidade" className="mb-1.5 block text-sm font-medium text-neutral-700">
                    Periodicidade
                  </label>
                  <select
                    id="periodicidade"
                    value={periodicidade}
                    onChange={(e) => setPeriodicidade(e.target.value as Periodicidade)}
                    className="w-full rounded-lg border border-neutral-300 py-2.5 px-3 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  >
                    <option value="mensal">Mensal</option>
                    <option value="trimestral">Trimestral</option>
                    <option value="semestral">Semestral</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>
                
                {/* Data de término */}
                <div>
                  <label htmlFor="data-fim" className="mb-1.5 block text-sm font-medium text-neutral-700">
                    Data de Término <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Calendar className="h-4 w-4 text-neutral-400" />
                    </div>
                    <input
                      type="date"
                      id="data-fim"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                      className={`w-full rounded-lg border ${errors.dataFim ? 'border-red-300' : 'border-neutral-300'} py-2.5 pl-10 pr-4 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50`}
                    />
                  </div>
                  {errors.dataFim && (
                    <p className="mt-1 text-xs text-red-600">{errors.dataFim}</p>
                  )}
                </div>
                
                {/* Aviso */}
                <div className="col-span-full rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-500" />
                    <p>
                      Ao registrar uma despesa recorrente, o sistema irá criar automaticamente todas as parcelas futuras 
                      até a data de término, de acordo com a periodicidade selecionada.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Informações adicionais */}
          <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-medium text-neutral-900">Informações Adicionais</h2>
            
            <div className="grid grid-cols-1 gap-5">
              {/* Observações */}
              <div>
                <label htmlFor="observacoes" className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Observações (Opcional)
                </label>
                <textarea
                  id="observacoes"
                  rows={3}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Informações adicionais sobre esta despesa"
                  className="w-full rounded-lg border border-neutral-300 py-2.5 px-3 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                />
              </div>
              
              {/* Comprovante */}
              {isPago && (
                <div>
                  <label htmlFor="comprovante" className="mb-1.5 block text-sm font-medium text-neutral-700">
                    Comprovante (Opcional)
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="file"
                      id="comprovante"
                      onChange={handleComprovanteChange}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <label
                      htmlFor="comprovante"
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-100"
                    >
                      <FileText className="h-5 w-5 text-neutral-500" />
                      {comprovante ? comprovante.name : "Anexar comprovante (PDF, JPG ou PNG)"}
                    </label>
                    {comprovante && (
                      <button
                        type="button"
                        onClick={() => setComprovante(null)}
                        className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    Anexe um comprovante de pagamento (tamanho máximo: 5MB)
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Área de anexos */}
          <div className="col-span-full mt-2">
            <div className="rounded-lg border border-dashed border-neutral-300 p-4">
              <div className="flex items-center justify-center flex-col py-6">
                <input 
                  type="file"
                  id="comprovante"
                  className="hidden"
                  onChange={handleComprovanteChange}
                />
                <label 
                  htmlFor="comprovante"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <FileText className="h-8 w-8 text-neutral-400 mb-2" />
                  <div className="text-center">
                    <span className="text-primary-600 font-medium">Clique para anexar</span>
                    <p className="text-xs text-neutral-500 mt-1">PDF, JPEG ou PNG (máx. 2MB)</p>
                  </div>
                </label>
                
                {comprovante && (
                  <div className="mt-3 w-full">
                    <div className="flex items-center justify-between rounded-lg bg-neutral-50 p-2 text-sm">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-neutral-500 mr-2" />
                        <span className="text-neutral-700 truncate" title={comprovante.name}>
                          {comprovante.name}
                        </span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setComprovante(null)}
                        className="text-neutral-500 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Mensagem de erro geral */}
        {errors.geral && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-700">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span>{errors.geral}</span>
          </div>
        )}
        
        {/* Botões de ação */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/dashboard/financeiro"
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || success}
            className={`inline-flex items-center gap-2 rounded-lg ${success ? 'bg-green-500 hover:bg-green-600' : 'bg-primary-600 hover:bg-primary-700'} px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:bg-opacity-70`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : success ? (
              <>
                <Check className="h-4 w-4" />
                Despesa Salva
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar Despesa
              </>
            )}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
} 