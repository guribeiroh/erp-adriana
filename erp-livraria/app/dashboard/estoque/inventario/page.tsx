"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../../../components/layout/DashboardLayout";
import { ArrowLeft, Search, Package, Check, X, BarChart, Loader2, FileText, Calendar, User, AlertCircle, CheckCircle } from "lucide-react";
import { bookService, Book } from "@/lib/services/bookService";
import { stockService } from "@/lib/services/stockService";
import { supabase } from "@/lib/supabase/client";

interface AjusteEstoque {
  id: string;
  title: string;
  estoqueAtual: number;
  estoqueReal: number;
  diferenca: number;
}

export default function InventarioPage() {
  const router = useRouter();
  
  // Estados para livros
  const [livros, setLivros] = useState<Book[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);
  const [usuarioLogado, setUsuarioLogado] = useState<any>(null);
  
  // Estados para filtro e busca
  const [busca, setBusca] = useState("");
  const [livrosFiltrados, setLivrosFiltrados] = useState<Book[]>([]);
  
  // Estados para o formulário de inventário
  const [livrosAjustados, setLivrosAjustados] = useState<{
    [id: string]: AjusteEstoque
  }>({});
  
  const [motivo, setMotivo] = useState("ajuste");
  const [responsavel, setResponsavel] = useState("");
  const [data, setData] = useState<string>(new Date().toISOString().split('T')[0]);
  const [observacao, setObservacao] = useState("");

  // Estados para controle do processo
  const [etapa, setEtapa] = useState<"selecao" | "confirmacao" | "concluido">("selecao");
  const [enviando, setEnviando] = useState(false);
  const [erros, setErros] = useState<{[key: string]: string}>({});
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  
  // Buscar livros e usuário logado
  useEffect(() => {
    const fetchData = async () => {
      setCarregando(true);
      setErro(null);
      
      try {
        // Buscar usuário logado
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Buscar dados completos do usuário
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (userData) {
            setUsuarioLogado(userData);
            setResponsavel(userData.name || session.user.email!);
          } else {
            setResponsavel(session.user.email!);
          }
        }
        
        // Buscar todos os livros
        const response = await bookService.getAll();
        
        if (response.status === 'error' || !response.data) {
          throw new Error(response.error || 'Erro ao buscar livros');
        }
        
        setLivros(response.data);
        setLivrosFiltrados(response.data);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        setErro(error instanceof Error ? error.message : 'Erro ao buscar dados');
      } finally {
        setCarregando(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Filtrar livros baseado na busca
  useEffect(() => {
    if (busca.trim()) {
      const termoBusca = busca.toLowerCase();
      const resultados = livros.filter(
        livro => livro.title.toLowerCase().includes(termoBusca) || 
               livro.isbn.toLowerCase().includes(termoBusca) ||
               livro.author.toLowerCase().includes(termoBusca)
      );
      setLivrosFiltrados(resultados);
    } else {
      setLivrosFiltrados(livros);
    }
  }, [busca, livros]);
  
  // Atualizar estoque real de um livro
  const atualizarEstoqueReal = (id: string, estoqueReal: number) => {
    const livro = livros.find(l => l.id === id);
    if (!livro) return;
    
    // Não permitir valores negativos
    if (estoqueReal < 0) {
      estoqueReal = 0;
    }
    
    const diferenca = estoqueReal - livro.quantity;
    
    setLivrosAjustados(prev => {
      // Se o estoque real for igual ao atual, remover do objeto de livros ajustados
      if (estoqueReal === livro.quantity) {
        const newState = {...prev};
        delete newState[id];
        return newState;
      }
      
      return {
        ...prev,
        [id]: {
          id,
          title: livro.title,
          estoqueAtual: livro.quantity,
          estoqueReal,
          diferenca
        }
      };
    });
  };
  
  // Verificar se há algum produto ajustado
  const temLivrosAjustados = () => {
    return Object.keys(livrosAjustados).length > 0;
  };
  
  // Avançar para confirmação
  const avancarParaConfirmacao = () => {
    if (!temLivrosAjustados()) {
      setMensagemErro("Selecione pelo menos um livro para ajustar o estoque.");
      return;
    }
    
    setMensagemErro(null);
    setEtapa("confirmacao");
    
    // Rolar para o topo da página
    window.scrollTo(0, 0);
  };
  
  // Validar formulário de confirmação
  const validarFormulario = () => {
    const novosErros: {[key: string]: string} = {};
    
    if (!motivo.trim()) {
      novosErros.motivo = "O motivo do ajuste é obrigatório";
    }
    
    if (!responsavel.trim()) {
      novosErros.responsavel = "O responsável pelo ajuste é obrigatório";
    }
    
    if (!data) {
      novosErros.data = "A data do ajuste é obrigatória";
    }
    
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };
  
  // Finalizar ajuste de inventário
  const finalizarAjuste = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validarFormulario()) {
      setEnviando(true);
      setMensagemErro(null);
      
      try {
        // Para cada livro ajustado, chamar o serviço de ajuste de inventário
        const ajustes = Object.values(livrosAjustados);
        
        // Array para armazenar as promessas de ajuste
        const ajustesPromises = [];
        
        for (const ajuste of ajustes) {
          const notaAjuste = `${observacao ? observacao + ' - ' : ''}Inventário: ${ajuste.estoqueAtual} → ${ajuste.estoqueReal}`;
          
          const ajustePromise = stockService.adjustInventory(
            ajuste.id,
            ajuste.estoqueReal,
            responsavel,
            notaAjuste
          );
          
          ajustesPromises.push(ajustePromise);
        }
        
        // Executar todos os ajustes
        const resultados = await Promise.all(ajustesPromises);
        
        // Verificar se algum ajuste falhou
        const erros = resultados.filter(r => r.status === 'error');
        
        if (erros.length > 0) {
          throw new Error(`${erros.length} ajustes falharam. Verifique o log para mais detalhes.`);
        }
        
        // Se chegou aqui, todos os ajustes foram bem-sucedidos
        setEtapa("concluido");
        
        // Redirecionar após 2 segundos
        setTimeout(() => {
          router.push("/dashboard/estoque");
        }, 2000);
      } catch (error) {
        console.error('Erro ao processar ajustes de inventário:', error);
        setMensagemErro(error instanceof Error ? error.message : 'Erro ao processar ajustes de inventário');
      } finally {
        setEnviando(false);
      }
    }
  };
  
  // Calcular totais do ajuste
  const calcularTotais = () => {
    const ajustes = Object.values(livrosAjustados);
    const totalProdutos = ajustes.length;
    const totalAcrescimos = ajustes.filter(a => a.diferenca > 0).length;
    const totalReducoes = ajustes.filter(a => a.diferenca < 0).length;
    
    const diferencaTotal = ajustes.reduce((total, ajuste) => total + ajuste.diferenca, 0);
    
    return {
      totalProdutos,
      totalAcrescimos,
      totalReducoes,
      diferencaTotal
    };
  };
  
  return (
    <DashboardLayout title="Ajuste de Inventário">
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              href="/dashboard/estoque" 
              className="rounded-full p-1.5 text-neutral-700 hover:bg-neutral-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-neutral-900">
              Ajuste de Inventário
            </h1>
          </div>
        </div>
        
        {/* Mensagem de carregamento */}
        {carregando && (
          <div className="flex h-40 items-center justify-center rounded-lg border border-neutral-200 bg-white shadow-sm">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary-500" />
            <p className="text-neutral-600">Carregando dados dos livros...</p>
          </div>
        )}
        
        {/* Mensagem de erro */}
        {mensagemErro && (
          <div className="rounded-lg bg-red-50 p-4">
            <div className="flex items-center">
              <AlertCircle className="mr-3 h-5 w-5 text-red-500" />
              <h3 className="font-medium text-red-800">Erro</h3>
            </div>
            <p className="mt-1 ml-8 text-red-700">{mensagemErro}</p>
          </div>
        )}
        
        {/* Mensagem de sucesso */}
        {etapa === "concluido" && (
          <div className="rounded-lg bg-green-50 p-4 text-center">
            <div className="mb-2 flex justify-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-lg font-medium text-green-800">Ajuste de inventário realizado com sucesso!</h3>
            <p className="mt-1 text-green-700">
              Você será redirecionado para a lista de estoque em instantes...
            </p>
          </div>
        )}
        
        {/* Etapa de seleção de produtos */}
        {!carregando && !erro && etapa === "selecao" && (
          <>
            <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="text-lg font-medium text-neutral-900">Selecione os livros para ajuste</h2>
                <p className="text-sm text-neutral-500">
                  Informe a quantidade real em estoque para os livros que precisam de ajuste.
                </p>
              </div>
              
              {/* Busca */}
              <div className="mb-6">
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    type="text"
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                    placeholder="Buscar por título, autor ou ISBN..."
                    className="block w-full rounded-lg border border-neutral-300 bg-white py-2 pl-10 pr-3 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>
              
              {/* Lista de livros */}
              <div className="overflow-hidden rounded-lg border border-neutral-200">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="border-b border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-500">Título</th>
                        <th className="border-b border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-500">ISBN</th>
                        <th className="border-b border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-500">Estoque Atual</th>
                        <th className="border-b border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-500">Estoque Real</th>
                        <th className="border-b border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-500">Diferença</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {livrosFiltrados.length > 0 ? (
                        livrosFiltrados.map((livro) => {
                          const ajuste = livrosAjustados[livro.id];
                          const estoqueReal = ajuste ? ajuste.estoqueReal : livro.quantity;
                          const diferenca = ajuste ? ajuste.diferenca : 0;
                          
                          return (
                            <tr key={livro.id} className="hover:bg-neutral-50">
                              <td className="px-4 py-3">
                                <div className="font-medium text-neutral-900">{livro.title}</div>
                                <div className="text-sm text-neutral-500">{livro.author}</div>
                              </td>
                              <td className="px-4 py-3 text-neutral-700">{livro.isbn}</td>
                              <td className="px-4 py-3 font-medium text-neutral-900">{livro.quantity}</td>
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  min="0"
                                  value={estoqueReal}
                                  onChange={(e) => atualizarEstoqueReal(livro.id, parseInt(e.target.value) || 0)}
                                  className={`w-24 rounded-md border ${
                                    diferenca !== 0 
                                      ? diferenca > 0 
                                        ? 'border-green-300 bg-green-50' 
                                        : 'border-amber-300 bg-amber-50'
                                      : 'border-neutral-300 bg-white'
                                  } py-1 px-2 text-center text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500`}
                                />
                              </td>
                              <td className="px-4 py-3">
                                {diferenca === 0 ? (
                                  <span className="text-neutral-500">-</span>
                                ) : (
                                  <span className={`font-medium ${
                                    diferenca > 0 ? 'text-green-600' : 'text-amber-600'
                                  }`}>
                                    {diferenca > 0 ? '+' : ''}{diferenca}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-neutral-500">
                            Nenhum livro encontrado com os termos da busca.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            {/* Resumo e botão de avançar */}
            <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
              <div>
                <p className="text-sm text-neutral-600">
                  Livros selecionados para ajuste: <span className="font-medium">{Object.keys(livrosAjustados).length}</span>
                </p>
                {temLivrosAjustados() && (
                  <p className="text-xs text-neutral-500">
                    Diferença total: <span className={`font-medium ${
                      calcularTotais().diferencaTotal > 0 ? 'text-green-600' : calcularTotais().diferencaTotal < 0 ? 'text-amber-600' : ''
                    }`}>{calcularTotais().diferencaTotal > 0 ? '+' : ''}{calcularTotais().diferencaTotal}</span> itens
                  </p>
                )}
              </div>
              
              <button
                type="button"
                onClick={avancarParaConfirmacao}
                disabled={!temLivrosAjustados()}
                className="rounded-lg bg-primary-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
              >
                Avançar para Confirmação
              </button>
            </div>
          </>
        )}
        
        {/* Etapa de confirmação */}
        {!carregando && !erro && etapa === "confirmacao" && (
          <form onSubmit={finalizarAjuste} className="space-y-6">
            {/* Resumo do ajuste */}
            <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-medium text-neutral-900">Resumo do Ajuste de Inventário</h2>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-sm text-neutral-500">Total de produtos</p>
                  <p className="mt-1 text-2xl font-semibold text-neutral-900">{calcularTotais().totalProdutos}</p>
                </div>
                
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-sm text-neutral-500">Diferença total</p>
                  <p className={`mt-1 text-2xl font-semibold ${
                    calcularTotais().diferencaTotal > 0 
                      ? 'text-green-600' 
                      : calcularTotais().diferencaTotal < 0 
                        ? 'text-amber-600' 
                        : 'text-neutral-900'
                  }`}>
                    {calcularTotais().diferencaTotal > 0 ? '+' : ''}{calcularTotais().diferencaTotal}
                  </p>
                </div>
                
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-sm text-neutral-500">Acréscimos</p>
                  <p className="mt-1 text-2xl font-semibold text-green-600">{calcularTotais().totalAcrescimos}</p>
                </div>
                
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-sm text-neutral-500">Reduções</p>
                  <p className="mt-1 text-2xl font-semibold text-amber-600">{calcularTotais().totalReducoes}</p>
                </div>
              </div>
              
              {/* Lista de livros ajustados */}
              <div className="mt-6 overflow-hidden rounded-lg border border-neutral-200">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="border-b border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-500">Título</th>
                        <th className="border-b border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-500">Estoque Atual</th>
                        <th className="border-b border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-500">Estoque Real</th>
                        <th className="border-b border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-500">Diferença</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {Object.values(livrosAjustados).map((ajuste) => (
                        <tr key={ajuste.id} className="hover:bg-neutral-50">
                          <td className="px-4 py-3 font-medium text-neutral-900">{ajuste.title}</td>
                          <td className="px-4 py-3 text-neutral-700">{ajuste.estoqueAtual}</td>
                          <td className="px-4 py-3 text-neutral-700">{ajuste.estoqueReal}</td>
                          <td className="px-4 py-3">
                            <span className={`font-medium ${
                              ajuste.diferenca > 0 ? 'text-green-600' : 'text-amber-600'
                            }`}>
                              {ajuste.diferenca > 0 ? '+' : ''}{ajuste.diferenca}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            {/* Informações adicionais */}
            <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-medium text-neutral-900">Informações Adicionais</h2>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="responsavel" className="block text-sm font-medium text-neutral-700">
                    Responsável <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <User className="h-5 w-5 text-neutral-400" />
                    </div>
                    <input
                      type="text"
                      id="responsavel"
                      value={responsavel}
                      onChange={(e) => setResponsavel(e.target.value)}
                      className={`block w-full rounded-lg border pl-10 py-2 text-neutral-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                        erros.responsavel ? 'border-red-300' : 'border-neutral-300'
                      }`}
                    />
                    {erros.responsavel && (
                      <p className="mt-1 text-sm text-red-600">{erros.responsavel}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="data" className="block text-sm font-medium text-neutral-700">
                    Data <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Calendar className="h-5 w-5 text-neutral-400" />
                    </div>
                    <input
                      type="date"
                      id="data"
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                      className={`block w-full rounded-lg border pl-10 py-2 text-neutral-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                        erros.data ? 'border-red-300' : 'border-neutral-300'
                      }`}
                    />
                    {erros.data && (
                      <p className="mt-1 text-sm text-red-600">{erros.data}</p>
                    )}
                  </div>
                </div>
                
                <div className="sm:col-span-2">
                  <label htmlFor="observacao" className="block text-sm font-medium text-neutral-700">
                    Observações (opcional)
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="observacao"
                      rows={3}
                      value={observacao}
                      onChange={(e) => setObservacao(e.target.value)}
                      placeholder="Informações adicionais sobre o motivo do ajuste..."
                      className="block w-full rounded-lg border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Botões de ação */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEtapa("selecao")}
                className="rounded-lg border border-neutral-300 bg-white px-4 py-2 font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                Voltar
              </button>
              
              <button
                type="submit"
                disabled={enviando}
                className="rounded-lg bg-primary-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {enviando ? (
                  <div className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </div>
                ) : (
                  'Confirmar Ajuste'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
} 