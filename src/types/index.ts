export type UserRole = 'admin' | 'technician';

export interface User {
  id: number;
  employee_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  department: string;
  phone?: string;
  status: 'active' | 'deactivated';
  created_at?: string;
  active_workload?: number;
  completed_jobs?: number;
}

export type EquipmentCategory =
  | 'Solar PV Array'
  | 'Central Inverter'
  | 'String Inverter'
  | 'Combiner Box'
  | 'Step-Up Transformer'
  | 'Medium Voltage Switchgear'
  | 'Solar Tracker Motor'
  | 'Weather & Pyranometer Station'
  | 'Battery Storage (BESS)';

export type OperationalStatus = 'operational' | 'under_maintenance' | 'faulty' | 'decommissioned';

export interface Equipment {
  id: number;
  asset_id: string;
  name: string;
  category: EquipmentCategory;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  installation_date?: string;
  warranty_expiry?: string;
  plant_section: string;
  location_description?: string;
  operational_status: OperationalStatus;
  last_maintenance_date?: string;
  next_pm_date?: string;
  failure_count: number;
  rated_capacity?: string;
  created_at?: string;
}

export type MaintenanceType = 'corrective' | 'preventive';
export type WorkOrderPriority = 'low' | 'medium' | 'high' | 'critical';
export type WorkOrderStatus =
  | 'open'
  | 'assigned'
  | 'acknowledged'
  | 'in_progress'
  | 'on_hold'
  | 'completed_pending_review'
  | 'revision_required'
  | 'approved'
  | 'closed'
  | 'cancelled';

export interface WorkOrder {
  id: number;
  work_order_code: string;
  type: MaintenanceType;
  equipment_id: number;
  equipment_name?: string;
  asset_id?: string;
  equipment_category?: EquipmentCategory;
  equipment_operational_status?: OperationalStatus;
  problem_description: string;
  operational_impact?: string;
  plant_section: string;
  location?: string;
  assigned_technician_id?: number;
  technician_name?: string;
  technician_employee_id?: string;
  technician_email?: string;
  technician_phone?: string;
  created_by_id: number;
  created_by_name?: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  scheduled_date?: string;
  due_date?: string;
  actual_start?: string;
  actual_completion?: string;
  root_cause_suspected?: string;
  root_cause_confirmed?: string;
  labor_hours: number;
  labor_cost: number;
  parts_cost: number;
  total_cost: number;
  is_tested_successfully: number;
  downtime_hours: number;
  restoration_date?: string;
  follow_up_recommendations?: string;
  instructions?: string;
  repair_procedures?: string;
  created_at: string;
  updated_at: string;
  report_id?: number;
  final_result?: string;
  report_submitted_at?: string;
  statusHistory?: WorkOrderStatusHistory[];
  report?: MaintenanceReport;
  partsUsed?: WorkOrderPart[];
  attachments?: Attachment[];
  checklistResults?: ChecklistResult[];
  approvals?: Approval[];
}

export interface WorkOrderStatusHistory {
  id: number;
  work_order_id: number;
  from_status?: string;
  to_status: string;
  changed_by_id: number;
  changed_by_name?: string;
  notes?: string;
  timestamp: string;
}

export interface MaintenanceReport {
  id: number;
  work_order_id: number;
  technician_id: number;
  technician_name?: string;
  work_date: string;
  start_time: string;
  end_time: string;
  total_labor_hours: number;
  identified_problem: string;
  inspection_findings: string;
  root_cause: string;
  repair_procedures: string;
  actions_performed: string;
  final_result: string;
  equipment_restored: number;
  restoration_time?: string;
  downtime_hours: number;
  defects_discovered?: string;
  follow_up_recommendations?: string;
  submitted_at: string;
}

export interface PartInventory {
  id: number;
  part_code: string;
  name: string;
  category: string;
  description?: string;
  unit: string;
  quantity_on_hand: number;
  min_threshold: number;
  unit_cost: number;
  location_bin?: string;
  is_low_stock?: number;
  usage_frequency?: number;
  total_units_consumed?: number;
}

export interface InventoryTransaction {
  id: number;
  part_id: number;
  part_name: string;
  part_code: string;
  unit: string;
  work_order_id?: number;
  work_order_code?: string;
  transaction_type: 'received' | 'issued' | 'returned' | 'adjusted';
  quantity: number;
  unit_cost: number;
  total_cost: number;
  performed_by_id: number;
  performed_by_name: string;
  notes?: string;
  created_at: string;
}

export interface WorkOrderPart {
  id: number;
  work_order_id: number;
  part_id: number;
  part_name: string;
  part_code: string;
  unit: string;
  quantity_used: number;
  unit_cost: number;
  total_cost: number;
  issued_by_name?: string;
  issued_at: string;
}

export interface Attachment {
  id: number;
  work_order_id: number;
  report_id?: number;
  file_name: string;
  file_type: string;
  file_category: 'before_photo' | 'after_photo' | 'thermal_scan' | 'document';
  file_data: string;
  file_size: number;
  uploaded_by_name?: string;
  uploaded_at: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  expected_condition: string;
  is_critical: boolean;
}

export interface ChecklistTemplate {
  id: number;
  equipment_category: string;
  title: string;
  checklist_items: ChecklistItem[];
}

export interface ChecklistResult {
  id: number;
  work_order_id: number;
  item_key: string;
  item_label: string;
  expected_condition?: string;
  recorded_value?: string;
  status: 'pass' | 'fail' | 'warning' | 'na';
  notes?: string;
  checked_by_id?: number;
  checked_at: string;
}

export interface MaintenanceSchedule {
  id: number;
  title: string;
  equipment_id: number;
  equipment_name: string;
  asset_id: string;
  plant_section: string;
  interval_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  checklist_id?: number;
  checklist_title?: string;
  default_technician_id?: number;
  default_technician_name?: string;
  next_due_date: string;
  last_run_date?: string;
  is_active: number;
  notes?: string;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'assignment' | 'deadline' | 'review' | 'approval' | 'revision' | 'inventory' | 'critical';
  work_order_id?: number;
  equipment_id?: number;
  is_read: number;
  created_at: string;
}

export interface Approval {
  id: number;
  work_order_id: number;
  report_id: number;
  reviewer_id: number;
  reviewer_name?: string;
  action: 'approved' | 'revision_required';
  review_comments?: string;
  reviewed_at: string;
}

export interface AuditLogItem {
  id: number;
  user_id?: number;
  user_email: string;
  user_role: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details_json?: string;
  ip_address?: string;
  created_at: string;
}

export interface DailyActivityItem {
  report_id: number;
  work_date: string;
  start_time: string;
  end_time: string;
  total_labor_hours: number;
  identified_problem: string;
  inspection_findings: string;
  root_cause: string;
  repair_procedures: string;
  actions_performed: string;
  final_result: string;
  equipment_restored: number;
  restoration_time?: string;
  submitted_at: string;
  work_order_id: number;
  work_order_code: string;
  maintenance_type: MaintenanceType;
  work_order_status: WorkOrderStatus;
  priority: WorkOrderPriority;
  operational_impact?: string;
  plant_section: string;
  location?: string;
  technician_id: number;
  technician_name: string;
  technician_employee_id: string;
  equipment_id: number;
  equipment_name: string;
  asset_id: string;
  equipment_category: EquipmentCategory;
  current_equipment_status: OperationalStatus;
  parts: Array<{
    quantity_used: number;
    unit_cost: number;
    total_cost: number;
    part_name: string;
    part_code: string;
    unit: string;
  }>;
  attachments: Array<{
    id: number;
    file_name: string;
    file_category: string;
    file_data: string;
  }>;
}

export interface ACIDTestResult {
  testName: string;
  property: 'Atomicity' | 'Consistency' | 'Isolation' | 'Durability';
  status: 'PASSED' | 'FAILED';
  initialState?: string;
  simulatedAction?: string;
  finalState?: string;
  explanation?: string;
  error?: string;
}
