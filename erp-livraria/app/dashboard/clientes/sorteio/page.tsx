"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../../../components/layout/DashboardLayout";
import { 
  ArrowLeft, 
  Calendar, 
  Gift, 
  Shuffle, 
  Users, 
  Trophy,
  Cake,
  RefreshCw,
  AlertTriangle,
  PartyPopper,
  Eye,
  EyeOff,
  Phone
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Customer } from "@/models/database.types";

// Meses em português
const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function SorteioAniversariantesPage() {
  const router = useRouter();
  const [mesSelecionado, setMesSelecionado] = useState<number>(new Date().getMonth());
  const [clientes, setClientes] = useState<Customer[]>([]);
  const [aniversariantes, setAniversariantes] = useState<Customer[]>([]);
  const [clienteSorteado, setClienteSorteado] = useState<Customer | null>(null);
  const [animandoSorteio, setAnimandoSorteio] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [historico, setHistorico] = useState<Customer[]>([]);
  const [realizandoSorteio, setRealizandoSorteio] = useState(false);
  const [mostraTelefone, setMostraTelefone] = useState(false);

  // Carregar clientes do Supabase
  useEffect(() => {
    async function carregarClientes() {
      try {
        setCarregando(true);
        setErro(null);
        
        if (!supabase) {
          throw new Error("Cliente Supabase não disponível");
        }
        
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .not('birthday', 'is', null)
          .order('name');
        
        if (error) {
          throw new Error(`Erro ao carregar clientes: ${error.message}`);
        }
        
        setClientes(data || []);
      } catch (error) {
        console.error("Erro ao carregar clientes:", error);
        setErro(error instanceof Error ? error.message : "Erro desconhecido");
      } finally {
        setCarregando(false);
      }
    }
    
    carregarClientes();
  }, []);
  
  // Filtrar aniversariantes quando o mês mudar
  useEffect(() => {
    filtrarAniversariantes();
  }, [mesSelecionado, clientes]);
  
  // Função para filtrar aniversariantes do mês
  const filtrarAniversariantes = () => {
    if (clientes.length === 0) return;
    
    const aniversariantesFiltrados = clientes.filter(cliente => {
      if (!cliente.birthday) return false;
      
      const data = new Date(cliente.birthday);
      const mes = data.getMonth();
      
      return mes === mesSelecionado;
    });
    
    setAniversariantes(aniversariantesFiltrados);
    setClienteSorteado(null);
  };
  
  // Função para formatar data
  const formatarData = (dataString: string): string => {
    if (!dataString) return "Data não informada";
    
    try {
      const data = new Date(dataString);
      return data.toLocaleDateString('pt-BR');
    } catch (error) {
      return "Data inválida";
    }
  };
  
  // Função para realizar o sorteio
  const realizarSorteio = () => {
    if (aniversariantes.length === 0) {
      alert("Não há aniversariantes no mês selecionado para realizar o sorteio.");
      return;
    }
    
    setAnimandoSorteio(true);
    setRealizandoSorteio(true);
    
    // Animação de sorteio passando por vários clientes rapidamente
    let contador = 0;
    const intervalo = 100; // 100ms entre cada cliente exibido
    const duracao = 2000; // duração total da animação em ms
    
    const intervalId = setInterval(() => {
      contador += intervalo;
      
      // Selecionar um cliente aleatório para mostrar durante a animação
      const indiceAleatorio = Math.floor(Math.random() * aniversariantes.length);
      setClienteSorteado(aniversariantes[indiceAleatorio]);
      
      // Quando atingir a duração total, parar a animação e selecionar o vencedor final
      if (contador >= duracao) {
        clearInterval(intervalId);
        
        // Selecionar o vencedor final
        const indiceVencedor = Math.floor(Math.random() * aniversariantes.length);
        const vencedor = aniversariantes[indiceVencedor];
        
        setClienteSorteado(vencedor);
        setHistorico(prev => [vencedor, ...prev]);
        setAnimandoSorteio(false);
        setRealizandoSorteio(false);
      }
    }, intervalo);
  };
  
  // Função para limpar o sorteio atual
  const limparSorteio = () => {
    setClienteSorteado(null);
  };
  
  // Função para recarregar os dados
  const recarregarDados = async () => {
    try {
      setCarregando(true);
      setErro(null);
      
      if (!supabase) {
        throw new Error("Cliente Supabase não disponível");
      }
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .not('birthday', 'is', null)
        .order('name');
      
      if (error) {
        throw new Error(`Erro ao carregar clientes: ${error.message}`);
      }
      
      setClientes(data || []);
      filtrarAniversariantes();
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      setErro(error instanceof Error ? error.message : "Erro desconhecido");
    } finally {
      setCarregando(false);
    }
  };

  // Render de carregamento
  if (carregando && clientes.length === 0) {
    return (
      <DashboardLayout title="Sorteio de Aniversariantes">
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-neutral-300 border-t-primary-600"></div>
            <p className="text-neutral-600">Carregando clientes...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Render de erro
  if (erro && clientes.length === 0) {
    return (
      <DashboardLayout title="Sorteio de Aniversariantes">
        <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border border-neutral-200 bg-white p-6">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-neutral-900">Erro ao carregar clientes</h2>
          <p className="mb-6 text-neutral-600">{erro}</p>
          <div className="flex gap-3">
            <button
              onClick={recarregarDados}
              className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Sorteio de Aniversariantes">
      <div className="space-y-6">
        {/* Cabeçalho e navegação de volta */}
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard/clientes" 
            className="rounded-full p-1.5 text-neutral-700 hover:bg-neutral-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900">
            Sorteio de Aniversariantes
          </h1>
        </div>
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Coluna da esquerda - Configuração do sorteio */}
          <div className="lg:col-span-1 space-y-6">
            {/* Seleção de mês */}
            <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-primary-500" />
                <h2 className="text-lg font-medium text-neutral-900">Selecione o Mês</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="mes" className="block text-sm font-medium text-neutral-700 mb-1">
                    Mês de Aniversário
                  </label>
                  <select
                    id="mes"
                    value={mesSelecionado}
                    onChange={(e) => setMesSelecionado(Number(e.target.value))}
                    className="w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    {MESES.map((mes, index) => (
                      <option key={index} value={index}>
                        {mes}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <p className="text-sm text-neutral-600 mb-2">
                    Total de aniversariantes: <span className="font-semibold">{aniversariantes.length}</span>
                  </p>
                  <button
                    onClick={realizarSorteio}
                    disabled={aniversariantes.length === 0 || realizandoSorteio}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 font-medium text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {realizandoSorteio ? (
                      <>
                        <Shuffle className="h-5 w-5 animate-spin" />
                        Sorteando...
                      </>
                    ) : (
                      <>
                        <Gift className="h-5 w-5" />
                        Realizar Sorteio
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Lista de aniversariantes */}
            <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Cake className="h-5 w-5 text-primary-500" />
                <h2 className="text-lg font-medium text-neutral-900">Aniversariantes do Mês</h2>
              </div>
              
              <div className="divide-y divide-neutral-200">
                {aniversariantes.length > 0 ? (
                  aniversariantes.map((cliente) => (
                    <div 
                      key={cliente.id} 
                      className="py-3 hover:bg-neutral-50 px-2 rounded-md"
                    >
                      <div className="flex items-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                          <Users className="h-4 w-4" />
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-neutral-900">{cliente.name}</p>
                          <p className="text-sm text-neutral-500">
                            {formatarData(cliente.birthday || "")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-neutral-500">Nenhum aniversariante em {MESES[mesSelecionado]}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Coluna da direita - Resultados */}
          <div className="lg:col-span-2 space-y-6">
            {/* Resultado do sorteio */}
            <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg font-medium text-neutral-900">Resultado do Sorteio</h2>
              </div>
              
              {clienteSorteado ? (
                <div className="flex flex-col items-center justify-center py-6">
                  <div className="flex justify-center mb-4">
                    {animandoSorteio ? (
                      <div className="h-16 w-16 animate-spin rounded-full border-4 border-neutral-300 border-t-primary-600"></div>
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                        <PartyPopper className="h-10 w-10" />
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center">
                    <h3 className="text-2xl font-semibold text-neutral-900 mb-2">
                      {clienteSorteado.name}
                    </h3>
                    <p className="text-neutral-600">
                      Aniversário: {formatarData(clienteSorteado.birthday || "")}
                    </p>
                    {!animandoSorteio && (
                      <div className="mt-4 space-y-2">
                        {clienteSorteado.phone && (
                          <div className="flex items-center justify-center gap-2">
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-4 w-4 text-primary-600" />
                              <span className="text-primary-600">
                                {mostraTelefone ? clienteSorteado.phone : "•••••-••••"}
                              </span>
                            </div>
                            <button 
                              onClick={() => setMostraTelefone(!mostraTelefone)}
                              className="p-1 rounded-full hover:bg-neutral-100 text-neutral-500 hover:text-primary-600 transition-colors"
                              title={mostraTelefone ? "Ocultar telefone" : "Mostrar telefone"}
                            >
                              {mostraTelefone ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {!animandoSorteio && (
                    <div className="mt-6">
                      <button
                        onClick={realizarSorteio}
                        className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
                      >
                        <Shuffle className="h-4 w-4" />
                        Sortear Novamente
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 mb-4">
                    <Gift className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-medium text-neutral-900 mb-2">
                    Nenhum cliente sorteado
                  </h3>
                  <p className="text-neutral-600 max-w-md">
                    Selecione um mês e clique em "Realizar Sorteio" para escolher aleatoriamente um aniversariante do mês.
                  </p>
                </div>
              )}
            </div>
            
            {/* Histórico de sorteios */}
            {historico.length > 0 && (
              <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-5 w-5 text-primary-500" />
                  <h2 className="text-lg font-medium text-neutral-900">Histórico de Sorteios</h2>
                </div>
                
                <div className="divide-y divide-neutral-200">
                  {historico.map((cliente, index) => (
                    <div key={`${cliente.id}-${index}`} className="py-3 flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                          <Trophy className="h-4 w-4" />
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-neutral-900">{cliente.name}</p>
                          <p className="text-sm text-neutral-500">
                            {formatarData(cliente.birthday || "")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 