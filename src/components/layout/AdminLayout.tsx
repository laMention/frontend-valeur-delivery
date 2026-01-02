import type { ReactNode } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { ToastProvider } from '../../contexts/ToastContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { theme } = useTheme();

  return (
    <ToastProvider>
      <div className={`min-h-screen flex flex-col transition-colors ${
        theme === 'light' ? 'bg-red-100' : 'bg-red-100'
      }`}>
        <Topbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className={`flex-1 p-6 overflow-y-auto transition-colors relative ${
            theme === 'light' ? 'bg-white text-gray-900' : 'bg-red-50 text-gray-900'
          }`}>
          {/* Fond graphique élégant - Motif de livraison */}
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {/* Grand motif principal - bottom-right */}
            <div className="absolute -bottom-20 -right-20 w-[600px] h-[600px] opacity-[0.03]">
              <svg viewBox="0 0 200 200" className="w-full h-full text-red-900">
                {/* Colis stylisé */}
                <rect x="40" y="60" width="120" height="80" fill="currentColor" rx="8" />
                <path d="M 40 60 L 100 30 L 160 60" fill="currentColor" />
                <line x1="100" y1="30" x2="100" y2="140" stroke="currentColor" strokeWidth="2" />
                <line x1="40" y1="100" x2="160" y2="100" stroke="currentColor" strokeWidth="2" />
                {/* Cercles décoratifs */}
                <circle cx="60" cy="80" r="8" fill="currentColor" opacity="0.3" />
                <circle cx="140" cy="80" r="8" fill="currentColor" opacity="0.3" />
                <circle cx="60" cy="120" r="8" fill="currentColor" opacity="0.3" />
                <circle cx="140" cy="120" r="8" fill="currentColor" opacity="0.3" />
              </svg>
            </div>
            {/* Motif secondaire - top-left */}
            <div className="absolute top-10 left-10 w-[300px] h-[300px] opacity-[0.02]">
              <svg viewBox="0 0 100 100" className="w-full h-full text-red-900">
                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M 30 50 L 45 65 L 70 35" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
              </svg>
            </div>
            {/* Motif diagonal discret */}
            <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] opacity-[0.015] transform -translate-x-1/2 -translate-y-1/2">
              <svg viewBox="0 0 150 150" className="w-full h-full text-red-900">
                <rect x="20" y="20" width="110" height="110" fill="none" stroke="currentColor" strokeWidth="2" rx="10" />
                <path d="M 75 20 L 75 130 M 20 75 L 130 75" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="75" cy="75" r="25" fill="currentColor" opacity="0.2" />
              </svg>
            </div>
          </div>
          {/* Contenu au-dessus du fond */}
          <div className="relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
    </ToastProvider>
  );
}

