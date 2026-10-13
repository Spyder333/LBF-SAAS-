import React, { useState, useRef, useEffect } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Users,
  Calculator,
  Wrench,
  Server,
  WifiOff,
  Plus,
  User as UserIcon,
  Sun,
  Moon,
  LogOut,
  Search,
  ChevronDown,
  ClipboardList
} from 'lucide-react';
import { SaaSUser, ServerConfig } from '../types';
import { useTheme } from '../context/ThemeContext';

type NavTab = 'dashboard' | 'invoices' | 'customers' | 'spreadsheet' | 'formulas' | 'services' | 'jobs' | 'quotes' | 'operations';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onNewInvoice: () => void;
  onOpenServerModal: () => void;
  onOpenCommandPalette: () => void;
  activeServer: ServerConfig;
  user: SaaSUser | null;
  onSignOut: () => void;
  visibleTabs?: NavTab[];
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onNewInvoice,
  onOpenServerModal,
  onOpenCommandPalette,
  activeServer,
  user,
  onSignOut,
  visibleTabs
}) => {
  const { toggleTheme, isLight } = useTheme();
  const isOffline = activeServer.id === 'offline_local';
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FileText },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'customers', label: 'Fleets', icon: Users },
    { id: 'jobs', label: 'Jobs', icon: Wrench },
    { id: 'quotes', label: 'Quotes', icon: FileSpreadsheet },
    { id: 'operations', label: 'Ops', icon: ClipboardList },
    { id: 'spreadsheet', label: 'Excel', icon: FileSpreadsheet },
    { id: 'formulas', label: 'Formulas', icon: Calculator },
    { id: 'services', label: 'Services', icon: Wrench }
  ] as const;

  const visibleNavItems = visibleTabs
    ? navItems.filter((item) => visibleTabs.includes(item.id))
    : navItems;

  return (
    <header className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors duration-150 no-print select-none ${
      isLight
        ? 'bg-white/95 border-slate-200 shadow-sm'
        : 'bg-stone-900/95 border-stone-800 shadow-lg shadow-black/40'
    }`}>
      {/* Container - constrained to ensure ZERO horizontal sliding across all screen widths */}
      <div className="w-full max-w-[1920px] mx-auto px-2.5 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-3">
          
          {/* ZONE 1: COMPACT BRAND IDENTITY */}
          <div
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer shrink-0 group"
            onClick={() => setActiveTab('invoices')}
            title="LBF Solutions - Industrial Portal"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-stone-950 font-black font-industrial tracking-wider text-base sm:text-lg border border-amber-400/50 shadow-sm shadow-amber-500/20 group-hover:scale-105 transition-transform">
              LBF
            </div>
            <div className="leading-tight">
              <span className={`font-industrial text-sm sm:text-base font-bold tracking-wide block ${
                isLight ? 'text-slate-950' : 'text-white'
              }`}>
                LBF SOLUTIONS
              </span>
              <span className={`hidden xl:block text-[10px] leading-none ${
                isLight ? 'text-slate-500' : 'text-stone-400'
              }`}>
                Workshop Machining Portal
              </span>
            </div>
          </div>

          {/* ZONE 2: PRIMARY SEGMENTED NAVIGATION (Compact, never overflows) */}
          <nav className={`hidden md:flex items-center p-1 rounded-xl border shrink-0 ${
            isLight
              ? 'bg-slate-100/90 border-slate-200'
              : 'bg-stone-950/70 border-stone-800/80'
          }`}>
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-btn-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-stone-950 font-bold shadow-sm shadow-amber-500/30'
                      : isLight
                        ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                        : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-stone-950' : 'text-amber-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* ZONE 3: CONSOLIDATED ACTION & CONTROL SUITE (Always 100% visible, ZERO sliding) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Quick Search Trigger (Ctrl+K) */}
            <button
              onClick={onOpenCommandPalette}
              title="Quick Search & Commands (Ctrl+K)"
              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                isLight
                  ? 'bg-slate-100 border-slate-300 text-slate-700 hover:border-amber-500'
                  : 'bg-stone-950/70 border-stone-800 text-stone-300 hover:border-amber-500/50'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="hidden xl:inline text-[11px] text-stone-400">Search</span>
              <kbd className={`hidden sm:inline text-[9px] font-mono px-1 py-0.5 rounded border leading-none ${
                isLight ? 'bg-white border-slate-300 text-slate-500' : 'bg-stone-800 border-stone-700 text-stone-400'
              }`}>
                Ctrl+K
              </kbd>
            </button>

            {/* Quick Create Invoice Primary Action */}
            <button
              id="quick-new-invoice-btn"
              onClick={onNewInvoice}
              title="Create New Tax Invoice"
              className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-2.5 sm:px-3 py-1.5 rounded-xl text-xs transition-all active:scale-95 shadow-sm shadow-amber-500/20 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">New</span>
            </button>

            {/* Consolidated System Bar: Server + Theme + Direct Logout */}
            <div className={`flex items-center p-0.5 rounded-xl border shrink-0 ${
              isLight ? 'bg-slate-100 border-slate-300' : 'bg-stone-950 border-stone-800'
            }`}>
              
              {/* Connect Server Button / Offline Indicator */}
              <button
                id="server-status-pill"
                onClick={onOpenServerModal}
                title={`Server: ${activeServer.name}. Click to switch servers or test network.`}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
                  isOffline
                    ? 'text-amber-400 hover:bg-amber-500/10'
                    : 'text-emerald-400 hover:bg-emerald-500/10'
                }`}
              >
                {isOffline ? (
                  <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                ) : (
                  <Server className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                )}
                <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-wider">
                  {isOffline ? 'Offline' : 'Server'}
                </span>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isOffline ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
              </button>

              {/* Theme Toggle Button (1-Click switch) */}
              <button
                id="theme-toggle-btn"
                type="button"
                onClick={toggleTheme}
                title={isLight ? 'Switch to Dark Theme (Workshop Mode)' : 'Switch to Light Theme (Field Mode)'}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isLight
                    ? 'text-amber-700 hover:bg-slate-200'
                    : 'text-amber-400 hover:bg-stone-800'
                }`}
              >
                {isLight ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>

              {/* Direct Quick Logout Button (Always 1 click away!) */}
              <button
                onClick={onSignOut}
                title="Sign Out of Portal"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer text-rose-400 hover:bg-rose-500/10`}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* User Account Pill & Dropdown */}
            <div className="relative shrink-0" ref={userMenuRef}>
              <button
                id="user-account-btn"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                title={`Account: ${user?.name || 'Operator'}`}
                className={`flex items-center gap-1.5 p-1 sm:px-2 py-1 rounded-xl border transition-all cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300'
                    : 'bg-stone-800/90 hover:bg-stone-700 border-stone-700'
                }`}
              >
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs border border-amber-500/30 shrink-0">
                  {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-3 h-3" />}
                </div>
                <span className="hidden md:inline text-xs font-semibold max-w-[80px] truncate leading-none">
                  {user?.name ? user.name.split(' ')[0] : 'User'}
                </span>
                <ChevronDown className="w-3 h-3 text-stone-400 hidden sm:block shrink-0" />
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className={`absolute right-0 mt-2 w-56 rounded-xl border shadow-xl p-2 z-50 transition-all ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-900 shadow-slate-900/15'
                    : 'bg-stone-900 border-stone-800 text-stone-100 shadow-black/60'
                }`}>
                  <div className="px-3 py-2 border-b border-stone-800/40 mb-1">
                    <p className="font-bold text-xs truncate">{user?.name || 'Workshop Operator'}</p>
                    <p className="text-[11px] text-stone-400 truncate">{user?.email || 'lineboring@lbfsolutions.co.zw'}</p>
                    <p className="text-[10px] text-amber-500 font-mono mt-1">Tenant: {user?.tenantName || 'Harare Machining'}</p>
                  </div>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onOpenServerModal();
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2 transition-colors cursor-pointer ${
                      isLight ? 'hover:bg-slate-100' : 'hover:bg-stone-800 text-stone-200'
                    }`}
                  >
                    <Server className="w-3.5 h-3.5 text-amber-500" />
                    <span>Connect / Switch Server</span>
                  </button>

                  <button
                    onClick={() => {
                      toggleTheme();
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2 transition-colors cursor-pointer ${
                      isLight ? 'hover:bg-slate-100' : 'hover:bg-stone-800 text-stone-200'
                    }`}
                  >
                    {isLight ? <Moon className="w-3.5 h-3.5 text-amber-500" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
                    <span>Switch Theme ({isLight ? 'Dark' : 'Light'})</span>
                  </button>

                  <div className="border-t border-stone-800/40 my-1" />

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onSignOut();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2 text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Mobile Sub-Navigation Bar (Only for phone screens below 768px, cleanly fitting all 5 items with ZERO overflow) */}
        <div className={`grid grid-cols-5 md:hidden py-1.5 border-t text-xs gap-1 ${
          isLight ? 'border-slate-200' : 'border-stone-800'
        }`}>
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-stone-950 font-bold'
                    : isLight
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-stone-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5 mb-0.5" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
};
