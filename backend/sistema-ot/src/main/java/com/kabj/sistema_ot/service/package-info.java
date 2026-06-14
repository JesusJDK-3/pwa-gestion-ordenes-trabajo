/**
 * Lógica de negocio del sistema KABJ GIS.
 * <p>
 * Los services encapsulan reglas transaccionales, validaciones y orquestación entre repositorios.
 * Los controllers no deben contener reglas de dominio; pertenecen aquí.
 * </p>
 * <h2>Services críticos</h2>
 * <ul>
 *   <li>{@link com.kabj.sistema_ot.service.OrdenTrabajoService} — consultas y cambios de OT</li>
 *   <li>{@link com.kabj.sistema_ot.service.ExcelCargaService} — importación masiva desde Excel</li>
 *   <li>{@link com.kabj.sistema_ot.service.AlertaService} — alertas derivadas del estado operativo</li>
 *   <li>{@link com.kabj.sistema_ot.service.SyncService} — replay de operaciones móviles</li>
 *   <li>{@link com.kabj.sistema_ot.service.AuthService} — autenticación y emisión JWT</li>
 * </ul>
 *
 * @see com.kabj.sistema_ot.entity
 */
package com.kabj.sistema_ot.service;
