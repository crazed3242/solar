import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Calendar,
  ArrowRight,
  ClipboardList,
  Cpu,
  MapPin,
  Zap
} from 'lucide-react';
import { WorkOrder } from '../types';
import { api } from '../services/api';
import { formatPHTDate, formatPHTDateTime, getStatusBadge, getPriorityBadge } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

interface TechnicianDashboardProps {
  onSelectWorkOrder: (woId: number) => void;
  onSubmitReport: (wo: WorkOrder) => void;
  onNavigate?: (tab: string) => void;
}

export const TechnicianDashboard: React.FC<TechnicianDashboardProps> = ({
  onSelectWorkOrder,
  onSubmitReport,
  onNavigate,
}) => {
  const { currentUser } = useAuth();
  const [assignedOrders, setAssignedOrders] = useState<WorkOrder[]>([]);
  const [openRequests, setOpenRequests] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);

  const fetchMyOrders = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [myOrders, unassignedOrders] = await Promise.all([
        api.getWorkOrders({ technicianId: currentUser.id }),
        api.getWorkOrders({ unassigned: true }),
      ]);
      setAssignedOrders(myOrders);
      setOpenRequests(unassignedOrders);
    } catch (err) {
      console.error('Failed to load technician orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyOrders();
  }, [currentUser]);

  const needAck = assignedOrders.filter((w) => w.status === 'assigned');
  const inProgress = assignedOrders.filter((w) => ['acknowledged', 'in_progress', 'on_hold'].includes(w.status));
  const needRevision = assignedOrders.filter((w) => w.status === 'revision_required');
  const completed = assignedOrders.filter((w) => ['completed_pending_review', 'approved', 'closed'].includes(w.status));

  const handleAcceptRequest = async (woId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    try {
      setAcceptingId(woId);
      await api.acceptWorkOrder(woId, currentUser.id);
      await fetchMyOrders();
    } catch (err) {
      console.error('Failed to accept work order:', err);
    } finally {
      setAcceptingId(null);
    }
  };

  const handleAcknowledge = async (woId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    await api.acknowledgeAssignment(woId, currentUser.id);
    fetchMyOrders();
  };

  const handleStartWork = async (woId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    await api.startWork(woId, currentUser.id);
    fetchMyOrders();
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100">
              Welcome, {currentUser?.full_name}
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold">
              Field Technician Terminal
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Employee ID: <strong className="text-slate-200">{currentUser?.employee_id}</strong> • Department: {currentUser?.department}
          </p>
        </div>

        {/* Quick Quick Employee Actions */}
        {onNavigate && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('daily_activity')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              Daily Activity Log
            </button>
            <button
              onClick={() => onNavigate('inventory')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Wrench className="w-3.5 h-3.5 text-emerald-400" />
              Check Parts
            </button>
          </div>
        )}
      </div>

      {/* Field Operational Metrics (Employee Focused Only) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
        <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Open Plant Requests</span>
            <span className="text-2xl font-bold text-amber-400 mt-1 block">{openRequests.length}</span>
            <span className="text-[10px] text-slate-500">Available to claim</span>
          </div>
          <Zap className="w-6 h-6 text-amber-400/40" />
        </div>

        <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">In Progress</span>
            <span className="text-2xl font-bold text-cyan-400 mt-1 block">{inProgress.length}</span>
            <span className="text-[10px] text-slate-500">Currently executing</span>
          </div>
          <Wrench className="w-6 h-6 text-cyan-400/40" />
        </div>

        <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Awaiting Ack</span>
            <span className="text-2xl font-bold text-blue-400 mt-1 block">{needAck.length}</span>
            <span className="text-[10px] text-slate-500">Direct assignments</span>
          </div>
          <Clock className="w-6 h-6 text-blue-400/40" />
        </div>

        <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">My Completed</span>
            <span className="text-2xl font-bold text-emerald-400 mt-1 block">{completed.length}</span>
            <span className="text-[10px] text-slate-500">Submitted & approved</span>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-400/40" />
        </div>
      </div>

      {/* Revision Required Alert */}
      {needRevision.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <RotateCcw className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <strong className="block text-rose-200">Attention: {needRevision.length} Maintenance Report(s) Returned for Revision</strong>
              <span className="text-rose-300/80 text-[11px]">
                Please review administrator notes, adjust findings or attach required photos, and re-submit.
              </span>
            </div>
          </div>
          <button
            onClick={() => onSubmitReport(needRevision[0])}
            className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shrink-0 transition-colors"
          >
            Revise Report #{needRevision[0].work_order_code} →
          </button>
        </div>
      )}

      {/* Open Area Repair & Maintenance Requests Pool */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-850 to-slate-850 border border-amber-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                <Zap className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-sm uppercase tracking-wider text-slate-100">
                Open Plant Area Repair & Maintenance Requests
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold">
                {openRequests.length} Available
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Broadcasted repair and preventive tasks from Admin. Accept any request to claim it and immediately start repair work.
            </p>
          </div>
        </div>

        {openRequests.length === 0 ? (
          <div className="p-5 rounded-xl bg-slate-900/50 border border-dashed border-slate-800 text-center text-slate-500 text-xs">
            No open repair requests broadcasted right now. All area tasks have been claimed.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {openRequests.map((wo) => {
              const priorityBadge = getPriorityBadge(wo.priority);
              const isClaiming = acceptingId === wo.id;
              return (
                <div
                  key={wo.id}
                  onClick={() => onSelectWorkOrder(wo.id)}
                  className="p-4 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-amber-500/50 transition-all cursor-pointer flex flex-col justify-between gap-3 shadow-md group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-amber-400 font-bold text-xs">{wo.work_order_code}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        wo.type === 'corrective' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {wo.type === 'corrective' ? 'Corrective Breakdown' : 'Preventive Maintenance'}
                      </span>
                    </div>

                    <div className="text-sm font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                      {wo.equipment_name}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-amber-400/90 font-mono">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                      <span className="truncate">{wo.plant_section}</span>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {wo.problem_description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                    <span className={`text-[10px] ${priorityBadge.text} font-bold`}>
                      {priorityBadge.label} Priority
                    </span>
                    <button
                      disabled={isClaiming}
                      onClick={(e) => handleAcceptRequest(wo.id, e)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      {isClaiming ? (
                        <>
                          <Clock className="w-3.5 h-3.5 animate-spin" /> Claiming...
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5" /> Accept & Start
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Section 1: Jobs Needing Acknowledgment */}
        <div className="p-5 rounded-2xl bg-slate-850 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-blue-400" /> New Job Assignments Awaiting Acknowledgment
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 font-bold">
              {needAck.length}
            </span>
          </div>

          {needAck.length === 0 ? (
            <div className="p-6 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-center text-slate-500 text-xs">
              All assigned maintenance tasks have been acknowledged.
            </div>
          ) : (
            <div className="space-y-2.5">
              {needAck.map((wo) => {
                const priorityBadge = getPriorityBadge(wo.priority);
                return (
                  <div
                    key={wo.id}
                    onClick={() => onSelectWorkOrder(wo.id)}
                    className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-amber-400 font-bold">{wo.work_order_code}</span>
                        <span className={`px-2 py-0.2 rounded text-[10px] uppercase font-bold ${
                          wo.type === 'corrective' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {wo.type}
                        </span>
                      </div>
                      <span className={`text-[10px] font-mono ${priorityBadge.text}`}>
                        {priorityBadge.label} Priority
                      </span>
                    </div>

                    <div className="font-semibold text-slate-200">{wo.equipment_name} ({wo.asset_id})</div>
                    <p className="text-slate-400 text-xs line-clamp-2">{wo.problem_description}</p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] font-mono">
                      <span className="text-slate-500">Due: {formatPHTDate(wo.due_date)}</span>
                      <button
                        onClick={(e) => handleAcknowledge(wo.id, e)}
                        className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-xs"
                      >
                        Acknowledge Job
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 2: Ongoing Work Orders */}
        <div className="p-5 rounded-2xl bg-slate-850 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-400" /> Ongoing Maintenance & Repair Execution
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 font-bold">
              {inProgress.length}
            </span>
          </div>

          {inProgress.length === 0 ? (
            <div className="p-6 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-center text-slate-500 text-xs">
              No maintenance work currently in progress.
            </div>
          ) : (
            <div className="space-y-2.5">
              {inProgress.map((wo) => {
                const statusBadge = getStatusBadge(wo.status);
                return (
                  <div
                    key={wo.id}
                    onClick={() => onSelectWorkOrder(wo.id)}
                    className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-amber-400 font-bold">{wo.work_order_code}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                        {statusBadge.label}
                      </span>
                    </div>

                    <div className="font-semibold text-slate-200">{wo.equipment_name}</div>
                    <p className="text-slate-400 text-xs line-clamp-1">{wo.problem_description}</p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] font-mono">
                      <span className="text-slate-500">{wo.plant_section}</span>
                      <div className="flex items-center gap-2">
                        {wo.status === 'acknowledged' && (
                          <button
                            onClick={(e) => handleStartWork(wo.id, e)}
                            className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs shadow-xs"
                          >
                            Start Work
                          </button>
                        )}
                        {wo.status === 'in_progress' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSubmitReport(wo);
                            }}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs"
                          >
                            Complete & Send Report →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Completed Jobs History */}
      <div className="p-5 rounded-2xl bg-slate-850 border border-slate-800 space-y-3">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> My Completed & Submitted Jobs ({completed.length})
        </h3>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-[10px] uppercase font-mono text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">Work Order</th>
                <th className="p-3">Equipment</th>
                <th className="p-3">Type</th>
                <th className="p-3">Labor Hours</th>
                <th className="p-3">Approval Status</th>
                <th className="p-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {completed.map((wo) => {
                const statusBadge = getStatusBadge(wo.status);
                return (
                  <tr
                    key={wo.id}
                    onClick={() => onSelectWorkOrder(wo.id)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer font-mono"
                  >
                    <td className="p-3 font-bold text-amber-400">{wo.work_order_code}</td>
                    <td className="p-3 font-sans text-slate-200 font-semibold">{wo.equipment_name}</td>
                    <td className="p-3 text-[10px] uppercase text-slate-300">{wo.type}</td>
                    <td className="p-3 text-slate-300">{wo.labor_hours || 0} hrs</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="p-3 text-right text-cyan-400 hover:underline">View →</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
