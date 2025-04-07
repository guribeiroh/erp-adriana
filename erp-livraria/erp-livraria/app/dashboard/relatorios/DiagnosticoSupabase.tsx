import React, { useEffect, useState } from 'react';
import { supabase, debugSupabaseState } from '@/lib/supabase/client';
import { AlertCircle, CheckCircle, Database, Info } from 'lucide-react';
import { debugDatabaseTables } from '@/lib/services/reportService';
import { Button } from '@/components/ui/button';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

const DiagnosticoSupabase = () => {
  const [diagnostico, setDiagnostico] = useState<any>(null);
  const [tabelas, setTabelas] = useState<any>(null);
  const [carregando, setCarregando] = useState(false);
  const [expandido, setExpandido] = useState(false);

  useEffect(() => {
    const verificarConexao = async () => {
      try {
        setCarregando(true);
        const estado = debugSupabaseState();
        setDiagnostico(estado);

        // Verificar tabelas apenas se o cliente estiver disponível
        if (estado.hasClient) {
          const infoTabelas = await debugDatabaseTables();
          setTabelas(infoTabelas);
        }
      } catch (error) {
        console.error('Erro ao verificar conexão:', error);
      } finally {
        setCarregando(false);
      }
    };

    verificarConexao();
  }, []);

  const refazerTeste = async () => {
    setCarregando(true);
    try {
      const estado = debugSupabaseState();
      setDiagnostico(estado);

      if (estado.hasClient) {
        const infoTabelas = await debugDatabaseTables();
        setTabelas(infoTabelas);
      }
    } catch (error) {
      console.error('Erro ao refazer teste:', error);
    } finally {
      setCarregando(false);
    }
  };

  if (!diagnostico) {
    return (
      <Alert className="mb-4">
        <Info className="h-4 w-4" />
        <AlertTitle>Verificando conexão com o Supabase...</AlertTitle>
        <AlertDescription>
          Aguarde enquanto testamos a conexão com o banco de dados.
        </AlertDescription>
      </Alert>
    );
  }

  const statusConexao = diagnostico.hasClient && diagnostico.envVarsValid;
  const statusTabelas = tabelas && (tabelas.tables?.length > 0 || tabelas.tableTest || tabelas.connectionTest);

  return (
    <div className="mb-6 overflow-hidden">
      <Alert variant={statusConexao ? "default" : "destructive"} className="mb-2">
        <Database className="h-4 w-4" />
        <AlertTitle className="flex items-center gap-2">
          Status da Conexão: 
          {statusConexao ? (
            <span className="text-green-600 flex items-center">
              <CheckCircle className="h-4 w-4 mr-1" /> Conectado
            </span>
          ) : (
            <span className="text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" /> Desconectado
            </span>
          )}
        </AlertTitle>
        <AlertDescription>
          {statusConexao 
            ? 'Conexão com o Supabase estabelecida com sucesso.' 
            : 'Não foi possível conectar ao Supabase. Verifique as variáveis de ambiente.'}
        </AlertDescription>
      </Alert>

      {statusConexao && (
        <Alert variant={statusTabelas ? "default" : "destructive"} className="mb-2">
          <Database className="h-4 w-4" />
          <AlertTitle className="flex items-center gap-2">
            Status das Tabelas: 
            {statusTabelas ? (
              <span className="text-green-600 flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" /> Disponíveis
              </span>
            ) : (
              <span className="text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" /> Indisponíveis
              </span>
            )}
          </AlertTitle>
          <AlertDescription>
            {statusTabelas 
              ? `Tabelas do banco de dados disponíveis.` 
              : 'Não foi possível acessar as tabelas do banco de dados.'}
          </AlertDescription>
        </Alert>
      )}

      {(carregando || expandido) && (
        <div className="mt-4 p-3 bg-slate-50 rounded-md text-sm">
          {carregando ? (
            <p>Atualizando diagnóstico...</p>
          ) : (
            <pre className="overflow-x-auto text-xs">
              {JSON.stringify({diagnostico, tabelas}, null, 2)}
            </pre>
          )}
        </div>
      )}

      <div className="flex gap-2 mt-2">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={refazerTeste} 
          disabled={carregando}
        >
          {carregando ? 'Atualizando...' : 'Atualizar Diagnóstico'}
        </Button>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={() => setExpandido(!expandido)}
        >
          {expandido ? 'Ocultar Detalhes' : 'Mostrar Detalhes'}
        </Button>
      </div>
    </div>
  );
};

export default DiagnosticoSupabase; 