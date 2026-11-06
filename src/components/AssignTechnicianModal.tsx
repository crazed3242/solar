import React, { useState, useEffect } from 'react';
import { X, UserCheck, ShieldAlert } from 'lucide-react';
import { WorkOrder, User } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface AssignTechnicianModalProps {
  workOrder: WorkOrder;
  onClose: () => void;
  onSuccess: () => void;
}

export const AssignTechnicianModal: React.FC<AssignTechnicianModalProps> = ({
  workOrder,
  onClose,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [selectedTechId, setSelectedTechId] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTechs() {
      const users = await api.getUsers();
      const techList = users.filter((u) => u.role === 'technician' && u.status === 'active');
      setTechnicians(techList);
      if (techList.length > 0) setSelectedTechId(techList[0].id);
    }
    loadTechs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTechId) {
      setError('Please select a technician');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      await api.assignTechnician(workOrder.id, Number(selectedTechId), currentUser?.id || 1, notes);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Assignment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col text-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-850 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-sm text-slate-100">Assign Maintenance Technician</h3>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 font-mono">
            <div className="text-slate-400 text-[10px]">Work Order</div>
            <div className="text-amber-400 font-bold">{workOrder.work_order_code}</div>
            <div className="text-slate-300 mt-1 truncate">{workOrder.problem_description}</div>
          </div>

          <div>
            <label className="block text-slate-400 font-mono text-[11px] mb-1">Select Technician *</label>
            <select
              value={selectedTechId}
              onChange={(e) => setSelectedTechId(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs"
            >
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name} ({t.employee_id} • {t.active_workload || 0} active jobs)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-mono text-[11px] mb-1">Assignment Notes / Instructions</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Please prioritize today before 14:00 peak solar irradiance..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
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
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all"
            >
              {loading ? 'Assigning...' : 'Assign Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
