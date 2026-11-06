import React, { useState, useEffect } from 'react';
import { X, Wrench, ShieldAlert, Cpu, Calendar, AlertCircle } from 'lucide-react';
import { Equipment, User, MaintenanceType, WorkOrderPriority } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface CreateWorkOrderModalProps {
  onClose: () => void;
  onSuccess: () => void;
  initialType?: MaintenanceType;
  initialEquipmentId?: number;
}

export const CreateWorkOrderModal: React.FC<CreateWorkOrderModalProps> = ({
  onClose,
  onSuccess,
  initialType = 'corrective',
  initialEquipmentId,
}) => {
  const { currentUser } = useAuth();
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form
  const [type, setType] = useState<MaintenanceType>(initialType);
  const [equipmentId, setEquipmentId] = useState<number | ''>(initialEquipmentId || '');
  const [priority, setPriority] = useState<WorkOrderPriority>('medium');
  const [problemDescription, setProblemDescription] = useState('');
  const [operationalImpact, setOperationalImpact] = useState('');
  const [plantSection, setPlantSection] = useState('');
  const [location, setLocation] = useState('');
  const [assignedTechnicianId, setAssignedTechnicianId] = useState<number | ''>('');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [eqRes, usersRes] = await Promise.all([
          api.getEquipment(),
          api.getUsers(),
        ]);
        setEquipmentList(eqRes);
        setTechnicians(usersRes.filter((u) => u.role === 'technician' && u.status === 'active'));

        if (initialEquipmentId) {
          const match = eqRes.find((e) => e.id === initialEquipmentId);
          if (match) {
            setEquipmentId(match.id);
            setPlantSection(match.plant_section);
            setLocation(match.location_description || '');
          }
        } else if (eqRes.length > 0) {
          setEquipmentId(eqRes[0].id);
          setPlantSection(eqRes[0].plant_section);
          setLocation(eqRes[0].location_description || '');
        }
      } catch (err) {
        console.error('Failed to load modal data:', err);
      }
    }
    loadData();
  }, [initialEquipmentId]);

  const handleEquipmentChange = (id: number) => {
    setEquipmentId(id);
    const eq = equipmentList.find((e) => e.id === id);
    if (eq) {
      setPlantSection(eq.plant_section);
      setLocation(eq.location_description || '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipmentId) {
      setError('Please select an equipment asset');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      await api.createWorkOrder({
        type,
        equipment_id: equipmentId,
        problem_description: problemDescription,
        operational_impact: operationalImpact,
        plant_section: plantSection,
        location: location,
        assigned_technician_id: assignedTechnicianId || null,
        created_by_id: currentUser?.id || 1,
        priority,
        scheduled_date: scheduledDate || null,
        due_date: dueDate || null,
        instructions,
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create work order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-850 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${type === 'corrective' ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'}`}>
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">Create New Work Order</h3>
              <p className="text-xs text-slate-400">Initiate corrective repair or preventive maintenance job</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
          {/* Maintenance Type Selector */}
          <div>
            <label className="block text-slate-400 font-mono text-[11px] mb-1.5">Maintenance Type *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('corrective')}
                className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  type === 'corrective'
                    ? 'bg-rose-500/15 border-rose-500/50 text-rose-300'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <ShieldAlert className="w-4 h-4 mt-0.5 text-rose-400" />
                <div>
                  <div className="font-bold text-xs text-slate-200">Corrective Maintenance</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Equipment breakdown, fault alarm, or unexpected failure repair</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setType('preventive')}
                className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  type === 'preventive'
                    ? 'bg-blue-500/15 border-blue-500/50 text-blue-300'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Calendar className="w-4 h-4 mt-0.5 text-blue-400" />
                <div>
                  <div className="font-bold text-xs text-slate-200">Preventive Maintenance</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Scheduled inspection, IV curve tracing, thermal scans & servicing</div>
                </div>
              </button>
            </div>
          </div>

          {/* Equipment Asset Picker */}
          <div>
            <label className="block text-slate-400 font-mono text-[11px] mb-1">Target Solar Equipment *</label>
            <select
              required
              value={equipmentId}
              onChange={(e) => handleEquipmentChange(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs"
            >
              {equipmentList.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.asset_id} — {eq.name} ({eq.category} • {eq.plant_section})
                </option>
              ))}
            </select>
          </div>

          {/* Priority & Technician Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-mono text-[11px] mb-1">Job Priority Level *</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as WorkOrderPriority)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs font-mono"
              >
                <option value="low">Low (Routine)</option>
                <option value="medium">Medium (Standard)</option>
                <option value="high">High (Elevated Output Loss)</option>
                <option value="critical">Critical (Immediate Hazard / Block Offline)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-mono text-[11px] mb-1">
                Technician Assignment (Optional)
              </label>
              <select
                value={assignedTechnicianId}
                onChange={(e) => setAssignedTechnicianId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs"
              >
                <option value="">🚨 Open Area Request (Any technician can accept)</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    Assign specifically to: {t.full_name} ({t.employee_id} • {t.active_workload || 0} active jobs)
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-amber-400/90 mt-1">
                {assignedTechnicianId
                  ? 'This task will be directly assigned to the selected technician.'
                  : 'Broadcasts repair request to the area. Field technicians can view and accept it.'}
              </p>
            </div>
          </div>

          {/* Problem Description */}
          <div>
            <label className="block text-slate-400 font-mono text-[11px] mb-1">
              Problem Description / Maintenance Objective *
            </label>
            <textarea
              required
              rows={3}
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              placeholder="State the observed symptoms, alarm error code, or specific inspection goals..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs"
            />
          </div>

          {/* Operational Impact */}
          <div>
            <label className="block text-slate-400 font-mono text-[11px] mb-1">
              Operational & Generation Impact
            </label>
            <input
              type="text"
              value={operationalImpact}
              onChange={(e) => setOperationalImpact(e.target.value)}
              placeholder="e.g. 50kW array string offline, loss of 250 kWh daily generation"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-mono text-[11px] mb-1">Scheduled Date (PHT)</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-mono text-[11px] mb-1">Target Completion Due Date (PHT)</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs font-mono"
              />
            </div>
          </div>

          {/* Work Instructions & Safety */}
          <div>
            <label className="block text-slate-400 font-mono text-[11px] mb-1">
              Work Instructions & Safety LOTO Guidelines
            </label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Mandatory PPE, arc flash safety boundary, LOTO 1500V DC isolation switch..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs font-mono"
            />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
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
              className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              {loading
                ? 'Submitting...'
                : assignedTechnicianId
                ? 'Dispatch Work Order to Technician'
                : 'Broadcast Repair Request to Area'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
