import React, { useState, useRef } from 'react';
import {
  Users,
  Search,
  Plus,
  Truck,
  FileSpreadsheet,
  Download,
  Upload,
  Mail,
  Phone,
  MapPin,
  FileText,
  Trash2,
  Edit2,
  Wrench,
  CheckCircle2,
  X
} from 'lucide-react';
import { Customer, Equipment, Invoice, SaaSUser, WorkshopJob } from '../types';
import { exportCustomersToExcel, parseExcelFile } from '../lib/excel';
import { api } from '../lib/api';

interface CustomerDatabaseProps {
  customers: Customer[];
  onUpdateCustomers: (customers: Customer[]) => void;
  onSelectCustomerForInvoice: (customer: Customer) => void;
  invoices?: Invoice[];
  jobs?: WorkshopJob[];
  user: SaaSUser;
}

export const CustomerDatabase: React.FC<CustomerDatabaseProps> = ({
  customers,
  onUpdateCustomers,
  onSelectCustomerForInvoice,
  invoices = [],
  jobs = [],
  user
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [activeCustomerDetail, setActiveCustomerDetail] = useState<Customer | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [accountStatus, setAccountStatus] = useState<Customer['accountStatus']>('active');
  const [paymentTerms, setPaymentTerms] = useState('14 days');
  const [followUpReminder, setFollowUpReminder] = useState('');
  const [contactNotes, setContactNotes] = useState('');
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);

  // New Equipment Inputs inside modal
  const [eqMake, setEqMake] = useState('CAT');
  const [eqModel, setEqModel] = useState('');
  const [eqType, setEqType] = useState('Excavator');
  const [eqSerial, setEqSerial] = useState('');
  const [eqPinSpecs, setEqPinSpecs] = useState('');
  const [eqRecurringIssues, setEqRecurringIssues] = useState('');
  const [eqNotes, setEqNotes] = useState('');
  const [eqMaintenance, setEqMaintenance] = useState('');
  const [eqPreviousRepairs, setEqPreviousRepairs] = useState('');
  const [eqServiceHistory, setEqServiceHistory] = useState('');

  const filteredCustomers = customers.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.companyName.toLowerCase().includes(term) ||
      c.contactPerson.toLowerCase().includes(term) ||
      c.city.toLowerCase().includes(term) ||
      c.equipmentFleet.some(
        (eq) =>
          eq.make.toLowerCase().includes(term) ||
          eq.model.toLowerCase().includes(term) ||
          eq.type.toLowerCase().includes(term)
      )
    );
  });

  const totalMachines = customers.reduce((sum, c) => sum + (c.equipmentFleet?.length || 0), 0);
  const totalBalanceDue = invoices.reduce((sum, invoice) => sum + (invoice.balanceDue || 0), 0);

  const openAddModal = () => {
    setEditingCustomer(null);
    setCompanyName('');
    setContactPerson('');
    setEmail('');
    setPhone('');
    setAddress('');
    setCity('');
    setTaxNumber('');
    setNotes('');
    setAccountStatus('active');
    setPaymentTerms('14 days');
    setFollowUpReminder('');
    setContactNotes('');
    setEquipmentList([]);
    setEqRecurringIssues(''); setEqNotes(''); setEqMaintenance(''); setEqPreviousRepairs(''); setEqServiceHistory('');
    setIsModalOpen(true);
  };

  const openEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setCompanyName(cust.companyName);
    setContactPerson(cust.contactPerson);
    setEmail(cust.email);
    setPhone(cust.phone);
    setAddress(cust.address);
    setCity(cust.city);
    setTaxNumber(cust.taxNumber || '');
    setNotes(cust.notes || '');
    setAccountStatus(cust.accountStatus || 'active');
    setPaymentTerms(cust.paymentTerms || '14 days');
    setFollowUpReminder(cust.followUpReminder || '');
    setContactNotes(cust.contactNotes || '');
    setEquipmentList([...cust.equipmentFleet]);
    setEqRecurringIssues(''); setEqNotes(''); setEqMaintenance(''); setEqPreviousRepairs(''); setEqServiceHistory('');
    setIsModalOpen(true);
  };

  const handleAddEquipment = () => {
    if (!eqModel.trim()) return;
    const newEq: Equipment = {
      id: `eq-${Date.now()}`,
      make: eqMake,
      model: eqModel.trim(),
      type: eqType,
      serialNumber: eqSerial.trim() || undefined,
      pinBoreSpecs: eqPinSpecs.trim() || undefined,
      recurringIssues: eqRecurringIssues.trim() || undefined,
      notes: eqNotes.trim() || undefined,
      maintenanceSchedule: eqMaintenance.trim() || undefined,
      createdBy: user.name,
      serviceHistory: eqServiceHistory.split(';').map((entry) => entry.trim()).filter(Boolean),
      previousRepairs: eqPreviousRepairs.split(';').map((entry) => entry.trim()).filter(Boolean)
    };
    setEquipmentList([...equipmentList, newEq]);
    setEqModel('');
    setEqSerial('');
    setEqPinSpecs('');
    setEqRecurringIssues('');
    setEqNotes('');
    setEqMaintenance('');
    setEqPreviousRepairs('');
    setEqServiceHistory('');
  };

  const handleRemoveEquipment = (id: string) => {
    setEquipmentList(equipmentList.filter((e) => e.id !== id));
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;

    const customerData: Customer = {
      id: editingCustomer ? editingCustomer.id : `cust-${Date.now()}`,
      companyName: companyName.trim(),
      contactPerson: contactPerson.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      taxNumber: taxNumber.trim() || undefined,
      equipmentFleet: equipmentList,
      notes: notes.trim() || undefined,
      balanceDue: editingCustomer ? editingCustomer.balanceDue : 0,
      createdAt: editingCustomer ? editingCustomer.createdAt : new Date().toISOString().split('T')[0],
      accountStatus,
      paymentTerms,
      followUpReminder: followUpReminder || undefined,
      contactNotes: contactNotes.trim() || undefined,
      createdBy: editingCustomer?.createdBy || user.name,
      updatedBy: user.name
    };

    await api.saveCustomer(customerData);
    const updated = await api.getCustomers();
    onUpdateCustomers(updated);
    setIsModalOpen(false);
  };

  const downloadStatement = (customer: Customer) => {
    const rows = invoices.filter((invoice) => invoice.customerId === customer.id);
    const csv = [
      ['Customer statement', customer.companyName],
      ['Invoice', 'Date', 'Due date', 'Total', 'Paid', 'Balance', 'Status'],
      ...rows.map((invoice) => [invoice.invoiceNumber, invoice.date, invoice.dueDate, invoice.total.toFixed(2), invoice.depositPaid.toFixed(2), invoice.balanceDue.toFixed(2), invoice.status])
    ].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${customer.companyName.replace(/[^a-z0-9]+/gi, '-')}-statement.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteCustomer = async (id: string) => {
    await api.deleteCustomer(id);
    const updated = await api.getCustomers();
    onUpdateCustomers(updated);
    if (activeCustomerDetail?.id === id) {
      setActiveCustomerDetail(null);
    }
    setConfirmDeleteId(null);
    setToastMessage({ type: 'info', text: 'Customer and fleet records removed successfully.' });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await parseExcelFile(file);
      // Expected headers or simple row parsing
      const rows = parsed.data;
      if (rows.length < 2) return;

      const newCusts: Customer[] = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || !row[1]) continue;
        const comp = String(row[1] || '').trim();
        if (!comp) continue;

        const cust: Customer = {
          id: `cust-imp-${Date.now()}-${i}`,
          companyName: comp,
          contactPerson: String(row[2] || 'Operations Lead'),
          email: String(row[3] || 'info@' + comp.toLowerCase().replace(/\s+/g, '') + '.com'),
          phone: String(row[4] || '+263 77 900 0000'),
          address: String(row[5] || 'Industrial Area'),
          city: String(row[6] || 'Harare / Mining District'),
          taxNumber: String(row[7] || ''),
          balanceDue: 0,
          notes: 'Imported from Excel file: ' + file.name,
          equipmentFleet: [
            {
              id: `eq-imp-${i}`,
              make: 'CAT',
              model: '349D',
              type: 'Excavator',
              pinBoreSpecs: 'Bores 100mm/110mm'
            }
          ],
          createdAt: new Date().toISOString().split('T')[0]
        };
        newCusts.push(cust);
        await api.saveCustomer(cust);
      }

      const updated = await api.getCustomers();
      onUpdateCustomers(updated);
      setToastMessage({ type: 'success', text: `Successfully imported ${newCusts.length} client profile(s) from Excel.` });
      setTimeout(() => setToastMessage(null), 4500);
    } catch (err) {
      setToastMessage({ type: 'error', text: 'Failed to parse Excel file: ' + (err as Error).message });
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
        <div className="bg-stone-900 border border-stone-800 p-3.5 sm:p-5 rounded-2xl flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-stone-400 uppercase font-semibold">Active Client Accounts</p>
            <p className="text-xl sm:text-2xl font-bold font-industrial text-white">{customers.length}</p>
            <p className="text-[10px] sm:text-[11px] text-stone-500 truncate">Mining & Earthmoving contractors</p>
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-3.5 sm:p-5 rounded-2xl flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
            <Truck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-stone-400 uppercase font-semibold">Tracked Machine Fleets</p>
            <p className="text-xl sm:text-2xl font-bold font-industrial text-white">{totalMachines} Units</p>
            <p className="text-[10px] sm:text-[11px] text-stone-500 truncate">Excavators, Loaders, Crushers, ADTs</p>
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-3.5 sm:p-5 rounded-2xl flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-stone-400 uppercase font-semibold">Outstanding Balances</p>
            <p className="text-xl sm:text-2xl font-bold font-industrial text-white">${totalBalanceDue.toFixed(2)}</p>
            <p className="text-[10px] sm:text-[11px] text-stone-500 truncate">Directly synchronized with Invoices</p>
          </div>
        </div>
      </div>

      {/* In-App Notification Toast */}
      {toastMessage && (
        <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium shadow-lg transition-all ${
          toastMessage.type === 'success'
            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
            : toastMessage.type === 'error'
            ? 'bg-rose-950/80 border-rose-500/40 text-rose-300'
            : 'bg-stone-900 border-amber-500/40 text-amber-300'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-stone-400 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Action Bar: Search, Excel Import/Export, Add Client - Consolidated & Flexible */}
      <div className="bg-stone-900 border border-stone-800 p-3 sm:p-4 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-lg">
        
        {/* Flexible Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          <input
            id="customer-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search clients, contacts, or fleet machines..."
            className="w-full bg-stone-950 border border-stone-700 pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {/* Consolidated Action Cluster */}
        <div className="flex items-center gap-2.5 justify-end shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleExcelImport}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />
          
          {/* Segmented Excel Import / Export Control */}
          <div className="flex items-center bg-stone-950 p-1 rounded-xl border border-stone-800">
            <button
              id="import-customers-excel-btn"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-300 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
              title="Import Customer Fleets from Excel Spreadsheet"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>Import</span>
            </button>
            <button
              id="export-customers-excel-btn"
              onClick={() => exportCustomersToExcel(customers)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-300 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
              title="Export Customer Fleets to Excel Spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export</span>
            </button>
          </div>

          {/* Primary Action: Add Customer */}
          <button
            id="add-customer-modal-btn"
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-amber-500/20 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Customer List Grid - Optimized for High-Resolution Computer Screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 xl:gap-5">
        {filteredCustomers.map((cust) => (
          <div
            key={cust.id}
            id={`customer-card-${cust.id}`}
            className="bg-stone-900 border border-stone-800 hover:border-amber-500/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group"
          >
            {(() => {
              const accountBalance = invoices.filter((invoice) => invoice.customerId === cust.id).reduce((sum, invoice) => sum + (invoice.balanceDue || 0), 0);
              return (
                <>
            <div>
              {/* Header: Company & City */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold font-industrial text-white group-hover:text-amber-400 transition-colors">
                    {cust.companyName}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-stone-400 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">{cust.city}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-bold uppercase">
                    <span className={`rounded-md border px-2 py-1 ${cust.accountStatus === 'on_hold' ? 'border-rose-500/50 bg-rose-500/10 text-rose-200' : cust.accountStatus === 'credit_review' ? 'border-amber-400/50 bg-amber-400/10 text-amber-100' : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'}`}>{(cust.accountStatus || 'active').replace('_', ' ')}</span>
                    <span className="rounded-md border border-stone-600 bg-stone-800 px-2 py-1 text-stone-100">Terms: {cust.paymentTerms || '14 days'}</span>
                  </div>
                  <p className="mt-1 text-[10px] text-stone-300">{cust.createdBy ? `Created by ${cust.createdBy}` : 'Legacy account'} · Updated by {cust.updatedBy || 'Legacy operator'}</p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(cust)}
                    className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                    title="Edit Customer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {confirmDeleteId === cust.id ? (
                    <div className="flex items-center gap-1 bg-rose-950/80 p-1 rounded-lg border border-rose-600">
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomer(cust.id)}
                        className="text-[10px] font-bold bg-rose-600 text-white px-1.5 py-0.5 rounded cursor-pointer"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-[10px] text-stone-400 hover:text-white px-1 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(cust.id)}
                      className="p-1.5 text-stone-400 hover:text-red-400 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                      title="Delete Customer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <details className="mt-3 rounded-lg border border-stone-700 bg-stone-800/80 p-3">
                <summary className="cursor-pointer text-xs font-semibold text-amber-200">Account, invoice & service history</summary>
                <div className="mt-3 space-y-3 text-xs">
                  <div><p className="font-bold text-white">Recent invoices</p>{invoices.filter((invoice) => invoice.customerId === cust.id).slice(0, 3).map((invoice) => <p key={invoice.id} className="mt-1 text-stone-100">{invoice.invoiceNumber} · ${invoice.total.toFixed(2)} · balance ${invoice.balanceDue.toFixed(2)} · due {invoice.dueDate}</p>)}{!invoices.some((invoice) => invoice.customerId === cust.id) && <p className="mt-1 text-stone-300">No invoices recorded.</p>}</div>
                  <div><p className="font-bold text-white">Service history</p>{jobs.filter((job) => job.customerName === cust.companyName).slice(0, 4).map((job) => <p key={job.id} className="mt-1 text-stone-100">{job.createdAt} · {job.title} · {job.status}</p>)}{!jobs.some((job) => job.customerName === cust.companyName) && <p className="mt-1 text-stone-300">No service jobs recorded.</p>}</div>
                  {cust.followUpReminder && <p className="text-amber-100"><strong>Follow-up:</strong> {cust.followUpReminder}</p>}
                  {cust.contactNotes && <p className="text-stone-100"><strong>Contact notes:</strong> {cust.contactNotes}</p>}
                  {cust.equipmentFleet.map((equipment) => {
                    const machineKey = `${equipment.make} ${equipment.model}`.toLowerCase();
                    const equipmentJobs = jobs.filter((job) => job.customerName === cust.companyName && job.equipmentName.toLowerCase().includes(machineKey));
                    const repairRecords = [...(equipment.previousRepairs || []), ...equipmentJobs.filter((job) => ['completed', 'invoiced', 'paid'].includes(job.status)).map((job) => job.title)];
                    const serviceRecords = [...(equipment.serviceHistory || []), ...equipmentJobs.map((job) => `${job.createdAt}: ${job.serviceType} (${job.status})`)];
                    return <div key={equipment.id} className="border-t border-stone-600 pt-2 text-stone-100"><p className="font-bold text-white">{equipment.make} {equipment.model} · S/N {equipment.serialNumber || 'not recorded'}</p><p>Type: {equipment.type} · Schedule: {equipment.maintenanceSchedule || 'Not set'}</p>{equipment.recurringIssues && <p>Recurring issues: {equipment.recurringIssues}</p>}{equipment.notes && <p>Notes: {equipment.notes}</p>}<p>Repairs: {repairRecords.join(', ') || 'No previous repairs logged'}</p><p>History: {serviceRecords.join('; ') || 'No services logged'}</p></div>;
                  })}
                </div>
              </details>

              {/* Contact Information */}
              <div className="mt-3 pt-3 border-t border-stone-800 space-y-1.5 text-xs text-stone-300">
                <p className="font-medium text-stone-200">{cust.contactPerson}</p>
                <div className="flex items-center gap-2 text-stone-400">
                  <Mail className="w-3 h-3 text-stone-500" />
                  <span className="truncate">{cust.email}</span>
                </div>
                <div className="flex items-center gap-2 text-stone-400">
                  <Phone className="w-3 h-3 text-stone-500" />
                  <span>{cust.phone}</span>
                </div>
                {cust.taxNumber && (
                  <div className="text-[11px] font-mono text-stone-500">
                    VAT / Tax: {cust.taxNumber}
                  </div>
                )}
              </div>

              {/* Machinery Fleet Badges */}
              <div className="mt-4 pt-3 border-t border-stone-800">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-stone-400 font-semibold flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-amber-400" /> Equipment Fleet:
                  </span>
                  <span className="font-mono text-stone-400">{cust.equipmentFleet?.length || 0} machines</span>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                  {cust.equipmentFleet && cust.equipmentFleet.length > 0 ? (
                    cust.equipmentFleet.map((eq) => (
                      <span
                        key={eq.id}
                        className="inline-flex items-center gap-1 text-[11px] bg-stone-950 border border-stone-800 text-stone-300 px-2 py-0.5 rounded font-mono"
                        title={eq.pinBoreSpecs ? `Pin Spec: ${eq.pinBoreSpecs}` : undefined}
                      >
                        <span className="text-amber-400 font-bold">{eq.make}</span> {eq.model}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-stone-500 italic">No equipment logged</span>
                  )}
                </div>
              </div>
            </div>

            {/* Card Footer: Balance & Invoice Trigger */}
            <div className="mt-5 pt-3 border-t border-stone-800 flex items-center justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase text-stone-400 block">Balance Due</span>
                <span className="font-mono font-bold text-sm text-amber-400">
                  ${accountBalance.toFixed(2)}
                </span>
              </div>

              <button
                id={`create-invoice-for-${cust.id}`}
                onClick={() => onSelectCustomerForInvoice(cust)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-stone-950 rounded-lg text-xs font-bold border border-amber-500/30 transition-all"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Invoice Client</span>
              </button>
              <button type="button" onClick={() => downloadStatement(cust)} className="rounded-lg border border-stone-600 px-2.5 py-1.5 text-xs font-bold text-stone-100 hover:border-amber-400" title="Download customer statement">Statement</button>
            </div>
                </>
              );
            })()}
          </div>
        ))}

        {filteredCustomers.length === 0 && (
          <div className="col-span-full bg-stone-900 border border-stone-800 rounded-2xl p-12 text-center">
            <Users className="w-10 h-10 text-stone-600 mx-auto mb-3" />
            <p className="text-stone-300 font-semibold">No customers match your search query</p>
            <p className="text-xs text-stone-500 mt-1">
              Try searching by another contractor name or add a new customer above.
            </p>
          </div>
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-sm p-2 sm:p-6 flex items-start sm:items-center justify-center">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-3xl xl:max-w-4xl max-h-[96vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl p-4 sm:p-6 my-2 sm:my-0">
            
            <div className="flex items-center justify-between pb-3.5 sm:pb-4 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                <h3 className="text-base sm:text-lg font-bold font-industrial text-white">
                  {editingCustomer ? 'Edit Customer & Fleet' : 'Add New Client & Machine Fleet'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-4 mt-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-stone-300 font-medium mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Blackrock Mining & Earthmoving Ltd"
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-medium mb-1">Contact Person *</label>
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Dave McAllister (Fleet Superintendant)"
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-medium mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="dave@company.com"
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-medium mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+263 77 900 4626"
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-medium mb-1">Physical Address / Mine Site</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Carlton Road, Heavy Industrial Area"
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-medium mb-1">City / Mining District</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Harare / Midlands / Zvishavane"
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-stone-300 font-medium mb-1">Tax / VAT Registration No</label>
                  <input
                    type="text"
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                    placeholder="VAT-4890123841"
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-200 font-medium mb-1">Account status</label>
                  <select value={accountStatus} onChange={(e) => setAccountStatus(e.target.value as Customer['accountStatus'])} className="w-full bg-stone-950 border border-stone-600 rounded-lg px-3 py-2 text-stone-100"><option value="active">Active</option><option value="on_hold">On hold</option><option value="credit_review">Credit review</option></select>
                </div>
                <div>
                  <label className="block text-stone-200 font-medium mb-1">Payment terms</label>
                  <input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="14 days / deposit" className="w-full bg-stone-950 border border-stone-600 rounded-lg px-3 py-2 text-stone-100" />
                </div>
                <div>
                  <label className="block text-stone-200 font-medium mb-1">Follow-up reminder</label>
                  <input value={followUpReminder} onChange={(e) => setFollowUpReminder(e.target.value)} placeholder="Date or action" className="w-full bg-stone-950 border border-stone-600 rounded-lg px-3 py-2 text-stone-100" />
                </div>
                <div>
                  <label className="block text-stone-200 font-medium mb-1">Contact notes</label>
                  <input value={contactNotes} onChange={(e) => setContactNotes(e.target.value)} placeholder="Preferred contact / call window" className="w-full bg-stone-950 border border-stone-600 rounded-lg px-3 py-2 text-stone-100" />
                </div>
              </div>

              {/* Equipment Fleet Management Section */}
              <div className="mt-4 pt-4 border-t border-stone-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
                  <Truck className="w-4 h-4" /> Earthmoving & Heavy Plant Fleet Machines:
                </h4>

                {/* New Equipment Sub-Form */}
                <div className="bg-stone-950 p-2.5 sm:p-3 rounded-xl border border-stone-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-xs mb-3">
                  <div className="col-span-1">
                    <label className="text-[10px] text-stone-400 block mb-0.5">Make</label>
                    <select
                      value={eqMake}
                      onChange={(e) => setEqMake(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-700 rounded px-2 py-1.5 text-stone-200"
                    >
                      <option value="CAT">Caterpillar (CAT)</option>
                      <option value="Komatsu">Komatsu</option>
                      <option value="Hitachi">Hitachi</option>
                      <option value="Volvo">Volvo</option>
                      <option value="Bell">Bell Equipment</option>
                      <option value="Liebherr">Liebherr</option>
                      <option value="Metso">Metso Crusher</option>
                      <option value="Terex">Terex</option>
                      <option value="Other">Other Heavy Plant</option>
                    </select>
                  </div>

                  <div className="col-span-1">
                    <label className="text-[10px] text-stone-400 block mb-0.5">Model *</label>
                    <input
                      type="text"
                      value={eqModel}
                      onChange={(e) => setEqModel(e.target.value)}
                      placeholder="e.g. 349D L"
                      className="w-full bg-stone-900 border border-stone-700 rounded px-2 py-1.5 text-stone-200"
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="text-[10px] text-stone-400 block mb-0.5">Type</label>
                    <input
                      type="text"
                      value={eqType}
                      onChange={(e) => setEqType(e.target.value)}
                      placeholder="Excavator / Loader"
                      className="w-full bg-stone-900 border border-stone-700 rounded px-2 py-1.5 text-stone-200"
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="text-[10px] text-stone-400 block mb-0.5">Bore Specs</label>
                    <input
                      type="text"
                      value={eqPinSpecs}
                      onChange={(e) => setEqPinSpecs(e.target.value)}
                      placeholder="e.g. Pin 110mm"
                      className="w-full bg-stone-900 border border-stone-700 rounded px-2 py-1.5 text-stone-200"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-2 lg:col-span-1 flex items-end">
                    <button
                      type="button"
                      onClick={handleAddEquipment}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold py-1.5 rounded transition-colors text-xs flex items-center justify-center gap-1 shadow"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Unit
                    </button>
                  </div>
                </div>

                <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input value={eqRecurringIssues} onChange={(e) => setEqRecurringIssues(e.target.value)} placeholder="Recurring issues" className="w-full rounded-lg border border-stone-600 bg-stone-900 px-2 py-2 text-xs text-white" />
                  <input value={eqMaintenance} onChange={(e) => setEqMaintenance(e.target.value)} placeholder="Maintenance schedule" className="w-full rounded-lg border border-stone-600 bg-stone-900 px-2 py-2 text-xs text-white" />
                  <input value={eqNotes} onChange={(e) => setEqNotes(e.target.value)} placeholder="Equipment notes" className="w-full rounded-lg border border-stone-600 bg-stone-900 px-2 py-2 text-xs text-white" />
                  <input value={eqPreviousRepairs} onChange={(e) => setEqPreviousRepairs(e.target.value)} placeholder="Previous repairs (separate with ;)" className="w-full rounded-lg border border-stone-600 bg-stone-900 px-2 py-2 text-xs text-white" />
                  <input value={eqServiceHistory} onChange={(e) => setEqServiceHistory(e.target.value)} placeholder="Service history (separate with ;)" className="w-full rounded-lg border border-stone-600 bg-stone-900 px-2 py-2 text-xs text-white sm:col-span-2" />
                </div>

                {/* Fleet List */}
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {equipmentList.map((eq) => (
                    <div
                      key={eq.id}
                      className="flex items-center justify-between bg-stone-950 border border-stone-800 px-3 py-1.5 rounded-lg text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-400">{eq.make}</span>
                        <span className="text-stone-200">{eq.model}</span>
                        <span className="text-stone-500">({eq.type})</span>
                        {eq.pinBoreSpecs && (
                          <span className="text-emerald-400 font-mono text-[11px]">
                            [{eq.pinBoreSpecs}]
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveEquipment(eq.id)}
                        className="text-stone-500 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {equipmentList.length === 0 && (
                    <p className="text-stone-500 text-xs italic">No fleet machines logged yet.</p>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-stone-300 text-xs font-medium mb-1">Contract / Operating Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special client instructions, site induction requirements, preferred tolerances..."
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="sticky bottom-0 bg-stone-900/95 backdrop-blur-md pt-3 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 border-t border-stone-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs shadow-md transition-colors"
                >
                  Save Customer & Fleet
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
