package com.kabj.sistema_ot.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

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
    @JoinColumn(name = "id_capataz", nullable = false)
    private RrhhCapataz capataz;

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
