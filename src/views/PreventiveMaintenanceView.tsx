import React, { useState, useEffect } from 'react';
import {
  CalendarCheck2,
  Plus,
  Clock,
  Sparkles,
  CheckSquare,
  Wrench,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { MaintenanceSchedule, ChecklistTemplate, Equipment, User } from '../types';
import { api } from '../services/api';
import { formatPHTDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

export const PreventiveMaintenanceView: React.FC = () => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [checklists, setChecklists] = useState<ChecklistTemplate[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Auto Generate Notification
  const [generateMsg, setGenerateMsg] = useState<{ count: number; codes: string[] } | null>(null);

  // Add Schedule Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    title: '',
    equipment_id: 1,
    interval_type: 'monthly' as const,
    checklist_id: 1,
    default_technician_id: '' as any,
    next_due_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [schedRes, chkRes, eqRes, usersRes] = await Promise.all([
        api.getSchedules(),
        api.getChecklists(),
        api.getEquipment(),
        api.getUsers(),
      ]);
      setSchedules(schedRes);
      setChecklists(chkRes);
      setEquipmentList(eqRes);
      setTechnicians(usersRes.filter((u) => u.role === 'technician'));
    } catch (err) {
      console.error('Failed to load PM data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAutoGenerate = async () => {
    try {
      const res = await api.generateDueWorkOrders(currentUser?.id || 1);
      setGenerateMsg({ count: res.generatedCount, codes: res.generatedCodes });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Auto generation failed');
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSchedule(newSchedule);
      setShowAddModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create schedule');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">
              Preventive Maintenance & Inspection Checklists
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/30 font-bold">
              Standardized Cycles
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automate recurring inspection intervals, configure specialized checklists, and spawn work orders upon due dates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {isAdmin && (
            <>
              <button
                onClick={handleAutoGenerate}
                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
              >
                <Sparkles className="w-4 h-4" /> Generate Due Work Orders
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
              >
                <Plus className="w-4 h-4" /> Create Schedule
              </button>
            </>
          )}
        </div>
      </div>

      {/* Auto Generation Notification Banner */}
      {generateMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Generated <strong>{generateMsg.count}</strong> upcoming preventive maintenance work orders: {generateMsg.codes.join(', ') || 'No pending due dates found'}
            </span>
          </div>
          <button onClick={() => setGenerateMsg(null)} className="text-emerald-400 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Recurring Schedules List */}
      <div className="space-y-4">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <CalendarCheck2 className="w-4 h-4 text-amber-400" /> Active Recurring PM Schedules ({schedules.length})
        </h3>

        {loading ? (
          <div className="p-16 text-center text-slate-400 text-xs">
            <Clock className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-400" />
            Loading schedules...
          </div>
        ) : schedules.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-850 border border-dashed border-slate-800 text-center text-slate-500 text-xs">
            No scheduled preventive maintenance routines configured yet. Click "+ Create Schedule" to set up a recurring inspection cycle.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schedules.map((sched) => (
              <div
                key={sched.id}
                className="p-5 rounded-2xl bg-slate-850 border border-slate-800 space-y-3 shadow-sm hover:border-slate-700 transition-all text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-100 text-sm">{sched.title}</h4>
                    <span className="text-[11px] font-mono text-slate-400">
                      Asset: <strong className="text-amber-400">{sched.equipment_name}</strong> ({sched.asset_id})
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    {sched.interval_type}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Checklist Template:</span>
                    <span className="text-slate-200">{sched.checklist_title || 'Standard Checklist'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Default Technician:</span>
                    <span className="text-slate-200">{sched.default_technician_name || 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Last Performed:</span>
                    <span className="text-slate-300">{formatPHTDate(sched.last_run_date) || 'Initial cycle'}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-1">
                    <span className="text-slate-400 font-bold">Next Due Date (PHT):</span>
                    <span className="text-cyan-400 font-bold">{formatPHTDate(sched.next_due_date)}</span>
                  </div>
                </div>

                {sched.notes && (
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Instructions: {sched.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Standardized Checklists Catalog */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-purple-400" /> Equipment-Specific Standardized Inspection Checklists
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {checklists.map((chk) => (
            <div key={chk.id} className="p-5 rounded-2xl bg-slate-850 border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-100">{chk.title}</span>
                <span className="text-[10px] font-mono text-amber-400 uppercase">{chk.equipment_category}</span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {chk.checklist_items?.map((item) => (
                  <div key={item.id} className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px]">
                    <div className="flex items-center justify-between text-slate-200 font-medium">
                      <span>{item.label}</span>
                      {item.is_critical && (
                        <span className="text-[9px] font-mono uppercase text-rose-400 font-bold">Critical</span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                      Target: {item.expected_condition}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Schedule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-xs text-slate-100 space-y-4">
            <h3 className="font-bold text-base">Create Recurring Preventive Maintenance Schedule</h3>
            <form onSubmit={handleCreateSchedule} className="space-y-3">
              <div>
                <label className="block text-slate-400 font-mono text-[10px] mb-1">Schedule Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly Inverter Thermal & Air Intake Inspection"
                  value={newSchedule.title}
                  onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono text-[10px] mb-1">Equipment *</label>
                  <select
                    value={newSchedule.equipment_id}
                    onChange={(e) => setNewSchedule({ ...newSchedule, equipment_id: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200"
                  >
                    {equipmentList.map((eq) => (
                      <option key={eq.id} value={eq.id}>{eq.asset_id} - {eq.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-mono text-[10px] mb-1">Interval Frequency *</label>
                  <select
                    value={newSchedule.interval_type}
                    onChange={(e) => setNewSchedule({ ...newSchedule, interval_type: e.target.value as any })}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono text-[10px] mb-1">Default Technician</label>
                  <select
                    value={newSchedule.default_technician_id}
                    onChange={(e) => setNewSchedule({ ...newSchedule, default_technician_id: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200"
                  >
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>{t.full_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-mono text-[10px] mb-1">Next Due Date (PHT) *</label>
                  <input
                    type="date"
                    required
                    value={newSchedule.next_due_date}
                    onChange={(e) => setNewSchedule({ ...newSchedule, next_due_date: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-slate-800 rounded text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
