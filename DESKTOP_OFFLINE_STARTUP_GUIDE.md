# LBF Solutions — Full-Stack Offline Desktop Application Guide

**Harare Headquarters**: Carlton Road, Harare, Zimbabwe  
**Contact**: +263 77 900 4626 / 077 900 4626  
**Email**: `lineboringandfabrication@lbfsolutions.co.zw`  
**Application Architecture**: Full-Stack Offline Desktop Engine (Node.js/Express + React/TypeScript + Local Disk Persistence)

---

## 1. Quick Startup Buttons & Scripts (1-Click Launch)

This application is fully packaged for offline desktop usage on workshop PCs, field laptops, and ruggedized tablets without needing an internet connection.

### A. Windows 1-Click Launchers (In Project Root)

| Button / Script File | Purpose | How to Use |
| :--- | :--- | :--- |
| **`LAUNCH_OFFLINE_APP.bat`** | **Master 1-Click Launcher** (Starts full-stack engine and opens dedicated desktop app window) | **Double-click to start.** It clears ports, boots the offline server, and opens the app window automatically. |
| **`START_OFFLINE_SERVER.bat`** | Starts the offline backend server quietly in the background on port `3000` | Double-click if you want to keep the server running on a workshop hub for multiple computers. |
| **`STOP_OFFLINE_APP.bat`** | Safely shuts down any running server instances on port `3000` | Double-click when ending your shift or shutting down the PC. |
| **`setup_workshop_pc.bat`** | Master automated installer for fresh computers with no Node.js or npm installed | Double-click on any brand new PC; it automatically installs Node.js, npm, and all dependencies. |

### B. macOS & Linux Launcher

| Script File | Purpose | How to Use |
| :--- | :--- | :--- |
| **`launch_app.sh`** | 1-Click Unix launcher for terminal or desktop shortcut | Run in terminal: `chmod +x launch_app.sh && ./launch_app.sh` |

---

## 2. 100% Offline Architecture: How It Works

This application operates with a dual-layer offline persistence architecture:

1. **Local Disk Persistence (`./data/offline_storage.json`)**:
   - The embedded Express server continuously writes customer fleets, itemized invoices, balance sheets, and tax records directly to local disk.
   - When restarting the computer, all records are instantly reloaded. Zero data loss.

2. **Client-Side Cache & Local Storage**:
   - The React frontend caches all states, templates, formula calculators, and customer accounts in browser storage (`localStorage` and IndexedDB).
   - If network connectivity is lost in the field or in remote mining districts, you can continue generating invoices, looking up bore specs, and computing heat input calculations without interruption.

3. **Multi-Server & LAN Synchronization**:
   - Use the **Server** pill in the top navigation bar to switch between:
     - **Offline Local**: 100% self-contained on your current laptop.
     - **Workshop LAN Server**: Connects across your local Wi-Fi or Ethernet switch to a shared desktop.
     - **Cloud SaaS Portal**: Connects to the central cloud instance when back at the main office.

---

## 3. Creating a Standalone Windows Desktop `.EXE` File

If you want a standalone single-file `.EXE` installer for operators who prefer not to run batch scripts:

### Method 1: Using Electron Builder
1. Open Command Prompt or PowerShell in this project folder.
2. Build the desktop binary:
   ```cmd
   npm run electron:build
   ```
3. Your compiled installer will be located in the `dist-electron/` folder:
   - `LBF Solutions Setup.exe` (NSIS full installer)
   - `LBF Solutions Portable.exe` (Zero-install portable version)

### Method 2: Creating a Direct Desktop Shortcut to `LAUNCH_OFFLINE_APP.bat`
1. Right-click **`LAUNCH_OFFLINE_APP.bat`** in File Explorer.
2. Select **Send to -> Desktop (create shortcut)**.
3. Right-click the new shortcut on your Desktop -> Select **Properties**.
4. In the **Run** dropdown, select **Minimized** (optional, hides command window).
5. Click **Change Icon** and select an industrial machine icon.
6. Rename the shortcut to **"LBF Solutions Portal"**.

---

## 4. Fresh Workshop Computer Setup (No Pre-Installed Tools)

If you are setting up a brand-new computer that does not have Node.js, npm, or Git installed:

1. Copy this project folder onto a USB flash drive and paste it onto the workshop PC.
2. Double-click **`setup_workshop_pc.bat`**.
3. The script will:
   - Check if Node.js LTS is installed. If missing, it downloads and installs it automatically via Windows Package Manager (`winget`) or silent PowerShell installer.
   - Install all required npm packages.
   - Configure the offline database storage directory.
   - Place a launch icon on the user's Desktop.
4. Once finished, double-click **`LAUNCH_OFFLINE_APP.bat`** to start working.

---

## 5. Sharing the App Across Workshop Computers (LAN Access)

You can run the full-stack server on one main workshop desktop and allow all machinists and technicians to access it from their laptops, tablets, or phones over workshop Wi-Fi:

1. On the main workshop desktop, run **`START_OFFLINE_SERVER.bat`**.
2. Find the IP address of the main computer:
   - Open Command Prompt and type `ipconfig`.
   - Note the **IPv4 Address** (e.g. `192.168.1.50`).
3. On any technician laptop, tablet, or mobile phone on the same Wi-Fi, open the browser and navigate to:
   ```
   http://192.168.1.50:3000
   ```
4. All operators can now collaborate on the same fleet database and live invoices.

---

## 6. Troubleshooting & Diagnostics

- **Port 3000 Conflict**: If another program is using port 3000, run **`STOP_OFFLINE_APP.bat`** or double-click **`LAUNCH_OFFLINE_APP.bat`**, which automatically clears lingering processes.
- **Data Export & Backup**: You can backup all invoices and fleets at any time by clicking **Export Excel** in the Invoices or Fleets tabs, or via the **Backup & Migration** tab in the Server Switch modal.
- **Login Credentials**: Initial operator accounts are pre-configured for instant login (e.g., Lead Machinist, Workshop Manager, or Inspector roles).
