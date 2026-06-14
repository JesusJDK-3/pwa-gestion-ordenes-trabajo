package com.kabj.sistema_ot.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Entidad central del dominio operativo: una Orden de Trabajo (OT) de campo.
 * <p>
 * Tabla {@code op_orden_trabajo}. Representa un punto de trabajo asignado a un capataz,
 * con estado ({@link CatEstadoOt}), ubicación GIS y trazabilidad de importación Excel.
 * </p>
 * <h3>Campos operativos clave</h3>
 * <ul>
 *   <li>{@code sgio} — identificador único de negocio (SEDAPAL)</li>
 *   <li>{@code estadoOt} — PENDIENTE → EN_PROGRESO → COMPLETADA / ANULADA</li>
 *   <li>{@code capataz} — responsable de campo (nullable hasta asignación supervisor)</li>
 *   <li>{@code visibleEnMapa} — false cuando la OT llega a estado final</li>
 *   <li>{@code latitud}/{@code longitud} — posición en mapa Leaflet</li>
 * </ul>
 * <p>
 * Creada por {@link com.kabj.sistema_ot.service.ExcelCargaService} en estado PENDIENTE.
 * Actualizada por {@link com.kabj.sistema_ot.controller.RegistroController} en campo.
 * </p>
 */
@Data
@Entity
@Table(name = "op_orden_trabajo")
public class OpOrdenTrabajo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_ot")
    private Long idOt;

    @Column(nullable = false, unique = true, length = 50)
    private String sgio;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_lote")
    private ImpOtLote lote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_fila_importacion", unique = true)
    private ImpOtFila filaImportacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_subactividad", nullable = false)
    private CatSubactividad subactividad;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_tipo_punto", nullable = false)
    private CatTipoPuntoOperativo tipoPunto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_punto_operativo")
    private GisPuntoOperativo puntoOperativo;

    @Column(length = 30)
    private String nis;

    @Column(length = 50)
    private String hia;

    @Column(length = 50)
    private String vca;

    @Column(length = 50)
    private String suministro;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_capataz", nullable = true)
    private RrhhCapataz capataz;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_cuadrilla")
    private OpCuadrilla cuadrilla;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_asistente")
    private RrhhTrabajador asistente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_jornada")
    private OpJornadaCampo jornada;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_estado_ot", nullable = false)
    private CatEstadoOt estadoOt;

    @Column(name = "fecha_programada")
    private LocalDate fechaProgramada;

    @Column(name = "fecha_inicio")
    private LocalDateTime fechaInicio;

    @Column(name = "fecha_fin")
    private LocalDateTime fechaFin;

    @Column(name = "fecha_cierre")
    private LocalDate fechaCierre;

    private String direccion;

    @Column(length = 100)
    private String localidad;

    @Column(length = 100)
    private String distrito;

    @Column(length = 100)
    private String sector;

    @Column(precision = 10, scale = 8)
    private BigDecimal latitud;

    @Column(precision = 11, scale = 8)
    private BigDecimal longitud;

    @Column(name = "visible_en_mapa", nullable = false)
    private Boolean visibleEnMapa = true;

    @Column(name = "estado_sincronizacion", nullable = false, length = 20)
    private String estadoSincronizacion = "PENDIENTE";

    @Column(name = "estado_validacion_fotos", nullable = false, length = 20)
    private String estadoValidacionFotos = "PENDIENTE";

    private String observacion;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "cerrada_at")
    private LocalDateTime cerradaAt;

    @Column(nullable = false)
    private Boolean activo = true;
}
