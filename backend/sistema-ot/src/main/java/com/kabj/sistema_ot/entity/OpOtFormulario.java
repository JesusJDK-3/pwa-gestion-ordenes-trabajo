package com.kabj.sistema_ot.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "op_ot_formulario")
public class OpOtFormulario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_ot_formulario")
    private Long idOtFormulario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_ot", nullable = false)
    private OpOrdenTrabajo ordenTrabajo;

    @Column(name = "id_formulario", nullable = false)
    private Long idFormulario;

    @Column(name = "version_formulario", nullable = false)
    private Integer versionFormulario = 1;

    @Column(name = "estado_formulario", nullable = false, length = 20)
    private String estadoFormulario = "EN_PROGRESO";

    @Column(name = "fecha_inicio")
    private LocalDateTime fechaInicio;

    @Column(name = "fecha_fin")
    private LocalDateTime fechaFin;

    @Column(nullable = false)
    private Boolean completado = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario_registro")
    private Usuario usuarioRegistro;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();
}
