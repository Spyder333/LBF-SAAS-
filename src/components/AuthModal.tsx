import React, { useState } from 'react';
import {
  Database,
  Lock,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  LogOut,
  Shield,
  Key,
  X,
  Server,
  Terminal,
  Sun,
  Moon
} from 'lucide-react';
import { getSupabase, isSupabaseConfigured, SUPABASE_SQL_SETUP, localStore } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { SaaSUser } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: SaaSUser | null;
  onUpdateUser: (user: SaaSUser | null) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser
}) => {
  const { theme, setTheme, isLight } = useTheme();
  const [activeTab, setActiveTab] = useState<'auth' | 'database'>('auth');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState(currentUser?.email || '');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(currentUser?.name || 'LBF Workshop Admin');
  const [role, setRole] = useState(currentUser?.role || 'Operations & Machining Lead');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

  const isConnected = isSupabaseConfigured();

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    const sb = getSupabase();
    if (sb) {
      try {
        if (isSignUp) {
          const { data, error } = await sb.auth.signUp({
            email,
            password,
            options: {
              data: { full_name: fullName, role }
            }
          });
          if (error) throw error;
          setStatusMsg({ type: 'success', text: 'Supabase sign up successful! Check email if verification is required.' });
        } else {
          const { data, error } = await sb.auth.signInWithPassword({ email, password });
          if (error) throw error;
          setStatusMsg({ type: 'success', text: 'Supabase signed in successfully!' });
        }
      } catch (err) {
        setStatusMsg({ type: 'error', text: (err as Error).message });
      }
    }

    // Save profile locally
    const userObj: SaaSUser = {
      id: currentUser?.id || 'usr_' + Math.random().toString(36).substring(2, 9),
      email,
      name: fullName,
      role,
      tenantId: currentUser?.tenantId || 'tenant_default',
      tenantName: currentUser?.tenantName || 'LBF Solutions Heavy Machining'
    };
    localStore.saveUser(userObj);
    onUpdateUser(userObj);
    if (!sb) {
      setStatusMsg({ type: 'success', text: 'Operator profile saved in local storage session.' });
    }
  };

  const handleSignOut = async () => {
    const sb = getSupabase();
    if (sb) {
      await sb.auth.signOut();
    }
    localStore.saveUser(null);
    onUpdateUser(null);
    setEmail('');
    setPassword('');
    setStatusMsg({ type: 'success', text: 'Signed out successfully.' });
  };

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/85 backdrop-blur-md p-4 sm:p-6 flex items-center justify-center">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 bg-stone-950 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold font-industrial text-white tracking-wide">
                SUPABASE AUTHENTICATION & DATABASE
              </h3>
              <p className="text-xs text-stone-400">
                User Access &bull; PostgreSQL Data Sync
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-stone-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('auth')}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              activeTab === 'auth'
                ? 'border-amber-500 text-amber-400 bg-stone-900'
                : 'border-transparent text-stone-400 hover:text-stone-200 bg-stone-950'
            }`}
          >
            Operator Sign In & Profile
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              activeTab === 'database'
                ? 'border-amber-500 text-amber-400 bg-stone-900'
                : 'border-transparent text-stone-400 hover:text-stone-200 bg-stone-950'
            }`}
          >
            Database Setup & SQL Schema
          </button>
        </div>

        <div className="p-6">
          
          {/* Status Alert Banner */}
          {statusMsg && (
            <div
              className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                  : 'bg-red-950/60 border border-red-800 text-red-300'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* TAB 1: AUTHENTICATION */}
          {activeTab === 'auth' && (
            <div>
              {/* Connection Status Pill */}
              <div className="mb-4 p-3 bg-stone-950 rounded-xl border border-stone-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  ></div>
                  <span className="text-stone-300 font-medium">
                    {isConnected ? 'Supabase Client Connected' : 'Local Storage Mode (Active Offline)'}
                  </span>
                </div>
                <span className="text-[10px] text-stone-500 font-mono">
                  {isConnected ? 'LIVE REMOTE DB' : 'LOCAL CACHED'}
                </span>
              </div>

              {currentUser ? (
                <div className="space-y-4">
                  <div className="bg-stone-950 p-4 rounded-xl border border-stone-800">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg border border-amber-500/30">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{currentUser.name}</p>
                        <p className="text-stone-400 text-xs">{currentUser.email}</p>
                        <p className="text-[11px] text-amber-400 font-medium mt-0.5">{currentUser.role}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSignOut}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-semibold transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out / Switch Operator</span>
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleAuthSubmit} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-stone-300 font-medium mb-1">Operator Full Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Mike Henderson"
                      className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-stone-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-300 font-medium mb-1">Role / Job Title</label>
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="e.g. Line Boring Specialist / Workshop Lead"
                      className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-stone-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-300 font-medium mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="operations@lbfsolutions.co.za"
                      className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-stone-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-300 font-medium mb-1">Password</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2 text-stone-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="text-amber-400 hover:underline text-xs"
                    >
                      {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                    </button>

                    <button
                      type="submit"
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl shadow-md transition-all active:scale-95"
                    >
                      {isSignUp ? 'Create Supabase Account' : 'Sign In'}
                    </button>
                  </div>
                </form>
              )}

              {/* Display Visibility Profile (Theme Switcher) */}
              <div className="mt-4 pt-4 border-t border-stone-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-stone-300 font-semibold flex items-center gap-1.5 text-xs">
                    {isLight ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-amber-400" />}
                    Display Visibility Profile
                  </span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-stone-800 text-stone-300 border border-stone-700">
                    {isLight ? 'Field Office Light' : 'Industrial Dark'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 mb-2.5">
                  Toggle between high-contrast light mode for field trailers under bright sunlight and industrial dark mode for low-glare workshop operations.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      !isLight
                        ? 'border-amber-500 bg-amber-500/10 text-white'
                        : 'border-stone-800 bg-stone-950 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-stone-900 border border-stone-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Moon className="w-3 h-3 text-amber-400" />
                    </div>
                    <div>
                      <p className="font-bold text-xs">Industrial Dark</p>
                      <p className="text-[10px] text-stone-400">Low-Glare Workshop</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      isLight
                        ? 'border-amber-500 bg-amber-500/10 text-white'
                        : 'border-stone-800 bg-stone-950 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                      <Sun className="w-3 h-3 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-bold text-xs">Field Office Light</p>
                      <p className="text-[10px] text-stone-400">High-Contrast Sun</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DATABASE SETUP & SQL SCHEMA */}
          {activeTab === 'database' && (
            <div className="space-y-4 text-xs">
              <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-amber-400" /> Supabase Connection Guide
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      isConnected ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                    }`}
                  >
                    {isConnected ? 'CONNECTED' : 'STANDBY / LOCAL'}
                  </span>
                </div>
                <p className="text-stone-400 leading-relaxed text-[11px]">
                  Configure your project in <code className="text-amber-400 font-mono">.env.example</code> with:
                </p>
                <div className="bg-stone-900 p-2.5 rounded font-mono text-[11px] text-stone-300 space-y-1">
                  <p>VITE_SUPABASE_URL="https://your-project.supabase.co"</p>
                  <p>VITE_SUPABASE_ANON_KEY="your-anon-public-key"</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-stone-300 flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5 text-amber-400" /> PostgreSQL SQL Schema (Run in Supabase Editor):
                  </span>
                  <button
                    onClick={copySqlToClipboard}
                    className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-amber-400 border border-stone-700 transition-colors"
                  >
                    {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSql ? 'Copied SQL!' : 'Copy SQL Script'}</span>
                  </button>
                </div>
                <pre className="bg-stone-950 p-3 rounded-xl border border-stone-800 font-mono text-[10px] text-stone-300 max-h-48 overflow-y-auto overflow-x-auto leading-normal">
                  {SUPABASE_SQL_SETUP}
                </pre>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
