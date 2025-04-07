import { ReactNode } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function RelatoriosLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout title="Relatórios">
      {children}
    </DashboardLayout>
  );
} 