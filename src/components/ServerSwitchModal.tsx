import React, { useState, useEffect } from 'react';
import {
  Server,
  X,
  Wifi,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2,
  Download,
  Upload,
  Radio,
  Sliders,
  LogOut,
  Building2,
  Key,
  Shield,
  Layers
} from 'lucide-react';
import { SaaSUser, ServerConfig, SyncQueueItem } from '../types';
import { ServerManager } from '../lib/serverConfig';
import { api } from '../lib/api';
import { useTheme } from '../context/ThemeContext';

interface ServerSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: SaaSUser | null;
  onSignOut: () => void;
  onUpdateUser?: (user: SaaSUser | null) => void;
}

export const ServerSwitchModal: React.FC<ServerSwitchModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSignOut,
  onUpdateUser
}) => {
  const { isLight } = useTheme();
  const [activeTab, setActiveTab] = useState<'servers' | 'sync' | 'backup' | 'profile'>('servers');
  const [servers, setServers] = useState<ServerConfig[]>(ServerManager.getAllServers());
  const [activeServer, setActiveServer] = useState<ServerConfig>(ServerManager.getActiveServer());
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>(ServerManager.getSyncQueue());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latencyMs: number; message: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  // Form for new server
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newMode, setNewMode] = useState<'cloud' | 'custom' | 'lan'>('custom');
  const [newApiKey, setNewApiKey] = useState('');
  const [newTenantId, setNewTenantId] = useState(currentUser?.tenantId || 'tenant_default');
  const [newTenantName, setNewTenantName] = useState(currentUser?.tenantName || 'Workshop Operations');

  // Backup state
  const [backupMsg, setBackupMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const unsub = ServerManager.subscribe(() => {
      setServers(ServerManager.getAllServers());
      setActiveServer(ServerManager.getActiveServer());
      setSyncQueue(ServerManager.getSyncQueue());
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handleSelectServer = (server: ServerConfig) => {
    ServerManager.setActiveServer(server);
    setActiveServer(server);
    setTestResult(null);
  };

  const handleTestConnection = async (server: ServerConfig) => {
    setIsTesting(true);
    setTestResult(null);
    const res = await ServerManager.testConnection(server);
    setTestResult(res);
    setIsTesting(false);
  };

  const handleCreateServer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUrl.trim()) return;

    const server: ServerConfig = {
      id: 'srv_' + Date.now(),
      name: newName.trim(),
      url: newUrl.trim(),
      mode: newMode,
      apiKey: newApiKey.trim() || undefined,
      tenantId: newTenantId.trim(),
      tenantName: newTenantName.trim()
    };

    ServerManager.upsertServer(server);
    ServerManager.setActiveServer(server);
    setIsAddingNew(false);
    setNewName('');
    setNewUrl('');
    setNewApiKey('');
  };

  const handleDeleteServer = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    ServerManager.deleteServer(id);
    setBackupMsg({ type: 'success', text: 'Server endpoint removed from configuration.' });
    setTimeout(() => setBackupMsg(null), 3500);
  };

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    const result = await api.syncPendingQueue();
    if (result.errors === 0) {
      setSyncResult(`Successfully synchronized ${result.syncedCount} queued change(s) with ${activeServer.name}.`);
    } else {
      setSyncResult(`Synced ${result.syncedCount} items, ${result.errors} failed. Check connection.`);
    }
    setIsSyncing(false);
  };

  const handleExportBackup = () => {
    const jsonStr = ServerManager.exportFullDatabase();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LBF_SaaS_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupMsg({ type: 'success', text: 'Database exported successfully to JSON file.' });
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const success = ServerManager.importFullDatabase(content);
      if (success) {
        setBackupMsg({ type: 'success', text: 'Database and server configuration restored successfully! Reloading data...' });
        setTimeout(() => window.location.reload(), 1200);
      } else {
        setBackupMsg({ type: 'error', text: 'Failed to restore backup. Invalid JSON format.' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/85 backdrop-blur-md p-3 sm:p-6 flex items-center justify-center">
      <div className={`border rounded-2xl w-full max-w-3xl xl:max-w-4xl overflow-hidden shadow-2xl transition-colors ${
        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-stone-900 border-stone-800 text-stone-100'
      }`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between p-4 sm:p-5 border-b ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-stone-950 border-stone-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-industrial uppercase tracking-wide">
                  SaaS Server Switcher
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                  REMOTE CONNECTED
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Switch backend endpoints and synchronize pending changes.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-800 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('servers')}
            className={`flex-1 py-3 px-3 text-center border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'servers'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            Server Switcher ({servers.length})
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`flex-1 py-3 px-3 text-center border-b-2 transition-colors whitespace-nowrap flex items-center justify-center gap-1.5 ${
              activeTab === 'sync'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <span>Sync Queue</span>
            {syncQueue.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-stone-950 font-bold text-[10px]">
                {syncQueue.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex-1 py-3 px-3 text-center border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'backup'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            Backup & Migration
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 px-3 text-center border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            Operator Session
          </button>
        </div>

        {/* Tab 1: Server Switcher */}
        {activeTab === 'servers' && (
          <div className="p-4 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <p className="text-xs text-stone-400">
                Select your active backend server for the current workshop or field session.
              </p>
              <button
                onClick={() => setIsAddingNew(!isAddingNew)}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Server</span>
              </button>
            </div>

            {/* Add Server Form */}
            {isAddingNew && (
              <form onSubmit={handleCreateServer} className="p-4 rounded-xl border border-amber-500/40 bg-stone-950/60 space-y-3">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Register New Server Endpoint</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-stone-400 mb-1">Server Friendly Name:</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mine Site LAN Server"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded bg-stone-900 border border-stone-700 text-xs text-stone-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-stone-400 mb-1">Server Mode:</label>
                    <select
                      value={newMode}
                      onChange={(e) => setNewMode(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded bg-stone-900 border border-stone-700 text-xs text-stone-200"
                    >
                      <option value="custom">Custom Remote Server</option>
                      <option value="lan">Workshop LAN (192.168.x.x)</option>
                      <option value="cloud">SaaS Cloud Endpoint</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-stone-400 mb-1">API Base URL:</label>
                  <input
                    type="url"
                    required
                    placeholder="https://api.yourcompany.com/v1"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded bg-stone-900 border border-stone-700 text-xs text-stone-200 font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-stone-400 mb-1">Tenant ID (Multi-tenant):</label>
                    <input
                      type="text"
                      placeholder="tenant_shop_1"
                      value={newTenantId}
                      onChange={(e) => setNewTenantId(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded bg-stone-900 border border-stone-700 text-xs text-stone-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-stone-400 mb-1">API Bearer Key (Optional):</label>
                    <input
                      type="password"
                      placeholder="Optional auth token"
                      value={newApiKey}
                      onChange={(e) => setNewApiKey(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded bg-stone-900 border border-stone-700 text-xs text-stone-200 font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="px-3 py-1 text-xs text-stone-400 hover:text-stone-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded"
                  >
                    Save & Activate
                  </button>
                </div>
              </form>
            )}

            {/* List of Servers */}
            <div className="space-y-2.5">
              {servers.map((srv) => {
                const isActive = srv.id === activeServer.id;
                return (
                  <div
                    key={srv.id}
                    onClick={() => handleSelectServer(srv)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isActive
                        ? 'border-amber-500 bg-amber-500/10 shadow-md shadow-amber-500/5'
                        : isLight
                        ? 'border-slate-200 hover:bg-slate-50'
                        : 'border-stone-800 hover:bg-stone-800/60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-2 rounded-lg shrink-0 bg-emerald-500/20 text-emerald-400">
                        <Server className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-stone-100">{srv.name}</h4>
                          {isActive && (
                            <span className="px-2 py-0.2 rounded-full bg-amber-500 text-stone-950 font-bold text-[10px]">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-mono text-stone-400 mt-0.5 truncate max-w-xs sm:max-w-md">
                          {srv.url}
                        </p>
                        <p className="text-[10px] text-stone-500 mt-0.5">
                          Tenant: <span className="font-semibold text-stone-300">{srv.tenantName}</span> ({srv.tenantId})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        disabled={isTesting}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTestConnection(srv);
                        }}
                        className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium border border-stone-700 flex items-center gap-1"
                      >
                        <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                        <span>Ping</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteServer(srv.id, e)}
                        className="p-1 rounded text-stone-500 hover:text-rose-400 transition-colors"
                        title="Delete server"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {testResult && (
              <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                testResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}>
                {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Sync Queue */}
        {activeTab === 'sync' && (
          <div className="p-4 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wide">Pending Sync Queue</h4>
                <p className="text-xs text-stone-400">
                  {syncQueue.length === 0
                    ? 'All queued invoice and customer changes are synchronized.'
                    : `${syncQueue.length} pending change(s) are ready to sync.`}
                </p>
              </div>

              {syncQueue.length > 0 && (
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={handleTriggerSync}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-lg flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Sync Now</span>
                </button>
              )}
            </div>

            {syncResult && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                {syncResult}
              </div>
            )}

            {syncQueue.length === 0 ? (
              <div className="text-center py-8 text-stone-500">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500/60" />
                <p className="text-xs">No pending sync items. Everything is up to date.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {syncQueue.map((item) => (
                  <div key={item.id} className="p-3 rounded-lg bg-stone-950 border border-stone-800 text-xs flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold uppercase text-amber-400">{item.action}</span>
                        <span className="font-mono text-stone-300">{item.type}</span>
                        <span className="text-[10px] text-stone-500 font-mono">ID: {item.entityId}</span>
                      </div>
                      <p className="text-[10px] text-stone-500 mt-0.5">{item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Recent'}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-400 text-[10px]">
                      Pending Sync
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Backup & Migration */}
        {activeTab === 'backup' && (
          <div className="p-4 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <p className="text-xs text-stone-400">
              Export your full customer directory, invoice records, and server settings to a portable JSON backup file for safe workstation transfers.
            </p>

            {backupMsg && (
              <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                backupMsg.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}>
                {backupMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{backupMsg.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-stone-800 bg-stone-950 text-center space-y-2">
                <Download className="w-6 h-6 text-amber-500 mx-auto" />
                <h4 className="text-xs font-bold uppercase">Export Full Workspace</h4>
                <p className="text-[11px] text-stone-400">Save all customers, invoices, and server lists to a single file.</p>
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Download JSON Backup
                </button>
              </div>

              <div className="p-4 rounded-xl border border-stone-800 bg-stone-950 text-center space-y-2">
                <Upload className="w-6 h-6 text-emerald-400 mx-auto" />
                <h4 className="text-xs font-bold uppercase">Restore / Import Backup</h4>
                <p className="text-[11px] text-stone-400">Restore your database from an existing LBF backup file.</p>
                <label className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs rounded-lg border border-stone-700 block transition-colors cursor-pointer">
                  <span>Select JSON File</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Operator Session & Sign Out */}
        {activeTab === 'profile' && (
          <div className="p-4 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="p-4 rounded-xl border border-stone-800 bg-stone-950 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 font-bold text-lg flex items-center justify-center border border-amber-500/30">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'O'}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{currentUser?.name || 'Authorized Operator'}</h4>
                  <p className="text-xs text-stone-400">{currentUser?.email}</p>
                  <p className="text-[11px] text-amber-500/90 font-mono mt-0.5">{currentUser?.role}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-800 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-stone-500 block text-[10px]">Tenant Organization:</span>
                  <span className="font-semibold text-stone-300">{currentUser?.tenantName}</span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[10px]">Tenant ID:</span>
                  <span className="font-mono text-stone-300">{currentUser?.tenantId}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              id="logout-btn"
              onClick={() => {
                onSignOut();
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out & Return to Login Screen</span>
            </button>
          </div>
        )}

        {/* Footer */}
        <div className={`p-3 sm:p-4 border-t flex items-center justify-between text-xs ${
          isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-stone-950 border-stone-800 text-stone-400'
        }`}>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px]">Active: {activeServer.name}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
