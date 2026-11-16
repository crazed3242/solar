import { supabaseService } from './supabaseService';
import {
  User,
  Equipment,
  WorkOrder,
  PartInventory,
  InventoryTransaction,
  MaintenanceSchedule,
  ChecklistTemplate,
  NotificationItem,
  AuditLogItem,
  DailyActivityItem,
  ACIDTestResult,
} from '../types';

export const api = {
  // Auth
  login: async (usernameOrEmail: string, password?: string): Promise<{ user: User }> => {
    // Try Supabase directly first
    try {
      if (await supabaseService.isTableReady('users')) {
        return await supabaseService.login(usernameOrEmail, password);
      }
    } catch (err: any) {
      if (err.code !== 'PGRST205') {
        throw err;
      }
    }

    // Backend proxy fallback
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: usernameOrEmail,
        email: usernameOrEmail,
        password: password || '123456',
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }
    return res.json();
  },

  registerEmployee: async (data: {
    full_name: string;
    email: string;
    password: string;
    role?: 'employee' | 'manager';
    employee_id?: string;
    department?: string;
    phone?: string;
  }): Promise<{ user: User; message: string }> => {
    try {
      if (await supabaseService.isTableReady('users')) {
        return await supabaseService.registerEmployee(data);
      }
    } catch (err: any) {
      if (err.code !== 'PGRST205') {
        throw err;
      }
    }

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Registration failed');
    }
    return res.json();
  },

  switchDemoUser: async (_userId: number): Promise<{ user: User }> => {
    throw new Error('Direct account switching is disabled. Please log out first.');
  },

  getUsersList: async (): Promise<User[]> => {
    try {
      if (await supabaseService.isTableReady('users')) {
        return await supabaseService.getUsersList();
      }
    } catch {}
    const res = await fetch('/api/auth/users-list');
    return res.json();
  },

  // Users
  getUsers: async (): Promise<User[]> => {
    try {
      if (await supabaseService.isTableReady('users')) {
        return await supabaseService.getUsers();
      }
    } catch {}
    const res = await fetch('/api/users');
    return res.json();
  },

  createUser: async (userData: any): Promise<any> => {
    try {
      if (await supabaseService.isTableReady('users')) {
        return await supabaseService.createUser(userData);
      }
    } catch (err: any) {
      if (err.code !== 'PGRST205') throw err;
    }

    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create user');
    }
    return res.json();
  },

  updateUserStatus: async (userId: number, status: 'active' | 'pending' | 'deactivated'): Promise<any> => {
    try {
      if (await supabaseService.isTableReady('users')) {
        return await supabaseService.updateUserStatus(userId, status);
      }
    } catch {}

    const res = await fetch(`/api/users/${userId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  deleteUser: async (userId: number): Promise<any> => {
    try {
      if (await supabaseService.isTableReady('users')) {
        await supabaseService.deleteUser(userId);
        return { success: true };
      }
    } catch (err: any) {
      if (err.code !== 'PGRST205') throw err;
    }

    const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete user');
    }
    return res.json();
  },

  // Equipment
  getEquipment: async (filters?: { category?: string; status?: string; search?: string }): Promise<Equipment[]> => {
    try {
      if (await supabaseService.isTableReady('equipment')) {
        return await supabaseService.getEquipment(filters);
      }
    } catch {}

    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    const res = await fetch(`/api/equipment?${params.toString()}`);
    return res.json();
  },

  getEquipmentHistory: async (id: number): Promise<{
    equipment: Equipment;
    workOrders: WorkOrder[];
    partsUsed: any[];
    totalRepairs: number;
    totalDowntime: number;
  }> => {
    try {
      if (await supabaseService.isTableReady('equipment')) {
        return await supabaseService.getEquipmentHistory(id);
      }
    } catch {}

    const res = await fetch(`/api/equipment/${id}/history`);
    return res.json();
  },

  createEquipment: async (data: any): Promise<any> => {
    try {
      if (await supabaseService.isTableReady('equipment')) {
        return await supabaseService.createEquipment(data);
      }
    } catch (err: any) {
      if (err.code !== 'PGRST205') throw err;
    }

    const res = await fetch('/api/equipment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create equipment');
    }
    return res.json();
  },

  deleteEquipment: async (equipmentId: number): Promise<any> => {
    try {
      if (await supabaseService.isTableReady('equipment')) {
        await supabaseService.deleteEquipment(equipmentId);
        return { success: true };
      }
    } catch (err: any) {
      if (err.code !== 'PGRST205') throw err;
    }

    const res = await fetch(`/api/equipment/${equipmentId}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete equipment');
    }
    return res.json();
  },

  // Work Orders
  getWorkOrders: async (filters?: {
    status?: string;
    type?: string;
    technicianId?: number;
    equipmentId?: number;
    search?: string;
    unassigned?: boolean;
  }): Promise<WorkOrder[]> => {
    try {
      if (await supabaseService.isTableReady('work_orders')) {
        return await supabaseService.getWorkOrders(filters);
      }
    } catch {}

    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.technicianId) params.append('technicianId', String(filters.technicianId));
    if (filters?.equipmentId) params.append('equipmentId', String(filters.equipmentId));
    if (filters?.search) params.append('search', filters.search);
    if (filters?.unassigned) params.append('unassigned', 'true');
    const res = await fetch(`/api/work-orders?${params.toString()}`);
    return res.json();
  },

  getWorkOrder: async (id: number): Promise<WorkOrder> => {
    try {
      if (await supabaseService.isTableReady('work_orders')) {
        return await supabaseService.getWorkOrder(id);
      }
    } catch {}

    const res = await fetch(`/api/work-orders/${id}`);
    if (!res.ok) throw new Error('Work order not found');
    return res.json();
  },

  createWorkOrder: async (data: any): Promise<{ id: number; work_order_code: string }> => {
    try {
      if (await supabaseService.isTableReady('work_orders')) {
        return await supabaseService.createWorkOrder(data);
      }
    } catch (err: any) {
      if (err.code !== 'PGRST205') throw err;
    }

    const res = await fetch('/api/work-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create work order');
    }
    return res.json();
  },

  assignTechnician: async (id: number, technician_id: number, assigned_by_id: number, notes?: string): Promise<any> => {
    try {
      if (await supabaseService.isTableReady('work_orders')) {
        return await supabaseService.assignWorkOrder(id, technician_id, assigned_by_id, notes);
      }
    } catch (err: any) {
      if (err.code !== 'PGRST205') throw err;
    }

    const res = await fetch(`/api/work-orders/${id}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ technician_id, assigned_by_id, notes }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Assignment failed');
    }
    return res.json();
  },

  unassignWorkOrder: async (workOrderId: number, changedById: number, notes?: string): Promise<any> => {
    try {
      if (await supabaseService.isTableReady('work_orders')) {
        return await supabaseService.unassignWorkOrder(workOrderId, changedById, notes);
      }
    } catch (err: any) {
      if (err.code !== 'PGRST205') throw err;
    }

    const res = await fetch(`/api/work-orders/${workOrderId}/unassign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ changed_by_id: changedById, notes }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to remove assignment');
    }
    return res.json();
  },

  deleteWorkOrder: async (workOrderId: number): Promise<any> => {
    try {
      if (await supabaseService.isTableReady('work_orders')) {
        await supabaseService.deleteWorkOrder(workOrderId);
        return { success: true };
      }
    } catch (err: any) {
      if (err.code !== 'PGRST205') throw err;
    }

    const res = await fetch(`/api/work-orders/${workOrderId}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete work order');
    }
    return res.json();
  },

  acceptWorkOrder: async (id: number, technician_id: number): Promise<{ success: boolean; message?: string; work_order_code?: string }> => {
    try {
      if (await supabaseService.isTableReady('work_orders')) {
        await supabaseService.acceptWorkOrder(id, technician_id);
        return { success: true };
      }
    } catch (err: any) {
      if (err.code !== 'PGRST205') throw err;
    }

    const res = await fetch(`/api/work-orders/${id}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ technician_id }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to accept work order');
    }
    return res.json();
  },

  acknowledgeAssignment: async (id: number, technician_id: number): Promise<any> => {
    let supabaseResult = null;
    try {
      if (await supabaseService.isTableReady('work_orders')) {
        supabaseResult = await supabaseService.acknowledgeAssignment(id, technician_id);
      }
    } catch (sbErr) {
      console.warn('Supabase acknowledgeAssignment warning:', sbErr);
    }

    if (supabaseResult) {
      fetch(`/api/work-orders/${id}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technician_id }),
      }).catch(() => {});
      return supabaseResult;
    }

    const res = await fetch(`/api/work-orders/${id}/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ technician_id }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Acknowledgment failed');
    }
    return res.json();
  },

  startWork: async (id: number, technician_id: number): Promise<any> => {
    let supabaseResult = null;
    try {
      if (await supabaseService.isTableReady('work_orders')) {
        supabaseResult = await supabaseService.startWork(id, technician_id);
      }
    } catch (sbErr) {
      console.warn('Supabase startWork warning:', sbErr);
    }

    if (supabaseResult) {
      fetch(`/api/work-orders/${id}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technician_id }),
      }).catch(() => {});
      return supabaseResult;
    }

    const res = await fetch(`/api/work-orders/${id}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ technician_id }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to start work');
    }
    return res.json();
  },

  holdWork: async (id: number, user_id: number, reason: string): Promise<any> => {
    let supabaseResult = null;
    try {
      if (await supabaseService.isTableReady('work_orders')) {
        supabaseResult = await supabaseService.holdWork(id, user_id, reason);
      }
    } catch (sbErr) {
      console.warn('Supabase holdWork warning:', sbErr);
    }

    if (supabaseResult) {
      fetch(`/api/work-orders/${id}/hold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id, reason }),
      }).catch(() => {});
      return supabaseResult;
    }

    const res = await fetch(`/api/work-orders/${id}/hold`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, reason }),
    });
    return res.json();
  },

  submitMaintenanceReport: async (id: number, reportData: any): Promise<any> => {
    let supabaseResult = null;
    let supabaseError: any = null;

    try {
      if (await supabaseService.isTableReady('work_orders')) {
        supabaseResult = await supabaseService.submitMaintenanceReport(id, reportData);
      }
    } catch (e: any) {
      supabaseError = e;
      console.warn('Supabase submitMaintenanceReport warning:', e);
    }

    if (supabaseResult) {
      fetch(`/api/work-orders/${id}/submit-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      }).catch(() => {});
      return supabaseResult;
    }

    const res = await fetch(`/api/work-orders/${id}/submit-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || supabaseError?.message || 'Failed to submit report');
    }
    return res.json();
  },

  reviewReport: async (id: number, reviewer_id: number, action: 'approved' | 'revision_required', review_comments?: string): Promise<any> => {
    let supabaseResult = null;
    let supabaseError: any = null;

    try {
      if (await supabaseService.isTableReady('work_orders')) {
        supabaseResult = await supabaseService.reviewReport(id, reviewer_id, action, review_comments);
      }
    } catch (err: any) {
      supabaseError = err;
      console.warn('Supabase reviewReport warning:', err);
    }

    if (supabaseResult) {
      fetch(`/api/work-orders/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewer_id, action, review_comments }),
      }).catch(() => {});
      return supabaseResult;
    }

    const res = await fetch(`/api/work-orders/${id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewer_id, action, review_comments }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || supabaseError?.message || 'Review failed');
    }
    return res.json();
  },

  closeWorkOrder: async (id: number, user_id: number, notes?: string): Promise<any> => {
    let supabaseResult = null;
    let supabaseError: any = null;

    try {
      if (await supabaseService.isTableReady('work_orders')) {
        supabaseResult = await supabaseService.closeWorkOrder(id, user_id, notes);
      }
    } catch (err: any) {
      supabaseError = err;
      console.warn('Supabase closeWorkOrder warning:', err);
    }

    if (supabaseResult) {
      fetch(`/api/work-orders/${id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id, notes }),
      }).catch(() => {});
      return supabaseResult;
    }

    const res = await fetch(`/api/work-orders/${id}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, notes }),
    });
    return res.json();
  },

  // Daily Activity Monitoring
  getDailyActivity: async (filters?: {
    date?: string;
    technicianId?: string;
    equipmentId?: string;
    type?: string;
    status?: string;
    location?: string;
  }): Promise<{
    activities: DailyActivityItem[];
    summary: {
      totalRecords: number;
      totalLaborHours: number;
      completedCount: number;
      pendingReviewCount: number;
    };
  }> => {
    try {
      if (await supabaseService.isTableReady('maintenance_reports')) {
        return await supabaseService.getDailyActivity(filters);
      }
    } catch {}

    const params = new URLSearchParams();
    if (filters?.date) params.append('date', filters.date);
    if (filters?.technicianId) params.append('technicianId', filters.technicianId);
    if (filters?.equipmentId) params.append('equipmentId', filters.equipmentId);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.location) params.append('location', filters.location);
    const res = await fetch(`/api/daily-activity?${params.toString()}`);
    return res.json();
  },

  // Inventory
  getInventory: async (): Promise<{ parts: PartInventory[]; lowStockCount: number }> => {
    try {
      if (await supabaseService.isTableReady('parts_inventory')) {
        return await supabaseService.getInventory();
      }
    } catch {}

    const res = await fetch('/api/inventory');
    return res.json();
  },

  receiveInventory: async (data: { part_id: number; quantity: number; unit_cost?: number; performed_by_id: number; notes?: string }): Promise<any> => {
    let supabaseResult = null;
    let supabaseError = null;

    try {
      if (await supabaseService.isTableReady('parts_inventory')) {
        supabaseResult = await supabaseService.receiveInventory(data);
      }
    } catch (err: any) {
      supabaseError = err;
      console.warn('Supabase receiveInventory failed:', err);
    }

    try {
      const res = await fetch('/api/inventory/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok && !supabaseResult) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to receive inventory');
      }

      const localResult = res.ok ? await res.json() : null;
      return supabaseResult || localResult;
    } catch (localErr) {
      if (supabaseResult) return supabaseResult;
      throw (supabaseError || localErr);
    }
  },

  adjustInventory: async (data: { part_id: number; new_quantity: number; performed_by_id: number; notes?: string }): Promise<any> => {
    let supabaseResult = null;
    let supabaseError = null;

    try {
      if (await supabaseService.isTableReady('parts_inventory')) {
        supabaseResult = await supabaseService.adjustInventory(data);
      }
    } catch (err: any) {
      supabaseError = err;
      console.warn('Supabase adjustInventory failed:', err);
    }

    try {
      const res = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok && !supabaseResult) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to adjust inventory');
      }

      const localResult = res.ok ? await res.json() : null;
      return supabaseResult || localResult;
    } catch (localErr) {
      if (supabaseResult) return supabaseResult;
      throw (supabaseError || localErr);
    }
  },

  getInventoryTransactions: async (): Promise<InventoryTransaction[]> => {
    try {
      if (await supabaseService.isTableReady('inventory_transactions')) {
        return await supabaseService.getInventoryTransactions();
      }
    } catch {}

    const res = await fetch('/api/inventory/transactions');
    return res.json();
  },

  // Schedules & Checklists
  getSchedules: async (): Promise<MaintenanceSchedule[]> => {
    try {
      if (await supabaseService.isTableReady('maintenance_schedules')) {
        return await supabaseService.getSchedules();
      }
    } catch {}

    const res = await fetch('/api/schedules');
    return res.json();
  },

  createSchedule: async (data: any): Promise<any> => {
    const res = await fetch('/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  generateDueWorkOrders: async (created_by_id: number): Promise<{ generatedCount: number; generatedCodes: string[] }> => {
    const res = await fetch('/api/schedules/generate-work-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ created_by_id }),
    });
    return res.json();
  },

  getChecklists: async (): Promise<ChecklistTemplate[]> => {
    try {
      if (await supabaseService.isTableReady('maintenance_checklists')) {
        return await supabaseService.getChecklists();
      }
    } catch {}

    const res = await fetch('/api/checklists');
    return res.json();
  },

  // Notifications
  getNotifications: async (userId?: number): Promise<NotificationItem[]> => {
    try {
      if (userId && (await supabaseService.isTableReady('notifications'))) {
        return await supabaseService.getNotifications(userId);
      }
    } catch {}

    const url = userId ? `/api/notifications?userId=${userId}` : '/api/notifications';
    const res = await fetch(url);
    return res.json();
  },

  markNotificationRead: async (id: number): Promise<any> => {
    try {
      if (await supabaseService.isTableReady('notifications')) {
        await supabaseService.markNotificationRead(id);
        return { success: true };
      }
    } catch {}

    const res = await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    return res.json();
  },

  markAllNotificationsRead: async (userId: number): Promise<any> => {
    const res = await fetch('/api/notifications/mark-all-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return res.json();
  },

  // Audit Logs
  getAuditLogs: async (filters?: { entityType?: string; action?: string; limit?: number }): Promise<AuditLogItem[]> => {
    try {
      if (await supabaseService.isTableReady('audit_logs')) {
        return await supabaseService.getAuditLogs(filters?.entityType, filters?.action, filters?.limit);
      }
    } catch {}

    const params = new URLSearchParams();
    if (filters?.entityType) params.append('entityType', filters.entityType);
    if (filters?.action) params.append('action', filters.action);
    if (filters?.limit) params.append('limit', String(filters.limit));
    const res = await fetch(`/api/audit-logs?${params.toString()}`);
    return res.json();
  },

  deleteAuditLog: async (id: number): Promise<any> => {
    try {
      if (await supabaseService.isTableReady('audit_logs')) {
        await supabaseService.deleteAuditLog(id);
        return { success: true };
      }
    } catch (err: any) {
      if (err.code !== 'PGRST205') throw err;
    }

    const res = await fetch(`/api/audit-logs/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete audit log');
    return res.json();
  },

  clearAuditLogs: async (action?: string): Promise<any> => {
    try {
      if (await supabaseService.isTableReady('audit_logs')) {
        await supabaseService.clearAuditLogs(action);
        return { success: true };
      }
    } catch (err: any) {
      if (err.code !== 'PGRST205') throw err;
    }

    const url = action && action !== 'all' ? `/api/audit-logs?action=${encodeURIComponent(action)}` : '/api/audit-logs';
    const res = await fetch(url, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to clear audit logs');
    return res.json();
  },

  // Reports
  getReportsData: async (startDate?: string, endDate?: string): Promise<any> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const res = await fetch(`/api/reports/data?${params.toString()}`);
    return res.json();
  },

  // ACID Tests
  runAcidTests: async (): Promise<{
    timestamp: string;
    allPassed: boolean;
    testResults: ACIDTestResult[];
  }> => {
    const res = await fetch('/api/acid-tests/run', { method: 'POST' });
    return res.json();
  },

  // System Clean Reset
  resetSystemClean: async (): Promise<{ success: boolean; message: string }> => {
    const res = await fetch('/api/system/reset-clean', { method: 'POST' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Reset failed');
    }
    return res.json();
  },
};
