package com.kabj.sistema_ot.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "alertas")
public class Alerta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "punto_id")
    private PuntoTrabajo punto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supervisor_id")
    private Usuario supervisor;

    @Column(columnDefinition = "TEXT")
    private String mensaje;

    @Column(nullable = false)
    private boolean leida = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
