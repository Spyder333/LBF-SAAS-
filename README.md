# LBF Solutions - Heavy Mobile Line Boring & Workshop SaaS Portal

> **"Repair your buckets with us &bull; Lineboring and Fabrication solutions"**  
> *Carlton Road, Harare, Zimbabwe, 17032 &bull; Phone: 077 900 4626 &bull; WhatsApp: +263 77 900 4626*

A full-stack, multi-tenant SaaS application engineered for heavy mobile line boring, bucket repair & rebuilds, Hardox cutting edge replacements, automated tax invoicing, customer fleet management, and 7 core engineering formula calculators. Features 100% isolated offline operation with bi-directional sync queue and multi-server switching.

---

## Key Features

1. **100% Offline Capability**: Complete functionality with zero network or internet connection. All customer accounts, invoices, spreadsheets, and engineering calculators run locally with zero latency.
2. **Multi-Server Switching**: Switch seamlessly between 100% Offline, Local Full-Stack (`/api`), Workshop LAN, and Cloud SaaS without losing data.
3. **Automated Tax Invoicing**: Generates instant compliant invoices tailored to the 7 core LBF services with auto-applied engineering formula items, PDF printing, and Excel `.xlsx` exports.
4. **Machinery Fleet Database**: Tracks excavators, loaders, crushers, and haul trucks per client, with pin bore tolerances, serial numbers, and outstanding balance tracking.
5. **Excel Spreadsheet & Formula Workbook**: Built-in XLSX viewer and editor with live math formula evaluation (`=SUM`, `=AVERAGE`, `=IF`), import/export, and instant line-item push to invoices.
6. **7 Engineering Formula Calculators**: Live calculators for Line Boring RPM/feeds, Mobile Rig Mobilization, Bucket Wear/Hardfacing, Hardox Cutting Edges, CO2 Welding Heat Inputs, Gearbox Overhauls, and New Bucket Fabrication.
7. **Desktop Installable**: Install as a standalone Windows desktop app via 1-click PWA, local runner script (`launch.bat`), or Electron installer (`build_exe.bat`).

---

## Quickstart

### Development & Full-Stack Server
```bash
# Install dependencies
npm install

# Start full-stack server on port 3000 (Express + Vite)
npm run dev
```

### Production Build
```bash
# Build frontend static assets into dist/
npm run build

# Start production server
npm run start
```

---

## Workshop Desktop Installation

For detailed instructions on setting up a workshop computer for 100% offline use with server connection support, see:
👉 [**WORKSHOP_INSTALLATION_MANUAL.md**](./WORKSHOP_INSTALLATION_MANUAL.md)

### Summary of Workshop Desktop Options:
- **1-Click PWA Desktop App**: Click the **"Install Desktop App"** button in the top navigation bar or browser address bar. Installs a standalone desktop app with offline service worker precaching.
- **Local Desktop Launcher**: Double-click `launch.bat` on any Windows PC.
- **Windows Standalone .EXE**: Double-click `build_exe.bat` to package an Electron `.exe` installer.

---

## Backend REST Endpoints

The full-stack server exposes the following REST endpoints on port 3000:

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | System health, uptime, and Harare HQ details |
| `/api/customers` | GET, POST | Retrieve or create/update customer and fleet records |
| `/api/customers/:id` | DELETE | Remove customer record |
| `/api/invoices` | GET, POST | Retrieve or create/update invoices |
| `/api/invoices/:id` | DELETE | Remove invoice |
| `/api/sync` | POST | Batch sync queue items from offline field rigs |
| `/api/formula-calc` | POST | Server-side formula verification |

---

## Contact & Dispatch

- **Harare Headquarters**: Carlton Road, Harare, Zimbabwe, 17032
- **Direct Phone**: 077 900 4626
- **WhatsApp**: +263 77 900 4626
- **Email**: lineboringandfabrication@lbfsolutions.co.zw
