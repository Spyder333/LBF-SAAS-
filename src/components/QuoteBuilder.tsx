import React, { useState } from 'react';
import { FileText, Mail, Plus, Send } from 'lucide-react';
import { CommunicationEntry, Customer, Quote, QuoteLineItem, SaaSUser, WorkshopJob } from '../types';
import { api } from '../lib/api';
import { ServerManager } from '../lib/serverConfig';

interface QuoteBuilderProps {
  quotes: Quote[];
  onUpdateQuotes: (quotes: Quote[]) => void;
  customers: Customer[];
  onConvertQuoteToInvoice?: (quote: Quote) => void;
  user: SaaSUser;
  onLogCommunication: (entry: Omit<CommunicationEntry, 'id' | 'createdAt' | 'createdBy'>) => void;
  initialJob?: WorkshopJob | null;
  onClearInitialJob?: () => void;
}

const createEmptyItem = (): QuoteLineItem => ({
  id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  description: '',
  quantity: 1,
  unit: 'hrs',
  rate: 0,
  total: 0,
  kind: 'service'
});

const queueQuote = (quote: Quote) => {
  ServerManager.enqueueSyncItem({ type: 'quote', action: 'update', entityId: quote.id, data: quote });
  if (navigator.onLine) void api.syncPendingQueue();
};

export const QuoteBuilder: React.FC<QuoteBuilderProps> = ({ quotes, onUpdateQuotes, customers, onConvertQuoteToInvoice, user, onLogCommunication, initialJob, onClearInitialJob }) => {
  const [customerName, setCustomerName] = useState(customers[0]?.companyName || '');
  const [equipmentName, setEquipmentName] = useState('CAT 349D L');
  const [lineItems, setLineItems] = useState<QuoteLineItem[]>([
    { ...createEmptyItem(), description: 'Line boring and fabrication service', quantity: 1, unit: 'job', rate: 1200, total: 1200 }
  ]);

  React.useEffect(() => {
    if (!initialJob) return;
    const matchingCustomer = customers.find((customer) => customer.companyName === initialJob.customerName);
    if (matchingCustomer) setCustomerName(matchingCustomer.companyName);
    setEquipmentName(initialJob.equipmentName);
    const initialLines: QuoteLineItem[] = [{
      ...createEmptyItem(), description: initialJob.title, quantity: 1, unit: 'job',
      rate: initialJob.revenue ?? initialJob.totalCost ?? 0,
      total: initialJob.revenue ?? initialJob.totalCost ?? 0,
      kind: 'service'
    }, ...(initialJob.laborList || []).map((description) => ({ ...createEmptyItem(), description, kind: 'labor' as const })),
    ...(initialJob.materialList || []).map((description) => ({ ...createEmptyItem(), description, unit: 'item', kind: 'material' as const }))];
    setLineItems(initialLines);
    onClearInitialJob?.();
  }, [initialJob, customers, onClearInitialJob]);

  const updateItem = (id: string, field: keyof QuoteLineItem, value: string | number) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value } as QuoteLineItem;
        if (field === 'quantity' || field === 'rate') {
          updated.total = Number(updated.quantity) * Number(updated.rate);
        }
        return updated;
      })
    );
  };

  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.15;
  const total = subtotal + tax;

  const addLineItem = () => {
    setLineItems((prev) => [...prev, { ...createEmptyItem(), description: 'New service line' }]);
  };

  const saveQuote = () => {
    const customer = customers.find((c) => c.companyName === customerName) ?? customers[0];
    const nextQuote: Quote = {
      id: `quote-${Date.now()}`,
      quoteNumber: `LBF-Q-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: customer?.companyName || customerName,
      customerEmail: customer?.email || 'sales@lbfsolutions.co.zw',
      equipmentName,
      status: 'draft',
      createdAt: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 10),
      lineItems,
      subtotal,
      taxRate: 0.15,
      total,
      createdBy: user.name,
      history: [{ status: 'draft', changedAt: new Date().toISOString(), changedBy: user.name }]
    };
    onUpdateQuotes([nextQuote, ...quotes]);
    queueQuote(nextQuote);
  };

  const updateQuoteStatus = (quote: Quote, status: Quote['status']) => {
    const updated: Quote = {
      ...quote,
      status,
      approvedAt: status === 'approved' ? new Date().toISOString() : quote.approvedAt,
      history: [...(quote.history || []), { status, changedAt: new Date().toISOString(), changedBy: user.name }]
    };
    onUpdateQuotes(quotes.map((item) => item.id === quote.id ? updated : item));
    queueQuote(updated);
    return updated;
  };

  const emailQuote = (quote: Quote) => {
    if (quote.status === 'draft') updateQuoteStatus(quote, 'sent');
    onLogCommunication({ customerName: quote.customerName, channel: 'email', subject: `Quote ${quote.quoteNumber} emailed` });
  };

  const convertQuote = (quote: Quote) => {
    const converted = updateQuoteStatus(quote, 'converted');
    onConvertQuoteToInvoice?.(converted);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-stone-800 bg-stone-900 p-5">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-stone-300">Quote builder</h3>
          </div>

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
              >
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.companyName}>
                    {customer.companyName}
                  </option>
                ))}
              </select>

              <input
                value={equipmentName}
                onChange={(e) => setEquipmentName(e.target.value)}
                className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                placeholder="Equipment / machine"
              />
            </div>

            <div className="space-y-3">
              {lineItems.map((item) => (
                <div key={item.id} className="grid gap-2 rounded-xl border border-stone-700 bg-stone-800/80 p-3 md:grid-cols-[1.2fr_0.6fr_0.4fr_0.4fr_0.7fr]">
                  <input
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    className="rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                    placeholder="Description"
                  />
                  <select aria-label="Quote line type" value={item.kind || 'service'} onChange={(e) => updateItem(item.id, 'kind', e.target.value)} className="rounded-lg border border-stone-700 bg-stone-950 px-2 py-2 text-xs text-white"><option value="service">Service</option><option value="labor">Labor</option><option value="material">Materials</option></select>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                    className="rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                  />
                  <input
                    type="number"
                    min={0}
                    value={item.rate}
                    onChange={(e) => updateItem(item.id, 'rate', Number(e.target.value))}
                    className="rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                  />
                  <div className="rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-stone-300">
                    ${item.total.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addLineItem}
              className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-300"
            >
              <Plus className="h-4 w-4" /> Add line item
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-800 bg-stone-900 p-5">
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-stone-300">Quote total</h3>

          <div className="mt-4 space-y-3 text-sm text-stone-300">
            <div className="flex items-center justify-between"><span>Subtotal</span><span>${subtotal.toLocaleString()}</span></div>
            <div className="flex items-center justify-between"><span>Tax</span><span>${tax.toLocaleString()}</span></div>
            <div className="flex items-center justify-between border-t border-stone-800 pt-3 text-lg font-bold text-white"><span>Total</span><span>${total.toLocaleString()}</span></div>
          </div>

          <button
            type="button"
            onClick={saveQuote}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-3 py-2.5 text-sm font-bold text-stone-950 transition hover:bg-amber-400"
          >
            <Send className="h-4 w-4" /> Save quote
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-800 bg-stone-900 p-5">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-stone-300">Recent quotes</h3>
        <div className="space-y-3">
          {quotes.map((quote) => (
            <div key={quote.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-700 bg-stone-800/80 p-3">
              <div>
                <p className="font-semibold text-white">{quote.quoteNumber}</p>
                <p className="text-xs text-stone-400">{quote.customerName} • {quote.equipmentName}</p>
                <details className="mt-1 text-[11px]"><summary className="cursor-pointer text-stone-200">History ({quote.history?.length || 1})</summary>{(quote.history || [{ status: quote.status, changedAt: quote.createdAt, changedBy: quote.createdBy || 'Legacy record' }]).map((entry, index) => <p key={`${quote.id}-history-${index}`} className="mt-1 text-stone-300">{entry.status} · {new Date(entry.changedAt).toLocaleDateString()} · {entry.changedBy}</p>)}</details>
              </div>
              <div className="text-right">
                <p className="font-semibold text-amber-300">${quote.total.toLocaleString()}</p>
                <p className="text-[11px] font-semibold text-stone-200">{quote.status} · {quote.createdBy || 'Legacy record'}</p>
                {!['approved', 'converted'].includes(quote.status) && <button type="button" onClick={() => updateQuoteStatus(quote, 'approved')} className="mt-2 rounded-lg border border-emerald-400/50 px-2 py-1 text-[10px] font-bold uppercase text-emerald-200">Mark approved</button>}
                <a href={`mailto:${encodeURIComponent(quote.customerEmail)}?subject=${encodeURIComponent(`Quote ${quote.quoteNumber}`)}&body=${encodeURIComponent(`Hello ${quote.customerName},\n\nPlease review quote ${quote.quoteNumber} for ${quote.equipmentName}. Total including tax: $${quote.total.toFixed(2)}.\n\nRegards,\nLBF Solutions`)}`} onClick={() => emailQuote(quote)} className="mt-2 inline-flex items-center gap-1 rounded-lg border border-stone-600 px-2 py-1 text-[10px] font-bold uppercase text-stone-100"><Mail className="h-3 w-3"/>Email quote</a>
                <button
                  type="button"
                  onClick={() => convertQuote(quote)}
                  disabled={quote.status !== 'approved'}
                  className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-200 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Convert to invoice
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
