// Utility functions for formatting dates, currency, and UI badges

/**
 * Format date in Philippine Standard Time (PHT, UTC+8)
 */
export function formatPHTDateTime(dateInput?: string | null): string {
  if (!dateInput) return '—';
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return dateInput;
    return new Intl.DateTimeFormat('en-PH', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date) + ' PHT';
  } catch {
    return dateInput;
  }
}

export function formatPHTDate(dateInput?: string | null): string {
  if (!dateInput) return '—';
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return dateInput;
    return new Intl.DateTimeFormat('en-PH', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }).format(date);
  } catch {
    return dateInput;
  }
}

/**
 * Currency formatter (USD & PHP representation)
 */
export function formatCurrency(amount: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Work Order Status Badges & Colors
 */
export function getStatusBadge(status: string): { label: string; bg: string; text: string; border: string } {
  switch (status) {
    case 'open':
      return { label: 'Open', bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' };
    case 'assigned':
      return { label: 'Assigned', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' };
    case 'acknowledged':
      return { label: 'Acknowledged', bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' };
    case 'in_progress':
      return { label: 'In Progress', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' };
    case 'on_hold':
      return { label: 'On Hold', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' };
    case 'completed_pending_review':
      return { label: 'Pending Review', bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' };
    case 'revision_required':
      return { label: 'Revision Required', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' };
    case 'approved':
      return { label: 'Approved', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' };
    case 'closed':
      return { label: 'Closed', bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30' };
    case 'cancelled':
      return { label: 'Cancelled', bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/30' };
    default:
      return { label: status, bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' };
  }
}

/**
 * Priority Badges
 */
export function getPriorityBadge(priority: string): { label: string; bg: string; text: string; dot: string } {
  switch (priority) {
    case 'critical':
      return { label: 'Critical', bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-500' };
    case 'high':
      return { label: 'High', bg: 'bg-orange-500/10', text: 'text-orange-400', dot: 'bg-orange-500' };
    case 'medium':
      return { label: 'Medium', bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-500' };
    case 'low':
      return { label: 'Low', bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-500' };
    default:
      return { label: priority, bg: 'bg-slate-500/10', text: 'text-slate-400', dot: 'bg-slate-500' };
  }
}

/**
 * Equipment Operational Status
 */
export function getEquipmentStatusBadge(status: string): { label: string; bg: string; text: string; dot: string } {
  switch (status) {
    case 'operational':
      return { label: 'Operational', bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' };
    case 'under_maintenance':
      return { label: 'Under Maintenance', bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' };
    case 'faulty':
      return { label: 'Faulty', bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-500' };
    case 'decommissioned':
      return { label: 'Decommissioned', bg: 'bg-zinc-500/10', text: 'text-zinc-400', dot: 'bg-zinc-500' };
    default:
      return { label: status, bg: 'bg-slate-500/10', text: 'text-slate-400', dot: 'bg-slate-500' };
  }
}
