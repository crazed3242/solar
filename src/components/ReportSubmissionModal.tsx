import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Wrench,
  Package,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Image as ImageIcon,
  CheckSquare
} from 'lucide-react';
import { WorkOrder, PartInventory, ChecklistItem } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';

interface ReportSubmissionModalProps {
  workOrder: WorkOrder;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReportSubmissionModal: React.FC<ReportSubmissionModalProps> = ({
  workOrder,
  onClose,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Available Inventory Parts
  const [inventoryList, setInventoryList] = useState<PartInventory[]>([]);

  // Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const [workDate, setWorkDate] = useState(todayStr);
  const [startTime, setStartTime] = useState('08:30');
  const [endTime, setEndTime] = useState('13:30');
  const [totalLaborHours, setTotalLaborHours] = useState('5.0');
  const [identifiedProblem, setIdentifiedProblem] = useState(workOrder.problem_description || '');
  const [inspectionFindings, setInspectionFindings] = useState('');
  const [rootCause, setRootCause] = useState(workOrder.root_cause_confirmed || '');
  const [repairProcedures, setRepairProcedures] = useState('');
  const [actionsPerformed, setActionsPerformed] = useState('');
  const [finalResult, setFinalResult] = useState('Equipment tested and fully functional. Operational grid export restored.');
  const [equipmentRestored, setEquipmentRestored] = useState(true);
  const [restorationTime, setRestorationTime] = useState(`${todayStr} 13:30:00`);
  const [downtimeHours, setDowntimeHours] = useState('4.5');
  const [defectsDiscovered, setDefectsDiscovered] = useState('');
  const [followUpRecommendations, setFollowUpRecommendations] = useState('');

  // Selected Parts
  const [selectedParts, setSelectedParts] = useState<Array<{ part_id: number; quantity_used: number }>>([]);

  // Checklists (for Preventive Maintenance)
  const [checklistValues, setChecklistValues] = useState<Array<{
    item_key: string;
    item_label: string;
    expected_condition: string;
    recorded_value: string;
    status: 'pass' | 'fail' | 'warning' | 'na';
    notes: string;
  }>>([]);

  // Photos
  const [attachments, setAttachments] = useState<Array<{
    file_name: string;
    file_type: string;
    file_category: 'before_photo' | 'after_photo' | 'document' | 'thermal_scan';
    file_data: string;
    file_size: number;
  }>>([]);

  // Load Inventory & Checklists on mount
  useEffect(() => {
    async function loadData() {
      try {
        const invRes = await api.getInventory();
        setInventoryList(invRes.parts);

        // Prepopulate checklists if preventive
        if (workOrder.type === 'preventive') {
          const templates = await api.getChecklists();
          const matched = templates.find((t) => t.equipment_category === workOrder.equipment_category) || templates[0];
          if (matched && matched.checklist_items) {
            setChecklistValues(
              matched.checklist_items.map((item) => ({
                item_key: item.id,
                item_label: item.label,
                expected_condition: item.expected_condition,
                recorded_value: 'Within standard limit',
                status: 'pass',
                notes: 'Inspected and verified satisfactory',
              }))
            );
          }
        }
      } catch (err) {
        console.error('Failed to load initial report form data:', err);
      }
    }
    loadData();
  }, [workOrder]);

  // Recalculate hours when start/end change
  const handleTimeChange = (start: string, end: string) => {
    setStartTime(start);
    setEndTime(end);
    try {
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;
      if (endMin > startMin) {
        const diffHrs = ((endMin - startMin) / 60).toFixed(2);
        setTotalLaborHours(diffHrs);
      }
    } catch {
      // ignore
    }
  };

  // Add Part Row
  const handleAddPart = () => {
    if (inventoryList.length === 0) return;
    setSelectedParts([...selectedParts, { part_id: inventoryList[0].id, quantity_used: 1 }]);
  };

  const handleUpdatePart = (index: number, part_id: number, quantity_used: number) => {
    const updated = [...selectedParts];
    updated[index] = { part_id, quantity_used };
    setSelectedParts(updated);
  };

  const handleRemovePart = (index: number) => {
    setSelectedParts(selectedParts.filter((_, idx) => idx !== index));
  };

  // Quick Preset Sample Photos
  const handleAddPresetPhoto = (type: 'before' | 'after') => {
    if (type === 'before') {
      const svg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%231E1B4B"/><rect x="40" y="40" width="520" height="320" rx="8" fill="%23312E81" stroke="%23EF4444" stroke-width="4"/><circle cx="300" cy="200" r="45" fill="%23DC2626" opacity="0.9"/><text x="60" y="80" fill="%23F87171" font-family="monospace" font-weight="bold" font-size="18">FAULT INSPECTION: PRE-REPAIR HOTSPOT</text><text x="60" y="110" fill="%23E2E8F0" font-family="sans-serif" font-size="14">Asset: ${workOrder.equipment_name} (${workOrder.asset_id})</text><text x="60" y="340" fill="%23FCA5A5" font-family="sans-serif" font-size="13">Status: HIGH ELECTRICAL RESISTANCE DETECTED (88.4°C)</text></svg>`;
      setAttachments([
        ...attachments,
        {
          file_name: `${workOrder.asset_id}_BeforeRepair_Hotspot.svg`,
          file_type: 'image/svg+xml',
          file_category: 'before_photo',
          file_data: svg,
          file_size: 1024,
        },
      ]);
    } else {
      const svg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%230F172A"/><rect x="40" y="40" width="520" height="320" rx="8" fill="%231E293B" stroke="%2310B981" stroke-width="4"/><circle cx="300" cy="200" r="30" fill="%230284C7" opacity="0.5"/><circle cx="300" cy="200" r="15" fill="%2310B981"/><text x="60" y="80" fill="%2334D399" font-family="monospace" font-weight="bold" font-size="18">VERIFICATION: POST-REPAIR RESTORATION</text><text x="60" y="110" fill="%23E2E8F0" font-family="sans-serif" font-size="14">Asset: ${workOrder.equipment_name} (${workOrder.asset_id})</text><text x="60" y="340" fill="%2386EFAC" font-family="sans-serif" font-size="13">Status: BALANCED TEMPERATURE (34.1°C) - NORMAL OPERATION</text></svg>`;
      setAttachments([
        ...attachments,
        {
          file_name: `${workOrder.asset_id}_AfterRepair_Restored.svg`,
          file_type: 'image/svg+xml',
          file_category: 'after_photo',
          file_data: svg,
          file_size: 1024,
        },
      ]);
    }
  };

  // Custom File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, category: 'before_photo' | 'after_photo' | 'document') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setAttachments([
        ...attachments,
        {
          file_name: file.name,
          file_type: file.type || 'image/jpeg',
          file_category: category,
          file_data: base64,
          file_size: file.size,
        },
      ]);
    };
    reader.readAsDataURL(file);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.submitMaintenanceReport(workOrder.id, {
        technician_id: currentUser?.id,
        work_date: workDate,
        start_time: startTime,
        end_time: endTime,
        total_labor_hours: parseFloat(totalLaborHours) || 0,
        identified_problem: identifiedProblem,
        inspection_findings: inspectionFindings || 'Inspected per standard procedures',
        root_cause: rootCause || 'Mechanical/Thermal wear and tear',
        repair_procedures: repairProcedures,
        actions_performed: actionsPerformed || repairProcedures,
        final_result: finalResult,
        equipment_restored: equipmentRestored ? 1 : 0,
        restoration_time: restorationTime,
        downtime_hours: parseFloat(downtimeHours) || 0,
        defects_discovered: defectsDiscovered || null,
        follow_up_recommendations: followUpRecommendations || null,
        parts_used: selectedParts,
        checklists: checklistValues,
        attachments,
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to submit maintenance report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-850 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-bold text-amber-400">
                Submit Maintenance Report
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-slate-800 border border-slate-700 text-slate-300">
                {workOrder.work_order_code}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Equipment: <strong className="text-slate-200">{workOrder.equipment_name}</strong> ({workOrder.asset_id}) • {workOrder.plant_section}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Section 1: Work Schedule & Labor Hours */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" /> Work Date, Shift Times & Labor Hours
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-800/40 border border-slate-800">
              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">Work Date (PHT) *</label>
                <input
                  type="date"
                  required
                  value={workDate}
                  onChange={(e) => setWorkDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-hidden focus:border-amber-500 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">Start Time *</label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => handleTimeChange(e.target.value, endTime)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-hidden focus:border-amber-500 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">End Time *</label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => handleTimeChange(startTime, e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-hidden focus:border-amber-500 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">Total Labor (Hours) *</label>
                <input
                  type="number"
                  step="0.25"
                  required
                  value={totalLaborHours}
                  onChange={(e) => setTotalLaborHours(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-amber-400 font-bold focus:outline-hidden focus:border-amber-500 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Findings, Root Cause & Repair Procedures */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-cyan-400" /> Maintenance Findings & Procedures
            </h4>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">
                  Identified Problem & Symptoms *
                </label>
                <input
                  type="text"
                  required
                  value={identifiedProblem}
                  onChange={(e) => setIdentifiedProblem(e.target.value)}
                  placeholder="e.g. Blown 1500V DC fuse on String 8, high contact resistance heating"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-hidden focus:border-amber-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono text-[11px] mb-1">
                    Inspection Findings *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={inspectionFindings}
                    onChange={(e) => setInspectionFindings(e.target.value)}
                    placeholder="Describe initial physical, thermal, or electrical findings..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-hidden focus:border-amber-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono text-[11px] mb-1">
                    Confirmed Root Cause *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={rootCause}
                    onChange={(e) => setRootCause(e.target.value)}
                    placeholder="Specific failure mechanism (e.g. torque relaxation on terminal clamp)..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-hidden focus:border-amber-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">
                  Repair Procedures Performed & Corrective Actions *
                </label>
                <textarea
                  rows={4}
                  required
                  value={repairProcedures}
                  onChange={(e) => setRepairProcedures(e.target.value)}
                  placeholder="Step-by-step procedures: (1) LOTO applied, (2) Replaced fuse, (3) Torqued to 4.5 Nm, (4) Megger insulation test..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-hidden focus:border-amber-500 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Spare Parts Usage (ACID Transaction - Deducts Stock) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-400" /> Spare Parts Consumed (Inventory Deduction)
              </h4>
              <button
                type="button"
                onClick={handleAddPart}
                className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-xs flex items-center gap-1 font-medium"
              >
                <Plus className="w-3.5 h-3.5" /> Add Part
              </button>
            </div>

            {selectedParts.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-800/20 border border-dashed border-slate-800 text-center text-slate-500 text-xs">
                No spare parts used for this maintenance task. Click "Add Part" if parts were replaced.
              </div>
            ) : (
              <div className="space-y-2">
                {selectedParts.map((item, idx) => {
                  const part = inventoryList.find((p) => p.id === item.part_id);
                  const isStockInsufficient = part ? item.quantity_used > part.quantity_on_hand : false;

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row items-center gap-3 ${
                        isStockInsufficient
                          ? 'bg-rose-500/10 border-rose-500/40'
                          : 'bg-slate-800/40 border-slate-700/60'
                      }`}
                    >
                      <div className="flex-1 w-full">
                        <label className="block text-[10px] font-mono text-slate-400 mb-0.5">Select Part</label>
                        <select
                          value={item.part_id}
                          onChange={(e) => handleUpdatePart(idx, Number(e.target.value), item.quantity_used)}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs"
                        >
                          {inventoryList.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.part_code} - {p.name} (Stock: {p.quantity_on_hand} {p.unit}
                              {currentUser?.role === 'admin' ? ` @ ${formatCurrency(p.unit_cost)}` : ''})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-full sm:w-32">
                        <label className="block text-[10px] font-mono text-slate-400 mb-0.5">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity_used}
                          onChange={(e) => handleUpdatePart(idx, item.part_id, Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs font-mono"
                        />
                      </div>

                      <div className="w-full sm:w-28 text-right font-mono">
                        {currentUser?.role === 'admin' ? (
                          <>
                            <span className="block text-[10px] text-slate-400">Subtotal</span>
                            <span className="text-emerald-400 font-bold">
                              {part ? formatCurrency(part.unit_cost * item.quantity_used) : '$0.00'}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="block text-[10px] text-slate-400">Bin Location</span>
                            <span className="text-slate-300 font-semibold text-xs truncate block">
                              {part?.location_bin || 'Warehouse'}
                            </span>
                          </>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemovePart(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 4: PM Checklist Inspection Results (if preventive) */}
          {checklistValues.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-purple-400" /> Preventive Maintenance Inspection Checklist
              </h4>

              <div className="space-y-2">
                {checklistValues.map((chk, idx) => (
                  <div key={chk.item_key} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex-1">
                        <span className="font-semibold text-slate-200">{chk.item_label}</span>
                        <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                          Standard condition: {chk.expected_condition}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {(['pass', 'warning', 'fail'] as const).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => {
                              const updated = [...checklistValues];
                              updated[idx].status = st;
                              setChecklistValues(updated);
                            }}
                            className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase transition-all ${
                              chk.status === st
                                ? st === 'pass'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                                  : st === 'warning'
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/50'
                                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Recorded Value / Measurement..."
                        value={chk.recorded_value}
                        onChange={(e) => {
                          const updated = [...checklistValues];
                          updated[idx].recorded_value = e.target.value;
                          setChecklistValues(updated);
                        }}
                        className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Inspection Notes / Observations..."
                        value={chk.notes}
                        onChange={(e) => {
                          const updated = [...checklistValues];
                          updated[idx].notes = e.target.value;
                          setChecklistValues(updated);
                        }}
                        className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 5: Testing Verification, Restoration & Downtime */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Operational Restoration & Downtime
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-800/40 border border-slate-800">
              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">
                  Equipment Restored to Service?
                </label>
                <div className="flex items-center gap-3 mt-1.5">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-200">
                    <input
                      type="radio"
                      name="restored"
                      checked={equipmentRestored}
                      onChange={() => setEquipmentRestored(true)}
                      className="accent-amber-500"
                    />
                    <span>Yes (Operational)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-200">
                    <input
                      type="radio"
                      name="restored"
                      checked={!equipmentRestored}
                      onChange={() => setEquipmentRestored(false)}
                      className="accent-amber-500"
                    />
                    <span>No (Fault persists)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">
                  Equipment Downtime (Hours)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={downtimeHours}
                  onChange={(e) => setDowntimeHours(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">
                  Restoration Date & Time
                </label>
                <input
                  type="text"
                  value={restorationTime}
                  onChange={(e) => setRestorationTime(e.target.value)}
                  placeholder="YYYY-MM-DD HH:MM:SS"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">
                  Additional Defects Discovered During Maintenance
                </label>
                <textarea
                  rows={2}
                  value={defectsDiscovered}
                  onChange={(e) => setDefectsDiscovered(e.target.value)}
                  placeholder="Any other defective components found (e.g. cracked conduit, worn seal)..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">
                  Follow-up Recommendations
                </label>
                <textarea
                  rows={2}
                  value={followUpRecommendations}
                  onChange={(e) => setFollowUpRecommendations(e.target.value)}
                  placeholder="Recommended preventive intervals or replacement parts to reorder..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 6: Photo Verification Attachments */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-cyan-400" /> Photo & Thermal Verification Attachments
              </h4>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddPresetPhoto('before')}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px]"
                >
                  + Add IR Hotspot Scan (Before)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddPresetPhoto('after')}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px]"
                >
                  + Add Restored Scan (After)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Custom File Upload Option */}
              <div className="p-4 rounded-xl border border-dashed border-slate-700 flex flex-col items-center justify-center text-center">
                <Upload className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-xs font-medium text-slate-300">Upload Site Photo from Device</span>
                <span className="text-[10px] text-slate-500 mt-0.5">JPG, PNG, or SVG under 5MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'after_photo')}
                  className="mt-2 text-[10px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-slate-800 file:text-slate-300"
                />
              </div>

              {/* Uploaded List */}
              {attachments.map((att, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img src={att.file_data} alt={att.file_name} className="w-12 h-10 object-cover rounded border border-slate-700" />
                    <div>
                      <span className="block font-medium text-slate-200 text-xs truncate max-w-[180px]">
                        {att.file_name}
                      </span>
                      <span className="text-[10px] text-amber-400 uppercase font-mono">
                        {att.file_category.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                    className="p-1 text-slate-400 hover:text-rose-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Submit Bar */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div className="text-[11px] text-slate-400 font-mono">
              Submission triggers atomic inventory deduction and moves work order to Admin Review queue.
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                {loading ? 'Committing Transaction...' : 'Submit Report for Admin Review'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
