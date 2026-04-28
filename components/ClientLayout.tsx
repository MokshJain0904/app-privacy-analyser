'use client';

import { ThemeProvider } from '@/components/ThemeProvider';
import { ToastProvider } from '@/components/Toast';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </ThemeProvider>
  );
}
