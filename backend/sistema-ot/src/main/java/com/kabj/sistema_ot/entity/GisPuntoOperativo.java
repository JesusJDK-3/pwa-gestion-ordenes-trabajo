package com.kabj.sistema_ot.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "gis_punto_operativo")
public class GisPuntoOperativo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_punto_operativo")
    private Long idPuntoOperativo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_tipo_punto", nullable = false)
    private CatTipoPuntoOperativo tipoPunto;

    @Column(name = "codigo_punto", length = 30)
    private String codigoPunto;

    @Column(length = 30)
    private String nis;

    private String direccion;

    @Column(length = 100)
    private String localidad;

    @Column(length = 100)
    private String distrito;

    @Column(length = 100)
    private String sector;

    @Column(nullable = false, precision = 10, scale = 8)
    private BigDecimal latitud;

    @Column(nullable = false, precision = 11, scale = 8)
    private BigDecimal longitud;

    @Column(name = "origen_registro", length = 30)
    private String origenRegistro = "EXCEL_GIS";

    @Column(name = "estado_validacion_gis", length = 20)
    private String estadoValidacionGis = "VALIDADO";

    private String observacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_gis_lote")
    private ImpGisLote gisLote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creado_por")
    private Usuario creadoPor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "validado_por")
    private Usuario validadoPor;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "validated_at")
    private LocalDateTime validatedAt;

    @Column(nullable = false)
    private Boolean activo = true;
}
