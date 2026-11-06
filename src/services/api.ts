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
  ACIDTestResult
} from '../types';

export const api = {
  // Auth
  login: async (usernameOrEmail: string, password?: string): Promise<{ user: User }> => {
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
    employee_id?: string;
    department?: string;
    phone?: string;
  }): Promise<{ user: User; message: string }> => {
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
    const res = await fetch('/api/auth/users-list');
    return res.json();
  },

  // Users
  getUsers: async (): Promise<User[]> => {
    const res = await fetch('/api/users');
    return res.json();
  },

  createUser: async (userData: any): Promise<any> => {
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

  updateUserStatus: async (userId: number, status: 'active' | 'deactivated'): Promise<any> => {
    const res = await fetch(`/api/users/${userId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  // Equipment
  getEquipment: async (filters?: { category?: string; status?: string; search?: string }): Promise<Equipment[]> => {
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
    const res = await fetch(`/api/equipment/${id}/history`);
    return res.json();
  },

  createEquipment: async (data: any): Promise<any> => {
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

  // Work Orders
  getWorkOrders: async (filters?: {
    status?: string;
    type?: string;
    technicianId?: number;
    equipmentId?: number;
    search?: string;
    unassigned?: boolean;
  }): Promise<WorkOrder[]> => {
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
    const res = await fetch(`/api/work-orders/${id}`);
    if (!res.ok) throw new Error('Work order not found');
    return res.json();
  },

  createWorkOrder: async (data: any): Promise<{ id: number; work_order_code: string }> => {
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

  acceptWorkOrder: async (id: number, technician_id: number): Promise<{ success: boolean; message?: string; work_order_code?: string }> => {
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
    const res = await fetch(`/api/work-orders/${id}/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ technician_id }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Acknowledgment failed');
    }
    return res.json();
  },

  startWork: async (id: number, technician_id: number): Promise<any> => {
    const res = await fetch(`/api/work-orders/${id}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ technician_id }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to start work');
    }
    return res.json();
  },

  holdWork: async (id: number, user_id: number, reason: string): Promise<any> => {
    const res = await fetch(`/api/work-orders/${id}/hold`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, reason }),
    });
    return res.json();
  },

  submitMaintenanceReport: async (id: number, reportData: any): Promise<any> => {
    const res = await fetch(`/api/work-orders/${id}/submit-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit report');
    }
    return res.json();
  },

  reviewReport: async (id: number, reviewer_id: number, action: 'approved' | 'revision_required', review_comments?: string): Promise<any> => {
    const res = await fetch(`/api/work-orders/${id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewer_id, action, review_comments }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Review failed');
    }
    return res.json();
  },

  closeWorkOrder: async (id: number, user_id: number, notes?: string): Promise<any> => {
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
    const res = await fetch('/api/inventory');
    return res.json();
  },

  receiveInventory: async (data: { part_id: number; quantity: number; unit_cost?: number; performed_by_id: number; notes?: string }): Promise<any> => {
    const res = await fetch('/api/inventory/receive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to receive inventory');
    }
    return res.json();
  },

  adjustInventory: async (data: { part_id: number; new_quantity: number; performed_by_id: number; notes?: string }): Promise<any> => {
    const res = await fetch('/api/inventory/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to adjust inventory');
    }
    return res.json();
  },

  getInventoryTransactions: async (): Promise<InventoryTransaction[]> => {
    const res = await fetch('/api/inventory/transactions');
    return res.json();
  },

  // Schedules & Checklists
  getSchedules: async (): Promise<MaintenanceSchedule[]> => {
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
    const res = await fetch('/api/checklists');
    return res.json();
  },

  // Notifications
  getNotifications: async (userId?: number): Promise<NotificationItem[]> => {
    const url = userId ? `/api/notifications?userId=${userId}` : '/api/notifications';
    const res = await fetch(url);
    return res.json();
  },

  markNotificationRead: async (id: number): Promise<any> => {
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
    const params = new URLSearchParams();
    if (filters?.entityType) params.append('entityType', filters.entityType);
    if (filters?.action) params.append('action', filters.action);
    if (filters?.limit) params.append('limit', String(filters.limit));
    const res = await fetch(`/api/audit-logs?${params.toString()}`);
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
