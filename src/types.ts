export type ServiceCategory =
  | 'line_boring_fabrication'
  | 'onsite_lineboring'
  | 'bucket_repair'
  | 'cutting_edge_replacement'
  | 'co2_welding'
  | 'industrial_gearboxes'
  | 'new_bucket_fabrication';

export interface ServiceDetail {
  id: ServiceCategory;
  name: string;
  shortDesc: string;
  fullDesc: string;
  icon: string;
  standardRateUnit: string;
  defaultRate: number;
  typicalTurnaround: string;
  formulaTemplate: string;
  specifications: string[];
}

export interface Equipment {
  id: string;
  make: string; // e.g. CAT, Komatsu, Hitachi, Volvo
  model: string; // e.g. 349D, WA600, ZX870
  type: string; // Excavator, Wheel Loader, Bulldozer, Haul Truck
  serialNumber?: string;
  pinBoreSpecs?: string;
  serviceHistory?: string[];
  previousRepairs?: string[];
  recurringIssues?: string;
  notes?: string;
  maintenanceSchedule?: string;
  createdBy?: string;
}

export interface Customer {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  taxNumber?: string;
  equipmentFleet: Equipment[];
  notes?: string;
  createdAt: string;
  balanceDue: number;
  accountStatus?: 'active' | 'on_hold' | 'credit_review';
  paymentTerms?: string;
  followUpReminder?: string;
  contactNotes?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface InvoiceItem {
  id: string;
  serviceCategory: ServiceCategory | 'parts_materials' | 'consumables' | 'travel_mobilization';
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  formulaUsed?: string;
  total: number;
}

export type InvoiceStatus = 'draft' | 'pending' | 'in_progress' | 'completed' | 'paid' | 'overdue';

export type JobPriority = 'low' | 'normal' | 'urgent';
export type JobStatus = 'new' | 'quoted' | 'approved' | 'in_progress' | 'completed' | 'invoiced' | 'paid';

export interface WorkshopJob {
  id: string;
  title: string;
  customerName: string;
  equipmentName: string;
  serviceType: string;
  priority: JobPriority;
  status: JobStatus;
  assignedTo: string;
  dueDate: string;
  createdAt: string;
  totalCost: number;
  notes: string;
  revenue?: number;
  laborCost?: number;
  materialsCost?: number;
  travelCost?: number;
  materialList?: string[];
  laborList?: string[];
  createdBy?: string;
  updatedBy?: string;
  siteDetails?: string;
  siteNotes?: string;
  completionNotes?: string;
  checklist?: { id: string; label: string; completed: boolean }[];
  photos?: { id: string; name: string; dataUrl: string; createdAt: string; createdBy: string; phase?: 'before' | 'after' | 'site' }[];
  statusHistory?: { status: JobStatus; changedAt: string; changedBy: string }[];
}

export interface QuoteLineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  total: number;
  kind?: 'service' | 'labor' | 'material';
}

export interface Quote {
  id: string;
  quoteNumber: string;
  customerName: string;
  customerEmail: string;
  equipmentName: string;
  status: 'draft' | 'sent' | 'approved' | 'converted';
  createdAt: string;
  dueDate: string;
  lineItems: QuoteLineItem[];
  subtotal: number;
  taxRate: number;
  total: number;
  approvedAt?: string;
  createdBy?: string;
  history?: { status: Quote['status']; changedAt: string; changedBy: string }[];
}

export interface Invoice {
  id: string;
  jobId?: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerAddress: string;
  customerTaxNumber?: string;
  serviceCategory: ServiceCategory;
  date: string;
  dueDate: string;
  equipmentInfo?: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number; // e.g., 0.15 for 15%
  taxAmount: number;
  discountRate: number; // e.g. 0.05
  discountAmount: number;
  total: number;
  depositPaid: number;
  balanceDue: number;
  status: InvoiceStatus;
  notes?: string;
  terms?: string;
  createdAt: string;
  paymentTerms?: string;
  depositRequired?: number;
  financingStatus?: 'not_required' | 'pending' | 'approved' | 'declined';
  paymentHistory?: { id: string; amount: number; paidAt: string; method: string; recordedBy: string }[];
  createdBy?: string;
}

export interface StockItem {
  id: string;
  name: string;
  quantity: number;
  supplier: string;
  unitCost: number;
  assignedJobId?: string;
  usedQuantity?: number;
  reorderLevel: number;
  updatedAt: string;
  updatedBy: string;
}

export interface FollowUpTask {
  id: string;
  customerName: string;
  title: string;
  dueDate: string;
  completed: boolean;
  createdAt: string;
  createdBy: string;
}

export interface CommunicationEntry {
  id: string;
  customerName: string;
  channel: 'email' | 'whatsapp' | 'call' | 'note';
  subject: string;
  createdAt: string;
  createdBy: string;
}

export interface SpreadsheetCell {
  value: string | number;
  formula?: string;
  displayValue?: string | number;
  format?: 'text' | 'currency' | 'number' | 'percent';
}

export type SpreadsheetGrid = Record<string, SpreadsheetCell>; // key: "A1", "B2", etc.

export interface SpreadsheetSheet {
  id: string;
  title: string;
  grid: SpreadsheetGrid;
  rowCount: number;
  colCount: number;
  lastModified: string;
}

export type ServerMode = 'cloud' | 'custom' | 'lan';

export interface ServerConfig {
  id: string;
  name: string;
  mode: ServerMode;
  url: string;
  apiKey?: string;
  tenantId: string;
  tenantName: string;
  isDefault?: boolean;
}

export interface SyncQueueItem {
  id: string;
  type: 'customer' | 'invoice' | 'spreadsheet' | 'job' | 'quote' | 'inventory' | 'task' | 'communication';
  action: 'create' | 'update' | 'delete';
  entityId: string;
  data?: any;
  timestamp: string;
}

export interface SyncStatus {
  isOnline: boolean;
  serverStatus: 'connected' | 'offline' | 'error' | 'syncing';
  lastSyncTime: string | null;
  pendingSyncCount: number;
  latencyMs: number | null;
}

export interface SaaSUser {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  tenantName: string;
  avatarUrl?: string;
}
