-- ==============================================================================
-- SUPABASE POSTGRESQL SCHEMA FOR SOLAR PANEL POWER PLANT (KIRAHON, MISAMIS ORIENTAL)
-- Project: muimcnkuovmhdqnakozr (https://muimcnkuovmhdqnakozr.supabase.co)
-- Paste and Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/muimcnkuovmhdqnakozr/sql/new
-- ==============================================================================

-- 1. Users table (Admin & Field Technicians)
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  employee_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'technician')),
  department TEXT NOT NULL,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'deactivated')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Equipment registry for solar power plant assets
CREATE TABLE IF NOT EXISTS public.equipment (
  id SERIAL PRIMARY KEY,
  asset_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  installation_date TEXT,
  warranty_expiry TEXT,
  plant_section TEXT NOT NULL,
  location_description TEXT,
  operational_status TEXT NOT NULL DEFAULT 'operational' CHECK(operational_status IN ('operational', 'under_maintenance', 'faulty', 'decommissioned')),
  last_maintenance_date TEXT,
  next_pm_date TEXT,
  failure_count INTEGER NOT NULL DEFAULT 0,
  rated_capacity TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Work Orders
CREATE TABLE IF NOT EXISTS public.work_orders (
  id SERIAL PRIMARY KEY,
  work_order_code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('corrective', 'preventive')),
  equipment_id INTEGER REFERENCES public.equipment(id) ON DELETE RESTRICT NOT NULL,
  problem_description TEXT NOT NULL,
  operational_impact TEXT,
  plant_section TEXT NOT NULL,
  location TEXT,
  assigned_technician_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  created_by_id INTEGER REFERENCES public.users(id) ON DELETE RESTRICT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'assigned', 'acknowledged', 'in_progress', 'on_hold', 'completed_pending_review', 'revision_required', 'approved', 'closed', 'cancelled')),
  scheduled_date TEXT,
  due_date TEXT,
  actual_start TEXT,
  actual_completion TEXT,
  root_cause_suspected TEXT,
  root_cause_confirmed TEXT,
  labor_hours DOUBLE PRECISION DEFAULT 0,
  labor_cost DOUBLE PRECISION DEFAULT 0,
  parts_cost DOUBLE PRECISION DEFAULT 0,
  total_cost DOUBLE PRECISION DEFAULT 0,
  is_tested_successfully INTEGER DEFAULT 0,
  downtime_hours DOUBLE PRECISION DEFAULT 0,
  restoration_date TEXT,
  follow_up_recommendations TEXT,
  instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Technician Assignments
CREATE TABLE IF NOT EXISTS public.technician_assignments (
  id SERIAL PRIMARY KEY,
  work_order_id INTEGER REFERENCES public.work_orders(id) ON DELETE CASCADE NOT NULL,
  technician_id INTEGER REFERENCES public.users(id) ON DELETE RESTRICT NOT NULL,
  assigned_by_id INTEGER REFERENCES public.users(id) ON DELETE RESTRICT NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  acknowledged_at TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'reassigned', 'completed')),
  notes TEXT
);

-- 5. Maintenance Reports (Detailed technician submission)
CREATE TABLE IF NOT EXISTS public.maintenance_reports (
  id SERIAL PRIMARY KEY,
  work_order_id INTEGER REFERENCES public.work_orders(id) ON DELETE CASCADE UNIQUE NOT NULL,
  technician_id INTEGER REFERENCES public.users(id) ON DELETE RESTRICT NOT NULL,
  work_date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  total_labor_hours DOUBLE PRECISION NOT NULL,
  identified_problem TEXT NOT NULL,
  inspection_findings TEXT NOT NULL,
  root_cause TEXT NOT NULL,
  repair_procedures TEXT NOT NULL,
  actions_performed TEXT NOT NULL,
  final_result TEXT NOT NULL,
  equipment_restored INTEGER NOT NULL DEFAULT 1,
  restoration_time TEXT,
  downtime_hours DOUBLE PRECISION DEFAULT 0,
  defects_discovered TEXT,
  follow_up_recommendations TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Maintenance Checklist Templates
CREATE TABLE IF NOT EXISTS public.maintenance_checklists (
  id SERIAL PRIMARY KEY,
  equipment_category TEXT NOT NULL,
  title TEXT NOT NULL,
  checklist_items_json TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Checklist Results for Work Orders
CREATE TABLE IF NOT EXISTS public.checklist_results (
  id SERIAL PRIMARY KEY,
  work_order_id INTEGER REFERENCES public.work_orders(id) ON DELETE CASCADE NOT NULL,
  item_key TEXT NOT NULL,
  item_label TEXT NOT NULL,
  expected_condition TEXT,
  recorded_value TEXT,
  status TEXT NOT NULL CHECK(status IN ('pass', 'fail', 'warning', 'na')),
  notes TEXT,
  checked_by_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Recurring Preventive Maintenance Schedules
CREATE TABLE IF NOT EXISTS public.maintenance_schedules (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  equipment_id INTEGER REFERENCES public.equipment(id) ON DELETE RESTRICT NOT NULL,
  interval_type TEXT NOT NULL CHECK(interval_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'annual')),
  checklist_id INTEGER REFERENCES public.maintenance_checklists(id) ON DELETE SET NULL,
  default_technician_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  next_due_date TEXT NOT NULL,
  last_run_date TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Work Order Status History
CREATE TABLE IF NOT EXISTS public.work_order_status_history (
  id SERIAL PRIMARY KEY,
  work_order_id INTEGER REFERENCES public.work_orders(id) ON DELETE CASCADE NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by_id INTEGER REFERENCES public.users(id) ON DELETE RESTRICT NOT NULL,
  notes TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Spare Parts Inventory
CREATE TABLE IF NOT EXISTS public.parts_inventory (
  id SERIAL PRIMARY KEY,
  part_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL,
  quantity_on_hand INTEGER NOT NULL CHECK(quantity_on_hand >= 0),
  min_threshold INTEGER NOT NULL DEFAULT 5,
  unit_cost DOUBLE PRECISION NOT NULL CHECK(unit_cost >= 0),
  location_bin TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Inventory Transactions
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id SERIAL PRIMARY KEY,
  part_id INTEGER REFERENCES public.parts_inventory(id) ON DELETE RESTRICT NOT NULL,
  work_order_id INTEGER REFERENCES public.work_orders(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL CHECK(transaction_type IN ('received', 'issued', 'returned', 'adjusted')),
  quantity INTEGER NOT NULL,
  unit_cost DOUBLE PRECISION NOT NULL,
  total_cost DOUBLE PRECISION NOT NULL,
  performed_by_id INTEGER REFERENCES public.users(id) ON DELETE RESTRICT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Work Order Parts Usage
CREATE TABLE IF NOT EXISTS public.work_order_parts (
  id SERIAL PRIMARY KEY,
  work_order_id INTEGER REFERENCES public.work_orders(id) ON DELETE CASCADE NOT NULL,
  part_id INTEGER REFERENCES public.parts_inventory(id) ON DELETE RESTRICT NOT NULL,
  quantity_used INTEGER NOT NULL CHECK(quantity_used > 0),
  unit_cost DOUBLE PRECISION NOT NULL,
  total_cost DOUBLE PRECISION NOT NULL,
  issued_by_id INTEGER REFERENCES public.users(id) ON DELETE RESTRICT NOT NULL,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. Attachments
CREATE TABLE IF NOT EXISTS public.attachments (
  id SERIAL PRIMARY KEY,
  work_order_id INTEGER REFERENCES public.work_orders(id) ON DELETE CASCADE NOT NULL,
  report_id INTEGER REFERENCES public.maintenance_reports(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_category TEXT NOT NULL,
  file_data TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_by_id INTEGER REFERENCES public.users(id) ON DELETE RESTRICT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 14. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  work_order_id INTEGER REFERENCES public.work_orders(id) ON DELETE SET NULL,
  equipment_id INTEGER REFERENCES public.equipment(id) ON DELETE SET NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 15. Approvals History
CREATE TABLE IF NOT EXISTS public.approvals (
  id SERIAL PRIMARY KEY,
  work_order_id INTEGER REFERENCES public.work_orders(id) ON DELETE CASCADE NOT NULL,
  report_id INTEGER REFERENCES public.maintenance_reports(id) ON DELETE CASCADE NOT NULL,
  reviewer_id INTEGER REFERENCES public.users(id) ON DELETE RESTRICT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('approved', 'revision_required')),
  review_comments TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 16. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  user_email TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details_json TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS) & PUBLIC ANON ACCESS POLICIES
-- ==============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technician_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow anon full access for all tables in this power plant operations app
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "anon_full_access" ON public.%I;', tbl);
    EXECUTE format('CREATE POLICY "anon_full_access" ON public.%I FOR ALL TO anon USING (true) WITH CHECK (true);', tbl);
  END LOOP;
END $$;

-- ==============================================================================
-- SEED INITIAL BASELINE DATA (Kirahon Solar Power Plant, Kirahon, Misamis Oriental)
-- ==============================================================================

-- 1. Default Admin user (Password: 123456)
INSERT INTO public.users (id, employee_id, full_name, email, password_hash, role, department, phone, status)
VALUES (1, 'admin', 'System Administrator', 'admin@kirahon-solar.ph', '$2b$10$Gq2B16/IWj0IxGASt4.inu7HlwT3uTQix4LR0R5W326/GLOYx6O8e', 'admin', 'Plant Administration', '+63 917 555 1001', 'active')
ON CONFLICT (id) DO NOTHING;

-- 2. Kirahon Solar Plant Equipment Assets
INSERT INTO public.equipment (asset_id, name, category, manufacturer, model, serial_number, installation_date, warranty_expiry, plant_section, location_description, operational_status, rated_capacity)
VALUES
  ('EQ-INV-001', 'Central Inverter Unit 01', 'Central Inverter', 'SMA Solar Technology', 'Sunny Central 2500-EV', 'SN-SMA-2022-8812', '2022-03-15', '2027-03-15', 'Inverter Station 1', 'Block A1, Central Enclosure', 'operational', '2,500 kW'),
  ('EQ-INV-002', 'Central Inverter Unit 02', 'Central Inverter', 'SMA Solar Technology', 'Sunny Central 2500-EV', 'SN-SMA-2022-8813', '2022-03-15', '2027-03-15', 'Inverter Station 2', 'Block A2, Central Enclosure', 'operational', '2,500 kW'),
  ('EQ-TRF-001', 'Main Step-Up Substation Transformer 34.5kV', 'Step-Up Transformer', 'ABB', 'RETP 31500/115', 'SN-ABB-TX-9041', '2021-11-10', '2031-11-10', 'Main Substation', 'Substation Yard Bay 1', 'operational', '31.5 MVA'),
  ('EQ-CMB-014', 'Combiner Box CB-A14', 'Combiner Box', 'Shoals Technologies', '1500V 24-Input BLA', 'SN-SHL-2023-4122', '2023-01-20', '2028-01-20', 'Block A Array', 'Row 14, Array Post 2', 'operational', '1500V DC / 400A'),
  ('EQ-ARR-B03', 'PV String Array Block B-03', 'Solar PV Array', 'JA Solar', 'DeepBlue 3.0 Pro 545W Mono', 'SN-JAS-MOD-5542', '2022-04-01', '2034-04-01', 'Block B Array', 'Strings 1 to 28, Rows 5-12', 'operational', '550 kWp'),
  ('EQ-TRK-008', 'Single-Axis Tracker Motor Drive TR-08', 'Solar Tracker Motor', 'Nextracker', 'NX Horizon Gen 3 Slew Drive', 'SN-NX-TRK-7719', '2022-04-10', '2027-04-10', 'Block C Tracker Field', 'Row C8 Drive Center', 'operational', '0.75 kW'),
  ('EQ-SWG-002', 'Medium Voltage Vacuum Switchgear 34.5kV', 'Medium Voltage Switchgear', 'Schneider Electric', 'Premset 36kV MV Cubicle', 'SN-SCH-SWG-3390', '2021-12-05', '2031-12-05', 'Substation Control Room', 'Feeder Cubicle 2', 'operational', '34.5 kV / 630A'),
  ('EQ-MET-001', 'Solar Resource Weather & Pyranometer Station', 'Weather & Pyranometer Station', 'Kipp & Zonen', 'SMP10 Secondary Standard', 'SN-KPZ-MET-1102', '2022-02-14', '2027-02-14', 'Meteorological Tower', 'South Field Met Tower', 'operational', '0-2000 W/m²')
ON CONFLICT (asset_id) DO NOTHING;

-- 3. Warehouse Spare Parts Inventory
INSERT INTO public.parts_inventory (part_code, name, category, description, unit, quantity_on_hand, min_threshold, unit_cost, location_bin)
VALUES
  ('PRT-FUS-1500', '1500V DC 20A Solar Photovoltaic Fuse', 'Fuses & Protection', 'Mersen HP15M20 gPV 1500V DC 10x85mm', 'pcs', 75, 20, 18.50, 'Bin A-04'),
  ('PRT-SPD-002', 'Type II DC Surge Protection Device (SPD) 1500V', 'Fuses & Protection', 'Dehn Dehncombo YPV 1500V DC', 'pcs', 18, 5, 145.00, 'Bin A-08'),
  ('PRT-FAN-INV', '500kW Inverter High-Flow Cooling Blower Fan', 'Inverter Spares', 'EBM-Papst 48V DC 320CFM Inverter Fan', 'pcs', 6, 2, 380.00, 'Bin B-02'),
  ('PRT-IGBT-MOD', 'Semikron 1200V 600A IGBT Power Module', 'Inverter Spares', 'SKM600GB12T4 Inverter Bridge Module', 'pcs', 3, 2, 850.00, 'Bin B-05'),
  ('PRT-MC4-PAIR', 'MC4-EVO2 Connector Pair (Male & Female)', 'Connectors & Cables', 'Stäubli Multi-Contact 1500V MC4-EVO2', 'sets', 120, 30, 4.20, 'Bin C-01'),
  ('PRT-TRK-BRG', 'Tracker Slew Drive Spherical Bearing Bushing', 'Mechanical & Motors', 'Nextracker polymer composite bushing kit', 'sets', 12, 4, 95.00, 'Bin D-03'),
  ('PRT-TX-OIL', 'Transformer Dielectric Mineral Insulating Oil', 'Transformer & HV', 'Nynas Nytro 4000X Inhibited Oil 20L Drum', 'drums', 8, 3, 210.00, 'Substation Storage'),
  ('PRT-PASTE-TH', 'High Conductivity Thermal Interface Paste', 'Consumables', 'Dow Corning TC-5026 Thermal Compound 1kg', 'tubes', 14, 5, 45.00, 'Bin E-01')
ON CONFLICT (part_code) DO NOTHING;

-- 4. Standard Maintenance Checklists
INSERT INTO public.maintenance_checklists (equipment_category, title, checklist_items_json)
VALUES
  ('Central Inverter', 'Standard Monthly Central Inverter Service & Thermal Diagnostic', '[{"id":"inv-1","label":"Air filter inspection and dust cleaning","expected_condition":"Clean / Unobstructed airflow","is_critical":true},{"id":"inv-2","label":"Cooling fan operation and tachometer verification","expected_condition":"Spinning smoothly, 3200 RPM ± 5%","is_critical":true},{"id":"inv-3","label":"DC and AC terminal torque verification","expected_condition":"Torqued to 35 N·m per manufacturer specs","is_critical":true},{"id":"inv-4","label":"Thermal camera infrared hotspot scan on busbars","expected_condition":"Max ΔT < 10°C relative to ambient","is_critical":true},{"id":"inv-5","label":"Internal DC fuse continuity and SPD status","expected_condition":"All indicators green, no blown fuses","is_critical":true},{"id":"inv-6","label":"Firmware error code diagnostic download","expected_condition":"No active fault alarms or ground fault trips","is_critical":false}]'),
  ('Solar PV Array', 'Quarterly PV String IV-Curve & Thermal Scan Inspection', '[{"id":"pv-1","label":"Visual check for module glass cracking or delamination","expected_condition":"No microcracks or yellowing","is_critical":true},{"id":"pv-2","label":"Drone/Handheld IR thermal imaging for hot cells","expected_condition":"No bypass diode overheating or hotspots","is_critical":true},{"id":"pv-3","label":"Array racking structure bolt tightness and grounding","expected_condition":"Grounding bond resistance < 1.0 Ohm","is_critical":true},{"id":"pv-4","label":"DC string open-circuit voltage (Voc) verification","expected_condition":"Voc within ± 3% of array average","is_critical":true},{"id":"pv-5","label":"Soiling index and dust accumulation measurement","expected_condition":"Soiling loss < 2.5%","is_critical":false}]'),
  ('Step-Up Transformer', 'Bi-Monthly Substation Transformer Fluid & Dielectric Inspection', '[{"id":"tx-1","label":"Silica gel breather color and moisture absorption","expected_condition":"Deep blue / dry (no pink saturated gel)","is_critical":true},{"id":"tx-2","label":"Oil level indicator and temperature gauge reading","expected_condition":"Level normal, Top oil temp < 65°C","is_critical":true},{"id":"tx-3","label":"High voltage bushing porcelain visual inspection","expected_condition":"Clean, no oil seepage or flashover marks","is_critical":true},{"id":"tx-4","label":"Buchholz gas relay inspection & gas bleed test","expected_condition":"Zero accumulated gas trapped","is_critical":true},{"id":"tx-5","label":"Substation ground grid resistance measurement","expected_condition":"Resistance < 0.5 Ohm","is_critical":true}]');
