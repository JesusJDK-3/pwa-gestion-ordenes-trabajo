-- ===================================================
-- DATOS DE PRUEBA - Sistema OT
-- ===================================================

-- Lote de importacion
INSERT INTO imp_ot_lote (nombre_archivo, id_supervisor_usuario, estado_lote, total_filas, filas_correctas, filas_advertencia, filas_error, filas_duplicadas, filas_coord_manual, created_at, updated_at)
VALUES ('prueba_mayo2026.xlsx', 1, 'COMPLETADO', 30, 30, 0, 0, 0, 0, NOW(), NOW());

-- ===================================================
-- ORDENES DE TRABAJO
-- Capataz 1 (id=1 CAP-001): Juan Quispe
-- Capataz 2 (id=2 CAP-002): Pedro Flores
-- Estados: 1=PENDIENTE 2=EN_PROGRESO 3=OBSERVADA 4=COMPLETADA 5=ANULADA
-- Subactividades: 1=INST_MED 2=CAMB_MED 3=INSP_RED 4=MANT_VALV 5=REPAR_CAM 6=REPAR_TUB 7=LIMPIEZA 8=INSP_HID 9=OBRA_CIVIL 10=OTRO
-- Tipos: 1=VCA 2=HIA 3=CIVIL
-- ===================================================

INSERT INTO op_orden_trabajo
  (sgio, id_lote, id_subactividad, id_tipo_punto, id_capataz, id_estado_ot,
   fecha_programada, direccion, distrito, sector, nis, latitud, longitud,
   visible_en_mapa, estado_sincronizacion, estado_validacion_fotos,
   activo, created_at, updated_at)
VALUES

-- === CAPATAZ 1 (Juan Quispe) ===
-- Completadas
('OT-2026-001', 1, 1, 1, 1, 4, '2026-05-10', 'Av. Tupac Amaru 1234', 'Independencia', 'Zona A', '1001234', -11.9980, -77.0282, true, 'SINCRONIZADO', 'VALIDADO', true, NOW(), NOW()),
('OT-2026-002', 1, 2, 2, 1, 4, '2026-05-11', 'Jr. Los Pinos 456', 'Los Olivos',   'Zona B', '1001235', -11.9921, -77.0621, true, 'SINCRONIZADO', 'VALIDADO', true, NOW(), NOW()),
('OT-2026-003', 1, 3, 1, 1, 4, '2026-05-12', 'Calle Real 789',     'San Martin de Porres', 'Zona C', '1001236', -12.0120, -77.0750, true, 'SINCRONIZADO', 'VALIDADO', true, NOW(), NOW()),
('OT-2026-004', 1, 7, 3, 1, 4, '2026-05-12', 'Av. Universitaria 321', 'Comas',   'Norte',  '1001237', -11.9540, -77.0580, true, 'SINCRONIZADO', 'VALIDADO', true, NOW(), NOW()),
('OT-2026-005', 1, 8, 2, 1, 4, '2026-05-13', 'Jr. Canta 100',         'Carabayllo','Norte', '1001238', -11.8921, -77.0345, true, 'SINCRONIZADO', 'VALIDADO', true, NOW(), NOW()),

-- En progreso
('OT-2026-006', 1, 4, 1, 1, 2, '2026-05-17', 'Av. Naranjal 550',      'Los Olivos',  'Zona B', '1001239', -11.9880, -77.0560, true, 'PENDIENTE',   'PENDIENTE', true, NOW(), NOW()),
('OT-2026-007', 1, 5, 1, 1, 2, '2026-05-17', 'Jr. Saenz Pena 210',    'Rimac',       'Centro', '1001240', -12.0280, -77.0340, true, 'PENDIENTE',   'PENDIENTE', true, NOW(), NOW()),
('OT-2026-008', 1, 1, 2, 1, 2, '2026-05-17', 'Calle Pastaza 88',      'Pueblo Libre','Zona D', '1001241', -12.0780, -77.0620, true, 'PENDIENTE',   'PENDIENTE', true, NOW(), NOW()),

-- Observadas
('OT-2026-009', 1, 6, 1, 1, 3, '2026-05-15', 'Av. La Marina 2200',    'San Miguel',  'Costa',  '1001242', -12.0890, -77.0950, true, 'PENDIENTE',   'PENDIENTE', true, NOW(), NOW()),
('OT-2026-010', 1, 2, 3, 1, 3, '2026-05-14', 'Jr. Las Gardenias 44',  'SJL',         'Este',   '1001243', -12.0060, -76.9840, true, 'PENDIENTE',   'PENDIENTE', true, NOW(), NOW()),

-- Pendientes
('OT-2026-011', 1, 3, 1, 1, 1, '2026-05-18', 'Av. Proceres 1500',     'SJL',         'Este',   '1001244', -11.9950, -76.9700, true, 'PENDIENTE',   'PENDIENTE', true, NOW(), NOW()),
('OT-2026-012', 1, 1, 2, 1, 1, '2026-05-18', 'Pasaje Flores 23',      'Ate',         'Este',   '1001245', -12.0230, -76.9200, true, 'PENDIENTE',   'PENDIENTE', true, NOW(), NOW()),
('OT-2026-013', 1, 9, 3, 1, 1, '2026-05-19', 'Av. Huaylas 430',       'Chorrillos',  'Sur',    '1001246', -12.1780, -77.0190, true, 'PENDIENTE',   'PENDIENTE', true, NOW(), NOW()),
('OT-2026-014', 1, 4, 1, 1, 1, '2026-05-19', 'Jr. Iquitos 900',       'Lince',       'Centro', '1001247', -12.0820, -77.0370, true, 'PENDIENTE',   'PENDIENTE', true, NOW(), NOW()),
('OT-2026-015', 1, 8, 2, 1, 1, '2026-05-20', 'Av. Benavides 3400',    'Miraflores',  'Costa',  '1001248', -12.1290, -77.0090, true, 'PENDIENTE',   'PENDIENTE', true, NOW(), NOW()),

-- === CAPATAZ 2 (Pedro Flores) ===
-- Completadas
('OT-2026-016', 1, 2, 1, 2, 4, '2026-05-10', 'Av. Grau 800',          'La Victoria', 'Centro', '2001001', -12.0620, -77.0190, true, 'SINCRONIZADO', 'VALIDADO', true, NOW(), NOW()),
('OT-2026-017', 1, 7, 3, 2, 4, '2026-05-11', 'Jr. Junin 1100',        'Lima Cercado','Centro', '2001002', -12.0500, -77.0290, true, 'SINCRONIZADO', 'VALIDADO', true, NOW(), NOW()),
('OT-2026-018', 1, 3, 2, 2, 4, '2026-05-12', 'Av. Arequipa 4500',     'Miraflores',  'Costa',  '2001003', -12.1110, -77.0320, true, 'SINCRONIZADO', 'VALIDADO', true, NOW(), NOW()),
('OT-2026-019', 1, 5, 1, 2, 4, '2026-05-13', 'Calle Las Flores 230',  'Surco',       'Sur',    '2001004', -12.1450, -76.9980, true, 'SINCRONIZADO', 'VALIDADO', true, NOW(), NOW()),

-- En progreso
('OT-2026-020', 1, 1, 1, 2, 2, '2026-05-17', 'Jr. Chancay 340',       'Breña',       'Centro', '2001005', -12.0590, -77.0510, true, 'PENDIENTE',   'PENDIENTE', true, NOW(), NOW()),
('OT-2026-021', 1, 6, 2, 2, 2, '2026-05-17', 'Av. Colonial 1800',     'Cercado',     'Centro', '2001006', -12.0440, -77.0780, true, 'PENDIENTE',   'PENDIENTE', true, NOW(), NOW()),
('OT-2026-022', 1, 4, 1, 2, 2, '2026-05-17', 'Av. Brasil 2500',       'Magdalena',   'Costa',  '2001007', -12.0890, -77.0720, true, 'PENDIENTE',   'PENDIENTE', true, NOW(), NOW()),

-- Observadas
('OT-2026-023', 1, 9, 3, 2, 3, '2026-05-14', 'Jr. Huancavelica 200',  'Lima Cercado','Centro', '2001008', -12.0510, -77.0270, true, 'PENDIENTE',   'PENDIENTE', true, NOW(), NOW()),

-- Pendientes
('OT-2026-024', 1, 2, 1, 2, 1, '2026-05-18', 'Av. Argentina 1200',    'Callao',      'Callao', '2001009', -12.0570, -77.1220, true, 'PENDIENTE',   'PENDIENTE', true, NOW(), NOW()),
('OT-2026-025', 1, 3, 2, 2, 1, '2026-05-18', 'Jr. Colina 560',        'Callao',      'Callao', '2001010', -12.0480, -77.1300, true, 'PENDIENTE',   'PENDIENTE', true, NOW(), NOW()),
('OT-2026-026', 1, 1, 1, 2, 1, '2026-05-19', 'Av. Faucett 900',       'Callao',      'Callao', '2001011', -12.0230, -77.1140, true, 'PENDIENTE',   'PENDIENTE', true, NOW(), NOW()),
('OT-2026-027', 1, 8, 2, 2, 1, '2026-05-19', 'Av. Canta Callao 340',  'SMP',         'Norte',  '2001012', -11.9890, -77.0890, true, 'PENDIENTE',   'PENDIENTE', true, NOW(), NOW()),
('OT-2026-028', 1, 5, 1, 2, 1, '2026-05-20', 'Jr. Ascope 120',        'Breña',       'Centro', '2001013', -12.0620, -77.0480, true, 'PENDIENTE',   'PENDIENTE', true, NOW(), NOW()),
('OT-2026-029', 1, 7, 3, 2, 1, '2026-05-20', 'Av. Tupac Amaru 3200',  'Comas',       'Norte',  '2001014', -11.9320, -77.0430, true, 'PENDIENTE',   'PENDIENTE', true, NOW(), NOW()),

-- Anulada
('OT-2026-030', 1, 10, 3, 2, 5, '2026-05-08', 'Av. Angamos 1100',     'Miraflores',  'Costa',  '2001015', -12.1190, -77.0110, true, 'PENDIENTE',   'PENDIENTE', true, NOW(), NOW());

-- Verificar
SELECT
  (SELECT COUNT(*) FROM op_orden_trabajo) AS total_ots,
  (SELECT COUNT(*) FROM op_orden_trabajo WHERE id_estado_ot = 4) AS completadas,
  (SELECT COUNT(*) FROM op_orden_trabajo WHERE id_estado_ot = 2) AS en_progreso,
  (SELECT COUNT(*) FROM op_orden_trabajo WHERE id_estado_ot = 3) AS observadas,
  (SELECT COUNT(*) FROM op_orden_trabajo WHERE id_estado_ot = 1) AS pendientes,
  (SELECT COUNT(*) FROM op_orden_trabajo WHERE id_estado_ot = 5) AS anuladas;
