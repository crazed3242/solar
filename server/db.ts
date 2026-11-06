import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';

// Database file path in root directory
const dbPath = path.resolve(process.cwd(), 'heliomms.db');
export const db = new Database(dbPath);

// Enable WAL mode for high concurrency, isolation, and crash resilience
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');

// Initialize database schema following ACID relational design
export function initDb() {
  const schema = `
    -- 1. Users table (Admin and Technician roles only)
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'technician')),
      department TEXT NOT NULL,
      phone TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'deactivated')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Equipment registry for solar power plant assets
    CREATE TABLE IF NOT EXISTS equipment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN (
        'Solar PV Array',
        'Central Inverter',
        'String Inverter',
        'Combiner Box',
        'Step-Up Transformer',
        'Medium Voltage Switchgear',
        'Solar Tracker Motor',
        'Weather & Pyranometer Station',
        'Battery Storage (BESS)'
      )),
      manufacturer TEXT,
      model TEXT,
      serial_number TEXT,
      installation_date TEXT,
      warranty_expiry TEXT,
      plant_section TEXT NOT NULL,
      location_description TEXT,
      operational_status TEXT NOT NULL DEFAULT 'operational' CHECK(operational_status IN (
        'operational',
        'under_maintenance',
        'faulty',
        'decommissioned'
      )),
      last_maintenance_date TEXT,
      next_pm_date TEXT,
      failure_count INTEGER NOT NULL DEFAULT 0,
      rated_capacity TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- 3. Work Orders
    CREATE TABLE IF NOT EXISTS work_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_order_code TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('corrective', 'preventive')),
      equipment_id INTEGER NOT NULL,
      problem_description TEXT NOT NULL,
      operational_impact TEXT,
      plant_section TEXT NOT NULL,
      location TEXT,
      assigned_technician_id INTEGER,
      created_by_id INTEGER NOT NULL,
      priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'critical')),
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN (
        'open',
        'assigned',
        'acknowledged',
        'in_progress',
        'on_hold',
        'completed_pending_review',
        'revision_required',
        'approved',
        'closed',
        'cancelled'
      )),
      scheduled_date TEXT,
      due_date TEXT,
      actual_start TEXT,
      actual_completion TEXT,
      root_cause_suspected TEXT,
      root_cause_confirmed TEXT,
      labor_hours REAL DEFAULT 0,
      labor_cost REAL DEFAULT 0,
      parts_cost REAL DEFAULT 0,
      total_cost REAL DEFAULT 0,
      is_tested_successfully INTEGER DEFAULT 0,
      downtime_hours REAL DEFAULT 0,
      restoration_date TEXT,
      follow_up_recommendations TEXT,
      instructions TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE RESTRICT,
      FOREIGN KEY (assigned_technician_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE RESTRICT
    );

    -- 4. Technician Assignments
    CREATE TABLE IF NOT EXISTS technician_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_order_id INTEGER NOT NULL,
      technician_id INTEGER NOT NULL,
      assigned_by_id INTEGER NOT NULL,
      assigned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      acknowledged_at TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'reassigned', 'completed')),
      notes TEXT,
      FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE,
      FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE RESTRICT,
      FOREIGN KEY (assigned_by_id) REFERENCES users(id) ON DELETE RESTRICT
    );

    -- 5. Maintenance Reports (Detailed technician submission)
    CREATE TABLE IF NOT EXISTS maintenance_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_order_id INTEGER UNIQUE NOT NULL,
      technician_id INTEGER NOT NULL,
      work_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      total_labor_hours REAL NOT NULL,
      identified_problem TEXT NOT NULL,
      inspection_findings TEXT NOT NULL,
      root_cause TEXT NOT NULL,
      repair_procedures TEXT NOT NULL,
      actions_performed TEXT NOT NULL,
      final_result TEXT NOT NULL,
      equipment_restored INTEGER NOT NULL DEFAULT 1,
      restoration_time TEXT,
      downtime_hours REAL DEFAULT 0,
      defects_discovered TEXT,
      follow_up_recommendations TEXT,
      submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE,
      FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE RESTRICT
    );

    -- 6. Maintenance Checklist Templates
    CREATE TABLE IF NOT EXISTS maintenance_checklists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipment_category TEXT NOT NULL,
      title TEXT NOT NULL,
      checklist_items_json TEXT NOT NULL, -- Array of { id, label, expected_condition, is_critical }
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- 7. Checklist Results for Work Orders
    CREATE TABLE IF NOT EXISTS checklist_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_order_id INTEGER NOT NULL,
      item_key TEXT NOT NULL,
      item_label TEXT NOT NULL,
      expected_condition TEXT,
      recorded_value TEXT,
      status TEXT NOT NULL CHECK(status IN ('pass', 'fail', 'warning', 'na')),
      notes TEXT,
      checked_by_id INTEGER,
      checked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE,
      FOREIGN KEY (checked_by_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- 8. Recurring Preventive Maintenance Schedules
    CREATE TABLE IF NOT EXISTS maintenance_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      equipment_id INTEGER NOT NULL,
      interval_type TEXT NOT NULL CHECK(interval_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'annual')),
      checklist_id INTEGER,
      default_technician_id INTEGER,
      next_due_date TEXT NOT NULL,
      last_run_date TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE RESTRICT,
      FOREIGN KEY (checklist_id) REFERENCES maintenance_checklists(id) ON DELETE SET NULL,
      FOREIGN KEY (default_technician_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- 9. Work Order Status History (Audit trail of transitions)
    CREATE TABLE IF NOT EXISTS work_order_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_order_id INTEGER NOT NULL,
      from_status TEXT,
      to_status TEXT NOT NULL,
      changed_by_id INTEGER NOT NULL,
      notes TEXT,
      timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE,
      FOREIGN KEY (changed_by_id) REFERENCES users(id) ON DELETE RESTRICT
    );

    -- 10. Spare Parts Inventory
    CREATE TABLE IF NOT EXISTS parts_inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      part_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      unit TEXT NOT NULL,
      quantity_on_hand INTEGER NOT NULL CHECK(quantity_on_hand >= 0),
      min_threshold INTEGER NOT NULL DEFAULT 5,
      unit_cost REAL NOT NULL CHECK(unit_cost >= 0),
      location_bin TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- 11. Inventory Transactions
    CREATE TABLE IF NOT EXISTS inventory_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      part_id INTEGER NOT NULL,
      work_order_id INTEGER,
      transaction_type TEXT NOT NULL CHECK(transaction_type IN ('received', 'issued', 'returned', 'adjusted')),
      quantity INTEGER NOT NULL,
      unit_cost REAL NOT NULL,
      total_cost REAL NOT NULL,
      performed_by_id INTEGER NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (part_id) REFERENCES parts_inventory(id) ON DELETE RESTRICT,
      FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE SET NULL,
      FOREIGN KEY (performed_by_id) REFERENCES users(id) ON DELETE RESTRICT
    );

    -- 12. Work Order Parts Usage
    CREATE TABLE IF NOT EXISTS work_order_parts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_order_id INTEGER NOT NULL,
      part_id INTEGER NOT NULL,
      quantity_used INTEGER NOT NULL CHECK(quantity_used > 0),
      unit_cost REAL NOT NULL,
      total_cost REAL NOT NULL,
      issued_by_id INTEGER NOT NULL,
      issued_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE,
      FOREIGN KEY (part_id) REFERENCES parts_inventory(id) ON DELETE RESTRICT,
      FOREIGN KEY (issued_by_id) REFERENCES users(id) ON DELETE RESTRICT
    );

    -- 13. Attachments (Photos & Documents)
    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_order_id INTEGER NOT NULL,
      report_id INTEGER,
      file_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_category TEXT NOT NULL CHECK(file_category IN ('before_photo', 'after_photo', 'thermal_scan', 'document')),
      file_data TEXT NOT NULL, -- Data URI or Base64
      file_size INTEGER NOT NULL,
      uploaded_by_id INTEGER NOT NULL,
      uploaded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE,
      FOREIGN KEY (report_id) REFERENCES maintenance_reports(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by_id) REFERENCES users(id) ON DELETE RESTRICT
    );

    -- 14. Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('assignment', 'deadline', 'review', 'approval', 'revision', 'inventory', 'critical')),
      work_order_id INTEGER,
      equipment_id INTEGER,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE SET NULL,
      FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE SET NULL
    );

    -- 15. Approvals History
    CREATE TABLE IF NOT EXISTS approvals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_order_id INTEGER NOT NULL,
      report_id INTEGER NOT NULL,
      reviewer_id INTEGER NOT NULL,
      action TEXT NOT NULL CHECK(action IN ('approved', 'revision_required')),
      review_comments TEXT,
      reviewed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE,
      FOREIGN KEY (report_id) REFERENCES maintenance_reports(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE RESTRICT
    );

    -- 16. Audit Logs
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_email TEXT NOT NULL,
      user_role TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details_json TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes for high-frequency queries
    CREATE INDEX IF NOT EXISTS idx_wo_status ON work_orders(status);
    CREATE INDEX IF NOT EXISTS idx_wo_equipment ON work_orders(equipment_id);
    CREATE INDEX IF NOT EXISTS idx_wo_tech ON work_orders(assigned_technician_id);
    CREATE INDEX IF NOT EXISTS idx_report_date ON maintenance_reports(work_date);
    CREATE INDEX IF NOT EXISTS idx_inventory_code ON parts_inventory(part_code);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
  `;

  db.exec(schema);
  seedInitialData();
  ensureAdminAccount();
  resetAllDataToCleanSlate();
}

// Ensure admin account exists: username 'admin', password '123456'
export function ensureAdminAccount() {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync('123456', salt);

  const cleanTx = db.transaction(() => {
    // Ensure user ID 1 is the admin
    const admin = db.prepare('SELECT id FROM users WHERE id = 1').get() as any;
    if (admin) {
      db.prepare(`
        UPDATE users
        SET employee_id = 'admin',
            full_name = 'System Administrator',
            email = 'admin',
            password_hash = ?,
            role = 'admin',
            department = 'Plant Administration',
            phone = '+63 917 555 1001',
            status = 'active'
        WHERE id = 1
      `).run(hash);
    } else {
      db.prepare(`
        INSERT INTO users (id, employee_id, full_name, email, password_hash, role, department, phone, status)
        VALUES (1, 'admin', 'System Administrator', 'admin', ?, 'admin', 'Plant Administration', '+63 917 555 1001', 'active')
      `).run(hash);
    }
  });

  cleanTx();
}

// Reset entire database to a clean start-over slate
export function resetAllDataToCleanSlate() {
  const cleanTx = db.transaction(() => {
    db.exec(`
      DELETE FROM approvals;
      DELETE FROM attachments;
      DELETE FROM checklist_results;
      DELETE FROM inventory_transactions;
      DELETE FROM maintenance_reports;
      DELETE FROM maintenance_schedules;
      DELETE FROM notifications;
      DELETE FROM technician_assignments;
      DELETE FROM work_order_parts;
      DELETE FROM work_order_status_history;
      DELETE FROM work_orders;
      DELETE FROM audit_logs;
      DELETE FROM users WHERE id != 1;

      -- Reset equipment assets to brand-new operational factory baseline
      UPDATE equipment 
      SET operational_status = 'operational',
          failure_count = 0,
          last_maintenance_date = NULL,
          next_pm_date = NULL,
          updated_at = CURRENT_TIMESTAMP;

      -- Reset inventory stocks to initial warehouse quantities
      UPDATE parts_inventory
      SET quantity_on_hand = CASE 
        WHEN part_code = 'PRT-FUS-1500' THEN 75
        WHEN part_code = 'PRT-SPD-002' THEN 18
        WHEN part_code = 'PRT-FAN-INV' THEN 6
        WHEN part_code = 'PRT-IGBT-MOD' THEN 3
        WHEN part_code = 'PRT-MC4-PAIR' THEN 120
        WHEN part_code = 'PRT-TRK-BRG' THEN 12
        WHEN part_code = 'PRT-TX-OIL' THEN 8
        WHEN part_code = 'PRT-PASTE-TH' THEN 14
        ELSE quantity_on_hand
      END,
      updated_at = CURRENT_TIMESTAMP;

      -- Reset auto-increment sequence counters so work orders and reports start at #1
      DELETE FROM sqlite_sequence WHERE name IN (
        'work_orders',
        'technician_assignments',
        'maintenance_reports',
        'checklist_results',
        'work_order_status_history',
        'work_order_parts',
        'attachments',
        'notifications',
        'approvals',
        'audit_logs',
        'inventory_transactions',
        'maintenance_schedules'
      );
    `);
  });

  cleanTx();
  ensureAdminAccount();
}

// Seed clean baseline data for Kirahon Solar Power Plant (Zero work orders, zero reports)
function seedInitialData() {
  const userCount = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) {
    return; // Already seeded
  }

  const salt = bcrypt.genSaltSync(10);
  const defaultHash = bcrypt.hashSync('123456', salt);

  // Seed single Admin user
  const insertUser = db.prepare(`
    INSERT INTO users (id, employee_id, full_name, email, password_hash, role, department, phone, status)
    VALUES (1, 'admin', 'System Administrator', 'admin', ?, 'admin', 'Plant Administration', '+63 917 555 1001', 'active')
  `);
  insertUser.run(defaultHash);

  // Seed Equipment for Kirahon Solar Power Plant
  const insertEquipment = db.prepare(`
    INSERT INTO equipment (
      asset_id, name, category, manufacturer, model, serial_number,
      installation_date, warranty_expiry, plant_section, location_description,
      operational_status, last_maintenance_date, next_pm_date, failure_count, rated_capacity
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertEquipment.run(
    'EQ-INV-001', 'Central Inverter Unit 01', 'Central Inverter',
    'SMA Solar Technology', 'Sunny Central 2500-EV', 'SN-SMA-2022-8812',
    '2022-03-15', '2027-03-15', 'Inverter Station 1', 'Block A1, Central Enclosure',
    'operational', null, null, 0, '2,500 kW'
  );

  insertEquipment.run(
    'EQ-INV-002', 'Central Inverter Unit 02', 'Central Inverter',
    'SMA Solar Technology', 'Sunny Central 2500-EV', 'SN-SMA-2022-8813',
    '2022-03-15', '2027-03-15', 'Inverter Station 2', 'Block A2, Central Enclosure',
    'operational', null, null, 0, '2,500 kW'
  );

  insertEquipment.run(
    'EQ-TRF-001', 'Main Step-Up Substation Transformer 34.5kV', 'Step-Up Transformer',
    'ABB', 'RETP 31500/115', 'SN-ABB-TX-9041',
    '2021-11-10', '2031-11-10', 'Main Substation', 'Substation Yard Bay 1',
    'operational', null, null, 0, '31.5 MVA'
  );

  insertEquipment.run(
    'EQ-CMB-014', 'Combiner Box CB-A14', 'Combiner Box',
    'Shoals Technologies', '1500V 24-Input BLA', 'SN-SHL-2023-4122',
    '2023-01-20', '2028-01-20', 'Block A Array', 'Row 14, Array Post 2',
    'operational', null, null, 0, '1500V DC / 400A'
  );

  insertEquipment.run(
    'EQ-ARR-B03', 'PV String Array Block B-03', 'Solar PV Array',
    'JA Solar', 'DeepBlue 3.0 Pro 545W Mono', 'SN-JAS-MOD-5542',
    '2022-04-01', '2034-04-01', 'Block B Array', 'Strings 1 to 28, Rows 5-12',
    'operational', null, null, 0, '550 kWp'
  );

  insertEquipment.run(
    'EQ-TRK-008', 'Single-Axis Tracker Motor Drive TR-08', 'Solar Tracker Motor',
    'Nextracker', 'NX Horizon Gen 3 Slew Drive', 'SN-NX-TRK-7719',
    '2022-04-10', '2027-04-10', 'Block C Tracker Field', 'Row C8 Drive Center',
    'operational', null, null, 0, '0.75 kW'
  );

  insertEquipment.run(
    'EQ-SWG-002', 'Medium Voltage Vacuum Switchgear 34.5kV', 'Medium Voltage Switchgear',
    'Schneider Electric', 'Premset 36kV MV Cubicle', 'SN-SCH-SWG-3390',
    '2021-12-05', '2031-12-05', 'Substation Control Room', 'Feeder Cubicle 2',
    'operational', null, null, 0, '34.5 kV / 630A'
  );

  insertEquipment.run(
    'EQ-MET-001', 'Solar Resource Weather & Pyranometer Station', 'Weather & Pyranometer Station',
    'Kipp & Zonen', 'SMP10 Secondary Standard', 'SN-KPZ-MET-1102',
    '2022-02-14', '2027-02-14', 'Meteorological Tower', 'South Field Met Tower',
    'operational', null, null, 0, '0-2000 W/m²'
  );

  // Seed Spare Parts Inventory
  const insertPart = db.prepare(`
    INSERT INTO parts_inventory (
      part_code, name, category, description, unit,
      quantity_on_hand, min_threshold, unit_cost, location_bin
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertPart.run('PRT-FUS-1500', '1500V DC 20A Solar Photovoltaic Fuse', 'Fuses & Protection', 'Mersen HP15M20 gPV 1500V DC 10x85mm', 'pcs', 75, 20, 18.50, 'Bin A-04');
  insertPart.run('PRT-SPD-002', 'Type II DC Surge Protection Device (SPD) 1500V', 'Fuses & Protection', 'Dehn Dehncombo YPV 1500V DC', 'pcs', 18, 5, 145.00, 'Bin A-08');
  insertPart.run('PRT-FAN-INV', '500kW Inverter High-Flow Cooling Blower Fan', 'Inverter Spares', 'EBM-Papst 48V DC 320CFM Inverter Fan', 'pcs', 6, 2, 380.00, 'Bin B-02');
  insertPart.run('PRT-IGBT-MOD', 'Semikron 1200V 600A IGBT Power Module', 'Inverter Spares', 'SKM600GB12T4 Inverter Bridge Module', 'pcs', 3, 2, 850.00, 'Bin B-05');
  insertPart.run('PRT-MC4-PAIR', 'MC4-EVO2 Connector Pair (Male & Female)', 'Connectors & Cables', 'Stäubli Multi-Contact 1500V MC4-EVO2', 'sets', 120, 30, 4.20, 'Bin C-01');
  insertPart.run('PRT-TRK-BRG', 'Tracker Slew Drive Spherical Bearing Bushing', 'Mechanical & Motors', 'Nextracker polymer composite bushing kit', 'sets', 12, 4, 95.00, 'Bin D-03');
  insertPart.run('PRT-TX-OIL', 'Transformer Dielectric Mineral Insulating Oil', 'Transformer & HV', 'Nynas Nytro 4000X Inhibited Oil 20L Drum', 'drums', 8, 3, 210.00, 'Substation Storage');
  insertPart.run('PRT-PASTE-TH', 'High Conductivity Thermal Interface Paste', 'Consumables', 'Dow Corning TC-5026 Thermal Compound 1kg', 'tubes', 14, 5, 45.00, 'Bin E-01');

  // Seed Checklists
  const insertChecklist = db.prepare(`
    INSERT INTO maintenance_checklists (equipment_category, title, checklist_items_json)
    VALUES (?, ?, ?)
  `);

  const inverterChecklistItems = JSON.stringify([
    { id: 'inv-1', label: 'Air filter inspection and dust cleaning', expected_condition: 'Clean / Unobstructed airflow', is_critical: true },
    { id: 'inv-2', label: 'Cooling fan operation and tachometer verification', expected_condition: 'Spinning smoothly, 3200 RPM ± 5%', is_critical: true },
    { id: 'inv-3', label: 'DC and AC terminal torque verification', expected_condition: 'Torqued to 35 N·m per manufacturer specs', is_critical: true },
    { id: 'inv-4', label: 'Thermal camera infrared hotspot scan on busbars', expected_condition: 'Max ΔT < 10°C relative to ambient', is_critical: true },
    { id: 'inv-5', label: 'Internal DC fuse continuity and SPD status', expected_condition: 'All indicators green, no blown fuses', is_critical: true },
    { id: 'inv-6', label: 'Firmware error code diagnostic download', expected_condition: 'No active fault alarms or ground fault trips', is_critical: false }
  ]);

  const pvArrayChecklistItems = JSON.stringify([
    { id: 'pv-1', label: 'Visual check for module glass cracking or delamination', expected_condition: 'No microcracks or yellowing', is_critical: true },
    { id: 'pv-2', label: 'Drone/Handheld IR thermal imaging for hot cells', expected_condition: 'No bypass diode overheating or hotspots', is_critical: true },
    { id: 'pv-3', label: 'Array racking structure bolt tightness and grounding', expected_condition: 'Grounding bond resistance < 1.0 Ohm', is_critical: true },
    { id: 'pv-4', label: 'DC string open-circuit voltage (Voc) verification', expected_condition: 'Voc within ± 3% of array average', is_critical: true },
    { id: 'pv-5', label: 'Soiling index and dust accumulation measurement', expected_condition: 'Soiling loss < 2.5%', is_critical: false }
  ]);

  const transformerChecklistItems = JSON.stringify([
    { id: 'tx-1', label: 'Silica gel breather color and moisture absorption', expected_condition: 'Deep blue / dry (no pink saturated gel)', is_critical: true },
    { id: 'tx-2', label: 'Oil level indicator and temperature gauge reading', expected_condition: 'Level normal, Top oil temp < 65°C', is_critical: true },
    { id: 'tx-3', label: 'High voltage bushing porcelain visual inspection', expected_condition: 'Clean, no oil seepage or flashover marks', is_critical: true },
    { id: 'tx-4', label: 'Buchholz gas relay inspection & gas bleed test', expected_condition: 'Zero accumulated gas trapped', is_critical: true },
    { id: 'tx-5', label: 'Substation ground grid resistance measurement', expected_condition: 'Resistance < 0.5 Ohm', is_critical: true }
  ]);

  insertChecklist.run('Central Inverter', 'Standard Monthly Central Inverter Service & Thermal Diagnostic', inverterChecklistItems);
  insertChecklist.run('Solar PV Array', 'Quarterly PV String IV-Curve & Thermal Scan Inspection', pvArrayChecklistItems);
  insertChecklist.run('Step-Up Transformer', 'Bi-Monthly Substation Transformer Fluid & Dielectric Inspection', transformerChecklistItems);
}
