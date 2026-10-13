import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  FileText,
  Users,
  Calculator,
  FileSpreadsheet,
  Wrench,
  Server,
  Download,
  PlusCircle,
  ArrowRight,
  X,
  Sparkles,
  Command
} from 'lucide-react';
import { Customer, Invoice } from '../types';
import { useTheme } from '../context/ThemeContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  invoices: Invoice[];
  onSelectTab: (tab: 'invoices' | 'customers' | 'spreadsheet' | 'formulas' | 'services') => void;
  onNewInvoice: () => void;
  onOpenServerModal: () => void;
  onSelectCustomer: (customer: Customer) => void;
  onSelectInvoice: (invoice: Invoice) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  customers,
  invoices,
  onSelectTab,
  onNewInvoice,
  onOpenServerModal,
  onSelectCustomer,
  onSelectInvoice
}) => {
  const { isLight } = useTheme();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Global keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent, but if mounted can toggle
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter items
  const cleanQ = query.trim().toLowerCase();

  const primaryActions = [
    {
      id: 'act_new_invoice',
      title: 'Create New Automated Invoice',
      subtitle: 'Open tax invoice generator with 7 LBF services',
      icon: PlusCircle,
      action: () => {
        onNewInvoice();
        onClose();
      },
      category: 'Actions'
    },
    {
      id: 'act_server_switcher',
      title: 'SaaS Server Switcher',
      subtitle: 'Switch to workshop LAN or cloud deployment',
      icon: Server,
      action: () => {
        onOpenServerModal();
        onClose();
      },
      category: 'Actions'
    },
    {
      id: 'act_nav_formulas',
      title: '7 Engineering Formulas Hub',
      subtitle: 'Boring RPM, Feed Rate, Rig Mobilization, Rebuilds',
      icon: Calculator,
      action: () => {
        onSelectTab('formulas');
        onClose();
      },
      category: 'Navigation'
    },
    {
      id: 'act_nav_spreadsheet',
      title: 'Excel Workbook & Live Formulas',
      subtitle: 'Open integrated XLSX spreadsheet studio',
      icon: FileSpreadsheet,
      action: () => {
        onSelectTab('spreadsheet');
        onClose();
      },
      category: 'Navigation'
    },
    {
      id: 'act_nav_customers',
      title: 'Customer Machinery Fleet Database',
      subtitle: 'Manage mining excavators, loaders, pin bore wear',
      icon: Users,
      action: () => {
        onSelectTab('customers');
        onClose();
      },
      category: 'Navigation'
    },
    {
      id: 'act_nav_services',
      title: '7 Core Machining Services Matrix',
      subtitle: 'Line boring, bucket repair, fabrication specs',
      icon: Wrench,
      action: () => {
        onSelectTab('services');
        onClose();
      },
      category: 'Navigation'
    }
  ];

  const matchedCustomers = cleanQ
    ? customers
        .filter(
          (c) =>
            c.companyName?.toLowerCase().includes(cleanQ) ||
            c.contactPerson?.toLowerCase().includes(cleanQ) ||
            c.equipmentFleet?.some((eq) => eq.model?.toLowerCase().includes(cleanQ) || eq.serialNumber?.toLowerCase().includes(cleanQ))
        )
        .slice(0, 5)
        .map((c) => ({
          id: `cust_${c.id}`,
          title: c.companyName || 'Unnamed Customer',
          subtitle: `${c.contactPerson || 'N/A'} · ${c.equipmentFleet?.length || 0} Machines · Bal: $${(c.balanceDue ?? 0).toLocaleString()}`,
          icon: Users,
          action: () => {
            onSelectCustomer(c);
            onClose();
          },
          category: 'Customer Fleets'
        }))
    : [];

  const matchedInvoices = cleanQ
    ? invoices
        .filter(
          (i) =>
            i.invoiceNumber?.toLowerCase().includes(cleanQ) ||
            i.customerName?.toLowerCase().includes(cleanQ) ||
            (i.equipmentInfo || (i as any).machineModel || '')?.toLowerCase().includes(cleanQ)
        )
        .slice(0, 5)
        .map((i) => ({
          id: `inv_${i.id}`,
          title: `${i.invoiceNumber || 'INV'} · ${i.customerName || 'Customer'}`,
          subtitle: `${i.equipmentInfo || (i as any).machineModel || 'General Work'} · $${(i.total ?? (i as any).totalAmount ?? 0).toLocaleString()} · ${(i.status || 'draft').toUpperCase()}`,
          icon: FileText,
          action: () => {
            onSelectInvoice(i);
            onClose();
          },
          category: 'Invoices'
        }))
    : [];

  const matchedActions = cleanQ
    ? primaryActions.filter(
        (a) => a.title.toLowerCase().includes(cleanQ) || a.subtitle.toLowerCase().includes(cleanQ)
      )
    : primaryActions;

  const allResults = [...matchedActions, ...matchedCustomers, ...matchedInvoices];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < allResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : allResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allResults[selectedIndex]) {
        allResults[selectedIndex].action();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-3 bg-stone-950/80 backdrop-blur-md no-print">
      <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden transition-all ${
        isLight
          ? 'bg-white border-slate-300 text-slate-900 shadow-slate-900/20'
          : 'bg-stone-900 border-stone-800 text-stone-100 shadow-black/80'
      }`}>
        
        {/* Search Input Bar */}
        <div className={`p-4 border-b flex items-center gap-3 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-stone-950/80 border-stone-800'
        }`}>
          <Search className="w-5 h-5 text-amber-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, customer, invoice #, formula, or tool..."
            className="flex-1 bg-transparent border-0 outline-none text-sm sm:text-base font-medium placeholder:text-stone-500"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded hover:bg-stone-800 text-stone-400 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <span className="hidden sm:inline text-[11px] font-mono px-2 py-0.5 rounded bg-stone-800 text-stone-400 border border-stone-700">
              ESC to close
            </span>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1">
          {allResults.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-400">
              No matching commands or records found for "{query}".
            </div>
          ) : (
            allResults.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-amber-500 text-stone-950 font-medium'
                      : isLight ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-stone-800/80 text-stone-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-stone-950/20 text-stone-950'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold truncate leading-tight">
                        {item.title}
                      </p>
                      <p className={`text-[11px] truncate mt-0.5 ${
                        isSelected ? 'text-stone-900/80' : 'text-stone-400'
                      }`}>
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                      isSelected
                        ? 'bg-stone-950/20 text-stone-950'
                        : isLight ? 'bg-slate-200 text-slate-600' : 'bg-stone-800 text-stone-400'
                    }`}>
                      {item.category}
                    </span>
                    <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? 'text-stone-950' : 'text-stone-500'}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className={`px-4 py-2.5 border-t text-[11px] flex items-center justify-between font-mono ${
          isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-stone-950 border-stone-800 text-stone-400'
        }`}>
          <div className="flex items-center gap-3">
            <span>&uarr;&darr; Navigate</span>
            <span>&crarr; Select</span>
            <span>ESC Close</span>
          </div>
          <span className="text-amber-500 font-semibold">LBF Quick Commander</span>
        </div>

      </div>
    </div>
  );
};
