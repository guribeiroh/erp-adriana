import React, { useState } from 'react';

const VendasReport: React.FC = () => {
  const [usandoDadosSimulados, setUsandoDadosSimulados] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Logs para depuração
      console.log("Carregando dados com filtros:", filters);
      
      // Obter os dados
      const data = await getSalesReport(filters);
      setReportData(data);
      
      // Verificar se estamos usando dados simulados (comparando totalSales com números redondos)
      const provavelmenteSimulado = 
        data.salesByCategory.every(cat => Number.isInteger(cat.value)) &&
        data.salesByDate.every(date => Number.isInteger(date.value));
      
      setUsandoDadosSimulados(provavelmenteSimulado);
      console.log("Usando dados simulados:", provavelmenteSimulado);
      
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setError("Erro ao carregar os dados do relatório. Tente novamente mais tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* ... rest of the component code ... */}

      {reportData && (
        <div className="rounded-md p-2 mb-4 flex items-center">
          <div className="flex items-center gap-2">
            <span className={`inline-block w-3 h-3 rounded-full ${usandoDadosSimulados ? 'bg-amber-500' : 'bg-green-500'}`}></span>
            <span className="text-sm font-medium">
              {usandoDadosSimulados 
                ? "⚠️ Usando dados simulados (conexão com Supabase indisponível)" 
                : "✅ Usando dados reais do Supabase"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendasReport; 