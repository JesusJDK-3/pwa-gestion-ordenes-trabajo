package com.kabj.sistema_ot.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "op_jornada_campo")
public class OpJornadaCampo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_jornada")
    private Long idJornada;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_capataz", nullable = false)
    private RrhhCapataz capataz;

    @Column(name = "fecha_jornada", nullable = false)
    private LocalDate fechaJornada;

    @Column(nullable = false, length = 20)
    private String estado = "ABIERTA";

    @Column(name = "hora_inicio")
    private LocalDateTime horaInicio;

    @Column(name = "hora_fin")
    private LocalDateTime horaFin;

    @Column(nullable = false)
    private Boolean confirmada = false;

    private String observacion;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
}
