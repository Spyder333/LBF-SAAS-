import React, { useState } from 'react';
import { Bell, Check, ClipboardList, MessageSquare, PackagePlus, Plus, Send, Trash2 } from 'lucide-react';
import { CommunicationEntry, Customer, FollowUpTask, SaaSUser, StockItem, WorkshopJob } from '../types';
import { ServerManager } from '../lib/serverConfig';
import { api } from '../lib/api';

interface OperationsHubProps {
  user: SaaSUser;
  customers: Customer[];
  jobs: WorkshopJob[];
  stock: StockItem[];
  tasks: FollowUpTask[];
  communications: CommunicationEntry[];
  onUpdateJobs: (items: WorkshopJob[]) => void;
  onUpdateStock: (items: StockItem[]) => void;
  onUpdateTasks: (items: FollowUpTask[]) => void;
  onUpdateCommunications: (items: CommunicationEntry[]) => void;
}

const saveOffline = (type: 'inventory' | 'task' | 'communication', data: unknown, entityId: string) => {
  ServerManager.enqueueSyncItem({ type, action: 'update', entityId, data });
  if (navigator.onLine) void api.syncPendingQueue();
};

export const OperationsHub: React.FC<OperationsHubProps> = ({
  user, customers, jobs, stock, tasks, communications,
  onUpdateJobs,
  onUpdateStock, onUpdateTasks, onUpdateCommunications
}) => {
  const [stockName, setStockName] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [stockSupplier, setStockSupplier] = useState('');
  const [stockCost, setStockCost] = useState('');
  const [reorderLevel, setReorderLevel] = useState('');
  const [assignedJobId, setAssignedJobId] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCustomer, setTaskCustomer] = useState('');
  const [taskDueDate, setTaskDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [noteCustomer, setNoteCustomer] = useState('');
  const [noteSubject, setNoteSubject] = useState('');
  const [noteChannel, setNoteChannel] = useState<CommunicationEntry['channel']>('note');

  const addStock = (event: React.FormEvent) => {
    event.preventDefault();
    if (!stockName.trim()) return;
    const item: StockItem = {
      id: `stock-${Date.now()}`, name: stockName.trim(), quantity: Number(stockQuantity) || 0,
      supplier: stockSupplier.trim(), unitCost: Number(stockCost) || 0,
      reorderLevel: Number(reorderLevel) || 0, assignedJobId: assignedJobId || undefined,
      usedQuantity: 0, updatedAt: new Date().toISOString(), updatedBy: user.name
    };
    onUpdateStock([item, ...stock]);
    saveOffline('inventory', item, item.id);
    setStockName(''); setStockQuantity(''); setStockSupplier(''); setStockCost(''); setReorderLevel(''); setAssignedJobId('');
  };

  const recordUsage = (item: StockItem, amount: number) => {
    if (amount <= 0 || amount > item.quantity) return;
    const updated = { ...item, quantity: item.quantity - amount, usedQuantity: (item.usedQuantity || 0) + amount, updatedAt: new Date().toISOString(), updatedBy: user.name };
    onUpdateStock(stock.map((entry) => entry.id === item.id ? updated : entry));
    saveOffline('inventory', updated, item.id);
    const assignedJob = jobs.find((job) => job.id === item.assignedJobId);
    if (assignedJob) {
      const updatedJob = { ...assignedJob, materialsCost: (assignedJob.materialsCost || 0) + item.unitCost * amount, updatedBy: user.name };
      onUpdateJobs(jobs.map((job) => job.id === assignedJob.id ? updatedJob : job));
      ServerManager.enqueueSyncItem({ type: 'job', action: 'update', entityId: updatedJob.id, data: updatedJob });
      if (navigator.onLine) void api.syncPendingQueue();
    }
  };

  const addTask = (event: React.FormEvent) => {
    event.preventDefault();
    if (!taskTitle.trim()) return;
    const task: FollowUpTask = {
      id: `task-${Date.now()}`, customerName: taskCustomer || 'General follow-up', title: taskTitle.trim(),
      dueDate: taskDueDate, completed: false, createdAt: new Date().toISOString(), createdBy: user.name
    };
    onUpdateTasks([task, ...tasks]); saveOffline('task', task, task.id); setTaskTitle('');
  };

  const toggleTask = (task: FollowUpTask) => {
    const updated = { ...task, completed: !task.completed };
    onUpdateTasks(tasks.map((entry) => entry.id === task.id ? updated : entry));
    saveOffline('task', updated, task.id);
  };

  const addCommunication = (event: React.FormEvent) => {
    event.preventDefault();
    if (!noteSubject.trim()) return;
    const entry: CommunicationEntry = {
      id: `communication-${Date.now()}`, customerName: noteCustomer || 'General', channel: noteChannel,
      subject: noteSubject.trim(), createdAt: new Date().toISOString(), createdBy: user.name
    };
    onUpdateCommunications([entry, ...communications]); saveOffline('communication', entry, entry.id); setNoteSubject('');
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-500">Workshop operations</p><h1 className="mt-1 text-2xl font-bold text-white">Stock & customer follow-up</h1></div>
        <p className="text-xs text-stone-300">Changes are saved on this device while offline. Records show the responsible operator.</p>
      </header>

      <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-xl border border-stone-700 bg-stone-900 p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2"><PackagePlus className="h-4 w-4 text-amber-400"/><h2 className="text-sm font-bold text-white">Stock register</h2></div>
          <form onSubmit={addStock} className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <input aria-label="Stock item name" value={stockName} onChange={(e) => setStockName(e.target.value)} placeholder="Stock item name" required className="ops-input" />
            <input aria-label="Quantity on hand" type="number" min="0" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} placeholder="Quantity on hand" className="ops-input" />
            <input aria-label="Supplier" value={stockSupplier} onChange={(e) => setStockSupplier(e.target.value)} placeholder="Supplier" className="ops-input" />
            <input aria-label="Unit cost" type="number" min="0" step="0.01" value={stockCost} onChange={(e) => setStockCost(e.target.value)} placeholder="Unit cost ($)" className="ops-input" />
            <input aria-label="Reorder level" type="number" min="0" value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)} placeholder="Reorder level" className="ops-input" />
            <select aria-label="Assign stock to job" value={assignedJobId} onChange={(e) => setAssignedJobId(e.target.value)} className="ops-input"><option value="">Unassigned job</option>{jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}</select>
            <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-bold text-stone-950 hover:bg-amber-400 sm:col-span-2 lg:col-span-3"><Plus className="h-4 w-4"/> Add stock item</button>
          </form>
          <div className="overflow-x-auto rounded-lg border border-stone-700">
            <table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-stone-800 text-stone-200"><tr><th className="px-3 py-2">Item</th><th className="px-3 py-2">On hand</th><th className="px-3 py-2">Supplier / unit cost</th><th className="px-3 py-2">Job</th><th className="px-3 py-2">Usage</th></tr></thead>
              <tbody>{stock.map((item) => <tr key={item.id} className="border-t border-stone-700 bg-stone-900 text-stone-100"><td className="px-3 py-3 font-semibold">{item.name}<span className={`ml-2 text-[10px] font-bold uppercase ${item.quantity <= item.reorderLevel ? 'text-rose-300' : 'text-emerald-300'}`}>{item.quantity <= item.reorderLevel ? 'Reorder' : 'In stock'}</span><p className="text-xs text-stone-300">Updated by {item.updatedBy}</p></td><td className="px-3 py-3">{item.quantity} <span className="text-xs text-stone-300">(reorder at {item.reorderLevel})</span></td><td className="px-3 py-3">{item.supplier || 'Not set'}<p className="text-xs text-stone-300">${item.unitCost.toFixed(2)} / unit</p></td><td className="px-3 py-3">{jobs.find((job) => job.id === item.assignedJobId)?.title || 'Unassigned'}</td><td className="px-3 py-3"><button type="button" disabled={item.quantity <= 0} onClick={() => recordUsage(item, 1)} className="rounded-md border border-stone-600 px-2 py-1 text-xs font-semibold text-stone-100 hover:border-amber-400 disabled:opacity-50">Use 1</button><p className="mt-1 text-[11px] text-stone-300">Used: {item.usedQuantity || 0}</p></td></tr>)}{stock.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-sm text-stone-300">No stock items recorded yet.</td></tr>}</tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-stone-700 bg-stone-900 p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2"><ClipboardList className="h-4 w-4 text-amber-400"/><h2 className="text-sm font-bold text-white">Follow-up tasks</h2></div>
          <form onSubmit={addTask} className="space-y-2">
            <input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required placeholder="Call customer about quote approval" className="ops-input" />
            <div className="grid gap-2 sm:grid-cols-2"><select value={taskCustomer} onChange={(e) => setTaskCustomer(e.target.value)} className="ops-input"><option value="">General follow-up</option>{customers.map((customer) => <option key={customer.id} value={customer.companyName}>{customer.companyName}</option>)}</select><input aria-label="Follow-up due date" type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} className="ops-input" /></div>
            <button className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-bold text-stone-950 hover:bg-amber-400"><Bell className="h-4 w-4"/> Add follow-up</button>
          </form>
          <ul className="mt-4 space-y-2">{tasks.map((task) => <li key={task.id} className="flex items-start gap-2 rounded-lg border border-stone-700 bg-stone-800/70 p-3"><button type="button" aria-label={task.completed ? 'Reopen task' : 'Complete task'} onClick={() => toggleTask(task)} className={`mt-0.5 rounded border p-0.5 ${task.completed ? 'border-emerald-400 bg-emerald-500 text-stone-950' : 'border-stone-500 text-stone-200'}`}><Check className="h-3 w-3"/></button><div className="min-w-0 flex-1"><p className={`text-sm font-semibold ${task.completed ? 'text-stone-300 line-through' : 'text-white'}`}>{task.title}</p><p className="mt-1 text-xs text-stone-300">{task.customerName} · Due {task.dueDate} · {task.createdBy}</p></div></li>)}{tasks.length === 0 && <li className="py-5 text-center text-sm text-stone-300">No follow-ups yet.</li>}</ul>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
        <form onSubmit={addCommunication} className="rounded-xl border border-stone-700 bg-stone-900 p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2"><MessageSquare className="h-4 w-4 text-amber-400"/><h2 className="text-sm font-bold text-white">Log a communication</h2></div>
          <div className="space-y-2"><select value={noteCustomer} onChange={(e) => setNoteCustomer(e.target.value)} className="ops-input"><option value="">General</option>{customers.map((customer) => <option key={customer.id} value={customer.companyName}>{customer.companyName}</option>)}</select><select value={noteChannel} onChange={(e) => setNoteChannel(e.target.value as CommunicationEntry['channel'])} className="ops-input"><option value="note">Note</option><option value="email">Email</option><option value="whatsapp">WhatsApp</option><option value="call">Phone call</option></select><textarea value={noteSubject} onChange={(e) => setNoteSubject(e.target.value)} required rows={3} placeholder="Summary, outcome, or next action" className="ops-input resize-y"/><button className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-stone-700 px-3 py-2 text-sm font-semibold text-white hover:bg-stone-600"><Send className="h-4 w-4"/> Save log entry</button></div>
        </form>
        <div className="rounded-xl border border-stone-700 bg-stone-900 p-4 sm:p-5">
          <h2 className="mb-4 text-sm font-bold text-white">Communication history</h2>
          <div className="space-y-2">{communications.map((entry) => <article key={entry.id} className="flex items-start gap-3 rounded-lg border border-stone-700 bg-stone-800/70 p-3"><span className="rounded-md border border-amber-400/40 bg-amber-400/10 px-2 py-1 text-[10px] font-bold uppercase text-amber-200">{entry.channel}</span><div className="min-w-0"><p className="text-sm font-semibold text-white">{entry.subject}</p><p className="mt-1 text-xs text-stone-300">{entry.customerName} · {new Date(entry.createdAt).toLocaleString()} · {entry.createdBy}</p></div></article>)}{communications.length === 0 && <p className="py-5 text-center text-sm text-stone-300">No communication has been logged.</p>}</div>
        </div>
      </section>
      <style>{`.ops-input{width:100%;border:1px solid #57534e;border-radius:.5rem;background:#1c1917;padding:.55rem .7rem;color:#fafaf9;font-size:.875rem;outline:none}.ops-input::placeholder{color:#a8a29e}.ops-input:focus{border-color:#f59e0b;box-shadow:0 0 0 2px #f59e0b33}`}</style>
    </div>
  );
};
