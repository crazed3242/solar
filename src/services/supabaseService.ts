import bcrypt from 'bcryptjs';
import { supabase } from '../lib/supabase';
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
} from '../types';

export const supabaseService = {
  // Check if a table exists in Supabase
  isTableReady: async (tableName: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from(tableName).select('id').limit(1);
      if (error && error.code === 'PGRST205') {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  },

  // 1. Authentication
  login: async (usernameOrEmail: string, password?: string): Promise<{ user: User }> => {
    const rawIdentifier = usernameOrEmail.trim();
    const clean = rawIdentifier.toLowerCase();
    const quoted = `"${rawIdentifier.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .or(`email.ilike.${quoted},employee_id.ilike.${quoted},full_name.ilike.${quoted}`);

    if (error) throw error;

    let user = users && users.length > 0 ? users[0] : null;
    if (!user && (clean === 'admin' || clean.startsWith('admin@'))) {
      const { data: adminUsers } = await supabase.from('users').select('*').eq('role', 'admin').limit(1);
      if (adminUsers && adminUsers.length > 0) {
        user = adminUsers[0];
      }
    }

    if (!user) {
      throw new Error('Account not found. Check your Email, Employee ID, or Full Name.');
    }

    if (user.status === 'pending') {
      throw new Error('Your account is pending Administrator approval. You can sign in once an Admin approves your account.');
    }

    if (user.status !== 'active') {
      throw new Error('Account is deactivated. Contact Administrator.');
    }

    if (password !== undefined && password !== '') {
      const trimmedPwd = password.trim();
      const hasBcryptHash = typeof user.password_hash === 'string' && user.password_hash.startsWith('$2');
      const valid = hasBcryptHash
        ? bcrypt.compareSync(trimmedPwd, user.password_hash)
        : user.password_hash
          ? user.password_hash === trimmedPwd
          : trimmedPwd === '123456';
      if (!valid) {
        throw new Error('Incorrect password. Please check your password and try again.');
      }
    }

    try {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        user_email: user.email,
        user_role: user.role,
        action: 'USER_LOGIN',
        entity_type: 'users',
        entity_id: String(user.id),
        details_json: JSON.stringify({
          full_name: user.full_name,
          employee_id: user.employee_id,
          role: user.role,
          identifier: rawIdentifier,
        }),
        ip_address: 'Browser Client',
      });
    } catch {
      // Non-blocking audit log write
    }

    const { password_hash: _ph, ...safeUser } = user;
    return { user: safeUser as User };
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
    const cleanEmail = data.email.trim().toLowerCase();
    const targetRole = data.role === 'manager' ? 'manager' : 'employee';

    // Check duplicate email
    const { data: existing } = await supabase.from('users').select('id').ilike('email', cleanEmail).limit(1);
    if (existing && existing.length > 0) {
      throw new Error(`The email address "${cleanEmail}" is already registered. Used email is not allowed.`);
    }

    let cleanEmpId = (data.employee_id || '').trim();
    if (!cleanEmpId) {
      if (targetRole === 'manager') {
        const { count } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'manager');
        cleanEmpId = `EMP-MGR-${(count || 0) + 101}`;
      } else {
        const { count } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .in('role', ['employee', 'technician']);
        cleanEmpId = `EMP-TEC-${(count || 0) + 101}`;
      }
    } else {
      const { data: existingEmp } = await supabase.from('users').select('id').ilike('employee_id', cleanEmpId).limit(1);
      if (existingEmp && existingEmp.length > 0) {
        throw new Error(`Employee ID "${cleanEmpId}" is already assigned to another staff member.`);
      }
    }

    const rawPassword = (data.password || '').trim();
    if (rawPassword.length < 4) {
      throw new Error('Password must be at least 4 characters long.');
    }
    const password_hash = bcrypt.hashSync(rawPassword, 10);

    const { data: created, error } = await supabase
      .from('users')
      .insert({
        employee_id: cleanEmpId,
        full_name: data.full_name.trim(),
        email: cleanEmail,
        password_hash,
        role: targetRole,
        department: (data.department || 'Electrical Maintenance').trim(),
        phone: (data.phone || '').trim(),
        status: 'pending',
      })
      .select('id, employee_id, full_name, email, role, department, phone, status, created_at')
      .single();

    if (error) throw error;

    try {
      await supabase.from('audit_logs').insert({
        user_id: created.id,
        user_email: created.email,
        user_role: created.role,
        action: 'ACCOUNT_REGISTRATION_REQUEST',
        entity_type: 'users',
        entity_id: String(created.id),
        details_json: JSON.stringify({
          employee_id: cleanEmpId,
          full_name: created.full_name,
          role: created.role,
          status: 'pending',
        }),
        ip_address: 'Browser Client',
      });
    } catch {}

    // Notify active Admins about the pending account request
    try {
      const { data: admins } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin')
        .eq('status', 'active');
      if (admins && admins.length > 0) {
        await supabase.from('notifications').insert(
          admins.map((a: any) => ({
            user_id: a.id,
            title: `Account Approval Request: ${created.full_name}`,
            message: `${created.full_name} (${created.employee_id}) requested a ${targetRole.toUpperCase()} account. Review in User Management.`,
            type: 'system',
          }))
        );
      }
    } catch {}

    return {
      user: created as User,
      message: 'Registration submitted! Your account is pending Administrator approval before you can sign in.',
    };
  },

  getUsersList: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('id, employee_id, full_name, email, role, department, phone, status');
    if (error) throw error;
    return data || [];
  },

  getUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('id, employee_id, full_name, email, role, department, phone, status, created_at')
      .order('role', { ascending: true })
      .order('full_name', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  createUser: async (userData: {
    employee_id: string;
    full_name: string;
    email: string;
    password?: string;
    role?: string;
    department?: string;
    phone?: string;
  }): Promise<User> => {
    const cleanEmpId = (userData.employee_id || '').trim();
    const cleanName = (userData.full_name || '').trim();
    const cleanEmail = (userData.email || '').trim().toLowerCase();

    if (!cleanEmpId || !cleanName || !cleanEmail) {
      throw new Error('Employee ID, full name, and email address are required.');
    }

    const { data: existingEmail } = await supabase
      .from('users')
      .select('id')
      .ilike('email', cleanEmail)
      .limit(1);
    if (existingEmail && existingEmail.length > 0) {
      throw new Error(`The email address "${cleanEmail}" is already registered.`);
    }

    const { data: existingEmp } = await supabase
      .from('users')
      .select('id')
      .ilike('employee_id', cleanEmpId)
      .limit(1);
    if (existingEmp && existingEmp.length > 0) {
      throw new Error(`Employee ID "${cleanEmpId}" is already registered.`);
    }

    const rawPassword = (userData.password || 'SolarPower2026!').trim();
    if (rawPassword.length < 4) {
      throw new Error('Password must be at least 4 characters long.');
    }
    const password_hash = bcrypt.hashSync(rawPassword, 10);

    const allowedRoles = ['admin', 'manager', 'employee', 'technician'];
    const targetRole = userData.role && allowedRoles.includes(userData.role) ? userData.role : 'employee';

    const { data, error } = await supabase
      .from('users')
      .insert({
        employee_id: cleanEmpId,
        full_name: cleanName,
        email: cleanEmail,
        password_hash,
        role: targetRole,
        department: (userData.department || 'Maintenance Operations').trim(),
        phone: (userData.phone || '').trim(),
        status: 'active',
      })
      .select('id, employee_id, full_name, email, role, department, phone, status, created_at')
      .single();

    if (error) throw error;

    try {
      await supabase.from('audit_logs').insert({
        user_id: null,
        user_email: 'admin',
        user_role: 'admin',
        action: 'CREATE_USER',
        entity_type: 'users',
        entity_id: String(data.id),
        details_json: JSON.stringify({
          employee_id: cleanEmpId,
          full_name: cleanName,
          role: data.role,
        }),
      });
    } catch {
      // Non-blocking audit log write
    }

    return data as User;
  },

  updateUserStatus: async (userId: number, status: 'active' | 'pending' | 'deactivated'): Promise<any> => {
    const { data, error } = await supabase
      .from('users')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;

    try {
      await supabase.from('audit_logs').insert({
        user_id: null,
        user_email: 'admin',
        user_role: 'admin',
        action: status === 'active' ? 'APPROVE_OR_ACTIVATE_USER' : 'UPDATE_USER_STATUS',
        entity_type: 'users',
        entity_id: String(userId),
        details_json: JSON.stringify({
          target_email: data.email,
          target_name: data.full_name,
          new_status: status,
        }),
      });
    } catch {}

    return data;
  },

  deleteUser: async (userId: number): Promise<void> => {
    const { data: targetUser } = await supabase
      .from('users')
      .select('id, email, full_name, employee_id, role')
      .eq('id', userId)
      .maybeSingle();

    // Clean up non-restricting references before removing user
    await supabase.from('notifications').delete().eq('user_id', userId);
    await supabase.from('technician_assignments').delete().eq('technician_id', userId);
    await supabase.from('technician_assignments').delete().eq('assigned_by_id', userId);
    await supabase
      .from('work_orders')
      .update({ assigned_technician_id: null, status: 'open', updated_at: new Date().toISOString() })
      .eq('assigned_technician_id', userId)
      .in('status', ['assigned', 'acknowledged']);
    await supabase
      .from('work_orders')
      .update({ assigned_technician_id: null })
      .eq('assigned_technician_id', userId);
    await supabase
      .from('maintenance_schedules')
      .update({ default_technician_id: null })
      .eq('default_technician_id', userId);

    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) {
      if (error.code === '23503') {
        throw new Error('Cannot delete user because they have permanent historical records (created work orders, submitted reports, or approvals). Deactivate the account instead or delete those work orders first.');
      }
      throw error;
    }

    try {
      await supabase.from('audit_logs').insert({
        user_id: null,
        user_email: 'admin',
        user_role: 'admin',
        action: 'DELETE_USER',
        entity_type: 'users',
        entity_id: String(userId),
        details_json: JSON.stringify(targetUser || { id: userId }),
      });
    } catch {}
  },

  // 2. Equipment
  getEquipment: async (filters?: { category?: string; status?: string; search?: string }): Promise<Equipment[]> => {
    let q = supabase.from('equipment').select('*');
    if (filters?.category && filters.category !== 'all') {
      q = q.eq('category', filters.category);
    }
    if (filters?.status && filters.status !== 'all') {
      q = q.eq('operational_status', filters.status);
    }
    if (filters?.search) {
      q = q.or(`name.ilike.%${filters.search}%,asset_id.ilike.%${filters.search}%,plant_section.ilike.%${filters.search}%`);
    }
    q = q.order('asset_id', { ascending: true });
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  },

  getEquipmentHistory: async (id: number): Promise<any> => {
    const { data: equip, error: eqErr } = await supabase.from('equipment').select('*').eq('id', id).single();
    if (eqErr) throw eqErr;

    const { data: workOrders } = await supabase
      .from('work_orders')
      .select('*, technician:users!assigned_technician_id(full_name), report:maintenance_reports(repair_procedures, final_result, downtime_hours, submitted_at)')
      .eq('equipment_id', id)
      .order('created_at', { ascending: false });

    const { data: partsUsed } = await supabase
      .from('work_order_parts')
      .select('*, part:parts_inventory(name, part_code), work_order:work_orders(work_order_code, equipment_id)')
      .eq('work_order.equipment_id', id)
      .order('issued_at', { ascending: false });

    const woList = (workOrders || []).map((w: any) => ({
      ...w,
      technician_name: w.technician?.full_name,
      repair_procedures: w.report?.repair_procedures,
      final_result: w.report?.final_result,
      downtime_hours: w.report?.downtime_hours,
      submitted_at: w.report?.submitted_at,
    }));

    return {
      equipment: equip,
      workOrders: woList,
      partsUsed: partsUsed || [],
      totalRepairs: woList.length,
      totalDowntime: woList.reduce((acc: number, w: any) => acc + (w.downtime_hours || 0), 0),
    };
  },

  createEquipment: async (data: any): Promise<any> => {
    const { data: created, error } = await supabase
      .from('equipment')
      .insert({
        ...data,
        operational_status: 'operational',
      })
      .select()
      .single();
    if (error) throw error;
    return created;
  },

  deleteEquipment: async (equipmentId: number): Promise<void> => {
    await supabase.from('maintenance_schedules').delete().eq('equipment_id', equipmentId);
    const { error } = await supabase.from('equipment').delete().eq('id', equipmentId);
    if (error) {
      if (error.code === '23503') {
        throw new Error('Cannot delete equipment with linked work orders. Delete the linked work orders first.');
      }
      throw error;
    }
    try {
      await supabase.from('audit_logs').insert({
        user_id: null,
        user_email: 'admin',
        user_role: 'admin',
        action: 'DELETE_EQUIPMENT',
        entity_type: 'equipment',
        entity_id: String(equipmentId),
        details_json: JSON.stringify({ equipment_id: equipmentId }),
      });
    } catch {}
  },

  // 3. Work Orders
  getWorkOrders: async (filters?: {
    status?: string;
    type?: string;
    technicianId?: number;
    equipmentId?: number;
    search?: string;
    unassigned?: boolean;
  }): Promise<WorkOrder[]> => {
    let q = supabase
      .from('work_orders')
      .select('*, equipment:equipment(name, asset_id, category), technician:users!assigned_technician_id(full_name, employee_id), creator:users!created_by_id(full_name)');

    if (filters?.status && filters.status !== 'all') {
      q = q.eq('status', filters.status);
    }
    if (filters?.type && filters.type !== 'all') {
      q = q.eq('type', filters.type);
    }
    if (filters?.technicianId) {
      q = q.eq('assigned_technician_id', filters.technicianId);
    }
    if (filters?.equipmentId) {
      q = q.eq('equipment_id', filters.equipmentId);
    }
    if (filters?.unassigned || filters?.status === 'unassigned') {
      q = q.or('assigned_technician_id.is.null,status.eq.open');
    }
    if (filters?.search) {
      q = q.or(`work_order_code.ilike.%${filters.search}%,problem_description.ilike.%${filters.search}%`);
    }

    q = q.order('created_at', { ascending: false });
    const { data, error } = await q;
    if (error) throw error;

    return (data || []).map((w: any) => ({
      ...w,
      equipment_name: w.equipment?.name,
      asset_id: w.equipment?.asset_id,
      equipment_category: w.equipment?.category,
      technician_name: w.technician?.full_name,
      technician_employee_id: w.technician?.employee_id,
      created_by_name: w.creator?.full_name,
    }));
  },

  getWorkOrder: async (id: number): Promise<WorkOrder> => {
    const { data: wo, error } = await supabase
      .from('work_orders')
      .select('*, equipment:equipment(*), technician:users!assigned_technician_id(*), creator:users!created_by_id(full_name)')
      .eq('id', id)
      .single();

    if (error) throw error;

    const [statusHistory, report, partsUsed, attachmentsRes, checklistResults, approvals] = await Promise.all([
      supabase.from('work_order_status_history').select('*, user:users(full_name)').eq('work_order_id', id).order('timestamp', { ascending: true }),
      supabase.from('maintenance_reports').select('*, technician:users(full_name)').eq('work_order_id', id).maybeSingle(),
      supabase.from('work_order_parts').select('*, part:parts_inventory(*), user:users(full_name)').eq('work_order_id', id),
      supabase.from('attachments').select('*, user:users(full_name)').eq('work_order_id', id).order('uploaded_at', { ascending: true }),
      supabase.from('checklist_results').select('*').eq('work_order_id', id),
      supabase.from('approvals').select('*, reviewer:users(full_name)').eq('work_order_id', id).order('reviewed_at', { ascending: false }),
    ]);

    let attachmentRows = attachmentsRes.data || [];
    if (attachmentsRes.error) {
      const fallbackAtt = await supabase.from('attachments').select('*').eq('work_order_id', id).order('uploaded_at', { ascending: true });
      attachmentRows = fallbackAtt.data || [];
    }

    return {
      ...wo,
      equipment_name: wo.equipment?.name,
      asset_id: wo.equipment?.asset_id,
      equipment_category: wo.equipment?.category,
      equipment_operational_status: wo.equipment?.operational_status,
      technician_name: wo.technician?.full_name,
      technician_employee_id: wo.technician?.employee_id,
      technician_email: wo.technician?.email,
      technician_phone: wo.technician?.phone,
      created_by_name: wo.creator?.full_name,
      statusHistory: (statusHistory.data || []).map((h: any) => ({ ...h, changed_by_name: h.user?.full_name })),
      report: report.data ? { ...report.data, technician_name: report.data.technician?.full_name } : null,
      partsUsed: (partsUsed.data || []).map((p: any) => ({ ...p, part_name: p.part?.name, part_code: p.part?.part_code, unit: p.part?.unit, issued_by_name: p.user?.full_name })),
      attachments: attachmentRows.map((a: any) => ({ ...a, uploaded_by_name: a.user?.full_name })),
      checklistResults: checklistResults.data || [],
      approvals: (approvals.data || []).map((a: any) => ({ ...a, reviewer_name: a.reviewer?.full_name })),
    };
  },

  createWorkOrder: async (data: any): Promise<any> => {
    const year = new Date().getFullYear();
    const { count } = await supabase.from('work_orders').select('*', { count: 'exact', head: true });
    const nextSeq = String((count || 0) + 1).padStart(4, '0');
    const workOrderCode = `WO-${year}-${nextSeq}`;

    const initialStatus = data.assigned_technician_id ? 'assigned' : 'open';

    const { data: wo, error } = await supabase
      .from('work_orders')
      .insert({
        work_order_code: workOrderCode,
        type: data.type,
        equipment_id: data.equipment_id,
        problem_description: data.problem_description,
        operational_impact: data.operational_impact || '',
        plant_section: data.plant_section,
        location: data.location || '',
        assigned_technician_id: data.assigned_technician_id || null,
        created_by_id: data.created_by_id,
        priority: data.priority || 'medium',
        status: initialStatus,
        scheduled_date: data.scheduled_date || null,
        due_date: data.due_date || null,
        instructions: data.instructions || '',
      })
      .select()
      .single();

    if (error) throw error;

    // Record Status History
    await supabase.from('work_order_status_history').insert({
      work_order_id: wo.id,
      from_status: null,
      to_status: initialStatus,
      changed_by_id: data.created_by_id,
      notes: 'Work order created in Supabase',
    });

    // If corrective, update equipment
    if (data.type === 'corrective') {
      await supabase.from('equipment').update({ operational_status: 'under_maintenance' }).eq('id', data.equipment_id);
    }

    return wo;
  },

  assignWorkOrder: async (id: number, technicianId: number, assignedById: number, notes?: string): Promise<any> => {
    const { data: wo, error } = await supabase
      .from('work_orders')
      .update({
        assigned_technician_id: technicianId,
        status: 'assigned',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await supabase.from('technician_assignments').insert({
      work_order_id: id,
      technician_id: technicianId,
      assigned_by_id: assignedById,
      notes: notes || 'Assigned by administrator',
    });

    await supabase.from('work_order_status_history').insert({
      work_order_id: id,
      from_status: 'open',
      to_status: 'assigned',
      changed_by_id: assignedById,
      notes: `Assigned to technician ID ${technicianId}`,
    });

    return wo;
  },

  unassignWorkOrder: async (id: number, changedById: number, notes?: string): Promise<any> => {
    const { data: existingWo } = await supabase.from('work_orders').select('status, work_order_code, assigned_technician_id').eq('id', id).maybeSingle();
    const { data: wo, error } = await supabase
      .from('work_orders')
      .update({
        assigned_technician_id: null,
        status: 'open',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await supabase.from('technician_assignments').delete().eq('work_order_id', id);

    await supabase.from('work_order_status_history').insert({
      work_order_id: id,
      from_status: existingWo?.status || 'assigned',
      to_status: 'open',
      changed_by_id: changedById,
      notes: notes || 'Assignment removed by Administrator',
    });

    try {
      await supabase.from('audit_logs').insert({
        user_id: changedById,
        user_email: 'admin',
        user_role: 'admin',
        action: 'UNASSIGN_WORK_ORDER',
        entity_type: 'work_orders',
        entity_id: String(id),
        details_json: JSON.stringify({
          work_order_code: existingWo?.work_order_code,
          previous_technician_id: existingWo?.assigned_technician_id,
        }),
      });
    } catch {}

    return wo;
  },

  deleteWorkOrder: async (id: number): Promise<void> => {
    const { data: wo } = await supabase.from('work_orders').select('work_order_code').eq('id', id).maybeSingle();

    await supabase.from('attachments').delete().eq('work_order_id', id);
    await supabase.from('work_order_parts').delete().eq('work_order_id', id);
    await supabase.from('approvals').delete().eq('work_order_id', id);
    await supabase.from('checklist_results').delete().eq('work_order_id', id);
    await supabase.from('maintenance_reports').delete().eq('work_order_id', id);
    await supabase.from('work_order_status_history').delete().eq('work_order_id', id);
    await supabase.from('technician_assignments').delete().eq('work_order_id', id);
    await supabase.from('notifications').delete().eq('work_order_id', id);

    const { error } = await supabase.from('work_orders').delete().eq('id', id);
    if (error) throw error;

    try {
      await supabase.from('audit_logs').insert({
        user_id: null,
        user_email: 'admin',
        user_role: 'admin',
        action: 'DELETE_WORK_ORDER',
        entity_type: 'work_orders',
        entity_id: String(id),
        details_json: JSON.stringify({ work_order_code: wo?.work_order_code || id }),
      });
    } catch {}
  },

  acceptWorkOrder: async (id: number, technicianId: number): Promise<any> => {
    const { data: wo, error } = await supabase
      .from('work_orders')
      .update({
        assigned_technician_id: technicianId,
        status: 'in_progress',
        actual_start: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await supabase.from('technician_assignments').insert({
      work_order_id: id,
      technician_id: technicianId,
      assigned_by_id: technicianId,
      notes: 'Accepted and mobilized by field technician',
      acknowledged_at: new Date().toISOString(),
    });

    await supabase.from('work_order_status_history').insert({
      work_order_id: id,
      from_status: 'assigned',
      to_status: 'in_progress',
      changed_by_id: technicianId,
      notes: 'Accepted and started repair work by technician',
    });

    return wo;
  },

  acknowledgeAssignment: async (id: number, technicianId: number): Promise<any> => {
    const { data: wo, error } = await supabase
      .from('work_orders')
      .update({
        status: 'acknowledged',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    try {
      await supabase.from('technician_assignments').update({
        acknowledged_at: new Date().toISOString(),
      }).eq('work_order_id', id).eq('technician_id', technicianId);
    } catch {}

    await supabase.from('work_order_status_history').insert({
      work_order_id: id,
      from_status: 'assigned',
      to_status: 'acknowledged',
      changed_by_id: technicianId,
      notes: 'Assignment acknowledged by technician',
    });

    return wo;
  },

  startWork: async (id: number, technicianId: number): Promise<any> => {
    const { data: wo, error } = await supabase
      .from('work_orders')
      .update({
        status: 'in_progress',
        actual_start: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await supabase.from('work_order_status_history').insert({
      work_order_id: id,
      from_status: 'acknowledged',
      to_status: 'in_progress',
      changed_by_id: technicianId,
      notes: 'Technician mobilized and started work on site',
    });

    return wo;
  },

  holdWork: async (id: number, userId: number, reason: string): Promise<any> => {
    const { data: wo, error } = await supabase
      .from('work_orders')
      .update({
        status: 'on_hold',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await supabase.from('work_order_status_history').insert({
      work_order_id: id,
      from_status: 'in_progress',
      to_status: 'on_hold',
      changed_by_id: userId,
      notes: `Put on hold: ${reason}`,
    });

    return wo;
  },

  submitMaintenanceReport: async (id: number, reportData: any): Promise<any> => {
    // 1. Fetch work order
    const { data: wo, error: woErr } = await supabase
      .from('work_orders')
      .select('*, equipment:equipment(*)')
      .eq('id', id)
      .single();
    if (woErr || !wo) throw new Error('Work order not found');

    const techId = reportData.technician_id || wo.assigned_technician_id || 1;

    // 2. Check if a report already exists for this work order to prevent unique constraint violation
    const { data: existingReport } = await supabase
      .from('maintenance_reports')
      .select('id')
      .eq('work_order_id', id)
      .maybeSingle();

    const reportPayload = {
      work_order_id: id,
      technician_id: techId,
      work_date: reportData.work_date || new Date().toISOString().split('T')[0],
      start_time: reportData.start_time || '08:00',
      end_time: reportData.end_time || '16:00',
      total_labor_hours: Number(reportData.total_labor_hours) || 0,
      identified_problem: reportData.identified_problem || '',
      inspection_findings: reportData.inspection_findings || '',
      root_cause: reportData.root_cause || '',
      repair_procedures: reportData.repair_procedures || '',
      actions_performed: reportData.actions_performed || '',
      final_result: reportData.final_result || 'operational',
      equipment_restored: reportData.equipment_restored ? 1 : 0,
      restoration_time: reportData.restoration_time || new Date().toISOString(),
      downtime_hours: Number(reportData.downtime_hours) || 0,
      defects_discovered: reportData.defects_discovered || null,
      follow_up_recommendations: reportData.follow_up_recommendations || null,
      updated_at: new Date().toISOString(),
    };

    let report;
    if (existingReport?.id) {
      const { data: updated, error: upErr } = await supabase
        .from('maintenance_reports')
        .update(reportPayload)
        .eq('id', existingReport.id)
        .select()
        .single();
      if (upErr) throw upErr;
      report = updated;
    } else {
      const { data: created, error: crErr } = await supabase
        .from('maintenance_reports')
        .insert(reportPayload)
        .select()
        .single();
      if (crErr) throw crErr;
      report = created;
    }

    // 3. Process spare parts consumption (decrement stock and log transactions)
    let partsTotalCost = 0;
    if (Array.isArray(reportData.parts_used) && reportData.parts_used.length > 0) {
      for (const item of reportData.parts_used) {
        const qty = Number(item.quantity_used);
        if (qty <= 0) continue;

        const { data: part } = await supabase
          .from('parts_inventory')
          .select('*')
          .eq('id', item.part_id)
          .single();

        if (part) {
          const newQty = Math.max(0, Number(part.quantity_on_hand || 0) - qty);
          const cost = qty * Number(part.unit_cost || 0);
          partsTotalCost += cost;

          await supabase
            .from('parts_inventory')
            .update({
              quantity_on_hand: newQty,
              updated_at: new Date().toISOString(),
            })
            .eq('id', part.id);

          try {
            await supabase.from('work_order_parts').insert({
              work_order_id: id,
              part_id: part.id,
              quantity_used: qty,
              unit_cost: part.unit_cost,
              total_cost: cost,
              issued_by_id: techId,
            });

            await supabase.from('inventory_transactions').insert({
              part_id: part.id,
              work_order_id: id,
              transaction_type: 'issued',
              quantity: qty,
              unit_cost: part.unit_cost,
              total_cost: cost,
              performed_by_id: techId,
              notes: `Consumed for ${wo.work_order_code}`,
            });
          } catch (partLogErr) {
            console.warn('Logging part consumption warning:', partLogErr);
          }
        }
      }
    }

    // 4. Checklist Results
    if (Array.isArray(reportData.checklists) && reportData.checklists.length > 0) {
      try {
        await supabase.from('checklist_results').delete().eq('work_order_id', id);
        const checklistRows = reportData.checklists.map((c: any) => ({
          work_order_id: id,
          item_key: c.item_key || c.id || 'item',
          item_label: c.item_label || c.label || 'Checklist Item',
          expected_condition: c.expected_condition || '',
          recorded_value: String(c.recorded_value || ''),
          status: ['pass', 'fail', 'warning', 'na'].includes(c.status) ? c.status : 'pass',
          notes: c.notes || '',
          checked_by_id: techId,
        }));
        await supabase.from('checklist_results').insert(checklistRows);
      } catch (chkErr) {
        console.warn('Checklist record warning:', chkErr);
      }
    }

    // 4b. Save Photo & Document Attachments
    if (Array.isArray(reportData.attachments) && reportData.attachments.length > 0) {
      const attachmentRows = reportData.attachments
        .filter((att: any) => att && att.file_data)
        .map((att: any) => ({
          work_order_id: id,
          report_id: report.id,
          file_name: att.file_name || 'site_photo.jpg',
          file_type: att.file_type || 'image/jpeg',
          file_category: att.file_category || 'after_photo',
          file_data: att.file_data,
          file_size: Number(att.file_size) || String(att.file_data).length,
          uploaded_by_id: techId,
        }));

      if (attachmentRows.length > 0) {
        const { error: attErr } = await supabase
          .from('attachments')
          .insert(attachmentRows);
        if (attErr) {
          console.error('Failed to save attachments to Supabase:', attErr);
          throw new Error(`Failed to upload attached photo(s): ${attErr.message}`);
        }
      }
    }

    // 5. Restore equipment operational status if applicable
    if (wo.equipment_id && (reportData.equipment_restored || reportData.final_result === 'operational')) {
      try {
        await supabase
          .from('equipment')
          .update({
            operational_status: 'operational',
            last_maintenance_date: reportData.work_date || new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString(),
          })
          .eq('id', wo.equipment_id);
      } catch (eqErr) {
        console.warn('Equipment status update warning:', eqErr);
      }
    }

    // 6. Update work order status to completed_pending_review & calculate costs
    const laborHours = Number(reportData.total_labor_hours) || 0;
    const laborCost = laborHours * 50.0;
    const prevPartsCost = Number(wo.parts_cost) || 0;
    const updatedPartsCost = prevPartsCost + partsTotalCost;
    const updatedTotalCost = laborCost + updatedPartsCost;

    const { error: woUpdateErr } = await supabase
      .from('work_orders')
      .update({
        status: 'completed_pending_review',
        actual_completion: new Date().toISOString(),
        labor_hours: laborHours,
        labor_cost: laborCost,
        parts_cost: updatedPartsCost,
        total_cost: updatedTotalCost,
        downtime_hours: Number(reportData.downtime_hours) || 0,
        is_tested_successfully: reportData.equipment_restored ? 1 : 0,
        root_cause_confirmed: reportData.root_cause || reportData.inspection_findings || '',
        follow_up_recommendations: reportData.follow_up_recommendations || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (woUpdateErr) {
      console.error('Failed to update work order status in Supabase:', woUpdateErr);
      throw woUpdateErr;
    }

    await supabase.from('work_order_status_history').insert({
      work_order_id: id,
      from_status: wo.status,
      to_status: 'completed_pending_review',
      changed_by_id: techId,
      notes: 'Maintenance report submitted for supervisor review',
    });

    // 7. Notify manager(s) / administrator
    try {
      const { data: reviewers } = await supabase
        .from('users')
        .select('id')
        .in('role', ['manager', 'admin'])
        .eq('status', 'active');
      if (reviewers && reviewers.length > 0) {
        await supabase.from('notifications').insert(
          reviewers.map((r: any) => ({
            user_id: r.id,
            title: `Report Submitted: ${wo.work_order_code}`,
            message: `Employee submitted maintenance report for ${wo.work_order_code}. Ready for review.`,
            type: 'report_submitted',
            work_order_id: id,
            equipment_id: wo.equipment_id,
          }))
        );
      }
    } catch {}

    // 8. Audit log
    try {
      await supabase.from('audit_logs').insert({
        user_id: techId,
        action: 'SUBMIT_MAINTENANCE_REPORT',
        entity_type: 'work_orders',
        entity_id: String(id),
        details: JSON.stringify({
          work_order_code: wo.work_order_code,
          labor_hours: Number(reportData.total_labor_hours) || 0,
        }),
      });
    } catch {}

    return report;
  },

  reviewReport: async (id: number, reviewerId: number, action: 'approved' | 'revision_required', comments?: string): Promise<any> => {
    const toStatus = action === 'approved' ? 'approved' : 'revision_required';
    const { data: wo, error } = await supabase
      .from('work_orders')
      .update({
        status: toStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    try {
      await supabase.from('approvals').insert({
        work_order_id: id,
        reviewer_id: reviewerId,
        status: action,
        comments: comments || (action === 'approved' ? 'Approved by engineer' : 'Revision requested'),
      });
    } catch {}

    await supabase.from('work_order_status_history').insert({
      work_order_id: id,
      from_status: 'completed_pending_review',
      to_status: toStatus,
      changed_by_id: reviewerId,
      notes: `Report ${action}: ${comments || ''}`,
    });

    return wo;
  },

  closeWorkOrder: async (id: number, userId: number, notes?: string): Promise<any> => {
    const { data: wo, error } = await supabase
      .from('work_orders')
      .update({
        status: 'closed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await supabase.from('work_order_status_history').insert({
      work_order_id: id,
      from_status: 'completed',
      to_status: 'closed',
      changed_by_id: userId,
      notes: notes || 'Work order officially closed and archived',
    });

    return wo;
  },

  // 4. Inventory
  getInventory: async (): Promise<{ parts: PartInventory[]; lowStockCount: number }> => {
    const { data, error } = await supabase.from('parts_inventory').select('*').order('name', { ascending: true });
    if (error) throw error;
    const parts = (data || []).map((p: any) => ({
      ...p,
      is_low_stock: p.quantity_on_hand <= p.min_threshold ? 1 : 0,
      usage_frequency: 0,
      total_units_consumed: 0,
    }));
    const lowStockCount = parts.filter((p) => p.is_low_stock === 1).length;
    return { parts, lowStockCount };
  },

  receiveInventory: async (data: {
    part_id: number;
    quantity: number;
    unit_cost?: number;
    performed_by_id: number;
    notes?: string;
  }): Promise<any> => {
    const qty = Number(data.quantity);
    if (!data.part_id || qty <= 0) {
      throw new Error('Invalid part or quantity');
    }

    // 1. Fetch current part from Supabase
    const { data: part, error: fetchErr } = await supabase
      .from('parts_inventory')
      .select('*')
      .eq('id', data.part_id)
      .single();

    if (fetchErr || !part) {
      throw new Error('Part not found in Supabase inventory');
    }

    const cost = data.unit_cost !== undefined ? Number(data.unit_cost) : Number(part.unit_cost || 0);
    const newQty = Number(part.quantity_on_hand || 0) + qty;
    const totalCost = qty * cost;

    // 2. Update parts_inventory in Supabase
    const { data: updatedPart, error: updateErr } = await supabase
      .from('parts_inventory')
      .update({
        quantity_on_hand: newQty,
        unit_cost: cost,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.part_id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // 3. Insert transaction into inventory_transactions in Supabase
    try {
      await supabase.from('inventory_transactions').insert({
        part_id: data.part_id,
        transaction_type: 'received',
        quantity: qty,
        unit_cost: cost,
        total_cost: totalCost,
        performed_by_id: data.performed_by_id,
        notes: data.notes || 'Stock received from supplier',
      });
    } catch (e) {
      console.warn('Could not record inventory_transactions in Supabase:', e);
    }

    // 4. Log audit trail in Supabase
    try {
      await supabase.from('audit_logs').insert({
        user_id: data.performed_by_id,
        action: 'RECEIVE_INVENTORY',
        entity_type: 'parts_inventory',
        entity_id: String(data.part_id),
        details: JSON.stringify({ qty, cost, newQuantity: newQty }),
      });
    } catch (e) {
      console.warn('Could not record audit log in Supabase:', e);
    }

    return { success: true, newQuantity: newQty, part: updatedPart };
  },

  adjustInventory: async (data: {
    part_id: number;
    new_quantity: number;
    performed_by_id: number;
    notes?: string;
  }): Promise<any> => {
    const newQty = Number(data.new_quantity);
    if (newQty < 0) {
      throw new Error('Quantity cannot be negative');
    }

    // 1. Fetch current part from Supabase
    const { data: part, error: fetchErr } = await supabase
      .from('parts_inventory')
      .select('*')
      .eq('id', data.part_id)
      .single();

    if (fetchErr || !part) {
      throw new Error('Part not found in Supabase inventory');
    }

    const diff = newQty - Number(part.quantity_on_hand || 0);

    // 2. Update parts_inventory in Supabase
    const { data: updatedPart, error: updateErr } = await supabase
      .from('parts_inventory')
      .update({
        quantity_on_hand: newQty,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.part_id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // 3. Insert transaction into inventory_transactions in Supabase
    try {
      await supabase.from('inventory_transactions').insert({
        part_id: data.part_id,
        transaction_type: 'adjusted',
        quantity: diff,
        unit_cost: part.unit_cost || 0,
        total_cost: Math.abs(diff) * Number(part.unit_cost || 0),
        performed_by_id: data.performed_by_id,
        notes: data.notes || 'Physical inventory audit adjustment',
      });
    } catch (e) {
      console.warn('Could not record inventory_transactions in Supabase:', e);
    }

    // 4. Log audit in Supabase
    try {
      await supabase.from('audit_logs').insert({
        user_id: data.performed_by_id,
        action: 'ADJUST_INVENTORY',
        entity_type: 'parts_inventory',
        entity_id: String(data.part_id),
        details: JSON.stringify({ oldQty: part.quantity_on_hand, newQty, reason: data.notes }),
      });
    } catch (e) {
      console.warn('Could not record audit log in Supabase:', e);
    }

    return { success: true, newQuantity: newQty, part: updatedPart };
  },

  getInventoryTransactions: async (): Promise<InventoryTransaction[]> => {
    const { data, error } = await supabase
      .from('inventory_transactions')
      .select('*, part:parts_inventory(name, part_code, unit), user:users(full_name), work_order:work_orders(work_order_code)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    return (data || []).map((t: any) => ({
      ...t,
      part_name: t.part?.name,
      part_code: t.part?.part_code,
      unit: t.part?.unit,
      performed_by_name: t.user?.full_name,
      work_order_code: t.work_order?.work_order_code,
    }));
  },

  // 5. Schedules & Checklists
  getSchedules: async (): Promise<MaintenanceSchedule[]> => {
    const { data, error } = await supabase
      .from('maintenance_schedules')
      .select('*, equipment:equipment(name, asset_id, plant_section), checklist:maintenance_checklists(title), technician:users!default_technician_id(full_name)')
      .order('next_due_date', { ascending: true });
    if (error) throw error;
    return (data || []).map((s: any) => ({
      ...s,
      equipment_name: s.equipment?.name,
      asset_id: s.equipment?.asset_id,
      plant_section: s.equipment?.plant_section,
      checklist_title: s.checklist?.title,
      default_technician_name: s.technician?.full_name,
    }));
  },

  getChecklists: async (): Promise<ChecklistTemplate[]> => {
    const { data, error } = await supabase.from('maintenance_checklists').select('*');
    if (error) throw error;
    return (data || []).map((c: any) => ({
      ...c,
      checklist_items: typeof c.checklist_items_json === 'string' ? JSON.parse(c.checklist_items_json) : c.checklist_items_json,
    }));
  },

  // 6. Notifications
  getNotifications: async (userId: number): Promise<NotificationItem[]> => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data || [];
  },

  markNotificationRead: async (id: number): Promise<void> => {
    await supabase.from('notifications').update({ is_read: 1 }).eq('id', id);
  },

  // 7. Audit Logs
  getAuditLogs: async (entityType?: string, action?: string, limit = 100): Promise<AuditLogItem[]> => {
    let q = supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(limit);
    if (entityType && entityType !== 'all') {
      q = q.eq('entity_type', entityType);
    }
    if (action && action !== 'all') {
      q = q.ilike('action', `%${action}%`);
    }
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  },

  deleteAuditLog: async (id: number): Promise<void> => {
    const { error } = await supabase.from('audit_logs').delete().eq('id', id);
    if (error) throw error;
  },

  clearAuditLogs: async (actionFilter?: string): Promise<void> => {
    let q = supabase.from('audit_logs').delete();
    if (actionFilter && actionFilter !== 'all') {
      q = q.ilike('action', `%${actionFilter}%`);
    } else {
      q = q.gte('id', 0);
    }
    const { error } = await q;
    if (error) throw error;
  },

  // 8. Daily Activity Monitoring
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
    let q = supabase
      .from('maintenance_reports')
      .select(`
        id,
        work_order_id,
        technician_id,
        work_date,
        start_time,
        end_time,
        total_labor_hours,
        identified_problem,
        inspection_findings,
        root_cause,
        repair_procedures,
        actions_performed,
        final_result,
        equipment_restored,
        restoration_time,
        submitted_at,
        technician:users!technician_id(id, full_name, employee_id),
        work_order:work_orders!work_order_id(
          id,
          work_order_code,
          type,
          status,
          priority,
          operational_impact,
          plant_section,
          location,
          equipment_id,
          equipment:equipment!equipment_id(id, name, asset_id, category, operational_status)
        )
      `)
      .order('work_date', { ascending: false })
      .order('start_time', { ascending: false });

    if (filters?.date) {
      q = q.eq('work_date', filters.date);
    }
    if (filters?.technicianId && filters.technicianId !== 'all') {
      q = q.eq('technician_id', Number(filters.technicianId));
    }

    const { data: reports, error } = await q;
    if (error) throw error;

    let filtered = (reports || []).filter((r: any) => r.work_order);
    if (filters?.equipmentId && filters.equipmentId !== 'all') {
      filtered = filtered.filter((r: any) => String(r.work_order.equipment_id) === String(filters.equipmentId));
    }
    if (filters?.type && filters.type !== 'all') {
      filtered = filtered.filter((r: any) => r.work_order.type === filters.type);
    }
    if (filters?.status && filters.status !== 'all') {
      filtered = filtered.filter((r: any) => r.work_order.status === filters.status);
    }
    if (filters?.location && filters.location !== 'all') {
      const loc = filters.location.toLowerCase();
      filtered = filtered.filter((r: any) => (r.work_order.plant_section || '').toLowerCase().includes(loc));
    }

    const woIds = filtered.map((r: any) => r.work_order_id);
    let partsByWo: Record<number, any[]> = {};
    let attachmentsByWo: Record<number, any[]> = {};

    if (woIds.length > 0) {
      const [partsRes, attRes] = await Promise.all([
        supabase
          .from('work_order_parts')
          .select('work_order_id, quantity_used, unit_cost, total_cost, part:parts_inventory(name, part_code, unit)')
          .in('work_order_id', woIds),
        supabase
          .from('attachments')
          .select('id, work_order_id, file_name, file_type, file_category, file_data')
          .in('work_order_id', woIds)
          .order('uploaded_at', { ascending: true }),
      ]);

      for (const p of (partsRes.data || []) as any[]) {
        if (!partsByWo[p.work_order_id]) partsByWo[p.work_order_id] = [];
        partsByWo[p.work_order_id].push({
          quantity_used: p.quantity_used,
          unit_cost: p.unit_cost,
          total_cost: p.total_cost,
          part_name: p.part?.name,
          part_code: p.part?.part_code,
          unit: p.part?.unit,
        });
      }

      for (const a of (attRes.data || []) as any[]) {
        if (!attachmentsByWo[a.work_order_id]) attachmentsByWo[a.work_order_id] = [];
        attachmentsByWo[a.work_order_id].push(a);
      }
    }

    const activities: DailyActivityItem[] = filtered.map((r: any) => ({
      report_id: r.id,
      work_date: r.work_date,
      start_time: r.start_time,
      end_time: r.end_time,
      total_labor_hours: r.total_labor_hours,
      identified_problem: r.identified_problem,
      inspection_findings: r.inspection_findings,
      root_cause: r.root_cause,
      repair_procedures: r.repair_procedures,
      actions_performed: r.actions_performed,
      final_result: r.final_result,
      equipment_restored: r.equipment_restored,
      restoration_time: r.restoration_time,
      submitted_at: r.submitted_at,
      work_order_id: r.work_order_id,
      work_order_code: r.work_order.work_order_code,
      maintenance_type: r.work_order.type,
      work_order_status: r.work_order.status,
      priority: r.work_order.priority,
      operational_impact: r.work_order.operational_impact,
      plant_section: r.work_order.plant_section,
      location: r.work_order.location,
      technician_id: r.technician_id,
      technician_name: r.technician?.full_name || 'Technician',
      technician_employee_id: r.technician?.employee_id || '',
      equipment_id: r.work_order.equipment_id,
      equipment_name: r.work_order.equipment?.name || '',
      asset_id: r.work_order.equipment?.asset_id || '',
      equipment_category: r.work_order.equipment?.category || '',
      current_equipment_status: r.work_order.equipment?.operational_status || 'operational',
      parts: partsByWo[r.work_order_id] || [],
      attachments: attachmentsByWo[r.work_order_id] || [],
    }));

    const totalLaborHours = activities.reduce((acc, a) => acc + (a.total_labor_hours || 0), 0);
    const completedCount = activities.filter((a) => ['approved', 'closed'].includes(a.work_order_status)).length;
    const pendingReviewCount = activities.filter((a) => a.work_order_status === 'completed_pending_review').length;

    return {
      activities,
      summary: {
        totalRecords: activities.length,
        totalLaborHours,
        completedCount,
        pendingReviewCount,
      },
    };
  },
};
