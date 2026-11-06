import React, { useState, useEffect } from 'react';
import {
  FileBarChart,
  FileDown,
  Calendar,
  Filter,
  Clock,
  Printer,
  ChevronDown,
  RefreshCw,
  Search,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { api } from '../services/api';
import { exportReportToPDF, exportReportToExcel } from '../utils/exportUtils';
import { formatCurrency, formatPHTDate, formatPHTDateTime } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

export const ReportsView: React.FC = () => {
  const { currentUser } = useAuth();
  const [selectedReportId, setSelectedReportId] = useState<string>('daily_activity');
  const [loading, setLoading] = useState<boolean>(true);
  const [reportData, setReportData] = useState<any>(null);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);

  // 12 Required Reports
  const reportTypes = [
    { id: 'daily_activity', name: '1. Daily Technician Activity Report', desc: 'Who repaired what on each day, procedures, parts, and approval status' },
    { id: 'tech_performance', name: '2. Technician Workload & Performance Report', desc: 'Assigned jobs, completion rates, hours worked, and avg durations' },
    { id: 'corrective_maint', name: '3. Corrective Maintenance Report', desc: 'Breakdowns, symptoms, root causes, corrective actions, and restore times' },
    { id: 'pm_compliance', name: '4. Preventive Maintenance Compliance Report', desc: 'Scheduled vs completed inspections, compliance rate, and findings' },
    { id: 'repair_history', name: '5. Equipment Repair History Report', desc: 'Chronological repair log for all solar power plant assets' },
    { id: 'failure_frequency', name: '6. Equipment Failure Frequency Report', desc: 'MTBF, breakdown count, and recurring failure hotspots' },
    { id: 'downtime_report', name: '7. Equipment Downtime Report', desc: 'Total outage hours and generation loss per plant section' },
    { id: 'parts_consumption', name: '8. Spare Parts Consumption Report', desc: 'Materials used in work orders, stock usage rate, and part expenditures' },
    { id: 'maintenance_cost', name: '9. Maintenance Cost Report (Labor + Parts)', desc: 'Total financial breakdown of technician labor hours and replacement parts' },
    { id: 'overdue_maint', name: '10. Overdue Maintenance Report', desc: 'Preventive tasks and corrective repairs past target due dates' },
    { id: 'wo_status_summary', name: '11. Work Order Status Lifecycle Report', desc: 'Pipeline distribution from open to completed and approved' },
    { id: 'audit_trail', name: '12. System Audit Trail & Accountability Report', desc: 'Authorized status transitions, part deductions, and admin sign-offs' },
  ];

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [repRes, woRes, actRes, auditRes, schedRes] = await Promise.all([
        api.getReportsData(),
        api.getWorkOrders(),
        api.getDailyActivity(),
        api.getAuditLogs({ limit: 100 }),
        api.getSchedules(),
      ]);
      setReportData(repRes);
      setWorkOrders(woRes);
      setActivities(actRes.activities);
      setAuditLogs(auditRes);
      setSchedules(schedRes);
    } catch (err) {
      console.error('Failed to load reports data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Compute table columns and rows dynamically based on selected report
  const getReportPayload = () => {
    const today = new Date().toISOString().split('T')[0];

    switch (selectedReportId) {
      case 'daily_activity':
        return {
          title: 'Daily Technician Maintenance Activity Report',
          columns: [
            { header: 'Technician', dataKey: 'technician_name' },
            { header: 'Work Date', dataKey: 'work_date' },
            { header: 'Work Order', dataKey: 'work_order_code' },
            { header: 'Equipment', dataKey: 'equipment_name' },
            { header: 'Asset ID', dataKey: 'asset_id' },
            { header: 'Labor (hrs)', dataKey: 'total_labor_hours' },
            { header: 'Status', dataKey: 'work_order_status' },
            { header: 'Repair Result', dataKey: 'final_result' },
          ],
          rows: activities,
        };

      case 'tech_performance':
        return {
          title: 'Technician Workload and Performance Report',
          columns: [
            { header: 'Employee ID', dataKey: 'employee_id' },
            { header: 'Technician Name', dataKey: 'full_name' },
            { header: 'Total Assigned', dataKey: 'total_assigned' },
            { header: 'Approved Jobs', dataKey: 'approved_jobs' },
            { header: 'In Progress', dataKey: 'in_progress_jobs' },
            { header: 'Hours Logged', dataKey: 'total_hours_logged' },
            { header: 'Avg Repair Duration', dataKey: 'avg_repair_duration' },
          ],
          rows: (reportData?.techPerformance || []).map((t: any) => ({
            ...t,
            avg_repair_duration: t.avg_repair_duration ? `${Number(t.avg_repair_duration).toFixed(1)} hrs` : '—',
          })),
        };

      case 'corrective_maint':
        return {
          title: 'Corrective Maintenance & Failure Analysis Report',
          columns: [
            { header: 'Work Order', dataKey: 'work_order_code' },
            { header: 'Equipment', dataKey: 'equipment_name' },
            { header: 'Section', dataKey: 'plant_section' },
            { header: 'Priority', dataKey: 'priority' },
            { header: 'Technician', dataKey: 'technician_name' },
            { header: 'Root Cause', dataKey: 'root_cause_confirmed' },
            { header: 'Downtime (hrs)', dataKey: 'downtime_hours' },
            { header: 'Total Cost', dataKey: 'total_cost_formatted' },
            { header: 'Status', dataKey: 'status' },
          ],
          rows: workOrders
            .filter((w) => w.type === 'corrective')
            .map((w) => ({
              ...w,
              technician_name: w.technician_name || 'Unassigned',
              root_cause_confirmed: w.root_cause_confirmed || 'Investigation ongoing',
              total_cost_formatted: formatCurrency(w.total_cost || 0),
            })),
        };

      case 'pm_compliance':
        return {
          title: 'Preventive Maintenance Compliance Report',
          columns: [
            { header: 'Schedule Title', dataKey: 'title' },
            { header: 'Asset ID', dataKey: 'asset_id' },
            { header: 'Equipment Name', dataKey: 'equipment_name' },
            { header: 'Frequency', dataKey: 'interval_type' },
            { header: 'Last Performed', dataKey: 'last_run_date' },
            { header: 'Next Due Date', dataKey: 'next_due_date' },
            { header: 'Assigned Tech', dataKey: 'default_technician_name' },
          ],
          rows: schedules.map((s) => ({
            ...s,
            default_technician_name: s.default_technician_name || 'Unassigned',
            last_run_date: s.last_run_date || 'Initial Cycle',
          })),
        };

      case 'repair_history':
        return {
          title: 'Equipment Repair History Report',
          columns: [
            { header: 'Work Order', dataKey: 'work_order_code' },
            { header: 'Equipment', dataKey: 'equipment_name' },
            { header: 'Asset ID', dataKey: 'asset_id' },
            { header: 'Type', dataKey: 'type' },
            { header: 'Technician', dataKey: 'technician_name' },
            { header: 'Date', dataKey: 'created_at_fmt' },
            { header: 'Total Cost', dataKey: 'total_cost_fmt' },
            { header: 'Status', dataKey: 'status' },
          ],
          rows: workOrders.map((w) => ({
            ...w,
            created_at_fmt: formatPHTDate(w.created_at),
            total_cost_fmt: formatCurrency(w.total_cost || 0),
            technician_name: w.technician_name || 'Unassigned',
          })),
        };

      case 'failure_frequency':
        return {
          title: 'Equipment Failure Frequency & MTBF Hotspots',
          columns: [
            { header: 'Asset ID', dataKey: 'asset_id' },
            { header: 'Equipment Name', dataKey: 'name' },
            { header: 'Category', dataKey: 'category' },
            { header: 'Status', dataKey: 'operational_status' },
            { header: 'Total Breakdowns', dataKey: 'corrective_count' },
            { header: 'Total Downtime', dataKey: 'total_downtime_hours' },
            { header: 'Total Spend', dataKey: 'total_cost_fmt' },
          ],
          rows: (reportData?.equipFailures || []).map((e: any) => ({
            ...e,
            total_cost_fmt: formatCurrency(e.total_maintenance_cost || 0),
          })),
        };

      case 'downtime_report':
        return {
          title: 'Solar Equipment Downtime & Generation Outage Report',
          columns: [
            { header: 'Asset ID', dataKey: 'asset_id' },
            { header: 'Equipment Name', dataKey: 'name' },
            { header: 'Category', dataKey: 'category' },
            { header: 'Recorded Outage Hours', dataKey: 'total_downtime_hours' },
            { header: 'Failure Count', dataKey: 'total_failures' },
            { header: 'Current Status', dataKey: 'operational_status' },
          ],
          rows: reportData?.equipFailures || [],
        };

      case 'parts_consumption':
        return {
          title: 'Spare Parts Consumption & Expenditure Report',
          columns: [
            { header: 'Part Code', dataKey: 'part_code' },
            { header: 'Part Name', dataKey: 'name' },
            { header: 'Category', dataKey: 'category' },
            { header: 'Current Stock', dataKey: 'quantity_on_hand' },
            { header: 'Total Consumed', dataKey: 'total_units_consumed' },
            { header: 'Unit Cost', dataKey: 'unit_cost_fmt' },
            { header: 'Total Spend', dataKey: 'total_spend_fmt' },
          ],
          rows: (reportData?.partsConsumption || []).map((p: any) => ({
            ...p,
            unit_cost_fmt: formatCurrency(p.unit_cost),
            total_spend_fmt: formatCurrency(p.total_spend || 0),
          })),
        };

      case 'maintenance_cost':
        return {
          title: 'Maintenance Cost Report (Labor Hours + Spare Parts)',
          columns: [
            { header: 'Work Order Code', dataKey: 'work_order_code' },
            { header: 'Type', dataKey: 'type' },
            { header: 'Equipment', dataKey: 'equipment_name' },
            { header: 'Technician', dataKey: 'technician_name' },
            { header: 'Labor Hours', dataKey: 'labor_hours' },
            { header: 'Labor Cost ($50/hr)', dataKey: 'labor_cost_fmt' },
            { header: 'Parts Cost', dataKey: 'parts_cost_fmt' },
            { header: 'Grand Total Cost', dataKey: 'total_cost_fmt' },
          ],
          rows: workOrders.map((w) => ({
            ...w,
            labor_cost_fmt: formatCurrency(w.labor_cost || 0),
            parts_cost_fmt: formatCurrency(w.parts_cost || 0),
            total_cost_fmt: formatCurrency(w.total_cost || 0),
            technician_name: w.technician_name || 'Unassigned',
          })),
        };

      case 'overdue_maint':
        return {
          title: 'Overdue Preventive Maintenance & Critical Backlog Report',
          columns: [
            { header: 'Schedule Title', dataKey: 'title' },
            { header: 'Asset ID', dataKey: 'asset_id' },
            { header: 'Equipment Name', dataKey: 'equipment_name' },
            { header: 'Due Date', dataKey: 'next_due_date' },
            { header: 'Assigned Tech', dataKey: 'default_technician_name' },
            { header: 'Status', dataKey: 'status_label' },
          ],
          rows: schedules
            .filter((s) => s.next_due_date < today)
            .map((s) => ({
              ...s,
              default_technician_name: s.default_technician_name || 'Unassigned',
              status_label: 'OVERDUE',
            })),
        };

      case 'wo_status_summary':
        return {
          title: 'Work Order Status Lifecycle Distribution Report',
          columns: [
            { header: 'Work Order', dataKey: 'work_order_code' },
            { header: 'Type', dataKey: 'type' },
            { header: 'Priority', dataKey: 'priority' },
            { header: 'Equipment', dataKey: 'equipment_name' },
            { header: 'Technician', dataKey: 'technician_name' },
            { header: 'Created Date', dataKey: 'created_at_fmt' },
            { header: 'Current Lifecycle Status', dataKey: 'status' },
          ],
          rows: workOrders.map((w) => ({
            ...w,
            created_at_fmt: formatPHTDate(w.created_at),
            technician_name: w.technician_name || 'Unassigned',
          })),
        };

      case 'audit_trail':
      default:
        return {
          title: 'System Audit Trail & Accountability Log Report',
          columns: [
            { header: 'Timestamp (PHT)', dataKey: 'created_at_fmt' },
            { header: 'Action', dataKey: 'action' },
            { header: 'User Email', dataKey: 'user_email' },
            { header: 'Role', dataKey: 'user_role' },
            { header: 'Entity Type', dataKey: 'entity_type' },
            { header: 'Entity ID', dataKey: 'entity_id' },
            { header: 'IP Address', dataKey: 'ip_address' },
          ],
          rows: auditLogs.map((l) => ({
            ...l,
            created_at_fmt: formatPHTDateTime(l.created_at),
          })),
        };
    }
  };

  const payload = getReportPayload();

  const handleExportPDF = () => {
    exportReportToPDF(payload.title, payload.columns, payload.rows, {
      generatedBy: currentUser?.full_name,
    });
  };

  const handleExportExcel = () => {
    exportReportToExcel(payload.title, payload.columns, payload.rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">
              Reports & Operational Analytics
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/30 font-bold">
              12 Audit-Ready Modules
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Searchable, filterable, printable reports with real-time ACID database persistence and PDF / Excel export.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAllData}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <FileDown className="w-4 h-4 text-rose-400" /> Export PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <FileDown className="w-4 h-4 text-emerald-400" /> Export Excel
          </button>
        </div>
      </div>

      {/* Report Selector Grid */}
      <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 space-y-3">
        <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold">
          Select Standard Maintenance Report:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {reportTypes.map((rep) => {
            const isSelected = selectedReportId === rep.id;
            return (
              <button
                key={rep.id}
                onClick={() => setSelectedReportId(rep.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-xs'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <div className="font-bold text-xs truncate text-slate-200">{rep.name}</div>
                <div className="text-[10px] text-slate-500 mt-1 line-clamp-1">{rep.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Report Preview Header */}
      <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 flex items-center justify-between text-xs font-mono">
        <div>
          <span className="text-slate-400 uppercase text-[10px] block">Active Report Preview:</span>
          <span className="text-slate-100 font-bold text-sm">{payload.title}</span>
        </div>
        <div className="text-slate-400">
          Total Records: <strong className="text-amber-400">{payload.rows.length}</strong>
        </div>
      </div>

      {/* Report Data Table Preview */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-xs">
          <Clock className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-400" />
          Querying report data from database...
        </div>
      ) : payload.rows.length === 0 ? (
        <div className="p-16 rounded-2xl bg-slate-850 border border-dashed border-slate-800 text-center text-slate-500 text-xs">
          No records found for this report.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-slate-850 border border-slate-800 shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-[10px] uppercase font-mono text-slate-400 border-b border-slate-800">
              <tr>
                {payload.columns.map((col, idx) => (
                  <th key={idx} className="p-3.5 whitespace-nowrap">{col.header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
              {payload.rows.slice(0, 50).map((row: any, rIdx: number) => (
                <tr key={rIdx} className="hover:bg-slate-800/50 transition-colors">
                  {payload.columns.map((col, cIdx) => {
                    const val = row[col.dataKey];
                    return (
                      <td key={cIdx} className="p-3.5 whitespace-nowrap text-slate-300">
                        {val === null || val === undefined ? '—' : String(val)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {payload.rows.length > 50 && (
            <div className="p-3 text-center text-slate-500 text-xs border-t border-slate-800 font-mono">
              Showing preview of first 50 records. Export to PDF or Excel to view complete dataset ({payload.rows.length} total).
            </div>
          )}
        </div>
      )}
    </div>
  );
};
