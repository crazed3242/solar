import React, { useState, useEffect } from 'react';
import {
  Plus,
  Filter,
  Search,
  Wrench,
  Clock,
  User,
  ShieldAlert,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  LayoutList,
  Kanban
} from 'lucide-react';
import { WorkOrder, User as UserType, Equipment } from '../types';
import { api } from '../services/api';
import { formatPHTDate, formatCurrency, getStatusBadge, getPriorityBadge } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

interface WorkOrdersViewProps {
  onSelectWorkOrder: (woId: number) => void;
  onCreateWorkOrder: () => void;
}

export const WorkOrdersView: React.FC<WorkOrdersViewProps> = ({
  onSelectWorkOrder,
  onCreateWorkOrder,
}) => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchWorkOrders = async () => {
    setLoading(true);
    try {
      const isUnassigned = statusFilter === 'unassigned';
      const data = await api.getWorkOrders({
        status: statusFilter !== 'all' && !isUnassigned ? statusFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        unassigned: isUnassigned ? true : undefined,
        search: search || undefined,
      });
      setWorkOrders(data);
    } catch (err) {
      console.error('Failed to fetch work orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkOrders();
  }, [statusFilter, typeFilter, search]);

  const kanbanColumns = [
    { id: 'open', label: 'Open', color: 'border-slate-500' },
    { id: 'assigned', label: 'Assigned', color: 'border-blue-500' },
    { id: 'in_progress', label: 'In Progress', color: 'border-amber-500' },
    { id: 'completed_pending_review', label: 'Pending Review', color: 'border-orange-500' },
    { id: 'approved', label: 'Approved', color: 'border-emerald-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">
            Maintenance Work Orders
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Corrective repairs, scheduled preventive inspections, technician assignments, and review lifecycle.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center p-1 bg-slate-800 rounded-lg border border-slate-700">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md ${viewMode === 'table' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
              title="Table View"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md ${viewMode === 'kanban' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
              title="Kanban Board View"
            >
              <Kanban className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={fetchWorkOrders}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {isAdmin && (
            <button
              onClick={onCreateWorkOrder}
              className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
            >
              <Plus className="w-4 h-4" /> Create Work Order
            </button>
          )}
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search code, equipment..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs w-52 focus:outline-hidden focus:border-amber-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs"
          >
            <option value="all">All Types</option>
            <option value="corrective">Corrective</option>
            <option value="preventive">Preventive</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="unassigned">⚡ Open Area Requests (Broadcasted)</option>
            <option value="open">Open</option>
            <option value="assigned">Assigned</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="in_progress">In Progress</option>
            <option value="on_hold">On Hold</option>
            <option value="completed_pending_review">Pending Review</option>
            <option value="revision_required">Revision Required</option>
            <option value="approved">Approved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <span className="text-slate-400 font-mono text-xs">
          Showing <strong className="text-slate-100">{workOrders.length}</strong> work orders
        </span>
      </div>

      {/* Main Content: Table or Kanban */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-xs">
          <Clock className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-400" />
          Loading work orders...
        </div>
      ) : workOrders.length === 0 ? (
        <div className="p-16 rounded-2xl bg-slate-850 border border-dashed border-slate-800 text-center text-slate-500 text-xs">
          No work orders in the system yet. Start fresh by clicking <strong className="text-amber-400 font-semibold">+ Log Maintenance Work</strong> to create your first repair request!
        </div>
      ) : viewMode === 'table' ? (
        <div className="overflow-x-auto rounded-2xl bg-slate-850 border border-slate-800 shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-[10px] uppercase font-mono text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3.5">Code</th>
                <th className="p-3.5">Type & Priority</th>
                <th className="p-3.5">Target Solar Asset</th>
                <th className="p-3.5">Problem / Scope</th>
                <th className="p-3.5">Assigned Tech</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Due Date</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {workOrders.map((wo) => {
                const statusBadge = getStatusBadge(wo.status);
                const priorityBadge = getPriorityBadge(wo.priority);

                return (
                  <tr
                    key={wo.id}
                    onClick={() => onSelectWorkOrder(wo.id)}
                    className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                  >
                    <td className="p-3.5 font-mono text-amber-400 font-bold group-hover:underline">
                      {wo.work_order_code}
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          wo.type === 'corrective' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {wo.type}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-mono ${priorityBadge.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${priorityBadge.dot}`} />
                          {priorityBadge.label}
                        </span>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-semibold text-slate-200">{wo.equipment_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {wo.asset_id} • {wo.plant_section}
                      </div>
                    </td>

                    <td className="p-3.5 max-w-xs">
                      <p className="text-slate-300 line-clamp-1 text-xs">
                        {wo.problem_description}
                      </p>
                    </td>

                    <td className="p-3.5 font-mono">
                      {wo.technician_name ? (
                        <span className="text-slate-200 font-medium">{wo.technician_name}</span>
                      ) : (
                        <span className="text-slate-500 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                        {statusBadge.label}
                      </span>
                    </td>

                    <td className="p-3.5 font-mono text-slate-400 text-[11px]">
                      {formatPHTDate(wo.due_date)}
                    </td>

                    <td className="p-3.5 text-right font-mono">
                      {!isAdmin && (!wo.assigned_technician_id || wo.status === 'open') ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (currentUser) {
                              api.acceptWorkOrder(wo.id, currentUser.id).then(() => fetchWorkOrders());
                            }
                          }}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-xs transition-colors"
                        >
                          ⚡ Accept
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-400 group-hover:text-amber-300">
                          Open <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {kanbanColumns.map((col) => {
            const items = workOrders.filter((w) => {
              if (col.id === 'open') return ['open'].includes(w.status);
              if (col.id === 'assigned') return ['assigned', 'acknowledged'].includes(w.status);
              if (col.id === 'in_progress') return ['in_progress', 'on_hold', 'revision_required'].includes(w.status);
              if (col.id === 'completed_pending_review') return ['completed_pending_review'].includes(w.status);
              if (col.id === 'approved') return ['approved', 'closed'].includes(w.status);
              return false;
            });

            return (
              <div key={col.id} className="p-3 rounded-2xl bg-slate-850 border border-slate-800 space-y-2.5">
                <div className={`flex items-center justify-between pb-2 border-b-2 ${col.color}`}>
                  <span className="font-bold text-xs text-slate-200">{col.label}</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                    {items.length}
                  </span>
                </div>

                <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-0.5">
                  {items.map((wo) => (
                    <div
                      key={wo.id}
                      onClick={() => onSelectWorkOrder(wo.id)}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-750 hover:border-amber-500/50 transition-all cursor-pointer space-y-2 text-xs shadow-xs"
                    >
                      <div className="flex items-center justify-between font-mono text-[10px]">
                        <span className="text-amber-400 font-bold">{wo.work_order_code}</span>
                        <span className={`uppercase font-bold ${
                          wo.priority === 'critical' ? 'text-rose-400' : 'text-slate-400'
                        }`}>
                          {wo.priority}
                        </span>
                      </div>

                      <div className="font-semibold text-slate-200 line-clamp-1">{wo.equipment_name}</div>
                      <p className="text-slate-400 text-[11px] line-clamp-2">{wo.problem_description}</p>

                      <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-slate-800 text-slate-400">
                        <span>{wo.technician_name ? wo.technician_name.split(' ')[0] : 'Unassigned'}</span>
                        <span>{formatPHTDate(wo.due_date)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
