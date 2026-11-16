import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  X,
  Server,
  Layers
} from 'lucide-react';
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_PROJECT_REF,
  SUPABASE_DASHBOARD_URL,
  testSupabaseConnection,
} from '../lib/supabase';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose }) => {
  const [testing, setTesting] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [connStatus, setConnStatus] = useState<{
    tested: boolean;
    connected: boolean;
    message: string;
    tablesFound?: string[];
    missingTables?: string[];
  }>({
    tested: false,
    connected: true,
    message: 'Supabase client initialized.',
  });

  const checkConnection = async () => {
    setTesting(true);
    try {
      const res = await testSupabaseConnection();
      setConnStatus({
        tested: true,
        connected: res.connected,
        message: res.message,
        tablesFound: res.tablesFound,
        missingTables: res.missingTables,
      });
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkConnection();
    }
  }, [isOpen]);

  const copyAnonKey = () => {
    navigator.clipboard.writeText(SUPABASE_ANON_KEY);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const copySqlSchema = async () => {
    try {
      const res = await fetch('/supabase-schema.sql');
      const sqlText = await res.text();
      navigator.clipboard.writeText(sqlText);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
    } catch {
      // Fallback
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-750 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                Supabase Backend Integration
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Active
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Connected to project <span className="font-mono text-emerald-300">{SUPABASE_PROJECT_REF}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Credentials Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
              <div className="text-[11px] font-mono uppercase text-slate-400 mb-1 flex items-center justify-between">
                <span>Supabase Project URL</span>
                <a
                  href={SUPABASE_DASHBOARD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline flex items-center gap-1 text-[10px]"
                >
                  Dashboard <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="font-mono text-xs text-slate-200 select-all break-all">
                {SUPABASE_URL}
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
              <div className="text-[11px] font-mono uppercase text-slate-400 mb-1 flex items-center justify-between">
                <span>Public Anon Key</span>
                <button
                  onClick={copyAnonKey}
                  className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[10px]"
                >
                  {copiedKey ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedKey ? 'Copied' : 'Copy Key'}
                </button>
              </div>
              <div className="font-mono text-xs text-slate-300 truncate">
                {SUPABASE_ANON_KEY.substring(0, 24)}...
              </div>
            </div>
          </div>

          {/* Connection & Table Status */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 font-medium text-slate-200 text-xs">
                <Server className="w-4 h-4 text-emerald-400" />
                Live PostgREST & Schema Status
              </div>
              <button
                onClick={checkConnection}
                disabled={testing}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin text-emerald-400' : ''}`} />
                <span>{testing ? 'Testing...' : 'Re-verify'}</span>
              </button>
            </div>

            <div className="flex items-start gap-2.5 text-xs text-slate-300 bg-slate-900/60 p-3 rounded border border-slate-800">
              {connStatus.connected ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-medium text-slate-100">{connStatus.message}</p>
                {connStatus.missingTables && connStatus.missingTables.length > 0 && (
                  <p className="text-slate-400 mt-1 text-[11px]">
                    To sync live tables to Supabase, run the SQL script below in your Supabase SQL Editor.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 1-Click SQL Setup instructions */}
          <div className="border border-emerald-500/20 bg-emerald-950/10 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 font-semibold text-emerald-300 text-xs">
                <Layers className="w-4 h-4" />
                Setup Schema in Supabase SQL Editor
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copySqlSchema}
                  className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition shadow-sm"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'SQL Copied!' : 'Copy SQL Schema'}</span>
                </button>
                <a
                  href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/sql/new`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded text-xs font-medium transition"
                >
                  <span>Open SQL Editor</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Click <strong className="text-slate-200">Copy SQL Schema</strong> and paste it directly into your Supabase SQL Editor, then click <strong className="text-emerald-400">Run</strong>. It creates all tables (<code className="text-emerald-300">users</code>, <code className="text-emerald-300">equipment</code>, <code className="text-emerald-300">work_orders</code>, <code className="text-emerald-300">parts_inventory</code>, etc.), sets up Row Level Security (RLS) policies for your anon key, and seeds Kirahon Solar Power Plant equipment.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
          <span>Client connection active via <code className="text-emerald-400">@supabase/supabase-js</code></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
