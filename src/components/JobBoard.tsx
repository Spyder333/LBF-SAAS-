import React, { useMemo, useState } from 'react';
import { AlertCircle, BriefcaseBusiness, Camera, FileText, Plus, Wrench } from 'lucide-react';
import { Customer, JobPriority, JobStatus, SaaSUser, WorkshopJob } from '../types';
import { ServerManager } from '../lib/serverConfig';
import { api } from '../lib/api';

interface JobBoardProps {
  jobs: WorkshopJob[];
  onUpdateJobs: (jobs: WorkshopJob[]) => void;
  customers: Customer[];
  user: SaaSUser;
  onCreateQuote: (job: WorkshopJob) => void;
  onCreateInvoice: (customer: Customer, job: WorkshopJob) => void;
}

const defaultDraft = {
  title: '',
  customerName: 'Blackrock Mining & Earthmoving Ltd',
  equipmentName: 'CAT 349D L',
  serviceType: 'Line Boring & Fabrication',
  priority: 'normal' as JobPriority,
  status: 'new' as JobStatus,
  assignedTo: 'Workshop Team A',
  dueDate: new Date().toISOString().slice(0, 10),
  totalCost: 0,
  revenue: 0,
  laborCost: 0,
  materialsCost: 0,
  travelCost: 0,
  materialsList: '',
  laborList: '',
  siteDetails: '',
  siteNotes: '',
  notes: ''
};

export const JobBoard: React.FC<JobBoardProps> = ({ jobs, onUpdateJobs, customers, user, onCreateQuote, onCreateInvoice }) => {
  const [draft, setDraft] = useState(defaultDraft);
  const [jobFilter, setJobFilter] = useState<'all' | 'assigned' | 'active'>('all');

  const visibleJobs = jobs.filter((job) => {
    if (jobFilter === 'assigned') return job.assignedTo.toLowerCase().includes(user.name.toLowerCase());
    if (jobFilter === 'active') return !['completed', 'paid', 'invoiced'].includes(job.status);
    return true;
  });

  const summary = useMemo(() => {
    const active = jobs.filter((job) => job.status !== 'completed' && job.status !== 'paid' && job.status !== 'invoiced');
    const urgent = jobs.filter((job) => job.priority === 'urgent').length;
    const inProgress = jobs.filter((job) => job.status === 'in_progress').length;
    return { active: active.length, urgent, inProgress };
  }, [jobs]);

  const handleChange = (field: keyof typeof defaultDraft, value: string | number) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddJob = () => {
    if (!draft.title.trim()) return;

    const nextJob: WorkshopJob = {
      id: `job-${Date.now()}`,
      title: draft.title.trim(),
      customerName: draft.customerName,
      equipmentName: draft.equipmentName,
      serviceType: draft.serviceType,
      priority: draft.priority,
      status: draft.status,
      assignedTo: draft.assignedTo,
      dueDate: draft.dueDate,
      createdAt: new Date().toISOString().slice(0, 10),
      totalCost: Number(draft.revenue || draft.totalCost) || 0,
      revenue: Number(draft.revenue || draft.totalCost) || 0,
      laborCost: Number(draft.laborCost) || 0,
      materialsCost: Number(draft.materialsCost) || 0,
      travelCost: Number(draft.travelCost) || 0,
      materialList: draft.materialsList.split('\n').map((item) => item.trim()).filter(Boolean),
      laborList: draft.laborList.split('\n').map((item) => item.trim()).filter(Boolean),
      siteDetails: draft.siteDetails.trim(),
      siteNotes: draft.siteNotes.trim(),
      notes: draft.notes.trim() || 'No notes captured yet.',
      createdBy: user.name,
      updatedBy: user.name,
      checklist: [
        { id: `check-${Date.now()}-1`, label: 'Site risk assessment completed', completed: false },
        { id: `check-${Date.now()}-2`, label: 'Tools and equipment checked', completed: false },
        { id: `check-${Date.now()}-3`, label: 'Customer sign-off received', completed: false }
      ],
      photos: [],
      statusHistory: [{ status: draft.status, changedAt: new Date().toISOString(), changedBy: user.name }]
    };

    onUpdateJobs([nextJob, ...jobs]);
    ServerManager.enqueueSyncItem({ type: 'job', action: 'create', entityId: nextJob.id, data: nextJob });
    if (navigator.onLine) void api.syncPendingQueue();
    setDraft(defaultDraft);
  };

  const updateJob = (job: WorkshopJob, changes: Partial<WorkshopJob>) => {
    const updated = { ...job, ...changes, updatedBy: user.name };
    onUpdateJobs(jobs.map((item) => item.id === job.id ? updated : item));
    ServerManager.enqueueSyncItem({ type: 'job', action: 'update', entityId: job.id, data: updated });
    if (navigator.onLine) void api.syncPendingQueue();
  };

  const handleDeleteJob = (job: WorkshopJob) => {
    const confirmed = window.confirm(`Delete work order "${job.title}"? This cannot be undone.`);
    if (!confirmed) return;

    const remainingJobs = jobs.filter((item) => item.id !== job.id);
    onUpdateJobs(remainingJobs);
    ServerManager.enqueueSyncItem({ type: 'job', action: 'delete', entityId: job.id });
    if (navigator.onLine) void api.syncPendingQueue();
  };

  const handlePhotoCapture = async (job: WorkshopJob, phase: 'before' | 'after' | 'site', file?: File) => {
    if (!file) return;
    const source = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const compressed = await new Promise<string>((resolve) => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, 960 / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.48));
      };
      image.onerror = () => resolve(source);
      image.src = source;
    });
    const photo = { id: `photo-${Date.now()}`, name: file.name, dataUrl: compressed, createdAt: new Date().toISOString(), createdBy: user.name, phase };
    updateJob(job, { photos: [...(job.photos || []), photo] });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-stone-700 bg-stone-900 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-stone-300">Open work orders</p>
          <p className="mt-3 text-2xl font-black text-white">{summary.active}</p>
        </div>
        <div className="rounded-xl border border-stone-700 bg-stone-900 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-stone-300">Urgent jobs</p>
          <p className="mt-3 text-2xl font-black text-white">{summary.urgent}</p>
        </div>
        <div className="rounded-xl border border-stone-700 bg-stone-900 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-stone-300">In progress</p>
          <p className="mt-3 text-2xl font-black text-white">{summary.inProgress}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-stone-700 bg-stone-900 p-5">
          <div className="mb-4 flex items-center gap-2">
            <BriefcaseBusiness className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-white">Work order queue</h3>
            <select aria-label="Filter jobs" value={jobFilter} onChange={(event) => setJobFilter(event.target.value as typeof jobFilter)} className="ml-auto rounded-lg border border-stone-600 bg-stone-800 px-2 py-1 text-xs text-white">
              <option value="all">All jobs</option><option value="assigned">Assigned to me</option><option value="active">Active jobs</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-lg border border-stone-700">
            <table className="min-w-[920px] text-left text-sm">
              <thead className="bg-stone-800 text-stone-100">
                <tr>
                  <th className="px-3 py-2">Job</th>
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Due</th>
                  <th className="px-3 py-2">Revenue</th>
                  <th className="px-3 py-2">Net profit / margin</th>
                </tr>
              </thead>
              <tbody>
                {visibleJobs.map((job) => {
                  const revenue = job.revenue ?? job.totalCost ?? 0;
                  const labor = job.laborCost || 0;
                  const materials = job.materialsCost || 0;
                  const travel = job.travelCost || 0;
                  const profit = revenue - labor - materials - travel;
                  const margin = revenue > 0 ? profit / revenue * 100 : 0;
                  return (
                  <tr key={job.id} className="border-t border-stone-700 bg-stone-900">
                    <td className="px-3 py-3">
                      <div>
                        <p className="font-semibold text-white">{job.title}</p>
                        <p className="font-mono text-[10px] text-stone-300">{job.id}</p>
                        <p className="text-xs text-stone-300">{job.serviceType} · {job.equipmentName}</p>
                        <p className="text-[11px] text-stone-300">Assigned: {job.assignedTo} · Created by {job.createdBy || 'Legacy record'}</p>
                      </div>
                      <details className="mt-2 max-w-lg">
                        <summary className="cursor-pointer text-xs font-semibold text-amber-300">Field details, checklist & photos</summary>
                        <div className="mt-2 space-y-2 rounded-lg border border-stone-600 bg-stone-800 p-3">
                          <p className="text-xs text-stone-100"><strong>Site:</strong> {job.siteDetails || 'Not recorded'}</p>
                          <p className="text-xs text-stone-200">{job.siteNotes || job.notes}</p>
                          <div className="grid gap-3 sm:grid-cols-2"><div><p className="text-xs font-bold text-white">Material list</p>{(job.materialList || []).map((item, index) => <p key={`${job.id}-material-${index}`} className="text-xs text-stone-200">· {item}</p>)}{!job.materialList?.length && <p className="text-xs text-stone-300">No materials listed</p>}</div><div><p className="text-xs font-bold text-white">Labor list</p>{(job.laborList || []).map((item, index) => <p key={`${job.id}-labor-${index}`} className="text-xs text-stone-200">· {item}</p>)}{!job.laborList?.length && <p className="text-xs text-stone-300">No labor listed</p>}</div></div>
                          <div className="border-t border-stone-600 pt-2"><p className="text-xs font-bold text-white">Status history</p>{(job.statusHistory || []).map((entry, index) => <p key={`${job.id}-status-${index}`} className="mt-1 text-[11px] text-stone-200">{entry.status} · {new Date(entry.changedAt).toLocaleString()} · {entry.changedBy}</p>)}</div>
                          {(job.checklist || []).map((item) => <label key={item.id} className="flex items-center gap-2 text-xs text-stone-100"><input type="checkbox" checked={item.completed} onChange={() => updateJob(job, { checklist: job.checklist?.map((check) => check.id === item.id ? { ...check, completed: !check.completed } : check) })} />{item.label}</label>)}
                          <textarea aria-label="Job notes" key={`${job.id}-notes`} defaultValue={job.notes || ''} onBlur={(event) => { if (event.target.value !== (job.notes || '')) updateJob(job, { notes: event.target.value }); }} placeholder="Job notes" className="w-full rounded-md border border-stone-600 bg-stone-900 p-2 text-xs text-white placeholder:text-stone-400" />
                          <textarea aria-label="Job completion notes" key={`${job.id}-completion-notes`} defaultValue={job.completionNotes || ''} onBlur={(event) => { if (event.target.value !== (job.completionNotes || '')) updateJob(job, { completionNotes: event.target.value }); }} placeholder="Completion notes (saved when you leave this field)" className="w-full rounded-md border border-stone-600 bg-stone-900 p-2 text-xs text-white placeholder:text-stone-400" />
                          <div className="flex flex-wrap gap-2">{(['before', 'after', 'site'] as const).map((phase) => <label key={phase} className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-stone-500 px-2 py-1.5 text-xs font-semibold capitalize text-white"><Camera className="h-3.5 w-3.5 text-amber-300"/>{phase}<input className="hidden" type="file" accept="image/*" capture="environment" onChange={(event) => { void handlePhotoCapture(job, phase, event.target.files?.[0]); event.target.value = ''; }} /></label>)}</div>
                          <div className="flex flex-wrap gap-2">{(job.photos || []).map((photo) => <figure key={photo.id} className="w-20"><img src={photo.dataUrl} alt={`${photo.phase || 'site'}: ${photo.name}`} className="h-16 w-20 rounded border border-stone-600 object-cover"/><figcaption className="truncate text-[10px] text-stone-200">{photo.phase || 'site'} · {photo.createdBy}</figcaption></figure>)}</div>
                          <div className="flex flex-wrap gap-2 border-t border-stone-600 pt-2"><button type="button" onClick={() => onCreateQuote(job)} className="inline-flex items-center gap-1 rounded-md border border-amber-400/50 px-2 py-1 text-xs font-semibold text-amber-100"><FileText className="h-3.5 w-3.5"/>Create quote</button>{customers.find((customer) => customer.companyName === job.customerName) && <button type="button" onClick={() => { const customer = customers.find((entry) => entry.companyName === job.customerName); if (customer) onCreateInvoice(customer, job); }} className="inline-flex items-center gap-1 rounded-md border border-emerald-400/50 px-2 py-1 text-xs font-semibold text-emerald-100"><FileText className="h-3.5 w-3.5"/>Create invoice</button>}<button type="button" onClick={() => updateJob(job, { status: 'completed', statusHistory: [...(job.statusHistory || []), { status: 'completed', changedAt: new Date().toISOString(), changedBy: user.name }] })} disabled={['completed', 'invoiced', 'paid'].includes(job.status)} className="rounded-md border border-stone-500 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50">Mark complete</button><button type="button" onClick={() => handleDeleteJob(job)} className="rounded-md border border-rose-500/50 px-2 py-1 text-xs font-semibold text-rose-200 hover:bg-rose-500/10">Delete job</button></div>
                        </div>
                      </details>
                    </td>
                    <td className="px-3 py-3 text-stone-100">{job.customerName}<p className="mt-1 text-xs text-stone-300">{job.siteDetails || 'Site not set'}</p></td>
                    <td className="px-3 py-3">
                      <select aria-label={`Status for ${job.title}`} value={job.status} onChange={(event) => {
                        const status = event.target.value as JobStatus;
                        updateJob(job, { status, statusHistory: [...(job.statusHistory || []), { status, changedAt: new Date().toISOString(), changedBy: user.name }] });
                      }} className="rounded-lg border border-stone-600 bg-stone-800 px-2 py-1 text-xs font-semibold text-white"><option value="new">New</option><option value="quoted">Quoted</option><option value="approved">Approved</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="invoiced">Invoiced</option><option value="paid">Paid</option></select>
                    </td>
                    <td className="px-3 py-3 text-stone-100">{job.dueDate}</td>
                    <td className="px-3 py-3 text-stone-100">${revenue.toLocaleString()}<p className="mt-1 text-[11px] text-stone-300">Labor ${labor.toLocaleString()} · Materials ${materials.toLocaleString()} · Travel ${travel.toLocaleString()}</p></td>
                    <td className="px-3 py-3 font-semibold text-emerald-200">${profit.toLocaleString()}<p className="text-xs text-stone-200">{margin.toFixed(1)}% margin</p></td>
                  </tr>
                );})}
                {visibleJobs.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-stone-300">No jobs match this filter.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-stone-700 bg-stone-900 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Plus className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-stone-300">Add work order</h3>
          </div>

          <div className="space-y-3">
            <input
              value={draft.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
              placeholder="Work order title"
            />

            <select
              value={draft.customerName}
              onChange={(e) => handleChange('customerName', e.target.value)}
              className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
            >
              {customers.map((customer) => (
                <option key={customer.id} value={customer.companyName}>
                  {customer.companyName}
                </option>
              ))}
            </select>

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={draft.equipmentName}
                onChange={(e) => handleChange('equipmentName', e.target.value)}
                className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                placeholder="Equipment / machine"
              />
              <input
                value={draft.serviceType}
                onChange={(e) => handleChange('serviceType', e.target.value)}
                className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                placeholder="Service type"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={draft.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </select>
              <select
                value={draft.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
              >
                <option value="new">New</option>
                <option value="quoted">Quoted</option>
                <option value="approved">Approved</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={draft.assignedTo}
                onChange={(e) => handleChange('assignedTo', e.target.value)}
                className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                placeholder="Assigned operator"
              />
              <input
                type="date"
                value={draft.dueDate}
                onChange={(e) => handleChange('dueDate', e.target.value)}
                className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="number"
                min={0}
                value={draft.revenue}
                onChange={(e) => handleChange('revenue', Number(e.target.value))}
                className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                placeholder="Job revenue"
              />
              <div className="flex items-center rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-xs text-stone-400">
                <AlertCircle className="mr-2 h-3.5 w-3.5 text-amber-400" />
                Workshop task
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <input type="number" min={0} value={draft.laborCost} onChange={(e) => handleChange('laborCost', Number(e.target.value))} className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-500" placeholder="Labor cost" />
              <input type="number" min={0} value={draft.materialsCost} onChange={(e) => handleChange('materialsCost', Number(e.target.value))} className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-500" placeholder="Materials cost" />
              <input type="number" min={0} value={draft.travelCost} onChange={(e) => handleChange('travelCost', Number(e.target.value))} className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-500" placeholder="Travel cost" />
            </div>

            <input value={draft.siteDetails} onChange={(e) => handleChange('siteDetails', e.target.value)} className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-500" placeholder="Customer site / location details" />
            <textarea value={draft.siteNotes} onChange={(e) => handleChange('siteNotes', e.target.value)} className="min-h-[64px] w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-500" placeholder="Field site notes" />

            <div className="grid gap-3 sm:grid-cols-2"><textarea value={draft.materialsList} onChange={(e) => handleChange('materialsList', e.target.value)} className="min-h-[72px] w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-500" placeholder="Material list (one item per line)"/><textarea value={draft.laborList} onChange={(e) => handleChange('laborList', e.target.value)} className="min-h-[72px] w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-500" placeholder="Labor list (one entry per line)"/></div>

            <textarea
              value={draft.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="min-h-[88px] w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
              placeholder="Add job notes"
            />

            <button
              type="button"
              onClick={handleAddJob}
              className="w-full rounded-xl bg-amber-500 px-3 py-2.5 text-sm font-bold text-stone-950 transition hover:bg-amber-400"
            >
              Save work order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
