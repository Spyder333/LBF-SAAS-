import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AutomatedInvoice } from './components/AutomatedInvoice';
import { CustomerDatabase } from './components/CustomerDatabase';
import { ExcelManager } from './components/ExcelManager';
import { FormulasHub } from './components/FormulasHub';
import { ServicesShowcase } from './components/ServicesShowcase';
import { InvoicePrintView } from './components/InvoicePrintView';
import { ServerSwitchModal } from './components/ServerSwitchModal';
import { LoginPage } from './components/LoginPage';
import { MobileBottomNav } from './components/MobileBottomNav';
import { CommandPalette } from './components/CommandPalette';
import { OperatorDashboard } from './components/OperatorDashboard';
import { JobBoard } from './components/JobBoard';
import { QuoteBuilder } from './components/QuoteBuilder';
import { OperationsHub } from './components/OperationsHub';
import { CommunicationEntry, Customer, FollowUpTask, Invoice, Quote, SaaSUser, ServerConfig, ServiceCategory, StockItem, WorkshopJob } from './types';
import { api, localStore } from './lib/api';
import { ServerManager } from './lib/serverConfig';
import { Wrench, Phone, Mail, MapPin, ShieldCheck, Server, WifiOff, FileSpreadsheet, Sun, Moon } from 'lucide-react';
import { useTheme } from './context/ThemeContext';

const INITIAL_JOBS: WorkshopJob[] = [];

const INITIAL_QUOTES: Quote[] = [];

const loadStoredList = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as T : fallback;
  } catch (error) {
    console.warn(`Unable to read ${key} from local storage`, error);
    return fallback;
  }
};

type AppTab = 'dashboard' | 'invoices' | 'customers' | 'spreadsheet' | 'formulas' | 'services' | 'jobs' | 'quotes' | 'operations';

const ALL_TABS: AppTab[] = ['dashboard', 'invoices', 'customers', 'spreadsheet', 'formulas', 'services', 'jobs', 'quotes', 'operations'];

const getRoleDashboardTabs = (role?: string): AppTab[] => {
  switch (role) {
    case 'Operations & Machining Lead':
      return ALL_TABS;
    case 'Field Service Specialist':
      return ['dashboard', 'jobs', 'customers', 'services', 'invoices', 'operations'];
    case 'Workshop Lead':
      return ['dashboard', 'jobs', 'spreadsheet', 'formulas', 'services', 'quotes', 'operations'];
    case 'Finance & Invoicing Manager':
      return ['dashboard', 'invoices', 'customers', 'quotes', 'operations'];
    default:
      return ['dashboard', 'invoices'];
  }
};

export default function App() {
  const { theme, toggleTheme, isLight } = useTheme();
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [jobs, setJobs] = useState<WorkshopJob[]>(() => loadStoredList<WorkshopJob[]>('lbf_jobs_v1', INITIAL_JOBS));
  const [quotes, setQuotes] = useState<Quote[]>(() => loadStoredList<Quote[]>('lbf_quotes_v1', INITIAL_QUOTES));
  const [stock, setStock] = useState<StockItem[]>(() => loadStoredList<StockItem[]>('lbf_stock_v1', []));
  const [followUpTasks, setFollowUpTasks] = useState<FollowUpTask[]>(() => loadStoredList<FollowUpTask[]>('lbf_followups_v1', []));
  const [communications, setCommunications] = useState<CommunicationEntry[]>(() => loadStoredList<CommunicationEntry[]>('lbf_communications_v1', []));
  const [isOnline, setIsOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(() => ServerManager.getSyncQueue().length);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => ServerManager.getLastSyncTime());
  const showStatusBanner = !isOnline || isSyncing || pendingSyncCount > 0;

  useEffect(() => {
    ['lbf_customers_v1', 'lbf_invoices_v1', 'lbf_jobs_v1', 'lbf_quotes_v1', 'lbf_stock_v1', 'lbf_followups_v1', 'lbf_communications_v1'].forEach((key) => {
      localStorage.removeItem(key);
    });
  }, []);
  
  // Requirement: "The app must start at login page"
  // If user is null, LoginPage is shown
  const [user, setUser] = useState<SaaSUser | null>(() => localStore.getSavedUser());
  const [activeServer, setActiveServer] = useState<ServerConfig>(() => ServerManager.getActiveServer());

  // Modals and Workflow states
  const [isServerModalOpen, setIsServerModalOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [activePrintInvoice, setActivePrintInvoice] = useState<Invoice | null>(null);
  const [preSelectedCustomerId, setPreSelectedCustomerId] = useState<string | null>(null);
  const [presetCalculation, setPresetCalculation] = useState<{ desc: string; total: number; formula: string } | null>(null);
  const [pendingQuoteForInvoice, setPendingQuoteForInvoice] = useState<Quote | null>(null);
  const [pendingJobForQuote, setPendingJobForQuote] = useState<WorkshopJob | null>(null);
  const [pendingJobIdForInvoice, setPendingJobIdForInvoice] = useState<string | null>(null);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Subscribe to server switches and sync changes
  useEffect(() => {
    let previousServerConfig = JSON.stringify(ServerManager.getActiveServer());
    const unsub = ServerManager.subscribe(() => {
      const server = ServerManager.getActiveServer();
      const currentServerConfig = JSON.stringify(server);
      setActiveServer(server);
      setPendingSyncCount(ServerManager.getSyncQueue().length);
      setLastSyncTime(ServerManager.getLastSyncTime());
      if (currentServerConfig !== previousServerConfig && navigator.onLine && ServerManager.getSyncQueue().length > 0) {
        previousServerConfig = currentServerConfig;
        setIsSyncing(true);
        void api.syncPendingQueue().then(() => {
          setPendingSyncCount(ServerManager.getSyncQueue().length);
          setLastSyncTime(ServerManager.getLastSyncTime());
        }).finally(() => setIsSyncing(false));
      } else {
        previousServerConfig = currentServerConfig;
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    const markOffline = () => setIsOnline(false);
    const syncWhenOnline = async () => {
      setIsOnline(navigator.onLine);
      if (!navigator.onLine || ServerManager.getSyncQueue().length === 0) return;
      setIsSyncing(true);
      try {
        await api.syncPendingQueue();
        setPendingSyncCount(ServerManager.getSyncQueue().length);
        setLastSyncTime(ServerManager.getLastSyncTime());
      } finally {
        setIsSyncing(false);
      }
    };
    window.addEventListener('online', syncWhenOnline);
    window.addEventListener('offline', markOffline);
    void syncWhenOnline();
    return () => {
      window.removeEventListener('online', syncWhenOnline);
      window.removeEventListener('offline', markOffline);
    };
  }, []);

  // Reload data whenever active server or login user changes
  useEffect(() => {
    if (!user) return;
    async function loadData() {
      const [loadedCusts, loadedInvs, loadedJobs, loadedQuotes, loadedStock, loadedTasks, loadedCommunications] = await Promise.all([
        api.getCustomers(),
        api.getInvoices(),
        api.getCollection<WorkshopJob>('operations/jobs', 'lbf_jobs_v1'),
        api.getCollection<Quote>('operations/quotes', 'lbf_quotes_v1'),
        api.getCollection<StockItem>('operations/inventory', 'lbf_stock_v1'),
        api.getCollection<FollowUpTask>('operations/tasks', 'lbf_followups_v1'),
        api.getCollection<CommunicationEntry>('operations/communications', 'lbf_communications_v1')
      ]);
      setCustomers(loadedCusts);
      setInvoices(loadedInvs);
      setJobs(loadedJobs.length ? loadedJobs : INITIAL_JOBS);
      setQuotes(loadedQuotes.length ? loadedQuotes : INITIAL_QUOTES);
      setStock(loadedStock);
      setFollowUpTasks(loadedTasks);
      setCommunications(loadedCommunications);
    }
    loadData();
  }, [user, activeServer.id]);

  const roleTabs = user ? getRoleDashboardTabs(user.role) : ALL_TABS;

  useEffect(() => {
    if (!user) return;
    if (!roleTabs.includes(activeTab)) {
      setActiveTab(roleTabs[0]);
    }
  }, [user, roleTabs, activeTab]);

  useEffect(() => {
    try {
      localStorage.setItem('lbf_jobs_v1', JSON.stringify(jobs));
    } catch (error) {
      console.warn('Unable to save jobs to local storage', error);
    }
  }, [jobs]);

  useEffect(() => {
    try {
      localStorage.setItem('lbf_quotes_v1', JSON.stringify(quotes));
    } catch (error) {
      console.warn('Unable to save quotes to local storage', error);
    }
  }, [quotes]);

  useEffect(() => {
    localStorage.setItem('lbf_stock_v1', JSON.stringify(stock));
  }, [stock]);

  useEffect(() => {
    localStorage.setItem('lbf_followups_v1', JSON.stringify(followUpTasks));
  }, [followUpTasks]);

  useEffect(() => {
    localStorage.setItem('lbf_communications_v1', JSON.stringify(communications));
  }, [communications]);

  useEffect(() => {
    setPendingSyncCount(ServerManager.getSyncQueue().length);
  }, [jobs, quotes, stock, followUpTasks, communications, invoices, customers]);

  const handleLogin = (authenticatedUser: SaaSUser) => {
    localStore.saveUser(authenticatedUser);
    setUser(authenticatedUser);
  };

  const handleSignOut = () => {
    localStore.saveUser(null);
    setUser(null);
    setIsServerModalOpen(false);
  };

  // Handlers for cross-module workflow integration
  const handleSelectCustomerForInvoice = (customer: Customer) => {
    setPreSelectedCustomerId(customer.id);
    setActiveTab('invoices');
  };

  const handleSendCalculationToInvoice = (desc: string, total: number, formula: string) => {
    setPresetCalculation({ desc, total, formula });
    setActiveTab('invoices');
  };

  const handleSelectServiceForInvoice = (serviceId: ServiceCategory) => {
    setActiveTab('invoices');
  };

  const handleConvertQuoteToInvoice = (quote: Quote) => {
    setPendingQuoteForInvoice(quote);
    setActiveTab('invoices');
  };

  const handleCreateQuoteFromJob = (job: WorkshopJob) => {
    setPendingJobForQuote(job);
    setActiveTab('quotes');
  };

  const handleCreateInvoiceFromJob = (customer: Customer, job: WorkshopJob) => {
    setPendingJobIdForInvoice(job.id);
    handleSelectCustomerForInvoice(customer);
  };

  const handleInvoiceCreated = (invoice: Invoice) => {
    if (!invoice.jobId) return;
    const job = jobs.find((entry) => entry.id === invoice.jobId);
    if (!job || job.status === 'invoiced' || job.status === 'paid') return;
    const updated: WorkshopJob = {
      ...job,
      status: 'invoiced',
      updatedBy: user?.name || 'Operator',
      statusHistory: [...(job.statusHistory || []), { status: 'invoiced', changedAt: new Date().toISOString(), changedBy: user?.name || 'Operator' }]
    };
    setJobs((current) => current.map((entry) => entry.id === updated.id ? updated : entry));
    ServerManager.enqueueSyncItem({ type: 'job', action: 'update', entityId: updated.id, data: updated });
    if (navigator.onLine) void api.syncPendingQueue();
  };

  const handleLogCommunication = (entry: Omit<CommunicationEntry, 'id' | 'createdAt' | 'createdBy'>) => {
    const communication: CommunicationEntry = {
      ...entry,
      id: `communication-${Date.now()}`,
      createdAt: new Date().toISOString(),
      createdBy: user?.name || 'Operator'
    };
    setCommunications((current) => [communication, ...current]);
    ServerManager.enqueueSyncItem({ type: 'communication', action: 'create', entityId: communication.id, data: communication });
    if (navigator.onLine) void api.syncPendingQueue();
  };

  // -------------------------------------------------------------
  // If no user is authenticated, start immediately at Login Page!
  // -------------------------------------------------------------
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-150 ${
      isLight ? 'bg-slate-100 text-slate-900' : 'bg-stone-950 text-stone-100'
    } selection:bg-amber-500 selection:text-black`}>
      
      {/* Sticky Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewInvoice={() => {
          setPreSelectedCustomerId(null);
          setPresetCalculation(null);
          setActiveTab('invoices');
        }}
        onOpenServerModal={() => setIsServerModalOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onSignOut={handleSignOut}
        user={user}
        activeServer={activeServer}
        visibleTabs={roleTabs}
      />

      {showStatusBanner && (
        <div role="status" className={`flex items-center justify-between border-b px-4 py-1.5 text-xs ${isOnline ? 'border-emerald-900/70 bg-emerald-950/70 text-emerald-100' : 'border-amber-800 bg-amber-950/80 text-amber-100'}`}>
          <span>
            {!isOnline
              ? 'Connection lost · queued changes will sync when the network returns'
              : isSyncing
                ? 'Syncing local changes...'
                : pendingSyncCount > 0
                  ? `Live workshop sync queued · ${pendingSyncCount} pending ${pendingSyncCount === 1 ? 'upload' : 'uploads'}`
                  : 'Connected · live workshop data remains available'}
          </span>
          <span>{lastSyncTime ? `Last sync ${new Date(lastSyncTime).toLocaleString()}` : pendingSyncCount > 0 ? `${pendingSyncCount} pending ${pendingSyncCount === 1 ? 'upload' : 'uploads'}` : ''}</span>
        </div>
      )}

      {/* Main Content Area - Optimized for High-Resolution Computer Displays */}
      <main className="flex-1 max-w-[1720px] 2xl:max-w-[1920px] w-full mx-auto px-3 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-4 sm:py-6 pb-24 md:pb-8 relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-amber-500/5 via-amber-500/0 to-transparent" />
        {activeTab === 'dashboard' && (
          <OperatorDashboard
            user={user}
            jobs={jobs}
            customers={customers}
            invoices={invoices}
            stock={stock}
            isOnline={isOnline}
            pendingSyncCount={pendingSyncCount}
            onNavigate={setActiveTab}
            onQuickCreateInvoice={() => {
              setPreSelectedCustomerId(null);
              setPresetCalculation(null);
              setActiveTab('invoices');
            }}
          />
        )}

        {activeTab === 'invoices' && (
          <AutomatedInvoice
            invoices={invoices}
            customers={customers}
            onUpdateInvoices={setInvoices}
            onViewPrintInvoice={(inv) => setActivePrintInvoice(inv)}
            preSelectedCustomerId={preSelectedCustomerId}
            onClearPreSelectedCustomer={() => setPreSelectedCustomerId(null)}
            initialPresetCalculation={presetCalculation}
            onClearPresetCalculation={() => setPresetCalculation(null)}
            initialQuote={pendingQuoteForInvoice}
            onClearInitialQuote={() => setPendingQuoteForInvoice(null)}
            initialJobId={pendingJobIdForInvoice}
            onClearInitialJobId={() => setPendingJobIdForInvoice(null)}
            onInvoiceCreated={handleInvoiceCreated}
            user={user}
            onLogCommunication={handleLogCommunication}
          />
        )}

        {activeTab === 'customers' && (
          <CustomerDatabase
            customers={customers}
            onUpdateCustomers={setCustomers}
            onSelectCustomerForInvoice={handleSelectCustomerForInvoice}
            invoices={invoices}
            jobs={jobs}
            user={user}
          />
        )}

        {activeTab === 'jobs' && (
          <JobBoard jobs={jobs} onUpdateJobs={setJobs} customers={customers} user={user} onCreateQuote={handleCreateQuoteFromJob} onCreateInvoice={handleCreateInvoiceFromJob} />
        )}

        {activeTab === 'quotes' && (
          <QuoteBuilder
            quotes={quotes}
            onUpdateQuotes={setQuotes}
            customers={customers}
            onConvertQuoteToInvoice={handleConvertQuoteToInvoice}
            user={user}
            onLogCommunication={handleLogCommunication}
            initialJob={pendingJobForQuote}
            onClearInitialJob={() => setPendingJobForQuote(null)}
          />
        )}

        {activeTab === 'operations' && (
          <OperationsHub
            user={user}
            customers={customers}
            jobs={jobs}
            stock={stock}
            tasks={followUpTasks}
            communications={communications}
            onUpdateJobs={setJobs}
            onUpdateStock={setStock}
            onUpdateTasks={setFollowUpTasks}
            onUpdateCommunications={setCommunications}
          />
        )}

        {activeTab === 'spreadsheet' && (
          <ExcelManager
            onCreateInvoiceFromCalculation={handleSendCalculationToInvoice}
          />
        )}

        {activeTab === 'formulas' && (
          <FormulasHub
            onSendToInvoice={handleSendCalculationToInvoice}
          />
        )}

        {activeTab === 'services' && (
          <ServicesShowcase
            onSelectServiceToInvoice={handleSelectServiceForInvoice}
            onOpenFormulaCalculator={() => setActiveTab('formulas')}
          />
        )}
      </main>

      {/* Mobile Fixed Bottom Dock Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewInvoice={() => {
          setPreSelectedCustomerId(null);
          setPresetCalculation(null);
          setActiveTab('invoices');
        }}
      />

      {/* Printable Invoice Modal */}
      {activePrintInvoice && (
        <InvoicePrintView
          invoice={activePrintInvoice}
          onClose={() => setActivePrintInvoice(null)}
        />
      )}

      {/* SaaS Server Switcher & Offline Synchronization Modal */}
      <ServerSwitchModal
        isOpen={isServerModalOpen}
        onClose={() => setIsServerModalOpen(false)}
        currentUser={user}
        onSignOut={handleSignOut}
        onUpdateUser={setUser}
      />

      {/* Global Quick Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        customers={customers}
        invoices={invoices}
        onSelectTab={(tab) => setActiveTab(tab)}
        onNewInvoice={() => {
          setPreSelectedCustomerId(null);
          setPresetCalculation(null);
          setActiveTab('invoices');
        }}
        onOpenServerModal={() => setIsServerModalOpen(true)}
        onSelectCustomer={(cust) => {
          setPreSelectedCustomerId(cust.id);
          setActiveTab('customers');
        }}
        onSelectInvoice={(inv) => {
          setActivePrintInvoice(inv);
        }}
      />

      {/* Industrial SaaS Footer */}
      <footer className="mt-auto bg-stone-900 border-t border-stone-800 text-xs text-stone-400 py-8 no-print">
        <div className="max-w-[1720px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-6 border-b border-stone-800">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded bg-amber-500 flex items-center justify-center text-stone-950 font-black font-industrial text-xs">
                  LBF
                </div>
                <span className="font-industrial font-bold text-sm text-white">LBF SOLUTIONS SAAS</span>
              </div>
              <p className="text-stone-400 text-xs leading-relaxed">
                Repair your buckets with us &bull; Lineboring and Fabrication solutions. Mobile Line Boring, Pin-Bore Restorations, Bucket Overhauls & CO2 Welding.
              </p>
              <div className="mt-3 flex items-center gap-2 text-[11px] font-mono text-amber-400/90">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
                <span>Tenant: {user.tenantName}</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-white mb-2 text-xs uppercase tracking-wider">Active Server Architecture</h4>
              <p className="text-xs text-stone-300 font-mono mb-1">{activeServer.name}</p>
              <p className="text-[11px] text-stone-400 truncate max-w-xs">{activeServer.url}</p>
              <button
                onClick={() => setIsServerModalOpen(true)}
                className="mt-2 text-xs text-amber-400 hover:text-amber-300 underline block cursor-pointer"
              >
                Switch Server &rarr;
              </button>
            </div>

            <div>
              <h4 className="font-bold text-white mb-2 text-xs uppercase tracking-wider">Field Response Dispatch</h4>
              <p className="flex items-center gap-2 text-stone-300 text-xs mb-1">
                <Phone className="w-3.5 h-3.5 text-amber-400" /> 077 900 4626
              </p>
              <a
                href="https://wa.me/263779004626"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-xs mb-1 font-medium transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp: +263 77 900 4626
              </a>
              <p className="flex items-center gap-2 text-stone-300 text-xs mb-1">
                <Mail className="w-3.5 h-3.5 text-amber-400" /> lineboringandfabrication@lbfsolutions.co.zw
              </p>
              <p className="flex items-center gap-2 text-stone-300 text-xs">
                <MapPin className="w-3.5 h-3.5 text-amber-400" /> Carlton Road, Harare, Zimbabwe, 17032
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white mb-2 text-xs uppercase tracking-wider">Operator Session</h4>
              <p className="text-xs text-stone-300">{user.name}</p>
              <p className="text-[11px] text-stone-400">{user.email}</p>
              <p className="text-[10px] text-amber-500 font-mono mt-0.5">{user.role}</p>
              <button
                onClick={handleSignOut}
                className="mt-2 text-xs text-rose-400 hover:text-rose-300 font-medium underline block cursor-pointer"
              >
                Log Out of SaaS Portal
              </button>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-stone-500">
            <p>&copy; {new Date().getFullYear()} Line Boring Fabrication (LBF) Solutions. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> ISO 9001 Alignment
              </span>
              <span>&bull;</span>
              <span>100% Offline Resilient Local Storage</span>
              <span>&bull;</span>
              <span>Multi-Tenant Cloud Hybrid</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
