import React from 'react';
import { ArrowRight, BriefcaseBusiness, CalendarClock, CheckCircle2, DollarSign, FileText, Gauge, Users } from 'lucide-react';
import { Customer, Invoice, SaaSUser, StockItem, WorkshopJob } from '../types';

interface OperatorDashboardProps {
  user: SaaSUser;
  jobs: WorkshopJob[];
  customers: Customer[];
  invoices: Invoice[];
  stock: StockItem[];
  isOnline: boolean;
  pendingSyncCount: number;
  onNavigate?: (tab: 'dashboard' | 'jobs' | 'quotes' | 'invoices' | 'customers' | 'operations') => void;
  onQuickCreateInvoice: () => void;
}

export const OperatorDashboard: React.FC<OperatorDashboardProps> = ({ user, jobs, customers, invoices, stock, isOnline, pendingSyncCount, onNavigate, onQuickCreateInvoice }) => {
  const openJobs = jobs.filter((job) => job.status !== 'completed' && job.status !== 'paid' && job.status !== 'invoiced');
  const today = new Date().toISOString().slice(0, 10);
  const monthKey = today.slice(0, 7);
  const dueToday = jobs.filter((job) => job.dueDate === today).length;
  const totalOutstanding = invoices
    .filter((inv) => inv.balanceDue > 0)
    .reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);
  const overdueInvoices = invoices.filter((invoice) => invoice.balanceDue > 0 && invoice.dueDate < today);
  const jobsThisMonth = jobs.filter((job) => job.createdAt.startsWith(monthKey)).length;
  const completedJobs = jobs.filter((job) => job.status === 'completed' || job.status === 'invoiced' || job.status === 'paid').length;
  const completedToday = jobs.filter((job) => job.statusHistory?.some((entry) => entry.status === 'completed' && entry.changedAt.startsWith(today))).length;
  const completedThisMonth = jobs.filter((job) => job.statusHistory?.some((entry) => entry.status === 'completed' && entry.changedAt.startsWith(monthKey)) || (job.status === 'completed' && job.createdAt.startsWith(monthKey))).length;
  const fieldJobs = jobs.filter((job) => /field|site|onsite/i.test(`${job.serviceType} ${job.assignedTo}`));
  const siteVisitsToday = fieldJobs.filter((job) => job.dueDate === today);
  const jobsAwaitingCompletion = fieldJobs.filter((job) => ['approved', 'in_progress'].includes(job.status));
  const siteNotesPending = fieldJobs.filter((job) => !job.siteNotes?.trim() && !['completed', 'invoiced', 'paid'].includes(job.status));
  const completedNotInvoiced = fieldJobs.filter((job) => job.status === 'completed');
  const lowStockItems = stock.filter((item) => item.quantity <= item.reorderLevel);
  const paymentsReceived = invoices.reduce((sum, invoice) => sum + invoice.depositPaid, 0);
  const weekEnd = new Date();
  weekEnd.setDate(weekEnd.getDate() + 7);
  const dueThisWeek = invoices.filter((invoice) => invoice.balanceDue > 0 && invoice.dueDate >= today && invoice.dueDate <= weekEnd.toISOString().slice(0, 10)).reduce((sum, invoice) => sum + invoice.balanceDue, 0);
  const aging = [
    { label: 'Not yet due', total: 0 },
    { label: '1-30 days overdue', total: 0 },
    { label: '31-60 days overdue', total: 0 },
    { label: '61+ days overdue', total: 0 }
  ];
  invoices.filter((invoice) => invoice.balanceDue > 0).forEach((invoice) => {
    const overdueDays = Math.floor((new Date(today).getTime() - new Date(invoice.dueDate).getTime()) / 86400000);
    const bucket = overdueDays <= 0 ? 0 : overdueDays <= 30 ? 1 : overdueDays <= 60 ? 2 : 3;
    aging[bucket].total += invoice.balanceDue;
  });
  const customerAging = [...new Set(invoices.filter((invoice) => invoice.balanceDue > 0).map((invoice) => invoice.customerName))]
    .map((name) => ({ name, balance: invoices.filter((invoice) => invoice.customerName === name && invoice.balanceDue > 0).reduce((sum, invoice) => sum + invoice.balanceDue, 0), oldestDue: invoices.filter((invoice) => invoice.customerName === name && invoice.balanceDue > 0).map((invoice) => invoice.dueDate).sort()[0] }))
    .sort((a, b) => b.balance - a.balance).slice(0, 6);
  const statusBreakdown = ['new', 'quoted', 'approved', 'in_progress', 'completed', 'invoiced', 'paid'].map((status) => ({ status, count: jobs.filter((job) => job.status === status).length }));
  const isFinanceView = user.role === 'Finance & Invoicing Manager';
  const isSupervisorView = user.role === 'Operations & Machining Lead';
  const workshopJobs = jobs.filter((job) => !/field|site|onsite/i.test(`${job.serviceType} ${job.assignedTo}`));
  const completedWorkshopJobs = workshopJobs.filter((job) => ['completed', 'invoiced', 'paid'].includes(job.status)).length;
  const topCustomers = [...new Set(invoices.map((invoice) => invoice.customerName))]
    .map((name) => ({ name, revenue: invoices.filter((invoice) => invoice.customerName === name).reduce((sum, invoice) => sum + invoice.total, 0) }))
    .sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const monthlyRevenue = Array.from({ length: 6 }, (_, index) => {
    const month = new Date(new Date().getFullYear(), new Date().getMonth() - (5 - index), 1);
    const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
    const revenue = invoices.filter((invoice) => invoice.date.startsWith(key)).reduce((sum, invoice) => sum + invoice.total, 0);
    return { label: month.toLocaleDateString(undefined, { month: 'short' }), revenue };
  });
  const maxMonthlyRevenue = Math.max(1, ...monthlyRevenue.map((entry) => entry.revenue));
  const serviceTotals: Record<string, number> = {};
  invoices.forEach((invoice) => {
    serviceTotals[invoice.serviceCategory] = (serviceTotals[invoice.serviceCategory] || 0) + invoice.total;
  });
  const serviceRevenue: [string, number][] = Object.entries(serviceTotals).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const dashboardCards = user.role === 'Workshop Lead'
    ? [
      { label: 'Open jobs', value: String(openJobs.length), icon: BriefcaseBusiness, tone: 'amber' },
      { label: 'Jobs due today', value: String(dueToday), icon: CalendarClock, tone: 'rose' },
      { label: 'In progress jobs', value: String(jobs.filter((job) => job.status === 'in_progress').length), icon: Gauge, tone: 'sky' },
      { label: 'Completed today', value: String(completedToday), icon: CheckCircle2, tone: 'emerald' },
      { label: 'Low stock items', value: String(lowStockItems.length), icon: FileText, tone: 'rose' }
    ]
    : user.role === 'Field Service Specialist'
    ? [
      { label: "Today's site visits", value: String(siteVisitsToday.length), icon: CalendarClock, tone: 'amber' },
      { label: 'Awaiting completion', value: String(jobsAwaitingCompletion.length), icon: BriefcaseBusiness, tone: 'sky' },
      { label: 'Site notes pending', value: String(siteNotesPending.length), icon: FileText, tone: 'rose' },
      { label: 'Completed, not invoiced', value: String(completedNotInvoiced.length), icon: CheckCircle2, tone: 'emerald' },
      { label: 'Pending sync', value: isOnline ? String(pendingSyncCount) : 'Offline', icon: Gauge, tone: isOnline ? 'sky' : 'rose' }
    ]
    : user.role === 'Finance & Invoicing Manager'
    ? [
      { label: 'Outstanding invoices', value: `$${totalOutstanding.toLocaleString()}`, icon: DollarSign, tone: 'amber' },
      { label: 'Overdue balances', value: `$${overdueInvoices.reduce((sum, invoice) => sum + invoice.balanceDue, 0).toLocaleString()}`, icon: CalendarClock, tone: 'rose' },
      { label: 'Payments received', value: `$${paymentsReceived.toLocaleString()}`, icon: CheckCircle2, tone: 'emerald' },
      { label: 'Due this week', value: `$${dueThisWeek.toLocaleString()}`, icon: CalendarClock, tone: 'sky' },
      { label: 'Revenue this month', value: `$${monthlyRevenue.at(-1)?.revenue.toLocaleString() || '0'}`, icon: DollarSign, tone: 'amber' }
    ]
    : [
      { label: 'Active jobs', value: String(openJobs.length), icon: BriefcaseBusiness, tone: 'amber' },
      { label: 'Completed this month', value: String(completedThisMonth), icon: CheckCircle2, tone: 'emerald' },
      { label: 'Total outstanding', value: `$${totalOutstanding.toLocaleString()}`, icon: DollarSign, tone: 'rose' },
      { label: 'Top customers', value: String(topCustomers.length), icon: Users, tone: 'sky' },
      { label: 'Workshop productivity', value: `${workshopJobs.length ? Math.round(completedWorkshopJobs / workshopJobs.length * 100) : 0}%`, icon: Gauge, tone: 'emerald' }
    ];

  const quickActions = user.role === 'Field Service Specialist'
    ? [
      { label: 'Open assigned job list', tab: 'jobs' as const },
      { label: 'Add site note or communication', tab: 'operations' as const },
      { label: 'Review completed jobs for billing', tab: 'invoices' as const }
    ]
    : user.role === 'Finance & Invoicing Manager'
    ? [
      { label: 'Review outstanding invoices', tab: 'invoices' as const },
      { label: 'Open customer accounts', tab: 'customers' as const },
      { label: 'Review quotes', tab: 'quotes' as const }
    ]
    : [
      { label: 'Create work order', tab: 'jobs' as const },
      { label: 'Open quote builder', tab: 'quotes' as const },
      { label: 'Review outstanding invoices', tab: 'invoices' as const },
      { label: 'Check field service schedule', tab: 'jobs' as const }
    ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-stone-800 bg-stone-900 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">Operator dashboard</p>
          <h2 className="mt-1 text-2xl font-black text-white">{user.role}</h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-stone-300">
          <Gauge className="h-4 w-4 text-amber-400" />
          <span>{jobsThisMonth} active operational records</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {dashboardCards.map((card) => {
          const Icon = card.icon;
          const toneMap = {
            amber: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
            emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
            rose: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
            sky: 'bg-sky-500/10 text-sky-300 border-sky-500/20'
          };

          return (
            <div key={card.label} className="rounded-xl border border-stone-700 bg-stone-900 p-4">
              <div className={`inline-flex rounded-xl border p-2 ${toneMap[card.tone as keyof typeof toneMap]}`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="mt-4 text-xs uppercase tracking-[0.15em] text-stone-300">{card.label}</p>
              <p className="mt-2 text-2xl font-black text-white">{card.value}</p>
            </div>
          );
        })}
      </div>

      {(isFinanceView || isSupervisorView) && <div className="grid gap-5 xl:grid-cols-3">
        <section className="rounded-xl border border-stone-700 bg-stone-900 p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between"><div><h3 className="text-sm font-bold text-white">Revenue by month</h3><p className="mt-1 text-xs text-stone-300">Invoiced value · last six months</p></div><DollarSign className="h-4 w-4 text-amber-300"/></div>
          <div className="grid h-40 grid-cols-6 items-end gap-3 border-b border-stone-600 pb-2">{monthlyRevenue.map((entry) => <div key={entry.label} className="flex h-full flex-col items-center justify-end gap-2"><span className="text-[10px] font-semibold text-stone-200">${entry.revenue >= 1000 ? `${(entry.revenue / 1000).toFixed(1)}k` : entry.revenue.toFixed(0)}</span><div title={`$${entry.revenue.toFixed(2)}`} className="w-full max-w-12 rounded-t bg-amber-500" style={{ height: `${Math.max(5, entry.revenue / maxMonthlyRevenue * 100)}%` }}/><span className="text-xs text-stone-300">{entry.label}</span></div>)}</div>
        </section>
        <section className="rounded-xl border border-stone-700 bg-stone-900 p-5">
          <h3 className="text-sm font-bold text-white">Workshop productivity</h3><p className="mt-1 text-xs text-stone-300">Completed workshop jobs</p>
          <p className="mt-4 text-3xl font-black text-white">{completedWorkshopJobs}<span className="text-base font-medium text-stone-300"> / {workshopJobs.length}</span></p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-700"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${workshopJobs.length ? completedWorkshopJobs / workshopJobs.length * 100 : 0}%` }}/></div>
          <p className="mt-4 text-xs text-stone-200">Field service activity <strong className="text-amber-200">{fieldJobs.length}</strong> jobs · {fieldJobs.filter((job) => ['completed', 'invoiced', 'paid'].includes(job.status)).length} completed</p>
          <p className="mt-1 text-xs text-stone-300">{jobsThisMonth} jobs created this month · {dueToday} due today</p>
        </section>
      </div>}

      {user.role === 'Field Service Specialist' && (
        <section className="grid gap-5 xl:grid-cols-3">
          <div className="rounded-xl border border-stone-700 bg-stone-900 p-5 xl:col-span-2">
            <h3 className="mb-3 text-sm font-bold text-white">Today's site visits</h3>
            <div className="space-y-2">{siteVisitsToday.map((job) => <article key={job.id} className="rounded-lg border border-stone-700 bg-stone-800/80 p-3"><p className="font-semibold text-white">{job.title}</p><p className="mt-1 text-xs text-stone-200">{job.customerName} · {job.equipmentName} · {job.assignedTo}</p><p className="mt-1 text-xs text-stone-300">{job.siteDetails || 'Site details not recorded'}</p></article>)}{siteVisitsToday.length === 0 && <p className="text-sm text-stone-300">No site visits scheduled for today.</p>}</div>
            <div className="mt-4 grid gap-4 md:grid-cols-2"><div><h4 className="mb-2 text-xs font-bold uppercase text-stone-100">Awaiting completion</h4>{jobsAwaitingCompletion.slice(0, 4).map((job) => <p key={job.id} className="mb-1 text-xs text-stone-200">{job.title} · {job.status}</p>)}</div><div><h4 className="mb-2 text-xs font-bold uppercase text-stone-100">Site notes pending</h4>{siteNotesPending.slice(0, 4).map((job) => <p key={job.id} className="mb-1 text-xs text-amber-100">{job.title} · {job.customerName}</p>)}</div></div>
            <button type="button" onClick={() => onNavigate?.('jobs')} className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-100">Open field job list</button>
          </div>
          <div className="rounded-xl border border-stone-700 bg-stone-900 p-5"><h3 className="text-sm font-bold text-white">Field sync status</h3><p className={`mt-3 text-sm font-semibold ${isOnline ? 'text-emerald-200' : 'text-amber-200'}`}>{isOnline ? 'Connection available' : 'Offline · work saved locally'}</p><p className="mt-2 text-xs text-stone-200">{pendingSyncCount} pending uploads</p><h4 className="mt-5 text-xs font-bold uppercase text-stone-100">Completed but not invoiced</h4>{completedNotInvoiced.slice(0, 4).map((job) => <p key={job.id} className="mt-2 text-xs text-stone-200">{job.title} · {job.customerName}</p>)}{completedNotInvoiced.length === 0 && <p className="mt-2 text-xs text-stone-300">No completed jobs awaiting billing.</p>}</div>
        </section>
      )}

      {user.role === 'Workshop Lead' && (
        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-xl border border-stone-700 bg-stone-900 p-5"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-bold text-white">Low stock items</h3><button type="button" onClick={() => onNavigate?.('operations')} className="rounded-lg border border-stone-600 px-2 py-1 text-xs font-semibold text-stone-100">Manage stock</button></div>{lowStockItems.slice(0, 6).map((item) => <p key={item.id} className="mt-3 flex justify-between gap-3 text-sm text-stone-100"><span>{item.name}</span><span className="text-rose-200">{item.quantity} · reorder at {item.reorderLevel}</span></p>)}{lowStockItems.length === 0 && <p className="mt-3 text-sm text-stone-300">No items are at or below reorder level.</p>}</div>
          <div className="rounded-xl border border-stone-700 bg-stone-900 p-5"><h3 className="text-sm font-bold text-white">Invoice action</h3><p className="mt-2 text-sm text-stone-200">Create an invoice for completed workshop production.</p><button type="button" onClick={onQuickCreateInvoice} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-stone-950 hover:bg-amber-400"><FileText className="h-4 w-4"/>Quick create invoice</button></div>
        </section>
      )}

      {(isSupervisorView || isFinanceView) && <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-stone-700 bg-stone-900 p-5"><h3 className="mb-3 text-sm font-bold text-white">Top customers</h3><div className="space-y-3">{topCustomers.map((entry, index) => <div key={entry.name} className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-stone-600 bg-stone-800 text-xs font-bold text-amber-200">{index + 1}</span><span className="truncate text-sm font-medium text-stone-100">{entry.name}</span></div><span className="shrink-0 text-sm font-semibold text-white">${entry.revenue.toLocaleString()}</span></div>)}{topCustomers.length === 0 && <p className="text-sm text-stone-300">Customer revenue will appear as invoices are recorded.</p>}</div></section>
        <section className="rounded-xl border border-stone-700 bg-stone-900 p-5"><h3 className="mb-3 text-sm font-bold text-white">Service category revenue</h3><div className="space-y-3">{serviceRevenue.map(([category, revenue]) => <div key={category}><div className="mb-1 flex justify-between gap-3 text-xs"><span className="capitalize text-stone-200">{category.replace(/_/g, ' ')}</span><span className="font-semibold text-white">${revenue.toLocaleString()}</span></div><div className="h-1.5 rounded-full bg-stone-700"><div className="h-full rounded-full bg-orange-400" style={{ width: `${Math.max(3, revenue / Math.max(1, serviceRevenue[0]?.[1] || 1) * 100)}%` }}/></div></div>)}{serviceRevenue.length === 0 && <p className="text-sm text-stone-300">Service revenue will appear as invoices are recorded.</p>}</div></section>
      </div>}

      {isFinanceView && <section className="rounded-xl border border-stone-700 bg-stone-900 p-5"><h3 className="mb-4 text-sm font-bold text-white">Customer aging</h3><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{aging.map((bucket) => <div key={bucket.label} className="rounded-lg border border-stone-700 bg-stone-800/80 p-3"><p className="text-xs font-semibold text-stone-200">{bucket.label}</p><p className="mt-2 text-lg font-bold text-white">${bucket.total.toLocaleString()}</p></div>)}</div><div className="mt-4 space-y-2">{customerAging.map((customer) => <div key={customer.name} className="flex justify-between gap-3 border-b border-stone-700 pb-2 text-sm"><span className="truncate text-stone-100">{customer.name}<span className="ml-2 text-xs text-stone-300">Oldest due {customer.oldestDue}</span></span><strong className="shrink-0 text-amber-100">${customer.balance.toLocaleString()}</strong></div>)}</div></section>}

      {isSupervisorView && <section className="rounded-xl border border-stone-700 bg-stone-900 p-5"><h3 className="mb-4 text-sm font-bold text-white">Job status breakdown</h3><div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-7">{statusBreakdown.map(({ status, count }) => <div key={status} className="rounded-lg border border-stone-700 bg-stone-800/80 p-3"><p className="text-xs capitalize text-stone-200">{status.replace('_', ' ')}</p><p className="mt-2 text-xl font-bold text-white">{count}</p></div>)}</div></section>}

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border border-stone-800 bg-stone-900 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-white">Recent work orders</h3>
            <button type="button" onClick={() => onNavigate?.('jobs')} className="inline-flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[11px] font-semibold text-amber-200">
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-3">
            {jobs.slice(0, 5).map((job) => (
              <div key={job.id} className="flex items-center justify-between rounded-lg border border-stone-700 bg-stone-800/80 p-3">
                <div>
                  <p className="font-semibold text-white">{job.title}</p>
                  <p className="text-xs text-stone-200">{job.customerName} • {job.equipmentName}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-amber-300">{job.status}</p>
                  <p className="text-[11px] text-stone-200">{job.dueDate}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-stone-800 bg-stone-900 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-stone-300">Quick actions</h3>
            <FileText className="h-4 w-4 text-amber-400" />
          </div>

          <div className="space-y-2">
            {quickActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => onNavigate?.(action.tab)}
                className="flex w-full items-center justify-between rounded-lg border border-stone-700 bg-stone-800/80 px-3 py-2 text-left text-sm text-white transition hover:border-amber-500/50 hover:bg-stone-700"
              >
                <span>{action.label}</span>
                <ArrowRight className="h-3.5 w-3.5 text-amber-400" />
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
            <div className="flex items-center gap-2 text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em]">Operational note</span>
            </div>
            <p className="mt-2 text-sm text-stone-200">Current focus: complete fabrication jobs and push approved work orders to billing.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
