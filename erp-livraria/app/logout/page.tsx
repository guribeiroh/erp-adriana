'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function LogoutPage() {
  const { signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      try {
        console.log('Realizando logout...');
        await signOut();
        console.log('Logout concluído, redirecionando para login');
        
        // Pequeno delay antes de redirecionar para garantir que o estado seja limpo
        setTimeout(() => {
          router.push('/login');
        }, 300);
      } catch (error) {
        console.error('Erro ao fazer logout:', error);
        alert('Erro ao fazer logout: ' + (error instanceof Error ? error.message : String(error)));
        router.push('/login');
      }
    };

    performLogout();
  }, [signOut, router]);

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