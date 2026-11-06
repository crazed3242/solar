import React, { useState, useEffect } from 'react';
import {
  X,
  Cpu,
  Clock,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  History,
  DollarSign,
  Package,
  Layers
} from 'lucide-react';
import { Equipment, WorkOrder } from '../types';
import { api } from '../services/api';
import { formatPHTDate, formatPHTDateTime, formatCurrency, getEquipmentStatusBadge } from '../utils/formatters';

interface EquipmentHistoryModalProps {
  equipmentId: number;
  onClose: () => void;
  onSelectWorkOrder?: (woId: number) => void;
}

export const EquipmentHistoryModal: React.FC<EquipmentHistoryModalProps> = ({
  equipmentId,
  onClose,
  onSelectWorkOrder,
}) => {
  const [data, setData] = useState<{
    equipment: Equipment;
    workOrders: WorkOrder[];
    partsUsed: any[];
    totalRepairs: number;
    totalDowntime: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await api.getEquipmentHistory(equipmentId);
        setData(res);
      } catch (err) {
        console.error('Failed to load equipment history:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [equipmentId]);

  if (loading || !data) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 text-xs flex items-center gap-2">
          <Clock className="w-4 h-4 animate-spin text-amber-400" />
          <span>Loading asset maintenance history...</span>
        </div>
      </div>
    );
  }

  const { equipment, workOrders, partsUsed, totalRepairs, totalDowntime } = data;
  const statusBadge = getEquipmentStatusBadge(equipment.operational_status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-850 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base sm:text-lg font-bold text-slate-100">
                  {equipment.name}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-800 text-amber-400 border border-slate-700">
                  {equipment.asset_id}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1.5 ${statusBadge.bg} ${statusBadge.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                  {statusBadge.label}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {equipment.category} • {equipment.plant_section} ({equipment.location_description})
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Key Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 font-mono">
              <span className="text-[10px] text-slate-400 uppercase block">Total Recorded Failures</span>
              <span className="text-xl font-bold text-amber-400 mt-1 block">{equipment.failure_count}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 font-mono">
              <span className="text-[10px] text-slate-400 uppercase block">Cumulative Downtime</span>
              <span className="text-xl font-bold text-rose-400 mt-1 block">{totalDowntime} hrs</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 font-mono">
              <span className="text-[10px] text-slate-400 uppercase block">Last Maintenance</span>
              <span className="text-xs font-bold text-slate-200 mt-1.5 block">
                {formatPHTDate(equipment.last_maintenance_date) || 'None recorded'}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 font-mono">
              <span className="text-[10px] text-slate-400 uppercase block">Next PM Due (PHT)</span>
              <span className="text-xs font-bold text-cyan-400 mt-1.5 block">
                {formatPHTDate(equipment.next_pm_date) || 'Scheduled'}
              </span>
            </div>
          </div>

          {/* Technical Specifications */}
          <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Asset Engineering Specifications
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-mono">
              <div>
                <span className="text-slate-400 block text-[10px]">Manufacturer:</span>
                <span className="text-slate-200">{equipment.manufacturer || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Model:</span>
                <span className="text-slate-200">{equipment.model || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Serial Number:</span>
                <span className="text-slate-200">{equipment.serial_number || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Rated Capacity:</span>
                <span className="text-amber-400 font-bold">{equipment.rated_capacity || '—'}</span>
              </div>
            </div>
          </div>

          {/* Work Orders Timeline */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <History className="w-4 h-4 text-purple-400" /> Complete Maintenance & Repair History Timeline
            </h4>

            {workOrders.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-800/20 border border-dashed border-slate-800 text-center text-slate-500">
                No recorded maintenance jobs for this equipment asset yet.
              </div>
            ) : (
              <div className="space-y-3">
                {workOrders.map((wo) => (
                  <div
                    key={wo.id}
                    onClick={() => onSelectWorkOrder && onSelectWorkOrder(wo.id)}
                    className="p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700/60 transition-all cursor-pointer space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-amber-400 font-bold text-xs">
                          {wo.work_order_code}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          wo.type === 'corrective' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {wo.type}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 uppercase">
                          {wo.status}
                        </span>
                      </div>

                      <div className="text-[10px] font-mono text-slate-400 flex items-center gap-3">
                        <span>Technician: <strong className="text-slate-200">{wo.technician_name || 'Unassigned'}</strong></span>
                        <span>Date: {formatPHTDate(wo.created_at)}</span>
                      </div>
                    </div>

                    <p className="text-slate-300 text-xs leading-relaxed">
                      {wo.problem_description}
                    </p>

                    {wo.repair_procedures && (
                      <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-slate-300">
                        <span className="text-slate-500 text-[10px] uppercase block">Repair Action:</span>
                        {wo.repair_procedures}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono pt-1 text-slate-400 border-t border-slate-750">
                      <span>Labor: {wo.labor_hours || 0} hrs</span>
                      <span>Downtime: {wo.downtime_hours || 0} hrs</span>
                      <span>Total Cost: <strong className="text-emerald-400">{formatCurrency(wo.total_cost || 0)}</strong></span>
                      <span className="text-cyan-400 hover:underline">View Full Details →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Historical Parts Replaced */}
          {partsUsed.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-400" /> Historical Replaced Parts & Consumables
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-[10px] uppercase font-mono text-slate-400">
                    <tr>
                      <th className="p-2.5">Date (PHT)</th>
                      <th className="p-2.5">Work Order</th>
                      <th className="p-2.5">Part Code</th>
                      <th className="p-2.5">Part Name</th>
                      <th className="p-2.5 text-right">Quantity</th>
                      <th className="p-2.5 text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono">
                    {partsUsed.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="p-2.5 text-slate-400">{formatPHTDate(p.issued_at)}</td>
                        <td className="p-2.5 text-amber-400">{p.work_order_code}</td>
                        <td className="p-2.5 text-slate-300">{p.part_code}</td>
                        <td className="p-2.5 text-slate-200 font-sans">{p.part_name}</td>
                        <td className="p-2.5 text-right">{p.quantity_used}</td>
                        <td className="p-2.5 text-right text-emerald-400">{formatCurrency(p.total_cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-850 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700"
          >
            Close History
          </button>
        </div>
      </div>
    </div>
  );
};
