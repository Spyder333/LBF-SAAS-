import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { INITIAL_CUSTOMERS, INITIAL_INVOICES } from './src/data/mockData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Permissive CORS & security headers for LAN & multi-server field clients
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Tenant-ID');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// In-Memory Database Seed for Full-Stack Server
let customersDb = [...INITIAL_CUSTOMERS];
let invoicesDb = [...INITIAL_INVOICES];
let jobsDb: Array<{ id: string }> = [];
let quotesDb: Array<{ id: string }> = [];
let inventoryDb: Array<{ id: string }> = [];
let tasksDb: Array<{ id: string }> = [];
let communicationsDb: Array<{ id: string }> = [];
let spreadsheetsDb: Array<{ id: string }> = [];

// Local Disk Persistence for Full-Stack Offline Desktop Operation
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'offline_storage.json');

function loadPersistedData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.customers) && parsed.customers.length > 0) {
        customersDb = parsed.customers;
      }
      if (Array.isArray(parsed.invoices) && parsed.invoices.length > 0) {
        invoicesDb = parsed.invoices;
      }
      if (Array.isArray(parsed.jobs)) jobsDb = parsed.jobs;
      if (Array.isArray(parsed.quotes)) quotesDb = parsed.quotes;
      if (Array.isArray(parsed.inventory)) inventoryDb = parsed.inventory;
      if (Array.isArray(parsed.tasks)) tasksDb = parsed.tasks;
      if (Array.isArray(parsed.communications)) communicationsDb = parsed.communications;
      if (Array.isArray(parsed.spreadsheets)) spreadsheetsDb = parsed.spreadsheets;
      console.log(`[Offline Storage] Loaded ${customersDb.length} customers and ${invoicesDb.length} invoices from disk.`);
    }
  } catch (err) {
    console.warn('[Offline Storage] Could not read offline_storage.json, falling back to initial data:', err);
  }
}

function savePersistedData() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify({
      customers: customersDb, invoices: invoicesDb, jobs: jobsDb, quotes: quotesDb,
      inventory: inventoryDb, tasks: tasksDb, communications: communicationsDb, spreadsheets: spreadsheetsDb
    }, null, 2), 'utf8');
  } catch (err) {
    console.error('[Offline Storage] Failed to save offline_storage.json:', err);
  }
}

// Load persisted data on server startup
loadPersistedData();

// =========================================================================
// REST API ENDPOINTS
// =========================================================================

// 1. Health Check & Server Identity
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    server: 'LBF Solutions Full-Stack Cloud & Workshop SaaS Engine',
    location: 'Carlton Road, Harare, Zimbabwe, 17032',
    phone: '077 900 4626',
    whatsapp: '+263 77 900 4626',
    email: 'lineboringandfabrication@lbfsolutions.co.zw',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: isProduction ? 'production' : 'development',
    version: '2.4.0-fullstack',
    activeTenants: 3
  });
});

// 2. Customers Endpoints
app.get('/api/customers', (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  // If tenant filter provided, could filter, otherwise return all
  res.json(customersDb);
});

app.post('/api/customers', (req: Request, res: Response) => {
  const customer = req.body;
  if (!customer || !customer.id || !customer.companyName) {
    res.status(400).json({ error: 'Invalid customer data: id and companyName required' });
    return;
  }

  const existingIdx = customersDb.findIndex((c) => c.id === customer.id);
  if (existingIdx >= 0) {
    customersDb[existingIdx] = {
      ...customersDb[existingIdx],
      ...customer,
      updatedAt: new Date().toISOString()
    };
    res.json(customersDb[existingIdx]);
  } else {
    const newCustomer = {
      ...customer,
      createdAt: customer.createdAt || new Date().toISOString()
    };
    customersDb.unshift(newCustomer);
    savePersistedData();
    res.status(201).json(newCustomer);
  }
});

app.delete('/api/customers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const initialLen = customersDb.length;
  customersDb = customersDb.filter((c) => c.id !== id);
  if (customersDb.length < initialLen) {
    savePersistedData();
    res.json({ success: true, deletedId: id });
  } else {
    res.status(404).json({ error: 'Customer not found' });
  }
});

// 3. Invoices Endpoints
app.get('/api/invoices', (req: Request, res: Response) => {
  res.json(invoicesDb);
});

app.post('/api/invoices', (req: Request, res: Response) => {
  const invoice = req.body;
  if (!invoice || !invoice.id || !invoice.invoiceNumber) {
    res.status(400).json({ error: 'Invalid invoice data: id and invoiceNumber required' });
    return;
  }

  const existingIdx = invoicesDb.findIndex((inv) => inv.id === invoice.id);
  if (existingIdx >= 0) {
    invoicesDb[existingIdx] = {
      ...invoicesDb[existingIdx],
      ...invoice,
      updatedAt: new Date().toISOString()
    };
    savePersistedData();
    res.json(invoicesDb[existingIdx]);
  } else {
    const newInvoice = {
      ...invoice,
      createdAt: invoice.createdAt || new Date().toISOString()
    };
    invoicesDb.unshift(newInvoice);

    // Update customer outstanding balance
    if (newInvoice.customerId) {
      const custIdx = customersDb.findIndex((c) => c.id === newInvoice.customerId);
      if (custIdx >= 0) {
        const custInvoices = invoicesDb.filter((i) => i.customerId === newInvoice.customerId);
        customersDb[custIdx].balanceDue = custInvoices.reduce((acc, curr) => acc + (curr.balanceDue || 0), 0);
      }
    }
    savePersistedData();
    res.status(201).json(newInvoice);
  }
});

app.delete('/api/invoices/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const initialLen = invoicesDb.length;
  invoicesDb = invoicesDb.filter((inv) => inv.id !== id);
  if (invoicesDb.length < initialLen) {
    savePersistedData();
    res.json({ success: true, deletedId: id });
  } else {
    res.status(404).json({ error: 'Invoice not found' });
  }
});

const getOperationalCollections = () => ({
  jobs: jobsDb,
  quotes: quotesDb,
  inventory: inventoryDb,
  tasks: tasksDb,
  communications: communicationsDb,
  spreadsheets: spreadsheetsDb
});

app.get('/api/operations/:collection', (req: Request, res: Response) => {
  const collection = getOperationalCollections()[req.params.collection as keyof ReturnType<typeof getOperationalCollections>];
  if (!collection) {
    res.status(404).json({ error: 'Collection not found' });
    return;
  }
  res.json(collection);
});

app.post('/api/operations/:collection', (req: Request, res: Response) => {
  const collection = getOperationalCollections()[req.params.collection as keyof ReturnType<typeof getOperationalCollections>];
  const record = req.body;
  if (!collection) {
    res.status(404).json({ error: 'Collection not found' });
    return;
  }
  if (!record || typeof record.id !== 'string') {
    res.status(400).json({ error: 'Record id is required' });
    return;
  }
  const index = collection.findIndex((item) => item.id === record.id);
  if (index >= 0) collection[index] = record;
  else collection.unshift(record);
  savePersistedData();
  res.status(index >= 0 ? 200 : 201).json(record);
});

app.delete('/api/operations/:collection/:id', (req: Request, res: Response) => {
  const collection = getOperationalCollections()[req.params.collection as keyof ReturnType<typeof getOperationalCollections>];
  if (!collection) {
    res.status(404).json({ error: 'Collection not found' });
    return;
  }
  const index = collection.findIndex((item) => item.id === req.params.id);
  if (index < 0) {
    res.status(404).json({ error: 'Record not found' });
    return;
  }
  collection.splice(index, 1);
  savePersistedData();
  res.json({ success: true, deletedId: req.params.id });
});

// 4. Offline Batch Sync Queue Endpoint
app.post('/api/sync', (req: Request, res: Response) => {
  const { items } = req.body;
  if (!Array.isArray(items)) {
    res.status(400).json({ error: 'Expected items array for synchronization' });
    return;
  }

  let processedCount = 0;
  for (const item of items) {
    if (item.type === 'customer') {
      if (item.action === 'delete') {
        customersDb = customersDb.filter((c) => c.id !== item.entityId);
      } else if (item.data) {
        const idx = customersDb.findIndex((c) => c.id === item.data.id);
        if (idx >= 0) customersDb[idx] = item.data;
        else customersDb.unshift(item.data);
      }
      processedCount++;
    } else if (item.type === 'invoice') {
      if (item.action === 'delete') {
        invoicesDb = invoicesDb.filter((inv) => inv.id !== item.entityId);
      } else if (item.data) {
        const idx = invoicesDb.findIndex((inv) => inv.id === item.data.id);
        if (idx >= 0) invoicesDb[idx] = item.data;
        else invoicesDb.unshift(item.data);
      }
      processedCount++;
    }
  }

  if (processedCount > 0) {
    savePersistedData();
  }

  res.json({
    success: true,
    processedCount,
    serverTimestamp: new Date().toISOString()
  });
});

// 5. Server-Side Formula Verification Endpoint
app.post('/api/formula-calc', (req: Request, res: Response) => {
  const { formulaType, params } = req.body;
  
  if (formulaType === 'line_boring') {
    const { boreDiameter = 110, boreLength = 180, numBores = 2, surfaceSpeed = 45, feedPerRev = 0.15, hourlyRate = 120 } = params;
    const rpm = Math.round((surfaceSpeed * 1000) / (Math.PI * boreDiameter));
    const feedSpeed = Math.round(rpm * feedPerRev * 10) / 10;
    const timePerPassMin = feedSpeed > 0 ? Math.round((boreLength / feedSpeed) * 10) / 10 : 0;
    const machiningHours = Math.round(((timePerPassMin * 3 * numBores + 60) / 60) * 10) / 10;
    const totalCost = Math.round(machiningHours * hourlyRate * 100) / 100;
    res.json({ rpm, feedSpeed, machiningHours, totalCost });
    return;
  }

  if (formulaType === 'co2_welding') {
    const { amps = 280, volts = 29, travelSpeed = 250, arcEfficiency = 0.85 } = params;
    const heatInputKjMm = travelSpeed > 0 ? Math.round(((volts * amps * 60) / (travelSpeed * 1000)) * arcEfficiency * 100) / 100 : 0;
    res.json({ heatInputKjMm });
    return;
  }

  res.json({ message: 'Calculation completed', params });
});

// =========================================================================
// DEV VS PROD INTEGRATION
// =========================================================================

async function startServer() {
  if (!isProduction) {
    // Development mode: Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Fallback for HTML entry point
    app.use('*', async (req: Request, res: Response, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) {
        return next();
      }
      try {
        const indexPath = path.resolve(__dirname, 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace?.(e as Error);
        next(e);
      }
    });

    console.log('[Server] Vite middleware mounted for development.');
  } else {
    // Production mode: Serve built static files
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
      console.log(`[Server] Serving production build from ${distPath}`);
    } else {
      console.warn(`[Server] Warning: 'dist' folder not found. Run 'npm run build' before production start.`);
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`  LBF SOLUTIONS FULL-STACK SERVER RUNNING`);
    console.log(`  URL: http://localhost:${PORT}`);
    console.log(`  Mode: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
    console.log(`  API: http://localhost:${PORT}/api/health`);
    console.log(`=======================================================`);
  });
}

startServer().catch((err) => {
  console.error('[Server Error] Failed to start server:', err);
  process.exit(1);
});
