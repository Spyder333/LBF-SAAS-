# LBF SOLUTIONS &bull; WORKSHOP DESKTOP INSTALLATION & OFFLINE-SERVER MANUAL
**Heavy Equipment Line Boring, Machining, Fabrication & Automated Invoicing System**  
*Harare Headquarters: Carlton Road, Harare, Zimbabwe, 17032 &bull; Direct: 077 900 4626 &bull; WhatsApp: +263 77 900 4626*

---

## ⚡ Quick Fix: Resolving the Windows `@rollup/rollup-win32-x64-msvc` Error

If you encountered this error while compiling the Windows installer:
```text
Error: Cannot find module @rollup/rollup-win32-x64-msvc
[cause]: Error: ...\rollup.win32-x64-msvc.node is not a valid Win32 application. (code: 'ERR_DLOPEN_FAILED')
Node.js v24.14.0
```

### Why this happens:
This is caused by npm issue [#4828](https://github.com/npm/cli/issues/4828), which occurs on Windows when npm unpacks optional native C++ binaries (`.node` files), especially on newer Node.js releases (such as Node.js v24). npm sometimes writes a corrupted or 0-byte binary file, causing Windows `LoadLibraryEx` to reject it with `ERR_DLOPEN_FAILED`.

### 1-Click Solution (Automated):
1. In your project folder, double-click the newly added script:
   ```text
   fix_windows_build.bat
   ```
2. This script automatically:
   - Removes any corrupted native Rollup binaries.
   - Force-installs the clean 64-bit Windows binary (`@rollup/rollup-win32-x64-msvc`).
   - Adds the `@rollup/wasm-node` fallback if needed.
   - Verifies the compilation and asks if you want to generate the `.exe` right away!

### Manual Command-Line Solution (in CMD or PowerShell):
Open Command Prompt in your project folder (`C:\Users\Lenovo\Downloads\...\lbf portal`) and run:
```cmd
npm install --force @rollup/rollup-win32-x64-msvc
npm run electron:build
```
*If you still get an error on Node 24, run:*
```cmd
npm install -D @rollup/wasm-node
npm run electron:build
```

---

## 1. System Architecture: Offline & Server Synchronization

LBF Solutions is built as an **Industrial Dual-Mode SaaS Application** specifically engineered for workshop computers, mobile field rigs, and mining locations:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       LBF HYBRID ARCHITECTURE OVERVIEW                          │
├─────────────────────────────────────────┬───────────────────────────────────────┤
│             100% OFFLINE ENGINE         │             CONNECTED SERVER ENGINE   │
├─────────────────────────────────────────┼───────────────────────────────────────┤
│ • Zero internet or cellular needed      │ • Workshop Local LAN (e.g. 192.168.x) │
│ • Local persistent IndexedDB/Storage    │ • Live Full-Stack Express API (/api)  │
│ • Full invoicing, formulas, spreadsheets│ • Cloud Multi-Tenant SaaS Cluster     │
│ • Local PDF generation & Excel import   │ • Instant multi-operator sync         │
│ • Automated offline mutation queue      │ • Centralized backup and reporting    │
└─────────────────────────────────────────┴───────────────────────────────────────┘
```

---

## 2. Choosing Your Desktop Installation Method

You have four deployment options for your workshop desktop:

| Feature | Method 0: Master Auto-Installer (`setup_workshop_pc.bat`) | Method 1: 1-Click Offline App Launcher (`LAUNCH_OFFLINE_APP.bat`) | Method 2: Standalone .EXE Package (`npm run electron:build`) | Method 3: Background Server (`START_OFFLINE_SERVER.bat`) |
| :--- | :--- | :--- | :--- | :--- |
| **Best For** | **Fresh Workshop PC with NO Node.js/NPM** | **Daily 1-Click Launch on Workshop PC** | USB distribution & install wizard | Workshop host for tablet LAN access |
| **Setup Time** | **1-Click (Automated)** | **Instant (1 Click)** | 2 Minutes | 10 Seconds |
| **Node.js Auto-Installed?** | ✅ **Yes (Auto-installs Node.js & npm)** | ✅ Verifies & auto-repairs | ❌ Pre-installed | ✅ Yes |
| **Generates .EXE Installer?** | ✅ **Yes (`dist-electron/`)** | ❌ Launches standalone window | ✅ Yes (`.exe`) | ❌ Headless |
| **Desktop Shortcut Created?**| ✅ **Yes (Auto-created on Desktop)** | ✅ Can Pin to Taskbar/Desktop | ✅ Yes | ❌ Manual |
| **Offline Support** | ✅ 100% Offline | ✅ 100% Offline (Dual-Layer Cache) | ✅ 100% Offline | ✅ 100% Offline |

---

### METHOD 0: Master Automated Workshop Installer (`setup_workshop_pc.bat`)
**The absolute easiest way to set up a brand new workshop computer:**

1. Copy the downloaded project folder to your workshop desktop.
2. Double-click:
   ```text
   setup_workshop_pc.bat
   ```
   *(or `INSTALL_LBF_SETUP.bat`)*
3. The script executes the entire 5-step pipeline automatically:
   - **Detects Node.js & npm**: If missing, silently installs Node.js LTS via Windows Package Manager.
   - **Installs npm dependencies**: Installs all libraries and native Windows Rollup binaries.
   - **Pre-compiles assets**: Generates high-speed production assets with Vite.
   - **Generates Windows `.EXE` setup file**: Builds `dist-electron\LBF Solutions Setup.exe`.
   - **Creates Desktop Shortcut**: Automatically places a `"LBF Solutions Machining Portal"` shortcut on your Windows desktop.
   - **Offers immediate launch**: Press `Y` to open the application immediately!

---

### METHOD 1: 1-Click Offline App Launcher (`LAUNCH_OFFLINE_APP.bat`)
**Recommended for Daily Workshop Operation:**

1. In the project folder, double-click **`LAUNCH_OFFLINE_APP.bat`**.
2. It automatically:
   - Clears any previous port conflicts on port `3000`.
   - Boots the full-stack Node/Express offline engine with local disk storage (`./data/offline_storage.json`).
   - Automatically opens a clean, standalone desktop window without browser clutter.
3. When your shift ends, close the window or double-click **`STOP_OFFLINE_APP.bat`**.

---

### METHOD 1: 1-Click Desktop PWA (Recommended for Fast Daily Use)

The Progressive Web App (PWA) delivers native desktop performance with zero build complexity:

1. **Open the App in Chrome or Edge**:
   - Navigate to `http://localhost:3000` (or your deployed server URL).
2. **Install to Desktop**:
   - Click the **"Install Desktop App"** button in the top navigation bar, OR
   - Click the **App Install icon** in the browser URL bar (monitor with down arrow).
3. **Click "Install"**:
   - An **LBF Solutions** icon is automatically created on your Windows Desktop and Start Menu.
   - The application runs in its own window without browser address bars or navigation buttons.
4. **Test Offline**:
   - Disconnect your PC from the internet / Ethernet.
   - Launch the desktop icon: the app opens instantly in offline mode with full access to customer fleets, automated invoicing, formulas, and spreadsheets.

---

### METHOD 2: Windows Standalone `.exe` Installer (Electron)

To produce a native Windows `.exe` installer that you can copy to any workshop machine via USB flash drive:

1. Ensure Node.js is installed on your development/building PC.
2. Double-click `build_exe.bat` (or `fix_windows_build.bat`).
3. The automated builder will:
   - Compile the frontend assets into `dist/`.
   - Package the standalone Windows app using Electron Builder.
   - Save the installer into:
     ```text
     dist-electron\LBF Solutions Setup.exe
     ```
4. Copy `LBF Solutions Setup.exe` to your workshop desktop and run it to install.

---

### METHOD 3: Workshop LAN Server (`launch.bat`)

If you want the workshop desktop to act as both a workstation and a local network server for phones/tablets in the machine shop:

1. Copy the project folder to the workshop computer (e.g., `C:\LBF_Solutions`).
2. Double-click `launch.bat`.
3. The script will:
   - Check Node.js and dependencies.
   - Start the local full-stack server on `port 3000`.
   - Launch Microsoft Edge or Google Chrome in standalone application mode (`--app=http://localhost:3000`).
4. Other workshop computers, laptops, and tablets on the same Wi-Fi can connect directly via:
   ```text
   http://<WORKSHOP_PC_IP>:3000
   ```
   *(To find your IP, open CMD and type `ipconfig`, e.g., `192.168.1.50`).*

---

## 3. How to Use Offline Mode and Connect to a Server

LBF Solutions includes an interactive **Server & Offline Engine Switcher** accessible from both the top navigation bar and the login screen.

### Step 1: Open the Server Manager
Click the **Server Indicator** badge in the header:
- If offline, it displays: `[●] Mode: 100% OFFLINE LOCAL ENGINE`
- If connected, it displays: `[●] Mode: LIVE FULL-STACK API` or `[●] Mode: CLOUD SAAS`

### Step 2: Select Your Desired Environment
The switcher provides 4 built-in presets:

1. **100% Offline Field Engine (Local Storage)**:
   - Cuts off external network requests.
   - Stores all data in the PC's local persistent database.
   - Use this when working in deep mining sites, mobile repair trucks, or during power/internet outages.

2. **LBF Full-Stack API Engine (Live Deployment)**:
   - Connects to `/api` on the local machine or hosted server.
   - Automatically synchronizes invoices, customers, and spreadsheets across users.

3. **Carlton Rd Workshop Internal LAN**:
   - Connects to your local workshop server: `http://192.168.1.120:3000/api`.
   - Lets all machinists in the bay share the same database without needing internet access.

4. **LBF Cloud SaaS (Harare Cluster)**:
   - Connects to cloud infrastructure for multi-branch headquarters sync.

5. **Custom Self-Hosted Server**:
   - Type any IP address (e.g., `http://192.168.1.88:3000/api`).
   - Click **"Test Connection"** to verify server health and ping latency.
   - Click **"Activate This Server"** to switch instantly without losing unsaved changes.

---

## 4. Offline Sync Queue Workflow

When you work offline, your operations are never lost:

1. **Offline Work**:
   - Create new invoices, add customer fleet machines, or edit spreadsheets.
   - Each operation is immediately saved locally and added to the **Sync Queue**.
2. **Reconnecting**:
   - When you return to the workshop or connect to Wi-Fi/LAN, open the **Server Switcher**.
   - Select your workshop server or cloud server.
3. **Pushed to Server**:
   - Click the **"Sync Queue"** tab in the modal to review pending items.
   - Click **"Sync All Pending Changes"**.
   - All pending records are uploaded to the central database with zero data collision.

---

## 5. Database Backup & Disaster Recovery

Workshop PCs can experience power fluctuations or hardware failures. LBF Solutions includes a built-in backup and restore utility:

1. Open the **Server Switcher** modal.
2. Click the **"Backup & Migration"** tab.
3. **To Back Up**:
   - Click **"Export Full Database (JSON)"**.
   - A single file containing all customers, equipment specs, invoices, and formula settings will download.
   - Save this file to a USB flash drive or workshop network drive.
4. **To Restore**:
   - Click **"Select JSON Backup File to Restore"**.
   - Pick your backup file: the system restores all records in under 2 seconds.

---

## 6. Harare Headquarters Support

For operational support, field machining dispatch, or custom fabrication orders:
- **Headquarters**: Carlton Road, Harare, Zimbabwe, 17032
- **Direct Telephone**: 077 900 4626
- **WhatsApp**: +263 77 900 4626
- **Email**: lineboringandfabrication@lbfsolutions.co.zw
- **Motto**: *"Repair your buckets with us &bull; Lineboring and Fabrication solutions"*
