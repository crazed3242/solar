import bcrypt from 'bcryptjs';
import { AsyncLocalStorage } from 'node:async_hooks';
import type { PoolClient } from 'pg';
import { pool, db as drizzleDb } from '../src/db/index.ts';
import * as schema from '../src/db/schema.ts';

export { pool, drizzleDb };

// AsyncLocalStorage tracks the active transaction client across async call trees
const transactionStorage = new AsyncLocalStorage<PoolClient>();

// SQL Parameter & Syntax translation from SQLite to PostgreSQL
export function convertSql(sql: string): string {
  let paramIndex = 1;
  // Replace ? with $1, $2, ...
  let converted = sql.replace(/\?/g, () => `$${paramIndex++}`);
  // Replace SQLite specific functions
  converted = converted.replace(/datetime\('now'\)/gi, 'CURRENT_TIMESTAMP');
  
  // If INSERT query without RETURNING, append RETURNING id
  if (/^\s*INSERT\s+INTO\b/i.test(converted) && !/\bRETURNING\b/i.test(converted)) {
    converted = converted.trim().replace(/;+$/, '') + ' RETURNING id';
  }
  return converted;
}

// Unified Database execution wrapper compatible with async operations
export const db = {
  async query(sqlText: string, params: any[] = []): Promise<any> {
    const executor = transactionStorage.getStore() || pool;
    const finalSql = convertSql(sqlText);
    const flatParams = Array.isArray(params[0]) && params.length === 1 ? params[0] : params;
    return await executor.query(finalSql, flatParams);
  },

  async all(sqlText: string, ...params: any[]): Promise<any[]> {
    const res = await this.query(sqlText, params);
    return res.rows;
  },

  async get(sqlText: string, ...params: any[]): Promise<any> {
    const res = await this.query(sqlText, params);
    return res.rows[0] || null;
  },

  async run(sqlText: string, ...params: any[]): Promise<{ lastInsertRowid: number; changes: number }> {
    const res = await this.query(sqlText, params);
    const lastId = res.rows && res.rows[0] && res.rows[0].id ? Number(res.rows[0].id) : 0;
    return {
      lastInsertRowid: lastId,
      changes: res.rowCount || 0,
    };
  },

  async exec(sqlText: string): Promise<void> {
    const executor = transactionStorage.getStore() || pool;
    await executor.query(sqlText);
  },

  prepare(sqlText: string) {
    return {
      all: async (...params: any[]) => {
        const flatParams = Array.isArray(params[0]) && params.length === 1 ? params[0] : params;
        const res = await db.query(sqlText, flatParams);
        return res.rows;
      },
      get: async (...params: any[]) => {
        const flatParams = Array.isArray(params[0]) && params.length === 1 ? params[0] : params;
        const res = await db.query(sqlText, flatParams);
        return res.rows[0] || null;
      },
      run: async (...params: any[]) => {
        const flatParams = Array.isArray(params[0]) && params.length === 1 ? params[0] : params;
        const res = await db.query(sqlText, flatParams);
        const lastId = res.rows && res.rows[0] && res.rows[0].id ? Number(res.rows[0].id) : 0;
        return {
          lastInsertRowid: lastId,
          changes: res.rowCount || 0,
        };
      },
    };
  },

  transaction(txFn: (...args: any[]) => Promise<any> | any) {
    return async (...args: any[]) => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await transactionStorage.run(client, async () => {
          return await txFn(...args);
        });
        await client.query('COMMIT');
        return result;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    };
  },
};

// Ensure admin account exists: username 'admin', password '123456'
export async function ensureAdminAccount() {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync('123456', salt);

  const existingAdmin = await db.get("SELECT id FROM users WHERE employee_id = 'admin' OR id = 1");
  if (existingAdmin) {
    await db.run(
      `UPDATE users
       SET employee_id = 'admin',
           full_name = 'System Administrator',
           email = 'admin',
           password_hash = ?,
           role = 'admin',
           department = 'Plant Administration',
           phone = '+63 917 555 1001',
           status = 'active',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      hash,
      existingAdmin.id
    );
  } else {
    await db.run(
      `INSERT INTO users (id, employee_id, full_name, email, password_hash, role, department, phone, status)
       VALUES (1, 'admin', 'System Administrator', 'admin', ?, 'admin', 'Plant Administration', '+63 917 555 1001', 'active')
       ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      hash
    );
  }
}

// Reset entire database to a clean start-over slate
export async function resetAllDataToCleanSlate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
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
      DELETE FROM users WHERE employee_id != 'admin';

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

      -- Reset auto-increment sequences so IDs start cleanly at 1
      SELECT setval('work_orders_id_seq', 1, false);
      SELECT setval('technician_assignments_id_seq', 1, false);
      SELECT setval('maintenance_reports_id_seq', 1, false);
      SELECT setval('checklist_results_id_seq', 1, false);
      SELECT setval('work_order_status_history_id_seq', 1, false);
      SELECT setval('work_order_parts_id_seq', 1, false);
      SELECT setval('attachments_id_seq', 1, false);
      SELECT setval('notifications_id_seq', 1, false);
      SELECT setval('approvals_id_seq', 1, false);
      SELECT setval('audit_logs_id_seq', 1, false);
      SELECT setval('inventory_transactions_id_seq', 1, false);
      SELECT setval('maintenance_schedules_id_seq', 1, false);
    `);
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }

  await ensureAdminAccount();
}

// Seed baseline data for Kirahon Solar Power Plant (Zero work orders, zero reports)
export async function seedInitialData() {
  const usersCountRes = await db.get('SELECT COUNT(*) as count FROM users');
  const userCount = Number(usersCountRes?.count || 0);

  if (userCount === 0) {
    await ensureAdminAccount();
  }

  // Seed Equipment if not already present
  const equipCountRes = await db.get('SELECT COUNT(*) as count FROM equipment');
  const equipCount = Number(equipCountRes?.count || 0);

  if (equipCount === 0) {
    const assets = [
      ['EQ-INV-001', 'Central Inverter Unit 01', 'Central Inverter', 'SMA Solar Technology', 'Sunny Central 2500-EV', 'SN-SMA-2022-8812', '2022-03-15', '2027-03-15', 'Inverter Station 1', 'Block A1, Central Enclosure', 'operational', null, null, 0, '2,500 kW'],
      ['EQ-INV-002', 'Central Inverter Unit 02', 'Central Inverter', 'SMA Solar Technology', 'Sunny Central 2500-EV', 'SN-SMA-2022-8813', '2022-03-15', '2027-03-15', 'Inverter Station 2', 'Block A2, Central Enclosure', 'operational', null, null, 0, '2,500 kW'],
      ['EQ-TRF-001', 'Main Step-Up Substation Transformer 34.5kV', 'Step-Up Transformer', 'ABB', 'RETP 31500/115', 'SN-ABB-TX-9041', '2021-11-10', '2031-11-10', 'Main Substation', 'Substation Yard Bay 1', 'operational', null, null, 0, '31.5 MVA'],
      ['EQ-CMB-014', 'Combiner Box CB-A14', 'Combiner Box', 'Shoals Technologies', '1500V 24-Input BLA', 'SN-SHL-2023-4122', '2023-01-20', '2028-01-20', 'Block A Array', 'Row 14, Array Post 2', 'operational', null, null, 0, '1500V DC / 400A'],
      ['EQ-ARR-B03', 'PV String Array Block B-03', 'Solar PV Array', 'JA Solar', 'DeepBlue 3.0 Pro 545W Mono', 'SN-JAS-MOD-5542', '2022-04-01', '2034-04-01', 'Block B Array', 'Strings 1 to 28, Rows 5-12', 'operational', null, null, 0, '550 kWp'],
      ['EQ-TRK-008', 'Single-Axis Tracker Motor Drive TR-08', 'Solar Tracker Motor', 'Nextracker', 'NX Horizon Gen 3 Slew Drive', 'SN-NX-TRK-7719', '2022-04-10', '2027-04-10', 'Block C Tracker Field', 'Row C8 Drive Center', 'operational', null, null, 0, '0.75 kW'],
      ['EQ-SWG-002', 'Medium Voltage Vacuum Switchgear 34.5kV', 'Medium Voltage Switchgear', 'Schneider Electric', 'Premset 36kV MV Cubicle', 'SN-SCH-SWG-3390', '2021-12-05', '2031-12-05', 'Substation Control Room', 'Feeder Cubicle 2', 'operational', null, null, 0, '34.5 kV / 630A'],
      ['EQ-MET-001', 'Solar Resource Weather & Pyranometer Station', 'Weather & Pyranometer Station', 'Kipp & Zonen', 'SMP10 Secondary Standard', 'SN-KPZ-MET-1102', '2022-02-14', '2027-02-14', 'Meteorological Tower', 'South Field Met Tower', 'operational', null, null, 0, '0-2000 W/m²'],
    ];

    for (const a of assets) {
      await db.run(
        `INSERT INTO equipment (
          asset_id, name, category, manufacturer, model, serial_number,
          installation_date, warranty_expiry, plant_section, location_description,
          operational_status, last_maintenance_date, next_pm_date, failure_count, rated_capacity
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ...a
      );
    }
  }

  // Seed Spare Parts Inventory if not already present
  const partsCountRes = await db.get('SELECT COUNT(*) as count FROM parts_inventory');
  const partsCount = Number(partsCountRes?.count || 0);

  if (partsCount === 0) {
    const parts = [
      ['PRT-FUS-1500', '1500V DC 20A Solar Photovoltaic Fuse', 'Fuses & Protection', 'Mersen HP15M20 gPV 1500V DC 10x85mm', 'pcs', 75, 20, 18.50, 'Bin A-04'],
      ['PRT-SPD-002', 'Type II DC Surge Protection Device (SPD) 1500V', 'Fuses & Protection', 'Dehn Dehncombo YPV 1500V DC', 'pcs', 18, 5, 145.00, 'Bin A-08'],
      ['PRT-FAN-INV', '500kW Inverter High-Flow Cooling Blower Fan', 'Inverter Spares', 'EBM-Papst 48V DC 320CFM Inverter Fan', 'pcs', 6, 2, 380.00, 'Bin B-02'],
      ['PRT-IGBT-MOD', 'Semikron 1200V 600A IGBT Power Module', 'Inverter Spares', 'SKM600GB12T4 Inverter Bridge Module', 'pcs', 3, 2, 850.00, 'Bin B-05'],
      ['PRT-MC4-PAIR', 'MC4-EVO2 Connector Pair (Male & Female)', 'Connectors & Cables', 'Stäubli Multi-Contact 1500V MC4-EVO2', 'sets', 120, 30, 4.20, 'Bin C-01'],
      ['PRT-TRK-BRG', 'Tracker Slew Drive Spherical Bearing Bushing', 'Mechanical & Motors', 'Nextracker polymer composite bushing kit', 'sets', 12, 4, 95.00, 'Bin D-03'],
      ['PRT-TX-OIL', 'Transformer Dielectric Mineral Insulating Oil', 'Transformer & HV', 'Nynas Nytro 4000X Inhibited Oil 20L Drum', 'drums', 8, 3, 210.00, 'Substation Storage'],
      ['PRT-PASTE-TH', 'High Conductivity Thermal Interface Paste', 'Consumables', 'Dow Corning TC-5026 Thermal Compound 1kg', 'tubes', 14, 5, 45.00, 'Bin E-01'],
    ];

    for (const p of parts) {
      await db.run(
        `INSERT INTO parts_inventory (
          part_code, name, category, description, unit,
          quantity_on_hand, min_threshold, unit_cost, location_bin
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ...p
      );
    }
  }

  // Seed Checklists if not already present
  const checkCountRes = await db.get('SELECT COUNT(*) as count FROM maintenance_checklists');
  const checkCount = Number(checkCountRes?.count || 0);

  if (checkCount === 0) {
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

    await db.run('INSERT INTO maintenance_checklists (equipment_category, title, checklist_items_json) VALUES (?, ?, ?)', 'Central Inverter', 'Standard Monthly Central Inverter Service & Thermal Diagnostic', inverterChecklistItems);
    await db.run('INSERT INTO maintenance_checklists (equipment_category, title, checklist_items_json) VALUES (?, ?, ?)', 'Solar PV Array', 'Quarterly PV String IV-Curve & Thermal Scan Inspection', pvArrayChecklistItems);
    await db.run('INSERT INTO maintenance_checklists (equipment_category, title, checklist_items_json) VALUES (?, ?, ?)', 'Step-Up Transformer', 'Bi-Monthly Substation Transformer Fluid & Dielectric Inspection', transformerChecklistItems);
  }
}

// Master initialization
export async function initDb() {
  await seedInitialData();
  await ensureAdminAccount();
}
