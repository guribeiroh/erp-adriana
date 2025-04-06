"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "../../../../components/layout/DashboardLayout";
import { 
  ArrowLeft, 
  Calendar, 
  CreditCard, 
  CircleDollarSign, 
  Banknote, 
  FileText, 
  Save,
  Loader2,
  Search,
  User,
  DollarSign,
  Tag,
  TrendingUp,
  LinkIcon,
  Receipt
} from "lucide-react";

// Tipos
type FormaPagamento = "dinheiro" | "credito" | "debito" | "pix" | "boleto" | "transferencia";

interface VinculoVenda {
  id: string;
  cliente: string;
  valor: number;
  data: string;
}

// Dados simulados
const categoriasReceitas = [
  "Vendas", "Serviços", "Investimentos", "Outros"
];

const vendasNaoVinculadas: VinculoVenda[] = [
  { id: "V005", cliente: "Fernanda Lima", valor: 178.20, data: "2023-04-23" },
  { id: "V007", cliente: "Patrícia Costa", valor: 94.80, data: "2023-04-21" },
  { id: "V010", cliente: "Eduardo Martins", valor: 145.80, data: "2023-04-18" }
];

export default function NovaReceitaPage() {
  const router = useRouter();
  
  // Estados do formulário
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("");
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [dataRecebimento, setDataRecebimento] = useState("");
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>("dinheiro");
  const [observacoes, setObservacoes] = useState("");
  const [isRecebido, setIsRecebido] = useState(false);
  const [comprovante, setComprovante] = useState<File | null>(null);
  
  // Estados para vínculo com venda
  const [vincularVenda, setVincularVenda] = useState(false);
  const [buscaVenda, setBuscaVenda] = useState("");
  const [vendaSelecionada, setVendaSelecionada] = useState<VinculoVenda | null>(null);
  const [vendasFiltradas, setVendasFiltradas] = useState<VinculoVenda[]>([]);
  const [mostrarResultadosVenda, setMostrarResultadosVenda] = useState(false);
  
  // Estados de submissão
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
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
  
  // Handler para alternar se já foi recebido
  const handleRecebidoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsRecebido(e.target.checked);
    if (!e.target.checked) {
      setDataRecebimento("");
    } else {
      setDataRecebimento(new Date().toISOString().split('T')[0]);
    }
  };
  
  // Handler para buscar vendas
  const handleBuscaVendaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const termo = e.target.value;
    setBuscaVenda(termo);
    
    if (termo.trim() === "") {
      setVendasFiltradas([]);
    } else {
      const termoBusca = termo.toLowerCase();
      const resultados = vendasNaoVinculadas.filter(
        venda => 
          venda.id.toLowerCase().includes(termoBusca) || 
          venda.cliente.toLowerCase().includes(termoBusca)
      );
      setVendasFiltradas(resultados);
    }
    
    setMostrarResultadosVenda(true);
  };
  
  // Handler para selecionar venda
  const handleSelecionarVenda = (venda: VinculoVenda) => {
    setVendaSelecionada(venda);
    setDescricao(`Receita referente à venda ${venda.id}`);
    setValor(venda.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    setCategoria("Vendas");
    setBuscaVenda("");
    setVendasFiltradas([]);
    setMostrarResultadosVenda(false);
  };
  
  // Handler para upload de comprovante
  const handleComprovanteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setComprovante(e.target.files[0]);
    }
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
    
    if (isRecebido && !dataRecebimento) {
      newErrors.dataRecebimento = "A data de recebimento é obrigatória";
    }
    
    if (isRecebido && dataRecebimento && new Date(dataRecebimento) < new Date(data)) {
      newErrors.dataRecebimento = "A data de recebimento não pode ser anterior à data da receita";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handler para submeter o formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      // Simulação de envio para API
      setTimeout(() => {
        setIsSubmitting(false);
        setSuccess(true);
        
        // Redirecionar após sucesso
        setTimeout(() => {
          router.push("/dashboard/financeiro");
        }, 2000);
      }, 1500);
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
    <DashboardLayout title="Nova Receita">
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
            Registrar Nova Receita
          </h1>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vinculação com venda */}
          <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-medium text-neutral-900">Vínculo (Opcional)</h2>
            
            <div className="mb-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="vincular-venda"
                  checked={vincularVenda}
                  onChange={(e) => {
                    setVincularVenda(e.target.checked);
                    if (!e.target.checked) {
                      setVendaSelecionada(null);
                    }
                  }}
                  className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="vincular-venda" className="flex items-center gap-2 text-neutral-900">
                  <LinkIcon className="h-5 w-5 text-neutral-500" /> Vincular a uma venda
                </label>
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                Vincular esta receita a uma venda existente preencherá automaticamente alguns campos
              </p>
            </div>
            
            {vincularVenda && (
              <div className="space-y-4">
                {vendaSelecionada ? (
                  <div className="mb-4 flex items-center justify-between rounded-lg bg-neutral-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                        <Receipt className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">Venda {vendaSelecionada.id}</p>
                        <p className="text-sm text-neutral-600">
                          {vendaSelecionada.cliente} • {formatarValor(vendaSelecionada.valor.toString())}
                        </p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setVendaSelecionada(null)}
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
                      placeholder="Buscar venda por código ou cliente..."
                      value={buscaVenda}
                      onChange={handleBuscaVendaChange}
                      onFocus={() => setMostrarResultadosVenda(true)}
                      className="w-full rounded-lg border border-neutral-300 py-2.5 pl-10 pr-4 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    />
                    
                    {mostrarResultadosVenda && vendasFiltradas.length > 0 && (
                      <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-neutral-200 bg-white py-1 shadow-lg">
                        {vendasFiltradas.map((venda) => (
                          <button
                            key={venda.id}
                            type="button"
                            onClick={() => handleSelecionarVenda(venda)}
                            className="flex w-full items-center justify-between px-4 py-2 text-left hover:bg-neutral-50"
                          >
                            <div className="flex items-center gap-3">
                              <Receipt className="h-4 w-4 text-neutral-400" />
                              <div>
                                <p className="font-medium text-neutral-900">Venda {venda.id}</p>
                                <p className="text-sm text-neutral-600">{venda.cliente}</p>
                              </div>
                            </div>
                            <p className="font-medium text-neutral-900">{formatarValor(venda.valor.toString())}</p>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {mostrarResultadosVenda && buscaVenda.trim() !== "" && vendasFiltradas.length === 0 && (
                      <div className="absolute z-10 mt-1 w-full rounded-md border border-neutral-200 bg-white p-4 text-center text-neutral-600 shadow-lg">
                        Nenhuma venda encontrada.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Detalhes da receita */}
          <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-medium text-neutral-900">Detalhes da Receita</h2>
            
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
                  placeholder="Ex: Venda de livros, Serviço de consultoria, etc."
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
                    {categoriasReceitas.map((cat) => (
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
              
              {/* Data da receita */}
              <div>
                <label htmlFor="data" className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Data da Receita <span className="text-red-500">*</span>
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
              
              {/* Status de recebimento */}
              <div className="col-span-full">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is-recebido"
                    checked={isRecebido}
                    onChange={handleRecebidoChange}
                    className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="is-recebido" className="flex items-center gap-2 text-neutral-900">
                    <TrendingUp className="h-5 w-5 text-green-500" /> Receita já recebida
                  </label>
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  Marque esta opção se a receita já foi recebida
                </p>
              </div>
              
              {/* Data de recebimento (se já foi recebido) */}
              {isRecebido && (
                <div>
                  <label htmlFor="data-recebimento" className="mb-1.5 block text-sm font-medium text-neutral-700">
                    Data de Recebimento <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Calendar className="h-4 w-4 text-neutral-400" />
                    </div>
                    <input
                      type="date"
                      id="data-recebimento"
                      value={dataRecebimento}
                      onChange={(e) => setDataRecebimento(e.target.value)}
                      className={`w-full rounded-lg border ${errors.dataRecebimento ? 'border-red-300' : 'border-neutral-300'} py-2.5 pl-10 pr-4 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50`}
                    />
                  </div>
                  {errors.dataRecebimento && (
                    <p className="mt-1 text-xs text-red-600">{errors.dataRecebimento}</p>
                  )}
                </div>
              )}
              
              {/* Forma de pagamento (se já foi recebido) */}
              {isRecebido && (
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
              
              {/* Observações */}
              <div className="col-span-full">
                <label htmlFor="observacoes" className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Observações (Opcional)
                </label>
                <textarea
                  id="observacoes"
                  rows={3}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Informações adicionais sobre esta receita"
                  className="w-full rounded-lg border border-neutral-300 py-2.5 px-3 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                />
              </div>
              
              {/* Comprovante */}
              {isRecebido && (
                <div className="col-span-full">
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
          
          {/* Botões de ação */}
          <div className="flex justify-end gap-3">
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
                  Processando...
                </>
              ) : success ? (
                <>
                  <Save className="h-4 w-4" />
                  Receita registrada!
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4" />
                  Registrar Receita
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
} 