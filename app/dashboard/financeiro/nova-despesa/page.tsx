"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "../../../../components/layout/DashboardLayout";
import { supabase } from "@/lib/supabase/client";
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
import { createTransacao, Transacao } from "@/lib/services/financialService";

// Tipos
type FormaPagamento = "dinheiro" | "credito" | "debito" | "pix" | "boleto" | "transferencia";
type Periodicidade = "unica" | "mensal" | "trimestral" | "semestral" | "anual";

interface Fornecedor {
  id: string;
  nome: string;
  cpfCnpj: string;
}

// Dados simulados
const categoriasDespesas = [
  "Fornecedores", "Estoque", "Aluguel", "Salários", "Impostos", "Serviços", "Marketing", "Manutenção", "Outros"
];

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
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [dataVencimento, setDataVencimento] = useState("");
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Estado para verificar status do Supabase
  const [uploadStatus, setUploadStatus] = useState({
    verificando: false,
    mensagem: ''
  });
  
  // Verificar bucket de armazenamento de comprovantes
  const verificarBucketComprovantes = async () => {
    if (!supabase) return;
    
    try {
      // Verificar se o bucket 'financeiro' existe
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('Erro ao verificar buckets:', error);
        return;
      }
      
      const financeiroExists = buckets.some(bucket => bucket.name === 'financeiro');
      
      // Se o bucket não existir, criar
      if (!financeiroExists) {
        console.log('Bucket "financeiro" não existe. Criando...');
        const { data, error: createError } = await supabase.storage.createBucket('financeiro', {
          public: true, // Bucket público para que os comprovantes sejam acessíveis
          fileSizeLimit: 5 * 1024 * 1024, // Limite de 5MB por arquivo
        });
        
        if (createError) {
          console.error('Erro ao criar bucket:', createError);
        } else {
          console.log('Bucket "financeiro" criado com sucesso.');
        }
      } else {
        console.log('Bucket "financeiro" já existe.');
      }
    } catch (error) {
      console.error('Erro ao verificar/criar bucket:', error);
    }
  };
  
  // Inicializar componente
  useEffect(() => {
    // Verificar bucket assim que o componente for montado
    verificarBucketComprovantes();
  }, []);
  
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
    const newErrors: Record<string, string> = {};
    
    if (!descricao.trim()) {
      newErrors.descricao = "A descrição é obrigatória";
    }
    
    if (!valor || parseFloat(valor.replace(/\./g, "").replace(",", ".")) <= 0) {
      newErrors.valor = "O valor deve ser maior que zero";
    }
    
    if (!categoria) {
      newErrors.categoria = "A categoria é obrigatória";
    }
    
    if (!data) {
      newErrors.data = "A data é obrigatória";
    }
    
    if (!dataVencimento) {
      newErrors.dataVencimento = "A data de vencimento é obrigatória";
    }
    
    if (isPago && !dataPagamento) {
      newErrors.dataPagamento = "A data de pagamento é obrigatória";
    }
    
    if (isPago && dataPagamento && new Date(dataPagamento) < new Date(data)) {
      newErrors.dataPagamento = "A data de pagamento não pode ser anterior à data da despesa";
    }
    
    if (isDespesaRecorrente && !dataFim) {
      newErrors.dataFim = "A data de término é obrigatória para despesas recorrentes";
    }
    
    if (isDespesaRecorrente && dataFim && new Date(dataFim) <= new Date(data)) {
      newErrors.dataFim = "A data de término deve ser posterior à data inicial";
    }

    // Validação adicional para periodicidade
    if (isDespesaRecorrente && periodicidade && dataFim) {
      const dataInicial = new Date(data);
      const dataFinal = new Date(dataFim);
      
      // Calcular duração mínima baseada na periodicidade
      let duracaoMinimaMeses = 1;
      switch (periodicidade) {
        case 'trimestral':
          duracaoMinimaMeses = 3;
          break;
        case 'semestral':
          duracaoMinimaMeses = 6;
          break;
        case 'anual':
          duracaoMinimaMeses = 12;
          break;
      }
      
      // Calcular diferença em meses
      const diffMeses = (dataFinal.getFullYear() - dataInicial.getFullYear()) * 12 + 
                        (dataFinal.getMonth() - dataInicial.getMonth());
      
      if (diffMeses < duracaoMinimaMeses) {
        newErrors.dataFim = `Para periodicidade ${periodicidade}, a data de término deve ser pelo menos ${duracaoMinimaMeses} ${duracaoMinimaMeses === 1 ? 'mês' : 'meses'} após a data inicial`;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Função para fazer upload do comprovante
  const uploadComprovante = async (arquivo: File): Promise<string | null> => {
    if (!supabase) {
      console.error("Cliente Supabase não disponível");
      return null;
    }
    
    try {
      setUploadStatus({
        verificando: true,
        mensagem: 'Fazendo upload do comprovante...'
      });
      
      // Gerar nome de arquivo único baseado na data/hora
      const fileExt = arquivo.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `comprovantes/${fileName}`;
      
      // Tentar fazer upload direto para o storage
      const { data, error } = await supabase.storage
        .from('financeiro')
        .upload(filePath, arquivo, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) {
        console.error('Erro ao fazer upload do comprovante:', error);
        
        // Se falhar por questões de política de segurança, tentar abordagem alternativa
        if (error.message.includes('violates row-level security policy') || 
            error.message.includes('not authorized')) {
          
          // Opção alternativa: converter para Base64
          const reader = new FileReader();
          
          // Converter o arquivo para Base64
          const getBase64 = () => {
            return new Promise<string>((resolve, reject) => {
              reader.onloadend = () => {
                const base64String = typeof reader.result === 'string' ? reader.result : '';
                resolve(base64String);
              };
              reader.onerror = reject;
              reader.readAsDataURL(arquivo);
            });
          };
          
          // Obter string base64
          const base64String = await getBase64();
          setUploadStatus({
            verificando: false,
            mensagem: 'Comprovante processado com sucesso'
          });
          return base64String;
        }
        
        setUploadStatus({
          verificando: false,
          mensagem: `Erro no upload: ${error.message}`
        });
        return null;
      }
      
      // Se o upload foi bem-sucedido, obter a URL pública
      const { data: urlData } = supabase.storage
        .from('financeiro')
        .getPublicUrl(filePath);
        
      setUploadStatus({
        verificando: false,
        mensagem: 'Comprovante enviado com sucesso'
      });
      
      return urlData.publicUrl;
    } catch (error) {
      console.error('Erro ao processar comprovante:', error);
      setUploadStatus({
        verificando: false,
        mensagem: 'Erro ao processar o comprovante'
      });
      return null;
    }
  };
  
  // Função para criar despesas recorrentes
  const criarDespesasRecorrentes = async (
    despesaBase: Omit<Transacao, 'id'>,
    periodicidade: Periodicidade,
    dataInicio: string,
    dataFim: string
  ) => {
    // Calcular intervalo baseado na periodicidade
    const getIntervaloMeses = () => {
      switch (periodicidade) {
        case 'mensal': return 1;
        case 'trimestral': return 3;
        case 'semestral': return 6;
        case 'anual': return 12;
        default: return 1;
      }
    };
    
    const intervaloMeses = getIntervaloMeses();
    
    // Converter strings para objetos Date
    const dataInicioObj = new Date(dataInicio);
    const dataFimObj = new Date(dataFim);
    
    console.log(`Criando despesas recorrentes com intervalo de ${intervaloMeses} meses, de ${dataInicio} até ${dataFim}`);
    
    // Criar array para armazenar todas as promessas de criação de despesas
    const promessasDespesas = [];
    
    // Criar a primeira despesa (já será criada pelo código principal)
    let dataAtual = new Date(dataInicioObj);
    
    // Avançar para a próxima data
    dataAtual.setMonth(dataAtual.getMonth() + intervaloMeses);
    
    // Continuar criando despesas enquanto a data atual for menor ou igual à data final
    while (dataAtual <= dataFimObj) {
      // Formatar a data para YYYY-MM-DD
      const dataFormatada = dataAtual.toISOString().split('T')[0];
      
      // Calcular nova data de vencimento baseado na diferença entre data inicial e vencimento
      let dataVencimentoNova = undefined;
      if (despesaBase.dataVencimento) {
        const dataInicialObj = new Date(dataInicio);
        const dataVencimentoObj = new Date(despesaBase.dataVencimento);
        
        // Calcular diferença em dias
        const diferencaDias = Math.floor(
          (dataVencimentoObj.getTime() - dataInicialObj.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        // Aplicar mesma diferença para a nova data
        const novaDataVencimento = new Date(dataAtual);
        novaDataVencimento.setDate(novaDataVencimento.getDate() + diferencaDias);
        dataVencimentoNova = novaDataVencimento.toISOString().split('T')[0];
      }
      
      // Criar cópia da despesa base com nova data
      const despesaRecorrente = {
        ...despesaBase,
        data: dataFormatada,
        dataVencimento: dataVencimentoNova || dataFormatada,
        observacoes: (despesaBase.observacoes || '') + ` (Parcela recorrente - ${periodicidade})`
      };
      
      console.log(`Criando parcela com data ${dataFormatada}`);
      
      // Adicionar promessa para criar despesa
      promessasDespesas.push(createTransacao(despesaRecorrente));
      
      // Avançar para a próxima data
      dataAtual.setMonth(dataAtual.getMonth() + intervaloMeses);
    }
    
    // Esperar todas as despesas serem criadas
    if (promessasDespesas.length > 0) {
      try {
        const despesasCriadas = await Promise.all(promessasDespesas);
        console.log(`${despesasCriadas.length} parcelas recorrentes criadas com sucesso`);
        return despesasCriadas;
      } catch (error) {
        console.error('Erro ao criar despesas recorrentes:', error);
        throw error;
      }
    }
    
    return [];
  };
  
  // Handler para submeter o formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      try {
        // Preparar objeto de transação
        const valorNumerico = parseFloat(valor.replace(/\./g, "").replace(",", "."));
        
        // Upload do comprovante (se existir)
        let urlComprovante: string | undefined = undefined;
        if (isPago && comprovante) {
          const url = await uploadComprovante(comprovante);
          if (url) {
            urlComprovante = url;
          }
        }
        
        const novaDespesa = {
          descricao,
          valor: valorNumerico,
          data,
          dataVencimento,
          dataPagamento: isPago ? dataPagamento : undefined,
          tipo: "despesa" as const,
          categoria,
          status: isPago ? "confirmada" as const : "pendente" as const,
          formaPagamento: isPago ? formaPagamento : undefined,
          observacoes: observacoes || undefined,
          vinculoId: fornecedorSelecionado?.id,
          vinculoTipo: fornecedorSelecionado ? "compra" as const : undefined,
          comprovante: urlComprovante
        };
        
        // Criar a transação
        const transacaoCriada = await createTransacao(novaDespesa);
        
        console.log("Despesa registrada com sucesso:", transacaoCriada);
        
        // Se for despesa recorrente, criar as parcelas futuras
        if (isDespesaRecorrente && dataFim) {
          try {
            await criarDespesasRecorrentes(novaDespesa, periodicidade, data, dataFim);
          } catch (erroRecorrencia) {
            console.error("Erro ao criar despesas recorrentes:", erroRecorrencia);
            // Continuar mesmo com erro nas parcelas recorrentes
          }
        }
        
        setSuccess(true);
        
        // Redirecionar após sucesso
        setTimeout(() => {
          router.push("/dashboard/financeiro");
        }, 2000);
      } catch (error) {
        console.error("Erro ao registrar despesa:", error);
        setErrors({
          ...errors,
          form: "Erro ao registrar despesa. Tente novamente."
        });
        setIsSubmitting(false);
      }
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
                    value={data}
                    onChange={(e) => setData(e.target.value)}
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
                    value={dataVencimento}
                    onChange={(e) => setDataVencimento(e.target.value)}
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
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-100 ${uploadStatus.verificando ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <FileText className="h-5 w-5 text-neutral-500" />
                      {comprovante ? comprovante.name : "Anexar comprovante (PDF, JPG ou PNG)"}
                    </label>
                    {comprovante && !uploadStatus.verificando && (
                      <button
                        type="button"
                        onClick={() => setComprovante(null)}
                        className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                      >
                        Remover
                      </button>
                    )}
                    {uploadStatus.verificando && (
                      <div className="flex items-center space-x-2 text-sm text-primary-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Processando...</span>
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    Anexe um comprovante de pagamento (tamanho máximo: 5MB)
                  </p>
                  {uploadStatus.mensagem && !uploadStatus.verificando && (
                    <p className="mt-1 text-xs text-primary-600">{uploadStatus.mensagem}</p>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Botões de ação */}
          <div className="flex justify-end gap-3">
            {errors.form && (
              <div className="mr-auto rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {errors.form}
                </div>
              </div>
            )}
            <Link
              href="/dashboard/financeiro"
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || success}
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700 disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isDespesaRecorrente ? 'Criando parcelas...' : 'Processando...'}
                </>
              ) : success ? (
                <>
                  <Save className="h-4 w-4" />
                  {isDespesaRecorrente ? 'Parcelas registradas!' : 'Despesa registrada!'}
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4" />
                  Registrar Despesa {isDespesaRecorrente ? 'Recorrente' : ''}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
} 