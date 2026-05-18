package com.kabj.sistema_ot.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "imp_ot_fila")
public class ImpOtFila {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_fila")
    private Long idFila;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_lote", nullable = false)
    private ImpOtLote lote;

    @Column(name = "numero_fila_excel", nullable = false)
    private Integer numeroFilaExcel;

    @Column(nullable = false, unique = true, length = 50)
    private String sgio;

    @Column(length = 30)
    private String nis;

    @Column(name = "hia_codigo", length = 50)
    private String hiaCodigo;

    @Column(name = "vca_codigo", length = 50)
    private String vcaCodigo;

    @Column(name = "direccion_excel")
    private String direccionExcel;

    @Column(name = "localidad_excel", length = 100)
    private String localidadExcel;

    @Column(name = "distrito_excel", length = 100)
    private String distritoExcel;

    @Column(name = "sector_excel", length = 100)
    private String sectorExcel;

    @Column(name = "fecha_programada")
    private LocalDate fechaProgramada;

    @Column(name = "estado_validacion", nullable = false, length = 20)
    private String estadoValidacion = "PENDIENTE";

    @Column(name = "mensaje_validacion")
    private String mensajeValidacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_punto_operativo_resuelto")
    private GisPuntoOperativo puntoOperativoResuelto;

    @Column(name = "requiere_revision", nullable = false)
    private Boolean requiereRevision = false;

    @Column(name = "requiere_coordenada_manual", nullable = false)
    private Boolean requiereCoordenadaManual = false;

    @Column(name = "latitud_manual", precision = 10, scale = 8)
    private BigDecimal latitudManual;

    @Column(name = "longitud_manual", precision = 11, scale = 8)
    private BigDecimal longitudManual;

    @Column(name = "direccion_manual")
    private String direccionManual;

    @Column(name = "referencia_manual")
    private String referenciaManual;

    @Column(name = "observacion_manual")
    private String observacionManual;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
}
