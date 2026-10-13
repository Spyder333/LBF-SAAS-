import React, { useState, useEffect } from 'react';
import {
  Server,
  Shield,
  Lock,
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
  Wifi,
  Building2,
  ChevronRight,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Globe,
  Radio,
  Sliders,
  MapPin,
  Phone
} from 'lucide-react';
import { SaaSUser, ServerConfig } from '../types';
import { ServerManager, DEFAULT_SERVERS } from '../lib/serverConfig';
import { useTheme } from '../context/ThemeContext';

interface LoginPageProps {
  onLogin: (user: SaaSUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const { isLight, toggleTheme } = useTheme();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Operations & Machining Lead');
  const [tenantName, setTenantName] = useState('LBF Solutions Heavy Machining Corp');
  const [tenantId, setTenantId] = useState('tenant_lbf_global');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Server Switcher state
  const [activeServer, setActiveServer] = useState<ServerConfig>(ServerManager.getActiveServer());
  const [allServers, setAllServers] = useState<ServerConfig[]>(ServerManager.getAllServers());
  const [isServerMenuOpen, setIsServerMenuOpen] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [pingStatus, setPingStatus] = useState<string | null>(null);

  useEffect(() => {
    const unsub = ServerManager.subscribe(() => {
      setActiveServer(ServerManager.getActiveServer());
      setAllServers(ServerManager.getAllServers());
    });
    return unsub;
  }, []);

  // Quick Preset Tenants
  const PRESET_TENANTS = [
    { id: 'tenant_lbf_harare_hq', name: 'LBF Solutions HQ (Carlton Rd, Harare)', region: 'Harare, Zimbabwe' },
    { id: 'tenant_lbf_field_ops', name: 'Mobile Line Boring Field Rig #1', region: 'Zimbabwe Mining & Earthmoving' },
    { id: 'tenant_bucket_overhaul', name: 'Bucket Repair & Fabrication Bay', region: 'Harare Workshop Yard' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid operator email address.');
      return;
    }

    if (!password && !isSignUp) {
      setErrorMsg('Please enter your password / security PIN.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const userObj: SaaSUser = {
        id: 'usr_' + Math.random().toString(36).substring(2, 9),
        email,
        name: fullName.trim() || email.split('@')[0].toUpperCase(),
        role,
        tenantId,
        tenantName
      };
      onLogin(userObj);
      setIsLoading(false);
    }, 500);
  };

  const handleSelectServer = (server: ServerConfig) => {
    ServerManager.setActiveServer(server);
    setActiveServer(server);
    setIsServerMenuOpen(false);
    setPingStatus(null);
  };

  const handleAddCustomServer = () => {
    if (!customUrlInput.trim()) return;
    const newServer: ServerConfig = {
      id: 'server_custom_' + Date.now(),
      name: 'Custom: ' + customUrlInput.replace(/^https?:\/\//, '').split('/')[0],
      mode: 'custom',
      url: customUrlInput.trim(),
      tenantId,
      tenantName
    };
    ServerManager.upsertServer(newServer);
    ServerManager.setActiveServer(newServer);
    setActiveServer(newServer);
    setCustomUrlInput('');
    setIsServerMenuOpen(false);
  };

  const handleTestPing = async (server: ServerConfig) => {
    setPingStatus('Testing connection to ' + server.name + '...');
    const result = await ServerManager.testConnection(server);
    setPingStatus(`${result.message} (${result.latencyMs}ms)`);
  };

  return (
    <div className={`relative min-h-screen flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 transition-colors overflow-hidden ${
      isLight ? 'bg-slate-100 text-slate-900' : 'bg-stone-950 text-stone-100'
    }`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.05),transparent_20%)]" />
      
      {/* Top Bar for Theme Toggle & Brand Info */}
      <div className="absolute top-4 right-4 flex items-center gap-3">
        <button
          type="button"
          onClick={toggleTheme}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
            isLight
              ? 'bg-white border-slate-300 text-slate-800 shadow-sm'
              : 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800'
          }`}
        >
          {isLight ? 'Theme: Field Light' : 'Theme: Industrial Dark'}
        </button>
      </div>

      <div className="relative max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto w-full">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-stone-950 font-bold font-industrial text-3xl shadow-xl shadow-amber-500/20 border border-amber-400/40 mb-3">
            LBF
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-industrial tracking-wide uppercase">
            LBF SOLUTIONS
          </h1>
          <p className="text-sm font-semibold text-amber-400 mt-1 max-w-lg mx-auto">
            Repair your buckets with us &bull; Lineboring and Fabrication solutions
          </p>

          {/* Real Harare Business Contact Strip */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-stone-400">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              Carlton Road, Harare, Zimbabwe, 17032
            </span>
            <span className="text-stone-600 hidden sm:inline">&bull;</span>
            <a
              href="https://wa.me/263779004626"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
              title="Chat with LBF Solutions on WhatsApp"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              WhatsApp: +263 77 900 4626 / 077 900 4626
            </a>
          </div>

          {/* Active Server Status Banner with 1-Click Server Switcher */}
          <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-2 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium border shadow-sm bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Server: <strong>{activeServer.name}</strong></span>
            </div>

            <button
              type="button"
              id="server-switcher-btn"
              onClick={() => setIsServerMenuOpen(!isServerMenuOpen)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                isLight
                  ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 shadow-sm'
                  : 'bg-stone-900 hover:bg-stone-800 border-stone-700 text-stone-300 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3 h-3 text-amber-500" />
                <span>Switch Server</span>
              </span>
            </button>
          </div>

          {/* Server Switcher Dropdown Panel */}
          {isServerMenuOpen && (
            <div className={`mt-3 max-w-xl mx-auto p-4 rounded-xl border text-left shadow-2xl transition-all ${
              isLight ? 'bg-white border-slate-300' : 'bg-stone-900 border-stone-700'
            }`}>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-700">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-amber-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">Select Backend Server</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsServerMenuOpen(false)}
                  className="text-xs text-stone-400 hover:text-white"
                >
                  Close
                </button>
              </div>

              <div className="space-y-2">
                {allServers.map((srv) => {
                  const isSelected = srv.id === activeServer.id;
                  return (
                    <div
                      key={srv.id}
                      onClick={() => handleSelectServer(srv)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 text-amber-400 font-semibold'
                          : isLight
                          ? 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          : 'border-stone-800 hover:bg-stone-800/80 text-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <p className="font-bold">{srv.name}</p>
                          <p className="text-[11px] opacity-75 font-mono truncate max-w-xs">{srv.url}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded bg-amber-500 text-stone-950 font-bold text-[10px]">
                            ACTIVE
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTestPing(srv);
                          }}
                          className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px]"
                        >
                          Ping
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Custom Server URL Input */}
              <div className="mt-3 pt-3 border-t border-stone-700">
                <label className="block text-[11px] font-semibold text-stone-400 mb-1">
                  Connect to Custom Server URL (Self-Hosted / LAN):
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://api.yourmachiningshop.com/v1"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-stone-950 border border-stone-700 text-stone-200 focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomServer}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 transition-colors"
                  >
                    Add & Connect
                  </button>
                </div>
              </div>

              {pingStatus && (
                <p className="mt-2 text-xs font-mono text-amber-400 bg-stone-950 p-2 rounded border border-stone-800">
                  {pingStatus}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Main Auth Card */}
        <div className="flex justify-center">
          <div className={`w-full max-w-3xl rounded-3xl border p-6 sm:p-8 shadow-2xl ${
            isLight ? 'bg-white border-slate-200' : 'bg-stone-900 border-stone-800'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-800 pb-4 mb-6">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-500">Portal access</p>
                <h2 className="mt-1 text-xl font-black font-industrial uppercase tracking-wide">
                  {isSignUp ? 'Create Operator Account' : 'Welcome Back'}
                </h2>
              </div>
              <div className="flex rounded-xl border border-stone-700 bg-stone-950/50 p-1">
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors cursor-pointer ${
                    !isSignUp
                      ? 'bg-amber-500 text-stone-950'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors cursor-pointer ${
                    isSignUp
                      ? 'bg-amber-500 text-stone-950'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Register
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Tenant / Organization Selector */}
              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-500" />
                  <span>SaaS Organization / Tenant Workspace:</span>
                </label>
                <select
                  value={tenantId}
                  onChange={(e) => {
                    const sel = PRESET_TENANTS.find((t) => t.id === e.target.value);
                    setTenantId(e.target.value);
                    if (sel) setTenantName(sel.name);
                  }}
                  className={`w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:border-amber-500 font-medium ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-stone-950 border-stone-700 text-stone-100'
                  }`}
                >
                  {PRESET_TENANTS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.region})
                    </option>
                  ))}
                </select>
              </div>

              {isSignUp && (
                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-1">
                    Operator Full Name:
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. David Ross"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2 rounded-lg text-sm border focus:outline-none focus:border-amber-500 ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-stone-950 border-stone-700 text-stone-100'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Email / ID */}
              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1">
                  Operator Work Email / Service ID:
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="lineboringandfabrication@lbfsolutions.co.zw"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 rounded-lg text-sm border focus:outline-none focus:border-amber-500 ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-stone-950 border-stone-700 text-stone-100'
                    }`}
                  />
                </div>
              </div>

              {/* Password / PIN */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-stone-400">
                    Password / Access PIN:
                  </label>
                  <span className="text-[11px] text-amber-500/80">Secure access</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 rounded-lg text-sm border focus:outline-none focus:border-amber-500 ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-stone-950 border-stone-700 text-stone-100'
                    }`}
                  />
                </div>
              </div>

              {/* Role Selector */}
              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1">
                  Operator Assignment Role:
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:border-amber-500 ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-stone-950 border-stone-700 text-stone-100'
                  }`}
                >
                  <option value="Operations & Machining Lead">Operations & Machining Lead (Full Admin)</option>
                  <option value="Field Service Specialist">Field Service Specialist (Onsite Invoicing & Fleet)</option>
                  <option value="Workshop Lead">Workshop Lead (Boring Formulas & Excel Calculations)</option>
                  <option value="Finance & Invoicing Manager">Finance & Invoicing Manager (Billing & Statements)</option>
                </select>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-stone-400 hover:text-stone-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-stone-700 bg-stone-950 text-amber-500 focus:ring-0 w-4 h-4"
                  />
                  <span>Remember session on this device</span>
                </label>
                <span className="text-stone-500 font-mono text-[11px]">Local + connected mode</span>
              </div>

              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[11px] text-stone-300">
                Sign in connects to the selected workshop or cloud server and keeps the session synchronized across the team.
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="login-submit-btn"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl font-bold font-industrial tracking-wider uppercase text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Authorizing Operator...</span>
                  </>
                ) : (
                  <>
                    <span>{isSignUp ? 'Create SaaS Account' : 'Authenticate & Enter Portal'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-stone-400 mt-8 space-y-1">
          <p className="font-semibold text-stone-300">
            LBF Solutions &bull; Carlton Road, Harare, Zimbabwe, 17032 &bull; Tel: 077 900 4626
          </p>
          <p className="text-stone-500">
            Repair your buckets with us &bull; Lineboring and Fabrication solutions &bull; Multi-server workshop operations
          </p>
        </div>

      </div>
    </div>
  );
};
