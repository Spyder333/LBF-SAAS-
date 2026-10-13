import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Printer,
  Download,
  Search,
  Filter,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Calculator,
  X,
  Sparkles,
  DollarSign,
  LayoutGrid,
  List,
  Mail,
  MessageCircle,
  CircleDollarSign
} from 'lucide-react';
import { CommunicationEntry, Customer, Invoice, InvoiceItem, InvoiceStatus, Quote, SaaSUser, ServiceCategory } from '../types';
import { LBF_SERVICES } from '../data/mockData';
import { exportInvoicesToExcel, exportSingleInvoiceToExcel } from '../lib/excel';
import { api } from '../lib/api';

interface AutomatedInvoiceProps {
  invoices: Invoice[];
  customers: Customer[];
  onUpdateInvoices: (invoices: Invoice[]) => void;
  onViewPrintInvoice: (invoice: Invoice) => void;
  preSelectedCustomerId?: string | null;
  onClearPreSelectedCustomer?: () => void;
  initialPresetCalculation?: { desc: string; total: number; formula: string } | null;
  onClearPresetCalculation?: () => void;
  initialQuote?: Quote | null;
  onClearInitialQuote?: () => void;
  user: SaaSUser;
  onLogCommunication: (entry: Omit<CommunicationEntry, 'id' | 'createdAt' | 'createdBy'>) => void;
  initialJobId?: string | null;
  onClearInitialJobId?: () => void;
  onInvoiceCreated: (invoice: Invoice) => void;
}

export const AutomatedInvoice: React.FC<AutomatedInvoiceProps> = ({
  invoices,
  customers,
  onUpdateInvoices,
  onViewPrintInvoice,
  preSelectedCustomerId,
  onClearPreSelectedCustomer,
  initialPresetCalculation,
  onClearPresetCalculation,
  initialQuote,
  onClearInitialQuote,
  user,
  onLogCommunication,
  initialJobId,
  onClearInitialJobId,
  onInvoiceCreated
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDeleteInvId, setConfirmDeleteInvId] = useState<string | null>(null);
  const [invoiceToast, setInvoiceToast] = useState<{ type: 'success' | 'info'; text: string } | null>(null);
  const [paymentInvoiceId, setPaymentInvoiceId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank transfer');

  // New Invoice Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedService, setSelectedService] = useState<ServiceCategory>('line_boring_fabrication');
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [equipmentNote, setEquipmentNote] = useState<string>('');
  const [taxRate, setTaxRate] = useState<number>(0.15); // 15% VAT
  const [discountRate, setDiscountRate] = useState<number>(0);
  const [depositPaid, setDepositPaid] = useState<number>(0);
  const [depositRequired, setDepositRequired] = useState<number>(0);
  const [financingStatus, setFinancingStatus] = useState<NonNullable<Invoice['financingStatus']>>('not_required');
  const [invoiceNotes, setInvoiceNotes] = useState<string>('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [linkedJobId, setLinkedJobId] = useState<string | null>(null);

  React.useEffect(() => {
    if (!initialJobId) return;
    setLinkedJobId(initialJobId);
    setIsCreateModalOpen(true);
    onClearInitialJobId?.();
  }, [initialJobId, onClearInitialJobId]);

  // Open modal if pre-selected customer or preset calculation comes in
  React.useEffect(() => {
    if (preSelectedCustomerId) {
      const cust = customers.find((c) => c.id === preSelectedCustomerId);
      if (cust) {
        setSelectedCustomerId(cust.id);
        if (cust.equipmentFleet && cust.equipmentFleet.length > 0) {
          const firstEq = cust.equipmentFleet[0];
          setEquipmentNote(`${firstEq.make} ${firstEq.model} (${firstEq.type})`);
        }
      }
      setIsCreateModalOpen(true);
      if (onClearPreSelectedCustomer) onClearPreSelectedCustomer();
    }
  }, [preSelectedCustomerId, customers]);

  React.useEffect(() => {
    if (initialPresetCalculation) {
      setIsCreateModalOpen(true);
      const newItem: InvoiceItem = {
        id: `item-${Date.now()}`,
        serviceCategory: selectedService,
        description: initialPresetCalculation.desc,
        quantity: 1,
        unit: 'calculation',
        unitPrice: initialPresetCalculation.total,
        formulaUsed: initialPresetCalculation.formula,
        total: initialPresetCalculation.total
      };
      setItems((prev) => [...prev, newItem]);
      if (onClearPresetCalculation) onClearPresetCalculation();
    }
  }, [initialPresetCalculation]);

  React.useEffect(() => {
    if (!initialQuote) return;

    const matchedCustomer = customers.find((customer) =>
      customer.companyName.toLowerCase() === initialQuote.customerName.toLowerCase() ||
      customer.email.toLowerCase() === initialQuote.customerEmail.toLowerCase()
    );

    if (matchedCustomer) {
      setSelectedCustomerId(matchedCustomer.id);
      if (matchedCustomer.equipmentFleet && matchedCustomer.equipmentFleet.length > 0) {
        const firstEq = matchedCustomer.equipmentFleet[0];
        setEquipmentNote(`${firstEq.make} ${firstEq.model} (${firstEq.type})`);
      }
    } else if (customers.length > 0) {
      setSelectedCustomerId(customers[0].id);
    }

    setSelectedService('line_boring_fabrication');
    setTaxRate(initialQuote.taxRate || 0.15);
    setItems(
      initialQuote.lineItems.map((item, index) => ({
        id: `quote-item-${initialQuote.id}-${index}`,
        serviceCategory: 'line_boring_fabrication',
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.rate,
        formulaUsed: `${item.quantity} * $${item.rate.toFixed(2)}`,
        total: item.total
      }))
    );
    setIsCreateModalOpen(true);

    if (onClearInitialQuote) {
      onClearInitialQuote();
    }
  }, [initialQuote, customers]);

  // Automated formula preset applicator for selected service
  const applyServiceFormulaPresets = (serviceId: ServiceCategory) => {
    setSelectedService(serviceId);
    const sDetail = LBF_SERVICES.find((s) => s.id === serviceId);
    if (!sDetail) return;

    // Generate intelligent default line items tailored to this service
    let defaultItems: InvoiceItem[] = [];

    if (serviceId === 'line_boring_fabrication') {
      defaultItems = [
        {
          id: `item-${Date.now()}-1`,
          serviceCategory: 'line_boring_fabrication',
          description: 'Line Boring Machine Setup & Alignment to OEM Centerline',
          quantity: 1,
          unit: 'setup',
          unitPrice: 350,
          formulaUsed: 'Base Setup Fee',
          total: 350
        },
        {
          id: `item-${Date.now()}-2`,
          serviceCategory: 'line_boring_fabrication',
          description: 'Precision Automated Spiral Bore Welding & Machining (110mm Bores)',
          quantity: 2,
          unit: 'bores',
          unitPrice: 480,
          formulaUsed: '2 bores * $480/bore',
          total: 960
        }
      ];
    } else if (serviceId === 'onsite_lineboring') {
      defaultItems = [
        {
          id: `item-${Date.now()}-1`,
          serviceCategory: 'onsite_lineboring',
          description: '4x4 Mobile Line Boring Rig Mobilization with 35kVA Gen',
          quantity: 1,
          unit: 'trip',
          unitPrice: 450,
          formulaUsed: 'Base Mobilization Flat',
          total: 450
        },
        {
          id: `item-${Date.now()}-2`,
          serviceCategory: 'travel_mobilization',
          description: 'Site Travel Distance (Mining Haul Road)',
          quantity: 120,
          unit: 'km',
          unitPrice: 2.50,
          formulaUsed: '120 km * $2.50/km',
          total: 300
        },
        {
          id: `item-${Date.now()}-3`,
          serviceCategory: 'onsite_lineboring',
          description: 'Onsite Field Machining & Automated Bore Cladding',
          quantity: 12,
          unit: 'hours',
          unitPrice: 185,
          formulaUsed: '12 hrs * $185/hr',
          total: 2220
        }
      ];
    } else if (serviceId === 'bucket_repair') {
      defaultItems = [
        {
          id: `item-${Date.now()}-1`,
          serviceCategory: 'bucket_repair',
          description: 'Bucket Crack Arc-Air Gouging & Structural Bevel Prep',
          quantity: 1,
          unit: 'job',
          unitPrice: 380,
          formulaUsed: 'Prep Flat Fee',
          total: 380
        },
        {
          id: `item-${Date.now()}-2`,
          serviceCategory: 'bucket_repair',
          description: 'Excavator Bucket Ear Pin Boss Line Boring & Re-bushing',
          quantity: 2,
          unit: 'ears',
          unitPrice: 420,
          formulaUsed: '2 ears * $420',
          total: 840
        },
        {
          id: `item-${Date.now()}-3`,
          serviceCategory: 'consumables',
          description: 'High-Impact Chromium Hardfacing Overlay (Floor & Cheeks)',
          quantity: 3.5,
          unit: 'm²',
          unitPrice: 290,
          formulaUsed: '3.5 m² * $290/m²',
          total: 1015
        }
      ];
    } else if (serviceId === 'cutting_edge_replacement') {
      defaultItems = [
        {
          id: `item-${Date.now()}-1`,
          serviceCategory: 'cutting_edge_replacement',
          description: 'Oxy-Acetylene Removal of Worn Scalloped Lip & Bevel Prep',
          quantity: 1,
          unit: 'job',
          unitPrice: 280,
          formulaUsed: 'Demolition & Prep',
          total: 280
        },
        {
          id: `item-${Date.now()}-2`,
          serviceCategory: 'cutting_edge_replacement',
          description: 'Genuine Hardox 500 Double-Bevel Base Cutting Edge (35mm x 300mm)',
          quantity: 3.2,
          unit: 'meters',
          unitPrice: 580,
          formulaUsed: 'Length (3.2m) * $580/m',
          total: 1856
        },
        {
          id: `item-${Date.now()}-3`,
          serviceCategory: 'co2_welding',
          description: 'Multi-pass Heavy Flux-core Full Penetration Welding',
          quantity: 8,
          unit: 'hours',
          unitPrice: 95,
          formulaUsed: '8 hrs * $95/hr',
          total: 760
        }
      ];
    } else if (serviceId === 'co2_welding') {
      defaultItems = [
        {
          id: `item-${Date.now()}-1`,
          serviceCategory: 'co2_welding',
          description: 'Coded Structural CO2 Flux-Core Welder (MIG/MAG)',
          quantity: 16,
          unit: 'hours',
          unitPrice: 95,
          formulaUsed: 'Hours (16) * $95/hr',
          total: 1520
        },
        {
          id: `item-${Date.now()}-2`,
          serviceCategory: 'consumables',
          description: 'Heavy Deposition E71T-1 Flux-Core Welding Wire Spools (15kg)',
          quantity: 4,
          unit: 'spools',
          unitPrice: 85,
          formulaUsed: '4 spools * $85',
          total: 340
        },
        {
          id: `item-${Date.now()}-3`,
          serviceCategory: 'consumables',
          description: 'Industrial CO2/Argon Shielding Gas Cylinders',
          quantity: 3,
          unit: 'cylinders',
          unitPrice: 65,
          formulaUsed: '3 * $65',
          total: 195
        }
      ];
    } else if (serviceId === 'industrial_gearboxes') {
      defaultItems = [
        {
          id: `item-${Date.now()}-1`,
          serviceCategory: 'industrial_gearboxes',
          description: 'Complete Teardown, Ultrasonic Degrease & NDT Magnetic Particle Test',
          quantity: 1,
          unit: 'stage',
          unitPrice: 650,
          formulaUsed: 'Teardown & NDT Test',
          total: 650
        },
        {
          id: `item-${Date.now()}-2`,
          serviceCategory: 'industrial_gearboxes',
          description: 'Housing Bearing Bore Line Boring & Reclamation (320mm)',
          quantity: 2,
          unit: 'pockets',
          unitPrice: 850,
          formulaUsed: '2 pockets * $850',
          total: 1700
        },
        {
          id: `item-${Date.now()}-3`,
          serviceCategory: 'parts_materials',
          description: 'Heavy Spherical Roller Bearings & Viton Seals Kit',
          quantity: 1,
          unit: 'kit',
          unitPrice: 1450,
          formulaUsed: 'OEM Parts Package',
          total: 1450
        },
        {
          id: `item-${Date.now()}-4`,
          serviceCategory: 'industrial_gearboxes',
          description: 'Laser Alignment, Gear Lash Setting & 4hr Vibration Spin Test',
          quantity: 1,
          unit: 'test',
          unitPrice: 720,
          formulaUsed: 'Spin Test & QA Signoff',
          total: 720
        }
      ];
    } else if (serviceId === 'new_bucket_fabrication') {
      defaultItems = [
        {
          id: `item-${Date.now()}-1`,
          serviceCategory: 'new_bucket_fabrication',
          description: 'Fabrication of Heavy-Duty Rock Bucket Shell (Hardox 450/500)',
          quantity: 3.5,
          unit: 'm³ cap.',
          unitPrice: 2400,
          formulaUsed: '3.5m³ * $2400/m³ shell',
          total: 8400
        },
        {
          id: `item-${Date.now()}-2`,
          serviceCategory: 'line_boring_fabrication',
          description: 'Ear Bracket Precision Line Boring to Excavator Kinematic Specs',
          quantity: 1,
          unit: 'bucket',
          unitPrice: 950,
          formulaUsed: 'Bore Ears Flat',
          total: 950
        },
        {
          id: `item-${Date.now()}-3`,
          serviceCategory: 'parts_materials',
          description: 'Heavy Wear Package (Heel Shrouds, Chocky Bars & Lip Shrouds)',
          quantity: 1,
          unit: 'package',
          unitPrice: 1450,
          formulaUsed: 'GET Wear Package',
          total: 1450
        }
      ];
    }

    setItems(defaultItems);
  };

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      serviceCategory: selectedService,
      description: 'Custom Line Item',
      quantity: 1,
      unit: 'unit',
      unitPrice: 100,
      formulaUsed: '1 * $100',
      total: 100
    };
    setItems([...items, newItem]);
  };

  const handleUpdateItem = (id: string, field: keyof InvoiceItem, val: any) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: val };
        if (field === 'quantity' || field === 'unitPrice') {
          const q = field === 'quantity' ? parseFloat(val) || 0 : it.quantity;
          const p = field === 'unitPrice' ? parseFloat(val) || 0 : it.unitPrice;
          updated.total = Math.round(q * p * 100) / 100;
          updated.formulaUsed = `${q} * $${p.toFixed(2)}`;
        }
        return updated;
      })
    );
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((it) => it.id !== id));
  };

  // Calculated Totals
  const subtotal = items.reduce((sum, it) => sum + (it.total || 0), 0);
  const discountAmount = Math.round(subtotal * discountRate * 100) / 100;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = Math.round(taxableAmount * taxRate * 100) / 100;
  const totalAmount = Math.round((taxableAmount + taxAmount) * 100) / 100;
  const balanceDue = Math.max(0, Math.round((totalAmount - depositPaid) * 100) / 100);

  const handleCreateInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const customer = customers.find((c) => c.id === selectedCustomerId);
    if (!customer) {
      setFormError('Please select a customer for this invoice.');
      return;
    }
    if (items.length === 0) {
      setFormError('Please add at least one line item to this invoice.');
      return;
    }

    const invNumber = `LBF-2026-${String(invoices.length + 44).padStart(3, '0')}`;

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      jobId: linkedJobId || undefined,
      invoiceNumber: invNumber,
      customerId: customer.id,
      customerName: customer.companyName,
      customerEmail: customer.email,
      customerAddress: `${customer.address}, ${customer.city}`,
      customerTaxNumber: customer.taxNumber,
      serviceCategory: selectedService,
      date: invoiceDate,
      dueDate: dueDate,
      equipmentInfo: equipmentNote || `${customer.equipmentFleet?.[0]?.make || ''} ${customer.equipmentFleet?.[0]?.model || 'Industrial Machine'}`,
      items,
      subtotal,
      taxRate,
      taxAmount,
      discountRate,
      discountAmount,
      total: totalAmount,
      depositPaid,
      balanceDue,
      status: depositPaid >= totalAmount ? 'paid' : depositPaid > 0 ? 'in_progress' : 'pending',
      notes: invoiceNotes || 'Machined to factory tolerance ±0.02mm. NDT crack tested and certified.',
      terms: 'Strictly 14 days from completion. All workmanship guaranteed.',
      createdAt: new Date().toISOString().split('T')[0],
      createdBy: user.name,
      paymentTerms: customer.paymentTerms || '14 days',
      depositRequired,
      financingStatus,
      paymentHistory: depositPaid > 0 ? [{ id: `payment-${Date.now()}`, amount: depositPaid, paidAt: new Date().toISOString(), method: 'Deposit', recordedBy: user.name }] : []
    };

    await api.saveInvoice(newInvoice);
    onInvoiceCreated(newInvoice);
    const updatedInvoices = await api.getInvoices();
    onUpdateInvoices(updatedInvoices);
    setIsCreateModalOpen(false);

    // Reset items
    setItems([]);
    setDepositPaid(0);
    setDepositRequired(0);
    setFinancingStatus('not_required');
    setLinkedJobId(null);
    setInvoiceToast({ type: 'success', text: `Invoice ${newInvoice.invoiceNumber} created and saved.` });
    setTimeout(() => setInvoiceToast(null), 4000);
  };

  const handleStatusChange = async (invoice: Invoice, newStatus: InvoiceStatus) => {
    const updated = { ...invoice, status: newStatus };
    if (newStatus === 'paid') {
      updated.depositPaid = updated.total;
      updated.balanceDue = 0;
    }
    await api.saveInvoice(updated);
    const list = await api.getInvoices();
    onUpdateInvoices(list);
  };

  const handleRecordPayment = async (invoice: Invoice) => {
    const amount = Number(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > invoice.balanceDue) return;
    const updated: Invoice = {
      ...invoice,
      depositPaid: invoice.depositPaid + amount,
      balanceDue: Math.max(0, invoice.balanceDue - amount),
      status: amount >= invoice.balanceDue ? 'paid' : 'in_progress',
      paymentHistory: [...(invoice.paymentHistory || []), {
        id: `payment-${Date.now()}`, amount, paidAt: new Date().toISOString(), method: paymentMethod, recordedBy: user.name
      }]
    };
    await api.saveInvoice(updated);
    onUpdateInvoices(await api.getInvoices());
    setPaymentAmount(''); setPaymentInvoiceId(null);
  };

  const emailInvoice = (invoice: Invoice) => {
    onLogCommunication({ customerName: invoice.customerName, channel: 'email', subject: `Invoice ${invoice.invoiceNumber} emailed` });
  };

  const remindInvoice = (invoice: Invoice) => {
    onLogCommunication({ customerName: invoice.customerName, channel: 'whatsapp', subject: `Payment reminder sent for ${invoice.invoiceNumber}` });
  };

  const handleDeleteInvoice = async (id: string) => {
    await api.deleteInvoice(id);
    const list = await api.getInvoices();
    onUpdateInvoices(list);
    setConfirmDeleteInvId(null);
    setInvoiceToast({ type: 'info', text: 'Invoice deleted successfully.' });
    setTimeout(() => setInvoiceToast(null), 4000);
  };

  const closeCreateInvoiceModal = () => {
    setIsCreateModalOpen(false);
    setLinkedJobId(null);
  };

  const today = new Date().toISOString().slice(0, 10);
  const displayedStatus = (invoice: Invoice): InvoiceStatus => invoice.balanceDue > 0 && invoice.dueDate < today ? 'overdue' : invoice.status;

  // Filtered List
  const filteredInvoices = invoices.filter((inv) => {
    const matchSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.equipmentInfo && inv.equipmentInfo.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchStatus = statusFilter === 'all' || displayedStatus(inv) === statusFilter;
    const matchService = serviceFilter === 'all' || inv.serviceCategory === serviceFilter;

    return matchSearch && matchStatus && matchService;
  });

  const totalBilled = invoices.reduce((sum, i) => sum + i.total, 0);
  const totalReceived = invoices.reduce((sum, i) => sum + i.depositPaid, 0);
  const totalOutstanding = invoices.reduce((sum, i) => sum + i.balanceDue, 0);
  const overdueInvoices = invoices.filter((invoice) => displayedStatus(invoice) === 'overdue');
  const overdueBalance = overdueInvoices.reduce((sum, invoice) => sum + invoice.balanceDue, 0);

  return (
    <div className="space-y-6">
      
      {/* In-App Notification Toast */}
      {invoiceToast && (
        <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium shadow-lg transition-all ${
          invoiceToast.type === 'success'
            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
            : 'bg-stone-900 border-amber-500/40 text-amber-300'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{invoiceToast.text}</span>
          </div>
          <button
            onClick={() => setInvoiceToast(null)}
            className="text-stone-400 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Financial Dashboard Summary - Balanced 4-Card Industrial Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-4">
        <div className="bg-stone-900 border border-stone-800 p-3.5 sm:p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <p className="text-[10px] sm:text-xs text-stone-400 uppercase font-semibold tracking-wider">Total Invoiced</p>
            <p className="text-lg sm:text-2xl font-bold font-industrial text-white mt-1">
              ${totalBilled.toFixed(2)}
            </p>
          </div>
          <p className="text-[10px] sm:text-[11px] text-stone-500 mt-2 flex items-center gap-1 font-mono">
            <span>{invoices.length} total job cards</span>
          </p>
        </div>

        <div className="bg-stone-900 border border-rose-400/40 p-3.5 sm:p-5 rounded-xl flex flex-col justify-between">
          <div><p className="text-[10px] sm:text-xs text-stone-200 uppercase font-semibold tracking-wider">Overdue balances</p><p className="text-lg sm:text-2xl font-bold font-industrial text-rose-200 mt-1">${overdueBalance.toFixed(2)}</p></div>
          <p className="text-[10px] sm:text-[11px] text-stone-200 mt-2">{overdueInvoices.length} invoice{overdueInvoices.length === 1 ? '' : 's'} past due</p>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-3.5 sm:p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <p className="text-[10px] sm:text-xs text-stone-400 uppercase font-semibold tracking-wider">Payments Collected</p>
            <p className="text-lg sm:text-2xl font-bold font-industrial text-emerald-400 mt-1">
              ${totalReceived.toFixed(2)}
            </p>
          </div>
          <p className="text-[10px] sm:text-[11px] text-stone-500 mt-2 font-mono">
            {totalBilled > 0 ? `${Math.round((totalReceived / totalBilled) * 100)}% recovery rate` : 'Settled accounts'}
          </p>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-3.5 sm:p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <p className="text-[10px] sm:text-xs text-stone-400 uppercase font-semibold tracking-wider">Outstanding Balances</p>
            <p className="text-lg sm:text-2xl font-bold font-industrial text-amber-400 mt-1">
              ${totalOutstanding.toFixed(2)}
            </p>
          </div>
          <p className="text-[10px] sm:text-[11px] text-stone-500 mt-2 font-mono">
            {invoices.filter((i) => (i.balanceDue || 0) > 0).length} pending collections
          </p>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-3.5 sm:p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <p className="text-[10px] sm:text-xs text-stone-400 uppercase font-semibold tracking-wider">Average Job Value</p>
            <p className="text-lg sm:text-2xl font-bold font-industrial text-stone-200 mt-1">
              ${invoices.length > 0 ? (totalBilled / invoices.length).toFixed(2) : '0.00'}
            </p>
          </div>
          <p className="text-[10px] sm:text-[11px] text-stone-500 mt-2 font-mono">
            Machining &amp; line boring
          </p>
        </div>
      </div>

      {/* Unified Action Toolbar & Filters (Cohesive, flexible, zero scatter) */}
      <div className="bg-stone-900 border border-stone-800 p-3 sm:p-4 rounded-2xl flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 shadow-lg">
        
        {/* Left Side: Search & Filter Controls */}
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              id="invoice-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search invoice #, client, machinery..."
              className="w-full bg-stone-950 border border-stone-700 pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Status Filter */}
          <select
            id="invoice-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-stone-950 border border-stone-700 text-stone-200 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="paid">Paid in Full</option>
            <option value="in_progress">In Progress</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>

          {/* Service Category Filter */}
          <select
            id="invoice-service-filter"
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="bg-stone-950 border border-stone-700 text-stone-200 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-amber-500 cursor-pointer max-w-[190px] truncate"
          >
            <option value="all">All 7 Services</option>
            {LBF_SERVICES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Right Side: Grouped Actions (View Toggle + Export + New Invoice) */}
        <div className="flex items-center gap-2 justify-end shrink-0">
          
          {/* View Mode Toggle (Cards vs Table) */}
          <div className="flex items-center bg-stone-950 p-1 rounded-xl border border-stone-800 shrink-0">
            <button
              type="button"
              id="toggle-invoice-view-cards"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Card View (Mobile & Touch Friendly)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              type="button"
              id="toggle-invoice-view-table"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Table View (Data Grid)"
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          {/* Export to Excel */}
          <button
            onClick={() => exportInvoicesToExcel(invoices)}
            title="Export all invoices to Microsoft Excel spreadsheet"
            className="flex items-center gap-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-semibold border border-stone-700 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Export Excel</span>
            <span className="sm:hidden">Export</span>
          </button>

          {/* Create Invoice Primary Button */}
          <button
            id="create-invoice-main-btn"
            onClick={() => {
              applyServiceFormulaPresets('line_boring_fabrication');
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {/* INVOICE LIST DISPLAY: DUAL CARDS OR TABLE VIEW */}
      {viewMode === 'cards' ? (
        /* RESPONSIVE CARDS VIEW (Optimized for desktop computers and widescreen displays) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 xl:gap-5">
          {filteredInvoices.map((inv) => (
            <div
              key={inv.id}
              id={`invoice-card-${inv.id}`}
              className="bg-stone-900 border border-stone-800 hover:border-stone-700 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col justify-between transition-all"
            >
              <div>
                {/* Top Row: Invoice Number, Status Pill & Date */}
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-stone-800">
                  <div>
                    <span className="font-mono font-bold text-amber-400 text-sm tracking-wide">
                      {inv.invoiceNumber}
                    </span>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      {inv.date} &bull; Due {inv.dueDate}
                    </p>
                  </div>

                  <select
                    value={displayedStatus(inv)}
                    onChange={(e) => handleStatusChange(inv, e.target.value as InvoiceStatus)}
                    className={`text-[10px] font-bold uppercase rounded-lg px-2 py-1 border transition-colors focus:outline-none ${
                      displayedStatus(inv) === 'paid'
                        ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700'
                        : displayedStatus(inv) === 'in_progress'
                        ? 'bg-blue-950/70 text-blue-300 border-blue-700'
                        : displayedStatus(inv) === 'overdue'
                        ? 'bg-red-950/70 text-red-300 border-red-700'
                        : 'bg-amber-950/70 text-amber-300 border-amber-700'
                    }`}
                  >
                    <option value="draft">Draft</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>

                {/* Customer & Equipment Details */}
                <div className="pt-3 pb-2 space-y-1">
                  <h4 className="text-base font-bold text-white font-industrial leading-snug">
                    {inv.customerName}
                  </h4>
                  {inv.equipmentInfo && (
                    <p className="text-xs text-stone-400 line-clamp-2">
                      {inv.equipmentInfo}
                    </p>
                  )}
                  <div className="pt-1.5">
                    <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-stone-950 text-stone-300 border border-stone-800 capitalize">
                      {inv.serviceCategory.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="mt-3 p-3 bg-stone-950 rounded-xl border border-stone-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-500 block">Total Billed</span>
                    <span className="text-base font-bold font-mono text-white">
                      ${inv.total.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-stone-500 block">Balance Due</span>
                    <span className={`text-base font-bold font-mono ${inv.balanceDue > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      ${inv.balanceDue.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-stone-200">
                  <span>Received: <strong className="text-emerald-200">${inv.depositPaid.toFixed(2)}</strong></span>
                  <span>Terms: {inv.paymentTerms || inv.terms || '14 days'}</span>
                  <span>Deposit: ${inv.depositRequired?.toFixed(2) || '0.00'} · Financing: {(inv.financingStatus || 'not_required').replace('_', ' ')}</span>
                </div>
                {(inv.paymentHistory || []).length > 0 && <details className="mt-2 text-xs"><summary className="cursor-pointer font-semibold text-amber-200">Payment history ({inv.paymentHistory?.length})</summary><div className="mt-1 space-y-1">{inv.paymentHistory?.map((payment) => <p key={payment.id} className="text-stone-200">${payment.amount.toFixed(2)} · {payment.method} · {new Date(payment.paidAt).toLocaleDateString()} · {payment.recordedBy}</p>)}</div></details>}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-stone-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => onViewPrintInvoice(inv)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-stone-950 border border-amber-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View / Print</span>
                </button>

                <button
                  onClick={() => exportSingleInvoiceToExcel(inv)}
                  className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-xl transition-colors cursor-pointer"
                  title="Export invoice to Excel"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                </button>

                <a href={`mailto:${encodeURIComponent(inv.customerEmail)}?subject=${encodeURIComponent(`Invoice ${inv.invoiceNumber}`)}&body=${encodeURIComponent(`Hello ${inv.customerName},\n\nPlease find invoice ${inv.invoiceNumber} for $${inv.total.toFixed(2)}. Balance due: $${inv.balanceDue.toFixed(2)}.\nPayment terms: ${inv.paymentTerms || inv.terms || '14 days'}.\n\nRegards,\nLBF Solutions`)}`} onClick={() => emailInvoice(inv)} title="Email invoice" className="rounded-xl border border-stone-600 p-2 text-stone-100 hover:border-amber-400"><Mail className="h-4 w-4"/></a>
                <a href={`https://wa.me/${(customers.find((customer) => customer.id === inv.customerId)?.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${inv.customerName}, this is a payment reminder for invoice ${inv.invoiceNumber}. Outstanding balance: $${inv.balanceDue.toFixed(2)}. Thank you, LBF Solutions.`)}`} target="_blank" rel="noreferrer" onClick={() => remindInvoice(inv)} title="WhatsApp payment reminder" className="rounded-xl border border-stone-600 p-2 text-emerald-200 hover:border-emerald-400"><MessageCircle className="h-4 w-4"/></a>
                {inv.balanceDue > 0 && <button type="button" onClick={() => { setPaymentInvoiceId(paymentInvoiceId === inv.id ? null : inv.id); setPaymentAmount(''); }} title="Record partial payment" className="rounded-xl border border-stone-600 p-2 text-amber-200 hover:border-amber-400"><CircleDollarSign className="h-4 w-4"/></button>}

                {confirmDeleteInvId === inv.id ? (
                  <div className="flex items-center gap-1 bg-rose-950/80 p-1 rounded-xl border border-rose-600">
                    <button
                      type="button"
                      onClick={() => handleDeleteInvoice(inv.id)}
                      className="text-[10px] font-bold bg-rose-600 text-white px-2 py-1 rounded cursor-pointer"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteInvId(null)}
                      className="text-[10px] text-stone-400 hover:text-white px-1 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteInvId(inv.id)}
                    className="p-2 bg-stone-800 hover:bg-red-950/60 text-stone-400 hover:text-red-300 border border-stone-700 rounded-xl transition-colors cursor-pointer"
                    title="Delete Invoice"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              {paymentInvoiceId === inv.id && <form onSubmit={(event) => { event.preventDefault(); void handleRecordPayment(inv); }} className="mt-3 grid grid-cols-[1fr_1fr_auto] gap-2 rounded-lg border border-stone-600 bg-stone-800 p-2"><input aria-label="Payment amount" type="number" min="0.01" max={inv.balanceDue} step="0.01" required value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} placeholder="Amount" className="min-w-0 rounded-md border border-stone-600 bg-stone-900 px-2 py-1.5 text-xs text-white"/><select aria-label="Payment method" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="min-w-0 rounded-md border border-stone-600 bg-stone-900 px-2 py-1.5 text-xs text-white"><option>Bank transfer</option><option>Cash</option><option>Card</option><option>Mobile money</option><option>Deposit</option></select><button className="rounded-md bg-amber-500 px-2 py-1.5 text-xs font-bold text-stone-950">Record</button></form>}
            </div>
          ))}

          {filteredInvoices.length === 0 && (
            <div className="col-span-full py-12 text-center text-stone-400 bg-stone-900 border border-stone-800 rounded-2xl p-6">
              No invoices match your filter. Click "Create Invoice" to generate one.
            </div>
          )}
        </div>
      ) : (
        /* TRADITIONAL DATA TABLE VIEW (Ideal for wide desktop screens) */
        <div className="bg-stone-900 border border-stone-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-stone-950 border-b border-stone-800 text-xs uppercase tracking-wider text-stone-400 font-semibold font-industrial">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date / Due</th>
                  <th className="py-3 px-4">Customer & Fleet Equipment</th>
                  <th className="py-3 px-4">Service Category</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-stone-800/50 transition-colors">
                    
                    {/* Invoice # */}
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                      {inv.invoiceNumber}
                    </td>

                    {/* Dates */}
                    <td className="py-3.5 px-4 text-xs text-stone-300">
                      <p>{inv.date}</p>
                      <p className="text-stone-500 text-[11px]">Due: {inv.dueDate}</p>
                    </td>

                    {/* Customer & Equipment */}
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-stone-100">{inv.customerName}</p>
                      {inv.equipmentInfo && (
                        <p className="text-stone-400 text-xs truncate max-w-xs">
                          {inv.equipmentInfo}
                        </p>
                      )}
                    </td>

                    {/* Service Category */}
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-stone-800 text-stone-300 border border-stone-700 capitalize">
                        {inv.serviceCategory.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Total */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-stone-100">
                      ${inv.total.toFixed(2)}
                    </td>

                    {/* Balance Due */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold">
                      <span className={inv.balanceDue > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                        ${inv.balanceDue.toFixed(2)}
                      </span>
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-3.5 px-4 text-center relative">
                      <select
                        value={displayedStatus(inv)}
                        onChange={(e) => handleStatusChange(inv, e.target.value as InvoiceStatus)}
                        className={`text-[11px] font-bold uppercase rounded-lg px-2 py-1 border transition-colors focus:outline-none ${
                          displayedStatus(inv) === 'paid'
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700'
                            : displayedStatus(inv) === 'in_progress'
                            ? 'bg-blue-950/60 text-blue-300 border-blue-700'
                            : displayedStatus(inv) === 'overdue'
                            ? 'bg-red-950/60 text-red-300 border-red-700'
                            : 'bg-amber-950/60 text-amber-300 border-amber-700'
                        }`}
                      >
                        <option value="draft">Draft</option>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onViewPrintInvoice(inv)}
                          className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg transition-colors"
                          title="View & Print Invoice / PDF"
                        >
                          <Eye className="w-4 h-4 text-amber-400" />
                        </button>
                        <button
                          onClick={() => exportSingleInvoiceToExcel(inv)}
                          className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg transition-colors"
                          title="Export this invoice to Excel .xlsx"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                        </button>
                        {inv.balanceDue > 0 && <button type="button" onClick={() => { setPaymentInvoiceId(paymentInvoiceId === inv.id ? null : inv.id); setPaymentAmount(''); }} className="p-1.5 rounded-lg border border-stone-600 text-amber-200 hover:border-amber-400" title="Record a partial payment"><CircleDollarSign className="h-4 w-4"/></button>}
                        {paymentInvoiceId === inv.id && <form onSubmit={(event) => { event.preventDefault(); void handleRecordPayment(inv); }} className="absolute right-1 top-full z-10 mt-1 grid w-52 gap-2 rounded-lg border border-stone-600 bg-stone-900 p-3 text-left shadow-xl"><input aria-label="Payment amount" type="number" min="0.01" max={inv.balanceDue} step="0.01" required value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} placeholder="Payment amount" className="rounded-md border border-stone-600 bg-stone-950 px-2 py-1.5 text-xs text-white"/><select aria-label="Payment method" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="rounded-md border border-stone-600 bg-stone-950 px-2 py-1.5 text-xs text-white"><option>Bank transfer</option><option>Cash</option><option>Card</option><option>Mobile money</option><option>Deposit</option></select><button className="rounded-md bg-amber-500 px-2 py-1.5 text-xs font-bold text-stone-950">Record payment</button></form>}
                        {confirmDeleteInvId === inv.id ? (
                          <div className="flex items-center gap-1 bg-rose-950/80 p-0.5 rounded border border-rose-600">
                            <button
                              type="button"
                              onClick={() => handleDeleteInvoice(inv.id)}
                              className="text-[10px] font-bold bg-rose-600 text-white px-1.5 py-0.5 rounded cursor-pointer"
                            >
                              Del
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteInvId(null)}
                              className="text-[10px] text-stone-400 hover:text-white px-1 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteInvId(inv.id)}
                            className="p-1.5 bg-stone-800 hover:bg-red-900/50 text-stone-400 hover:text-red-300 rounded-lg transition-colors cursor-pointer"
                            title="Delete Invoice"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))}

                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-stone-400">
                      No invoices match your filter. Click "Create Invoice" to generate one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE AUTOMATED INVOICE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/85 backdrop-blur-md p-2 sm:p-6 flex items-start justify-center">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl sm:rounded-3xl w-full max-w-5xl xl:max-w-6xl 2xl:max-w-7xl max-h-[96vh] sm:max-h-[92vh] overflow-y-auto shadow-2xl p-4 sm:p-8 my-2 sm:my-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 sm:pb-5 border-b border-stone-800">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <Calculator className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-xl font-bold font-industrial text-white tracking-wide">
                    CREATE AUTOMATED TAX INVOICE
                  </h3>
                  <p className="text-[10px] sm:text-xs text-stone-400">
                    Pre-loaded engineering formulas for all 7 LBF services &bull; Auto calculations
                  </p>
                </div>
              </div>
              <button
                onClick={closeCreateInvoiceModal}
                className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoiceSubmit} className="space-y-6 mt-6">
              
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{formError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormError(null)}
                    className="text-stone-400 hover:text-white p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              
              {/* Service Selection Tabs (The 7 Core LBF Services) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                  Select Core LBF Service (Auto-loads Engineering Formula Line Items):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
                  {LBF_SERVICES.map((s) => {
                    const isSelected = selectedService === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => applyServiceFormulaPresets(s.id)}
                        className={`p-2 rounded-xl text-left border text-xs transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-stone-950 font-bold border-amber-400 shadow-md shadow-amber-500/20'
                            : 'bg-stone-950 text-stone-300 border-stone-800 hover:border-stone-700 hover:bg-stone-800'
                        }`}
                      >
                        <p className="truncate font-semibold">{s.name}</p>
                        <p className={`text-[10px] truncate ${isSelected ? 'text-stone-900' : 'text-stone-500'}`}>
                          ${s.defaultRate} {s.standardRateUnit.split(' ')[0]}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Customer, Machine & Date Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-stone-300 font-medium mb-1">Customer / Mining Client *</label>
                  <select
                    required
                    value={selectedCustomerId}
                    onChange={(e) => {
                      setSelectedCustomerId(e.target.value);
                      const c = customers.find((cust) => cust.id === e.target.value);
                      if (c && c.equipmentFleet && c.equipmentFleet.length > 0) {
                        const eq = c.equipmentFleet[0];
                        setEquipmentNote(`${eq.make} ${eq.model} (${eq.type})`);
                      }
                    }}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-stone-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Select Customer Account --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName} ({c.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-300 font-medium mb-1">Fleet Machine / Equipment</label>
                  <input
                    type="text"
                    value={equipmentNote}
                    onChange={(e) => setEquipmentNote(e.target.value)}
                    placeholder="e.g. CAT 349D Excavator Boom & Pin"
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-stone-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-stone-300 font-medium mb-1">Invoice Date</label>
                    <input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-700 rounded-lg px-2.5 py-2 text-stone-200 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-300 font-medium mb-1">Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-700 rounded-lg px-2.5 py-2 text-stone-200 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Line Items Section with Formula Calculations */}
              <div className="pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>Itemized Machining &amp; Consumables ({items.length})</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-semibold border border-stone-700 transition-colors self-start sm:self-auto cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Custom Item</span>
                  </button>
                </div>

                {/* Desktop Column Header (Eliminates repeated labels per row) */}
                <div className="hidden md:grid md:grid-cols-12 gap-3 px-3 py-2 bg-stone-950/80 rounded-t-xl border-x border-t border-stone-800 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                  <div className="col-span-5">Service / Item Description</div>
                  <div className="col-span-3">Qty &amp; Unit</div>
                  <div className="col-span-2">Rate ($)</div>
                  <div className="col-span-2 text-right">Line Total</div>
                </div>

                <div className="space-y-2 md:space-y-0 md:border-b md:border-stone-800 md:rounded-b-xl overflow-hidden">
                  {items.map((item, idx) => (
                    <div
                      key={item.id}
                      className="bg-stone-950 md:bg-stone-950/50 border border-stone-800 md:border-x md:border-b-0 md:first:border-t-0 p-3 md:px-3 md:py-2.5 rounded-xl md:rounded-none grid grid-cols-1 md:grid-cols-12 gap-2.5 md:gap-3 items-center text-xs hover:bg-stone-900/60 transition-colors"
                    >
                      {/* Description Field */}
                      <div className="md:col-span-5">
                        <label className="text-[10px] text-stone-500 block mb-1 md:hidden font-medium">Description</label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                          placeholder="e.g. Line bore articulated hitch"
                          className="w-full bg-stone-900 border border-stone-700/80 rounded-lg px-2.5 py-1.5 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      {/* Qty & Unit Field */}
                      <div className="md:col-span-3">
                        <label className="text-[10px] text-stone-500 block mb-1 md:hidden font-medium">Qty &amp; Unit</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            step="any"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(item.id, 'quantity', e.target.value)}
                            className="w-20 shrink-0 bg-stone-900 border border-stone-700/80 rounded-lg px-2.5 py-1.5 text-stone-200 font-mono text-center focus:outline-none focus:border-amber-500"
                          />
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => handleUpdateItem(item.id, 'unit', e.target.value)}
                            placeholder="Unit"
                            className="flex-1 min-w-[70px] bg-stone-900 border border-stone-700/80 rounded-lg px-2.5 py-1.5 text-stone-300 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      {/* Rate Field */}
                      <div className="md:col-span-2">
                        <label className="text-[10px] text-stone-500 block mb-1 md:hidden font-medium">Rate ($)</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1.5 text-stone-500 font-mono">$</span>
                          <input
                            type="number"
                            step="any"
                            value={item.unitPrice}
                            onChange={(e) => handleUpdateItem(item.id, 'unitPrice', e.target.value)}
                            className="w-full bg-stone-900 border border-stone-700/80 rounded-lg pl-6 pr-2 py-1.5 text-stone-200 font-mono focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      {/* Total & Remove */}
                      <div className="md:col-span-2 flex items-center justify-between md:justify-end gap-2 pt-1 md:pt-0 border-t md:border-t-0 border-stone-800">
                        <div className="text-left md:text-right">
                          <label className="text-[10px] text-stone-500 block md:hidden font-medium">Line Total</label>
                          <div className="font-mono font-bold text-amber-400 text-sm">
                            ${item.total.toFixed(2)}
                          </div>
                          {item.formulaUsed && (
                            <span className="text-[10px] text-stone-500 font-mono truncate max-w-[140px] block" title={item.formulaUsed}>
                              {item.formulaUsed}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1.5 text-stone-500 hover:text-rose-400 hover:bg-stone-900 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Remove Line Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mathematical Summary & Adjustments */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-stone-800">
                
                {/* Notes & Terms */}
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-stone-300 font-medium mb-1">Workshop Technical Notes</label>
                    <textarea
                      rows={2}
                      value={invoiceNotes}
                      onChange={(e) => setInvoiceNotes(e.target.value)}
                      placeholder="e.g. Line bored to 110.00mm. NDT dye-penetrant test completed on welds."
                      className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-stone-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Totals & Tax Box */}
                <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-2 text-xs">
                  <div className="flex justify-between text-stone-300">
                    <span>Subtotal:</span>
                    <span className="font-mono font-bold">${subtotal.toFixed(2)}</span>
                  </div>

                  {/* Discount input */}
                  <div className="flex justify-between items-center text-stone-300">
                    <span className="flex items-center gap-1">
                      Discount:
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        value={discountRate}
                        onChange={(e) => setDiscountRate(parseFloat(e.target.value) || 0)}
                        className="w-14 bg-stone-900 border border-stone-700 rounded px-1.5 py-0.5 text-right font-mono"
                      />
                      ({(discountRate * 100).toFixed(0)}%)
                    </span>
                    <span className="font-mono text-emerald-400">-${discountAmount.toFixed(2)}</span>
                  </div>

                  {/* VAT / Tax rate input */}
                  <div className="flex justify-between items-center text-stone-300">
                    <span className="flex items-center gap-1">
                      VAT / Tax:
                      <input
                        type="number"
                        min="0"
                        max="0.5"
                        step="0.01"
                        value={taxRate}
                        onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                        className="w-14 bg-stone-900 border border-stone-700 rounded px-1.5 py-0.5 text-right font-mono"
                      />
                      ({(taxRate * 100).toFixed(0)}%)
                    </span>
                    <span className="font-mono">${taxAmount.toFixed(2)}</span>
                  </div>

                  {/* Deposit Paid */}
                  <div className="flex justify-between items-center text-stone-300 pt-1 border-t border-stone-800">
                    <span>Deposit / Paid to Date ($):</span>
                    <input
                      type="number"
                      step="any"
                      value={depositPaid}
                      onChange={(e) => setDepositPaid(parseFloat(e.target.value) || 0)}
                      className="w-24 bg-stone-900 border border-stone-700 rounded px-2 py-1 text-right font-mono text-stone-200"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <label className="text-stone-200">Deposit required ($)<input type="number" min="0" step="0.01" value={depositRequired} onChange={(e) => setDepositRequired(Number(e.target.value) || 0)} className="mt-1 w-full rounded border border-stone-600 bg-stone-900 px-2 py-1.5 text-white"/></label>
                    <label className="text-stone-200">Financing status<select value={financingStatus} onChange={(e) => setFinancingStatus(e.target.value as NonNullable<Invoice['financingStatus']>)} className="mt-1 w-full rounded border border-stone-600 bg-stone-900 px-2 py-1.5 text-white"><option value="not_required">Not required</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="declined">Declined</option></select></label>
                  </div>

                  {/* Grand Total */}
                  <div className="flex justify-between items-center text-stone-100 font-bold text-sm pt-2 border-t border-stone-700">
                    <span>Grand Total:</span>
                    <span className="font-mono text-base">${totalAmount.toFixed(2)}</span>
                  </div>

                  {/* Balance Due Pill */}
                  <div className="flex justify-between items-center bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl text-amber-400 font-bold text-sm">
                    <span>BALANCE DUE:</span>
                    <span className="font-mono text-base">${balanceDue.toFixed(2)}</span>
                  </div>
                </div>

              </div>

              {/* Action Buttons - sticky at bottom for easy thumb access on mobile */}
              <div className="sticky bottom-0 bg-stone-900/95 backdrop-blur-md pt-3 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 border-t border-stone-800 flex justify-end gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={closeCreateInvoiceModal}
                  className="px-4 sm:px-5 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 sm:px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-transform active:scale-95"
                >
                  Save & Generate Invoice
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
