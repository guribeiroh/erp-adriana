"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from "../../../../components/layout/DashboardLayout";
import { 
  ArrowLeft, 
  FileText, 
  Upload, 
  Check, 
  X, 
  Printer, 
  Download,
  Banknote,
  Calendar,
  Tag,
  CreditCard,
  AlertCircle
} from "lucide-react";
import { 
  fetchTransacaoById, 
  Transacao, 
  TransacaoTipo,
  TransacaoStatus,
  FormaPagamento
} from "@/lib/services/financialService";
import { formatBrazilianDate } from '@/lib/utils/date';

// Componente de carregamento
function DetalhesTransacaoLoading() {
  return (
    <DashboardLayout title="Detalhes da Transação">
      <div className="p-4">
        <div className="mb-4">
          <Link href="/dashboard/financeiro" className="inline-flex items-center text-sm text-neutral-600 hover:text-neutral-800">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar para Financeiro
          </Link>
        </div>
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-neutral-300 border-t-primary-600 mx-auto"></div>
            <p className="text-neutral-600">Carregando detalhes da transação...</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Componente principal
function DetalhesTransacaoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [transacao, setTransacao] = useState<Transacao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  
  useEffect(() => {
    async function carregarTransacao() {
      try {
        setCarregando(true);
        setErro(null);
        
        console.log('Buscando transação com ID:', id);
        const result = await fetchTransacaoById(id);
        setTransacao(result);
        
        console.log('Transação carregada:', result);
      } catch (error) {
        console.error("Erro ao carregar transação:", error);
        setErro(error instanceof Error ? error.message : "Erro desconhecido");
      } finally {
        setCarregando(false);
      }
    }
    
    if (id) {
      carregarTransacao();
    }
  }, [id]);
  
  // Formatadores
  const formatarData = (dataString: string) => {
    return formatBrazilianDate(dataString);
  };
  
  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };
  
  return (
    <DashboardLayout title={`${transacao?.tipo === 'receita' ? 'Receita' : 'Despesa'} #${id}`}>
      <div className="p-4">
        <div className="mb-4">
          <Link href="/dashboard/financeiro" className="inline-flex items-center text-sm text-neutral-600 hover:text-neutral-800">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar para Financeiro
          </Link>
        </div>
        
        {carregando ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-primary-600" />
          </div>
        ) : erro ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
            <h3 className="mt-2 text-lg font-medium text-red-800">Erro ao carregar transação</h3>
            <p className="mt-1 text-red-700">{erro}</p>
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => router.back()}
                className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Voltar
              </button>
              <button
                onClick={() => router.refresh()}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        ) : !transacao ? (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-yellow-500" />
            <h3 className="mt-2 text-lg font-medium text-yellow-800">Transação não encontrada</h3>
            <p className="mt-1 text-yellow-700">Não foi possível encontrar a transação com o ID: {id}</p>
            <div className="mt-4">
              <Link
                href="/dashboard/financeiro"
                className="inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
              >
                Voltar para visão geral
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="rounded-lg border border-neutral-200 bg-white shadow-sm">
                <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3">
                  <h2 className="text-lg font-medium text-neutral-800">
                    Detalhes da {transacao.tipo === 'receita' ? 'Receita' : 'Despesa'}
                  </h2>
                </div>
                
                <div className="p-4">
                  <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500">Tipo</h3>
                      <p className="mt-1 text-neutral-800">
                        {transacao.tipo === 'receita' ? (
                          <span className="inline-flex items-center text-green-700">
                            <Banknote className="mr-1 h-4 w-4" />
                            Receita
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-red-700">
                            <CreditCard className="mr-1 h-4 w-4" />
                            Despesa
                          </span>
                        )}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500">Status</h3>
                      <p className="mt-1">
                        <StatusBadge status={transacao.status} />
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500">Descrição</h3>
                      <p className="mt-1 text-neutral-800">
                        {transacao.descricao}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500">Valor</h3>
                      <p className={`mt-1 font-medium ${transacao.tipo === 'receita' ? 'text-green-700' : 'text-red-700'}`}>
                        {formatarValor(transacao.valor)}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500">Data</h3>
                      <p className="mt-1 inline-flex items-center text-neutral-800">
                        <Calendar className="mr-1 h-4 w-4 text-neutral-400" />
                        {formatarData(transacao.data)}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500">Categoria</h3>
                      <p className="mt-1 inline-flex items-center text-neutral-800">
                        <Tag className="mr-1 h-4 w-4 text-neutral-400" />
                        {transacao.categoria}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500">Método de Pagamento</h3>
                      <p className="mt-1 inline-flex items-center text-neutral-800">
                        <CreditCard className="mr-1 h-4 w-4 text-neutral-400" />
                        {transacao.formaPagamento === 'dinheiro' && 'Dinheiro'}
                        {transacao.formaPagamento === 'cartao' && 'Cartão'}
                        {transacao.formaPagamento === 'pix' && 'PIX'}
                        {transacao.formaPagamento === 'transferencia' && 'Transferência'}
                        {transacao.formaPagamento === 'boleto' && 'Boleto'}
                      </p>
                    </div>
                  </div>
                  
                  {transacao.observacoes && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-neutral-500">Observações</h3>
                      <p className="mt-1 rounded-lg bg-neutral-50 p-3 text-neutral-800">
                        {transacao.observacoes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div>
              <div className="rounded-lg border border-neutral-200 bg-white shadow-sm">
                <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3">
                  <h2 className="text-lg font-medium text-neutral-800">
                    Informações adicionais
                  </h2>
                </div>
                
                <div className="p-4">
                  {transacao.tipo === 'receita' && transacao.linkVenda && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-neutral-500">Venda relacionada</h3>
                      <div className="mt-2">
                        <Link
                          href={transacao.linkVenda.startsWith('/dashboard') ? transacao.linkVenda : `/dashboard/vendas/${transacao.vinculoId}`}
                          className="inline-block w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-center text-sm font-medium text-primary-700 hover:bg-neutral-50"
                        >
                          Ver venda #{transacao.vinculoId || transacao.venda}
                        </Link>
                      </div>
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-neutral-500">Comprovante</h3>
                    {transacao.comprovante ? (
                      <div className="mt-2">
                        <a
                          href={transacao.comprovante}
                          target="_blank"
                          className="inline-flex w-full items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-primary-700 hover:bg-neutral-50"
                        >
                          <Download className="mr-1 h-4 w-4" />
                          Baixar comprovante
                        </a>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <button className="inline-flex w-full items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
                          <Upload className="mr-1 h-4 w-4" />
                          Enviar comprovante
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-neutral-500">Ações</h3>
                    <div className="mt-2 space-y-2">
                      {transacao.status === 'pendente' && (
                        <button className="inline-flex w-full items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                          <Check className="mr-1 h-4 w-4" />
                          Confirmar pagamento
                        </button>
                      )}
                      
                      {transacao.status !== 'cancelada' && (
                        <button className="inline-flex w-full items-center justify-center rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
                          <X className="mr-1 h-4 w-4" />
                          Cancelar transação
                        </button>
                      )}
                      
                      <button className="inline-flex w-full items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
                        <Printer className="mr-1 h-4 w-4" />
                        Gerar recibo
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// Componente para exibir o status da transação
function StatusBadge({ status }: { status: TransacaoStatus }) {
  let color;
  
  switch (status) {
    case "confirmada":
      color = "bg-green-50 text-green-700";
      break;
    case "pendente":
      color = "bg-yellow-50 text-yellow-700";
      break;
    case "cancelada":
      color = "bg-red-50 text-red-700";
      break;
    default:
      color = "bg-neutral-100 text-neutral-700";
  }
  
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {status === "confirmada" && "Confirmada"}
      {status === "pendente" && "Pendente"}
      {status === "cancelada" && "Cancelada"}
    </span>
  );
}

// Exporta o componente principal em um Suspense
export default function DetalhesTransacaoPageWrapper() {
  return (
    <Suspense fallback={<DetalhesTransacaoLoading />}>
      <DetalhesTransacaoPage />
    </Suspense>
  );
} 