"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "../../../../components/layout/DashboardLayout";
import { 
  ArrowLeft, 
  User,
  ShoppingBag, 
  Calendar,
  Clock, 
  CreditCard, 
  CircleDollarSign,
  FileText,
  Printer, 
  MoreHorizontal,
  Loader2,
  AlertCircle,
  Check,
  X,
  Banknote,
  CheckCircle,
  XCircle,
  Info
} from "lucide-react";
import { fetchSaleDetails, updateSalePaymentStatus } from "@/lib/services/pdvService";
import { supabase } from "@/lib/supabase/client";
import { jsPDF } from "jspdf";
import 'jspdf-autotable';
import { formatBrazilianDate, formatBrazilianTime, formatBrazilianDateTime } from "@/lib/utils/date";

export default function DetalhesVendaPage() {
  const params = useParams();
  const router = useRouter();
  const vendaId = params.id as string;
  
  const [venda, setVenda] = useState<any>(null);
  const [itens, setItens] = useState<any[]>([]);
  const [cliente, setCliente] = useState<any>(null);
  const [vendedor, setVendedor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{
    type: 'success' | 'error' | 'info',
    text: string
  } | null>(null);
  
  useEffect(() => {
    carregarDetalhesVenda();
  }, [vendaId]);
  
  // Limpar a mensagem de ação após 5 segundos
  useEffect(() => {
    if (actionMessage) {
      const timer = setTimeout(() => {
        setActionMessage(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [actionMessage]);
  
  const carregarDetalhesVenda = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Buscar detalhes da venda e itens
      const { sale, items } = await fetchSaleDetails(vendaId);
      
      // Buscar informações complementares
      if (sale) {
        // Buscar dados do cliente
        if (sale.customer_id) {
          const { data: clienteData } = await supabase
            .from('customers')
            .select('*')
            .eq('id', sale.customer_id)
            .single();
            
          setCliente(clienteData);
        }
        
        // Buscar dados do vendedor
        if (sale.user_id) {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', sale.user_id)
            .single();
            
          setVendedor(userData);
        }
        
        // Enriquecer os itens com detalhes dos livros
        const itensCompletos = await Promise.all(items.map(async (item) => {
          const { data: book } = await supabase
            .from('books')
            .select('*')
            .eq('id', item.book_id)
            .single();
            
          return {
            ...item,
            book
          };
        }));
        
        setVenda(sale);
        setItens(itensCompletos);
      }
    } catch (err) {
      console.error("Erro ao carregar detalhes da venda:", err);
      setError("Não foi possível carregar os detalhes da venda.");
    } finally {
      setLoading(false);
    }
  };
  
  // Formatador de data
  const formatarData = (dataString: string) => {
    return formatBrazilianDate(dataString);
  };
  
  // Formatador de hora
  const formatarHora = (dataString: string) => {
    return formatBrazilianTime(dataString);
  };
  
  // Formatador de valor monetário
  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };
  
  // Função para mapear o método de pagamento para um texto legível
  const mapearMetodoPagamento = (metodo: string) => {
    const mapeamento: Record<string, string> = {
      'cash': 'Dinheiro',
      'credit_card': 'Cartão de Crédito',
      'debit_card': 'Cartão de Débito',
      'pix': 'PIX',
      'transfer': 'Transferência',
    };
    
    return mapeamento[metodo] || metodo;
  };
  
  // Função para mapear o status para um texto legível
  const mapearStatus = (status: string) => {
    const mapeamento: Record<string, string> = {
      'paid': 'Pago',
      'pending': 'Pendente',
      'canceled': 'Cancelado',
    };
    
    return mapeamento[status] || status;
  };
  
  // Função para obter a classe CSS para o status
  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'paid':
        return "bg-green-100 text-green-800";
      case 'pending':
        return "bg-yellow-100 text-yellow-800";
      case 'canceled':
        return "bg-red-100 text-red-800";
      default:
        return "bg-neutral-100 text-neutral-800";
    }
  };
  
  // Função para obter o ícone do método de pagamento
  const MetodoPagamentoIcon = ({ metodo }: { metodo: string }) => {
    switch (metodo) {
      case 'cash':
        return <Banknote className="h-5 w-5 text-neutral-500" />;
      case 'credit_card':
      case 'debit_card':
        return <CreditCard className="h-5 w-5 text-neutral-500" />;
      case 'pix':
        return <CircleDollarSign className="h-5 w-5 text-neutral-500" />;
      case 'transfer':
        return <FileText className="h-5 w-5 text-neutral-500" />;
      default:
        return <CreditCard className="h-5 w-5 text-neutral-500" />;
    }
  };
  
  // Função para obter o ícone do status
  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'paid':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'canceled':
        return <X className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-neutral-500" />;
    }
  };
  
  // Função para marcar uma venda como paga
  const marcarComoPago = async () => {
    if (!venda || actionLoading) return;
    
    setActionLoading('pagar');
    setActionMessage(null);
    
    try {
      await updateSalePaymentStatus(venda.id, 'paid');
      
      // Atualizar o estado local
      setVenda({
        ...venda,
        payment_status: 'paid'
      });
      
      setActionMessage({
        type: 'success',
        text: 'Venda marcada como paga com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao marcar venda como paga:', error);
      setActionMessage({
        type: 'error',
        text: `Erro ao marcar venda como paga: ${error.message}`
      });
    } finally {
      setActionLoading(null);
    }
  };
  
  // Função para cancelar uma venda
  const cancelarVenda = async () => {
    if (!venda || actionLoading) return;
    
    // Confirmação do usuário
    if (!confirm('Tem certeza que deseja cancelar esta venda? Esta ação não pode ser desfeita e os itens serão devolvidos ao estoque.')) {
      return;
    }
    
    setActionLoading('cancelar');
    setActionMessage(null);
    
    try {
      await updateSalePaymentStatus(venda.id, 'canceled', 'Venda cancelada pelo usuário');
      
      // Atualizar o estado local
      setVenda({
        ...venda,
        payment_status: 'canceled',
        notes: venda.notes ? venda.notes + ' | Venda cancelada pelo usuário' : 'Venda cancelada pelo usuário'
      });
      
      setActionMessage({
        type: 'success',
        text: 'Venda cancelada com sucesso! Os itens foram devolvidos ao estoque.'
      });
    } catch (error) {
      console.error('Erro ao cancelar venda:', error);
      setActionMessage({
        type: 'error',
        text: `Erro ao cancelar venda: ${error.message}`
      });
    } finally {
      setActionLoading(null);
    }
  };
  
  // Função para gerar um PDF com os detalhes da venda
  const gerarPDF = () => {
    if (!venda || actionLoading) return;
    
    setActionLoading('pdf');
    setActionMessage(null);
    
    try {
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(20);
      doc.text('Comprovante de Venda', 105, 20, { align: 'center' });
      
      // Dados da venda
      doc.setFontSize(12);
      doc.text(`Venda #${venda.id}`, 14, 40);
      doc.text(`Data: ${formatarData(venda.created_at)} às ${formatarHora(venda.created_at)}`, 14, 50);
      doc.text(`Status: ${mapearStatus(venda.payment_status)}`, 14, 60);
      doc.text(`Método de Pagamento: ${mapearMetodoPagamento(venda.payment_method)}`, 14, 70);
      
      // Dados do cliente
      if (cliente) {
        doc.text('Cliente:', 14, 90);
        doc.text(`Nome: ${cliente.name}`, 20, 100);
        if (cliente.email) doc.text(`Email: ${cliente.email}`, 20, 110);
        if (cliente.phone) doc.text(`Telefone: ${cliente.phone}`, 20, 120);
      }
      
      // Itens da venda
      doc.text('Itens:', 14, 140);
      
      const tableColumn = ["Produto", "Autor/Editora", "Qtd", "Preço Unit.", "Desconto", "Total"];
      const tableRows: any[] = [];
      
      itens.forEach(item => {
        const itemData = [
          item.book?.title || "Produto não identificado",
          `${item.book?.author || ""} ${item.book?.publisher ? `/ ${item.book.publisher}` : ""}`,
          item.quantity,
          formatarValor(item.unit_price),
          formatarValor(item.discount || 0),
          formatarValor(item.total)
        ];
        tableRows.push(itemData);
      });
      
      (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 150,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [66, 66, 66] }
      });
      
      // Total
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.text(`Total: ${formatarValor(venda.total)}`, 150, finalY, { align: 'right' });
      
      // Rodapé
      doc.setFontSize(10);
      doc.text('Agradecemos a preferência!', 105, 280, { align: 'center' });
      
      // Salvar o PDF
      doc.save(`venda-${venda.id}.pdf`);
      
      setActionMessage({
        type: 'success',
        text: 'PDF gerado com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      setActionMessage({
        type: 'error',
        text: 'Erro ao gerar PDF. Tente novamente.'
      });
    } finally {
      setActionLoading(null);
    }
  };
  
  // Função para imprimir o comprovante
  const imprimirComprovante = () => {
    if (!venda || actionLoading) return;
    
    setActionLoading('imprimir');
    setActionMessage(null);
    
    try {
      // Criar uma nova janela
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        throw new Error('Não foi possível abrir a janela de impressão. Por favor, desative o bloqueador de pop-ups e tente novamente.');
      }
      
      // Montar o HTML do comprovante
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Comprovante de Venda - ${venda.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .info-row { margin-bottom: 5px; }
            .info-label { font-weight: bold; }
            .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .table th { background-color: #f2f2f2; }
            .total-row { font-weight: bold; text-align: right; margin-top: 20px; }
            .footer { text-align: center; margin-top: 40px; font-size: 14px; }
            @media print {
              .no-print { display: none; }
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Comprovante de Venda</h1>
            <h2>Nº ${venda.id}</h2>
          </div>
          
          <div class="info-row">
            <span class="info-label">Data:</span> ${formatarData(venda.created_at)} às ${formatarHora(venda.created_at)}
          </div>
          <div class="info-row">
            <span class="info-label">Status:</span> ${mapearStatus(venda.payment_status)}
          </div>
          <div class="info-row">
            <span class="info-label">Método de Pagamento:</span> ${mapearMetodoPagamento(venda.payment_method)}
          </div>
          
          ${cliente ? `
            <h3>Cliente</h3>
            <div class="info-row">
              <span class="info-label">Nome:</span> ${cliente.name}
            </div>
            ${cliente.email ? `
              <div class="info-row">
                <span class="info-label">Email:</span> ${cliente.email}
              </div>
            ` : ''}
            ${cliente.phone ? `
              <div class="info-row">
                <span class="info-label">Telefone:</span> ${cliente.phone}
              </div>
            ` : ''}
          ` : ''}
          
          <h3>Itens</h3>
          <table class="table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Quantidade</th>
                <th>Preço Unit.</th>
                <th>Desconto</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${itens.map(item => `
                <tr>
                  <td>
                    ${item.book?.title || "Produto não identificado"}
                    ${item.book?.author ? `<br><small>${item.book.author}</small>` : ''}
                  </td>
                  <td>${item.quantity}</td>
                  <td>${formatarValor(item.unit_price)}</td>
                  <td>${formatarValor(item.discount || 0)}</td>
                  <td>${formatarValor(item.total)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="total-row">
            Total: ${formatarValor(venda.total)}
          </div>
          
          <div class="footer">
            Agradecemos a preferência!
          </div>
          
          <div class="no-print" style="margin-top: 30px; text-align: center;">
            <button onclick="window.print();" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">
              Imprimir
            </button>
          </div>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      
      // Foco na nova janela e imprime
      printWindow.focus();
      
      setActionMessage({
        type: 'success',
        text: 'Comprovante aberto em nova aba!'
      });
      
    } catch (error) {
      console.error('Erro ao imprimir comprovante:', error);
      setActionMessage({
        type: 'error',
        text: typeof error === 'object' && error.message ? error.message : 'Erro ao imprimir comprovante. Tente novamente.'
      });
    } finally {
      setActionLoading(null);
    }
  };
  
  if (loading) {
    return (
      <DashboardLayout title="Detalhes da Venda">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
          <p className="mt-4 text-neutral-600">Carregando detalhes da venda...</p>
        </div>
      </DashboardLayout>
    );
  }
  
  if (error || !venda) {
    return (
      <DashboardLayout title="Detalhes da Venda">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-xl font-medium text-neutral-900">Erro ao carregar venda</h2>
          <p className="mt-2 text-neutral-600">{error || "Venda não encontrada."}</p>
          <div className="mt-6 flex gap-4">
            <button
              onClick={carregarDetalhesVenda}
              className="rounded-lg bg-primary-600 px-4 py-2 font-medium text-white hover:bg-primary-700"
            >
              Tentar novamente
            </button>
            <Link
              href="/dashboard/vendas"
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Voltar para vendas
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout title="Detalhes da Venda">
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              href="/dashboard/vendas" 
              className="rounded-full p-1.5 text-neutral-700 hover:bg-neutral-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-neutral-900">
              Detalhes da Venda
            </h1>
          </div>
          
          {/* Feedback de ações */}
          {actionMessage && (
            <div className={`flex items-center gap-2 rounded-lg px-4 py-2 text-white ${
              actionMessage.type === 'success' ? 'bg-green-600' : 
              actionMessage.type === 'error' ? 'bg-red-600' : 
              'bg-blue-600'
            }`}>
              {actionMessage.type === 'success' ? <CheckCircle className="h-5 w-5" /> : 
               actionMessage.type === 'error' ? <XCircle className="h-5 w-5" /> : 
               <Info className="h-5 w-5" />}
              <span>{actionMessage.text}</span>
        </div>
          )}
        </div>
        
        {/* Informações principais */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Informações gerais */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dados da venda */}
            <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-medium text-neutral-900">Informações da Venda</h2>
              
              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium text-neutral-500">ID da Venda</h3>
                  <p className="mt-1 text-neutral-900">{venda.id}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-neutral-500">Status</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(venda.payment_status)}`}>
                      {mapearStatus(venda.payment_status)}
                    </span>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-neutral-500">Data</h3>
                  <div className="mt-1 flex items-center gap-2 text-neutral-900">
                    <Calendar className="h-4 w-4 text-neutral-400" />
                    {formatarData(venda.created_at)}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-neutral-500">Hora</h3>
                  <div className="mt-1 flex items-center gap-2 text-neutral-900">
                    <Clock className="h-4 w-4 text-neutral-400" />
                    {formatarHora(venda.created_at)}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-neutral-500">Método de Pagamento</h3>
                  <div className="mt-1 flex items-center gap-2 text-neutral-900">
                    <MetodoPagamentoIcon metodo={venda.payment_method} />
                    {mapearMetodoPagamento(venda.payment_method)}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-neutral-500">Valor Total</h3>
                  <p className="mt-1 text-lg font-medium text-neutral-900">
                    {formatarValor(venda.total)}
                  </p>
                </div>
              </div>
              
              {venda.notes && (
                <div className="mt-5">
                  <h3 className="text-sm font-medium text-neutral-500">Observações</h3>
                  <p className="mt-1 rounded-md bg-neutral-50 p-3 text-neutral-700">
                    {venda.notes}
                  </p>
                </div>
              )}
            </div>
            
            {/* Informações do cliente */}
            {cliente && (
              <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-medium text-neutral-900">Informações do Cliente</h2>
                
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
                    <User className="h-6 w-6" />
              </div>
              
                <div>
                    <h3 className="text-lg font-medium text-neutral-900">{cliente.name}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-600">
                      {cliente.email && <span>{cliente.email}</span>}
                      {cliente.phone && <span>{cliente.phone}</span>}
                    </div>
                  </div>
                </div>
                
                {(cliente.address || cliente.city || cliente.state) && (
                  <div className="mt-4 rounded-md bg-neutral-50 p-3">
                    <h4 className="text-sm font-medium text-neutral-700">Endereço</h4>
                    <p className="mt-1 text-sm text-neutral-600">
                      {cliente.address && <span>{cliente.address}{cliente.address_complement ? `, ${cliente.address_complement}` : ''}</span>}
                      {cliente.city && <span>{cliente.city && cliente.address ? ', ' : ''}{cliente.city}</span>}
                      {cliente.state && <span>{(cliente.city || cliente.address) ? ' - ' : ''}{cliente.state}</span>}
                      {cliente.zip && <span>{(cliente.state || cliente.city || cliente.address) ? ', ' : ''}{cliente.zip}</span>}
                    </p>
                  </div>
                )}
                
                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/dashboard/clientes/${cliente.id}`}
                    className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                  >
                    Ver perfil completo
                  </Link>
                  </div>
                </div>
              )}
          </div>
          
          {/* Resumo e ações */}
          <div className="space-y-6">
            {/* Card de resumo */}
            <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-medium text-neutral-900">Resumo</h2>
              
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">Subtotal</span>
                  <span className="font-medium text-neutral-900">{formatarValor(venda.total)}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">Descontos</span>
                  <span className="font-medium text-neutral-900">
                    {formatarValor(itens.reduce((acc, item) => acc + (item.discount || 0), 0))}
                  </span>
                </div>
                
                <div className="border-t border-neutral-200 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-700">Total</span>
                    <span className="text-lg font-medium text-neutral-900">{formatarValor(venda.total)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Ações */}
            <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-medium text-neutral-900">Ações</h2>
              
              <div className="mt-4 space-y-3">
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white py-2 font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={imprimirComprovante}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === 'imprimir' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Printer className="h-4 w-4" />
                  )}
                  Imprimir Comprovante
                </button>
                
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white py-2 font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={gerarPDF}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === 'pdf' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  Gerar PDF
                </button>
                
                {venda.payment_status === 'pending' && (
                  <button 
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600"
                    onClick={marcarComoPago}
                    disabled={actionLoading !== null}
                  >
                    {actionLoading === 'pagar' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Marcar como Pago
                  </button>
                )}
                
                {venda.payment_status !== 'canceled' && (
                  <button 
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600"
                    onClick={cancelarVenda}
                    disabled={actionLoading !== null}
                  >
                    {actionLoading === 'cancelar' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    Cancelar Venda
                  </button>
                )}
              </div>
            </div>
            
            {/* Vendedor */}
            {vendedor && (
              <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-medium text-neutral-500">Vendedor</h2>
                <p className="mt-1 text-neutral-900">{vendedor.name}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Itens da venda */}
        <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-medium text-neutral-900">Itens</h2>
          
          <div className="mt-4 overflow-x-auto">
            {itens.length > 0 ? (
              <table className="w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Produto</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-neutral-500">Quantidade</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">Preço Unit.</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">Desconto</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {itens.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-4 text-sm">
                        <div>
                          <p className="font-medium text-neutral-900">{item.book?.title || "Produto não identificado"}</p>
                          <p className="text-xs text-neutral-500">
                            {item.book?.author && `${item.book.author}`}
                            {item.book?.publisher && ` • ${item.book.publisher}`}
                          </p>
              </div>
                      </td>
                      <td className="px-4 py-4 text-center text-sm text-neutral-900">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-neutral-900">
                        {formatarValor(item.unit_price)}
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-neutral-900">
                        {formatarValor(item.discount || 0)}
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-medium text-neutral-900">
                        {formatarValor(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-neutral-50">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right text-sm font-medium text-neutral-900">
                      Total ({itens.length} {itens.length === 1 ? 'livro' : 'livros'})
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-neutral-900">
                      {formatarValor(venda.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <div className="py-8 text-center text-neutral-600">
                <ShoppingBag className="mx-auto h-10 w-10 text-neutral-300" />
                <p className="mt-2">Nenhum item encontrado para esta venda</p>
              </div>
            )}
            </div>
          </div>
      </div>
    </DashboardLayout>
  );
} 