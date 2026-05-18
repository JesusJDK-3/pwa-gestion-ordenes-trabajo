package com.kabj.sistema_ot.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "imp_ot_lote")
public class ImpOtLote {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_lote")
    private Long idLote;

    @Column(name = "nombre_archivo", nullable = false, length = 255)
    private String nombreArchivo;

    @Column(name = "archivo_url")
    private String archivoUrl;

    @Column(name = "fecha_carga")
    private LocalDateTime fechaCarga = LocalDateTime.now();

    @Column(length = 20)
    private String periodo;

    @Column(name = "fecha_programada")
    private LocalDate fechaProgramada;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_supervisor_usuario", nullable = false)
    private Usuario supervisor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_subactividad")
    private CatSubactividad subactividad;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_tipo_punto")
    private CatTipoPuntoOperativo tipoPunto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_capataz")
    private RrhhCapataz capataz;

    @Column(name = "estado_lote", nullable = false, length = 20)
    private String estadoLote = "PROCESANDO";

    @Column(name = "total_filas", nullable = false)
    private Integer totalFilas = 0;

    @Column(name = "filas_correctas", nullable = false)
    private Integer filasCorrectas = 0;

    @Column(name = "filas_advertencia", nullable = false)
    private Integer filasAdvertencia = 0;

    @Column(name = "filas_error", nullable = false)
    private Integer filasError = 0;

    @Column(name = "filas_duplicadas", nullable = false)
    private Integer filasDuplicadas = 0;

    @Column(name = "filas_coord_manual", nullable = false)
    private Integer filasCoordManual = 0;

    private String observacion;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
}
