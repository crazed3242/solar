import React, { useState } from 'react';
import { X, CheckCircle2, RotateCcw, AlertCircle, FileCheck, ShieldCheck, Image as ImageIcon } from 'lucide-react';
import { WorkOrder } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';

interface AdminReviewModalProps {
  workOrder: WorkOrder;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminReviewModal: React.FC<AdminReviewModalProps> = ({
  workOrder,
  onClose,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const [action, setAction] = useState<'approved' | 'revision_required'>('approved');
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewSrc, setPreviewSrc] = useState<{ src: string; name: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !['admin', 'manager'].includes(currentUser.role)) {
      setError('Only managers or administrators can approve or request revisions.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      await api.reviewReport(workOrder.id, currentUser.id, action, comments);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Review action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-850 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">Review Maintenance Report</h3>
              <p className="text-xs text-slate-400">
                Work Order: <span className="font-mono text-amber-400">{workOrder.work_order_code}</span>
              </p>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Summary info */}
          <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Technician:</span>
              <span className="text-slate-200 font-bold">{workOrder.technician_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Equipment:</span>
              <span className="text-slate-200">{workOrder.equipment_name} ({workOrder.asset_id})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Labor Hours / Cost:</span>
              <span className="text-amber-400">{workOrder.labor_hours} hrs ({formatCurrency(workOrder.labor_cost)})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Parts Cost:</span>
              <span className="text-emerald-400">{formatCurrency(workOrder.parts_cost)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-700/60 pt-1.5">
              <span className="text-slate-300 font-bold">Total Work Order Cost:</span>
              <span className="text-amber-400 font-bold">{formatCurrency(workOrder.total_cost)}</span>
            </div>
          </div>

          {/* Attached Photos Preview */}
          {workOrder.attachments && workOrder.attachments.length > 0 && (
            <div>
              <label className="block text-cyan-400 font-mono text-[10px] uppercase mb-1.5 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" /> Attached Verification Photos ({workOrder.attachments.length})
              </label>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {workOrder.attachments.map((att, idx) => (
                  <button
                    key={att.id || idx}
                    type="button"
                    onClick={() => setPreviewSrc({ src: att.file_data, name: att.file_name })}
                    className="relative rounded-lg overflow-hidden border border-slate-700 bg-slate-950 w-24 h-16 shrink-0 hover:border-cyan-400 transition-colors"
                    title={`Click to view ${att.file_name}`}
                  >
                    <img src={att.file_data} alt={att.file_name} className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 inset-x-0 bg-slate-950/85 text-[8px] text-center font-mono text-slate-300 truncate px-1">
                      {(att.file_category || 'photo').replace('_', ' ')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Choice */}
          <div>
            <label className="block text-slate-400 font-mono text-[11px] mb-1.5">Admin Determination *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAction('approved')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  action === 'approved'
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-400" />
                <div>
                  <div className="font-bold text-xs text-slate-200">Approve Report</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Validates repair quality. Updates equipment status back to "Operational".
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAction('revision_required')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  action === 'revision_required'
                    ? 'bg-rose-500/15 border-rose-500/50 text-rose-300'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <RotateCcw className="w-4 h-4 mt-0.5 text-rose-400" />
                <div>
                  <div className="font-bold text-xs text-slate-200">Revision Required</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Returns report to technician for missing photos, torque specs, or details.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Comments */}
          <div>
            <label className="block text-slate-400 font-mono text-[11px] mb-1">
              Admin Review Comments & Inspection Feedback *
            </label>
            <textarea
              required
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={
                action === 'approved'
                  ? 'e.g. Verified thermal scan and megger insulation tests meet grid interconnection standards. Approved.'
                  : 'e.g. Please attach after-repair thermal photo and specify torque wrench calibration number.'
              }
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs"
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
              className={`px-5 py-2 rounded-lg text-xs font-bold shadow-md transition-all ${
                action === 'approved'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-rose-600 hover:bg-rose-500 text-white'
              }`}
            >
              {loading ? 'Processing...' : action === 'approved' ? 'Confirm Approval' : 'Return for Revision'}
            </button>
          </div>
        </form>
      </div>

      {previewSrc && (
        <div
          className="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewSrc(null)}
        >
          <div className="relative max-w-3xl w-full bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-850 border-b border-slate-800 text-xs font-mono">
              <span className="text-slate-200 truncate">{previewSrc.name}</span>
              <button type="button" onClick={() => setPreviewSrc(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-slate-950 flex items-center justify-center max-h-[80vh]">
              <img src={previewSrc.src} alt={previewSrc.name} className="max-w-full max-h-[70vh] object-contain rounded" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
