import { pgTable, serial, text, integer, doublePrecision, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Users table (Admin and Technician roles)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  employeeId: text('employee_id').unique().notNull(),
  fullName: text('full_name').notNull(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull(), // 'admin' | 'technician'
  department: text('department').notNull(),
  phone: text('phone'),
  status: text('status').notNull().default('active'), // 'active' | 'deactivated'
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 2. Equipment registry for solar power plant assets
export const equipment = pgTable('equipment', {
  id: serial('id').primaryKey(),
  assetId: text('asset_id').unique().notNull(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  manufacturer: text('manufacturer'),
  model: text('model'),
  serialNumber: text('serial_number'),
  installationDate: text('installation_date'),
  warrantyExpiry: text('warranty_expiry'),
  plantSection: text('plant_section').notNull(),
  locationDescription: text('location_description'),
  operationalStatus: text('operational_status').notNull().default('operational'),
  lastMaintenanceDate: text('last_maintenance_date'),
  nextPmDate: text('next_pm_date'),
  failureCount: integer('failure_count').notNull().default(0),
  ratedCapacity: text('rated_capacity'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 3. Work Orders
export const workOrders = pgTable('work_orders', {
  id: serial('id').primaryKey(),
  workOrderCode: text('work_order_code').unique().notNull(),
  type: text('type').notNull(), // 'corrective' | 'preventive'
  equipmentId: integer('equipment_id').references(() => equipment.id).notNull(),
  problemDescription: text('problem_description').notNull(),
  operationalImpact: text('operational_impact'),
  plantSection: text('plant_section').notNull(),
  location: text('location'),
  assignedTechnicianId: integer('assigned_technician_id').references(() => users.id),
  createdById: integer('created_by_id').references(() => users.id).notNull(),
  priority: text('priority').notNull().default('medium'),
  status: text('status').notNull().default('open'),
  scheduledDate: text('scheduled_date'),
  dueDate: text('due_date'),
  actualStart: text('actual_start'),
  actualCompletion: text('actual_completion'),
  rootCauseSuspected: text('root_cause_suspected'),
  rootCauseConfirmed: text('root_cause_confirmed'),
  laborHours: doublePrecision('labor_hours').default(0),
  laborCost: doublePrecision('labor_cost').default(0),
  partsCost: doublePrecision('parts_cost').default(0),
  totalCost: doublePrecision('total_cost').default(0),
  isTestedSuccessfully: integer('is_tested_successfully').default(0),
  downtimeHours: doublePrecision('downtime_hours').default(0),
  restorationDate: text('restoration_date'),
  followUpRecommendations: text('follow_up_recommendations'),
  instructions: text('instructions'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 4. Technician Assignments
export const technicianAssignments = pgTable('technician_assignments', {
  id: serial('id').primaryKey(),
  workOrderId: integer('work_order_id').references(() => workOrders.id, { onDelete: 'cascade' }).notNull(),
  technicianId: integer('technician_id').references(() => users.id).notNull(),
  assignedById: integer('assigned_by_id').references(() => users.id).notNull(),
  assignedAt: timestamp('assigned_at').defaultNow(),
  acknowledgedAt: text('acknowledged_at'),
  status: text('status').notNull().default('active'),
  notes: text('notes'),
});

// 5. Maintenance Reports (Detailed technician submission)
export const maintenanceReports = pgTable('maintenance_reports', {
  id: serial('id').primaryKey(),
  workOrderId: integer('work_order_id').references(() => workOrders.id, { onDelete: 'cascade' }).unique().notNull(),
  technicianId: integer('technician_id').references(() => users.id).notNull(),
  workDate: text('work_date').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  totalLaborHours: doublePrecision('total_labor_hours').notNull(),
  identifiedProblem: text('identified_problem').notNull(),
  inspectionFindings: text('inspection_findings').notNull(),
  rootCause: text('root_cause').notNull(),
  repairProcedures: text('repair_procedures').notNull(),
  actionsPerformed: text('actions_performed').notNull(),
  finalResult: text('final_result').notNull(),
  equipmentRestored: integer('equipment_restored').notNull().default(1),
  restorationTime: text('restoration_time'),
  downtimeHours: doublePrecision('downtime_hours').default(0),
  defectsDiscovered: text('defects_discovered'),
  followUpRecommendations: text('follow_up_recommendations'),
  submittedAt: timestamp('submitted_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 6. Maintenance Checklist Templates
export const maintenanceChecklists = pgTable('maintenance_checklists', {
  id: serial('id').primaryKey(),
  equipmentCategory: text('equipment_category').notNull(),
  title: text('title').notNull(),
  checklistItemsJson: text('checklist_items_json').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 7. Checklist Results for Work Orders
export const checklistResults = pgTable('checklist_results', {
  id: serial('id').primaryKey(),
  workOrderId: integer('work_order_id').references(() => workOrders.id, { onDelete: 'cascade' }).notNull(),
  itemKey: text('item_key').notNull(),
  itemLabel: text('item_label').notNull(),
  expectedCondition: text('expected_condition'),
  recordedValue: text('recorded_value'),
  status: text('status').notNull(),
  notes: text('notes'),
  checkedById: integer('checked_by_id').references(() => users.id),
  checkedAt: timestamp('checked_at').defaultNow(),
});

// 8. Recurring Preventive Maintenance Schedules
export const maintenanceSchedules = pgTable('maintenance_schedules', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  equipmentId: integer('equipment_id').references(() => equipment.id).notNull(),
  intervalType: text('interval_type').notNull(),
  checklistId: integer('checklist_id').references(() => maintenanceChecklists.id),
  defaultTechnicianId: integer('default_technician_id').references(() => users.id),
  nextDueDate: text('next_due_date').notNull(),
  lastRunDate: text('last_run_date'),
  isActive: integer('is_active').notNull().default(1),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 9. Work Order Status History
export const workOrderStatusHistory = pgTable('work_order_status_history', {
  id: serial('id').primaryKey(),
  workOrderId: integer('work_order_id').references(() => workOrders.id, { onDelete: 'cascade' }).notNull(),
  fromStatus: text('from_status'),
  toStatus: text('to_status').notNull(),
  changedById: integer('changed_by_id').references(() => users.id).notNull(),
  notes: text('notes'),
  timestamp: timestamp('timestamp').defaultNow(),
});

// 10. Spare Parts Inventory
export const partsInventory = pgTable('parts_inventory', {
  id: serial('id').primaryKey(),
  partCode: text('part_code').unique().notNull(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  description: text('description'),
  unit: text('unit').notNull(),
  quantityOnHand: integer('quantity_on_hand').notNull(),
  minThreshold: integer('min_threshold').notNull().default(5),
  unitCost: doublePrecision('unit_cost').notNull(),
  locationBin: text('location_bin'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 11. Inventory Transactions
export const inventoryTransactions = pgTable('inventory_transactions', {
  id: serial('id').primaryKey(),
  partId: integer('part_id').references(() => partsInventory.id).notNull(),
  workOrderId: integer('work_order_id').references(() => workOrders.id),
  transactionType: text('transaction_type').notNull(),
  quantity: integer('quantity').notNull(),
  unitCost: doublePrecision('unit_cost').notNull(),
  totalCost: doublePrecision('total_cost').notNull(),
  performedById: integer('performed_by_id').references(() => users.id).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 12. Work Order Parts Usage
export const workOrderParts = pgTable('work_order_parts', {
  id: serial('id').primaryKey(),
  workOrderId: integer('work_order_id').references(() => workOrders.id, { onDelete: 'cascade' }).notNull(),
  partId: integer('part_id').references(() => partsInventory.id).notNull(),
  quantityUsed: integer('quantity_used').notNull(),
  unitCost: doublePrecision('unit_cost').notNull(),
  totalCost: doublePrecision('total_cost').notNull(),
  issuedById: integer('issued_by_id').references(() => users.id).notNull(),
  issuedAt: timestamp('issued_at').defaultNow(),
});

// 13. Attachments
export const attachments = pgTable('attachments', {
  id: serial('id').primaryKey(),
  workOrderId: integer('work_order_id').references(() => workOrders.id, { onDelete: 'cascade' }).notNull(),
  reportId: integer('report_id').references(() => maintenanceReports.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  fileType: text('file_type').notNull(),
  fileCategory: text('file_category').notNull(),
  fileData: text('file_data').notNull(),
  fileSize: integer('file_size').notNull(),
  uploadedById: integer('uploaded_by_id').references(() => users.id).notNull(),
  uploadedAt: timestamp('uploaded_at').defaultNow(),
});

// 14. Notifications
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull(),
  workOrderId: integer('work_order_id').references(() => workOrders.id),
  equipmentId: integer('equipment_id').references(() => equipment.id),
  isRead: integer('is_read').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// 15. Approvals
export const approvals = pgTable('approvals', {
  id: serial('id').primaryKey(),
  workOrderId: integer('work_order_id').references(() => workOrders.id, { onDelete: 'cascade' }).notNull(),
  reportId: integer('report_id').references(() => maintenanceReports.id, { onDelete: 'cascade' }).notNull(),
  reviewerId: integer('reviewer_id').references(() => users.id).notNull(),
  action: text('action').notNull(),
  reviewComments: text('review_comments'),
  reviewedAt: timestamp('reviewed_at').defaultNow(),
});

// 16. Audit Logs
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id'),
  userEmail: text('user_email').notNull(),
  userRole: text('user_role').notNull(),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id'),
  detailsJson: text('details_json'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  assignedWorkOrders: many(workOrders, { relationName: 'assignedTechnician' }),
  createdWorkOrders: many(workOrders, { relationName: 'orderCreator' }),
  notifications: many(notifications),
}));

export const equipmentRelations = relations(equipment, ({ many }) => ({
  workOrders: many(workOrders),
  schedules: many(maintenanceSchedules),
}));

export const workOrdersRelations = relations(workOrders, ({ one, many }) => ({
  equipment: one(equipment, {
    fields: [workOrders.equipmentId],
    references: [equipment.id],
  }),
  assignedTechnician: one(users, {
    fields: [workOrders.assignedTechnicianId],
    references: [users.id],
    relationName: 'assignedTechnician',
  }),
  creator: one(users, {
    fields: [workOrders.createdById],
    references: [users.id],
    relationName: 'orderCreator',
  }),
  reports: many(maintenanceReports),
  assignments: many(technicianAssignments),
  checklistResults: many(checklistResults),
  parts: many(workOrderParts),
  attachments: many(attachments),
  approvals: many(approvals),
  statusHistory: many(workOrderStatusHistory),
}));
