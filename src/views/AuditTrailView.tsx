import React, { useState, useEffect } from 'react';
import {
  History,
  Shield,
  Search,
  Filter,
  Clock,
  RefreshCw,
  FileText,
  User,
  Layers,
  Trash2,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { AuditLogItem } from '../types';
import { api } from '../services/api';
import { formatPHTDateTime } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

export const AuditTrailView: React.FC = () => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs({
        entityType: entityFilter !== 'all' ? entityFilter : undefined,
        action: actionFilter !== 'all' ? actionFilter : undefined,
        limit: 150,
      });
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityFilter, actionFilter]);

  const handleDeleteLog = async (id: number) => {
    setBusy(true);
    setFeedback(null);
    try {
      await api.deleteAuditLog(id);
      setLogs((prev) => prev.filter((item) => item.id !== id));
      setConfirmDeleteId(null);
      setFeedback({ type: 'success', message: `Deleted audit entry #${id}.` });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete audit log' });
    } finally {
      setBusy(false);
    }
  };

  const handleClearHistory = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      const targetAction = actionFilter !== 'all' ? actionFilter : undefined;
      await api.clearAuditLogs(targetAction);
      setConfirmClearAll(false);
      await fetchLogs();
      setFeedback({
        type: 'success',
        message:
          targetAction === 'USER_LOGIN'
            ? 'Cleared login history logs.'
            : 'Cleared all audit history logs.',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to clear audit history' });
    } finally {
      setBusy(false);
    }
  };

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.user_email.toLowerCase().includes(search.toLowerCase()) ||
      (l.details_json && l.details_json.toLowerCase().includes(search.toLowerCase())) ||
      (l.entity_id && l.entity_id.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">
              System Audit Trail & Login Activity
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/30 font-bold">
              Admin Only • Audit Control
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Monitor who logged in, account requests, work order transitions, and remove or clear history entries.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isAdmin && logs.length > 0 && (
            confirmClearAll ? (
              <div className="flex items-center gap-1.5 bg-rose-950/60 border border-rose-500/40 rounded-lg px-2.5 py-1.5 text-xs">
                <span className="text-rose-200 font-mono text-[11px]">
                  {actionFilter === 'USER_LOGIN' ? 'Clear login history?' : 'Clear all logs?'}
                </span>
                <button
                  onClick={handleClearHistory}
                  disabled={busy}
                  className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] cursor-pointer"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmClearAll(false)}
                  className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClearAll(true)}
                className="px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {actionFilter === 'USER_LOGIN' ? 'Clear Login History' : 'Clear Audit History'}
              </button>
            )
          )}

          <button
            onClick={fetchLogs}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-[11px] font-mono opacity-80 hover:opacity-100 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search action, email, name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-hidden focus:border-amber-500"
            />
          </div>

          <button
            type="button"
            onClick={() => setActionFilter(actionFilter === 'USER_LOGIN' ? 'all' : 'USER_LOGIN')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-colors flex items-center gap-1.5 cursor-pointer ${
              actionFilter === 'USER_LOGIN'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-emerald-500/40'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            {actionFilter === 'USER_LOGIN' ? 'Showing: User Logins Only' : 'Filter: Who Logged In'}
          </button>

          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs font-mono"
          >
            <option value="all">All Entity Types</option>
            <option value="users">users</option>
            <option value="work_orders">work_orders</option>
            <option value="equipment">equipment</option>
            <option value="parts_inventory">parts_inventory</option>
            <option value="system">system</option>
          </select>
        </div>

        <span className="text-slate-400 font-mono text-xs">
          Showing <strong className="text-slate-100">{filteredLogs.length}</strong> logged transactions
        </span>
      </div>

      {/* Audit Log Table */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-xs">
          <Clock className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-400" />
          Querying audit logs...
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-slate-850 border border-slate-800 shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-[10px] uppercase font-mono text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3.5">Timestamp (PHT)</th>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Entity</th>
                <th className="p-3.5">Responsible User</th>
                <th className="p-3.5">IP Address</th>
                <th className="p-3.5">Details (JSON Payload)</th>
                {isAdmin && <th className="p-3.5 text-right">Delete</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="p-10 text-center text-slate-500 font-sans text-xs">
                    No audit trail entries found for the selected filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-3.5 text-slate-400 whitespace-nowrap">
                      {formatPHTDateTime(log.created_at)}
                    </td>

                    <td className="p-3.5">
                      <span className="font-bold text-amber-400">{log.action}</span>
                    </td>

                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                        {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <div className="text-slate-200 font-sans">{log.user_email}</div>
                      <span className="text-[10px] text-slate-500 uppercase">{log.user_role}</span>
                    </td>

                    <td className="p-3.5 text-slate-500 text-[10px]">
                      {log.ip_address || '127.0.0.1'}
                    </td>

                    <td className="p-3.5 max-w-md">
                      <div className="text-[10px] text-slate-400 truncate max-w-sm bg-slate-900/60 p-1.5 rounded border border-slate-800" title={log.details_json || ''}>
                        {log.details_json || '—'}
                      </div>
                    </td>

                    {isAdmin && (
                      <td className="p-3.5 text-right whitespace-nowrap">
                        {confirmDeleteId === log.id ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleDeleteLog(log.id)}
                              disabled={busy}
                              className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-[10px] cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(log.id)}
                            disabled={busy}
                            title="Delete audit log entry"
                            className="p-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
