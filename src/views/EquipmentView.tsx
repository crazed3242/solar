import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Plus,
  Search,
  Filter,
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
  Layers,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { Equipment, EquipmentCategory } from '../types';
import { api } from '../services/api';
import { formatPHTDate, getEquipmentStatusBadge } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

interface EquipmentViewProps {
  onSelectEquipment: (equipmentId: number) => void;
  onCreateWorkOrderForAsset?: (equipmentId: number) => void;
}

export const EquipmentView: React.FC<EquipmentViewProps> = ({
  onSelectEquipment,
  onCreateWorkOrderForAsset,
}) => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Add Equipment Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAsset, setNewAsset] = useState({
    asset_id: '',
    name: '',
    category: 'Central Inverter' as EquipmentCategory,
    manufacturer: '',
    model: '',
    serial_number: '',
    installation_date: new Date().toISOString().split('T')[0],
    plant_section: 'Block A Array',
    location_description: '',
    rated_capacity: '',
  });

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const data = await api.getEquipment({
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search || undefined,
      });
      setEquipmentList(data);
    } catch (err) {
      console.error('Failed to fetch equipment:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, [categoryFilter, statusFilter, search]);

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createEquipment(newAsset);
      setShowAddModal(false);
      fetchEquipment();
    } catch (err: any) {
      alert(err.message || 'Failed to create asset');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">
              Solar Equipment & Asset Registry
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold">
              50 MWp Plant Assets
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Centralized registry for PV modules, inverters, transformers, combiner boxes, and complete repair histories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchEquipment}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
            >
              <Plus className="w-4 h-4" /> Register New Asset
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search asset ID, name, section..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs w-60 focus:outline-hidden focus:border-amber-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs"
          >
            <option value="all">All Categories</option>
            <option value="Central Inverter">Central Inverter</option>
            <option value="Solar PV Array">Solar PV Array</option>
            <option value="Step-Up Transformer">Step-Up Transformer</option>
            <option value="Combiner Box">Combiner Box</option>
            <option value="Medium Voltage Switchgear">MV Switchgear</option>
            <option value="Solar Tracker Motor">Tracker Motor</option>
            <option value="Weather & Pyranometer Station">Weather Station</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs"
          >
            <option value="all">All Operational Statuses</option>
            <option value="operational">Operational</option>
            <option value="under_maintenance">Under Maintenance</option>
            <option value="faulty">Faulty</option>
            <option value="decommissioned">Decommissioned</option>
          </select>
        </div>

        <span className="text-slate-400 font-mono text-xs">
          Showing <strong className="text-slate-100">{equipmentList.length}</strong> solar assets
        </span>
      </div>

      {/* Equipment Cards Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-xs">
          <Clock className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-400" />
          Loading solar assets...
        </div>
      ) : equipmentList.length === 0 ? (
        <div className="p-16 rounded-2xl bg-slate-850 border border-dashed border-slate-800 text-center text-slate-500 text-xs">
          No equipment matches the search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipmentList.map((eq) => {
            const statusBadge = getEquipmentStatusBadge(eq.operational_status);

            return (
              <div
                key={eq.id}
                onClick={() => onSelectEquipment(eq.id)}
                className="p-5 rounded-2xl bg-slate-850 border border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer space-y-4 shadow-sm group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {eq.asset_id}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1.5 ${statusBadge.bg} ${statusBadge.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                      {statusBadge.label}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-100 text-sm mt-2.5 group-hover:text-amber-300 transition-colors">
                    {eq.name}
                  </h3>

                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {eq.category} • {eq.plant_section}
                  </div>

                  <div className="mt-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5 text-[11px] font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Rated Capacity:</span>
                      <span className="text-slate-200 font-bold">{eq.rated_capacity || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Recorded Failures:</span>
                      <span className={eq.failure_count > 0 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                        {eq.failure_count} breakdowns
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Last Maintenance:</span>
                      <span className="text-slate-300">{formatPHTDate(eq.last_maintenance_date) || 'None'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 flex items-center gap-1">
                    <History className="w-3.5 h-3.5 text-purple-400" /> Full Repair History
                  </span>
                  <span className="text-amber-400 group-hover:underline flex items-center gap-0.5">
                    View Timeline <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Equipment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-xs text-slate-100 space-y-4">
            <h3 className="font-bold text-base">Register Solar Power Plant Asset</h3>
            <form onSubmit={handleCreateAsset} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono text-[10px] mb-1">Asset ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EQ-INV-003"
                    value={newAsset.asset_id}
                    onChange={(e) => setNewAsset({ ...newAsset, asset_id: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-mono text-[10px] mb-1">Category *</label>
                  <select
                    value={newAsset.category}
                    onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value as EquipmentCategory })}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200"
                  >
                    <option value="Central Inverter">Central Inverter</option>
                    <option value="Solar PV Array">Solar PV Array</option>
                    <option value="Step-Up Transformer">Step-Up Transformer</option>
                    <option value="Combiner Box">Combiner Box</option>
                    <option value="Medium Voltage Switchgear">MV Switchgear</option>
                    <option value="Solar Tracker Motor">Solar Tracker Motor</option>
                    <option value="Weather & Pyranometer Station">Weather Station</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[10px] mb-1">Equipment Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Central Inverter Unit 03"
                  value={newAsset.name}
                  onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono text-[10px] mb-1">Plant Section *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Inverter Station 3"
                    value={newAsset.plant_section}
                    onChange={(e) => setNewAsset({ ...newAsset, plant_section: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-mono text-[10px] mb-1">Rated Capacity</label>
                  <input
                    type="text"
                    placeholder="e.g. 2,500 kW"
                    value={newAsset.rated_capacity}
                    onChange={(e) => setNewAsset({ ...newAsset, rated_capacity: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200"
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
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
