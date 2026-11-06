import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Wrench,
  Clock,
  AlertTriangle,
  DollarSign,
  CalendarCheck,
  CheckCircle2,
  Users,
  ShieldAlert,
  ArrowRight,
  DatabaseZap,
  TrendingUp,
  Sparkles,
  Zap,
  Plus,
  RotateCcw
} from 'lucide-react';
import { api } from '../services/api';
import { WorkOrder, Equipment } from '../types';
import { formatCurrency, formatPHTDate, getStatusBadge, getPriorityBadge } from '../utils/formatters';

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
  onSelectWorkOrder: (woId: number) => void;
  onCreateWorkOrder: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigate,
  onSelectWorkOrder,
  onCreateWorkOrder,
}) => {
  const [reportsData, setReportsData] = useState<any>(null);
  const [pendingApprovals, setPendingApprovals] = useState<WorkOrder[]>([]);
  const [criticalOrders, setCriticalOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [resetting, setResetting] = useState<boolean>(false);

  const loadDashboard = async () => {
    try {
      const [rep, wos] = await Promise.all([
        api.getReportsData(),
        api.getWorkOrders(),
      ]);
      setReportsData(rep);
      setPendingApprovals(wos.filter((w) => w.status === 'completed_pending_review'));
      setCriticalOrders(wos.filter((w) => w.priority === 'critical' && !['approved', 'closed'].includes(w.status)));
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleResetSystem = async () => {
    if (!window.confirm('Are you sure you want to clear all data and start over fresh? This removes all work orders, maintenance reports, activity history, and non-admin accounts so you can study the system from scratch.')) {
      return;
    }
    setResetting(true);
    try {
      await api.resetSystemClean();
      await loadDashboard();
    } catch (err: any) {
      alert(err.message || 'Failed to reset system');
    } finally {
      setResetting(false);
    }
  };

  if (loading || !reportsData) {
    return (
      <div className="p-16 text-center text-slate-400 text-xs">
        <Clock className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-400" />
        Loading Solar Plant Operations Data...
      </div>
    );
  }

  const { kpis, techPerformance, equipFailures } = reportsData;

  return (
    <div className="space-y-6">
      {/* Top Banner / Farm Status */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shrink-0">
            <Zap className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-100">Solar Panel Power Plant Command</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                KIRAHON, MISAMIS ORIENTAL
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Kirahon, Misamis Oriental • Philippine Standard Time (PHT, UTC+8) • Maintenance Command
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('acid_compliance')}
            className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <DatabaseZap className="w-3.5 h-3.5 text-amber-400" /> ACID Verification Suite
          </button>
          <button
            onClick={handleResetSystem}
            disabled={resetting}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-700/50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Wipe operational data and start over clean"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin text-rose-400' : 'text-slate-400'}`} />
            {resetting ? 'Resetting...' : 'Reset to Clean Slate'}
          </button>
          <button
            onClick={onCreateWorkOrder}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Log Maintenance Work
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-850 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono text-slate-400">Total Registered Equipment</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-1">{kpis.totalEquipment} Assets</div>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Inverters, PV Arrays, HV Transformers</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-850 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono text-slate-400">Active Work Orders</span>
            <Wrench className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{kpis.openWorkOrders + kpis.ongoingRepairs}</div>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
            {kpis.ongoingRepairs} in progress • {kpis.openWorkOrders} open/assigned
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-850 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono text-slate-400">Critical Alarms</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{kpis.criticalFailures}</div>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Immediate attention required</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-850 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono text-slate-400">Maintenance Spend</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{formatCurrency(kpis.grandTotalCost)}</div>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Labor + Issued Spare Parts</span>
        </div>
      </div>

      {/* Pending Review Alerts Banner */}
      {pendingApprovals.length > 0 && (
        <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-orange-300">
                {pendingApprovals.length} Maintenance Reports Awaiting Admin Approval
              </span>
              <p className="text-slate-400 mt-0.5">
                Technicians completed on-site repairs and submitted reports with parts used and photos.
              </p>
            </div>
          </div>
          <button
            onClick={() => onSelectWorkOrder(pendingApprovals[0].id)}
            className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs shrink-0 transition-colors"
          >
            Review Report ({pendingApprovals[0].work_order_code}) →
          </button>
        </div>
      )}

      {/* Split Section: Technician Workload vs Critical Failures */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Technician Workload & Performance */}
        <div className="p-5 rounded-2xl bg-slate-850 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" /> Technician Daily Workloads & Completed Jobs
            </h3>
            <button
              onClick={() => onNavigate('daily_activity')}
              className="text-amber-400 hover:text-amber-300 text-xs font-mono font-medium flex items-center gap-1"
            >
              Daily Activity Monitor →
            </button>
          </div>

          <div className="space-y-3">
            {techPerformance.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-center text-slate-500 text-xs">
                No technicians registered yet. Field staff can register via Employee Sign Up.
              </div>
            ) : (
              techPerformance.map((tech: any) => {
                const activeCount = tech.in_progress_jobs || 0;
                const maxScale = 5;
                const pct = Math.min(100, Math.round((activeCount / maxScale) * 100));

                return (
                  <div key={tech.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-100">{tech.full_name}</span>
                        <span className="text-[10px] font-mono text-slate-400 ml-2">({tech.employee_id})</span>
                      </div>
                      <div className="font-mono text-[11px] text-slate-300">
                        <strong className="text-amber-400">{tech.in_progress_jobs}</strong> in progress • <strong className="text-emerald-400">{tech.approved_jobs}</strong> completed
                      </div>
                    </div>

                    {/* Workload Progress Bar */}
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          pct > 75 ? 'bg-rose-500' : pct > 40 ? 'bg-amber-500' : 'bg-cyan-500'
                        }`}
                        style={{ width: `${Math.max(10, pct)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] font-mono text-slate-500">
                      <span>Total Hours Logged: {tech.total_hours_logged || 0} hrs</span>
                      <span>Avg Duration: {tech.avg_repair_duration ? Number(tech.avg_repair_duration).toFixed(1) : '—'} hrs</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Highest Maintenance Equipment & Failures */}
        <div className="p-5 rounded-2xl bg-slate-850 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-400" /> Equipment Maintenance Frequency & Downtime
            </h3>
            <button
              onClick={() => onNavigate('equipment')}
              className="text-amber-400 hover:text-amber-300 text-xs font-mono font-medium flex items-center gap-1"
            >
              View All Assets →
            </button>
          </div>

          <div className="space-y-2.5">
            {equipFailures.every((eq: any) => (eq.total_failures || 0) === 0) ? (
              <div className="p-6 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-center text-slate-500 text-xs">
                All solar power plant equipment operating normally. Zero breakdowns recorded.
              </div>
            ) : (
              equipFailures.slice(0, 4).map((eq: any) => (
                <div
                  key={eq.id}
                  onClick={() => onNavigate('equipment')}
                  className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 transition-colors cursor-pointer flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100">{eq.name}</span>
                      <span className="font-mono text-[10px] text-amber-400">{eq.asset_id}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {eq.category} • {eq.corrective_count} Corrective / {eq.preventive_count} Preventive
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="text-rose-400 font-bold">{eq.total_downtime_hours} hrs downtime</div>
                    <div className="text-[10px] text-slate-400">{formatCurrency(eq.total_maintenance_cost)} spent</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
