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
  Layers
} from 'lucide-react';
import { AuditLogItem } from '../types';
import { api } from '../services/api';
import { formatPHTDateTime } from '../utils/formatters';

export const AuditTrailView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs({
        entityType: entityFilter !== 'all' ? entityFilter : undefined,
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
  }, [entityFilter]);

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
              System Audit Trail & Accountability Logs
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/30 font-bold">
              Append-Only Logs
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Immutable records of work order transitions, parts issuances, reviews, logins, and administrative changes.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors self-start sm:self-auto"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search action, email, entity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-hidden focus:border-amber-500"
            />
          </div>

          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs font-mono"
          >
            <option value="all">All Entity Types</option>
            <option value="work_orders">work_orders</option>
            <option value="equipment">equipment</option>
            <option value="parts_inventory">parts_inventory</option>
            <option value="users">users</option>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
              {filteredLogs.map((log) => (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
