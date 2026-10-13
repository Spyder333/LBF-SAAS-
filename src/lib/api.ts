import { Customer, Invoice, SaaSUser } from '../types';
import { INITIAL_CUSTOMERS, INITIAL_INVOICES } from '../data/mockData';
import { ServerManager } from './serverConfig';

// Local storage persistent keys
const STORAGE_KEYS = {
  CUSTOMERS: 'lbf_customers_v1',
  INVOICES: 'lbf_invoices_v1',
  SPREADSHEETS: 'lbf_spreadsheets_v1',
  CURRENT_USER: 'lbf_active_user_v2',
};

// Resilient Offline Local Store
export const localStore = {
  getCustomers: (): Customer[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('localStore getCustomers error:', e);
    }
    // Initialize default if empty
    localStore.saveCustomers(INITIAL_CUSTOMERS);
    return INITIAL_CUSTOMERS;
  },

  saveCustomers: (customers: Customer[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    } catch (e) {
      console.error('localStore saveCustomers error:', e);
    }
  },

  getInvoices: (): Invoice[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INVOICES);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('localStore getInvoices error:', e);
    }
    // Initialize default if empty
    localStore.saveInvoices(INITIAL_INVOICES);
    return INITIAL_INVOICES;
  },

  saveInvoices: (invoices: Invoice[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
    } catch (e) {
      console.error('localStore saveInvoices error:', e);
    }
  },

  getSavedUser: (): SaaSUser | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('localStore getSavedUser error:', e);
    }
    return null; // Start at login page if no saved authenticated session!
  },

  saveUser: (user: SaaSUser | null) => {
    if (!user) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } else {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    }
  }
};

const overlayPendingRecords = <T extends { id: string }>(records: T[], type: 'customer' | 'invoice'): T[] => {
  const merged = new Map(records.map((record) => [record.id, record]));
  const storageKey = type === 'customer' ? 'lbf_customers_v1' : 'lbf_invoices_v1';
  try {
    const cached = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (Array.isArray(cached)) cached.forEach((record: T) => {
      if (!merged.has(record.id)) merged.set(record.id, record);
    });
  } catch {
    // Ignore invalid snapshots and continue with server records.
  }
  ServerManager.getSyncQueue().filter((item) => item.type === type).forEach((item) => {
    if (item.action === 'delete') merged.delete(item.entityId);
    else if (item.data) merged.set(item.entityId, item.data as T);
  });
  return [...merged.values()];
};

const retryQueuedChangesSoon = () => {
  if (typeof navigator === 'undefined' || !navigator.onLine) return;
  window.setTimeout(() => void api.syncPendingQueue(), 1000);
};

// Unified SaaS & Offline Server Data Access Layer
export const api = {
  async getCollection<T>(endpoint: string, storageKey: string): Promise<T[]> {
    const readLocal = (): T[] => {
      try {
        const raw = localStorage.getItem(storageKey);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    };
    const server = ServerManager.getActiveServer();
    try {
      const url = server.url.endsWith('/') ? `${server.url}${endpoint}` : `${server.url}/${endpoint}`;
      const response = await fetch(url, { headers: { 'X-Tenant-ID': server.tenantId, ...(server.apiKey ? { Authorization: `Bearer ${server.apiKey}` } : {}) } });
      if (response.ok) {
        const records = await response.json();
        if (Array.isArray(records)) {
          const itemTypeByCollection = {
            jobs: 'job', quotes: 'quote', inventory: 'inventory', tasks: 'task', communications: 'communication', spreadsheets: 'spreadsheet'
          } as const;
          const collection = endpoint.split('/').pop() as keyof typeof itemTypeByCollection;
          const itemType = itemTypeByCollection[collection];
          const merged = new Map<string, T>(records.map((record: T) => [(record as { id: string }).id, record]));
          readLocal().forEach((record) => {
            const id = (record as { id?: string }).id;
            if (id && !merged.has(id)) merged.set(id, record);
          });
          if (itemType) {
            ServerManager.getSyncQueue().filter((item) => item.type === itemType).forEach((item) => {
              if (item.action === 'delete') merged.delete(item.entityId);
              else if (item.data) merged.set(item.entityId, item.data as T);
            });
          }
          const result = [...merged.values()];
          localStorage.setItem(storageKey, JSON.stringify(result));
          return result;
        }
      }
    } catch {
      // Continue from the last local snapshot when the server is unavailable.
    }
    return readLocal();
  },

  async getCustomers(): Promise<Customer[]> {
    const server = ServerManager.getActiveServer();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const url = server.url.endsWith('/') ? `${server.url}customers` : `${server.url}/customers`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': server.tenantId,
          ...(server.apiKey ? { Authorization: `Bearer ${server.apiKey}` } : {})
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const merged = overlayPendingRecords<Customer>(data, 'customer');
          localStore.saveCustomers(merged);
          return merged;
        }
      }
    } catch (err) {
      // Remote server unreachable or offline -> seamless fallback to local offline cache
      console.warn(`[LBF Server] Unreachable (${server.name}), operating in offline cached mode.`);
    }

    return localStore.getCustomers();
  },

  async saveCustomer(customer: Customer): Promise<Customer> {
    const server = ServerManager.getActiveServer();

    // Save to local database first (guarantee zero data loss)
    const current = localStore.getCustomers();
    const index = current.findIndex((c) => c.id === customer.id);
    let updated: Customer[];
    if (index >= 0) {
      updated = [...current];
      updated[index] = customer;
    } else {
      updated = [customer, ...current];
    }
    localStore.saveCustomers(updated);

    // Try pushing to remote server
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const url = server.url.endsWith('/') ? `${server.url}customers` : `${server.url}/customers`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': server.tenantId,
          ...(server.apiKey ? { Authorization: `Bearer ${server.apiKey}` } : {})
        },
        body: JSON.stringify(customer),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Server status ${res.status}`);
      }
    } catch (err) {
      // Push failed: record in sync queue for automatic upload upon reconnection
      ServerManager.enqueueSyncItem({
        type: 'customer',
        action: index >= 0 ? 'update' : 'create',
        entityId: customer.id,
        data: customer
      });
    }

    return customer;
  },

  async deleteCustomer(id: string): Promise<boolean> {
    const server = ServerManager.getActiveServer();
    const current = localStore.getCustomers();
    localStore.saveCustomers(current.filter((c) => c.id !== id));

    try {
      const url = server.url.endsWith('/') ? `${server.url}customers/${id}` : `${server.url}/customers/${id}`;
      await fetch(url, {
        method: 'DELETE',
        headers: {
          'X-Tenant-ID': server.tenantId,
          ...(server.apiKey ? { Authorization: `Bearer ${server.apiKey}` } : {})
        }
      });
    } catch {
      ServerManager.enqueueSyncItem({
        type: 'customer',
        action: 'delete',
        entityId: id
      });
    }

    return true;
  },

  async getInvoices(): Promise<Invoice[]> {
    const server = ServerManager.getActiveServer();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const url = server.url.endsWith('/') ? `${server.url}invoices` : `${server.url}/invoices`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': server.tenantId,
          ...(server.apiKey ? { Authorization: `Bearer ${server.apiKey}` } : {})
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const merged = overlayPendingRecords<Invoice>(data, 'invoice');
          localStore.saveInvoices(merged);
          return merged;
        }
      }
    } catch (err) {
      console.warn(`[LBF Server] Invoices unreachable (${server.name}), operating in offline cached mode.`);
    }

    return localStore.getInvoices();
  },

  async saveInvoice(invoice: Invoice): Promise<Invoice> {
    const server = ServerManager.getActiveServer();

    // 1. Update local database immediately
    const current = localStore.getInvoices();
    const index = current.findIndex((inv) => inv.id === invoice.id);
    let updated: Invoice[];
    if (index >= 0) {
      updated = [...current];
      updated[index] = invoice;
    } else {
      updated = [invoice, ...current];
    }
    localStore.saveInvoices(updated);

    // 2. Also update Customer balance
    const customers = localStore.getCustomers();
    const custIndex = customers.findIndex((c) => c.id === invoice.customerId);
    if (custIndex >= 0) {
      const custInvoices = updated.filter((inv) => inv.customerId === invoice.customerId);
      const totalDue = custInvoices.reduce((sum, i) => sum + (i.balanceDue || 0), 0);
      customers[custIndex].balanceDue = totalDue;
      localStore.saveCustomers(customers);
    }

    // 3. Remote server push
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const url = server.url.endsWith('/') ? `${server.url}invoices` : `${server.url}/invoices`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': server.tenantId,
          ...(server.apiKey ? { Authorization: `Bearer ${server.apiKey}` } : {})
        },
        body: JSON.stringify(invoice),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`Server status ${res.status}`);
    } catch {
      ServerManager.enqueueSyncItem({
        type: 'invoice',
        action: index >= 0 ? 'update' : 'create',
        entityId: invoice.id,
        data: invoice
      });
    }

    return invoice;
  },

  async deleteInvoice(id: string): Promise<boolean> {
    const server = ServerManager.getActiveServer();
    const current = localStore.getInvoices();
    localStore.saveInvoices(current.filter((inv) => inv.id !== id));

    try {
      const url = server.url.endsWith('/') ? `${server.url}invoices/${id}` : `${server.url}/invoices/${id}`;
      await fetch(url, {
        method: 'DELETE',
        headers: {
          'X-Tenant-ID': server.tenantId,
          ...(server.apiKey ? { Authorization: `Bearer ${server.apiKey}` } : {})
        }
      });
    } catch {
      ServerManager.enqueueSyncItem({
        type: 'invoice',
        action: 'delete',
        entityId: id
      });
    }

    return true;
  },

  // Push all pending sync queue changes to the currently active server
  async syncPendingQueue(): Promise<{ syncedCount: number; errors: number }> {
    const queue = ServerManager.getSyncQueue();
    const server = ServerManager.getActiveServer();

    if (queue.length === 0) {
      return { syncedCount: 0, errors: 0 };
    }

    let syncedCount = 0;
    let errors = 0;
    const syncedIds: string[] = [];

    for (const item of queue) {
      try {
        const endpointByType = {
          customer: 'customers', invoice: 'invoices', spreadsheet: 'operations/spreadsheets',
          job: 'operations/jobs', quote: 'operations/quotes', inventory: 'operations/inventory',
          task: 'operations/tasks', communication: 'operations/communications'
        } as const;
        const endpoint = endpointByType[item.type];
        const url = server.url.endsWith('/') ? `${server.url}${endpoint}` : `${server.url}/${endpoint}`;

        if (item.action === 'delete') {
          const response = await fetch(`${url}/${item.entityId}`, {
            method: 'DELETE',
            headers: {
              'X-Tenant-ID': server.tenantId,
              ...(server.apiKey ? { Authorization: `Bearer ${server.apiKey}` } : {})
            }
          });
          if (!response.ok) throw new Error(`Server status ${response.status}`);
        } else {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Tenant-ID': server.tenantId,
              ...(server.apiKey ? { Authorization: `Bearer ${server.apiKey}` } : {})
            },
            body: JSON.stringify(item.data)
          });
          if (!response.ok) throw new Error(`Server status ${response.status}`);
        }
        syncedCount++;
        syncedIds.push(item.id);
      } catch (e) {
        errors++;
      }
    }

    ServerManager.removeSyncItems(syncedIds);

    return { syncedCount, errors };
  }
};
