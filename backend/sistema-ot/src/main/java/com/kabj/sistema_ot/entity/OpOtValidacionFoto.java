package com.kabj.sistema_ot.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "op_ot_validacion_foto")
public class OpOtValidacionFoto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_validacion_foto")
    private Long idValidacionFoto;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_ot", nullable = false, unique = true)
    private OpOrdenTrabajo orden;

    @Column(name = "estado_validacion", nullable = false, length = 20)
    private String estadoValidacion = "PENDIENTE";

    @Column(nullable = false)
    private Boolean bloqueada = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
}
