import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  AlertTriangle,
  History,
  TrendingDown,
  DollarSign,
  Search,
  RefreshCw,
  CheckCircle2,
  Boxes
} from 'lucide-react';
import { PartInventory, InventoryTransaction } from '../types';
import { api } from '../services/api';
import { formatCurrency, formatPHTDate, formatPHTDateTime } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

export const InventoryView: React.FC = () => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const [parts, setParts] = useState<PartInventory[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Receive Stock Modal
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receiveData, setReceiveData] = useState({
    part_id: 1,
    quantity: 10,
    unit_cost: 0,
    notes: 'Restocking shipment received from supplier',
  });

  // Adjust Stock Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustData, setAdjustData] = useState({
    part_id: 1,
    new_quantity: 0,
    notes: 'Physical count audit reconciliation',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, txRes] = await Promise.all([
        api.getInventory(),
        api.getInventoryTransactions(),
      ]);
      setParts(invRes.parts);
      setLowStockCount(invRes.lowStockCount);
      setTransactions(txRes);
    } catch (err) {
      console.error('Failed to load inventory data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReceiveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.receiveInventory({
        ...receiveData,
        performed_by_id: currentUser?.id || 1,
      });
      setShowReceiveModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to receive stock');
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.adjustInventory({
        ...adjustData,
        performed_by_id: currentUser?.id || 1,
      });
      setShowAdjustModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to adjust stock');
    }
  };

  const filteredParts = parts.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.part_code.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">
              Spare Parts & Inventory Management
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
              {isAdmin ? 'ACID Stock Isolation' : 'Warehouse Stock & Parts'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isAdmin
              ? 'Real-time tracking of solar spare parts, fuses, surge arrestors, inverter fans, stock receipts, and work order issues.'
              : 'Look up available solar spare parts, bins, fuses, cables, and current warehouse stock levels.'}
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
                onClick={() => {
                  if (parts.length > 0) {
                    setReceiveData({
                      part_id: parts[0].id,
                      quantity: 10,
                      unit_cost: parts[0].unit_cost,
                      notes: 'Stock received from supplier',
                    });
                  }
                  setShowReceiveModal(true);
                }}
                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
              >
                <Plus className="w-4 h-4" /> Receive Stock
              </button>

              <button
                onClick={() => {
                  if (parts.length > 0) {
                    setAdjustData({
                      part_id: parts[0].id,
                      new_quantity: parts[0].quantity_on_hand,
                      notes: 'Physical audit adjustment',
                    });
                  }
                  setShowAdjustModal(true);
                }}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                Audit / Adjust Stock
              </button>
            </>
          )}
        </div>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockCount > 0 && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <div>
            <strong className="block text-rose-200">
              Low Stock Warning: {lowStockCount} Critical Spare Part(s) Below Minimum Threshold!
            </strong>
            <span className="text-rose-300/80 text-[11px]">
              {isAdmin
                ? 'Reorder parts immediately to avoid equipment downtime and maintenance delays.'
                : 'Notify plant admin or materials coordinator if you require these parts for field repairs.'}
            </span>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 flex items-center justify-between text-xs">
        <div className="relative w-72">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search part name, code, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-hidden focus:border-amber-500"
          />
        </div>

        {isAdmin ? (
          <span className="text-slate-400 font-mono text-xs">
            Total Inventory Value: <strong className="text-emerald-400">
              {formatCurrency(parts.reduce((sum, p) => sum + p.quantity_on_hand * p.unit_cost, 0))}
            </strong>
          </span>
        ) : (
          <span className="text-slate-400 font-mono text-xs">
            Cataloged Parts: <strong className="text-amber-400">{filteredParts.length}</strong> available items
          </span>
        )}
      </div>

      {/* Parts Catalog Table */}
      <div className="overflow-x-auto rounded-2xl bg-slate-850 border border-slate-800 shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/80 text-[10px] uppercase font-mono text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-3.5">Part Code</th>
              <th className="p-3.5">Description & Category</th>
              <th className="p-3.5">Location Bin</th>
              <th className="p-3.5 text-right">Available Stock</th>
              <th className="p-3.5 text-right">Min Threshold</th>
              {isAdmin && <th className="p-3.5 text-right">Unit Cost</th>}
              {isAdmin && <th className="p-3.5 text-right">Valuation</th>}
              <th className="p-3.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filteredParts.map((p) => {
              const isLow = p.quantity_on_hand <= p.min_threshold;
              return (
                <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-3.5 font-mono text-amber-400 font-bold">{p.part_code}</td>
                  <td className="p-3.5">
                    <div className="font-semibold text-slate-200">{p.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{p.category}</div>
                  </td>
                  <td className="p-3.5 font-mono text-slate-400">{p.location_bin || 'Warehouse'}</td>
                  <td className="p-3.5 text-right font-mono font-bold text-slate-100">
                    <span className={isLow ? 'text-rose-400 font-extrabold' : 'text-slate-100'}>
                      {p.quantity_on_hand} {p.unit}
                    </span>
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-400">{p.min_threshold} {p.unit}</td>
                  {isAdmin && (
                    <td className="p-3.5 text-right font-mono text-slate-300">{formatCurrency(p.unit_cost)}</td>
                  )}
                  {isAdmin && (
                    <td className="p-3.5 text-right font-mono text-emerald-400 font-bold">
                      {formatCurrency(p.quantity_on_hand * p.unit_cost)}
                    </td>
                  )}
                  <td className="p-3.5 text-center font-mono">
                    {isLow ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/40">
                        Low Stock
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Adequate
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Inventory Transactions Log (Admin Only) */}
      {isAdmin && (
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <History className="w-4 h-4 text-purple-400" /> Recent Inventory Audit Transactions
          </h3>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-[10px] uppercase font-mono text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Timestamp (PHT)</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Part</th>
                  <th className="p-3 text-right">Quantity</th>
                  <th className="p-3 text-right">Total Cost</th>
                  <th className="p-3">Work Order / Notes</th>
                  <th className="p-3">Performed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-500 font-sans text-xs">
                      No inventory movements recorded yet. Parts issued or received during work orders will be logged here.
                    </td>
                  </tr>
                ) : (
                  transactions.slice(0, 15).map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/40">
                      <td className="p-3 text-slate-400">{formatPHTDateTime(tx.created_at)}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                          tx.transaction_type === 'received' ? 'bg-emerald-500/20 text-emerald-400' :
                          tx.transaction_type === 'issued' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-purple-500/20 text-purple-400'
                        }`}>
                          {tx.transaction_type}
                        </span>
                      </td>
                      <td className="p-3 text-slate-200 font-sans">{tx.part_code} - {tx.part_name}</td>
                      <td className="p-3 text-right font-bold text-slate-100">{tx.quantity}</td>
                      <td className="p-3 text-right text-emerald-400 font-bold">{formatCurrency(tx.total_cost)}</td>
                      <td className="p-3 text-slate-400 font-sans">{tx.work_order_code ? `WO #${tx.work_order_code}` : tx.notes}</td>
                      <td className="p-3 text-slate-300 font-sans">{tx.performed_by_name}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Receive Stock Modal */}
      {showReceiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-xs text-slate-100 space-y-4">
            <h3 className="font-bold text-base">Receive Spare Parts Stock</h3>
            <form onSubmit={handleReceiveStock} className="space-y-3">
              <div>
                <label className="block text-slate-400 font-mono text-[10px] mb-1">Select Part</label>
                <select
                  value={receiveData.part_id}
                  onChange={(e) => {
                    const pid = Number(e.target.value);
                    const part = parts.find((p) => p.id === pid);
                    setReceiveData({
                      ...receiveData,
                      part_id: pid,
                      unit_cost: part ? part.unit_cost : 0,
                    });
                  }}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200"
                >
                  {parts.map((p) => (
                    <option key={p.id} value={p.id}>{p.part_code} - {p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono text-[10px] mb-1">Quantity Received</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={receiveData.quantity}
                    onChange={(e) => setReceiveData({ ...receiveData, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-mono text-[10px] mb-1">Unit Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={receiveData.unit_cost}
                    onChange={(e) => setReceiveData({ ...receiveData, unit_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[10px] mb-1">Notes</label>
                <input
                  type="text"
                  value={receiveData.notes}
                  onChange={(e) => setReceiveData({ ...receiveData, notes: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReceiveModal(false)}
                  className="px-3 py-1.5 bg-slate-800 rounded text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 font-bold rounded text-white"
                >
                  Commit Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-xs text-slate-100 space-y-4">
            <h3 className="font-bold text-base">Adjust Physical Inventory Count</h3>
            <form onSubmit={handleAdjustStock} className="space-y-3">
              <div>
                <label className="block text-slate-400 font-mono text-[10px] mb-1">Select Part</label>
                <select
                  value={adjustData.part_id}
                  onChange={(e) => {
                    const pid = Number(e.target.value);
                    const part = parts.find((p) => p.id === pid);
                    setAdjustData({
                      ...adjustData,
                      part_id: pid,
                      new_quantity: part ? part.quantity_on_hand : 0,
                    });
                  }}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200"
                >
                  {parts.map((p) => (
                    <option key={p.id} value={p.id}>{p.part_code} - {p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[10px] mb-1">New Physical Stock Count</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={adjustData.new_quantity}
                  onChange={(e) => setAdjustData({ ...adjustData, new_quantity: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[10px] mb-1">Reason for Adjustment</label>
                <input
                  type="text"
                  required
                  value={adjustData.notes}
                  onChange={(e) => setAdjustData({ ...adjustData, notes: e.target.value })}
                  placeholder="e.g. End of month physical audit reconciliation"
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-3 py-1.5 bg-slate-800 rounded text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
