package com.kabj.sistema_ot.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * Alerta operativa derivada del estado de una OT.
 * <p>
 * Tipos generados por {@link com.kabj.sistema_ot.service.AlertaService}:
 * SIN_ASIGNAR, OBSERVADA, RETRASADA. Tabla {@code op_alerta}.
 * </p>
 */
@Data
@Entity
@Table(name = "op_alerta")
public class OpAlerta {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_alerta")
    private Long idAlerta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_ot")
    private OpOrdenTrabajo orden;

    @Column(nullable = false, length = 50)
    private String tipo;

    @Column(nullable = false, length = 200)
    private String titulo;

    @Column(columnDefinition = "TEXT")
    private String detalle;

    @Column(length = 20)
    private String prioridad = "media";

    @Column(nullable = false)
    private Boolean resuelta = false;

    @Column(name = "resuelta_at")
    private LocalDateTime resueltaAt;

    @Column(name = "observacion_al_resolver", columnDefinition = "TEXT")
    private String observacionAlResolver;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
