import React from 'react';
import {
  FileText,
  Users,
  FileSpreadsheet,
  Calculator,
  Wrench,
  Plus
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

type MobileTab = 'dashboard' | 'invoices' | 'customers' | 'spreadsheet' | 'formulas' | 'services' | 'jobs' | 'quotes';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  setActiveTab: (tab: MobileTab) => void;
  onNewInvoice: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onNewInvoice
}) => {
  const { isLight } = useTheme();
  const navItems = [
    { id: 'dashboard' as const, label: 'Home', icon: FileText },
    { id: 'invoices' as const, label: 'Invoices', icon: FileText },
    { id: 'customers' as const, label: 'Clients', icon: Users },
    { id: 'jobs' as const, label: 'Jobs', icon: Wrench },
    { id: 'quotes' as const, label: 'Quotes', icon: FileSpreadsheet },
  ];

  return (
    <div className={`md:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-lg pb-safe no-print shadow-2xl transition-colors ${
      isLight ? 'bg-white/95 border-slate-200' : 'bg-stone-900/95 border-stone-800'
    }`}>
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`mobile-bottom-nav-${item.id}`}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 transition-all duration-150 active:scale-95 cursor-pointer relative ${
                isActive
                  ? 'text-amber-500 font-bold'
                  : isLight ? 'text-slate-500 hover:text-slate-800' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              {/* Active Indicator */}
              {isActive && (
                <span className="absolute top-1 w-6 h-0.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500" />
              )}
              
              <div
                className={`p-1 rounded-lg transition-colors ${
                  isActive ? 'bg-amber-500/15' : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-amber-500' : isLight ? 'text-slate-500' : 'text-stone-400'}`} />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 leading-none">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

