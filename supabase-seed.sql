-- ==============================================================================
-- SUPABASE DUMMY SEED DATA FOR SOLAR PANEL POWER PLANT (KIRAHON, MISAMIS ORIENTAL)
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/muimcnkuovmhdqnakozr/sql/new
-- ==============================================================================

-- 1. Field Technicians (Password for all accounts: 123456)
INSERT INTO public.users (id, employee_id, full_name, email, password_hash, role, department, phone, status)
VALUES
  (2, 'EMP-TEC-101', 'Juan Dela Cruz', 'juan.delacruz@kirahon-solar.ph', '$2b$10$Gq2B16/IWj0IxGASt4.inu7HlwT3uTQix4LR0R5W326/GLOYx6O8e', 'technician', 'Electrical Maintenance', '+63 917 555 2001', 'active'),
  (3, 'EMP-TEC-102', 'Maria Santos', 'maria.santos@kirahon-solar.ph', '$2b$10$Gq2B16/IWj0IxGASt4.inu7HlwT3uTQix4LR0R5W326/GLOYx6O8e', 'technician', 'Inverter & Instrumentation', '+63 918 555 2002', 'active'),
  (4, 'EMP-TEC-103', 'Rodrigo Tan', 'rodrigo.tan@kirahon-solar.ph', '$2b$10$Gq2B16/IWj0IxGASt4.inu7HlwT3uTQix4LR0R5W326/GLOYx6O8e', 'technician', 'Solar PV Array & DC Systems', '+63 919 555 2003', 'active'),
  (5, 'EMP-TEC-104', 'Elena Gomez', 'elena.gomez@kirahon-solar.ph', '$2b$10$Gq2B16/IWj0IxGASt4.inu7HlwT3uTQix4LR0R5W326/GLOYx6O8e', 'technician', 'High Voltage & Substation', '+63 920 555 2004', 'active')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  department = EXCLUDED.department,
  phone = EXCLUDED.phone,
  status = EXCLUDED.status;

-- Advance users sequence
SELECT setval('public.users_id_seq', (SELECT MAX(id) FROM public.users));

-- 2. Preventive Maintenance Schedules
INSERT INTO public.maintenance_schedules (id, title, equipment_id, interval_type, checklist_id, default_technician_id, next_due_date, last_run_date, is_active, notes)
VALUES
  (1, 'Monthly Central Inverter 01 Diagnostic & Thermal Sweep', 1, 'monthly', 1, 3, '2026-11-20', '2026-10-20', 1, 'Routine thermal scan of busbars and cooling system check'),
  (2, 'Quarterly PV String Array IV-Curve & Hotspot Survey', 5, 'quarterly', 2, 4, '2026-12-01', '2026-09-01', 1, 'Drone infrared thermography and VOC testing'),
  (3, 'Bi-Monthly Substation Transformer Fluid & Dielectric Test', 3, 'monthly', 3, 5, '2026-11-15', '2026-09-15', 1, 'Oil sampling, moisture analysis, and bushing inspection'),
  (4, 'Bi-Weekly Tracker Drive Lubrication & Slew Gear Backlash', 6, 'weekly', NULL, 2, '2026-11-12', '2026-10-28', 1, 'Check torque tube clamp bolts and grease slew drive bearings')
ON CONFLICT (id) DO UPDATE SET
  next_due_date = EXCLUDED.next_due_date,
  is_active = EXCLUDED.is_active;

SELECT setval('public.maintenance_schedules_id_seq', (SELECT MAX(id) FROM public.maintenance_schedules));

-- 3. Realistic Work Orders across different workflow stages
INSERT INTO public.work_orders (
  id, work_order_code, type, equipment_id, problem_description, operational_impact,
  plant_section, location, assigned_technician_id, created_by_id, priority, status,
  scheduled_date, due_date, actual_start, actual_completion, root_cause_suspected,
  root_cause_confirmed, labor_hours, labor_cost, parts_cost, total_cost, is_tested_successfully,
  downtime_hours, restoration_date, follow_up_recommendations, instructions
) VALUES
  (
    1, 'WO-2026-0001', 'corrective', 1,
    'Central Inverter 01 IGBT Bridge Module Over-Temperature Fault (Alarm E-4402). DC power derated to 60%.',
    'Plant generation reduced by 1.0 MW during peak noon irradiance hours.',
    'Inverter Station 1', 'Block A1 Enclosure', 3, 1, 'high', 'approved',
    '2026-11-02', '2026-11-03', '2026-11-02 08:30:00+00', '2026-11-02 12:45:00+00',
    'Accumulated tropical dust in air filter causing blower intake pressure drop.',
    'Clogged intake filter pack combined with degraded thermal paste on bridge heatsink.',
    4.25, 212.50, 425.00, 637.50, 1,
    4.25, '2026-11-02 12:45:00', 'Inspect adjacent Inverter 02 thermal profiles during next scheduled PM sweep.',
    'Lockout/Tagout 34.5kV MV breaker and DC disconnect before opening bridge enclosure.'
  ),
  (
    2, 'WO-2026-0002', 'corrective', 4,
    'Combiner Box CB-A14 String 08 blown fuse indication on SCADA string monitor. String current 0A.',
    'Isolated loss of single 24-panel string (~13.2 kW). Minimal overall farm impact.',
    'Block A Array', 'Row 14, Post 2', 2, 1, 'medium', 'in_progress',
    '2026-11-05', '2026-11-07', '2026-11-06 02:15:00+00', NULL,
    'DC line surge or localized module short circuit during afternoon thunderstorm.',
    NULL, 0, 0, 0, 0, 0,
    0, NULL, NULL,
    'Test string open-circuit voltage (Voc) and short-circuit current (Isc) prior to fuse replacement.'
  ),
  (
    3, 'WO-2026-0003', 'preventive', 5,
    'Scheduled Q4 Preventive Maintenance: 550 kWp PV Array String IV-Curve Diagnostic & Drone Thermal Inspection.',
    'Routine maintenance performed in parallel with normal grid delivery.',
    'Block B Array', 'Rows 5-12 Strings 1-28', 4, 1, 'low', 'completed_pending_review',
    '2026-11-04', '2026-11-06', '2026-11-05 07:00:00+00', '2026-11-05 15:30:00+00',
    NULL,
    'Two bypass diodes found slightly degraded on panel B03-R08-P12; array operational.',
    8.5, 425.00, 0, 425.00, 1,
    0, '2026-11-05 15:30:00', 'Monitor hot cell on panel B03-R08-P12 during next monthly pyranometer calibration.',
    'Follow standard 5-point PV Array checklist.'
  ),
  (
    4, 'WO-2026-0004', 'corrective', 6,
    'Tracker Motor Drive TR-08 Mechanical Slew Binding & Angle Position Error (> 15° misalignment).',
    'Tracker in locked stow position causing ~8% daily tracking yield loss on Row C8.',
    'Block C Tracker Field', 'Row C8 Drive Center', NULL, 1, 'medium', 'open',
    '2026-11-06', '2026-11-08', NULL, NULL,
    'Possible torque tube bearing seizure or foreign debris in slew gear teeth.',
    NULL, 0, 0, 0, 0, 0,
    0, NULL, NULL,
    'Field technician to mobilize, manually disengage drive motor, and inspect composite bushing.'
  ),
  (
    5, 'WO-2026-0005', 'preventive', 3,
    'Bi-Monthly Substation Transformer Fluid & Dielectric Inspection 34.5kV/115kV.',
    'Executed during scheduled off-peak low irradiance window.',
    'Main Substation', 'Yard Bay 1', 5, 1, 'critical', 'assigned',
    '2026-11-07', '2026-11-09', NULL, NULL,
    NULL,
    NULL, 0, 0, 0, 0, 0,
    0, NULL, NULL,
    'Check silica gel breather color, top oil temperature gauge, Buchholz relay gas pocket, and take 500mL fluid sample.'
  )
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  assigned_technician_id = EXCLUDED.assigned_technician_id,
  problem_description = EXCLUDED.problem_description,
  total_cost = EXCLUDED.total_cost;

SELECT setval('public.work_orders_id_seq', (SELECT MAX(id) FROM public.work_orders));

-- 4. Technician Assignments
INSERT INTO public.technician_assignments (id, work_order_id, technician_id, assigned_by_id, assigned_at, acknowledged_at, status, notes)
VALUES
  (1, 1, 3, 1, '2026-11-02 08:00:00+00', '2026-11-02 08:15:00+00', 'completed', 'Dispatched with emergency inverter spare kit'),
  (2, 2, 2, 1, '2026-11-05 09:30:00+00', '2026-11-05 10:00:00+00', 'active', 'Technician mobilized to Block A combiner yard'),
  (3, 3, 4, 1, '2026-11-04 07:00:00+00', '2026-11-04 07:10:00+00', 'completed', 'Standard Q4 inspection team assigned'),
  (4, 5, 5, 1, '2026-11-06 04:00:00+00', '2026-11-06 04:30:00+00', 'active', 'Substation certified high-voltage lead technician assigned')
ON CONFLICT (id) DO NOTHING;

SELECT setval('public.technician_assignments_id_seq', (SELECT MAX(id) FROM public.technician_assignments));

-- 5. Maintenance Reports (Detailed Technical Submissions)
INSERT INTO public.maintenance_reports (
  id, work_order_id, technician_id, work_date, start_time, end_time, total_labor_hours,
  identified_problem, inspection_findings, root_cause, repair_procedures, actions_performed,
  final_result, equipment_restored, restoration_time, downtime_hours, defects_discovered,
  follow_up_recommendations, submitted_at
) VALUES
  (
    1, 1, 3, '2026-11-02', '08:30', '12:45', 4.25,
    'Central Inverter 01 tripped with high temperature alert on Bridge Heatsink B.',
    'Blower fan 2 spinning at degraded RPM (1800 vs 3200 nominal); thermal paste dried out.',
    'Dust ingress through ruptured secondary filter mesh coupled with thermal compound age.',
    '1. Isolated 34.5kV AC/DC breaker.\n2. Removed blower fan assembly.\n3. Cleaned heatsink with compressed dry nitrogen.\n4. Replaced cooling blower fan and applied fresh Dow Corning thermal interface compound.\n5. Re-torqued IGBT busbar bolts to 35 N·m.',
    'Installed 1x replacement blower fan (PRT-FAN-INV) and reapplied thermal paste (PRT-PASTE-TH). Verified full rated 2,500 kW load test without temperature spike.',
    'Inverter restored to 100% nominal output. Temperature stabilized at 48°C under full load.',
    1, '2026-11-02 12:45:00', 4.25, 'Air intake filter mesh requires replacement during Q1 2027.',
    'Inspect Inverter 02 cooling fan bearing play next week.',
    '2026-11-02 13:00:00+00'
  ),
  (
    2, 3, 4, '2026-11-05', '07:00', '15:30', 8.5,
    'Routine preventive inspection for 28 strings on Block B Array.',
    'Array structure structurally sound. Average Voc was 1140V (nominal 1145V).',
    'Minor dust deposition and bird soiling on rows 11-12.',
    'Performed handheld thermal imaging on all 28 string combiner posts. Cleaned array modules with demineralized water spray.',
    'TestedVoc/Isc on all strings. Identified slight hotspot on module B03-R08-P12; bypass diode functioning.',
    'All 28 strings verified within ± 1.5% voltage balance. PV array operating cleanly.',
    1, '2026-11-05 15:30:00', 0, 'Hot cell on module B03-R08-P12 monitored.',
    'Schedule automated dry-cleaning brush sweep in 30 days.',
    '2026-11-05 16:00:00+00'
  )
ON CONFLICT (id) DO UPDATE SET
  final_result = EXCLUDED.final_result,
  total_labor_hours = EXCLUDED.total_labor_hours;

SELECT setval('public.maintenance_reports_id_seq', (SELECT MAX(id) FROM public.maintenance_reports));

-- 6. Checklist Results for Work Order 3 (Preventive)
INSERT INTO public.checklist_results (id, work_order_id, item_key, item_label, expected_condition, recorded_value, status, notes, checked_by_id)
VALUES
  (1, 3, 'pv-1', 'Visual check for module glass cracking or delamination', 'No microcracks or yellowing', 'Glass clear, no hail impact or microcracks', 'pass', 'Inspected 28 strings', 4),
  (2, 3, 'pv-2', 'Drone/Handheld IR thermal imaging for hot cells', 'No bypass diode overheating or hotspots', 'ΔT = 4.2°C hotspot on module B03-R08-P12', 'warning', 'Minor cell hotspot logged for observation', 4),
  (3, 3, 'pv-3', 'Array racking structure bolt tightness and grounding', 'Grounding bond resistance < 1.0 Ohm', '0.42 Ohm ground resistance measured', 'pass', 'Torqued post fasteners', 4),
  (4, 3, 'pv-4', 'DC string open-circuit voltage (Voc) verification', 'Voc within ± 3% of array average', '1140V to 1144V across strings 1-28', 'pass', 'Balanced DC output', 4),
  (5, 3, 'pv-5', 'Soiling index and dust accumulation measurement', 'Soiling loss < 2.5%', '1.8% soiling loss after demineralized wash', 'pass', 'Post-wash reading optimal', 4)
ON CONFLICT (id) DO NOTHING;

SELECT setval('public.checklist_results_id_seq', (SELECT MAX(id) FROM public.checklist_results));

-- 7. Work Order Parts Usage
INSERT INTO public.work_order_parts (id, work_order_id, part_id, quantity_used, unit_cost, total_cost, issued_by_id)
VALUES
  (1, 1, 3, 1, 380.00, 380.00, 1),
  (2, 1, 8, 1, 45.00, 45.00, 1)
ON CONFLICT (id) DO NOTHING;

SELECT setval('public.work_order_parts_id_seq', (SELECT MAX(id) FROM public.work_order_parts));

-- 8. Inventory Transactions
INSERT INTO public.inventory_transactions (id, part_id, work_order_id, transaction_type, quantity, unit_cost, total_cost, performed_by_id, notes)
VALUES
  (1, 3, 1, 'issued', 1, 380.00, 380.00, 3, 'Used for WO-2026-0001 (Inverter 01 Cooling Blower Fan)'),
  (2, 8, 1, 'issued', 1, 45.00, 45.00, 3, 'Used for WO-2026-0001 (Thermal Interface Compound Tube)')
ON CONFLICT (id) DO NOTHING;

SELECT setval('public.inventory_transactions_id_seq', (SELECT MAX(id) FROM public.inventory_transactions));

-- Update inventory quantity_on_hand
UPDATE public.parts_inventory SET quantity_on_hand = 5 WHERE part_code = 'PRT-FAN-INV';
UPDATE public.parts_inventory SET quantity_on_hand = 13 WHERE part_code = 'PRT-PASTE-TH';

-- 9. Work Order Status History
INSERT INTO public.work_order_status_history (id, work_order_id, from_status, to_status, changed_by_id, notes)
VALUES
  (1, 1, NULL, 'open', 1, 'Work order created automatically from SCADA inverter alarm'),
  (2, 1, 'open', 'assigned', 1, 'Assigned to Maria Santos'),
  (3, 1, 'assigned', 'in_progress', 3, 'Technician mobilized to Inverter Station 1'),
  (4, 1, 'in_progress', 'completed_pending_review', 3, 'Report submitted following successful 2.5MW load test'),
  (5, 1, 'completed_pending_review', 'approved', 1, 'Admin approved maintenance report and closed work order'),
  (6, 2, NULL, 'open', 1, 'Work order created for blown combiner box fuse'),
  (7, 2, 'open', 'assigned', 1, 'Assigned to Juan Dela Cruz'),
  (8, 2, 'assigned', 'in_progress', 2, 'Technician mobilized to field with replacement 20A gPV fuses'),
  (9, 3, NULL, 'assigned', 1, 'Auto-generated from Q4 recurring schedule'),
  (10, 3, 'assigned', 'in_progress', 4, 'PV string team initiated drone thermal survey'),
  (11, 3, 'in_progress', 'completed_pending_review', 4, 'Report submitted; awaiting administrative sign-off'),
  (12, 4, NULL, 'open', 1, 'Work order created; open for technician acceptance')
ON CONFLICT (id) DO NOTHING;

SELECT setval('public.work_order_status_history_id_seq', (SELECT MAX(id) FROM public.work_order_status_history));

-- 10. Approvals History
INSERT INTO public.approvals (id, work_order_id, report_id, reviewer_id, action, review_comments)
VALUES
  (1, 1, 1, 1, 'approved', 'Thorough repair and thermal verification documented. Equipment restored to nominal operating state.')
ON CONFLICT (id) DO NOTHING;

SELECT setval('public.approvals_id_seq', (SELECT MAX(id) FROM public.approvals));

-- 11. System Notifications
INSERT INTO public.notifications (id, user_id, title, message, type, work_order_id, equipment_id, is_read)
VALUES
  (1, 1, 'Report Submitted for Review: WO-2026-0003', 'Rodrigo Tan submitted completion report for 550 kWp PV Array Q4 inspection. Review and approval required.', 'review', 3, 5, 0),
  (2, 1, 'New Open Plant Repair Request: WO-2026-0004', 'Single-axis tracker motor TR-08 mechanical binding logged for Block C Array. Field technicians can mobilize.', 'assignment', 4, 6, 0),
  (3, 2, 'New Assignment: WO-2026-0002', 'You are assigned to Combiner Box CB-A14 fuse diagnostic in Block A Array.', 'assignment', 2, 4, 1),
  (4, 3, 'Report Approved: WO-2026-0001', 'Your maintenance report for Central Inverter 01 was approved by Plant Administration.', 'approval', 1, 1, 1)
ON CONFLICT (id) DO NOTHING;

SELECT setval('public.notifications_id_seq', (SELECT MAX(id) FROM public.notifications));

-- 12. Audit Logs
INSERT INTO public.audit_logs (id, user_id, user_email, user_role, action, entity_type, entity_id, details_json, ip_address)
VALUES
  (1, 1, 'admin@kirahon-solar.ph', 'admin', 'SYSTEM_DATABASE_SETUP', 'system', 'database', '{"engine":"Supabase PostgreSQL","project":"muimcnkuovmhdqnakozr","status":"healthy"}', '127.0.0.1'),
  (2, 1, 'admin@kirahon-solar.ph', 'admin', 'REVIEW_MAINTENANCE_APPROVED', 'work_orders', '1', '{"action":"approved","reviewer":"System Administrator"}', '127.0.0.1'),
  (3, 3, 'maria.santos@kirahon-solar.ph', 'technician', 'SUBMIT_MAINTENANCE_REPORT', 'work_orders', '1', '{"labor_hours":4.25,"parts_cost":425.00,"result":"Restored to 100% output"}', '127.0.0.1'),
  (4, 2, 'juan.delacruz@kirahon-solar.ph', 'technician', 'ACCEPT_REPAIR_JOB', 'work_orders', '2', '{"work_order_code":"WO-2026-0002","plant_section":"Block A Array"}', '127.0.0.1')
ON CONFLICT (id) DO NOTHING;

SELECT setval('public.audit_logs_id_seq', (SELECT MAX(id) FROM public.audit_logs));

-- 13. Update Equipment Status & Maintenance Dates
UPDATE public.equipment
SET operational_status = 'operational',
    last_maintenance_date = '2026-11-02',
    next_pm_date = '2026-11-20',
    failure_count = 1
WHERE asset_id = 'EQ-INV-001';

UPDATE public.equipment
SET operational_status = 'under_maintenance',
    failure_count = 1
WHERE asset_id = 'EQ-CMB-014';

UPDATE public.equipment
SET operational_status = 'operational',
    last_maintenance_date = '2026-11-05',
    next_pm_date = '2026-12-01'
WHERE asset_id = 'EQ-ARR-B03';

UPDATE public.equipment
SET operational_status = 'faulty',
    failure_count = 1
WHERE asset_id = 'EQ-TRK-008';
