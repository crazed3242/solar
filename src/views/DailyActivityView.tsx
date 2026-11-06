import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Clock,
  User,
  Wrench,
  Cpu,
  Package,
  Image as ImageIcon,
  CheckCircle2,
  FileDown,
  Filter,
  RefreshCw,
  Search,
  Eye,
  ArrowRight
} from 'lucide-react';
import { DailyActivityItem, User as UserType, Equipment } from '../types';
import { api } from '../services/api';
import { formatPHTDate, formatCurrency, getStatusBadge } from '../utils/formatters';
import { exportReportToPDF, exportReportToExcel } from '../utils/exportUtils';
import { useAuth } from '../context/AuthContext';

interface DailyActivityViewProps {
  onSelectWorkOrder?: (woId: number) => void;
}

export const DailyActivityView: React.FC<DailyActivityViewProps> = ({ onSelectWorkOrder }) => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  // Filters
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTechId, setSelectedTechId] = useState<string>(
    isAdmin ? 'all' : (currentUser ? String(currentUser.id) : 'all')
  );
  const [selectedEquipId, setSelectedEquipId] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Enforce tech filter for non-admin
  useEffect(() => {
    if (!isAdmin && currentUser) {
      setSelectedTechId(String(currentUser.id));
    }
  }, [isAdmin, currentUser]);

  // Data
  const [activities, setActivities] = useState<DailyActivityItem[]>([]);
  const [summary, setSummary] = useState<{
    totalRecords: number;
    totalLaborHours: number;
    completedCount: number;
    pendingReviewCount: number;
  }>({ totalRecords: 0, totalLaborHours: 0, completedCount: 0, pendingReviewCount: 0 });

  const [technicians, setTechnicians] = useState<UserType[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Quick Date Setters
  const setQuickDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  useEffect(() => {
    async function loadMetadata() {
      try {
        const [users, equips] = await Promise.all([api.getUsers(), api.getEquipment()]);
        setTechnicians(users.filter((u) => u.role === 'technician'));
        setEquipmentList(equips);
      } catch (err) {
        console.error('Failed to load activity filters:', err);
      }
    }
    loadMetadata();
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await api.getDailyActivity({
        date: selectedDate || undefined,
        technicianId: selectedTechId,
        equipmentId: selectedEquipId,
        type: selectedType,
        status: selectedStatus,
      });
      setActivities(res.activities);
      setSummary(res.summary);
    } catch (err) {
      console.error('Failed to fetch daily activities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [selectedDate, selectedTechId, selectedEquipId, selectedType, selectedStatus]);

  // Export handlers
  const handleExportPDF = () => {
    const columns = [
      { header: 'Technician', dataKey: 'technician_name' },
      { header: 'Date', dataKey: 'work_date' },
      { header: 'Work Order', dataKey: 'work_order_code' },
      { header: 'Equipment', dataKey: 'equipment_name' },
      { header: 'Type', dataKey: 'maintenance_type' },
      { header: 'Labor (hrs)', dataKey: 'total_labor_hours' },
      { header: 'Status', dataKey: 'work_order_status' },
      { header: 'Result', dataKey: 'final_result' },
    ];
    exportReportToPDF(
      'Daily Technician Maintenance Activity Report',
      columns,
      activities,
      {
        dateRange: selectedDate || 'All Recorded Dates',
        generatedBy: currentUser?.full_name,
      }
    );
  };

  const handleExportExcel = () => {
    const columns = [
      { header: 'Technician', dataKey: 'technician_name' },
      { header: 'Employee ID', dataKey: 'technician_employee_id' },
      { header: 'Work Date', dataKey: 'work_date' },
      { header: 'Work Order Code', dataKey: 'work_order_code' },
      { header: 'Equipment Name', dataKey: 'equipment_name' },
      { header: 'Asset ID', dataKey: 'asset_id' },
      { header: 'Maintenance Type', dataKey: 'maintenance_type' },
      { header: 'Start Time', dataKey: 'start_time' },
      { header: 'End Time', dataKey: 'end_time' },
      { header: 'Total Labor Hours', dataKey: 'total_labor_hours' },
      { header: 'Identified Problem', dataKey: 'identified_problem' },
      { header: 'Repair Procedures', dataKey: 'repair_procedures' },
      { header: 'Final Result', dataKey: 'final_result' },
      { header: 'Work Order Status', dataKey: 'work_order_status' },
    ];
    exportReportToExcel('Daily_Technician_Activity_Report', columns, activities);
  };

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">
              {isAdmin ? 'Daily Maintenance Activity Monitoring' : 'My Daily Maintenance Activity Log'}
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">
              {isAdmin ? 'Section 5 Standard' : 'Technician Field Terminal'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isAdmin
              ? 'Determine exactly who performed maintenance on any date, equipment repaired, parts consumed, and approval status.'
              : 'Review your logged maintenance actions, submitted work order reports, labor hours, and sign-offs.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchActivities}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportPDF}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <FileDown className="w-3.5 h-3.5 text-rose-400" /> Export PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <FileDown className="w-3.5 h-3.5 text-emerald-400" /> Export Excel
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-amber-400" /> Date Selection (PHT):
          </span>
          <button
            onClick={() => setSelectedDate('')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              selectedDate === '' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All Dates
          </button>
          <button
            onClick={() => setQuickDate(0)}
            className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
          >
            Today
          </button>
          <button
            onClick={() => setQuickDate(1)}
            className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
          >
            Yesterday
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs font-mono"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800 text-xs">
          {isAdmin ? (
            <div>
              <label className="block text-[10px] font-mono text-slate-400 mb-1">Technician</label>
              <select
                value={selectedTechId}
                onChange={(e) => setSelectedTechId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
              >
                <option value="all">All Technicians</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name} ({t.employee_id})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-[10px] font-mono text-slate-400 mb-1">Technician (Self)</label>
              <div className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs truncate">
                {currentUser?.full_name} ({currentUser?.employee_id})
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-mono text-slate-400 mb-1">Equipment Asset</label>
            <select
              value={selectedEquipId}
              onChange={(e) => setSelectedEquipId(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
            >
              <option value="all">All Equipment</option>
              {equipmentList.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.asset_id} - {eq.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-slate-400 mb-1">Maintenance Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
            >
              <option value="all">All Types</option>
              <option value="corrective">Corrective</option>
              <option value="preventive">Preventive</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-slate-400 mb-1">Approval Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved & Completed</option>
              <option value="completed_pending_review">Pending Admin Review</option>
              <option value="in_progress">In Progress</option>
              <option value="revision_required">Revision Required</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-850 border border-slate-800">
          <span className="text-[10px] uppercase font-mono text-slate-400 block">Total Activity Logs</span>
          <span className="text-2xl font-bold text-slate-100 mt-1 block">{summary.totalRecords}</span>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Recorded maintenance actions</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-850 border border-slate-800">
          <span className="text-[10px] uppercase font-mono text-slate-400 block">Total Labor Hours</span>
          <span className="text-2xl font-bold text-amber-400 mt-1 block">{summary.totalLaborHours} hrs</span>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Man-hours on chosen period</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-850 border border-slate-800">
          <span className="text-[10px] uppercase font-mono text-slate-400 block">Formally Approved</span>
          <span className="text-2xl font-bold text-emerald-400 mt-1 block">{summary.completedCount}</span>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Signed off by Plant Admin</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-850 border border-slate-800">
          <span className="text-[10px] uppercase font-mono text-slate-400 block">Awaiting Review</span>
          <span className="text-2xl font-bold text-orange-400 mt-1 block">{summary.pendingReviewCount}</span>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Submitted reports in queue</span>
        </div>
      </div>

      {/* Daily Activity Record Feed */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Clock className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-400" />
            Loading maintenance activity records...
          </div>
        ) : activities.length === 0 ? (
          <div className="p-12 rounded-2xl bg-slate-850 border border-dashed border-slate-800 text-center text-slate-500 text-xs">
            No maintenance activities recorded yet. When field technicians complete and submit work order reports, their daily activity timeline will appear here.
          </div>
        ) : (
          activities.map((act) => {
            const statusBadge = getStatusBadge(act.work_order_status);
            return (
              <div
                key={act.report_id}
                className="p-5 rounded-2xl bg-slate-850 border border-slate-800 hover:border-slate-700 transition-all space-y-4 shadow-sm"
              >
                {/* Top Row: Tech info + WO Code + Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold text-sm">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 text-sm">{act.technician_name}</span>
                        <span className="text-xs font-mono text-slate-400">({act.technician_employee_id})</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Date: <strong className="text-slate-200">{formatPHTDate(act.work_date)}</strong></span>
                        <span>•</span>
                        <span>{act.start_time} - {act.end_time} ({act.total_labor_hours} hrs)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 font-mono">
                    <button
                      onClick={() => onSelectWorkOrder && onSelectWorkOrder(act.work_order_id)}
                      className="text-amber-400 font-bold hover:underline text-xs"
                    >
                      {act.work_order_code}
                    </button>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      act.maintenance_type === 'corrective' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {act.maintenance_type}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                      {statusBadge.label}
                    </span>
                  </div>
                </div>

                {/* Equipment Repaired & Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 font-mono">
                    <div className="text-[10px] uppercase text-slate-400">Equipment Repaired / Inspected:</div>
                    <div className="text-slate-200 font-bold text-sm mt-0.5">{act.equipment_name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Asset ID: <strong className="text-amber-400">{act.asset_id}</strong> • {act.plant_section}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="text-[10px] font-mono uppercase text-slate-400">Reported Problem / Symptoms:</div>
                    <p className="text-slate-200 mt-0.5 text-xs line-clamp-2 leading-relaxed">
                      {act.identified_problem}
                    </p>
                  </div>
                </div>

                {/* Work Performed & Root Cause */}
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">
                      Work Performed & Repair Procedures:
                    </span>
                    <div className="mt-1 p-3 rounded-xl bg-slate-900/80 border border-slate-800 font-mono text-[11px] text-slate-300 whitespace-pre-line leading-relaxed">
                      {act.repair_procedures || act.actions_performed}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400">Confirmed Root Cause:</span>
                      <p className="text-slate-300 text-[11px] mt-0.5">{act.root_cause}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400">Final Result & Operational Status:</span>
                      <p className="text-emerald-400 font-medium text-[11px] mt-0.5 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {act.final_result}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Parts Used & Photos Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800 text-xs">
                  {/* Parts */}
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1 mb-1.5">
                      <Package className="w-3.5 h-3.5 text-emerald-400" /> Parts / Materials Consumed:
                    </span>
                    {act.parts && act.parts.length > 0 ? (
                      <div className="space-y-1 font-mono text-[11px]">
                        {act.parts.map((p, pIdx) => (
                          <div key={pIdx} className="flex items-center justify-between p-1.5 rounded bg-slate-900/40 border border-slate-800">
                            <span className="text-slate-300">{p.part_code} - {p.part_name}</span>
                            <span className="text-emerald-400 font-bold">
                              {p.quantity_used} {p.unit}
                              {isAdmin && ` (${formatCurrency(p.total_cost)})`}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-500 font-mono text-[11px]">No spare parts consumed for this task.</span>
                    )}
                  </div>

                  {/* Photos */}
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1 mb-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-cyan-400" /> Verification Photos:
                    </span>
                    {act.attachments && act.attachments.length > 0 ? (
                      <div className="flex items-center gap-2">
                        {act.attachments.map((att) => (
                          <div key={att.id} className="relative group rounded-lg overflow-hidden border border-slate-700 bg-slate-950 w-24 h-16 shrink-0">
                            <img src={att.file_data} alt={att.file_name} className="w-full h-full object-cover" />
                            <span className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[8px] text-center font-mono text-slate-300 truncate px-1">
                              {att.file_category.replace('_', ' ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-500 font-mono text-[11px]">No photos attached.</span>
                    )}
                  </div>
                </div>

                {/* Footer Action Link */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] font-mono">
                  <span className="text-slate-500">
                    Submission: {act.submitted_at}
                  </span>
                  <button
                    onClick={() => onSelectWorkOrder && onSelectWorkOrder(act.work_order_id)}
                    className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                  >
                    Open Complete Work Order #{act.work_order_code} <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
