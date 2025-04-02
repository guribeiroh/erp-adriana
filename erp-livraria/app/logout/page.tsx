'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function LogoutPage() {
  const { signOut } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Usar uma flag para garantir que o redirecionamento ocorra apenas uma vez
    let isMounted = true;

    const performLogout = async () => {
      if (isRedirecting) return;
      
      try {
        console.log('Realizando logout...');
        await signOut();
        console.log('Logout concluído, redirecionando para login');
        
        if (isMounted) {
          setIsRedirecting(true);
          
          // Usar window.location para uma navegação completa em vez de router.push
          // Isso evita problemas de estado persistente que podem causar loops
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('Erro ao fazer logout:', error);
        alert('Erro ao fazer logout: ' + (error instanceof Error ? error.message : String(error)));
        
        if (isMounted) {
          setIsRedirecting(true);
          window.location.href = '/login';
        }
      }
    };

    performLogout();

    // Limpar na desmontagem
    return () => {
      isMounted = false;
    };
  }, [signOut]);

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-neutral-50">
      <div className="text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary-600" />
        <h1 className="mt-6 text-2xl font-semibold text-neutral-800">Saindo do sistema...</h1>
        <p className="mt-2 text-neutral-600">Você será redirecionado em instantes.</p>
      </div>
    </div>
  );
} 