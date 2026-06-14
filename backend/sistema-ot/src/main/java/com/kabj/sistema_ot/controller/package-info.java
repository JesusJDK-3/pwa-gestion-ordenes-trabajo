/**
 * Capa REST del sistema KABJ GIS.
 * <p>
 * Cada controller expone endpoints bajo {@code /api/*} y delega la lógica a {@code service}.
 * La autorización por rol se aplica con {@code @PreAuthorize}; el frontend no sustituye esta capa.
 * </p>
 * <h2>Controllers principales</h2>
 * <ul>
 *   <li>{@link com.kabj.sistema_ot.controller.AuthController} — login JWT</li>
 *   <li>{@link com.kabj.sistema_ot.controller.OrdenTrabajoController} — OT, Excel, asignación, mapa</li>
 *   <li>{@link com.kabj.sistema_ot.controller.RegistroController} — actividad de campo del capataz</li>
 *   <li>{@link com.kabj.sistema_ot.controller.AlertaController} — alertas operativas</li>
 *   <li>{@link com.kabj.sistema_ot.controller.SyncController} — sincronización offline</li>
 * </ul>
 *
 * @see com.kabj.sistema_ot.service
 */
package com.kabj.sistema_ot.controller;
