package com.kabj.sistema_ot.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "cat_formulario")
public class CatFormulario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_formulario")
    private Long idFormulario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_subactividad", nullable = false)
    private CatSubactividad subactividad;

    @Column(nullable = false, unique = true, length = 30)
    private String codigo;

    @Column(nullable = false, length = 150)
    private String nombre;

    private String descripcion;

    @Column(nullable = false)
    private Integer version = 1;

    @Column(nullable = false)
    private Boolean activo = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
