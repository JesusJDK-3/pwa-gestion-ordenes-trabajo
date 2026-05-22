package com.kabj.sistema_ot.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "op_cuadrilla_miembro_plantilla",
       uniqueConstraints = @UniqueConstraint(columnNames = {"id_cuadrilla", "id_trabajador"}))
public class OpCuadrillaMiembroPlantilla {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_miembro_plantilla")
    private Long idMiembroPlantilla;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_cuadrilla", nullable = false)
    private OpCuadrilla cuadrilla;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_trabajador", nullable = false)
    private RrhhTrabajador trabajador;

    @Column(name = "cargo_en_cuadrilla", length = 100)
    private String cargoEnCuadrilla;

    @Column(nullable = false)
    private Boolean activo = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
