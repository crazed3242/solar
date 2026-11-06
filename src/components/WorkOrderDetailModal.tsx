import React from 'react';
import {
  X,
  Clock,
  MapPin,
  User,
  Wrench,
  AlertCircle,
  CheckCircle2,
  Calendar,
  DollarSign,
  ShieldAlert,
  FileText,
  History,
  Image as ImageIcon,
  CheckSquare,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { WorkOrder } from '../types';
import { formatPHTDateTime, formatPHTDate, formatCurrency, getStatusBadge, getPriorityBadge } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

interface WorkOrderDetailModalProps {
  workOrder: WorkOrder;
  onClose: () => void;
  onAction?: (action: string, wo: WorkOrder) => void;
}

export const WorkOrderDetailModal: React.FC<WorkOrderDetailModalProps> = ({
  workOrder,
  onClose,
  onAction,
}) => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const isAssignedTech = currentUser?.id === workOrder.assigned_technician_id;

  const statusBadge = getStatusBadge(workOrder.status);
  const priorityBadge = getPriorityBadge(workOrder.priority);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col text-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-850 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              workOrder.type === 'corrective' ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'
            }`}>
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base sm:text-lg font-bold text-amber-400">
                  {workOrder.work_order_code}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                  workOrder.type === 'corrective' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {workOrder.type}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                  {statusBadge.label}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Asset: <span className="text-slate-200 font-semibold">{workOrder.equipment_name}</span> ({workOrder.asset_id})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Top Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Priority</span>
              <span className={`inline-flex items-center gap-1.5 font-bold ${priorityBadge.text} mt-0.5`}>
                <span className={`w-2 h-2 rounded-full ${priorityBadge.dot}`} />
                {priorityBadge.label}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Location / Section</span>
              <span className="text-slate-200 block truncate mt-0.5">{workOrder.plant_section}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Assigned Technician</span>
              <span className="text-slate-200 block truncate mt-0.5">
                {workOrder.technician_name || 'Unassigned'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Due Date (PHT)</span>
              <span className="text-slate-200 block mt-0.5">{formatPHTDate(workOrder.due_date)}</span>
            </div>
          </div>

          {/* Problem & Operational Impact */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-400" /> Problem & Operational Context
            </h4>
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400">Problem Description / Objective:</span>
                <p className="text-slate-200 mt-0.5 text-xs leading-relaxed">{workOrder.problem_description}</p>
              </div>
              {workOrder.operational_impact && (
                <div>
                  <span className="text-[10px] uppercase font-mono text-rose-400">Operational Impact:</span>
                  <p className="text-slate-300 mt-0.5 text-xs leading-relaxed">{workOrder.operational_impact}</p>
                </div>
              )}
              {workOrder.instructions && (
                <div>
                  <span className="text-[10px] uppercase font-mono text-cyan-400">Instructions & Safety Notice:</span>
                  <p className="text-slate-300 mt-0.5 text-xs leading-relaxed">{workOrder.instructions}</p>
                </div>
              )}
            </div>
          </div>

          {/* Maintenance Report Details if Available */}
          {workOrder.report && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Technician Maintenance Report Findings
              </h4>
              <div className="p-4 rounded-xl bg-slate-800/60 border border-emerald-500/20 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pb-3 border-b border-slate-700 font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Work Date</span>
                    <span className="text-slate-200 font-semibold">{formatPHTDate(workOrder.report.work_date)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Time Range</span>
                    <span className="text-slate-200 font-semibold">{workOrder.report.start_time} - {workOrder.report.end_time}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Total Labor Hours</span>
                    <span className="text-amber-400 font-bold">{workOrder.report.total_labor_hours} hrs</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Equipment Restored?</span>
                    <span className={workOrder.report.equipment_restored ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {workOrder.report.equipment_restored ? 'YES (Operational)' : 'NO (Pending)'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400">Root Cause:</span>
                    <p className="text-slate-200 mt-0.5 leading-relaxed bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                      {workOrder.report.root_cause || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400">Repair Procedures & Actions:</span>
                    <p className="text-slate-200 mt-0.5 leading-relaxed bg-slate-900/60 p-2 rounded-lg border border-slate-800 whitespace-pre-line">
                      {workOrder.report.repair_procedures || workOrder.report.actions_performed || 'None listed'}
                    </p>
                  </div>
                </div>

                {workOrder.report.follow_up_recommendations && (
                  <div>
                    <span className="text-[10px] font-mono uppercase text-amber-400">Follow-up Recommendations:</span>
                    <p className="text-slate-200 mt-0.5 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                      {workOrder.report.follow_up_recommendations}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Parts Consumed */}
          {workOrder.partsUsed && workOrder.partsUsed.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-emerald-400" /> Spare Parts Issued & Consumed
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-[10px] uppercase font-mono text-slate-400">
                    <tr>
                      <th className="p-2.5">Part Code</th>
                      <th className="p-2.5">Part Name</th>
                      <th className="p-2.5 text-right">Quantity</th>
                      {isAdmin && <th className="p-2.5 text-right">Unit Cost</th>}
                      {isAdmin && <th className="p-2.5 text-right">Total Cost</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono">
                    {workOrder.partsUsed.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="p-2.5 text-amber-400 font-semibold">{p.part_code}</td>
                        <td className="p-2.5 text-slate-200 font-sans">{p.part_name}</td>
                        <td className="p-2.5 text-right">{p.quantity_used} {p.unit}</td>
                        {isAdmin && <td className="p-2.5 text-right">{formatCurrency(p.unit_cost)}</td>}
                        {isAdmin && <td className="p-2.5 text-right text-emerald-400 font-bold">{formatCurrency(p.total_cost)}</td>}
                      </tr>
                    ))}
                    {isAdmin && (
                      <tr className="bg-slate-800/40 font-bold">
                        <td colSpan={4} className="p-2.5 text-right font-sans text-slate-300">Total Parts Cost:</td>
                        <td className="p-2.5 text-right text-emerald-400">{formatCurrency(workOrder.parts_cost)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Attachments (Before & After Photos) */}
          {workOrder.attachments && workOrder.attachments.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-cyan-400" /> Visual Verification & Inspection Scans
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {workOrder.attachments.map((att) => (
                  <div key={att.id} className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="uppercase font-bold text-amber-400">{att.file_category.replace('_', ' ')}</span>
                      <span className="text-slate-400">{att.file_name}</span>
                    </div>
                    <div className="rounded-lg overflow-hidden border border-slate-700/80 bg-slate-950 flex items-center justify-center">
                      <img src={att.file_data} alt={att.file_name} className="w-full h-auto max-h-48 object-contain" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timestamped Status History */}
          {workOrder.statusHistory && workOrder.statusHistory.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <History className="w-4 h-4 text-purple-400" /> Audit Trail & Status Lifecycle Transitions
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {workOrder.statusHistory.map((h) => (
                  <div key={h.id} className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 flex items-start justify-between text-[11px]">
                    <div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-slate-400 uppercase text-[10px]">{h.from_status || 'INIT'}</span>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                        <span className="text-amber-400 font-bold uppercase text-[10px]">{h.to_status}</span>
                        <span className="text-slate-400 font-sans">• by {h.changed_by_name}</span>
                      </div>
                      {h.notes && <p className="text-slate-300 mt-1 text-xs">{h.notes}</p>}
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 shrink-0">
                      {formatPHTDateTime(h.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Role-Specific Workflow Actions */}
        <div className="px-6 py-3.5 bg-slate-850 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] text-slate-400 font-mono">
            Status: <span className={`font-bold ${statusBadge.text}`}>{statusBadge.label}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Technician Actions */}
            {!isAdmin && (
              <>
                {(workOrder.status === 'open' || !workOrder.assigned_technician_id) && (
                  <button
                    onClick={() => onAction && onAction('accept', workOrder)}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
                  >
                    ⚡ Accept & Claim This Repair Job
                  </button>
                )}

                {workOrder.status === 'assigned' && isAssignedTech && (
                  <button
                    onClick={() => onAction && onAction('acknowledge', workOrder)}
                    className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-xs"
                  >
                    Acknowledge Assignment
                  </button>
                )}

                {['acknowledged', 'on_hold'].includes(workOrder.status) && isAssignedTech && (
                  <button
                    onClick={() => onAction && onAction('start', workOrder)}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs shadow-xs"
                  >
                    Start Maintenance Work
                  </button>
                )}

                {workOrder.status === 'in_progress' && isAssignedTech && (
                  <>
                    <button
                      onClick={() => onAction && onAction('hold', workOrder)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700"
                    >
                      Put On Hold
                    </button>
                    <button
                      onClick={() => onAction && onAction('submit_report', workOrder)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs"
                    >
                      Complete & Send Report to Admin →
                    </button>
                  </>
                )}

                {workOrder.status === 'revision_required' && isAssignedTech && (
                  <button
                    onClick={() => onAction && onAction('submit_report', workOrder)}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs"
                  >
                    Revise & Resubmit Report
                  </button>
                )}
              </>
            )}

            {/* Admin Actions */}
            {isAdmin && (
              <>
                {workOrder.status === 'open' && (
                  <button
                    onClick={() => onAction && onAction('assign', workOrder)}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs"
                  >
                    Assign Technician
                  </button>
                )}

                {workOrder.status === 'completed_pending_review' && (
                  <button
                    onClick={() => onAction && onAction('review', workOrder)}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md"
                  >
                    Review & Approve Report
                  </button>
                )}

                {workOrder.status === 'approved' && (
                  <button
                    onClick={() => onAction && onAction('close', workOrder)}
                    className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs"
                  >
                    Close Work Order
                  </button>
                )}
              </>
            )}

            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700"
            >
              Close Window
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
