"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchTransacaoById, Transacao } from "@/lib/services/financialService";
import DashboardLayout from "../../../../components/layout/DashboardLayout";
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Edit, 
  Trash,
  Receipt,
  Calendar,
  Tag,
  CircleDollarSign,
  CreditCard,
  MessageSquare,
  LinkIcon,
  Clock,
  Check,
  AlertCircle,
  Ban,
  Loader2,
  ArrowUpRight
} from "lucide-react";

export default function DetalhesTransacaoPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const id = params.id;
  
  const [transacao, setTransacao] = useState<Transacao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  
  useEffect(() => {
    async function carregarTransacao() {
      try {
        setCarregando(true);
        setErro(null);
        
        const data = await fetchTransacaoById(id);
        setTransacao(data);
      } catch (error) {
        console.error("Erro ao carregar transação:", error);
        setErro(error instanceof Error ? error.message : "Erro desconhecido");
      } finally {
        setCarregando(false);
      }
    }
    
    carregarTransacao();
  }, [id]);
  
  // Formatadores
  const formatarData = (dataString?: string) => {
    if (!dataString) return "-";
    return new Date(dataString).toLocaleDateString('pt-BR');
  };
  
  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };
  
  // Renderização condicional
  if (carregando) {
    return (
      <DashboardLayout title="Detalhes da Transação">
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary-600" />
            <p className="mt-4 text-neutral-600">Carregando detalhes da transação...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (erro) {
    return (
      <DashboardLayout title="Detalhes da Transação">
        <div className="flex h-[400px] flex-col items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-7 w-7 text-red-600" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-neutral-900">Erro ao carregar transação</h2>
            <p className="mb-4 text-neutral-600">{erro}</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => router.back()}
                className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
              >
                Voltar
              </button>
              <button
                onClick={() => window.location.reload()}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (!transacao) {
    return (
      <DashboardLayout title="Detalhes da Transação">
        <div className="flex h-[400px] flex-col items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
              <AlertCircle className="h-7 w-7 text-amber-600" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-neutral-900">Transação não encontrada</h2>
            <p className="mb-4 text-neutral-600">Não foi possível encontrar a transação com o ID: {id}</p>
            <Link
              href="/dashboard/financeiro"
              className="inline-flex items-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
            >
              Voltar para Financeiro
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout title={`Transação #${transacao.id}`}>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/financeiro"
              className="rounded-full p-1.5 text-neutral-700 hover:bg-neutral-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-neutral-900">
              {transacao.tipo === 'receita' ? 'Receita' : 'Despesa'}: {transacao.descricao}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/financeiro/${transacao.id}/editar`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
            >
              <Edit className="h-4 w-4" />
              Editar
            </Link>
            <button
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50"
            >
              <Trash className="h-4 w-4" />
              Excluir
            </button>
          </div>
        </div>
        
        {/* Detalhes */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Informações principais */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card de resumo */}
            <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-medium text-neutral-900">Resumo da Transação</h2>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                  transacao.status === 'confirmada' 
                    ? 'bg-green-100 text-green-800' 
                    : transacao.status === 'pendente'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                }`}>
                  {transacao.status === 'confirmada' && 'Confirmada'}
                  {transacao.status === 'pendente' && 'Pendente'}
                  {transacao.status === 'cancelada' && 'Cancelada'}
                </span>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium text-neutral-600">Valor</h3>
                  <p className={`mt-1 text-2xl font-semibold ${
                    transacao.tipo === 'receita' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatarValor(transacao.valor)}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-neutral-600">Tipo</h3>
                  <div className="mt-1 flex items-center">
                    <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium ${
                      transacao.tipo === 'receita' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transacao.tipo === 'receita' ? (
                        <>
                          <ArrowUpRight className="h-4 w-4" />
                          Receita
                        </>
                      ) : (
                        <>
                          <ArrowLeft className="h-4 w-4" />
                          Despesa
                        </>
                      )}
                    </span>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-neutral-600">Data</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-neutral-400" />
                    <span className="text-neutral-900">{formatarData(transacao.data)}</span>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-neutral-600">Categoria</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-neutral-400" />
                    <span className="text-neutral-900">{transacao.categoria}</span>
                  </div>
                </div>
                
                {transacao.status === 'pendente' && transacao.dataVencimento && (
                  <div>
                    <h3 className="text-sm font-medium text-neutral-600">Data de Vencimento</h3>
                    <div className="mt-1 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-neutral-400" />
                      <span className="text-neutral-900">{formatarData(transacao.dataVencimento)}</span>
                    </div>
                  </div>
                )}
                
                {transacao.status === 'confirmada' && transacao.dataPagamento && (
                  <div>
                    <h3 className="text-sm font-medium text-neutral-600">
                      {transacao.tipo === 'receita' ? 'Data de Recebimento' : 'Data de Pagamento'}
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-neutral-900">{formatarData(transacao.dataPagamento)}</span>
                    </div>
                  </div>
                )}
                
                {transacao.formaPagamento && (
                  <div>
                    <h3 className="text-sm font-medium text-neutral-600">Forma de Pagamento</h3>
                    <div className="mt-1 flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-neutral-400" />
                      <span className="text-neutral-900">
                        {transacao.formaPagamento === 'dinheiro' && 'Dinheiro'}
                        {transacao.formaPagamento === 'credito' && 'Cartão de Crédito'}
                        {transacao.formaPagamento === 'debito' && 'Cartão de Débito'}
                        {transacao.formaPagamento === 'pix' && 'PIX'}
                        {transacao.formaPagamento === 'boleto' && 'Boleto Bancário'}
                        {transacao.formaPagamento === 'transferencia' && 'Transferência Bancária'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Observações */}
            {transacao.observacoes && (
              <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-neutral-900">
                  <MessageSquare className="h-5 w-5 text-neutral-500" /> 
                  Observações
                </h2>
                <p className="whitespace-pre-line text-neutral-600">{transacao.observacoes}</p>
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Vínculo */}
            {transacao.vinculoId && (
              <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-neutral-900">
                  <LinkIcon className="h-5 w-5 text-neutral-500" /> 
                  Vinculado a
                </h2>
                
                <div className="rounded-lg bg-neutral-50 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    {transacao.vinculoTipo === 'venda' && <Receipt className="h-5 w-5 text-green-600" />}
                    {transacao.vinculoTipo === 'compra' && <FileText className="h-5 w-5 text-amber-600" />}
                    <span className="font-medium text-neutral-900">
                      {transacao.vinculoTipo === 'venda' && 'Venda'}
                      {transacao.vinculoTipo === 'compra' && 'Compra'}
                      {transacao.vinculoTipo === 'outro' && 'Outro'}
                      {" "}#{transacao.vinculoId}
                    </span>
                  </div>
                  
                  <div className="mt-3">
                    <Link
                      href={`/dashboard/${transacao.vinculoTipo === 'venda' ? 'vendas' : 'compras'}/${transacao.vinculoId}`}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                      Ver detalhes
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
            
            {/* Comprovante */}
            <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-neutral-900">
                <FileText className="h-5 w-5 text-neutral-500" /> 
                Comprovante
              </h2>
              
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 p-6 text-center">
                <div className="mb-3 rounded-full bg-neutral-100 p-3">
                  <FileText className="h-6 w-6 text-neutral-500" />
                </div>
                <p className="mb-1 text-sm text-neutral-600">Nenhum comprovante disponível</p>
                <button
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Adicionar comprovante
                </button>
              </div>
            </div>
            
            {/* Ações */}
            <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-medium text-neutral-900">Ações</h2>
              
              <div className="space-y-2">
                {transacao.status === 'pendente' && (
                  <button
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                  >
                    <Check className="h-4 w-4" />
                    {transacao.tipo === 'receita' ? 'Confirmar Recebimento' : 'Confirmar Pagamento'}
                  </button>
                )}
                
                {transacao.status !== 'cancelada' && (
                  <button
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                  >
                    <Ban className="h-4 w-4" />
                    Cancelar Transação
                  </button>
                )}
                
                <button
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  <FileText className="h-4 w-4" />
                  Gerar Recibo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 12h14"></path>
      <path d="m12 5 7 7-7 7"></path>
    </svg>
  );
}

function Upload({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="17 8 12 3 7 8"></polyline>
      <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
  );
} 