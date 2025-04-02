'use client';

import { useState, useEffect } from 'react';
import { 
  checkSupabaseConnection, 
  testSupabaseCRUD, 
  debugSupabaseClient 
} from '@/lib/supabase/debug';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, Database, RefreshCw } from 'lucide-react';

export default function DebugPage() {
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [customersCRUD, setCustomersCRUD] = useState<any>(null);
  const [productsCRUD, setProductsCRUD] = useState<any>(null);
  const [clientInfo, setClientInfo] = useState<any>(null);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({
    connection: false,
    customers: false,
    products: false
  });

  useEffect(() => {
    // Inicializar informações do cliente Supabase
    const info = debugSupabaseClient();
    setClientInfo(info);
  }, []);

  const checkConnection = async () => {
    setLoading(prev => ({ ...prev, connection: true }));
    try {
      const result = await checkSupabaseConnection();
      setConnectionStatus(result);
    } catch (error) {
      setConnectionStatus({ success: false, error: error.message });
    } finally {
      setLoading(prev => ({ ...prev, connection: false }));
    }
  };

  const testCustomersCRUD = async () => {
    setLoading(prev => ({ ...prev, customers: true }));
    try {
      const result = await testSupabaseCRUD('customers');
      setCustomersCRUD(result);
    } catch (error) {
      setCustomersCRUD({ success: false, error: error.message });
    } finally {
      setLoading(prev => ({ ...prev, customers: false }));
    }
  };

  const testProductsCRUD = async () => {
    setLoading(prev => ({ ...prev, products: true }));
    try {
      const result = await testSupabaseCRUD('products');
      setProductsCRUD(result);
    } catch (error) {
      setProductsCRUD({ success: false, error: error.message });
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Diagnóstico de Conexão Supabase</h1>
      
      <div className="space-y-6">
        {/* Informações do Cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Informações do Cliente Supabase
            </CardTitle>
            <CardDescription>
              Detalhes sobre a configuração do cliente Supabase
            </CardDescription>
          </CardHeader>
          <CardContent>
            {clientInfo ? (
              <div className="space-y-2">
                <p><strong>Cliente inicializado:</strong> {clientInfo.clientExists ? 'Sim' : 'Não'}</p>
                <p><strong>URL Supabase:</strong> {clientInfo.env.url || 'Não definido'}</p>
                <p><strong>Chave Anônima:</strong> {clientInfo.env.keyPrefix || 'Não definida'}</p>
              </div>
            ) : (
              <p>Carregando informações do cliente...</p>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={() => setClientInfo(debugSupabaseClient())}>
              Atualizar Informações
            </Button>
          </CardFooter>
        </Card>

        {/* Teste de Conexão */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Teste de Conexão
            </CardTitle>
            <CardDescription>
              Verifica se a conexão com o Supabase está funcionando corretamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            {connectionStatus && (
              <Alert variant={connectionStatus.success ? "default" : "destructive"} className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>
                  {connectionStatus.success ? 'Conexão estabelecida' : 'Falha na conexão'}
                </AlertTitle>
                <AlertDescription>
                  {connectionStatus.success 
                    ? 'A conexão com o Supabase foi estabelecida com sucesso!' 
                    : `Erro: ${connectionStatus.error}`}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={checkConnection} disabled={loading.connection}>
              {loading.connection ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Verificar Conexão'
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Testes CRUD */}
        <Card>
          <CardHeader>
            <CardTitle>Testes de Operações CRUD</CardTitle>
            <CardDescription>
              Verifica se as operações CRUD estão funcionando corretamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="customers">
              <TabsList className="mb-4">
                <TabsTrigger value="customers">Clientes</TabsTrigger>
                <TabsTrigger value="products">Produtos</TabsTrigger>
              </TabsList>
              
              <TabsContent value="customers">
                {customersCRUD && (
                  <div className="space-y-4">
                    <Alert variant={customersCRUD.success ? "default" : "destructive"}>
                      {customersCRUD.success ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      <AlertTitle>
                        {customersCRUD.success ? 'Testes concluídos com sucesso' : 'Falha nos testes'}
                      </AlertTitle>
                      <AlertDescription>
                        {customersCRUD.success 
                          ? 'Todas as operações CRUD estão funcionando corretamente!' 
                          : `Erro: ${customersCRUD.error || 'Verifique os detalhes das operações'}`}
                      </AlertDescription>
                    </Alert>
                    
                    {customersCRUD.operations && (
                      <div className="space-y-2">
                        <h3 className="text-md font-semibold">Detalhes por operação:</h3>
                        <p>
                          <strong>SELECT:</strong> {customersCRUD.operations.select.success ? '✅ Sucesso' : `❌ Erro: ${customersCRUD.operations.select.error}`}
                        </p>
                        <p>
                          <strong>INSERT:</strong> {customersCRUD.operations.insert.success ? '✅ Sucesso' : `❌ Erro: ${customersCRUD.operations.insert.error}`}
                        </p>
                        <p>
                          <strong>UPDATE:</strong> {customersCRUD.operations.update.success ? '✅ Sucesso' : `❌ Erro: ${customersCRUD.operations.update.error}`}
                        </p>
                        <p>
                          <strong>DELETE:</strong> {customersCRUD.operations.delete.success ? '✅ Sucesso' : `❌ Erro: ${customersCRUD.operations.delete.error}`}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                <Button 
                  onClick={testCustomersCRUD} 
                  disabled={loading.customers}
                  className="mt-4"
                >
                  {loading.customers ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Testando...
                    </>
                  ) : (
                    'Testar CRUD de Clientes'
                  )}
                </Button>
              </TabsContent>
              
              <TabsContent value="products">
                {productsCRUD && (
                  <div className="space-y-4">
                    <Alert variant={productsCRUD.success ? "default" : "destructive"}>
                      {productsCRUD.success ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      <AlertTitle>
                        {productsCRUD.success ? 'Testes concluídos com sucesso' : 'Falha nos testes'}
                      </AlertTitle>
                      <AlertDescription>
                        {productsCRUD.success 
                          ? 'Todas as operações CRUD estão funcionando corretamente!' 
                          : `Erro: ${productsCRUD.error || 'Verifique os detalhes das operações'}`}
                      </AlertDescription>
                    </Alert>
                    
                    {productsCRUD.operations && (
                      <div className="space-y-2">
                        <h3 className="text-md font-semibold">Detalhes por operação:</h3>
                        <p>
                          <strong>SELECT:</strong> {productsCRUD.operations.select.success ? '✅ Sucesso' : `❌ Erro: ${productsCRUD.operations.select.error}`}
                        </p>
                        <p>
                          <strong>INSERT:</strong> {productsCRUD.operations.insert.success ? '✅ Sucesso' : `❌ Erro: ${productsCRUD.operations.insert.error}`}
                        </p>
                        <p>
                          <strong>UPDATE:</strong> {productsCRUD.operations.update.success ? '✅ Sucesso' : `❌ Erro: ${productsCRUD.operations.update.error}`}
                        </p>
                        <p>
                          <strong>DELETE:</strong> {productsCRUD.operations.delete.success ? '✅ Sucesso' : `❌ Erro: ${productsCRUD.operations.delete.error}`}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                <Button 
                  onClick={testProductsCRUD} 
                  disabled={loading.products}
                  className="mt-4"
                >
                  {loading.products ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Testando...
                    </>
                  ) : (
                    'Testar CRUD de Produtos'
                  )}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Instruções de Verificação */}
        <Card>
          <CardHeader>
            <CardTitle>Próximos Passos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>Se você estiver enfrentando problemas com as operações CRUD, verifique o seguinte:</p>
              
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  <strong>Variáveis de ambiente:</strong> Certifique-se de que as variáveis <code>NEXT_PUBLIC_SUPABASE_URL</code> e <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> estão definidas corretamente no arquivo <code>.env.local</code>.
                </li>
                <li>
                  <strong>Políticas de segurança (RLS):</strong> Execute os scripts de políticas para <code>customers</code> e <code>products</code> no Editor SQL do Supabase.
                </li>
                <li>
                  <strong>Tabelas criadas:</strong> Verifique se as tabelas <code>customers</code> e <code>products</code> foram criadas no seu banco de dados Supabase.
                </li>
                <li>
                  <strong>Estrutura das tabelas:</strong> Certifique-se de que as tabelas possuem as colunas esperadas pelo sistema.
                </li>
                <li>
                  <strong>Permissões de usuário:</strong> Verifique se o usuário anônimo tem as permissões necessárias para realizar as operações CRUD.
                </li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 