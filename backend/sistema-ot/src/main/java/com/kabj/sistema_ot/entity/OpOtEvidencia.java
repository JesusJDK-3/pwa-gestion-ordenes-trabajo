package com.kabj.sistema_ot.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "op_ot_evidencia")
public class OpOtEvidencia {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_evidencia")
    private Long idEvidencia;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_ot", nullable = false)
    private OpOrdenTrabajo ordenTrabajo;

    @Column(name = "tipo_foto", nullable = false, length = 50)
    private String tipoFoto;

    @Column(name = "url_archivo", nullable = false)
    private String urlArchivo;

    @Column(name = "nombre_archivo", length = 255)
    private String nombreArchivo;

    @Column(name = "tamano_bytes")
    private Integer tamanoBytes;

    @Column(name = "latitud_foto", precision = 10, scale = 8)
    private BigDecimal latitudFoto;

    @Column(name = "longitud_foto", precision = 11, scale = 8)
    private BigDecimal longitudFoto;

    @Column(name = "tomada_offline", nullable = false)
    private Boolean tomadaOffline = false;

    @Column(nullable = false)
    private Boolean sincronizada = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario")
    private Usuario usuario;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
