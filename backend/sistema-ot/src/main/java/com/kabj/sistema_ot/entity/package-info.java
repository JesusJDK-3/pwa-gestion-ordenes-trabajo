/**
 * Modelo de persistencia JPA (PostgreSQL).
 * <p>
 * Las entidades reflejan tablas del esquema {@code sistema_ot}. Prefijos habituales:
 * </p>
 * <ul>
 *   <li>{@code op_*} — operación (OT, alertas, eventos, evidencias)</li>
 *   <li>{@code imp_*} — importaciones Excel</li>
 *   <li>{@code gis_*} — base geográfica (VPA, hidrantes)</li>
 *   <li>{@code rrhh_*} — personal de campo</li>
 *   <li>{@code cat_*} — catálogos (estados, subactividades, formularios)</li>
 * </ul>
 * <p>
 * Entidad central: {@link com.kabj.sistema_ot.entity.OpOrdenTrabajo}.
 * </p>
 */
package com.kabj.sistema_ot.entity;
