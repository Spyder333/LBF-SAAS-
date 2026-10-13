import React from 'react';
import { Printer, Download, X, CheckCircle, FileSpreadsheet, MessageSquare, Phone } from 'lucide-react';
import { Invoice } from '../types';
import { exportSingleInvoiceToExcel } from '../lib/excel';

interface InvoicePrintViewProps {
  invoice: Invoice;
  onClose: () => void;
}

export const InvoicePrintView: React.FC<InvoicePrintViewProps> = ({ invoice, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    exportSingleInvoiceToExcel(invoice);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `*LBF SOLUTIONS - INVOICE ${invoice.invoiceNumber}*\n` +
      `Customer: ${invoice.customerName}\n` +
      `Date: ${invoice.date}\n` +
      `Equipment: ${invoice.equipmentInfo || 'Line Boring & Bucket Repair'}\n` +
      `Total: $${invoice.total.toFixed(2)} USD\n` +
      `Balance Due: $${invoice.balanceDue.toFixed(2)} USD\n` +
      `Status: ${invoice.status.toUpperCase()}\n\n` +
      `*Line Boring & Fabrication Solutions*\n` +
      `Carlton Road, Harare, Zimbabwe\n` +
      `Tel / WhatsApp: +263 77 900 4626\n` +
      `"Repair your buckets with us - Lineboring and Fabrication solutions"`
    );
    const link = document.createElement('a');
    link.href = `https://wa.me/263779004626?text=${text}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  };

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'completed':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-sm p-4 sm:p-6 lg:p-10 flex justify-center items-start">
      
      {/* Floating Action Bar (hidden on print) */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-stone-900 border border-stone-700 p-2 rounded-xl shadow-2xl no-print">
        <button
          id="whatsapp-share-invoice-btn"
          onClick={handleWhatsAppShare}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold transition-all shadow-md cursor-pointer"
          title="Send / Share Invoice to Client via WhatsApp (+263 77 900 4626)"
        >
          <Phone className="w-4 h-4" />
          <span className="hidden sm:inline">WhatsApp Invoice</span>
        </button>
        <button
          id="print-invoice-action-btn"
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg text-sm font-bold transition-all shadow-md"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save PDF</span>
        </button>
        <button
          id="export-excel-action-btn"
          onClick={handleExportExcel}
          className="flex items-center gap-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-sm font-medium transition-colors border border-stone-600"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Export Excel</span>
        </button>
        <button
          id="close-print-modal-btn"
          onClick={onClose}
          className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors"
          title="Close invoice view"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Invoice Document Body */}
      <div className="printable-invoice w-full max-w-4xl bg-white text-stone-900 rounded-2xl shadow-2xl p-8 sm:p-12 my-6 border border-stone-200">
        
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b-2 border-stone-900 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-amber-500 text-stone-950 font-bold font-industrial text-2xl flex items-center justify-center rounded-lg shadow">
                LBF
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold font-industrial tracking-wide text-stone-950">
                  LBF SOLUTIONS
                </h1>
                <p className="text-xs uppercase tracking-widest text-amber-700 font-bold">
                  Repair your buckets with us &bull; Lineboring and Fabrication solutions
                </p>
              </div>
            </div>

            <div className="text-xs text-stone-600 space-y-0.5 mt-3">
              <p className="font-semibold text-stone-800">Line Boring & Fabrication Solutions</p>
              <p>Carlton Road, Harare, Zimbabwe, 17032</p>
              <p>Direct: 077 900 4626 | WhatsApp: +263 77 900 4626</p>
              <p>Email: lineboringandfabrication@lbfsolutions.co.zw</p>
              <p>Facebook: LBF Solutions</p>
            </div>
          </div>

          <div className="sm:text-right flex flex-col sm:items-end">
            <span className="text-xs font-mono font-bold uppercase tracking-widest px-2.5 py-1 bg-stone-900 text-amber-400 rounded">
              TAX INVOICE
            </span>
            <div className="mt-3">
              <p className="text-xs text-stone-500 font-medium">Invoice Number</p>
              <p className="text-xl font-bold font-mono text-stone-950">{invoice.invoiceNumber}</p>
            </div>
            <div className="mt-2 text-xs text-stone-600">
              <p><span className="font-semibold text-stone-700">Date Issued:</span> {invoice.date}</p>
              <p><span className="font-semibold text-stone-700">Payment Due:</span> {invoice.dueDate}</p>
              <div className="mt-2">
                <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${getStatusBadge(invoice.status)}`}>
                  Status: {invoice.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bill To & Job Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-stone-200 text-sm">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
              Billed To (Customer / Fleet Owner):
            </h3>
            <p className="font-bold text-stone-900 text-base">{invoice.customerName}</p>
            <p className="text-stone-600 text-xs mt-1">{invoice.customerAddress}</p>
            <p className="text-stone-600 text-xs">Email: {invoice.customerEmail}</p>
            {invoice.customerTaxNumber && (
              <p className="text-stone-600 text-xs font-mono">Tax / VAT No: {invoice.customerTaxNumber}</p>
            )}
          </div>

          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
              Machinery & Job Reference:
            </h3>
            <p className="font-semibold text-stone-900 text-sm">
              {invoice.equipmentInfo || 'General Workshop Service'}
            </p>
            <p className="text-xs text-stone-600 mt-1">
              Primary Service: <span className="font-semibold capitalize text-amber-700">{invoice.serviceCategory.replace(/_/g, ' ')}</span>
            </p>
            <p className="text-[11px] text-stone-500 mt-1">
              QA Tolerance standard: OEM Specifications &plusmn;0.02mm
            </p>
          </div>
        </div>

        {/* Line Items Table with Formula details */}
        <div className="py-6 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-stone-800 text-xs uppercase tracking-wider text-stone-700 font-semibold bg-stone-100">
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-3">Description & Scope of Work</th>
                <th className="py-3 px-3 text-center">Qty / Unit</th>
                <th className="py-3 px-3 text-right">Unit Rate ($)</th>
                <th className="py-3 px-3 text-left">Formula / Calculation</th>
                <th className="py-3 px-3 text-right">Amount ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-xs sm:text-sm">
              {invoice.items.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-stone-50/80">
                  <td className="py-3 px-3 text-center font-mono text-stone-500">{idx + 1}</td>
                  <td className="py-3 px-3">
                    <p className="font-medium text-stone-900">{item.description}</p>
                    <span className="text-[10px] uppercase font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                      {item.serviceCategory.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono">
                    {item.quantity} <span className="text-xs text-stone-500">{item.unit}</span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-medium">
                    ${item.unitPrice.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-left text-xs font-mono text-stone-600">
                    {item.formulaUsed ? (
                      <span className="bg-stone-100 text-stone-800 px-1.5 py-0.5 rounded border border-stone-200">
                        {item.formulaUsed}
                      </span>
                    ) : (
                      'Standard Qty * Rate'
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-stone-900">
                    ${item.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation Summary & Remittance */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-8 pt-4 border-t-2 border-stone-900">
          
          {/* Remittance & Bank Info */}
          <div className="sm:col-span-7 text-xs text-stone-600 space-y-3">
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
              <h4 className="font-bold text-stone-900 uppercase tracking-wider text-xs mb-2">
                Banking Remittance Details:
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-stone-500 block">Bank:</span>
                  <span className="font-bold text-stone-800">Commercial Bank / Standard Chartered</span>
                </div>
                <div>
                  <span className="text-stone-500 block">Account Name:</span>
                  <span className="font-bold text-stone-800">Line Boring & Fabrication Solutions</span>
                </div>
                <div>
                  <span className="text-stone-500 block">Account Number (USD):</span>
                  <span className="font-bold text-stone-800">0112-4920-1192</span>
                </div>
                <div>
                  <span className="text-stone-500 block">Branch / Location:</span>
                  <span className="font-bold text-stone-800">Harare Industrial Branch, Zimbabwe</span>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-amber-700 font-medium">
                * Please use invoice number <strong className="font-mono">{invoice.invoiceNumber}</strong> as payment reference.
              </p>
            </div>

            <div>
              <h5 className="font-bold text-stone-800 text-xs">Terms & Warranty:</h5>
              <p className="text-[11px] text-stone-500 mt-0.5">
                {invoice.terms || 'Strictly 14 days from invoice date. Line boring tolerances certified to ISO-286 standard.'}
              </p>
            </div>

            {invoice.notes && (
              <div className="border-l-2 border-amber-500 pl-3">
                <span className="font-bold text-stone-800 text-xs">Workshop Notes:</span>
                <p className="text-[11px] text-stone-600">{invoice.notes}</p>
              </div>
            )}
          </div>

          {/* Mathematical Financial Totals */}
          <div className="sm:col-span-5 bg-stone-50 p-4 rounded-xl border border-stone-200">
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal:</span>
                <span className="font-mono font-medium">${invoice.subtotal.toFixed(2)}</span>
              </div>

              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount ({(invoice.discountRate * 100).toFixed(0)}%):</span>
                  <span className="font-mono font-medium">-${invoice.discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-stone-600">
                <span>Tax / VAT ({(invoice.taxRate * 100).toFixed(0)}%):</span>
                <span className="font-mono font-medium">${invoice.taxAmount.toFixed(2)}</span>
              </div>

              <div className="border-t border-stone-300 pt-2 flex justify-between text-base font-bold text-stone-950">
                <span>Total Amount:</span>
                <span className="font-mono text-lg">${invoice.total.toFixed(2)}</span>
              </div>

              {invoice.depositPaid > 0 && (
                <div className="flex justify-between text-stone-600 text-xs">
                  <span>Deposit / Paid to date:</span>
                  <span className="font-mono text-emerald-600">-${invoice.depositPaid.toFixed(2)}</span>
                </div>
              )}

              <div className="bg-amber-100 border border-amber-300 p-3 rounded-lg flex justify-between items-center text-sm font-bold text-stone-900 mt-3">
                <span>BALANCE DUE:</span>
                <span className="font-mono text-lg text-amber-900">${invoice.balanceDue.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quality Certification & Sign-off Section */}
        <div className="mt-10 pt-6 border-t border-stone-200 grid grid-cols-2 gap-8 text-xs text-stone-600">
          <div>
            <p className="font-bold text-stone-800">LBF Quality Assurance Inspector:</p>
            <div className="mt-6 border-b border-stone-400 w-48"></div>
            <p className="text-[10px] text-stone-400 mt-1">Authorized Machining Signature & Stamp</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-stone-800">Client Acceptance / Fleet Receiver:</p>
            <div className="mt-6 border-b border-stone-400 w-48 ml-auto"></div>
            <p className="text-[10px] text-stone-400 mt-1">Name, Signature & Date</p>
          </div>
        </div>

      </div>
    </div>
  );
};
